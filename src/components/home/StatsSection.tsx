import { BookOpen, Users, Award, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';

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
    { 
      icon: BookOpen, 
      value: stats ? stats.questionsCount : 1000, 
      label: 'سؤال قانوني', 
      suffix: '+',
      color: 'from-blue-600 to-indigo-600'
    },
    { 
      icon: Users, 
      value: stats ? stats.examsCount : 5000, 
      label: 'باحث ومختبر', 
      suffix: '+',
      color: 'from-purple-600 to-blue-600'
    },
    { 
      icon: Award, 
      value: stats ? stats.subjectsCount : 43, 
      label: 'مادة تعليمية', 
      suffix: '',
      color: 'from-emerald-600 to-teal-600'
    },
    { 
      icon: Target, 
      value: stats ? stats.passRate : 85, 
      label: 'نسبة النجاح', 
      suffix: '%',
      color: 'from-orange-600 to-amber-600'
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden bg-[#0a0f1d]">
      {/* لمسة فنية خلفية - توهج ضوئي */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header صغير للقسم يعزز المظهر الاحترافي */}
        <div className="flex flex-col items-center mb-16 text-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <TrendingUp className="w-3 h-3" />
            إحصائيات المنصة الحية
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            نحن ننمو <span className="text-primary">بثقتكم</span> كل يوم
          </h2>
        </div>

        {/* Grid الإحصائيات - متجاوب تماماً */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col items-center p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/10 hover:border-primary/30 hover:-translate-y-2">
                
                {/* أيقونة بتصميم "Layered Glass" */}
                <div className={cn(
                  "relative w-16 h-16 rounded-2xl bg-gradient-to-tr flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500",
                  stat.color
                )}>
                  <div className="absolute inset-0 rounded-2xl bg-white/20 blur-[2px]" />
                  <stat.icon className="relative w-8 h-8 text-white z-10" />
                </div>

                {/* القيمة العددية */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                    {stat.value}
                  </span>
                  <span className="text-xl font-bold text-primary">{stat.suffix}</span>
                </div>

                {/* النص التوضيحي */}
                <p className="text-slate-400 font-bold text-sm md:text-base uppercase tracking-wide group-hover:text-slate-200 transition-colors">
                  {stat.label}
                </p>

                {/* خط تزييني سفلي يظهر عند التحويم */}
                <div className="absolute bottom-4 w-8 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
