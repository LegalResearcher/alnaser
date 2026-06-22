/**
 * LegalSupremeCourtService.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100%
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, ChevronLeft, Gavel, MessageCircle, ListChecks, CheckCircle2 } from 'lucide-react';

const TELEGRAM_USERNAME = 'MuenAlnaser';
function buildTelegramLink(text: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
}

const HOW_IT_WORKS = [
  'تواصل معنا عبر التليجرام',
  'حدّد الموضوع القانوني الذي تبحث عنه',
  'نوفر لك الأحكام ذات الصلة في أقرب وقت',
];

export default function LegalSupremeCourtService() {
  const navigate = useNavigate();

  return (
    <MainLayout>

      {/* Hero Header */}
      <div
        className="sticky top-0 z-30 pt-5 pb-6 px-5"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Supreme Court</p>
            <h1 className="text-[17px] font-black text-white leading-tight">أحكام المحكمة العليا</h1>
          </div>
          <Gavel className="w-5 h-5 text-[#c8a84b] opacity-70" strokeWidth={1.5} />
        </div>
      </div>

      {/* المحتوى */}
      <div className="bg-[#f4f6f9] min-h-[calc(100vh-120px)] pb-24 px-4 pt-5 space-y-4">

        {/* بطاقة الوصف */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}
        >
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }} />
          <div className="p-5 text-right">
            <div className="flex items-center gap-3 justify-end mb-4">
              <p className="text-[15px] font-black text-gray-900">توفير أحكام المحكمة العليا</p>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Gavel className="w-5 h-5 text-indigo-500" strokeWidth={1.6} />
              </div>
            </div>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              تتوفر لدينا أحكام المحكمة العليا مصنّفة حسب الموضوع الذي تبحث عنه.
              إذا كنت مهتماً بهذه الخدمة، تواصل معنا وسنوفر لك الأحكام ذات الصلة في أقرب وقت ممكن.
            </p>
          </div>
        </div>

        {/* كيف تعمل الخدمة */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 justify-end mb-4">
            <p className="text-[13px] font-black text-gray-900">كيف تعمل الخدمة؟</p>
          </div>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-right">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: '#6366f1' }}
                >
                  {i + 1}
                </div>
                <span className="text-[13px] text-gray-600">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* زر التواصل */}
        <a
          href={buildTelegramLink('مرحباً، أود الاستفسار عن خدمة: أحكام المحكمة العليا')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white rounded-2xl p-4 active:scale-[0.98] transition-transform"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <MessageCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-black text-gray-900">تواصل معنا عبر التليجرام</p>
            <p className="text-[11px] text-gray-400">@{TELEGRAM_USERNAME}</p>
          </div>
          <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2.5} />
        </a>

        <div className="mx-0 h-px bg-gray-200" />
        <p className="text-center text-[12px] text-gray-400">يمكنك الاطلاع على بعض المواضيع المتاحة من هنا</p>

        {/* زر استعراض المواضيع */}
        <button
          onClick={() => navigate('/library/other-services/supreme-court/index')}
          className="w-full flex items-center gap-3 rounded-2xl px-5 active:scale-[0.98] transition-transform"
          style={{
            height: 54,
            background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
            boxShadow: '0 4px 20px rgba(15,25,35,0.3)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,168,75,0.18)' }}>
            <ListChecks className="w-4 h-4 text-[#c8a84b]" />
          </div>
          <span className="flex-1 text-right text-[14px] font-black text-white">استعراض مواضيع الأحكام</span>
          <ChevronLeft className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2.5} />
        </button>
      </div>
    </MainLayout>
  );
}
