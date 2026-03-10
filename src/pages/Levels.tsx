import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Layers, Sparkles, ShieldOff, HelpCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';
import { LevelsSEO } from '@/components/seo/SEOHead';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [disabledDialog, setDisabledDialog] = useState<Level | null>(null);

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

  // جلب إجمالي عدد الأسئلة لكل مستوى
  const { data: questionCounts = {} } = useCachedQuery<Record<string, number>>(
    ['question-counts-by-level'],
    async () => {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, level_id');
      if (!subjects) return {};

      const counts: Record<string, number> = {};
      await Promise.all(
        subjects.map(async (subj: { id: string; level_id: string }) => {
          const { count } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subj.id)
            .eq('status', 'active');
          if (count && subj.level_id) {
            counts[subj.level_id] = (counts[subj.level_id] || 0) + count;
          }
        })
      );
      return counts;
    }
  );

  return (
    <MainLayout>
      <LevelsSEO />
      <section className="py-8 md:py-24 bg-slate-50/50 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* Header - تصميم فخم ومركزي */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-3 md:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em] animate-fade-in">
              <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
              المسار الأكاديمي القانوني
            </div>
            <h1 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight">
              اختر <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">مستواك الدراسي</span>
            </h1>
            <p className="text-slate-500 text-base md:text-xl font-medium px-4">
              حدد المرحلة التعليمية التي تنتمي إليها للوصول إلى بنك الأسئلة المخصص لك.
            </p>
          </div>

          {/* Levels Grid - (2x2) على الكمبيوتر وعمودي على الجوال */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
            {levelsLoading && levels.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 md:h-72 rounded-[2rem] md:rounded-[3rem] bg-white border border-slate-100 animate-pulse shadow-sm" />
              ))
            ) : (
              levels.map((level, index) => {
                const isDisabled = level.is_disabled;
                const CardWrapper = isDisabled ? 'div' : Link;
                const cardProps = isDisabled
                  ? {
                      onClick: () => setDisabledDialog(level),
                      className: 'group relative cursor-not-allowed',
                    }
                  : {
                      to: `/levels/${level.id}`,
                      className: 'group relative',
                    };

                return (
                  <CardWrapper key={level.id} {...(cardProps as any)}>
                    {/* Card Main Container */}
                    <div className={cn(
                      "bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 overflow-hidden transition-all duration-500 flex flex-col h-full shadow-sm active:scale-[0.98]",
                      isDisabled
                        ? 'opacity-60 grayscale-[30%]'
                        : 'hover:-translate-y-2 md:hover:-translate-y-3 hover:shadow-2xl',
                      !isDisabled && (levelColors[index]?.shadow || "shadow-slate-200")
                    )}>
                      
                      {/* Visual Top Section */}
                      <div className={cn(
                        "h-32 md:h-44 bg-gradient-to-br relative overflow-hidden",
                        isDisabled ? 'from-gray-400 via-gray-400 to-gray-300' : (levelColors[index]?.bg || levelColors[0].bg)
                      )}>
                        {/* تأثير الشبكة */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:24px_24px]" />
                        
                        {/* أيقونة القفل للمعطل */}
                        {isDisabled && (
                          <div className="absolute inset-0 flex items-center justify-center z-10">
                            <ShieldOff className="w-12 h-12 md:w-16 md:h-16 text-white/60" />
                          </div>
                        )}
                        
                        {/* الرقم العائم */}
                        <div className="absolute bottom-4 md:bottom-6 right-4 md:right-8">
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-[1.25rem] md:rounded-[2rem] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl">
                            <span className="text-3xl md:text-5xl font-black text-white">{index + 1}</span>
                          </div>
                        </div>

                        {/* شارة عدد المواد وعدد الأسئلة */}
                        <div className="absolute top-4 md:top-6 left-4 md:left-8 flex flex-col gap-1.5">
                          <span className="bg-black/10 backdrop-blur-sm text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 md:gap-2">
                            <Layers className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {subjectCounts[level.id] || 0} مادة
                          </span>
                          <span className="bg-black/10 backdrop-blur-sm text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 md:gap-2">
                            <HelpCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            {(questionCounts[level.id] || 0).toLocaleString('ar-EG')} سؤال
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6 md:p-10 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                           <Sparkles className={cn("w-4 h-4 md:w-5 md:h-5", isDisabled ? 'text-gray-400' : levelColors[index]?.icon)} />
                           <h2 className={cn(
                             "font-black text-xl md:text-2xl tracking-tight",
                             isDisabled ? 'text-slate-400' : 'text-slate-800 group-hover:text-primary transition-colors'
                           )}>
                            {level.name}
                          </h2>
                          {isDisabled && (
                            <span className="text-[10px] md:text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-bold shrink-0">
                              غير متاح
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-500 font-medium leading-relaxed mb-6 md:mb-8 line-clamp-2 text-sm md:text-base">
                          {level.description}
                        </p>
                        
                        {/* Action Button */}
                        <div className="mt-auto pt-4 md:pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className={cn(
                            "flex items-center gap-2 font-black text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em]",
                            isDisabled ? 'text-gray-400' : 'text-primary'
                          )}>
                            <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span>{isDisabled ? 'غير متاح حالياً' : 'تصفح المواد'}</span>
                          </div>
                          <div className={cn(
                            "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                            isDisabled
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-slate-50 group-hover:bg-primary group-hover:text-white'
                          )}>
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Dialog for disabled level */}
      <Dialog open={!!disabledDialog} onOpenChange={() => setDisabledDialog(null)}>
        <DialogContent className="w-[90vw] max-w-sm text-center p-6 sm:p-8">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-3">
              <ShieldOff className="w-8 h-8 text-orange-500" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              {disabledDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-2">
            {disabledDialog?.disabled_message || 'هذا القسم غير متاح حالياً'}
          </p>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Levels;
