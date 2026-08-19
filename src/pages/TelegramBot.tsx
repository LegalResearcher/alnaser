import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  GraduationCap,
  Search,
  Share2,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TelegramBotSEO } from '@/components/seo/SEOHead';

const botFeatures = [
  {
    icon: BookOpen,
    title: 'مكتبة قانونية منظمة',
    description: 'تصفح المصادر والتشريعات والقواعد القضائية والصيغ القانونية من محادثتك الخاصة مع البوت.',
  },
  {
    icon: GraduationCap,
    title: 'اختبارات تفاعلية',
    description: 'تدرّب في مواد الشريعة والقانون، واختبر معرفتك في نماذج الثانوية العامة بطريقة مرتبة وواضحة.',
  },
  {
    icon: Search,
    title: 'بحث سريع',
    description: 'اعثر على الملفات والمراجع القانونية من خلال البحث المباشر داخل الأقسام المتاحة.',
  },
  {
    icon: ShieldCheck,
    title: 'تجربة خاصة وآمنة',
    description: 'تُسلَّم الملفات المطلوبة داخل المحادثة الفردية مع البوت، من دون عرض روابط المصادر الخارجية.',
  },
];

const usageSteps = [
  'افتح محادثة بوت الناصر القانوني على تيليغرام.',
  'أكمل بوابات الاستخدام المطلوبة ثم اختر القسم المناسب.',
  'تصفح المصادر أو ابدأ اختبارك أو استخدم البحث للوصول إلى ما تحتاجه.',
];

const BOT_PAGE_URL = 'https://alnaseer.org/bot';
const BOT_PAGE_SHARE_TEXT = 'بوت الناصر القانوني على تيليغرام: مكتبة قانونية واختبارات تفاعلية عربية من منصة الناصر القانونية.';

function SocialIcon({ network }: { network: 'facebook' | 'x' | 'whatsapp' | 'telegram' | 'instagram' }) {
  const paths = {
    facebook: <path d="M13.5 22v-8h2.8l.4-3h-3.2V9.1c0-.9.3-1.5 1.6-1.5H16.8V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.7v3h2.7v8h3.1Z" />,
    x: <path d="M18.2 2h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.7-8.8L1.2 2h6.8l4.7 6.2L18.2 2Zm-1.1 17.6h1.8L7.1 4.1H5.1l12 15.5Z" />,
    whatsapp: <path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.5 5.9L.1 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.4Zm-8.4 18.2a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 0 1-1.5-5.2C2.3 6.3 6.7 2 12.1 2c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.8-9.9 9.8Zm5.4-7.4c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.2c-.2.3-.8 1-1 1.2-.2.2-.3.2-.6.1-1.8-.9-3-2.6-3.3-3-.2-.3 0-.4.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4 0-.1-.3-.2-.6-.4Z" />,
    telegram: <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0Zm5.6 8.2-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5c.2-.2-.1-.3-.4-.1L7.5 14.7l-3-.9c-.6-.2-.7-.7.1-1L16.2 8.3c.5-.2 1 .1.3.9Z" />,
    instagram: <path d="M7.2 0h9.6A7.2 7.2 0 0 1 24 7.2v9.6a7.2 7.2 0 0 1-7.2 7.2H7.2A7.2 7.2 0 0 1 0 16.8V7.2A7.2 7.2 0 0 1 7.2 0Zm-.2 2.4A4.6 4.6 0 0 0 2.4 7v10A4.6 4.6 0 0 0 7 21.6h10a4.6 4.6 0 0 0 4.6-4.6V7A4.6 4.6 0 0 0 17 2.4H7Zm10.9 1.8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 5.8A6.2 6.2 0 1 1 5.8 12 6.2 6.2 0 0 1 12 5.8Zm0 2.4a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />,
  };

  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">{paths[network]}</svg>;
}

