/**
 * LegalSubscription.tsx — شاشة "اشتراكي" بالمكتبة القانونية (/library/subscription)
 *
 * - تعرض حالة الاشتراك الحالية (مشترك / غير مشترك) عبر useIsPremiumUnlocked
 *   (نفس آلية review_passwords + device_fingerprint المستخدمة في باقي المكتبة).
 * - تعرض باقتي الاشتراك (شهري / سنوي) بأسعار فعلية قابلة للتعديل من لوحة
 *   التحكم (platform_settings.library_subscription_plans عبر useLibrarySubscriptionPlans).
 * - عند الضغط على أي باقة يُفتح نفس مودال الاشتراك المستخدم في باقي المكتبة
 *   (LibrarySubscriptionModal من components/shared/LibrarySubscriptionModals)
 *   بلا أي منطق جديد: الاسم، رقم الهاتف، اختيار المحفظة، رفع صورة الإيصال، إرسال.
 * - من لديه رمز تفعيل فعلاً (اشترك سابقاً وتسلّم الرمز من الإدارة) يضغط
 *   "إدخال رمز التفعيل" ليفتح نفس LibraryPasswordModal الموجود بالفعل.
 */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Crown, Lock, KeyRound, MessageSquareText, CheckCircle2, Gift, Calendar, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsPremiumUnlocked } from '@/hooks/useLegalLibrary';
import { useLibrarySubscriptionMessage, useLibrarySubscriptionPlans } from '@/hooks/useLibrarySubscriptionMessage';
import { LibraryPasswordModal, LibrarySubscriptionModal } from '@/components/shared/LibrarySubscriptionModals';
import { getLegalTrialDates, formatDate, TRIAL_DAYS } from '@/components/legal-library/LegalWelcomeOnboarding';

