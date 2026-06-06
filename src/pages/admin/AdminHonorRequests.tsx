import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, CheckCircle, XCircle, Send, Award, Pencil, X, MessageCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'معلق',   cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  confirmed: { label: 'تمت الموافقة', cls: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  rejected:  { label: 'مرفوض', cls: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
};

export default function AdminHonorRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // ── جلب الطلبات ──
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['honor_requests'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('honor_certificates')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // ── موافقة ──
  const confirmMut = useMutation({
    mutationFn: async (req: any) => {
      await (supabase as any)
        .from('honor_certificates')
        .update({ status: 'confirmed' })
        .eq('id', req.id);

      const certUrl = `https://alnaseer.org/honor-certificate?code=${req.verify_code}`;
      const msg =
        `🎓 *تهانينا، ${req.student_name}*\n\n` +
        `يسعدنا إبلاغك بأن منصة الناصر القانونية قد أصدرت شهادتك الرسمية تقديراً لتفوقك وتميزك.\n\n` +
        `📜 *لعرض شهادتك وتنزيلها:*\n` +
        `👈 ${certUrl}\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🏛 *منصة الناصر القانونية*\n` +
        `alnaseer.org`;

      await supabase.functions.invoke('send-telegram', { body: { message: msg } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_requests'] });
      toast({ title: 'تمت الموافقة', description: 'تم إرسال رابط الشهادة للطالب عبر تيليجرام' });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e?.message, variant: 'destructive' }),
  });

  // ── رفض ──
  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('honor_certificates').update({ status: 'rejected' }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_requests'] });
      toast({ title: 'تم الرفض' });
    },
  });

  // ── إرسال الشهادة مجدداً ──
  const resendMut = useMutation({
    mutationFn: async (req: any) => {
      const certUrl = `https://alnaseer.org/honor-certificate?code=${req.verify_code}`;
      const msg =
        `🎓 *تهانينا، ${req.student_name}*\n\n` +
        `يسعدنا إبلاغك بأن منصة الناصر القانونية قد أصدرت شهادتك الرسمية تقديراً لتفوقك وتميزك.\n\n` +
        `📜 *لعرض شهادتك وتنزيلها:*\n` +
        `👈 ${certUrl}\n\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🏛 *منصة الناصر القانونية*\n` +
        `alnaseer.org`;
      await supabase.functions.invoke('send-telegram', { body: { message: msg } });
    },
    onSuccess: () => toast({ title: 'تم إعادة الإرسال', description: 'تحقق من تيليجرام' }),
    onError: (e: any) => toast({ title: 'خطأ في الإرسال', description: e?.message, variant: 'destructive' }),
  });

  // ── حذف ──
  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      await (supabase as any).from('honor_certificates').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_requests'] });
      setDeleteConfirm(null);
      toast({ title: 'تم الحذف' });
    },
  });

  // ── تعديل ──
  const editMut = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...rest } = payload;
      const { error } = await (supabase as any)
        .from('honor_certificates')
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_requests'] });
      setEditTarget(null);
      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الشهادة' });
    },
    onError: (e: any) => toast({ title: 'خطأ', description: e?.message, variant: 'destructive' }),
  });

  const openEdit = (req: any) => {
    setEditTarget(req);
    setEditForm({
      student_name: req.student_name || '',
      phone: req.phone || '',
      governorate: req.governorate || '',
      level_label: req.level_label || '',
      rank: req.rank || '',
      status: req.status || 'pending',
    });
  };

  const [contactTarget, setContactTarget] = useState<any | null>(null);

  const openContactModal = (req: any) => setContactTarget(req);

  const sendContact = (req: any, channel: 'whatsapp' | 'telegram') => {
    const certUrl = `https://alnaseer.org/honor-certificate?code=${req.verify_code}`;
    const msg =
      `🎓 *تهانينا، ${req.student_name}*\n\n` +
      `يسعدنا إبلاغك بأن منصة الناصر القانونية قد أصدرت شهادتك تقديراً لتفوقك وتميزك.\n\n` +
      `📜 *لعرض شهادتك وتنزيلها:*\n` +
      `👈 ${certUrl}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🏛 *منصة الناصر القانونية*\n` +
      `alnaseer.org`;

    const phone = (req.phone || '').replace(/\D/g, '');
    const intlPhone = phone.startsWith('0') ? '967' + phone.slice(1) : phone;

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://t.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    setContactTarget(null);
  };

  const filtered = requests.filter((r: any) => {
    const matchSearch = !search.trim() ||
      r.student_name?.includes(search) || r.phone?.includes(search) ||
      r.governorate?.includes(search) || r.level_label?.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
              🎓 طلبات شهادات الشرف
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 animate-pulse">
                  {pendingCount} معلق
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">{requests.length} طلب إجمالاً</p>
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['honor_requests'] })}
            className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            🔄 تحديث
          </button>
        </div>

        {/* فلاتر */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الهاتف أو المحافظة..."
              className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-blue-400 transition-colors"
              dir="rtl"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'pending', 'confirmed', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                  filterStatus === s ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'الكل' : STATUS_LABELS[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* القائمة */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 font-semibold">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-semibold">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req: any) => (
              <div
                key={req.id}
                className={`p-4 rounded-2xl border transition-all ${
                  req.status === 'pending'
                    ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/40'
                    : req.status === 'confirmed'
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/40'
                    : 'border-red-100 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/30 opacity-70'
                }`}
              >
                {/* بيانات الطالب */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${STATUS_LABELS[req.status]?.cls}`}>
                    {STATUS_LABELS[req.status]?.label}
                  </span>
                  <div className="text-right">
                    <p className="font-black text-sm text-slate-800 dark:text-slate-100">{req.student_name}</p>
                    <p className="text-xs text-slate-400 font-semibold" dir="ltr">{req.phone}</p>
                    <p className="text-[11px] text-blue-500 font-bold mt-0.5">{req.level_label}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{req.governorate}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">رمز التحقق: {req.verify_code}</p>
                  </div>
                </div>

                {/* أزرار */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[10px] text-slate-400">{new Date(req.created_at).toLocaleString('ar')}</p>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => confirmMut.mutate(req)}
                          disabled={confirmMut.isPending}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1 disabled:opacity-60"
                        >
                          <CheckCircle className="w-3 h-3" /> موافقة
                        </button>
                        <button
                          onClick={() => rejectMut.mutate(req.id)}
                          disabled={rejectMut.isPending}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-slate-400 hover:bg-slate-500 text-white transition-colors flex items-center gap-1 disabled:opacity-60"
                        >
                          <XCircle className="w-3 h-3" /> رفض
                        </button>
                      </>
                    )}
                    {req.status === 'confirmed' && (
                      <button
                        onClick={() => resendMut.mutate(req)}
                        disabled={resendMut.isPending}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-1 disabled:opacity-60"
                      >
                        <Send className="w-3 h-3" /> إعادة إرسال
                      </button>
                    )}
                    <button
                      onClick={() => openContactModal(req)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> مراسلة
                    </button>
                    <button
                      onClick={() => openEdit(req)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> تعديل
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(req.id)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal تأكيد الحذف */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <p className="font-black text-slate-800 dark:text-slate-100 mb-1">تأكيد الحذف</p>
            <p className="text-sm text-slate-400 mb-5">هل أنت متأكد من حذف هذا الطلب؟</p>
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
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal تعديل */}
      {editTarget && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-500" /> تعديل الشهادة
              </h2>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'student_name', label: 'اسم الطالب' },
                { key: 'phone', label: 'الهاتف' },
                { key: 'governorate', label: 'المحافظة' },
                { key: 'level_label', label: 'المستوى' },
                { key: 'rank', label: 'الرتبة' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 block">
                    {f.label}
                  </label>
                  <input
                    value={editForm[f.key] ?? ''}
                    onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 block">
                  الحالة
                </label>
                <select
                  value={editForm.status ?? 'pending'}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="pending">معلق</option>
                  <option value="confirmed">تمت الموافقة</option>
                  <option value="rejected">مرفوض</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => editMut.mutate({ id: editTarget.id, ...editForm })}
                disabled={editMut.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60"
              >
                {editMut.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal مراسلة */}
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
            <p className="font-black text-slate-800 dark:text-slate-100 mb-1">مراسلة الطالب</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{contactTarget.student_name}</p>
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
