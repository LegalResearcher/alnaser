import { BookOpen, Users, Award, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';

interface Stats {
  questionsCount: number;
  subjectsCount: number;
  examsCount: number;
  passRate: number;
}

export function StatsSection() {
  const { data: stats } = useCachedQuery<Stats>(
    ['site-stats'],
    async () => {
      // Fetch counts in parallel
      const [questionsRes, subjectsRes, examsRes] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('exam_results').select('id, passed', { count: 'exact' }),
      ]);

      const questionsCount = questionsRes.count || 0;
      const subjectsCount = subjectsRes.count || 0;
      const examsData = examsRes.data || [];
      const examsCount = examsRes.count || 0;
      
      const passedCount = examsData.filter(e => e.passed).length;
      const passRate = examsCount > 0 ? Math.round((passedCount / examsCount) * 100) : 85;

      return { questionsCount, subjectsCount, examsCount, passRate };
    }
  );

  const displayStats = [
    { icon: BookOpen, value: stats ? `+${stats.questionsCount}` : '+1000', label: 'سؤال' },
    { icon: Users, value: stats ? `+${stats.examsCount}` : '+5000', label: 'مختبر' },
    { icon: Award, value: stats ? `${stats.subjectsCount}` : '43', label: 'مادة' },
    { icon: Target, value: stats ? `${stats.passRate}%` : '85%', label: 'نسبة النجاح' },
  ];

  return (
    <section className="py-16 bg-card border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <stat.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
