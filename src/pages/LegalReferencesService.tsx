/**
 * LegalReferencesService.tsx — تفاصيل خدمة "توفير مراجع قانونية حسب الطلب"
 * /library/other-services/legal-references
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, BookOpenText, MessageCircle } from 'lucide-react';

const TELEGRAM_USERNAME = 'MuenAlnaser';

function buildTelegramLink(text: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
}

export default function LegalReferencesService() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-white tracking-wide">تفاصيل الخدمة</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-6 pb-24">
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center text-center gap-4 shadow-card">
          <BookOpenText className="w-12 h-12 text-[#b8923f]" strokeWidth={1.5} />

          <h2 className="text-base font-black text-foreground">
            توفير مراجع قانونية حسب الطلب
          </h2>

          <div className="w-full h-px bg-border" />

          <p className="text-sm text-foreground/90 leading-7">
            عزيزي المستخدم
            <br />
            إذا كنت تبحث عن مراجع قانونية معينه وليس لديك الوقت للبحث عنها في
            الانترنت ماعليك سوى مراسلتنا على التليجرام واعطاءنا اسماء المراجع
            التي تبحث عنها وسنقوم عنك بالبحث عنها وموافاتك بها.
          </p>

          <a
            href={buildTelegramLink('مرحباً، أود الاستفسار عن خدمة: المراجع القانونية')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 font-bold"
          >
            <MessageCircle className="w-5 h-5" />
            تواصل معنا الآن عبر التليجرام
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
