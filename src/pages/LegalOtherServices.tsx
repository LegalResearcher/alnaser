/**
 * LegalOtherServices.tsx — إصلاح مؤقت لمسار /library/other-services
 * كان هذا المسار مُشاراً إليه من LegalSidebarDrawer.tsx بدون صفحة فعلية (404).
 * صفحة بسيطة "قريباً" إلى أن يُحدَّد محتواها لاحقاً.
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Grid3x3, MessageSquareText } from 'lucide-react';

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

      <div className="container max-w-5xl py-20 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
          <Grid3x3 className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h2 className="text-base font-bold text-foreground mb-2">هذه الصفحة قريباً</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          سيتم هنا قريباً عرض خدمات منصة الناصر القانونية الأخرى (بنك الأسئلة، غرفة المنافسة، وغيرها).
        </p>
        <a
          href={`https://t.me/MuenAlnaser?text=${encodeURIComponent('استفسار عن خدمات منصة الناصر القانونية\nhttps://alnaseer.org')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
        >
          <MessageSquareText className="w-4 h-4" /> تواصل معنا
        </a>
      </div>
    </MainLayout>
  );
}
