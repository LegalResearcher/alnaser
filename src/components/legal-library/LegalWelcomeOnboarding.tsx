/**
 * LegalWelcomeOnboarding.tsx
 * تسلسل ترحيبي من 3 شاشات يظهر عند أول دخول للمكتبة القانونية لكل جهاز فقط
 * (تُحفظ الحالة في localStorage ولا تتكرر بعد إغلاقها)، مطابق لتسلسل العرض
 * بتطبيق "التشريعات اليمنية" المرجعي:
 *  1) ترحيب + أهم المميزات.
 *  2) إعلان التجربة المجانية (3 أيام).
 *  3) تفاصيل الاشتراك (حالة التجربة + تاريخ البدء/الانتهاء) مع زر الانتقال
 *     لتفعيل الاشتراك المدفوع — والذي يفتح شاشة "اشتراكي" الحالية في
 *     المكتبة (LegalSubscription.tsx) دون أي تعديل على منطقها.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight, Award, PlayCircle, KeyRound, CheckCircle2 } from 'lucide-react';

export const LEGAL_ONBOARDING_KEY = 'legal_library_onboarding_seen_v1';
const LEGAL_TRIAL_START_KEY = 'legal_library_trial_start_v1';
const TRIAL_DAYS = 3;

export function hasSeenLegalOnboarding(): boolean {
  try { return localStorage.getItem(LEGAL_ONBOARDING_KEY) === '1'; } catch { return true; }
}

function markLegalOnboardingSeen() {
  try { localStorage.setItem(LEGAL_ONBOARDING_KEY, '1'); } catch { /* ignore */ }
}

/** يثبّت تاريخ بدء التجربة المجانية لمرّة واحدة فقط لكل جهاز، ويعيد تاريخي البدء والانتهاء */
function ensureTrialStarted(): { start: Date; end: Date } {
  let startIso: string | null = null;
  try { startIso = localStorage.getItem(LEGAL_TRIAL_START_KEY); } catch { /* ignore */ }
  if (!startIso) {
    startIso = new Date().toISOString();
    try { localStorage.setItem(LEGAL_TRIAL_START_KEY, startIso); } catch { /* ignore */ }
  }
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { start, end };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

const FEATURES = [
  'الوصول لجميع القوانين والتشريعات اليمنية وآخر تعديلاتها بدون اتصال بالإنترنت',
  'بحث متقدم بالكلمات المفتاحية أو رقم المادة مباشرة',
  'فهرس ذكي للتنقل السريع بين الأبواب والفصول',
  'حفظ موادك وقوانينك المفضلة للرجوع إليها لاحقاً',
  'نسخ نصوص المواد بنقرة واحدة',
];

export function LegalWelcomeOnboarding({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [trialDates, setTrialDates] = useState<{ start: Date; end: Date } | null>(null);

  const close = () => { markLegalOnboardingSeen(); onDone(); };
  const startTrial = () => { setTrialDates(ensureTrialStarted()); setStep(2); };
  const goSubscription = () => { markLegalOnboardingSeen(); onDone(); navigate('/library/subscription'); };

  // ─── الشاشة 1: الترحيب + أهم المميزات ───────────────────────────
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#f5f5f5] dark:bg-background">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center px-5 py-10">
          <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6">
            <Scale className="w-10 h-10 text-amber-500" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-black text-foreground mb-3">مرحباً بك في المكتبة القانونية</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            مرجعك الشامل لكل القوانين والتشريعات اليمنية وآخر تعديلاتها، صُمم ليمنحك تجربة سهلة وسريعة بين يديك في أي وقت حتى بدون اتصال بالإنترنت.
          </p>
          <div className="w-full flex items-center justify-end gap-2 mb-4">
            <span className="text-sm font-black text-foreground">أهم المميزات</span>
            <span className="text-amber-500">⭐</span>
          </div>
          <div className="w-full space-y-3 mb-8 text-right">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground/80 leading-relaxed">{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-[0.98] transition-transform"
          >
            ابدأ الآن
          </button>
        </div>
      </div>
    );
  }

  // ─── الشاشة 2: التجربة المجانية ──────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f5f5] dark:bg-background px-5">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <h1 className="text-lg font-black text-foreground mb-10">التجربة المجانية</h1>
          <div className="w-24 h-24 rounded-full border-[3px] border-emerald-500 flex items-center justify-center mb-8">
            <Award className="w-11 h-11 text-emerald-600" strokeWidth={1.75} />
          </div>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-400 leading-relaxed mb-10">
            استمتع بتجربة جميع مزايا التطبيق مجاناً<br />لمدة ( {TRIAL_DAYS} أيام )
          </p>
          <button
            onClick={startTrial}
            className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <PlayCircle className="w-4 h-4" />
            بدء التجربة المجانية
          </button>
        </div>
      </div>
    );
  }

  // ─── الشاشة 3: تفاصيل الاشتراك ────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#f5f5f5] dark:bg-background">
      <div className="bg-[#1a2744] sticky top-0 z-10">
        <div className="max-w-sm mx-auto flex items-center gap-3 py-4 px-4">
          <button onClick={close} className="text-white p-1 -m-1" aria-label="رجوع">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-base font-black text-white -ms-7">تفاصيل الاشتراك</h1>
        </div>
      </div>

      <div className="max-w-sm mx-auto px-5 py-6 space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="font-black text-foreground text-right mb-3">التجربة المجانية</p>
          <div className="border-t border-border pt-3 space-y-2.5 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-black text-emerald-600">نشطة</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-foreground">الحالة:</span>
            </div>
            <p className="text-sm font-bold text-sky-600">
              تاريخ البـــدء: {trialDates ? formatDate(trialDates.start) : ''}
            </p>
            <p className="text-sm font-bold text-sky-600">
              تاريخ الانتهاء: {trialDates ? formatDate(trialDates.end) : ''}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center">
          <p className="text-sm font-black text-amber-600 dark:text-amber-400">لا يوجد اشتراك مدفوع حتى الآن</p>
        </div>

        <button
          onClick={goSubscription}
          className="w-full h-12 rounded-2xl bg-sky-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <KeyRound className="w-4 h-4" />
          تفعيل الاشتراك المدفوع
        </button>
      </div>
    </div>
  );
}
