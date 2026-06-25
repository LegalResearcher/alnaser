/**
 * LegalSubscription.tsx — تصميم احترافي عالمي
 * متسق مع LegalLibraryHome + LegalJudicialHome (dark navy hero + gold accent)
 * المنطق محفوظ 100% بلا أي تغيير
 */
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LibrarySubscriptionSEO } from '@/components/seo/SEOHead';
import {
  ChevronRight, ChevronLeft, Crown, Lock, KeyRound,
  MessageSquareText, CheckCircle2, Gift, Calendar, Info,
  Sparkles, Shield, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsPremiumUnlocked } from '@/hooks/useLegalLibrary';
import { useLibrarySubscriptionMessage, useLibrarySubscriptionPlans } from '@/hooks/useLibrarySubscriptionMessage';
import { LibraryPasswordModal, LibrarySubscriptionModal } from '@/components/shared/LibrarySubscriptionModals';
import { getLegalTrialDates, formatDate } from '@/components/legal-library/LegalWelcomeOnboarding';
import { useLibraryTrialSettings } from '@/hooks/useLegalLibrary';

/* ─── مزايا ثابتة كـ fallback إن كانت القاعدة فارغة ─── */
const DEFAULT_FEATURES = [
  { icon: Sparkles, text: 'وصول كامل لجميع نصوص القوانين والتشريعات' },
  { icon: Shield,   text: 'القواعد القضائية الكاملة للمحكمة العليا' },
  { icon: Zap,      text: 'بحث شامل وسريع في جميع أقسام المكتبة' },
];

/* ─── شريط تقدم مخصص ─── */
function ProgressBar({ pct, active }: { pct: number; active: boolean }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: active
            ? 'linear-gradient(90deg, #10b981, #34d399)'
            : '#d1d5db',
        }}
      />
    </div>
  );
}

/* ─── بطاقة الباقة ─── */
function PlanCard({
  label,
  price,
  currency,
  featured,
  badge,
  onPress,
}: {
  label: string;
  price: string;
  currency: string;
  featured?: boolean;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className={cn(
        'relative flex flex-col items-center rounded-2xl p-5 text-center active:scale-[0.97] transition-transform duration-150 overflow-hidden',
        featured
          ? 'text-white'
          : 'bg-white border border-gray-200'
      )}
      style={featured ? {
        background: 'linear-gradient(150deg, #0f1923 0%, #1a2a40 100%)',
        boxShadow: '0 8px 24px rgba(15,25,35,0.3)',
      } : {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* شريط ذهبي علوي للباقة المميزة */}
      {featured && (
        <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: '#c8a84b' }} />
      )}

      {/* badge */}
      {badge && (
        <span
          className="mb-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black"
          style={{ background: '#c8a84b', color: '#1a1200' }}
        >
          {badge}
        </span>
      )}

      <p className={cn('text-[13px] font-bold mb-2', featured ? 'text-gray-300' : 'text-gray-500')}>
        {label}
      </p>
      <p
        className={cn('text-3xl font-black leading-tight', featured ? 'text-white' : 'text-gray-900')}
        dir="ltr"
      >
        {currency}{price}
      </p>
      {featured && (
        <p className="mt-2 text-[10px] text-[#c8a84b] font-semibold">الأكثر توفيراً</p>
      )}

      {/* زر داخلي */}
      <div
        className={cn(
          'mt-4 w-full h-9 rounded-xl flex items-center justify-center text-[12px] font-black',
          featured
            ? 'text-gray-900'
            : 'bg-gray-900 text-white'
        )}
        style={featured ? { background: '#c8a84b' } : {}}
      >
        اشترك الآن
      </div>
    </button>
  );
}

