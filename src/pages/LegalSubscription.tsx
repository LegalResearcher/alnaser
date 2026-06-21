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
import { ChevronRight, Crown, Lock, KeyRound, MessageSquareText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsPremiumUnlocked } from '@/hooks/useLegalLibrary';
import { useLibrarySubscriptionMessage, useLibrarySubscriptionPlans } from '@/hooks/useLibrarySubscriptionMessage';
import { LibraryPasswordModal, LibrarySubscriptionModal } from '@/components/shared/LibrarySubscriptionModals';

export default function LegalSubscription() {
  const navigate = useNavigate();
  const { isPremiumUnlocked, setIsPremiumUnlocked, checked } = useIsPremiumUnlocked();
  const subMsg = useLibrarySubscriptionMessage();
  const plans = useLibrarySubscriptionPlans();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ fileName: string; fee: string } | null>(null);

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
