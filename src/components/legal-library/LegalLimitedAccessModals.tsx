/**
 * LegalLimitedAccessModals.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100% — تغيير الشكل فقط
 */
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, ChevronLeft, CheckCircle2, ShieldOff } from 'lucide-react';
import { formatDate } from './LegalWelcomeOnboarding';

/* ══════════════════════════════════════════
   1) شاشة انتهاء التجربة
══════════════════════════════════════════ */
export function TrialEndedScreen({
  trialDates, onGoSubscribe, onContinueLimited,
}: {
  trialDates: { start: Date; end: Date } | null;
  onGoSubscribe: () => void;
  onContinueLimited: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: '#f4f6f9' }}>

      {/* Hero dark header */}
      <div
        className="flex-shrink-0 pt-10 pb-8 px-6 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        {/* أيقونة */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <ShieldOff className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>
        <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-1">Trial Ended</p>
        <h1 className="text-xl font-black text-white leading-tight mb-2">انتهت التجربة المجانية</h1>
        <p className="text-[13px] text-gray-300/80 leading-relaxed max-w-xs">
          استفدت من التجربة على هذا الجهاز خلال الفترة من{' '}
          <span className="text-white font-bold">{trialDates ? formatDate(trialDates.start) : ''}</span>
          {' '}إلى{' '}
          <span className="text-white font-bold">{trialDates ? formatDate(trialDates.end) : ''}</span>
        </p>
      </div>

      {/* المحتوى */}
      <div className="flex-1 flex flex-col justify-between px-4 py-6">

        {/* بطاقة مزايا الاشتراك */}
        <div className="bg-white rounded-2xl p-5 space-y-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-2 justify-end mb-2">
            <p className="text-[14px] font-black text-gray-900">اشترك للوصول الكامل</p>
            <Crown className="w-4 h-4 text-[#c8a84b]" strokeWidth={1.75} />
          </div>
          {[
            'وصول كامل لجميع نصوص القوانين والتشريعات',
            'القواعد القضائية الكاملة للمحكمة العليا',
            'بحث شامل وسريع في جميع أقسام المكتبة',
            'تحديثات مستمرة بأحدث التعديلات الرسمية',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-right">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[13px] text-gray-600 leading-snug">{item}</span>
            </div>
          ))}
        </div>

        {/* الأزرار */}
        <div className="space-y-3 mt-5">
          {/* زر الاشتراك — primary */}
          <button
            onClick={onGoSubscribe}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-gray-900 font-black active:scale-[0.98] transition-transform"
            style={{
              height: 54,
              background: '#c8a84b',
              boxShadow: '0 4px 20px rgba(200,168,75,0.4)',
            }}
          >
            <Crown className="w-5 h-5" strokeWidth={2} />
            <span className="text-[15px]">تفعيل الاشتراك المدفوع</span>
          </button>

          {/* فاصل */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">أو</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* زر الوضع المجاني المحدود — secondary */}
          <button
            onClick={onContinueLimited}
            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-2xl text-[13px] font-bold text-gray-500 active:text-gray-700 transition-colors"
            style={{ border: '1px solid #e5e7eb', background: 'white' }}
          >
            <Lock className="w-4 h-4 text-gray-400" />
            مواصلة الاستخدام المجاني المحدود
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   2) مودال الاستخدام المحدود
══════════════════════════════════════════ */
export function LimitedUsageModal({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-white rounded-t-3xl overflow-hidden"
        style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
      >
        {/* شريط علوي */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* أيقونة */}
        <div className="flex flex-col items-center text-center pt-4 pb-2 px-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.2)' }}
          >
            <Lock className="w-8 h-8 text-[#c8a84b]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[17px] font-black text-gray-900 mb-2">الاستخدام المجاني المحدود</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-1">
            يمكنك الدخول للمكتبة واستخدامها مجاناً بمزايا محدودة
          </p>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            للوصول الكامل يمكنك تفعيل الاشتراك في أي وقت
          </p>
        </div>

        {/* مزايا متاحة وغير متاحة */}
        <div className="mx-4 mb-5 rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          {[
            { label: 'تصفح القوانين والنصوص', available: true },
            { label: 'البحث الشامل في المكتبة', available: false },
            { label: 'نسخ النصوص القانونية', available: false },
            { label: 'حفظ المفضلات', available: false },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 text-right"
              style={{ borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none' }}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.available ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                {item.available
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  : <Lock className="w-3 h-3 text-gray-400" />
                }
              </div>
              <span className={`text-[13px] font-semibold ${item.available ? 'text-gray-700' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* زر الدخول */}
        <div className="px-4 pb-6">
          <button
            onClick={onEnter}
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-white font-black active:scale-[0.98] transition-transform"
            style={{
              height: 52,
              background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
              boxShadow: '0 4px 16px rgba(15,25,35,0.3)',
            }}
          >
            <span className="text-[14px]">الدخول للمكتبة</span>
            <ChevronLeft className="w-4 h-4 text-[#c8a84b]" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   3) نافذة الميزة المقفلة
══════════════════════════════════════════ */
export function FeatureLockedModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-xs bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        {/* شريط ذهبي علوي */}
        <div className="h-1 w-full" style={{ background: '#c8a84b' }} />

        <div className="p-6 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(200,168,75,0.1)' }}
          >
            <Lock className="w-7 h-7 text-[#c8a84b]" strokeWidth={1.5} />
          </div>

          <h3 className="text-[17px] font-black text-gray-900 mb-2">ميزة مدفوعة</h3>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
            هذه الميزة متاحة للمشتركين فقط.<br />
            فعّل اشتراكك للوصول إلى جميع المزايا
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => { onClose(); navigate('/library/subscription'); }}
              className="w-full h-11 rounded-2xl text-gray-900 font-black text-[13px] active:scale-[0.98] transition-transform"
              style={{ background: '#c8a84b' }}
            >
              تفعيل الاشتراك
            </button>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-2xl text-[13px] font-bold text-gray-400"
            >
              ليس الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
