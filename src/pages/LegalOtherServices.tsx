/**
 * LegalOtherServices.tsx — صفحة "خدماتنا الأخرى" (/library/other-services)
 * شبكة بطاقتين تطابق التصميم المرجعي:
 *  1) أحكام المحكمة العليا       → /library/other-services/supreme-court
 *  2) توفير مراجع قانونية حسب الطلب → /library/other-services/legal-references
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Gavel, BookOpenText } from 'lucide-react';

const SERVICES = [
  {
    key: 'supreme-court',
    title: 'أحكام المحكمة العليا',
    icon: Gavel,
    path: '/library/other-services/supreme-court',
  },
  {
    key: 'legal-references',
    title: 'توفير مراجع قانونية حسب الطلب',
    icon: BookOpenText,
    path: '/library/other-services/legal-references',
  },
] as const;

export default function LegalOtherServices() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">خدماتنا الأخرى</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-6 pb-24 flex flex-col gap-4">
        {SERVICES.map(({ key, title, icon: Icon, path }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            className="w-full bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center gap-4 shadow-card hover:shadow-card-md transition-all active:scale-[0.99]"
          >
            <Icon className="w-12 h-12 text-[#b8923f]" strokeWidth={1.5} />
            <p className="text-base font-black text-foreground">{title}</p>
          </button>
        ))}
      </div>
    </MainLayout>
  );
}
