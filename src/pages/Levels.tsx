import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Layers, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';

// تدرجات لونية مطورة تعطي طابعاً عالمياً (3-stop gradients)
const levelColors = [
  { 
    bg: 'from-blue-700 via-blue-600 to-indigo-500', 
    shadow: 'shadow-blue-200',
    icon: 'text-blue-600'
  },
  { 
    bg: 'from-emerald-700 via-emerald-600 to-teal-500', 
    shadow: 'shadow-emerald-200',
    icon: 'text-emerald-600'
  },
  { 
    bg: 'from-amber-600 via-amber-500 to-orange-400', 
    shadow: 'shadow-amber-200',
    icon: 'text-amber-600'
  },
  { 
    bg: 'from-rose-700 via-rose-600 to-pink-500', 
    shadow: 'shadow-rose-200',
    icon: 'text-rose-600'
  },
];

const Levels = () => {
  // جلب المستويات مع الترتيب
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

  // جلب عدد المواد لكل مستوى لزيادة المصداقية
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
      <section className="py-12 md:py-24 bg-slate-50/50 min-h-screen">
        <div className="container mx-auto px-6">
          
          {/* Header - تصميم فخم ومركزي */}
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] animate-fade-in">
              <GraduationCap className="w-4 h-4" />
              المسار الأكاديمي القانوني
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              اختر <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">مستواك الدراسي</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium">
              حدد المرحلة التعليمية التي تنتمي إليها للوصول إلى بنك الأسئلة المخصص لك.
            </p>
          </div>

          {/* Levels Grid - (2x2) على الكمبيوتر وعمودي على الجوال */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {levelsLoading && levels.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 rounded-[3rem] bg-white border border-slate-100 animate-pulse shadow-sm" />
              ))
            ) : (
              levels.map((level, index) => (
                <Link
                  key={level.id}
                  to={`/levels/${level.id}`}
                  className="group relative"
                >
                  {/* Card Main Container */}
                  <div className={cn(
                    "bg-white rounded-[3rem] border border-slate-100 overflow-hidden transition-all duration-500 hover:-translate-y-3 flex flex-col h-full shadow-sm hover:shadow-2xl",
                    levelColors[index]?.shadow || "shadow-slate-200"
                  )}>
                    
                    {/* Visual Top Section */}
                    <div className={cn(
                      "h-44 bg-gradient-to-br relative overflow-hidden",
                      levelColors[index]?.bg || levelColors[0].bg
                    )}>
                      {/* تأثير الشبكة (Mesh Pattern) */}
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:24px_24px]" />
                      
                      {/* الرقم العائم - تصميم زجاجي */}
                      <div className="absolute bottom-6 right-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                          <span className="text-5xl font-black text-white">{index + 1}</span>
                        </div>
                      </div>

                      {/* شارة عدد المواد */}
                      <div className="absolute top-6 left-8">
                        <span className="bg-black/10 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          {subjectCounts[level.id] || 0} مادة تعليمية
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-10 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                         <Sparkles className={cn("w-5 h-5", levelColors[index]?.icon)} />
                         <h2 className="font-black text-2xl text-slate-800 group-hover:text-primary transition-colors tracking-tight">
                          {level.name}
                        </h2>
                      </div>
                      
                      <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2">
                        {level.description}
                      </p>
                      
                      {/* Action Button */}
                      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
                          <BookOpen className="w-4 h-4" />
                          <span>تصفح المواد</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
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
