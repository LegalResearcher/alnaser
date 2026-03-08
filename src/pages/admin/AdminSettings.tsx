import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, User, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSEO } from '@/components/seo/SEOHead';

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور الجديدة غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم التحديث',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsLoading(false);
  };

  return (
    <AdminLayout>
      <AdminSEO pageName="الإعدادات" />
      <div className="space-y-4 sm:space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">الإعدادات</h1>
          <p className="text-sm sm:text-base text-muted-foreground">إدارة إعدادات الحساب</p>
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <h2 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            معلومات الحساب
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs sm:text-sm">البريد الإلكتروني</Label>
              <p className="font-medium mt-1 text-sm sm:text-base break-all">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs sm:text-sm">تاريخ الإنشاء</Label>
              <p className="font-medium mt-1 text-sm sm:text-base">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl border p-4 sm:p-6">
          <h2 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            تغيير كلمة المرور
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm">كلمة المرور الجديدة</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background text-sm sm:text-base"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm">تأكيد كلمة المرور</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background text-sm sm:text-base"
                dir="ltr"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
