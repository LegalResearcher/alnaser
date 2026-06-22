/**
 * LegalWelcomeOnboarding.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100% — تغيير الشكل فقط
 * متسق مع الـ dark navy hero الموحّد في المكتبة
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceFingerprint } from '@/hooks/useLegalLibrary';
import { LEGAL_ONBOARDING_KEY, LEGAL_TRIAL_START_KEY, TRIAL_DAYS } from '@/lib/legalLibraryKeys';
import {
  Scale, ChevronRight, ChevronLeft, Award, PlayCircle, KeyRound, CheckCircle2,
  WifiOff, Gift, RefreshCcw, Search, Moon, Heart, ListTree, TrendingUp,
  Calendar, Crown,
} from 'lucide-react';

export { LEGAL_ONBOARDING_KEY, TRIAL_DAYS };

export function hasSeenLegalOnboarding(): boolean {
  try { return localStorage.getItem(LEGAL_ONBOARDING_KEY) === '1'; } catch { return true; }
}
function markLegalOnboardingSeen() {
  try { localStorage.setItem(LEGAL_ONBOARDING_KEY, '1'); } catch { }
}
function ensureTrialStarted(): { start: Date; end: Date } {
  let startIso: string | null = null;
  try { startIso = localStorage.getItem(LEGAL_TRIAL_START_KEY); } catch { }
  const isFirstStart = !startIso;
  if (!startIso) {
    startIso = new Date().toISOString();
    try { localStorage.setItem(LEGAL_TRIAL_START_KEY, startIso); } catch { }
  }
  if (isFirstStart) {
    (async () => {
      try {
        await (supabase as any)
          .from('legal_trial_starts')
          .upsert(
            { device_fingerprint: getDeviceFingerprint(), started_at: startIso },
            { onConflict: 'device_fingerprint', ignoreDuplicates: true }
          );
      } catch { }
    })();
  }
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { start, end };
}
export function getLegalTrialDates(): { start: Date; end: Date } | null {
  let startIso: string | null = null;
  try { startIso = localStorage.getItem(LEGAL_TRIAL_START_KEY); } catch { }
  if (!startIso) return null;
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { start, end };
}
export function formatDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

/* ─── بيانات المزايا ─── */
const FEATURES = [
  { icon: WifiOff,    title: 'متاحة دون إنترنت',      desc: 'القوانين التي تصفّحتها تبقى بين يديك حتى دون اتصال.' },
  { icon: Gift,       title: 'تجربة مجانية كاملة',     desc: 'استكشف المكتبة بحرية تامة لفترة محدودة قبل الاشتراك.' },
  { icon: RefreshCcw, title: 'تحديث مستمر',            desc: 'نواكب كل تعديل تشريعي رسمي فور صدوره.' },
  { icon: Search,     title: 'بحث ذكي وسريع',          desc: 'اعثر على أي نص أو مادة بكلمة مفتاحية واحدة.' },
  { icon: Moon,       title: 'قراءة مخصّصة لك',        desc: 'تحكّم بحجم الخط وفعّل الوضع الليلي لراحة عينيك.' },
  { icon: Heart,      title: 'مفضلاتك دائماً جاهزة',   desc: 'احفظ ما يهمّك من مواد وارجع إليه بلمسة واحدة.' },
  { icon: ListTree,   title: 'فهرس منظّم',             desc: 'تنقّل بسلاسة بين الأبواب والفصول عبر فهرس واضح.' },
  { icon: TrendingUp, title: 'تطوير مستمر',            desc: 'مزايا وتحسينات جديدة تصلك بانتظام.' },
];

const TRIAL_PERKS = [
  'وصول فوري لكل محتوى المكتبة القانونية',
  'بلا حاجة لبطاقة دفع أو أي التزام مالي',
  'اشترك متى شئت بعد انتهاء التجربة',
];

/* ─── مكوّن مؤشر الخطوات ─── */
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current ? '#c8a84b' : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </div>
  );
}