export default function TelegramBot() {
  const [shareNotice, setShareNotice] = useState('');
  const shareUrl = encodeURIComponent(BOT_PAGE_URL);
  const shareText = encodeURIComponent(BOT_PAGE_SHARE_TEXT);

  const handleInstagramShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'بوت الناصر القانوني', text: BOT_PAGE_SHARE_TEXT, url: BOT_PAGE_URL });
        setShareNotice('اختر إنستغرام من قائمة المشاركة على هاتفك.');
        return;
      }
      await navigator.clipboard.writeText(BOT_PAGE_URL);
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      setShareNotice('تم نسخ الرابط. الصقه في إنستغرام لمشاركته.');
    } catch {
      setShareNotice('يمكنك نسخ رابط الصفحة ومشاركته عبر إنستغرام.');
    }
  };
  return (
    <MainLayout>
      <TelegramBotSEO />

      <div dir="rtl" className="min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <section className="relative isolate overflow-hidden bg-[#061326] px-4 pb-20 pt-16 text-white md:pb-28 md:pt-24">
          <div className="absolute inset-0 -z-10 opacity-70" style={{ background: 'radial-gradient(circle at 15% 15%, rgba(34,158,217,.28), transparent 34%), radial-gradient(circle at 85% 20%, rgba(59,130,246,.20), transparent 30%), linear-gradient(135deg, #061326 0%, #0a2350 100%)' }} />
          <div className="container mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1.12fr_.88fr]">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/10 px-4 py-2 text-sm font-bold text-sky-100 backdrop-blur">
                  <Bot className="h-4 w-4" />
                  بوت الناصر القانوني على تيليغرام
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-[1.22] tracking-tight md:text-6xl">
                  مكتبتك القانونية واختباراتك التعليمية في <span className="text-sky-300">محادثة واحدة</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
                  يسهّل بوت الناصر القانوني الوصول المنظم إلى المصادر القانونية والاختبارات التفاعلية لطلاب الشريعة والقانون والباحثين، بإعداد وإشراف أ. معين الناصر.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://t.me/Moieen2025Bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#229ED9] px-6 text-base font-black text-white shadow-xl shadow-sky-950/30 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <Send className="h-5 w-5" />
                    افتح البوت على تيليغرام
                  </a>
                  <Link
                    to="/levels"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 text-base font-black text-white transition-colors hover:bg-white/10"
                  >
                    استكشف اختبارات المنصة
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                </div>
                <div className="mt-7 border-t border-white/15 pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-200"><Share2 className="h-4 w-4" /> شارك صفحة البوت</span>
                    <div className="flex items-center gap-2" dir="ltr">
                      <a aria-label="مشاركة صفحة البوت عبر فيسبوك" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-lg shadow-sky-950/20 transition-transform hover:-translate-y-0.5 active:scale-95"><SocialIcon network="facebook" /></a>
                      <a aria-label="مشاركة صفحة البوت عبر تويتر" href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg shadow-sky-950/20 transition-transform hover:-translate-y-0.5 active:scale-95"><SocialIcon network="x" /></a>
                      <a aria-label="مشاركة صفحة البوت عبر واتساب" href={`https://wa.me/?text=${encodeURIComponent(`${BOT_PAGE_SHARE_TEXT}\n${BOT_PAGE_URL}`)}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-lg shadow-sky-950/20 transition-transform hover:-translate-y-0.5 active:scale-95"><SocialIcon network="whatsapp" /></a>
                      <a aria-label="مشاركة صفحة البوت عبر تليغرام" href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-lg shadow-sky-950/20 transition-transform hover:-translate-y-0.5 active:scale-95"><SocialIcon network="telegram" /></a>
                      <button type="button" aria-label="مشاركة صفحة البوت عبر إنستغرام" onClick={handleInstagramShare} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ffba29] via-[#e1306c] to-[#833ab4] text-white shadow-lg shadow-sky-950/20 transition-transform hover:-translate-y-0.5 active:scale-95"><SocialIcon network="instagram" /></button>
                    </div>
                  </div>
                  {shareNotice && <p role="status" className="mt-3 text-xs font-semibold text-sky-200">{shareNotice}</p>}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-md">
                <div className="rounded-[2.25rem] border border-white/15 bg-slate-950/45 p-4 shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
                  <div className="rounded-[1.8rem] bg-white p-5 text-slate-800 shadow-inner">
                    <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#229ED9] text-white shadow-lg shadow-sky-200">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black">بوت الناصر القانوني</p>
                        <p className="mt-0.5 text-xs font-bold text-emerald-600">متصل الآن</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm leading-6">
                      <div className="rounded-2xl rounded-tr-sm bg-slate-100 p-3.5">مرحبًا بك. اختر القسم الذي تريد تصفحه أو ابدأ اختبارك.</div>
                      <div className="mr-auto w-fit rounded-2xl rounded-tl-sm bg-sky-50 p-3.5 font-bold text-sky-800">📚 المكتبة القانونية</div>
                      <div className="mr-auto w-fit rounded-2xl rounded-tl-sm bg-sky-50 p-3.5 font-bold text-sky-800">🧠 اختبارات الشريعة والقانون</div>
                      <div className="mr-auto w-fit rounded-2xl rounded-tl-sm bg-sky-50 p-3.5 font-bold text-sky-800">🎓 اختبارات الثانوية العامة</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-5 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <span className="ml-2 text-emerald-500">●</span> وصول منظم من تيليغرام
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:py-28">
          <div className="container mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary"><Sparkles className="h-4 w-4" /> ما الذي يقدمه البوت؟</div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">خدمات عملية صُممت لتختصر عليك وقت البحث والمراجعة</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">يجمع البوت بين تصفح المكتبة والبحث والاختبارات في تجربة تيليغرام عربية بسيطة وواضحة.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {botFeatures.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><feature.icon className="h-6 w-6" /></div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-20 dark:border-slate-800 dark:bg-slate-900 md:py-24">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><CheckCircle2 className="h-4 w-4" /> طريقة الاستخدام</div>
              <h2 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">ابدأ خلال دقائق</h2>
              <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">البوت مخصص لتقديم تجربة منظمة داخل تيليغرام، مع إرشاد واضح في كل خطوة.</p>
            </div>
            <ol className="space-y-4">
              {usageSteps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">{index + 1}</span>
                  <p className="pt-1 text-base font-bold leading-7 text-slate-700 dark:text-slate-200">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 py-20 md:py-28">
          <div className="container mx-auto max-w-4xl rounded-[2.25rem] bg-gradient-to-l from-primary to-blue-700 px-6 py-12 text-center text-white shadow-xl shadow-primary/20 md:px-12 md:py-16">
            <h2 className="text-3xl font-black md:text-4xl">هل أنت مستعد لبدء البحث أو التدريب؟</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">افتح بوت الناصر القانوني، واختر الخدمة التي تلائم احتياجك التعليمي أو البحثي.</p>
            <a href="https://t.me/Moieen2025Bot" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 font-black text-primary shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
              <Send className="h-5 w-5" /> ابدأ مع البوت الآن
            </a>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
