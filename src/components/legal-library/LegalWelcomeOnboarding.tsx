/**
 * LegalWelcomeOnboarding.tsx
 * شاشات ترحيبية تظهر عند أول دخول للمكتبة القانونية لكل جهاز فقط (تُحفظ
 * الحالة في localStorage ولا تتكرر بعد إغلاقها). مستوحاة من تسلسل العرض
 * بتطبيق "التشريعات اليمنية" المرجعي: شاشة تعريفية بالمزايا، ثم شاشة توضّح
 * أن التصفح مجاني وأن النصوص الكاملة تتطلب اشتراكاً.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronLeft, Lock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LEGAL_ONBOARDING_KEY = 'legal_library_onboarding_seen_v1';

export function hasSeenLegalOnboarding(): boolean {
  try { return localStorage.getItem(LEGAL_ONBOARDING_KEY) === '1'; } catch { return true; }
}

function markLegalOnboardingSeen() {
  try { localStorage.setItem(LEGAL_ONBOARDING_KEY, '1'); } catch { /* ignore */ }
}

const FEATURES = [
  'الوصول لجميع القوانين والتشريعات اليمنية وآخر تعديلاتها',
  'بحث متقدم بالكلمات المفتاحية أو رقم المادة مباشرة',
  'فهرس ذكي للتنقل السريع بين الأبواب والفصول',
  'حفظ موادك وقوانينك المفضلة للرجوع إليها لاحقاً',
  'نسخ نصوص المواد بنقرة واحدة',
];

export function LegalWelcomeOnboarding({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const close = () => { markLegalOnboardingSeen(); onDone(); };
  const goSubscription = () => { markLegalOnboardingSeen(); onDone(); navigate('/library/subscription'); };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f5f5] dark:bg-background p-5">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* نقاط التقدّم */}
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1].map(i => (
            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-[#1a2744] dark:bg-amber-400' : 'w-1.5 bg-border')} />
          ))}
        </div>

        {step === 0 ? (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
              <Scale className="w-10 h-10 text-amber-500" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-black text-foreground mb-3">مرحباً بك في المكتبة القانونية</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              مرجعك الشامل لكل القوانين والتشريعات اليمنية وآخر تعديلاتها، صُمم ليمنحك تجربة سهلة وسريعة بين يديك في أي وقت.
            </p>
            <div className="w-full space-y-2.5 mb-8 text-right">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground/80 leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full h-12 rounded-2xl bg-[#1a2744] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-black text-foreground mb-3">تصفح مجاناً، واشترك للوصول الكامل</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              يمكنك تصفح أقسام المكتبة وعناوين القوانين مجاناً في أي وقت. النصوص الكاملة لبعض القوانين
              <span className="inline-flex items-center gap-1 mx-1 align-middle text-amber-600 dark:text-amber-400 font-bold">
                <Lock className="w-3.5 h-3.5" /> 🔒
              </span>
              مدفوعة وتتطلب اشتراكاً شهرياً أو سنوياً.
            </p>
            <div className="w-full space-y-2.5">
              <button
                onClick={close}
                className="w-full h-12 rounded-2xl bg-[#1a2744] text-white font-black text-sm active:scale-[0.98] transition-transform"
              >
                تصفح المكتبة الآن
              </button>
              <button
                onClick={goSubscription}
                className="w-full h-11 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 font-black text-sm active:scale-[0.98] transition-transform"
              >
                عرض باقات الاشتراك
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
