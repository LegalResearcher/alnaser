import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';

const levelColors = [
  'from-blue-600 via-blue-500 to-indigo-400',
  'from-emerald-600 via-emerald-500 to-teal-400',
  'from-amber-600 via-amber-500 to-orange-400',
  'from-rose-600 via-rose-500 to-pink-400',
];

export function LevelsPreview() {
  const { data: levels = [] } = useCachedQuery<Level[]>(
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

  return (
    <section className="py-24 relative overflow-hidden bg-slate-50/50" id="levels">
      {/* لمسات خلفية ناعمة */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Section Header - تصميم أكثر فخامة */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
            <GraduationCap className="w-4 h-4" />
            مسار التعلم الذكي
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            استكشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">المستويات الدراسية</span>
          </h2>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
            تم تصميم كل مستوى بعناية ليأخذك من الأساسيات إلى الاحتراف القانوني عبر منهجية اختبارات عالمية.
          </p>
        </div>

        {/* Levels Grid - متجاوب تماماً مع الجوال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {levels.map((level, index) => (
            <Link
              key={level.id}
              to={`/levels/${level.id}`}
              className="group relative"
            >
              {/* Card - تأثيرات زجاجية وتحويم متطورة */}
              <div className="relative bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col overflow-hidden group-hover:-translate-y-3">
                
                {/* Header Gradient - نمط شبكي مع تدرج */}
                <div className={cn(
                  "h-40 bg-gradient-to-br relative overflow-hidden",
                  levelColors[index] || levelColors[0]
                )}>
                  {/* تأثير الشبكة داخل الجريدينت */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(30deg,#fff_12%,transparent_12.5%,transparent_87%,#fff_87.5%,#fff_100%),linear-gradient(150deg,#fff_12%,transparent_12.5%,transparent_87%,#fff_87.5%,#fff_100%),linear-gradient(30deg,#fff_12%,transparent_12.5%,transparent_87%,#fff_87.5%,#fff_100%),linear-gradient(150deg,#fff_12%,transparent_12.5%,transparent_87%,#fff_87.5%,#fff_100%),linear-gradient(60deg,#fff_25%,transparent_25.5%,transparent_75%,#fff_75%,#fff_100%),linear-gradient(60deg,#fff_25%,transparent_25.5%,transparent_75%,#fff_75%,#fff_100%)] bg-[length:20px_35px]" />
                  
                  {/* الرقم - تصميم عائم */}
                  <div className="absolute top-6 right-6">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                      <span className="relative text-2xl font-black text-white">{index + 1}</span>
                    </div>
                  </div>

                  {/* شارة المستوى */}
                  <div className="absolute bottom-4 left-6 px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                    Level {index + 1}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-black text-xl text-slate-800 mb-3 group-hover:text-primary transition-colors duration-300">
                    {level.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {level.description}
                  </p>
                  
                  {/* Action Button - يظهر كجزء من البطاقة */}
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-tight">
                      <BookOpen className="w-4 h-4" />
                      <span>عرض المواد</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA - زر عرض الجميع بتصميم مكمل للهيدر */}
        <div className="text-center">
          <Link to="/levels">
            <Button size="lg" className="rounded-full px-10 h-14 bg-slate-900 hover:bg-primary text-white font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-primary/30 transition-all duration-300 group">
              تصفح كافة الأقسام
              <ArrowLeft className="mr-3 w-5 h-5 rotate-180 group-hover:-translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
