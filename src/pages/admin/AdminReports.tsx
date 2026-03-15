import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSEO } from '@/components/seo/SEOHead';
import { MessageSquare, CheckCircle2, Clock, Trash2, Pencil, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ERROR_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  wrong_answer:   { label: 'خطأ في الإجابة',  color: 'bg-red-100 text-red-700' },
  wrong_question: { label: 'خطأ في السؤال',   color: 'bg-orange-100 text-orange-700' },
  other:          { label: 'ملاحظة أخرى',     color: 'bg-slate-100 text-slate-600' },
};

const EXAM_FORM_LABELS: Record<string, string> = {
  General:  'عام',
  Parallel: 'موازي',
  Mixed:    'مختلط',
  Trial:    'تجريبي',
  All:      'جميع الأسئلة',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'بانتظار المراجعة', color: 'bg-amber-100 text-amber-700' },
  reviewed: { label: 'تمت المراجعة',     color: 'bg-blue-100 text-blue-700' },
  applied:  { label: 'تم التطبيق',       color: 'bg-emerald-100 text-emerald-700' },
};

const AdminReports = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [creditName, setCreditName] = useState('');
  const [creditBatch, setCreditBatch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['question-reports'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('question_reports') as any)
        .select('*, questions(id, question_text, option_a, option_b, option_c, option_d, correct_option, subject_id, subjects(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await (supabase.from('question_reports') as any).update({ status }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['question-reports'] }),
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const report = reports.find((r: any) => r.id === id);
      if (report?.image_url) {
        const fileName = report.image_url.split('/').pop();
        if (fileName) await supabase.storage.from('report-images').remove([fileName]);
      }
      await (supabase.from('question_reports') as any).delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-reports'] });
      setSelectedId(null);
      toast({ title: 'تم حذف التعقيب والصورة نهائياً' });
    },
  });

  const saveQuestion = useMutation({
    mutationFn: async ({ questionId, data, reviewedBy }: { questionId: string; data: any; reviewedBy?: string }) => {
      const payload = { ...data, reviewer_credit: reviewedBy || null };
      await supabase.from('questions').update(payload).eq('id', questionId);
    },
    onSuccess: async () => {
      if (selectedId) await (supabase.from('question_reports') as any).update({ status: 'applied' }).eq('id', selectedId);
      queryClient.invalidateQueries({ queryKey: ['question-reports'] });
      setEditMode(false); setShowSaveConfirm(false); setCreditName(''); setCreditBatch('');
      toast({ title: '✅ تم تعديل السؤال وتحديث حالة التعقيب' });
    },
  });

  const selected = reports.find((r: any) => r.id === selectedId);
  const pendingCount = reports.filter((r: any) => r.status === 'pending').length;

  const handleSelect = (report: any) => {
    setSelectedId(report.id); setEditMode(false);
    setEditData({
      question_text: report.questions?.question_text || '',
      option_a: report.questions?.option_a || '',
      option_b: report.questions?.option_b || '',
      option_c: report.questions?.option_c || '',
      option_d: report.questions?.option_d || '',
      correct_option: report.questions?.correct_option || 'A',
    });
  };

  const optionLabel = (opt: string) => opt === 'A' ? 'أ' : opt === 'B' ? 'ب' : opt === 'C' ? 'ج' : 'د';

  const examContext = (r: any) => {
    const parts: string[] = [];
    if (r.level_name) parts.push(r.level_name);
    if (r.exam_year) parts.push(String(r.exam_year));
    if (r.exam_form && EXAM_FORM_LABELS[r.exam_form]) parts.push(EXAM_FORM_LABELS[r.exam_form]);
    return parts.join(' · ');
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="تعقيبات الأسئلة" />
      <div className="space-y-6" dir="rtl">
        <div>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black">تعقيبات الأسئلة</h1>
            {pendingCount > 0 && <span className="text-xs font-black bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full">{pendingCount} جديد</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">ملاحظات الطلاب على الأسئلة والإجابات</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p className="font-bold">لا توجد تعقيبات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-2 space-y-3 max-h-[75vh] overflow-y-auto">
              {reports.map((r: any) => (
                <div key={r.id} onClick={() => handleSelect(r)}
                  className={cn('p-4 rounded-xl border cursor-pointer transition-all',
                    selectedId === r.id ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : 'border-border bg-card hover:border-orange-300',
                    r.status === 'pending' && 'border-r-4 border-r-orange-500')}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', ERROR_TYPE_LABELS[r.error_type]?.color)}>{ERROR_TYPE_LABELS[r.error_type]?.label}</span>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', STATUS_LABELS[r.status]?.color)}>{STATUS_LABELS[r.status]?.label}</span>
                  </div>
                  <p className="text-xs font-bold text-primary mb-1">{r.questions?.subjects?.name}</p>
                  <p className="text-sm font-semibold line-clamp-2 mb-2">{r.questions?.question_text}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    {r.reporter_name ? (
                      <span>👤 {r.reporter_name}{r.reporter_level ? ` — المستوى ${r.reporter_level}` : ''}{r.reporter_batch ? ` — دفعة ${r.reporter_batch}` : ''}</span>
                    ) : <span />}
                    <span>{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-3">
              {selected ? (
                <div className="bg-card rounded-xl border p-6 space-y-5 sticky top-24">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-black px-2.5 py-1 rounded-full', ERROR_TYPE_LABELS[selected.error_type]?.color)}>{ERROR_TYPE_LABELS[selected.error_type]?.label}</span>
                      <span className="text-xs font-bold text-primary">{selected.questions?.subjects?.name}</span>
                    </div>
                    <button onClick={() => deleteReport.mutate(selected.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {(selected.reporter_name || selected.reporter_level || selected.reporter_batch || selected.reporter_contact) && (
                    <div className="flex flex-wrap gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                      {selected.reporter_name && <span className="font-bold">👤 {selected.reporter_name}</span>}
                      {selected.reporter_level && <span className="font-bold">المستوى {selected.reporter_level}</span>}
                      {selected.reporter_batch && <span className="font-bold">دفعة {selected.reporter_batch}</span>}
                      {selected.reporter_contact && <span className="font-bold">📱 {selected.reporter_contact}</span>}
                    </div>
                  )}

                  {selected.note && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl">
                      <p className="text-xs font-black text-amber-700 mb-1">ملاحظة الطالب:</p>
                      <p className="text-sm">{selected.note}</p>
                    </div>
                  )}

                  {selected.image_url && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-500">صورة مرفقة:</p>
                      <a href={selected.image_url} target="_blank" rel="noopener noreferrer">
                        <img src={selected.image_url} alt="مرفق" className="max-h-48 rounded-xl border object-contain" />
                      </a>
                    </div>
                  )}

                  {selected.suggested_answer && (
                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                      <p className="text-xs font-black text-primary mb-1">الإجابة المقترحة:</p>
                      <p className="text-lg font-black text-primary">{optionLabel(selected.suggested_answer)}</p>
                    </div>
                  )}

                  {/* Question edit section */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black">السؤال الحالي</p>
                      <button onClick={() => setEditMode(!editMode)}
                        className={cn('flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg transition-colors',
                          editMode ? 'bg-slate-200 text-slate-600' : 'bg-primary/10 text-primary hover:bg-primary/20')}>
                        {editMode ? <><X className="w-3 h-3" /> إلغاء</> : <><Pencil className="w-3 h-3" /> تعديل</>}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editMode ? (
                        <>
                          <textarea value={editData.question_text} onChange={e => setEditData({ ...editData, question_text: e.target.value })}
                            className="w-full rounded-xl border p-3 text-sm resize-none bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30" rows={3} />
                          {(['a','b','c','d'] as const).map(opt => (
                            <div key={opt} className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">{optionLabel(opt.toUpperCase())}</span>
                              <input value={editData[`option_${opt}`]} onChange={e => setEditData({ ...editData, [`option_${opt}`]: e.target.value })}
                                className="flex-1 rounded-xl border p-2 text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                            </div>
                          ))}
                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-500">الإجابة الصحيحة</p>
                            <div className="grid grid-cols-4 gap-2">
                              {(['A','B','C','D'] as const).map(opt => (
                                <button key={opt} onClick={() => setEditData({ ...editData, correct_option: opt })}
                                  className={cn('py-2 rounded-xl text-sm font-black border transition-all',
                                    editData.correct_option === opt ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500 hover:border-emerald-300')}>
                                  {optionLabel(opt)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => { setCreditName(selected.reporter_name || ''); setCreditBatch(selected.reporter_batch || ''); setShowSaveConfirm(true); }}
                            disabled={saveQuestion.isPending}
                            className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                            {saveQuestion.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> حفظ التعديلات</>}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold leading-relaxed">{selected.questions?.question_text}</p>
                          {(['a','b','c','d'] as const).map(opt => (
                            <div key={opt} className={cn('flex items-center gap-2 p-2 rounded-xl text-sm',
                              selected.questions?.correct_option === opt.toUpperCase() ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600')}>
                              <span className={cn('w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0',
                                selected.questions?.correct_option === opt.toUpperCase() ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>
                                {optionLabel(opt.toUpperCase())}
                              </span>
                              {selected.questions?.[`option_${opt}`]}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['pending','reviewed','applied'] as const).map(s => (
                      <button key={s} onClick={() => updateStatus.mutate({ id: selected.id, status: s })}
                        className={cn('py-2 rounded-xl text-xs font-black border transition-all',
                          selected.status === s ? `${STATUS_LABELS[s].color} border-current` : 'border-slate-200 text-slate-400 hover:border-slate-300')}>
                        {s === 'pending' ? <><Clock className="w-3 h-3 inline ml-1" />بانتظار</> : s === 'reviewed' ? <><CheckCircle2 className="w-3 h-3 inline ml-1" />مراجعة</> : <><CheckCircle2 className="w-3 h-3 inline ml-1" />تطبيق</>}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl border h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-sm">اختر تعقيباً لعرض تفاصيله</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save confirmation modal */}
      {showSaveConfirm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveConfirm(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Save className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-black text-lg">تأكيد حفظ التعديل</h3>
              <p className="text-sm text-muted-foreground">هل تريد نسب هذه المراجعة لاسم معين؟</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">اسم المراجع (اختياري)</p>
              <input value={creditName} onChange={e => setCreditName(e.target.value)} placeholder="مثال: أحمد محمد"
                className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
              <input value={creditBatch} onChange={e => setCreditBatch(e.target.value)} placeholder="الدفعة (اختياري، مثال: 50)"
                className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30" />
              {(creditName || creditBatch) && (
                <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
                  سيُحفظ في السؤال: <span className="font-black">مراجعة: {[creditName, creditBatch].filter(Boolean).join(' — دفعة ')}</span>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowSaveConfirm(false)}
                className="h-11 rounded-xl border border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-colors">إلغاء</button>
              <button
                onClick={() => saveQuestion.mutate({
                  questionId: selected.questions?.id,
                  data: editData,
                  reviewedBy: [creditName.trim(), creditBatch.trim()].filter(Boolean).join(' — دفعة ') || undefined,
                })}
                disabled={saveQuestion.isPending}
                className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                {saveQuestion.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> حفظ</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
