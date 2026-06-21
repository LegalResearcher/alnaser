/**
 * LegalLimitedAccessModals.tsx
 * كل مكونات "وضع الاستخدام المجاني المحدود" بعد انتهاء التجربة المجانية:
 *
 * 1) TrialEndedScreen — شاشة كاملة (صورة 1) تظهر عند انتهاء التجربة المجانية
 *    وعدم وجود اشتراك فعّال ولم يختر المستخدم وضع الاستخدام المحدود بعد.
 *    زرّان: "الانتقال إلى شاشة تفعيل الاشتراك" (المنطق الحالي، بلا تغيير)
 *    و"مواصلة الاستخدام المجاني المحدود" (يفتح LimitedUsageModal).
 *
 * 2) LimitedUsageModal — مودال (صورة 2) يوضّح أن الاستخدام المجاني متاح
 *    بمزايا محدودة. زر "الدخول للتطبيق" يُفعّل isLimitedMode فعلياً.
 *
 * 3) FeatureLockedModal — نافذة "عذرًا" المصغّرة (صورة 3) تظهر عند محاولة
 *    استخدام مزايا محجوبة في الوضع المحدود (بحث / نسخ / مفضلة).
 */
import { useNavigate } from 'react-router-dom';
import { Award, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from './LegalWelcomeOnboarding';

// ─────────────────────────────────────────────────────────────
// 1) شاشة انتهاء التجربة المجانية (صورة 1)
// ─────────────────────────────────────────────────────────────
export function TrialEndedScreen({
  trialDates, onGoSubscribe, onContinueLimited,
}: {
  trialDates: { start: Date; end: Date } | null;
  onGoSubscribe: () => void;
  onContinueLimited: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-background">
      <div className="bg-teal-50 dark:bg-teal-950/40 sticky top-0 z-10">
        <div className="max-w-sm mx-auto py-5 px-5 text-center">
          <h1 className="text-lg font-black text-foreground">التجربة المجانية</h1>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-5 py-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full border-[3px] border-teal-500 flex items-center justify-center mb-8">
          <Award className="w-10 h-10 text-teal-600" strokeWidth={1.75} />
        </div>

        <div className="w-full rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 mb-7">
          <p className="font-black text-rose-600 dark:text-rose-400 mb-2">عـــذراً لقد انتهت فترة التجربة المجانية</p>
          <p className="text-xs font-semibold text-rose-500/90 dark:text-rose-400/80 leading-relaxed">
            سبق لكم الاستفادة من التجربة المجانية على هذا الهاتف وذلك خلال الفترة من{' '}
            {trialDates ? formatDate(trialDates.start) : ''} إلى {trialDates ? formatDate(trialDates.end) : ''}
          </p>
        </div>

        <p className="text-sm font-bold text-foreground leading-relaxed mb-5">
          للاستمرار في استخدام التطبيق والاستفادة من جميع المميزات، يرجى تفعيل الاشتراك السنوي
        </p>

        <button
          onClick={onGoSubscribe}
          className="w-full h-12 rounded-2xl bg-[#5b3a29] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-6"
        >
          🔑 الانتقال إلى شاشة تفعيل الاشتراك
        </button>

        <div className="w-full border-t border-border pt-6">
          <p className="text-xs font-bold text-muted-foreground leading-relaxed mb-4">
            كما يمكنكم الاستمرار في استخدام التطبيق مجاناً ولكن بمزايا محدودة
          </p>
          <button
            onClick={onContinueLimited}
            className="w-full h-11 rounded-2xl border border-border text-foreground font-black text-sm flex items-center justify-center gap-2"
          >
            🔒 مواصلة الاستخدام المجاني المحدود
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2) مودال "الاستخدام المجاني المحدود" (صورة 2)
// ─────────────────────────────────────────────────────────────
export function LimitedUsageModal({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">🔓</span>
          </div>
          <h3 className="font-black text-foreground text-base">الاستخدام المجاني المحدود</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            يمكنك الدخول للتطبيق واستخدامه مجاناً بمزايا محدودة
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            للاستفادة من جميع المميزات، يمكنك تفعيل الاشتراك في أي وقت
          </p>
          <button
            onClick={onEnter}
            className="w-full h-12 rounded-2xl bg-teal-600 text-white font-black text-sm active:scale-[0.98] transition-transform mt-2"
          >
            الدخول للتطبيق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3) نافذة "عذرًا" المصغّرة — مزايا محجوبة في الوضع المحدود (صورة 3)
// ─────────────────────────────────────────────────────────────
export function FeatureLockedModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xs bg-card rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
        <h3 className="font-black text-foreground text-lg">عـــذراً</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          هذه الميزة متاحة لمشتركي النسخة المدفوعة فقط.
          <br />
          قم بترقية حسابك الآن للوصول إلى جميع المزايا المتقدمة
        </p>
        <div className="flex items-center justify-center gap-4 pt-1">
          <button onClick={onClose} className="text-sm font-bold text-muted-foreground px-3 py-2">
            حسناً
          </button>
          <button
            onClick={() => { onClose(); navigate('/library/subscription'); }}
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-black"
          >
            تفعيل الاشتراك
          </button>
        </div>
      </div>
    </div>
  );
}
