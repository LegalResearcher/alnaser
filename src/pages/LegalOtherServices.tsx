/**
 * LegalOtherServices.tsx — تصميم احترافي عالمي
 * المنطق محفوظ 100%
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, ChevronLeft, Gavel, BookOpenText } from 'lucide-react';

const SERVICES = [
  {
    key: 'supreme-court',
    title: 'أحكام المحكمة العليا',
    subtitle: 'أحكام مصنّفة حسب الموضوع القانوني',
    icon: Gavel,
    accent: '#6366f1',
    path: '/library/other-services/supreme-court',
  },
  {
    key: 'legal-references',
    title: 'مراجع قانونية حسب الطلب',
    subtitle: 'نبحث عن المراجع التي تحتاجها',
    icon: BookOpenText,
    accent: '#0ea5e9',
    path: '/library/other-services/legal-references',
  },
] as const;

export default function LegalOtherServices() {
  const navigate = useNavigate();

  return (
    <MainLayout>

      {/* Hero Header */}
      <div
        className="sticky top-0 z-30 pt-5 pb-6 px-5"
        style={{ background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">Legal Library</p>
            <h1 className="text-[17px] font-black text-white leading-tight">خدماتنا الأخرى</h1>
          </div>
        </div>

        {/* وصف */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[12px] text-gray-300/80 leading-relaxed text-right">
            خدمات إضافية متخصصة تُكمّل مكتبتك القانونية — نوفرها لك بطلب مباشر عبر التليجرام
          </p>
        </div>
      </div>

      {/* المحتوى */}
      <div className="bg-[#f4f6f9] min-h-[calc(100vh-160px)] pb-24 px-4 pt-5">

        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-[#c8a84b]" />
          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">الخدمات المتاحة</span>
        </div>

        <div className="space-y-3">
          {SERVICES.map(({ key, title, subtitle, icon: Icon, accent, path }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl p-5 text-right active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}
            >
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${accent}14` }}
              >
                <Icon className="w-7 h-7" style={{ color: accent }} strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-black text-gray-900 leading-tight mb-1">{title}</h3>
                <p className="text-[11px] text-gray-400">{subtitle}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-300 flex-shrink-0" strokeWidth={2.5} />
            </button>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
