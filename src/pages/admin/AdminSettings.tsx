import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, User, Lock, Save, MessageSquare, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSEO } from '@/components/seo/SEOHead';
import { ALL_EXAM_YEARS } from '@/types/database';

const AdminSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── سنوات النماذج ──
  const [enabledYears, setEnabledYears] = useState<number[]>([...ALL_EXAM_YEARS]);
  const [yearsLoading, setYearsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'enabled_exam_years')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed)) setEnabledYears(parsed);
        } catch {}
      }
    })();
  }, []);
  const [subFee, setSubFee] = useState('1000 ريال');
  const [subNote, setSubNote] = useState('يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.');
  const [subMsgLoading, setSubMsgLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'subscription_message')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (parsed.fee)  setSubFee(parsed.fee);
          if (parsed.note) setSubNote(parsed.note);
        } catch {}
      }
    })();
  }, []);

  const saveSubscriptionMessage = async () => {
    setSubMsgLoading(true);
    const value = JSON.stringify({ fee: subFee, note: subNote });
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'subscription_message', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['subscription_message'] });
    setSubMsgLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث رسالة الاشتراك بنجاح' });
  };

  const toggleYear = (year: number) => {
    setEnabledYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort()
    );
  };

  const saveEnabledYears = async () => {
    setYearsLoading(true);
    const value = JSON.stringify(enabledYears);
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'enabled_exam_years', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['enabled_exam_years'] });
    setYearsLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث سنوات النماذج بنجاح' });
  };

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

        {/* ── رسالة الاشتراك ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            رسالة الاشتراك
          </h2>
          <p className="text-xs text-muted-foreground mb-4">النص الذي يظهر في المستطيل الأزرق عند طلب الاشتراك</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">الرسوم (السطر العلوي بالخط العريض)</Label>
              <Input
                value={subFee}
                onChange={e => setSubFee(e.target.value)}
                placeholder="مثال: 1000 ريال"
                className="bg-background text-sm"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">النص التوضيحي (السطر السفلي)</Label>
              <textarea
                value={subNote}
                onChange={e => setSubNote(e.target.value)}
                rows={3}
                placeholder="مثال: يرجى تحويل المبلغ إلى الحساب الموضح..."
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
            </div>
            {/* معاينة */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3.5 border border-blue-100 dark:border-blue-800/40">
              <p className="text-xs font-black text-blue-700 dark:text-blue-400 mb-1.5">💰 الرسوم: <span className="text-base">{subFee}</span></p>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed">💡 {subNote}</p>
            </div>
            <Button
              onClick={saveSubscriptionMessage}
              disabled={subMsgLoading}
              className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {subMsgLoading ? 'جاري الحفظ...' : 'حفظ الرسالة'}
            </Button>
          </div>
        </div>

        {/* ── سنوات النماذج ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            سنوات النماذج المتاحة للطلاب
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            حدد السنوات التي تظهر للطالب عند اختيار نموذج سنة الاختبار. السنوات غير المحددة لن تظهر.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {[...ALL_EXAM_YEARS].map((year) => {
              const active = enabledYears.includes(year);
              return (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 px-2 font-bold text-sm transition-all duration-200 select-none ${
                    active
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <span className="text-base font-black">{year}</span>
                  <span className={`text-[10px] font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {active ? '✓ مفعّل' : 'مخفي'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={saveEnabledYears}
              disabled={yearsLoading}
              className="gradient-primary text-primary-foreground border-0 gap-2"
            >
              <Save className="w-4 h-4" />
              {yearsLoading ? 'جاري الحفظ...' : 'حفظ السنوات'}
            </Button>
            <span className="text-xs text-muted-foreground">
              {enabledYears.length} من {ALL_EXAM_YEARS.length} سنوات مفعّلة
            </span>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
