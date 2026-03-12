import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Check, X, Clock, Plus, Edit2, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

const REQUEST_TYPE_CONFIG: Record<string, { label: string; icon: typeof Trash2; badgeClass: string }> = {
  delete: { label: 'حذف', icon: Trash2, badgeClass: 'bg-destructive/10 text-destructive border-destructive/20' },
  add: { label: 'إضافة', icon: Plus, badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  edit: { label: 'تعديل', icon: Edit2, badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

const OPTION_LABELS: Record<string, string> = { A: 'أ', B: 'ب', C: 'ج', D: 'د' };

// مكون عرض سؤال واحد
const QuestionPreview = ({ q, correct_option }: { q: any; correct_option: string }) => (
  <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
    <p className="font-semibold leading-relaxed">{q.question_text}</p>
    <div className="grid grid-cols-1 gap-1">
      {['A','B','C','D'].map(opt => {
        const val = q[`option_${opt.toLowerCase()}`];
        if (!val) return null;
        const isCorrect = correct_option === opt;
        return (
          <div key={opt} className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${isCorrect ? 'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-900/40 dark:text-emerald-300' : 'text-muted-foreground'}`}>
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0">{OPTION_LABELS[opt]}</span>
            <span>{val}</span>
            {isCorrect && <span className="mr-auto text-emerald-600">✓ صحيحة</span>}
          </div>
        );
      })}
    </div>
  </div>
);

const AdminDeletionRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*, questions!deletion_requests_question_id_fkey(question_text, subject_id, subjects(name))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((r: any) => r.requested_by))];
      const emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, email')
          .in('user_id', userIds as string[]);
        (roles || []).forEach((r: any) => { if (r.email) emailMap[r.user_id] = r.email; });
      }

      // جلب أسماء المواد لطلبات add/edit
      const subjectIds = [...new Set((data || [])
        .map((r: any) => r.question_data?.questions?.[0]?.subject_id || r.question_data?.subject_id)
        .filter(Boolean))];
      const subjectMap: Record<string, string> = {};
      if (subjectIds.length > 0) {
        const { data: subjects } = await supabase
          .from('subjects').select('id, name').in('id', subjectIds as string[]);
        (subjects || []).forEach((s: any) => { subjectMap[s.id] = s.name; });
      }

      return (data || []).map((r: any) => {
        const subjectId = r.question_data?.questions?.[0]?.subject_id || r.question_data?.subject_id;
        return { ...r, editor_email: emailMap[r.requested_by] || null, subject_name: subjectMap[subjectId] || null };
      });
    },
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ requestId, questionId, approved, requestType, questionData, targetQuestionId }: {
      requestId: string; questionId: string | null; approved: boolean;
      requestType: string; questionData: any; targetQuestionId: string | null;
    }) => {
      const { error: updateError } = await supabase
        .from('deletion_requests')
        .update({ status: approved ? 'approved' : 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', requestId);
      if (updateError) throw updateError;

      if (approved) {
        if (requestType === 'delete' && questionId) {
          const { error } = await supabase.from('questions').delete().eq('id', questionId);
          if (error) throw error;
        } else if (requestType === 'add' && questionData?.questions) {
          const questions = questionData.questions.map((q: any) => ({
            subject_id: q.subject_id, question_text: q.question_text,
            option_a: q.option_a || '', option_b: q.option_b || '',
            option_c: q.option_c || '', option_d: q.option_d || '',
            correct_option: q.correct_option || 'A',
            exam_year: q.exam_year ?? null, exam_form: q.exam_form || 'General',
            created_by: q.created_by || null, status: 'active' as const,
          }));
          const { error } = await supabase.from('questions').insert(questions);
          if (error) throw error;
        } else if (requestType === 'edit' && targetQuestionId && questionData) {
          const { questions: _, ...editPayload } = questionData;
          const { error } = await supabase.from('questions').update(editPayload).eq('id', targetQuestionId);
          if (error) throw error;
        }
      } else {
        if (requestType === 'delete' && questionId) {
          const { error } = await supabase.from('questions').update({ status: 'active' }).eq('id', questionId);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, { approved, requestType }) => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      const typeLabel = REQUEST_TYPE_CONFIG[requestType]?.label || requestType;
      toast({ title: approved ? `تمت الموافقة على طلب ${typeLabel}` : `تم رفض طلب ${typeLabel}`, description: approved ? 'تم تنفيذ العملية بنجاح' : 'تم رفض الطلب' });
      setExpandedId(null);
    },
  });

  const getRequestDescription = (request: any) => {
    const type = request.request_type || 'delete';
    if (type === 'delete') return request.questions?.question_text || 'سؤال محذوف';
    if (type === 'add') { const count = request.question_data?.questions?.length || 0; return `إضافة ${count} سؤال`; }
    if (type === 'edit') return `تعديل سؤال: ${request.question_data?.question_text?.substring(0, 50) || ''}...`;
    return '';
  };

  const getSubjectName = (request: any) => {
    if (request.questions?.subjects?.name) return request.questions.subjects.name;
    if (request.subject_name) return request.subject_name;
    return '';
  };

  // عرض المعاينة حسب نوع الطلب
  const renderPreview = (request: any) => {
    const type = request.request_type || 'delete';

    if (type === 'delete') {
      const q = request.questions;
      if (!q) return <p className="text-sm text-muted-foreground">لا تتوفر بيانات السؤال</p>;
      return <QuestionPreview q={q} correct_option="" />;
    }

    if (type === 'add') {
      const questions = request.question_data?.questions || [];
      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-semibold">الأسئلة المراد إضافتها ({questions.length}):</p>
          {questions.map((q: any, i: number) => (
            <div key={i}>
              <p className="text-xs text-muted-foreground mb-1">السؤال {i + 1}</p>
              <QuestionPreview q={q} correct_option={q.correct_option} />
            </div>
          ))}
        </div>
      );
    }

    if (type === 'edit') {
      const newData = request.question_data;
      return (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">السؤال بعد التعديل:</p>
          <QuestionPreview q={newData} correct_option={newData?.correct_option} />
        </div>
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">طلبات المحررين</h1>
          <p className="text-sm sm:text-base text-muted-foreground">مراجعة طلبات الحذف والإضافة والتعديل</p>
        </div>

        <div className="bg-card rounded-xl border">
          {isLoading ? (
            <div className="p-3 sm:p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">لا توجد طلبات معلقة</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request: any) => {
                const type = request.request_type || 'delete';
                const config = REQUEST_TYPE_CONFIG[type] || REQUEST_TYPE_CONFIG.delete;
                const TypeIcon = config.icon;
                const isExpanded = expandedId === request.id;

                return (
                  <div key={request.id} className="p-3 sm:p-4">
                    {/* رأس الطلب */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={config.badgeClass}>{config.label}</Badge>
                            {getSubjectName(request) && (
                              <span className="text-xs text-muted-foreground">{getSubjectName(request)}</span>
                            )}
                          </div>
                          <p className="font-medium text-sm mb-1 line-clamp-2">{getRequestDescription(request)}</p>
                          <p className="text-xs text-muted-foreground">
                            المحرر: {request.editor_email || request.requested_by?.substring(0, 8) + '...'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* أزرار */}
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap">
                        <Button size="sm" variant="outline"
                          className="flex-1 sm:flex-none gap-1 text-xs"
                          onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                          <Eye className="w-3 h-3" />
                          {isExpanded ? 'إخفاء' : 'معاينة'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                        <Button size="sm" variant="outline"
                          className="flex-1 sm:flex-none text-destructive hover:text-destructive gap-1 text-xs"
                          onClick={() => handleRequestMutation.mutate({
                            requestId: request.id, questionId: request.question_id,
                            approved: false, requestType: type,
                            questionData: request.question_data, targetQuestionId: request.target_question_id,
                          })}
                          disabled={handleRequestMutation.isPending}>
                          <X className="w-4 h-4" /> رفض
                        </Button>
                        <Button size="sm"
                          className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground gap-1 text-xs"
                          onClick={() => handleRequestMutation.mutate({
                            requestId: request.id, questionId: request.question_id,
                            approved: true, requestType: type,
                            questionData: request.question_data, targetQuestionId: request.target_question_id,
                          })}
                          disabled={handleRequestMutation.isPending}>
                          <Check className="w-4 h-4" /> موافقة
                        </Button>
                      </div>
                    </div>

                    {/* قسم المعاينة */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        {renderPreview(request)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDeletionRequests;
