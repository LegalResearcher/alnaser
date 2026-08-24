import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

const ThirdSecondary = () => {
  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 md:py-20" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/levels"
              className="inline-flex items-center gap-2 mb-8 text-sm font-black text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة إلى المستويات
            </Link>

            <section className="relative overflow-hidden rounded-[2rem] border border-violet-200/70 dark:border-violet-900/60 bg-white dark:bg-slate-900 shadow-xl shadow-violet-900/10">
              <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-30" style={{ background: 'radial-gradient(circle at 15% 10%, rgba(139,92,246,0.22), transparent 36%), radial-gradient(circle at 90% 80%, rgba(59,130,246,0.16), transparent 35%)' }} />
              <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                  <GraduationCap className="h-10 w-10" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  مسار جديد
                </div>
                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  اختبارات ثالث ثانوي
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-8 text-slate-500 dark:text-slate-400 md:text-lg">
                  سيتم تجهيز مواد ثالث ثانوي ونماذجها هنا بنفس تجربة الاختبارات المعتمدة في منصة الناصر.
                </p>
                <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  <BookOpen className="h-5 w-5 shrink-0 text-violet-500" />
                  <span>بانتظار إضافة نماذج المواد</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default ThirdSecondary;
