import { ArrowRight, BookOpen, FlaskConical, GraduationCap, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

type ThirdSecondaryLevel = {
  id: string;
  name: string;
  description: string | null;
};

const LEVEL_NAMES = ['اختبارات ثالث ثانوي', 'اختبارات ثالث ثانوي – القسم العلمي'];

const ThirdSecondary = () => {
  const { data: levels = [], isLoading } = useCachedQuery<ThirdSecondaryLevel[]>(
    ['third-secondary-levels'],
    async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('id, name, description')
        .in('name', LEVEL_NAMES);
      if (error) throw error;
      return (data || []) as ThirdSecondaryLevel[];
    },
  );

  const literary = levels.find((level) => level.name === 'اختبارات ثالث ثانوي');
  const scientific = levels.find((level) => level.name === 'اختبارات ثالث ثانوي – القسم العلمي');

  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white py-12 dark:from-slate-950 dark:to-slate-900 md:py-20" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <GraduationCap className="h-8 w-8" />}
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-4xl">اختبارات ثالث ثانوي</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-8 text-slate-500 dark:text-slate-400">
                اختر القسم الدراسي لعرض مواده ونماذجه المستقلة لعام 2026.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16 text-violet-600"><Loader2 className="h-9 w-9 animate-spin" /></div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <SectionCard
                  level={literary}
                  title="ثالث ثانوي أدبي"
                  description="نماذج اختبارات القسم الأدبي للعام الدراسي 2025–2026."
                  icon={<BookOpen className="h-8 w-8" />}
                  className="from-violet-600 to-indigo-600"
                />
                <SectionCard
                  level={scientific}
                  title="ثالث ثانوي علمي"
                  description="المواد الجاهزة حاليًا: القرآن الكريم، التربية الإسلامية، اللغة العربية، واللغة الإنجليزية."
                  icon={<FlaskConical className="h-8 w-8" />}
                  className="from-emerald-600 to-teal-600"
                />
              </div>
            )}

            {!isLoading && !literary?.id && !scientific?.id && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-bold text-amber-800">
                تعذر العثور على قسمي ثالث ثانوي حاليًا.
              </div>
            )}

            <Link to="/levels" className="mx-auto mt-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <ArrowRight className="h-4 w-4" /> العودة إلى المستويات
            </Link>
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

function SectionCard({
  level,
  title,
  description,
  icon,
  className,
}: {
  level?: ThirdSecondaryLevel;
  title: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}) {
  if (!level?.id) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-7 opacity-70 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800">{icon}</div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-3 text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">سيظهر هذا القسم بعد اعتماد نماذجه في المنصة.</p>
      </div>
    );
  }

  return (
    <Link to={`/levels/${level.id}`} className="group block rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${className} text-white shadow-lg transition group-hover:scale-105`}>{icon}</div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-3 min-h-[4.5rem] text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-700 dark:text-violet-300">عرض المواد والنماذج <ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}

export default ThirdSecondary;
