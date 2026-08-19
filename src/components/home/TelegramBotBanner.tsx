import { ArrowLeft, BookOpen, Bot, GraduationCap, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const BOT_BENEFITS = [
  { icon: BookOpen, label: 'مكتبة قانونية منظمة' },
  { icon: GraduationCap, label: 'اختبارات تفاعلية' },
  { icon: Sparkles, label: 'بحث سريع بالعربية' },
];

export function TelegramBotBanner() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-24" dir="rtl">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 15% 28%, rgba(34,158,217,0.18), transparent 27%), radial-gradient(circle at 86% 75%, rgba(200,168,75,0.13), transparent 24%)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-sky-300/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#09182c]/85 shadow-[0_28px_100px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute -bottom-32 right-8 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.25fr_.75fr] lg:items-center lg:p-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-extrabold tracking-wide text-sky-100">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" /></span>
              بوت الناصر القانوني متاح الآن على تيليغرام
            </div>

            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              رفيقك القانوني الذكي،
              <span className="block bg-gradient-to-l from-sky-200 via-white to-amber-100 bg-clip-text text-transparent">في محادثة واحدة.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              انتقل من البحث في المصادر القانونية إلى التدريب والاختبارات التفاعلية عبر تجربة عربية منظمة، بإعداد وإشراف أ. معين الناصر.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              {BOT_BENEFITS.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3.5 py-2 text-sm font-bold text-slate-200">
                  <Icon className="h-4 w-4 text-amber-300" strokeWidth={2} />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/bot" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-400 to-cyan-300 px-6 py-3 text-base font-black text-slate-950 shadow-[0_12px_32px_rgba(34,158,217,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(34,158,217,0.34)] active:scale-[0.98]">
                استكشف صفحة البوت
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
              <a href="https://t.me/Moieen2025Bot" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3 text-base font-bold text-white transition-colors duration-200 hover:border-sky-200/40 hover:bg-white/[0.09] active:scale-[0.98]">
                <Send className="h-4 w-4 text-sky-200" />
                افتح البوت على تيليغرام
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-5 rounded-[2.25rem] bg-sky-400/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/[0.14] to-white/[0.035] p-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-blue-500 text-white shadow-lg shadow-sky-950/30"><Bot className="h-6 w-6" /></div>
                <div>
                  <p className="font-black text-white">بوت الناصر القانوني</p>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-300">متصل الآن</p>
                </div>
              </div>
              <div className="space-y-3 pt-5">
                <div className="mr-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-white/10 px-4 py-3 text-sm leading-6 text-slate-200">مرحبًا بك. اختر القسم الذي تريد تصفحه أو ابدأ اختبارك.</div>
                <div className="space-y-2">
                  <div className="rounded-xl border border-sky-200/15 bg-sky-300/[0.07] px-4 py-3 text-sm font-bold text-sky-100">📚 المكتبة القانونية</div>
                  <div className="rounded-xl border border-sky-200/15 bg-sky-300/[0.07] px-4 py-3 text-sm font-bold text-sky-100">🧠 اختبارات الشريعة والقانون</div>
                  <div className="rounded-xl border border-sky-200/15 bg-sky-300/[0.07] px-4 py-3 text-sm font-bold text-sky-100">🎓 اختبارات الثانوية العامة</div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-300" /> وصول منظم من تيليغرام</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
