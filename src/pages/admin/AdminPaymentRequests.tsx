import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, X as XIcon, Search, CheckSquare, Square, Zap } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'معلق',   cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  confirmed: { label: 'مؤكد',   cls: 'bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-400'  },
  rejected:  { label: 'مرفوض', cls: 'bg-red-100    text-red-500    dark:bg-red-900/30    dark:text-red-400'    },
};

// ── دالة توليد كلمة المرور (محفوظة من الأصل) ──
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
const genPwd = () => `${seg()}-${seg()}-${seg()}`;

// ── دالة تأكيد طلب واحد (محفوظة من الأصل) ──
async function confirmSingle(req: any) {
  const newPwd = genPwd();

  const { data: pwData, error: pwErr } = await (supabase as any)
    .from('review_passwords')
    .insert({
      subject_id: req.subject_id,
      password: newPwd,
      label: req.student_name,
      duration_days: 30,
      is_active: true,
    })
    .select()
    .single();
  if (pwErr) throw pwErr;

  await (supabase as any).from('payment_requests').update({
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    review_password_id: pwData.id,
  }).eq('id', req.id);

  try {
    const all = JSON.parse(localStorage.getItem('review_pwd_contacts') || '{}');
    all[pwData.id] = `whatsapp:${req.phone_number}`;
    localStorage.setItem('review_pwd_contacts', JSON.stringify(all));
  } catch {}

  await supabase.functions.invoke('send-telegram', {
    body: {
      message: `✅ <b>تأكيد طلب اشتراك</b>\n\n👤 ${req.student_name}\n📱 ${req.phone_number}\n📚 ${req.subject_name}\n🔑 كلمة المرور: <b>${newPwd}</b>\n⏳ المدة: 30 يوم\n\nأرسل كلمة المرور للطالب على: ${req.phone_number}`,
    },
  });
}

export default function AdminPaymentRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [receiptModal, setReceiptModal]   = useState<{ url: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading]     = useState(false);

  // ── جلب كل الطلبات ──
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

  // ── تأكيد طلب واحد ──
  const confirmMut = useMutation({
    mutationFn: confirmSingle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
      toast({ title: 'تم التأكيد وتوليد كلمة المرور', description: 'تحقق من تيليجرام' });
    },
    onError: (e: any) => toast({ title: 'خطأ في التأكيد', description: e?.message || 'تعذّر التأكيد', variant: 'destructive' }),
  });

  // ── رفض طلب واحد ──
  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('payment_requests').update({ status: 'rejected' }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] }),
  });

  // ── تأكيد دفعي (Bulk) ──
  const handleBulkConfirm = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const toConfirm = requests.filter((r: any) => selectedIds.has(r.id) && r.status === 'pending');
    let success = 0;
    let failed = 0;
    for (const req of toConfirm) {
      try {
        await confirmSingle(req);
        success++;
      } catch {
        failed++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] });
    setSelectedIds(new Set());
    setBulkLoading(false);
    toast({
      title: `تم تأكيد ${success} طلب${failed > 0 ? ` (فشل ${failed})` : ''}`,
      description: 'تحقق من تيليجرام للرموز',
    });
  };

  // ── فلترة ──
  const filtered = requests.filter((r: any) => {
    const matchSearch = !search.trim() ||
      r.student_name?.includes(search) ||
      r.phone_number?.includes(search) ||
      r.subject_name?.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingFiltered = filtered.filter((r: any) => r.status === 'pending');
  const pendingCount    = requests.filter((r: any) => r.status === 'pending').length;
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every((r: any) => selectedIds.has(r.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFiltered.map((r: any) => r.id)));
    }
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
            <p className="text-sm text-slate-400 mt-0.5">{requests.length} طلب إجمالاً</p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['payment_requests_all'] })}
            className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            🔄 تحديث
          </button>
        </div>

        {/* ── شريط Bulk Confirm ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              إلغاء التحديد
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                {selectedIds.size} طلب محدد
              </span>
              <button
                onClick={handleBulkConfirm}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
              >
                {bulkLoading
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التأكيد...</>
                  : <><Zap className="w-3.5 h-3.5" /> تأكيد الكل دفعةً واحدة</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── فلاتر + تحديد الكل ── */}
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
            {pendingFiltered.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {allPendingSelected
                  ? <><CheckSquare className="w-3.5 h-3.5" /> إلغاء الكل</>
                  : <><Square className="w-3.5 h-3.5" /> تحديد الكل المعلق</>
                }
              </button>
            )}
            {(['all', 'pending', 'confirmed', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  filterStatus === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s === 'all' ? 'الكل' : STATUS_LABELS[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* ── القائمة ── */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-semibold">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-semibold">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req: any) => {
              const isSelected = selectedIds.has(req.id);
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border text-right transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-700'
                      : req.status === 'pending'
                      ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/40'
                      : req.status === 'confirmed'
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40'
                      : 'border-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 opacity-70'
                  }`}
                >
                  {/* صف البيانات */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Checkbox للمعلق فقط */}
                      {req.status === 'pending' && (
                        <button
                          onClick={() => toggleSelect(req.id)}
                          className="shrink-0 text-emerald-500 hover:text-emerald-600 transition-colors"
                        >
                          {isSelected
                            ? <CheckSquare className="w-5 h-5" />
                            : <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          }
                        </button>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${STATUS_LABELS[req.status]?.cls}`}>
                        {STATUS_LABELS[req.status]?.label}
                      </span>
                      {req.wallet_type && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {req.wallet_type === 'jeeb' ? 'جيب' : req.wallet_type === 'fawry' ? 'فلوسك' : req.wallet_type === 'onecash' ? 'ون كاش' : req.wallet_type}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-slate-800 dark:text-slate-100">{req.student_name}</p>
                      <p className="text-xs text-slate-400 font-semibold" dir="ltr">{req.phone_number}</p>
                      <p className="text-[11px] text-blue-500 font-bold mt-0.5">{req.subject_name}</p>
                    </div>
                  </div>

                  {/* صف الأزرار */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">
                      {new Date(req.created_at).toLocaleString('ar')}
                    </p>
                    {req.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => confirmMut.mutate(req)}
                          disabled={confirmMut.isPending || bulkLoading}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-60"
                        >
                          {confirmMut.isPending ? '...' : '✓ تأكيد'}
                        </button>
                        <button
                          onClick={() => rejectMut.mutate(req.id)}
                          disabled={bulkLoading}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-red-400 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
                        >
                          ✕ رفض
                        </button>
                        <button
                          onClick={() => req.receipt_image_url && setReceiptModal({ url: req.receipt_image_url, name: req.student_name })}
                          disabled={!req.receipt_image_url}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          إيصال 📄
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal الإيصال عبر Portal ── */}
      {receiptModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setReceiptModal(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-black text-sm text-slate-800 dark:text-slate-100">📄 إيصال الإيداع</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{receiptModal.name}</p>
              </div>
              <button
                onClick={() => setReceiptModal(null)}
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <XIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={receiptModal.url}
                alt="إيصال الإيداع"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 object-contain max-h-[60vh]"
              />
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <a
                href={receiptModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-center bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                فتح في تبويب جديد ↗
              </a>
              <button
                onClick={() => setReceiptModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  );
}
