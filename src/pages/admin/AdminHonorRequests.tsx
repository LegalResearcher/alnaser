import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, CheckCircle, XCircle, Send, Award, Pencil, X } from 'lucide-react';

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
    </AdminLayout>
  );
}
