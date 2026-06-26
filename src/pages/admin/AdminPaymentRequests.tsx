import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, X as XIcon, Search, CheckSquare, Square, Zap, Trash2, Pencil, Plus, MessageCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'معلق',   cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  confirmed: { label: 'مؤكد',   cls: 'bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-400'  },
  rejected:  { label: 'مرفوض', cls: 'bg-red-100    text-red-500    dark:bg-red-900/30    dark:text-red-400'    },
};

const WALLET_LABELS: Record<string, string> = {
  jeeb: 'جيب', fawry: 'فلوسك', onecash: 'ون كاش',
};

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
const genPwd = () => `${seg()}-${seg()}-${seg()}`;

// ── تحديد مدة الاشتراك بناءً على نوع الباقة المختارة ──
function getSubscriptionDays(req: any): { days: number; label: string } {
  const name: string = (req.subject_name || req.fileName || '').toLowerCase();
  const isAnnual =
    name.includes('سنوي') ||
    name.includes('annual') ||
    name.includes('yearly') ||
    name.includes('سنة') ||
    name.includes('year');
  return isAnnual
    ? { days: 365, label: '365 يوم (سنة كاملة)' }
    : { days: 30,  label: '30 يوم' };
}

async function confirmSingle(req: any) {
  const newPwd = genPwd();
  const { days, label: durationLabel } = getSubscriptionDays(req);
  const { data: pwData, error: pwErr } = await (supabase as any)
    .from('review_passwords')
    .insert({ subject_id: req.subject_id, password: newPwd, label: req.student_name, duration_days: days, is_active: true })
    .select().single();
  if (pwErr) throw pwErr;
  await (supabase as any).from('payment_requests').update({
    status: 'confirmed', confirmed_at: new Date().toISOString(), review_password_id: pwData.id,
  }).eq('id', req.id);
  try {
    const all = JSON.parse(localStorage.getItem('review_pwd_contacts') || '{}');
    all[pwData.id] = `whatsapp:${req.phone_number}`;
    localStorage.setItem('review_pwd_contacts', JSON.stringify(all));
  } catch {}
  await supabase.functions.invoke('send-telegram', {
    body: { message: `✅ <b>تأكيد طلب اشتراك</b>\n\n👤 ${req.student_name}\n📱 ${req.phone_number}\n📚 ${req.subject_name}\n🔑 كلمة المرور: <b>${newPwd}</b>\n⏳ المدة: ${durationLabel}\n\nأرسل كلمة المرور للطالب على: ${req.phone_number}` },
  });
}

// ── تجميع الطلبات حسب رقم الهاتف ──
function groupByPhone(requests: any[]): { phone: string; student_name: string; wallet_type: string; items: any[]; latestDate: string }[] {
  const map = new Map<string, any>();
  for (const r of requests) {
    const key = r.phone_number || r.id;
    if (!map.has(key)) {
      map.set(key, {
        phone: r.phone_number,
        student_name: r.student_name,
        wallet_type: r.wallet_type,
        items: [],
        latestDate: r.created_at,
      });
    }
    const group = map.get(key);
    group.items.push(r);
    if (new Date(r.created_at) > new Date(group.latestDate)) group.latestDate = r.created_at;
  }
  return Array.from(map.values());
}

// حساب الحالة الإجمالية للمجموعة
function groupStatus(items: any[]): string {
  if (items.every(i => i.status === 'confirmed')) return 'confirmed';
  if (items.every(i => i.status === 'rejected')) return 'rejected';
  if (items.some(i => i.status === 'pending')) return 'pending';
  return 'mixed';
}

interface EditForm {
  id: string;
  student_name: string;
  phone_number: string;
  status: string;
  wallet_type: string;
  subject_ids: string[];
  level_id: string | null;
  duration_days: number;
  review_password_id: string | null;
}

