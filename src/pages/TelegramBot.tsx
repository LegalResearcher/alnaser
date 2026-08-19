import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  GraduationCap,
  Search,
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

export default function TelegramBot() {
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