/* ─── الصفحة ─── */
export default function LegalSubscription() {
  const navigate = useNavigate();
  const { isPremiumUnlocked, setIsPremiumUnlocked, checked, subscriptionDates } = useIsPremiumUnlocked();
  const subMsg = useLibrarySubscriptionMessage();
  const plans = useLibrarySubscriptionPlans();
  const { data: trialSettings } = useLibraryTrialSettings();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ fileName: string; fee: string } | null>(null);

  const effectiveTrialDays = trialSettings?.trialDays ?? 3;
  const trialDates = getLegalTrialDates(effectiveTrialDays);
  const trialDaysLeft = trialDates ? Math.max(0, Math.ceil((trialDates.end.getTime() - Date.now()) / 86400000)) : 0;
  const trialActive = !!trialDates && trialDaysLeft > 0;
  const trialProgressPct = trialDates
    ? Math.min(100, Math.max(0, ((effectiveTrialDays - trialDaysLeft) / effectiveTrialDays) * 100))
    : 0;

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
      <LibrarySubscriptionSEO />

      {/* ══════════ HERO HEADER ══════════ */}
      <div
        className="sticky top-0 z-30 pt-5 pb-6 px-5"
        style={{
          background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)',
        }}
      >
        {/* شريط التنقل */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white active:bg-white/15 transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
              Subscription
            </p>
            <h1 className="text-[17px] font-black text-white leading-tight">اشتراكي</h1>
          </div>
          <Crown className="w-6 h-6 text-[#c8a84b] opacity-80" strokeWidth={1.5} />
        </div>

        {/* بطاقة الحالة المدمجة في الهيدر */}
        {!checked ? (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 rounded bg-white/10 animate-pulse w-1/2" />
              <div className="h-2.5 rounded bg-white/10 animate-pulse w-3/4" />
            </div>
          </div>
        ) : isPremiumUnlocked ? (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <Crown className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[14px] font-black text-emerald-400">أنت مشترك حالياً ✓</p>
              <p className="text-[11px] text-emerald-400/70 mt-0.5 leading-relaxed">
                وصول كامل لجميع نصوص المكتبة القانونية
              </p>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)' }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,168,75,0.15)' }}>
              <Lock className="w-5 h-5 text-[#c8a84b]" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[14px] font-black text-[#c8a84b]">لا يوجد اشتراك مدفوع</p>
              <p className="text-[11px] text-[#c8a84b]/60 mt-0.5 leading-relaxed">
                اشترك للوصول الكامل لجميع النصوص القانونية
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ المحتوى ══════════ */}
      <div className="bg-[#f4f6f9] dark:bg-background min-h-[calc(100vh-200px)] pb-24">

        {/* ── بطاقة الاشتراك المدفوع ── */}
        {isPremiumUnlocked && subscriptionDates && (
          <div className="px-4 pt-5">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}>
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black',
                    subActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {subActive ? 'نشط' : 'منتهي'}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <p className="font-black text-gray-900">اشتراكك المدفوع</p>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {subscriptionDates.end ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400">{subTotalDays} يوم</span>
                      <span className={cn('text-xs font-black', subActive ? 'text-emerald-600' : 'text-gray-400')}>
                        {subActive ? `متبقي ${subDaysLeft} يوم` : 'انتهت المدة'}
                      </span>
                    </div>
                    <ProgressBar pct={subProgressPct} active={subActive} />
                  </div>
                ) : (
                  <p className="text-xs font-bold text-emerald-600 mb-4">اشتراك ساري بلا تاريخ انتهاء محدد</p>
                )}

                <div className="border-t border-gray-100 pt-3 space-y-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-gray-800">{formatDate(subscriptionDates.start)}</span>
                    <span className="text-xs text-gray-400">بداية الاشتراك</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  {subscriptionDates.end && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm font-bold text-gray-800">{formatDate(subscriptionDates.end)}</span>
                      <span className="text-xs text-gray-400">نهاية الاشتراك</span>
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  )}
                </div>

                {!subActive && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3.5 flex items-start gap-2.5 text-right">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                      انتهت مدة اشتراكك. جدّد الاشتراك لمواصلة الوصول الكامل.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── بطاقة التجربة المجانية ── */}
        {!isPremiumUnlocked && trialDates && (
          <div className="px-4 pt-5">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}>
              <div className="h-1 w-full" style={{ background: trialActive ? 'linear-gradient(90deg, #10b981, #34d399)' : '#d1d5db' }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black',
                    trialActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {trialActive ? 'نشطة' : 'منتهية'}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <p className="font-black text-gray-900">التجربة المجانية</p>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400">{effectiveTrialDays} أيام</span>
                    <span className={cn('text-xs font-black', trialActive ? 'text-emerald-600' : 'text-gray-400')}>
                      {trialActive ? `متبقي ${trialDaysLeft} يوم` : 'انتهت المدة'}
                    </span>
                  </div>
                  <ProgressBar pct={trialProgressPct} active={trialActive} />
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-gray-800">{formatDate(trialDates.start)}</span>
                    <span className="text-xs text-gray-400">بداية التجربة</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-bold text-gray-800">{formatDate(trialDates.end)}</span>
                    <span className="text-xs text-gray-400">نهاية التجربة</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>

                {!trialActive && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3.5 flex items-start gap-2.5 text-right">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs font-semibold text-amber-700 leading-relaxed">
                      انتهت فترة تجربتك المجانية. اشترك الآن لمواصلة الوصول الكامل.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── المزايا ── */}
        <div className="px-5 pt-6 pb-1 flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">مزايا الاشتراك</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="px-4">
          <div className="bg-white rounded-2xl p-4 space-y-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {featureLines.length > 0
              ? featureLines.map((line: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-right">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[13px] text-gray-600 leading-relaxed">{line}</span>
                  </div>
                ))
              : DEFAULT_FEATURES.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3 text-right">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[13px] text-gray-600 leading-relaxed">{text}</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── باقات الاشتراك ── */}
        {!isPremiumUnlocked && (
          <>
            <div className="px-5 pt-5 pb-1 flex items-center gap-3">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">باقات الاشتراك</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="px-4 grid grid-cols-2 gap-3">
              <PlanCard
                label={plans.monthlyLabel}
                price={plans.monthlyPrice}
                currency={plans.currency}
                onPress={() => choosePlan(plans.monthlyLabel, plans.monthlyPrice)}
              />
              <PlanCard
                label={plans.annualLabel}
                price={plans.annualPrice}
                currency={plans.currency}
                featured
                badge="وفّر أكثر"
                onPress={() => choosePlan(plans.annualLabel, plans.annualPrice)}
              />
            </div>
          </>
        )}

        {/* ── رمز التفعيل ── */}
        {!isPremiumUnlocked && (
          <div className="px-4 pt-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black text-[13px] active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <KeyRound className="w-4 h-4 text-gray-500" />
              لديّ رمز تفعيل — إدخاله الآن
            </button>
          </div>
        )}

        {/* ── تواصل معنا ── */}
        <div className="px-4 pt-4 pb-4">
          <a
            href={`https://t.me/MuenAlnaser?text=${encodeURIComponent('استفسار بخصوص الاشتراك في المكتبة القانونية — منصة الناصر القانونية\nhttps://alnaseer.org')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 h-12 rounded-2xl text-[13px] font-bold text-gray-500 active:text-gray-800 transition-colors"
            style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <MessageSquareText className="w-4 h-4" />
            لديك استفسار؟ تواصل معنا
          </a>
        </div>

        <div className="mx-4 h-px bg-gray-200 mb-2" />
        <p className="text-center text-[11px] text-gray-400 pb-4">
          منصة الناصر القانونية — جميع الحقوق محفوظة
        </p>
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
