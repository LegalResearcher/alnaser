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
import { supabase } from '@/integrations/supabase/client';
import { getDeviceFingerprint } from '@/hooks/useLegalLibrary';
import { LEGAL_ONBOARDING_KEY, LEGAL_TRIAL_START_KEY, TRIAL_DAYS } from '@/lib/legalLibraryKeys';
import {
  Scale, ChevronRight, Award, PlayCircle, KeyRound, CheckCircle2,
  WifiOff, Gift, RefreshCcw, Search, Moon, Heart, ListTree, TrendingUp,
  Calendar, Info,
} from 'lucide-react';

// إعادة تصدير للحفاظ على توافق الاستيرادات الحالية من هذا الملف
// (مثلاً: src/pages/LegalSubscription.tsx) دون أي تعديل عليها
export { LEGAL_ONBOARDING_KEY, TRIAL_DAYS };

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
  const isFirstStart = !startIso;
  if (!startIso) {
    startIso = new Date().toISOString();
    try { localStorage.setItem(LEGAL_TRIAL_START_KEY, startIso); } catch { /* ignore */ }
  }
  // تسجيل بدء التجربة في Supabase مرة واحدة فقط لكل جهاز (لعدّها في الإحصائيات)
  if (isFirstStart) {
    (async () => {
      try {
        await (supabase as any)
          .from('legal_trial_starts')
          .upsert(
            { device_fingerprint: getDeviceFingerprint(), started_at: startIso },
            { onConflict: 'device_fingerprint', ignoreDuplicates: true }
          );
      } catch { /* تجاهل أخطاء التتبع */ }
    })();
  }
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { start, end };
}

/** يقرأ تاريخي بدء/انتهاء التجربة المجانية إن كانت قد بدأت فعلاً، دون إنشائها. */
export function getLegalTrialDates(): { start: Date; end: Date } | null {
  let startIso: string | null = null;
  try { startIso = localStorage.getItem(LEGAL_TRIAL_START_KEY); } catch { /* ignore */ }
  if (!startIso) return null;
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { start, end };
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

const FEATURES = [
  { icon: WifiOff, title: 'متاحة دون إنترنت', desc: 'القوانين التي تصفّحتها تبقى بين يديك، حتى دون اتصال بالشبكة.' },
  { icon: Gift, title: 'تجربة مجانية كاملة', desc: 'استكشف المكتبة بحرية تامة لفترة محدودة قبل الاشتراك.' },
  { icon: RefreshCcw, title: 'تحديث مستمر', desc: 'نواكب كل تعديل تشريعي رسمي فور صدوره.' },
  { icon: Search, title: 'بحث ذكي وسريع', desc: 'اعثر على أي نص أو مادة بكلمة مفتاحية أو برقمها مباشرة.' },
  { icon: Moon, title: 'قراءة مخصّصة لك', desc: 'تحكّم بحجم الخط، وفعّل الوضع الليلي لراحة عينيك.' },
  { icon: Heart, title: 'مفضلاتك دائماً جاهزة', desc: 'احفظ ما يهمّك من مواد وقوانين، وارجع إليه بلمسة واحدة.' },
  { icon: ListTree, title: 'فهرس منظّم', desc: 'تنقّل بسلاسة بين الأبواب والفصول عبر فهرس واضح.' },
  { icon: TrendingUp, title: 'تطوير مستمر', desc: 'مزايا وتحسينات جديدة تصلك بانتظام.' },
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
          <h1 className="text-xl font-black text-foreground mb-3">مرحباً بك في مكتبتك القانونية</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-7">
            مرجعك الأول والأشمل للقوانين والتشريعات اليمنية، بتجربة استخدام سلسة تضع القوانين بين يديك أينما كنت — حتى دون اتصال بالإنترنت.
          </p>
          <div className="w-full flex items-center justify-end gap-2 mb-5">
            <span className="text-sm font-black text-foreground">أهم المميزات</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="w-full space-y-4 mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-right">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mt-0.5">
                  <f.icon className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
                </div>
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
    const trialPerks = [
      'وصول فوري لكل محتوى المكتبة القانونية',
      'بلا حاجة لبطاقة دفع أو أي التزام مالي',
      'اشترك متى شئت بعد انتهاء التجربة',
    ];
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f5f5] dark:bg-background px-5">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <h1 className="text-lg font-black text-foreground mb-8">تجربتك المجانية</h1>
          <div className="w-24 h-24 rounded-full border-[3px] border-emerald-500 flex items-center justify-center mb-7">
            <Award className="w-11 h-11 text-emerald-600" strokeWidth={1.75} />
          </div>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-400 leading-relaxed mb-1">
            استمتع بكل مزايا التطبيق مجاناً
          </p>
          <p className="text-sm font-bold text-muted-foreground mb-7">
            لمدة {TRIAL_DAYS} أيام كاملة، بلا أي قيود
          </p>
          <div className="w-full space-y-3 mb-9">
            {trialPerks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2.5 text-right">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground/80">{perk}</span>
              </div>
            ))}
          </div>
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
  const daysLeft = trialDates ? Math.max(0, Math.ceil((trialDates.end.getTime() - Date.now()) / 86400000)) : TRIAL_DAYS;
  const progressPct = Math.min(100, Math.max(0, ((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100));

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
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              نشطة
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
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">متبقي {daysLeft} يوم</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-foreground">{trialDates ? formatDate(trialDates.start) : ''}</span>
              <span className="text-xs font-bold text-muted-foreground">بداية التجربة:</span>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-bold text-foreground">{trialDates ? formatDate(trialDates.end) : ''}</span>
              <span className="text-xs font-bold text-muted-foreground">نهاية التجربة:</span>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-2.5 text-right">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
            لا يوجد اشتراك مدفوع حتى الآن. يمكنك الاشتراك في أي وقت لمواصلة الوصول الكامل بعد انتهاء التجربة.
          </p>
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
