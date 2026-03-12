import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Trash2, Mail, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AdminSEO } from '@/components/seo/SEOHead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminUsers = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data: editors = [], isLoading } = useQuery({
    queryKey: ['editors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'editor');
      if (error) throw error;
      return data;
    },
  });

  const addEditorMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('create-editor', {
        body: { email, password },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast({ title: 'تم إضافة المحرر بنجاح' });
      setIsDialogOpen(false);
      setEmail('');
      setPassword('');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إضافة المحرر',
        variant: 'destructive',
      });
    },
  });

  const deleteEditorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast({ title: 'تم حذف المحرر' });
      setDeleteUser(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    addEditorMutation.mutate({ email, password });
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="إدارة المستخدمين" />
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">إدارة المستخدمين</h1>
            <p className="text-sm sm:text-base text-muted-foreground">إضافة وإدارة المحررين</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            إضافة محرر
          </Button>
        </div>

        {/* Current Admin */}
        <div className="bg-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base truncate">{currentUser?.email}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">مسؤول (Admin)</p>
            </div>
            <span className="px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-medium rounded-full shrink-0">
              أنت
            </span>
          </div>
        </div>

        {/* Editors List */}
        <div className="bg-card rounded-xl border">
          <div className="p-3 sm:p-4 border-b">
            <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              المحررون ({editors.length})
            </h2>
          </div>
          {isLoading ? (
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 sm:h-16 rounded-lg" />
              ))}
            </div>
          ) : editors.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-muted-foreground">
              <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">لا يوجد محررون</p>
            </div>
          ) : (
            <div className="divide-y">
              {editors.map((editor) => (
                <div key={editor.id} className="p-3 sm:p-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate" dir="ltr">{editor.user_id}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">محرر (Editor)</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                    onClick={() => setDeleteUser(editor)}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">إضافة محرر جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 bg-background text-sm sm:text-base"
                  dir="ltr"
                  placeholder="editor@example.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background text-sm sm:text-base"
                dir="ltr"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={addEditorMutation.isPending}
                className="gradient-primary text-primary-foreground border-0 w-full sm:w-auto"
              >
                {addEditorMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm sm:text-base">
              هل أنت متأكد من حذف هذا المحرر؟ لن يتمكن من الوصول للوحة التحكم بعد الآن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row-reverse gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteEditorMutation.mutate(deleteUser.user_id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
