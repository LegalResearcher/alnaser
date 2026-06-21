/**
 * LegalSupremeCourtService.tsx — تفاصيل خدمة "أحكام المحكمة العليا"
 * /library/other-services/supreme-court
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, Gavel, MessageCircle, ListChecks } from 'lucide-react';

const TELEGRAM_USERNAME = 'MuenAlnaser';

function buildTelegramLink(text: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(text)}`;
}

export default function LegalSupremeCourtService() {
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
          <Gavel className="w-12 h-12 text-[#b8923f]" strokeWidth={1.5} />

          <h2 className="text-base font-black text-foreground">
            توفير أحكام المحكمة العليا حسب الموضوع
          </h2>

          <div className="w-full h-px bg-border" />

          <p className="text-sm text-foreground/90 leading-7">
            عزيزي المستخدم،
            <br />
            تتوفر لدينا أحكام المحكمة العليا مصنّفة حسب الموضوع الذي تبحث عنه.
            <br />
            إذا كنت مهتماً بهذه الخدمة، يرجى التواصل معنا عبر التليجرام وتزويدنا
            بالموضوع الذي تبحث عنه وسنقوم بتوفير أحكام المحكمة العليا ذات الصلة
            في أقرب وقت ممكن.
          </p>

          <a
            href={buildTelegramLink('مرحباً، أود الاستفسار عن خدمة: أحكام المحكمة العليا')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 font-bold"
          >
            <MessageCircle className="w-5 h-5" />
            تواصل معنا الآن عبر التليجرام
          </a>
        </div>

        <p className="text-center text-sm text-foreground mt-6 mb-3">
          يمكنك الإطلاع على بعض المواضيع من هنا
        </p>

        <button
          onClick={() => navigate('/library/other-services/supreme-court/index')}
          className="w-full h-14 rounded-2xl bg-[#b8923f] text-white font-bold flex items-center justify-center gap-2 shadow-card hover:brightness-105 transition-all active:scale-[0.99]"
        >
          <ListChecks className="w-5 h-5" />
          استعراض مواضيع الأحكام
        </button>
      </div>
    </MainLayout>
  );
}
