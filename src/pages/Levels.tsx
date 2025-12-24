import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';

const levelColors = [
  { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600' },
  { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600' },
  { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50 text-amber-600' },
  { bg: 'from-red-500 to-red-600', light: 'bg-red-50 text-red-600' },
];

const Levels = () => {
  const { data: levels = [], isLoading: levelsLoading } = useCachedQuery<Level[]>(
    ['levels'],
    async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as Level[];
    }
  );

  const { data: subjectCounts = {} } = useCachedQuery<Record<string, number>>(
    ['subject-counts'],
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('level_id');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((s: { level_id: string }) => {
        counts[s.level_id] = (counts[s.level_id] || 0) + 1;
      });
      return counts;
    }
  );

  return (
    <MainLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              اختر <span className="text-gradient-primary">المستوى</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              حدد المستوى الدراسي المناسب لك للبدء في الاختبارات
            </p>
          </div>

          {/* Levels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {levelsLoading && levels.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
              ))
            ) : (
              levels.map((level, index) => (
                <Link
                  key={level.id}
                  to={`/levels/${level.id}`}
                  className="group"
                >
                  <div className="bg-card rounded-2xl border overflow-hidden card-hover h-full">
                    <div className={`h-40 bg-gradient-to-br ${levelColors[index]?.bg || levelColors[0].bg} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white/20,transparent_50%)]" />
                      <div className="absolute bottom-4 right-4 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{index + 1}</span>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full">
                          {subjectCounts[level.id] || 0} مادة
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h2 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                        {level.name}
                      </h2>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {level.description}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <BookOpen className="w-4 h-4" />
                        <span>عرض المواد</span>
                        <ArrowLeft className="w-4 h-4 mr-auto group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Levels;
