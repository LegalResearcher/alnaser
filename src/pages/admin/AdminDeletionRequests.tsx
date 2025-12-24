import { AdminLayout } from '@/components/admin/AdminLayout';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
      return data;
    },
  });

  const handleRequestMutation = useMutation({
    mutationFn: async ({ requestId, questionId, approved }: { requestId: string; questionId: string; approved: boolean }) => {
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
        // Delete the question
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('id', questionId);
        if (deleteError) throw deleteError;
      } else {
        // Restore question status
        const { error: restoreError } = await supabase
          .from('questions')
          .update({ status: 'active' })
          .eq('id', questionId);
        if (restoreError) throw restoreError;
      }
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: approved ? 'تم حذف السؤال' : 'تم رفض الطلب',
        description: approved ? 'تم حذف السؤال بنجاح' : 'تم استعادة السؤال',
      });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">طلبات الحذف</h1>
          <p className="text-muted-foreground">مراجعة طلبات حذف الأسئلة من المحررين</p>
        </div>

        {/* Requests List */}
        <div className="bg-card rounded-xl border">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات حذف معلقة</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map((request: any) => (
                <div key={request.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1 line-clamp-2">
                        {request.questions?.question_text}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        المادة: {request.questions?.subjects?.name}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          السبب: {request.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(request.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={() => handleRequestMutation.mutate({
                          requestId: request.id,
                          questionId: request.question_id,
                          approved: false,
                        })}
                        disabled={handleRequestMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                        رفض
                      </Button>
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground gap-1"
                        onClick={() => handleRequestMutation.mutate({
                          requestId: request.id,
                          questionId: request.question_id,
                          approved: true,
                        })}
                        disabled={handleRequestMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                        موافقة
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDeletionRequests;