export default function LegalSubscription() {
  const navigate = useNavigate();
  const { isPremiumUnlocked, setIsPremiumUnlocked, checked, subscriptionDates } = useIsPremiumUnlocked();
  const subMsg = useLibrarySubscriptionMessage();
  const plans = useLibrarySubscriptionPlans();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ fileName: string; fee: string } | null>(null);

  const trialDates = getLegalTrialDates();
  const trialDaysLeft = trialDates ? Math.max(0, Math.ceil((trialDates.end.getTime() - Date.now()) / 86400000)) : 0;
  const trialActive = !!trialDates && trialDaysLeft > 0;
  const trialProgressPct = trialDates ? Math.min(100, Math.max(0, ((TRIAL_DAYS - trialDaysLeft) / TRIAL_DAYS) * 100)) : 0;

  const subTotalDays = subscriptionDates?.end
    ? Math.max(1, Math.round((subscriptionDates.end.getTime() - subscriptionDates.start.getTime()) / 86400000))
    : 0;
  const subDaysLeft = subscriptionDates?.end
    ? Math.max(0, Math.ceil((subscriptionDates.end.getTime() - Date.now()) / 86400000))
    : 0;
  const subActive = !subscriptionDates ? false : (subscriptionDates.end ? subDaysLeft > 0 : true);
  const subProgressPct = subscriptionDates?.end && subTotalDays > 0
    ? Math.min(100, Math.max(0, ((subTotalDays - subDaysLeft) / subTotalDays) * 100))
    : 100;

  const allLines = subMsg.note.split(/\n|(?<=\.)(?=\s*\S)/).map((l: string) => l.trim()).filter(Boolean);
  const featureLines = allLines.filter((l: string) => !l.endsWith('**'));

  const choosePlan = (label: string, price: string) => {
    const fee = `${price}${plans.currency}`;
    setSelectedPlan({ fileName: `${label} — ${fee}`, fee });
  };

  return (
    <MainLayout>
      {/* الهيدر الكحلي */}
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">اشتراكي</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-6 pb-16 space-y-6">
        {/* بطاقة الحالة */}
        <div className={cn(
          'rounded-2xl border p-5 text-center',
          isPremiumUnlocked
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
        )}>
          <div className={cn(
            'w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center',
            isPremiumUnlocked ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
          )}>
            {isPremiumUnlocked
              ? <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              : <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          </div>
          {!checked ? (
            <p className="text-sm font-bold text-muted-foreground">جارٍ التحقق من حالة الاشتراك…</p>
          ) : isPremiumUnlocked ? (
            <>
              <p className="font-black text-base text-emerald-700 dark:text-emerald-400">أنت مشترك حالياً</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-1">
                لديك وصول كامل لجميع نصوص المكتبة القانونية على هذا الجهاز
              </p>
            </>
          ) : (
            <>
              <p className="font-black text-base text-amber-700 dark:text-amber-400">لا يوجد اشتراك مدفوع حتى الآن</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
                يمكنك تصفح المكتبة مجاناً، ويتطلب الوصول الكامل للنصوص المدفوعة اشتراكاً
              </p>
            </>
          )}
        </div>

        {/* بطاقة الاشتراك المدفوع — نفس منطق وتصميم بطاقة التجربة، تبقى ظاهرة دائماً */}
        {isPremiumUnlocked && subscriptionDates && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black',
                subActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {subActive ? 'نشط' : 'منتهي'}
              </span>
              <div className="flex items-center gap-2.5">
                <p className="font-black text-foreground">اشتراكك المدفوع</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* شريط التقدّم وعداد الأيام — فقط إن كان للاشتراك تاريخ انتهاء محدد */}
            {subscriptionDates.end ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground">{subTotalDays} يوم</span>
                  <span className={cn(
                    'text-xs font-black',
                    subActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  )}>
                    {subActive ? `متبقي ${subDaysLeft} يوم` : 'انتهت المدة'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${subProgressPct}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4">اشتراك ساري بلا تاريخ انتهاء محدد</p>
            )}

            <div className="border-t border-border pt-3 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-foreground">{formatDate(subscriptionDates.start)}</span>
                <span className="text-xs font-bold text-muted-foreground">بداية الاشتراك:</span>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              {subscriptionDates.end && (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-foreground">{formatDate(subscriptionDates.end)}</span>
                  <span className="text-xs font-bold text-muted-foreground">نهاية الاشتراك:</span>
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>

            {!subActive && (
              <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-2.5 text-right">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                  انتهت مدة اشتراكك. جدّد الاشتراك لمواصلة الوصول الكامل لنصوص المكتبة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* بطاقة التجربة المجانية — تبقى ظاهرة دائماً (وليس فقط أول مرة) */}
        {!isPremiumUnlocked && trialDates && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black',
                trialActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {trialActive ? 'نشطة' : 'منتهية'}
              </span>
              <div className="flex items-center gap-2.5">
                <p className="font-black text-foreground">التجربة المجانية</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* شريط التقدّم وعداد الأيام */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-muted-foreground">{TRIAL_DAYS} أيام</span>
                <span className={cn(
                  'text-xs font-black',
                  trialActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                )}>
                  {trialActive ? `متبقي ${trialDaysLeft} يوم` : 'انتهت المدة'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${trialProgressPct}%` }} />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-foreground">{formatDate(trialDates.start)}</span>
                <span className="text-xs font-bold text-muted-foreground">بداية التجربة:</span>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-foreground">{formatDate(trialDates.end)}</span>
                <span className="text-xs font-bold text-muted-foreground">نهاية التجربة:</span>
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            {!trialActive && (
              <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-2.5 text-right">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                  انتهت فترة تجربتك المجانية. اشترك الآن لمواصلة الوصول الكامل لنصوص المكتبة.
                </p>
              </div>
            )}
          </div>
        )}

        {/* إدخال رمز تفعيل لمن اشترك مسبقاً */}
        {!isPremiumUnlocked && (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-[#1a2744] dark:border-white/30 text-[#1a2744] dark:text-white font-black text-sm"
          >
            <KeyRound className="w-4 h-4" />
            لديّ رمز تفعيل — إدخاله الآن
          </button>
        )}

        {/* مزايا الاشتراك */}
        {featureLines.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <p className="text-sm font-black text-foreground mb-1">مزايا الاشتراك المدفوع</p>
            {featureLines.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-right">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground leading-relaxed">{line}</span>
              </div>
            ))}
          </div>
        )}

        {/* باقات الاشتراك */}
        {!isPremiumUnlocked && (
          <div className="space-y-3">
            <p className="text-sm font-black text-foreground text-center">باقات الاشتراك</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => choosePlan(plans.monthlyLabel, plans.monthlyPrice)}
                className="rounded-2xl border-2 border-border bg-card p-4 text-center hover:border-[#1a2744]/40 transition-colors"
              >
                <p className="text-sm font-black text-foreground">{plans.monthlyLabel}</p>
                <p className="mt-2 text-2xl font-black text-[#1a2744] dark:text-white" dir="ltr">
                  {plans.currency}{plans.monthlyPrice}
                </p>
              </button>
              <button
                onClick={() => choosePlan(plans.annualLabel, plans.annualPrice)}
                className="relative rounded-2xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center"
              >
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-[10px] font-black text-amber-950 whitespace-nowrap">
                  الأكثر توفيراً
                </span>
                <p className="text-sm font-black text-foreground">{plans.annualLabel}</p>
                <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400" dir="ltr">
                  {plans.currency}{plans.annualPrice}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* تواصل معنا */}
        <a
          href={`https://t.me/MuenAlnaser?text=${encodeURIComponent('استفسار بخصوص الاشتراك في المكتبة القانونية — منصة الناصر القانونية\nhttps://alnaseer.org')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-bold hover:text-foreground transition-colors"
        >
          <MessageSquareText className="w-4 h-4" />
          لديك استفسار؟ تواصل معنا
        </a>
      </div>

      {showPasswordModal && (
        <LibraryPasswordModal
          onSuccess={() => { setIsPremiumUnlocked(true); setShowPasswordModal(false); }}
          onSubscribe={() => setShowPasswordModal(false)}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      {selectedPlan && (
        <LibrarySubscriptionModal
          fileName={selectedPlan.fileName}
          feeOverride={selectedPlan.fee}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </MainLayout>
  );
}