export default function AdminPaymentRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [receiptModal, setReceiptModal]   = useState<{ url: string; name: string } | null>(null);
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]     = useState(false);
  const [editModal, setEditModal]         = useState<EditForm | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string[] | null>(null); // ids للحذف
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [contactTarget, setContactTarget] = useState<any | null>(null);

  const sendContact = async (req: any, channel: 'whatsapp' | 'telegram') => {
    let pwd = '—';
    if (req.review_password_id) {
      const { data } = await (supabase as any)
        .from('review_passwords')
        .select('password, duration_days')
        .eq('id', req.review_password_id)
        .single();
      if (data?.password) pwd = data.password;
    }

    // تحديد المدة الصحيحة: أولاً من قاعدة البيانات، ثم من اسم الباقة
    const { label: durationLabel } = getSubscriptionDays(req);

    const isLibrary = (req.subject_name || '').includes('المكتبة');
    const subjectUrl = isLibrary
      ? `https://www.alnaseer.org/library`
      : `https://www.alnaseer.org/exam/${req.subject_id}`;

    const msg = isLibrary
      ? `أهلاً وسهلاً بك 👋\n` +
        `تم تفعيل اشتراكك في منصة الناصر القانونية بنجاح ✅\n\n` +
        `📚 المادة: ${req.subject_name}\n` +
        `🔑 رمز التفعيل: \`${pwd}\`\n` +
        `⏳ المدة: ${durationLabel}\n\n` +
        `🔗 رابط الدخول المباشر:\n` +
        `${subjectUrl}\n\n` +
        `💡 طريقة البدء:\n` +
        `اضغط على الرابط أعلاه، ثم أدخل رمز التفعيل الخاص بك للوصول إلى المكتبة الكاملة فوراً.\n\n` +
        `مع تمنياتنا لك بالتوفيق والنجاح المستمر.. ✨`
      : `أهلاً وسهلاً بك 👋\n` +
        `تم تفعيل اشتراكك في منصة الناصر القانونية بنجاح ✅\n\n` +
        `📚 المادة: ${req.subject_name}\n` +
        `🔑 رمز التفعيل: \`${pwd}\`\n` +
        `⏳ المدة: ${durationLabel}\n\n` +
        `🔗 رابط الدخول المباشر:\n` +
        `${subjectUrl}\n\n` +
        `💡 طريقة البدء:\n` +
        `اضغط على الرابط أعلاه، ثم اختر "اختبار+ المراجعة" وأدخل رمز التفعيل الخاص بك للبدء فوراً.\n\n` +
        `مع تمنياتنا لك بالتوفيق والنجاح المستمر.. ✨`;

    const phone = (req.phone_number || '').replace(/\D/g, '');
    const intlPhone = phone.startsWith('0') ? '967' + phone.slice(1) : phone;

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://t.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    setContactTarget(null);
  };

  // ── جلب الطلبات ──
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['payment_requests_all'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('payment_requests')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });
      return (data || []).map((r: any) => ({
        ...r,
        subject_name: r.subject_name || r.subjects?.name || '—',
      }));
    },
  });

  // ── جلب المواد مع level_id ──
  const { data: allSubjects = [] } = useQuery({
    queryKey: ['subjects_list'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('subjects').select('id, name, level_id').order('name');
      return data || [];
    },
  });

  // ── تأكيد ──
  const confirmMut = useMutation({
    mutationFn: confirmSingle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
      toast({ title: 'تم التأكيد وتوليد كلمة المرور', description: 'تحقق من تيليجرام' });
    },
    onError: (e: any) => toast({ title: 'خطأ في التأكيد', description: e?.message, variant: 'destructive' }),
  });

  // ── رفض ──
  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('payment_requests').update({ status: 'rejected' }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] }),
  });

  // ── حذف ──
  const deleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      await (supabase as any).from('payment_requests').delete().in('id', ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
      setDeleteConfirm(null);
      setSelectedPhones(new Set());
      setBulkDeleteMode(false);
      toast({ title: 'تم الحذف بنجاح' });
    },
    onError: (e: any) => toast({ title: 'خطأ في الحذف', description: e?.message, variant: 'destructive' }),
  });

  // ── تعديل ──
  const editMut = useMutation({
    mutationFn: async (form: EditForm) => {
      const original = requests.find((r: any) => r.id === form.id);
      await (supabase as any).from('payment_requests').update({
        student_name: form.student_name,
        phone_number: form.phone_number,
        status: form.status,
        wallet_type: form.wallet_type,
        subject_id: form.subject_ids[0] || original?.subject_id,
        subject_name: allSubjects.find((s: any) => s.id === form.subject_ids[0])?.name || original?.subject_name,
      }).eq('id', form.id);
      // تحديث duration_days في review_passwords إن وُجد (للطلبات المؤكدة مسبقاً)
      if (form.review_password_id) {
        const { data: pwData } = await (supabase as any)
          .from('review_passwords')
          .select('first_used_at, expires_at, duration_days')
          .eq('id', form.review_password_id)
          .single();
        const updatePayload: any = { duration_days: form.duration_days };
        // إذا كان الطالب قد استخدم كلمة المرور، نعيد حساب تاريخ الانتهاء
        if (pwData?.first_used_at) {
          const newExpiry = new Date(pwData.first_used_at);
          newExpiry.setDate(newExpiry.getDate() + form.duration_days);
          updatePayload.expires_at = newExpiry.toISOString();
        }
        await (supabase as any)
          .from('review_passwords')
          .update(updatePayload)
          .eq('id', form.review_password_id);
      }
      if (form.subject_ids.length > 1) {
        const extras = form.subject_ids.slice(1).map((sid: string) => ({
          student_name: form.student_name,
          phone_number: form.phone_number,
          status: form.status,
          wallet_type: form.wallet_type,
          subject_id: sid,
          subject_name: allSubjects.find((s: any) => s.id === sid)?.name || '',
          receipt_image_url: original?.receipt_image_url || null,
        }));
        await (supabase as any).from('payment_requests').insert(extras);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
      setEditModal(null);
      toast({ title: 'تم التعديل بنجاح' });
    },
    onError: (e: any) => toast({ title: 'خطأ في التعديل', description: e?.message, variant: 'destructive' }),
  });

  // ── تأكيد دفعي ──
  const handleBulkConfirm = async () => {
    if (selectedPhones.size === 0) return;
    setBulkLoading(true);
    const toConfirm = requests.filter((r: any) => selectedPhones.has(r.phone_number) && r.status === 'pending');
    let success = 0, failed = 0;
    for (const req of toConfirm) {
      try { await confirmSingle(req); success++; } catch { failed++; }
    }
    queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
    setSelectedPhones(new Set());
    setBulkLoading(false);
    toast({ title: `تم تأكيد ${success} طلب${failed > 0 ? ` (فشل ${failed})` : ''}` });
  };

  // ── فلترة + تجميع ──
  const filtered = requests.filter((r: any) => {
    const matchSearch = !search.trim() ||
      r.student_name?.includes(search) || r.phone_number?.includes(search) || r.subject_name?.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const groups = groupByPhone(filtered);
  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const pendingGroups = groups.filter(g => g.items.some(i => i.status === 'pending'));
  const allPendingSelected = pendingGroups.length > 0 && pendingGroups.every(g => selectedPhones.has(g.phone));
  const allSelected = groups.length > 0 && groups.every(g => selectedPhones.has(g.phone));

  const toggleSelect = (phone: string) => {
    setSelectedPhones(prev => { const n = new Set(prev); n.has(phone) ? n.delete(phone) : n.add(phone); return n; });
  };

  const toggleSelectAll = () => {
    if (bulkDeleteMode) {
      if (allSelected) setSelectedPhones(new Set());
      else setSelectedPhones(new Set(groups.map(g => g.phone)));
    } else {
      if (allPendingSelected) setSelectedPhones(new Set());
      else setSelectedPhones(new Set(pendingGroups.map(g => g.phone)));
    }
  };

  const openEdit = async (req: any) => {
    let currentDays = getSubscriptionDays(req).days;
    if (req.review_password_id) {
      const { data: pwData } = await (supabase as any)
        .from('review_passwords')
        .select('duration_days')
        .eq('id', req.review_password_id)
        .single();
      if (pwData?.duration_days) currentDays = pwData.duration_days;
    }
    setEditModal({
      id: req.id,
      student_name: req.student_name || '',
      phone_number: req.phone_number || '',
      status: req.status || 'pending',
      wallet_type: req.wallet_type || '',
      subject_ids: req.subject_id ? [req.subject_id] : [],
      level_id: allSubjects.find((s: any) => s.id === req.subject_id)?.level_id || null,
      duration_days: currentDays,
      review_password_id: req.review_password_id || null,
    });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto" dir="rtl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
              💳 طلبات الاشتراك
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 animate-pulse">
                  {pendingCount} معلق
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{requests.length} طلب · {groups.length} طالب</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setBulkDeleteMode(m => !m); setSelectedPhones(new Set()); }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 ${
                bulkDeleteMode ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleteMode ? 'إلغاء' : 'حذف متعدد'}
            </button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] })}
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              🔄 تحديث
            </button>
          </div>
        </div>

        {/* ── شريط Bulk ── */}
        {selectedPhones.size > 0 && (
          <div className={`flex items-center justify-between p-3 rounded-2xl border-2 ${
            bulkDeleteMode ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
          }`}>
            <button onClick={() => setSelectedPhones(new Set())} className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors">
              إلغاء التحديد
            </button>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-black ${bulkDeleteMode ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {selectedPhones.size} طالب محدد
              </span>
              {bulkDeleteMode ? (
                <button
                  onClick={() => {
                    const ids = requests.filter((r: any) => selectedPhones.has(r.phone_number)).map((r: any) => r.id);
                    setDeleteConfirm(ids);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف المحددين
                </button>
              ) : (
                <button
                  onClick={handleBulkConfirm}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
                >
                  {bulkLoading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التأكيد...</>
                    : <><Zap className="w-3.5 h-3.5" /> تأكيد الكل دفعةً واحدة</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── فلاتر ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو المادة..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400 transition-colors"
              dir="rtl"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(bulkDeleteMode ? groups.length > 0 : pendingGroups.length > 0) && (
              <button
                onClick={toggleSelectAll}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  bulkDeleteMode
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                }`}
              >
                {(bulkDeleteMode ? allSelected : allPendingSelected)
                  ? <><CheckSquare className="w-3.5 h-3.5" /> إلغاء الكل</>
                  : <><Square className="w-3.5 h-3.5" /> {bulkDeleteMode ? 'تحديد الكل' : 'تحديد الكل المعلق'}</>}
              </button>
            )}
            {(['all', 'pending', 'confirmed', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  filterStatus === s ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s === 'all' ? 'الكل' : STATUS_LABELS[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* ── القائمة المجمّعة ── */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-semibold">جاري التحميل...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-semibold">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const isSelected = selectedPhones.has(group.phone);
              const status = groupStatus(group.items);
              const hasPending = group.items.some(i => i.status === 'pending');
              const firstReceipt = group.items.find(i => i.receipt_image_url);

              return (
                <div
                  key={group.phone}
                  className={`rounded-2xl border transition-all ${
                    isSelected
                      ? bulkDeleteMode
                        ? 'border-red-400 bg-red-50 dark:bg-red-950/30 ring-2 ring-red-300'
                        : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-300'
                      : status === 'pending'
                      ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/40'
                      : status === 'confirmed'
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40'
                      : status === 'rejected'
                      ? 'border-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 opacity-70'
                      : 'border-slate-200 bg-white dark:bg-slate-800/50 dark:border-slate-700'
                  }`}
                >
                  {/* ── رأس البطاقة: معلومات الطالب ── */}
                  <div className="p-4 pb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {(bulkDeleteMode || hasPending) && (
                        <button
                          onClick={() => toggleSelect(group.phone)}
                          className={`shrink-0 transition-colors ${bulkDeleteMode ? 'text-red-500' : 'text-emerald-500'}`}
                        >
                          {isSelected
                            ? <CheckSquare className="w-5 h-5" />
                            : <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                        </button>
                      )}
                      {group.wallet_type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {WALLET_LABELS[group.wallet_type] || group.wallet_type}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100">{group.student_name}</p>
                      <p className="text-xs text-slate-400 font-semibold" dir="ltr">{group.phone}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(group.latestDate).toLocaleString('ar')}</p>
                    </div>
                  </div>

                  {/* ── المواد: كل مادة صف مستقل ── */}
                  <div className="px-4 pb-2 space-y-2">
                    {group.items.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${STATUS_LABELS[req.status]?.cls}`}>
                            {STATUS_LABELS[req.status]?.label}
                          </span>
                          {req.status === 'pending' && (
                            <button
                              onClick={() => confirmMut.mutate(req)}
                              disabled={confirmMut.isPending || bulkLoading}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60"
                            >
                              ✓ تأكيد
                            </button>
                          )}
                          {req.status === 'pending' && (
                            <button
                              onClick={() => rejectMut.mutate(req.id)}
                              disabled={bulkLoading}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-400 hover:bg-slate-500 text-white transition-colors disabled:opacity-60"
                            >
                              ✕ رفض
                            </button>
                          )}
                          <button
                            onClick={() => setContactTarget(req)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1"
                          >
                            <MessageCircle className="w-2.5 h-2.5" /> مراسلة
                          </button>
                          <button
                            onClick={() => openEdit(req)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-400 hover:bg-amber-500 text-white transition-colors flex items-center gap-1"
                          >
                            <Pencil className="w-2.5 h-2.5" /> تعديل
                          </button>
                          <button
                            onClick={() => setDeleteConfirm([req.id])}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> حذف
                          </button>
                        </div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 text-right shrink-0">{req.subject_name}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── أزرار المجموعة ── */}
                  <div className="px-4 pb-4 pt-1 flex gap-2 flex-wrap justify-end">
                    {firstReceipt && (
                      <button
                        onClick={() => setReceiptModal({ url: firstReceipt.receipt_image_url, name: group.student_name })}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> إيصال
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const ids = group.items.map((i: any) => i.id);
                        setDeleteConfirm(ids);
                      }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> حذف الكل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal تأكيد الحذف ── */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <p className="font-black text-slate-800 dark:text-slate-100 mb-1">تأكيد الحذف</p>
            <p className="text-sm text-slate-400 mb-5">
              {deleteConfirm.length > 1 ? `سيتم حذف ${deleteConfirm.length} طلبات. لا يمكن التراجع.` : 'هل أنت متأكد من حذف هذا الطلب؟'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMut.mutate(deleteConfirm)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
              >
                {deleteMut.isPending ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal التعديل ── */}
      {editModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <p className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" /> تعديل الطلب
              </p>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <XIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-500 mb-1 block">اسم الطالب</label>
                <input
                  value={editModal.student_name}
                  onChange={e => setEditModal(m => m && ({ ...m, student_name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 mb-1 block">رقم الهاتف</label>
                <input
                  value={editModal.phone_number}
                  onChange={e => setEditModal(m => m && ({ ...m, phone_number: e.target.value }))}
                  dir="ltr"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 mb-1 block">الحالة</label>
                <div className="flex gap-2">
                  {(['pending', 'confirmed', 'rejected'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEditModal(m => m && ({ ...m, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-colors ${editModal.status === s ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {STATUS_LABELS[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 mb-1 block">طريقة الدفع</label>
                <div className="flex gap-2 flex-wrap">
                  {[{ k: 'jeeb', l: 'جيب' }, { k: 'fawry', l: 'فلوسك' }, { k: 'onecash', l: 'ون كاش' }].map(({ k, l }) => (
                    <button
                      key={k}
                      onClick={() => setEditModal(m => m && ({ ...m, wallet_type: m.wallet_type === k ? '' : k }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${editModal.wallet_type === k ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 mb-1 block">⏳ عدد أيام الاشتراك</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1}
                    value={editModal.duration_days}
                    onChange={e => setEditModal(m => m && ({ ...m, duration_days: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-28 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-black focus:outline-none focus:border-blue-400 text-center"
                    dir="ltr"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {[30, 90, 180, 365].map(d => (
                      <button
                        key={d}
                        onClick={() => setEditModal(m => m && ({ ...m, duration_days: d }))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors ${editModal.duration_days === d ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {d === 365 ? 'سنة' : d === 180 ? '6 أشهر' : d === 90 ? '3 أشهر' : '30 يوم'}
                      </button>
                    ))}
                  </div>
                </div>
                {editModal.review_password_id && (
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 font-semibold">
                    ✅ سيتم تحديث مدة اشتراك الطالب المؤكد فوراً
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 mb-2 block flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> المواد (يمكن اختيار أكثر من مادة)
                </label>
                <div className="space-y-1 max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  {allSubjects.filter((s: any) => !editModal.level_id || s.level_id === editModal.level_id).map((s: any) => {
                    const checked = editModal.subject_ids.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setEditModal(m => {
                          if (!m) return m;
                          const ids = m.subject_ids.includes(s.id)
                            ? m.subject_ids.filter(id => id !== s.id)
                            : [...m.subject_ids, s.id];
                          return { ...m, subject_ids: ids };
                        })}
                        className={`w-full text-right px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                          checked ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {checked ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0 text-slate-300" />}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {editModal.subject_ids.length > 1 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                    ⚠️ سيتم إنشاء {editModal.subject_ids.length - 1} طلب إضافي وتجميعها تلقائياً مع هذا الطالب
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => editMut.mutate(editModal)}
                disabled={editMut.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60"
              >
                {editMut.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal الإيصال ── */}
      {receiptModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setReceiptModal(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-black text-sm text-slate-800 dark:text-slate-100">📄 إيصال الإيداع</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{receiptModal.name}</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <XIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <img src={receiptModal.url} alt="إيصال الإيداع" className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 object-contain max-h-[60vh]" />
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <a href={receiptModal.url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 rounded-xl text-xs font-black text-center bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                فتح في تبويب جديد ↗
              </a>
              <button onClick={() => setReceiptModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ── Modal مراسلة ── */}
      {contactTarget && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setContactTarget(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-green-500" />
            </div>
            <p className="font-black text-slate-800 dark:text-slate-100 mb-0.5">مراسلة الطالب</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{contactTarget.student_name}</p>
            <p className="text-xs text-blue-500 font-bold mb-5">{contactTarget.subject_name}</p>
            <div className="flex gap-3">
              <button
                onClick={() => sendContact(contactTarget, 'whatsapp')}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#25D366] hover:bg-[#20bb5a] text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                واتساب
              </button>
              <button
                onClick={() => sendContact(contactTarget, 'telegram')}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-[#229ED9] hover:bg-[#1a8ec4] text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                تيليجرام
              </button>
            </div>
            <button
              onClick={() => setContactTarget(null)}
              className="mt-3 w-full py-2 rounded-xl text-sm font-black bg-slate-100 dark:bg-slate-800 text-slate-500 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}
