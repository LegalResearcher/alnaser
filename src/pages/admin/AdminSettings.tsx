import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, User, Lock, Save, MessageSquare, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient, useQuery } from '@tanstack/react-query';
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

  // ── جلب المستويات ──
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data } = await supabase.from('levels').select('id, name').order('order_index');
      return data ?? [];
    },
  });

  // ── سنوات النماذج لكل مستوى ──
  // { [levelId]: number[] }
  const [levelYears, setLevelYears] = useState<Record<string, number[]>>({});
  const [yearsLoading, setYearsLoading] = useState(false);
  const [activeLevelTab, setActiveLevelTab] = useState<string>('');

  useEffect(() => {
    if (!levels.length) return;
    if (!activeLevelTab) setActiveLevelTab((levels[0] as any).id);
    (async () => {
      const keys = levels.map((l: any) => `enabled_exam_years_${l.id}`);
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('key, value')
        .in('key', keys);
      const map: Record<string, number[]> = {};
      levels.forEach((l: any) => {
        const row = data?.find((r: any) => r.key === `enabled_exam_years_${l.id}`);
        try { map[l.id] = row ? JSON.parse(row.value) : [...ALL_EXAM_YEARS]; }
        catch { map[l.id] = [...ALL_EXAM_YEARS]; }
      });
      setLevelYears(map);
    })();
  }, [levels]);
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

  const toggleYear = (levelId: string, year: number) => {
    setLevelYears(prev => {
      const cur = prev[levelId] ?? [...ALL_EXAM_YEARS];
      return {
        ...prev,
        [levelId]: cur.includes(year) ? cur.filter(y => y !== year) : [...cur, year].sort(),
      };
    });
  };

  const saveEnabledYears = async () => {
    setYearsLoading(true);
    for (const level of levels as any[]) {
      const years = levelYears[level.id] ?? [...ALL_EXAM_YEARS];
      await (supabase as any)
        .from('platform_settings')
        .upsert({ key: `enabled_exam_years_${level.id}`, value: JSON.stringify(years) }, { onConflict: 'key' });
      queryClient.invalidateQueries({ queryKey: ['enabled_exam_years', level.id] });
    }
    setYearsLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث سنوات النماذج لجميع المستويات' });
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
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3.5 border border-blue-100 dark:border-blue-800/40 space-y-2">
              <p className="text-xs font-black text-blue-700 dark:text-blue-400">💰 الرسوم: <span className="text-base">{subFee}</span></p>
              <div className="border-t border-blue-200 dark:border-blue-700 pt-2 space-y-1">
                {subNote.split('\n').map((line, i) =>
                  line.trim() ? (
                    <p key={i} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed flex items-start gap-1">
                      <span className="mt-0.5 shrink-0">•</span>
                      <span>{line.trim()}</span>
                    </p>
                  ) : null
                )}
              </div>
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

        {/* ── سنوات النماذج لكل مستوى ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            سنوات النماذج المتاحة للطلاب
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            حدد السنوات التي تظهر لكل مستوى عند اختيار نموذج سنة الاختبار. السنوات غير المحددة لن تظهر.
          </p>

          {/* تبويبات المستويات */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(levels as any[]).map((level) => (
              <button
                key={level.id}
                onClick={() => setActiveLevelTab(level.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  activeLevelTab === level.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>

          {/* شبكة السنوات للمستوى المختار */}
          {activeLevelTab && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                {[...ALL_EXAM_YEARS].map((year) => {
                  const active = (levelYears[activeLevelTab] ?? [...ALL_EXAM_YEARS]).includes(year);
                  return (
                    <button
                      key={year}
                      onClick={() => toggleYear(activeLevelTab, year)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 px-2 font-bold text-sm transition-all duration-200 select-none ${
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
              <p className="text-xs text-muted-foreground mb-3">
                {(levelYears[activeLevelTab] ?? ALL_EXAM_YEARS).length} من {ALL_EXAM_YEARS.length} سنوات مفعّلة لهذا المستوى
              </p>
            </>
          )}

          <Button
            onClick={saveEnabledYears}
            disabled={yearsLoading}
            className="gradient-primary text-primary-foreground border-0 gap-2"
          >
            <Save className="w-4 h-4" />
            {yearsLoading ? 'جاري الحفظ...' : 'حفظ السنوات لجميع المستويات'}
          </Button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