/* ─── شريط تقدم ─── */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   المكوّن الرئيسي
══════════════════════════════════════════ */
export function LegalWelcomeOnboarding({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [trialDates, setTrialDates] = useState<{ start: Date; end: Date } | null>(null);

  const close = () => { markLegalOnboardingSeen(); onDone(); };
  const startTrial = () => { setTrialDates(ensureTrialStarted()); setStep(2); };
  const goSubscription = () => { markLegalOnboardingSeen(); onDone(); navigate('/library/subscription'); };

  /* ════════════════════════════════
     الشاشة 1 — الترحيب + المميزات
  ════════════════════════════════ */
  if (step === 0) return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#f4f6f9' }}>

      {/* Hero header */}
      <div
        className="flex-shrink-0 pt-10 pb-8 px-6 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        {/* شعار */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)' }}
        >
          <Scale className="w-10 h-10 text-[#c8a84b]" strokeWidth={1.5} />
        </div>
        <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-1">Al-Naser Legal Platform</p>
        <h1 className="text-xl font-black text-white leading-tight mb-3">
          مرحباً بك في المكتبة القانونية
        </h1>
        <p className="text-[13px] text-gray-300/80 leading-relaxed max-w-xs">
          مرجعك الأول للقوانين والتشريعات اليمنية — بتجربة سلسة أينما كنت
        </p>
        <div className="mt-6">
          <StepDots current={0} />
        </div>
      </div>

      {/* قائمة المزايا */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-[#c8a84b]" />
          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">أهم المميزات</span>
        </div>
        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 bg-white rounded-2xl p-4 text-right"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200,168,75,0.1)' }}
              >
                <f.icon className="w-5 h-5 text-[#c8a84b]" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-black text-gray-900">{f.title}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* زر التالي */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3" style={{ background: 'linear-gradient(to top, #f4f6f9, #f4f6f9cc, transparent)' }}>
        <button
          onClick={() => setStep(1)}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-white font-black active:scale-[0.98] transition-transform"
          style={{
            height: 54,
            background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
            boxShadow: '0 4px 20px rgba(15,25,35,0.3)',
          }}
        >
          <span className="text-[15px]">ابدأ الآن</span>
          <ChevronLeft className="w-4 h-4 text-[#c8a84b]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════
     الشاشة 2 — التجربة المجانية
  ════════════════════════════════ */
  if (step === 1) return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#f4f6f9' }}>

      {/* Hero */}
      <div
        className="flex-shrink-0 pt-10 pb-8 px-6 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        {/* زر رجوع */}
        <button
          onClick={() => setStep(0)}
          className="self-start flex items-center justify-center w-9 h-9 rounded-xl mb-5 bg-white/8 border border-white/10 text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* دائرة العدّاد */}
        <div className="relative mb-5">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle
              cx="48" cy="48" r="42" fill="none"
              stroke="#c8a84b" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * 0.25}`}
              transform="rotate(-90 48 48)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{TRIAL_DAYS}</span>
            <span className="text-[10px] text-gray-400">يوم</span>
          </div>
        </div>

        <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-1">Free Trial</p>
        <h1 className="text-xl font-black text-white leading-tight mb-2">تجربتك المجانية</h1>
        <p className="text-[13px] text-gray-300/80 leading-relaxed">
          استمتع بكل مزايا المكتبة مجاناً لمدة <span className="text-[#c8a84b] font-black">{TRIAL_DAYS} أيام</span> كاملة
        </p>
        <div className="mt-6">
          <StepDots current={1} />
        </div>
      </div>

      {/* المزايا */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6">
        <div className="bg-white rounded-3xl p-6 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)' }}>
          {TRIAL_PERKS.map((perk, i) => (
            <div key={i} className="flex items-center gap-3.5 text-right">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[14px] font-semibold text-gray-700 leading-snug">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* زر البدء */}
      <div className="flex-shrink-0 px-4 pb-6">
        <button
          onClick={startTrial}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-gray-900 font-black active:scale-[0.98] transition-transform"
          style={{
            height: 54,
            background: '#c8a84b',
            boxShadow: '0 4px 20px rgba(200,168,75,0.4)',
          }}
        >
          <PlayCircle className="w-5 h-5" />
          <span className="text-[15px]">بدء التجربة المجانية</span>
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════
     الشاشة 3 — تفاصيل الاشتراك
  ════════════════════════════════ */
  const daysLeft = trialDates
    ? Math.max(0, Math.ceil((trialDates.end.getTime() - Date.now()) / 86400000))
    : TRIAL_DAYS;
  const progressPct = Math.min(100, Math.max(0, ((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100));

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#f4f6f9' }}>

      {/* Hero Header */}
      <div
        className="flex-shrink-0 pt-5 pb-6 px-5"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={close}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Subscription</p>
            <h1 className="text-[17px] font-black text-white leading-tight">تفاصيل الاشتراك</h1>
          </div>
          <Crown className="w-5 h-5 text-[#c8a84b] opacity-70" strokeWidth={1.5} />
        </div>
        <StepDots current={2} />
      </div>

      {/* المحتوى */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* بطاقة التجربة */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}>
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                نشطة
              </span>
              <div className="flex items-center gap-2.5">
                <p className="font-black text-gray-900">التجربة المجانية</p>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{TRIAL_DAYS} أيام</span>
                <span className="text-xs font-black text-emerald-600">متبقي {daysLeft} يوم</span>
              </div>
              <ProgressBar pct={progressPct} />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-gray-800">{trialDates ? formatDate(trialDates.start) : ''}</span>
                <span className="text-xs text-gray-400">بداية التجربة</span>
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-gray-800">{trialDates ? formatDate(trialDates.end) : ''}</span>
                <span className="text-xs text-gray-400">نهاية التجربة</span>
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* تنبيه الاشتراك */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3 text-right"
          style={{ background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)' }}
        >
          <Award className="w-5 h-5 text-[#c8a84b] mt-0.5 shrink-0" strokeWidth={1.75} />
          <p className="text-[12px] font-semibold leading-relaxed" style={{ color: '#8a6a1a' }}>
            لا يوجد اشتراك مدفوع حتى الآن. يمكنك الاشتراك في أي وقت لمواصلة الوصول الكامل بعد انتهاء التجربة.
          </p>
        </div>

        {/* زر تفعيل الاشتراك */}
        <button
          onClick={goSubscription}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-white font-black active:scale-[0.98] transition-transform"
          style={{
            height: 54,
            background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
            boxShadow: '0 4px 20px rgba(15,25,35,0.3)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,168,75,0.18)' }}>
            <KeyRound className="w-4 h-4 text-[#c8a84b]" />
          </div>
          <span className="text-[14px]">تفعيل الاشتراك المدفوع</span>
          <ChevronLeft className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
        </button>

        {/* زر إغلاق */}
        <button
          onClick={close}
          className="w-full h-12 rounded-2xl text-[13px] font-bold text-gray-500 active:text-gray-800 transition-colors"
          style={{ border: '1px solid #e5e7eb', background: 'white' }}
        >
          الدخول للمكتبة مباشرةً
        </button>
      </div>
    </div>
  );
}
