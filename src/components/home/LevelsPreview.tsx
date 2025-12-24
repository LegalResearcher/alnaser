import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';

const levelColors = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-red-500 to-red-600',
];

export function LevelsPreview() {
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data as Level[];
    },
  });

  return (
    <section className="py-20" id="levels">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            المستويات <span className="text-gradient-primary">الدراسية</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            اختر المستوى المناسب لك وابدأ رحلتك في تطوير معرفتك القانونية
          </p>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {levels.map((level, index) => (
            <Link
              key={level.id}
              to={`/levels/${level.id}`}
              className="group"
            >
              <div className="bg-card rounded-2xl border overflow-hidden card-hover h-full">
                <div className={`h-32 bg-gradient-to-br ${levelColors[index] || levelColors[0]} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white/20,transparent_50%)]" />
                  <div className="absolute bottom-4 right-4 w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{index + 1}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {level.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {level.description}
                  </p>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span>عرض المواد</span>
                    <ArrowLeft className="w-4 h-4 mr-auto group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/levels">
            <Button size="lg" className="gradient-primary text-primary-foreground border-0 gap-2">
              عرض جميع المستويات
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
