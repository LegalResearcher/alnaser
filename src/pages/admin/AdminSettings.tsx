import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Settings, User, Lock, Save, MessageSquare, CalendarDays, ShieldCheck, ShieldOff, CreditCard, FlaskConical, Infinity } from 'lucide-react';
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

  // ── تحكم الاشتراك المطلوب لكل مستوى ──
  const [subRequired, setSubRequired] = useState<Record<string, boolean>>({});
  const [subReqLoading, setSubReqLoading] = useState(false);

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

  // ── تحميل إعدادات الاشتراك المطلوب لكل مستوى ──
  useEffect(() => {
    if (!levels.length) return;
    (async () => {
      const keys = levels.map((l: any) => `subscription_required_${l.id}`);
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('key, value')
        .in('key', keys);
      const map: Record<string, boolean> = {};
      levels.forEach((l: any) => {
        const row = data?.find((r: any) => r.key === `subscription_required_${l.id}`);
        // الافتراضي: الاشتراك مطلوب (true)
        map[l.id] = row ? row.value === 'true' : true;
      });
      setSubRequired(map);
    })();
  }, [levels]);
  const [subFee, setSubFee] = useState('1000 ريال');
  const [subFeeLabel, setSubFeeLabel] = useState('الرسوم');
  const [subNote, setSubNote] = useState('يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.');
  const [subMsgLoading, setSubMsgLoading] = useState(false);

  // رسالة اشتراك المكتبة
  const [libFee, setLibFee] = useState('500 ريال');
  const [libFeeLabel, setLibFeeLabel] = useState('الرسوم');
  const [libNote, setLibNote] = useState('يرجى تحويل المبلغ إلى الحساب الموضح، ثم رفع صورة الإيصال وتعبئة البيانات لتأكيد الاشتراك.');
  const [libMsgLoading, setLibMsgLoading] = useState(false);

  // باقتا اشتراك المكتبة (شهري / سنوي) — تظهر في شاشة "اشتراكي" بالمكتبة القانونية
  const [planCurrency, setPlanCurrency] = useState('$');
  const [planMonthlyPrice, setPlanMonthlyPrice] = useState('4');
  const [planAnnualPrice, setPlanAnnualPrice] = useState('19');
  const [planMonthlyLabel, setPlanMonthlyLabel] = useState('اشتراك شهري');
  const [planAnnualLabel, setPlanAnnualLabel] = useState('اشتراك سنوي');
  const [planLoading, setPlanLoading] = useState(false);

  // ── إعدادات الفترة التجريبية للمكتبة ──
  const [trialDays, setTrialDays] = useState('3');
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [libraryFree, setLibraryFree] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

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
          if (parsed.fee)      setSubFee(parsed.fee);
          if (parsed.feeLabel) setSubFeeLabel(parsed.feeLabel);
          if (parsed.note)     setSubNote(parsed.note);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_subscription_message')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (parsed.fee)      setLibFee(parsed.fee);
          if (parsed.feeLabel) setLibFeeLabel(parsed.feeLabel);
          if (parsed.note)     setLibNote(parsed.note);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_subscription_plans')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (parsed.currency)     setPlanCurrency(parsed.currency);
          if (parsed.monthlyPrice) setPlanMonthlyPrice(parsed.monthlyPrice);
          if (parsed.annualPrice)  setPlanAnnualPrice(parsed.annualPrice);
          if (parsed.monthlyLabel) setPlanMonthlyLabel(parsed.monthlyLabel);
          if (parsed.annualLabel)  setPlanAnnualLabel(parsed.annualLabel);
        } catch {}
      }
    })();
  }, []);

  // ── تحميل إعدادات الفترة التجريبية ──
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('platform_settings')
        .select('value')
        .eq('key', 'library_trial_settings')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (typeof parsed.trialDays === 'number') setTrialDays(String(parsed.trialDays));
          if (typeof parsed.trialEnabled === 'boolean') setTrialEnabled(parsed.trialEnabled);
          if (typeof parsed.libraryFree === 'boolean') setLibraryFree(parsed.libraryFree);
        } catch {}
      }
    })();
  }, []);

  const saveSubscriptionMessage = async () => {
    setSubMsgLoading(true);
    const value = JSON.stringify({ fee: subFee, feeLabel: subFeeLabel, note: subNote });
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'subscription_message', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['subscription_message'] });
    setSubMsgLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث رسالة الاشتراك بنجاح' });
  };

  const saveLibrarySubscriptionMessage = async () => {
    setLibMsgLoading(true);
    const value = JSON.stringify({ fee: libFee, feeLabel: libFeeLabel, note: libNote });
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'library_subscription_message', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['library_subscription_message'] });
    setLibMsgLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث رسالة اشتراك المكتبة بنجاح' });
  };

  const saveLibrarySubscriptionPlans = async () => {
    setPlanLoading(true);
    const value = JSON.stringify({
      currency: planCurrency,
      monthlyPrice: planMonthlyPrice,
      annualPrice: planAnnualPrice,
      monthlyLabel: planMonthlyLabel,
      annualLabel: planAnnualLabel,
    });
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'library_subscription_plans', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['library_subscription_plans'] });
    setPlanLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث باقتي اشتراك المكتبة بنجاح' });
  };

  const saveTrialSettings = async () => {
    setTrialLoading(true);
    const days = parseInt(trialDays, 10);
    const value = JSON.stringify({
      trialDays: isNaN(days) || days < 1 ? 3 : days,
      trialEnabled,
      libraryFree,
    });
    await (supabase as any)
      .from('platform_settings')
      .upsert({ key: 'library_trial_settings', value }, { onConflict: 'key' });
    queryClient.invalidateQueries({ queryKey: ['library_trial_settings'] });
    setTrialLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات الفترة التجريبية بنجاح' });
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

  const saveSubRequired = async () => {
    setSubReqLoading(true);
    for (const level of levels as any[]) {
      const required = subRequired[level.id] !== false; // default true
      await (supabase as any)
        .from('platform_settings')
        .upsert({ key: `subscription_required_${level.id}`, value: String(required) }, { onConflict: 'key' });
    }
    setSubReqLoading(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث إعدادات الاشتراك لجميع المستويات' });
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">قيمة الرسوم</Label>
                <Input
                  value={subFee}
                  onChange={e => setSubFee(e.target.value)}
                  placeholder="مثال: 500 ريال"
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">تسمية الرسوم</Label>
                <Input
                  value={subFeeLabel}
                  onChange={e => setSubFeeLabel(e.target.value)}
                  placeholder="مثال: الرسوم / التكلفة"
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">مزايا الباقة</Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                اكتب كل ميزة في سطر منفصل — <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> للسطر التالي
              </p>
              <textarea
                value={subNote}
                onChange={e => setSubNote(e.target.value)}
                rows={5}
                placeholder={`مثال:\nفتح الشروحات التفصيلية والتلميحات بعد كل سؤال\nالأسئلة التجريبية وتوقعات مستخرجة لكامل المقرر\nتفعيل فوري بمجرد رفع الإيصال`}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                dir="rtl"
              />
            </div>
            {/* ── معاينة 2026 ── */}
            <div className="rounded-2xl overflow-hidden border border-border/40 shadow-card">
              {/* Header preview */}
              <div
                className="px-4 pt-4 pb-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsl(217 91% 57%) 0%, hsl(199 89% 48%) 60%, hsl(160 84% 39%) 100%)',
                }}
              >
                <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, white, transparent)' }} />
                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">معاينة</p>
                <div className="flex items-center justify-between">
                  <p className="text-white font-black text-sm">الباقة المتقدمة</p>
                  <span className="text-yellow-300 text-base">👑</span>
                </div>
                <div
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-black text-xs"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  💳 {subFeeLabel}: {subFee}
                </div>
              </div>

              {/* Features + Alerts preview */}
              {(() => {
                const allPrev = subNote.split(/\n|(?<=\.)(?=\s*\S)/).map(l => l.trim()).filter(Boolean);
                const features = allPrev.filter(l => !l.endsWith('**'));
                const alerts   = allPrev.filter(l => l.endsWith('**')).map(l => l.slice(0, -2).trim());
                return (
                  <div className="p-3.5 bg-card space-y-2.5">
                    {/* مزايا */}
                    {features.length > 0 && (
                      <>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          ✦ مزايا الباقة المتقدمة
                        </p>
                        <div className="space-y-1.5">
                          {features.map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div
                                className="mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-primary"
                                style={{ background: 'hsl(var(--primary) / 0.1)' }}
                              >
                                <span className="text-[9px]">✓</span>
                              </div>
                              <span className="text-[11px] text-foreground/80 leading-snug font-medium">
                                {line}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {/* تنبيهات */}
                    {alerts.length > 0 && (
                      <div className="rounded-xl overflow-hidden">
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5"
                          style={{ background: 'linear-gradient(135deg, hsl(38 92% 50%), hsl(45 96% 58%))' }}
                        >
                          <span className="text-xs">⚠️</span>
                          <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">تنبيه مهم</span>
                        </div>
                        <div
                          className="px-3 py-2 space-y-1.5"
                          style={{
                            background: 'hsl(38 92% 50% / 0.06)',
                            border: '1px solid hsl(38 92% 50% / 0.2)',
                            borderTop: 'none',
                            borderRadius: '0 0 0.75rem 0.75rem',
                          }}
                        >
                          {alerts.map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div
                                className="mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 text-[9px] font-black"
                                style={{ background: 'hsl(38 92% 50% / 0.15)', color: 'hsl(38 92% 38%)' }}
                              >!</div>
                              <span className="text-[11px] font-semibold leading-snug" style={{ color: 'hsl(38 60% 28%)' }}>
                                {line}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!subNote.trim() && (
                      <p className="text-[11px] text-muted-foreground/50 italic">
                        اكتب مزايا الباقة أعلاه — الجمل المنتهية بـ ** تظهر كتنبيه
                      </p>
                    )}
                  </div>
                );
              })()}
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

        {/* ── رسالة اشتراك المكتبة ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            رسالة اشتراك المكتبة
          </h2>
          <p className="text-xs text-muted-foreground mb-4">النص الذي يظهر عند طلب الاشتراك في المكتبة (مستقل عن رسالة الاشتراك في الاختبارات)</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">قيمة الرسوم</Label>
                <Input
                  value={libFee}
                  onChange={e => setLibFee(e.target.value)}
                  placeholder="مثال: 500 ريال"
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">تسمية الرسوم</Label>
                <Input
                  value={libFeeLabel}
                  onChange={e => setLibFeeLabel(e.target.value)}
                  placeholder="مثال: الرسوم / التكلفة"
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">مزايا باقة المكتبة</Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                اكتب كل ميزة في سطر منفصل — <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> للسطر التالي
              </p>
              <textarea
                value={libNote}
                onChange={e => setLibNote(e.target.value)}
                rows={5}
                placeholder={`مثال:\nالوصول الكامل لجميع الملفات والوثائق القانونية\nتحميل الملفات بدون قيود\nتفعيل فوري بمجرد رفع الإيصال`}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                dir="rtl"
              />
            </div>
            <Button
              onClick={saveLibrarySubscriptionMessage}
              disabled={libMsgLoading}
              className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {libMsgLoading ? 'جاري الحفظ...' : 'حفظ رسالة المكتبة'}
            </Button>
          </div>
        </div>

        {/* ── باقتا اشتراك المكتبة (شهري / سنوي) ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            باقتا اشتراك المكتبة (شهري / سنوي)
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            الأسعار التي تظهر في شاشة "اشتراكي" بالمكتبة القانونية عند اختيار باقة شهرية أو سنوية.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">رمز العملة</Label>
              <Input
                value={planCurrency}
                onChange={e => setPlanCurrency(e.target.value)}
                placeholder="مثال: $ / ريال"
                className="bg-background text-sm w-32"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">تسمية الباقة الشهرية</Label>
                <Input
                  value={planMonthlyLabel}
                  onChange={e => setPlanMonthlyLabel(e.target.value)}
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">سعر الباقة الشهرية</Label>
                <Input
                  value={planMonthlyPrice}
                  onChange={e => setPlanMonthlyPrice(e.target.value)}
                  placeholder="مثال: 4"
                  className="bg-background text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">تسمية الباقة السنوية</Label>
                <Input
                  value={planAnnualLabel}
                  onChange={e => setPlanAnnualLabel(e.target.value)}
                  className="bg-background text-sm"
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">سعر الباقة السنوية</Label>
                <Input
                  value={planAnnualPrice}
                  onChange={e => setPlanAnnualPrice(e.target.value)}
                  placeholder="مثال: 19"
                  className="bg-background text-sm"
                  dir="ltr"
                />
              </div>
            </div>
            <Button
              onClick={saveLibrarySubscriptionPlans}
              disabled={planLoading}
              className="gradient-primary text-primary-foreground border-0 gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {planLoading ? 'جاري الحفظ...' : 'حفظ باقتي الاشتراك'}
            </Button>
          </div>
        </div>

        {/* ── تحكم الاشتراك لكل مستوى ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            تحكم الاشتراك لكل مستوى
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            عند تفعيل الاشتراك يُطلب من الطالب رمز التفعيل للدخول. عند الإيقاف يدخل الطالب مجاناً بدون رمز.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {(levels as any[]).map((level) => {
              const required = subRequired[level.id] !== false;
              return (
                <button
                  key={level.id}
                  onClick={() => setSubRequired(prev => ({ ...prev, [level.id]: !required }))}
                  className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200 text-right ${
                    required
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-green-500 bg-green-500/10 text-green-600'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{level.name}</p>
                    <p className={`text-[11px] mt-0.5 ${required ? 'text-primary/70' : 'text-green-500/80'}`}>
                      {required ? 'الاشتراك مطلوب — رمز التفعيل إلزامي' : 'الدخول مجاني — بدون رمز تفعيل'}
                    </p>
                  </div>
                  <div className={`w-10 h-6 rounded-full flex items-center transition-all duration-300 px-0.5 ${
                    required ? 'bg-primary justify-end' : 'bg-green-500 justify-start'
                  }`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </button>
              );
            })}
          </div>
          <Button
            onClick={saveSubRequired}
            disabled={subReqLoading}
            className="gradient-primary text-primary-foreground border-0 gap-2"
          >
            <Save className="w-4 h-4" />
            {subReqLoading ? 'جاري الحفظ...' : 'حفظ إعدادات الاشتراك'}
          </Button>
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

        {/* ── إعدادات الفترة التجريبية للمكتبة ── */}
        <div className="bg-card rounded-xl border p-4 sm:p-6" dir="rtl">
          <h2 className="font-bold mb-1 flex items-center gap-2 text-sm sm:text-base">
            <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
            إعدادات الفترة التجريبية للمكتبة القانونية
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            تحكم في مدة التجربة المجانية، أو أوقفها، أو افتح المكتبة مجاناً للجميع بدون قيود.
          </p>

          {/* الوضع: مفتوح مجاناً */}
          <div className="space-y-3 mb-5">
            <button
              type="button"
              onClick={() => setLibraryFree(v => !v)}
              className={`w-full flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-200 text-right ${
                libraryFree
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-emerald-400/40'
              }`}
            >
              <div>
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <Infinity className="w-4 h-4" />
                  المكتبة مفتوحة مجاناً للجميع
                </p>
                <p className="text-[11px] mt-0.5 opacity-70">
                  {libraryFree ? 'مفعّل — جميع المستخدمين يدخلون بدون قيود أو تجربة' : 'معطّل — يعمل نظام التجربة والاشتراك بشكل طبيعي'}
                </p>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center transition-all duration-300 px-0.5 shrink-0 ${
                libraryFree ? 'bg-emerald-500 justify-end' : 'bg-muted-foreground/30 justify-start'
              }`}>
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
              </div>
            </button>
          </div>

          {/* الفترة التجريبية — تظهر فقط إذا لم تكن مجانية */}
          {!libraryFree && (
            <div className="space-y-4 border-t pt-4">
              {/* تفعيل/إيقاف التجربة */}
              <button
                type="button"
                onClick={() => setTrialEnabled(v => !v)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3.5 transition-all duration-200 text-right ${
                  trialEnabled
                    ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                    : 'border-border bg-muted/40 text-muted-foreground hover:border-violet-400/40'
                }`}
              >
                <div>
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4" />
                    الفترة التجريبية المجانية
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-70">
                    {trialEnabled
                      ? 'مفعّلة — يحصل كل زائر جديد على فترة تجريبية'
                      : 'معطّلة — يُطلب الاشتراك مباشرة بدون تجربة'}
                  </p>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-all duration-300 px-0.5 shrink-0 ${
                  trialEnabled ? 'bg-violet-500 justify-end' : 'bg-muted-foreground/30 justify-start'
                }`}>
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                </div>
              </button>

              {/* مدة التجربة */}
              {trialEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-bold">مدة الفترة التجريبية (بالأيام)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={trialDays}
                      onChange={e => setTrialDays(e.target.value)}
                      className="bg-background text-sm w-28 text-center font-black text-lg"
                      dir="ltr"
                    />
                    <span className="text-sm text-muted-foreground font-medium">يوم</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 3, 7, 14, 30].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTrialDays(String(d))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            trialDays === String(d)
                              ? 'bg-violet-500 text-white border-violet-500'
                              : 'border-border text-muted-foreground hover:border-violet-400'
                          }`}
                        >
                          {d} {d === 1 ? 'يوم' : 'أيام'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ التغيير يؤثر على المستخدمين الجدد فقط — من بدأ تجربته مسبقاً تظل مدته بالأيام التي بدأ بها.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={saveTrialSettings}
            disabled={trialLoading}
            className="gradient-primary text-primary-foreground border-0 gap-2 mt-5"
          >
            <Save className="w-4 h-4" />
            {trialLoading ? 'جاري الحفظ...' : 'حفظ إعدادات التجربة'}
          </Button>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
