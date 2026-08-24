import { useEffect } from 'react';
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

const ThirdSecondary = () => {
  const navigate = useNavigate();
  const { data: level, isLoading } = useCachedQuery<{ id: string } | null>(
    ['third-secondary-level'],
    async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('id')
        .eq('name', 'اختبارات ثالث ثانوي')
        .maybeSingle();
      if (error) throw error;
      return data as { id: string } | null;
    },
  );

  useEffect(() => {
    if (level?.id) navigate(`/levels/${level.id}`, { replace: true });
  }, [level?.id, navigate]);

  return (
    <MainLayout>
      <main className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12 md:py-20" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-violet-200/70 bg-white p-8 text-center shadow-xl shadow-violet-900/10 dark:border-violet-900/60 dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <GraduationCap className="h-8 w-8" />}
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">اختبارات ثالث ثانوي</h1>
            <p className="mt-3 text-sm font-medium leading-7 text-slate-500 dark:text-slate-400">
              {isLoading ? 'جاري فتح مواد ثالث ثانوي…' : 'تعذر العثور على القسم حاليًا.'}
            </p>
            {!isLoading && !level?.id && (
              <Link to="/levels" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white">
                <ArrowRight className="h-4 w-4" /> العودة إلى المستويات
              </Link>
            )}
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default ThirdSecondary;
