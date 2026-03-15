import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSEO } from '@/components/seo/SEOHead';
import { Lightbulb, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'بانتظار المراجعة', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'تمت الموافقة',     color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'مرفوض',            color: 'bg-red-100 text-red-700' },
};
const OL = (o: string) => o === 'A' ? 'أ' : o === 'B' ? 'ب' : o === 'C' ? 'ج' : 'د';

const AdminSuggestions = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['question-suggestions', filter],
    queryFn: async () => {
      let query = (supabase.from('question_suggestions' as any) as any)
        .select('*, subjects(name, levels(name))')
        .order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const s = suggestions.find((x: any) => x.id === id);
      if (!s) return;
      const { error } = await supabase.from('questions').insert({
        subject_id: s.subject_id,
        question_text: s.question_text,
        option_a: s.option_a,
        option_b: s.option_b,
        option_c: s.option_c || '',
        option_d: s.option_d || '',
        correct_option: s.correct_option,
        hint: s.hint || null,
        status: 'active' as any,
        exam_year: null,
        reviewer_credit: s.suggester_name
          ? `${s.suggester_name}${s.suggester_batch ? ` — دفعة ${s.suggester_batch}` : ''}`
          : null,
      });
      if (error) throw error;
      await (supabase.from('question_suggestions' as any) as any).update({ status: 'approved' }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-suggestions'] });
      toast({ title: '✅ تمت الموافقة وإضافة السؤال' });
    },
    onError: () => toast({ title: 'حدث خطأ', variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('question_suggestions' as any) as any).update({ status: 'rejected' }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-suggestions'] });
      toast({ title: 'تم رفض الاقتراح' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('question_suggestions' as any) as any).delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-suggestions'] });
      setSelectedId(null);
      toast({ title: 'تم الحذف' });
    },
  });

  const selected = suggestions.find((s: any) => s.id === selectedId);
  const pendingCount = suggestions.filter((s: any) => s.status === 'pending').length;

  return (
    <AdminLayout>
      <AdminSEO pageName="اقتراحات الأسئلة" />
      <div className="space-y-6" dir="rtl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black">اقتراحات الأسئلة</h1>
            {pendingCount > 0 && (
              <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingCount} جديد
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">أسئلة مقترحة من الزوار بانتظار الموافقة</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-black border transition-all',
                filter === f ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50')}>
              {f === 'pending' ? 'بانتظار' : f === 'approved' ? 'موافق' : f === 'rejected' ? 'مرفوض' : 'الكل'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Lightbulb className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-sm text-muted-foreground font-bold">لا توجد اقتراحات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* List */}
            <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto">
              {suggestions.map((s: any) => (
                <div key={s.id} onClick={() => setSelectedId(s.id)}
                  className={cn('p-4 rounded-xl border cursor-pointer transition-all',
                    selectedId === s.id ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-border bg-card hover:border-amber-300',
                    s.status === 'pending' && 'border-r-4 border-r-amber-500')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">{s.subjects?.name}</span>
                    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', STATUS_LABELS[s.status]?.color)}>
                      {STATUS_LABELS[s.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold line-clamp-2">{s.question_text}</p>
                  {s.suggester_name && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      👤 {s.suggester_name}{s.suggester_batch ? ` — دفعة ${s.suggester_batch}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-3">
              {selected ? (
                <div className="bg-card rounded-2xl border p-5 space-y-4 sticky top-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black">{selected.subjects?.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.subjects?.levels?.name}</p>
                    </div>
                    <button onClick={() => deleteMutation.mutate(selected.id)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Suggester info */}
                  {(selected.suggester_name || selected.suggester_contact) && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {selected.suggester_name && <span>👤 {selected.suggester_name}</span>}
                      {selected.suggester_level && <span>المستوى {selected.suggester_level}</span>}
                      {selected.suggester_batch && <span>دفعة {selected.suggester_batch}</span>}
                      {selected.suggester_contact && <span>📱 {selected.suggester_contact}</span>}
                    </div>
                  )}

                  {/* Question content */}
                  <div className="bg-muted rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold leading-relaxed">{selected.question_text}</p>
                    {(['a', 'b', 'c', 'd'] as const).map(opt => {
                      const val = selected[`option_${opt}`];
                      if (!val) return null;
                      const isC = selected.correct_option === opt.toUpperCase();
                      return (
                        <div key={opt} className={cn('flex items-center gap-2 p-2 rounded-xl text-sm',
                          isC ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 font-bold' : 'text-foreground/70')}>
                          <span className={cn('w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0',
                            isC ? 'bg-emerald-500 text-white' : 'bg-muted-foreground/10 text-muted-foreground')}>
                            {OL(opt.toUpperCase())}
                          </span>
                          {val}
                        </div>
                      );
                    })}
                    {selected.hint && (
                      <p className="text-xs text-amber-600 mt-2">💡 {selected.hint}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {selected.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => rejectMutation.mutate(selected.id)}
                        disabled={rejectMutation.isPending}
                        className="h-11 rounded-xl border border-red-200 text-red-500 font-black text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-60">
                        <XCircle className="w-4 h-4" /> رفض
                      </button>
                      <button onClick={() => approveMutation.mutate(selected.id)}
                        disabled={approveMutation.isPending}
                        className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                        {approveMutation.isPending
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><CheckCircle2 className="w-4 h-4" /> موافقة ونشر</>}
                      </button>
                    </div>
                  )}
                  {selected.status === 'approved' && (
                    <p className="text-xs text-emerald-600 font-bold text-center bg-emerald-50 rounded-xl p-3">
                      ✅ تمت الموافقة — السؤال منشور
                    </p>
                  )}
                  {selected.status === 'rejected' && (
                    <p className="text-xs text-red-500 font-bold text-center bg-red-50 rounded-xl p-3">
                      ❌ تم الرفض
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-xl border h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Lightbulb className="w-10 h-10 mx-auto opacity-20" />
                    <p className="text-sm">اختر اقتراحاً لعرض تفاصيله</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSuggestions;
