import { AdminLayout } from '@/components/admin/AdminLayout';
import { Check, X, Clock, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';
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

const AdminDeletionRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*, questions(question_text, subject_id, subjects(name))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch editor emails
      const userIds = [...new Set((data || []).map((r: any) => r.requested_by))];
      const emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        // Use edge function or direct query - since we can't query auth.users directly,
        // we'll show user_id shortened if no profiles table
        // For now, just return data as-is
      }

      return (data || []).map((r: any) => ({ ...r, editor_email: emailMap[r.requested_by] || null }));
    },
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ requestId, questionId, approved, requestType, questionData, targetQuestionId }: {
      requestId: string;
      questionId: string | null;
      approved: boolean;
      requestType: string;
      questionData: any;
      targetQuestionId: string | null;
    }) => {
      // Update request status
      const { error: updateError } = await supabase
        .from('deletion_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (updateError) throw updateError;

      if (approved) {
        if (requestType === 'delete' && questionId) {
          // Delete the question
          const { error: deleteError } = await supabase
            .from('questions')
            .delete()
            .eq('id', questionId);
          if (deleteError) throw deleteError;

        } else if (requestType === 'add' && questionData?.questions) {
          // Insert the questions from question_data
          const questions = questionData.questions.map((q: any) => ({
            subject_id: q.subject_id,
            question_text: q.question_text,
            option_a: q.option_a || '',
            option_b: q.option_b || '',
            option_c: q.option_c || '',
            option_d: q.option_d || '',
            correct_option: q.correct_option || 'A',
            exam_year: q.exam_year ?? null,
            exam_form: q.exam_form || 'General',
            created_by: q.created_by || null,
            status: 'active' as const,
          }));
          const { error: insertError } = await supabase.from('questions').insert(questions);
          if (insertError) throw insertError;

        } else if (requestType === 'edit' && targetQuestionId && questionData) {
          // Apply edit to the target question
          const { questions: _, ...editPayload } = questionData;
          const { error: editError } = await supabase
            .from('questions')
            .update(editPayload)
            .eq('id', targetQuestionId);
          if (editError) throw editError;
        }
      } else {
        // Rejected: restore question status if it was a delete request
        if (requestType === 'delete' && questionId) {
          const { error: restoreError } = await supabase
            .from('questions')
            .update({ status: 'active' })
            .eq('id', questionId);
          if (restoreError) throw restoreError;
        }
      }
    },
    onSuccess: (_, { approved, requestType }) => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      const typeLabel = REQUEST_TYPE_CONFIG[requestType]?.label || requestType;
      toast({
        title: approved ? `تمت الموافقة على طلب ${typeLabel}` : `تم رفض طلب ${typeLabel}`,
        description: approved ? 'تم تنفيذ العملية بنجاح' : 'تم رفض الطلب',
      });
    },
  });

  const getRequestDescription = (request: any) => {
    const type = request.request_type || 'delete';
    if (type === 'delete') {
      return request.questions?.question_text || 'سؤال محذوف';
    }
    if (type === 'add') {
      const count = request.question_data?.questions?.length || 0;
      return `إضافة ${count} سؤال`;
    }
    if (type === 'edit') {
      return `تعديل سؤال: ${request.question_data?.question_text || request.questions?.question_text || ''}`;
    }
    return '';
  };

  const getSubjectName = (request: any) => {
    if (request.questions?.subjects?.name) return request.questions.subjects.name;
    if (request.question_data?.subject_id) return 'مادة مرتبطة';
    return '';
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
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 sm:h-24 rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">لا توجد طلبات معلقة</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request: any) => {
                const type = request.request_type || 'delete';
                const config = REQUEST_TYPE_CONFIG[type] || REQUEST_TYPE_CONFIG.delete;
                const TypeIcon = config.icon;

                return (
                  <div key={request.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={config.badgeClass}>
                              {config.label}
                            </Badge>
                            {getSubjectName(request) && (
                              <span className="text-xs text-muted-foreground">
                                {getSubjectName(request)}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-sm mb-1 line-clamp-2">
                            {getRequestDescription(request)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            المحرر: {request.editor_email || request.requested_by?.substring(0, 8) + '...'}
                          </p>
                          {request.reason && (
                            <p className="text-xs text-muted-foreground mt-1">
                              السبب: {request.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none text-destructive hover:text-destructive gap-1 text-xs sm:text-sm"
                          onClick={() => handleRequestMutation.mutate({
                            requestId: request.id,
                            questionId: request.question_id,
                            approved: false,
                            requestType: type,
                            questionData: request.question_data,
                            targetQuestionId: request.target_question_id,
                          })}
                          disabled={handleRequestMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                          رفض
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 sm:flex-none bg-success hover:bg-success/90 text-success-foreground gap-1 text-xs sm:text-sm"
                          onClick={() => handleRequestMutation.mutate({
                            requestId: request.id,
                            questionId: request.question_id,
                            approved: true,
                            requestType: type,
                            questionData: request.question_data,
                            targetQuestionId: request.target_question_id,
                          })}
                          disabled={handleRequestMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                          موافقة
                        </Button>
                      </div>
                    </div>
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
