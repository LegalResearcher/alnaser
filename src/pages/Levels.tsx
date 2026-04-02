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
const LEVELS_BG_IMAGE = "/bg-levels.jpg";

const levelColors = [
  { 
    bg: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
    accent: '#4f8ef7',
    glow: 'rgba(79,142,247,0.4)',
    shadow: 'shadow-blue-200',
    icon: 'text-blue-500',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    num: 'text-blue-300',
  },
  { 
    bg: 'from-[#0d1f0d] via-[#133313] to-[#1a4a1a]',
    accent: '#4ade80',
    glow: 'rgba(74,222,128,0.4)',
    shadow: 'shadow-emerald-200',
    icon: 'text-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    num: 'text-emerald-300',
  },
  { 
    bg: 'from-[#1f1a0d] via-[#332a13] to-[#4a3a1a]',
    accent: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    shadow: 'shadow-amber-200',
    icon: 'text-amber-500',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    num: 'text-amber-300',
  },
  { 
    bg: 'from-[#1f0d1a] via-[#331320] to-[#4a1a2e]',
    accent: '#f472b6',
    glow: 'rgba(244,114,182,0.4)',
    shadow: 'shadow-rose-200',
    icon: 'text-rose-500',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    num: 'text-rose-300',
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

  const col = (index: number) => levelColors[index] ?? levelColors[0];

  return (
    <MainLayout>
      <LevelsSEO />
      {/* Inject keyframes */}
      <style>{`
        @keyframes floatBadge { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes glowPulse  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .level-card { animation: slideUp 0.5s ease-out both; }
        .level-card:nth-child(1){animation-delay:0.05s}
        .level-card:nth-child(2){animation-delay:0.12s}
        .level-card:nth-child(3){animation-delay:0.19s}
        .level-card:nth-child(4){animation-delay:0.26s}
        .float-badge { animation: floatBadge 3s ease-in-out infinite; }
        .glow-dot    { animation: glowPulse 2s ease-in-out infinite; }
      `}</style>

      <section className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-10 md:py-20" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">

          {/* ── Header ── */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              المسار الأكاديمي القانوني
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              اختر{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-blue-600">مستواك الدراسي</span>
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-l from-primary to-blue-600 opacity-40" />
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">
              حدد المرحلة التعليمية التي تنتمي إليها للوصول إلى بنك الأسئلة المخصص لك.
            </p>
          </div>

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-7 max-w-5xl mx-auto">
            {levelsLoading && levels.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))
              : levels.map((level, index) => {
                  const isDisabled = level.is_disabled;
                  const c = col(index);
                  const CardWrapper = isDisabled ? 'div' : Link;
                  const cardProps = isDisabled
                    ? { onClick: () => setDisabledDialog(level), className: 'group level-card cursor-not-allowed block' }
                    : { to: `/levels/${level.id}`,              className: 'group level-card block' };

                  return (
                    <CardWrapper key={level.id} {...(cardProps as any)}>
                      <div className={cn(
                        "relative overflow-hidden rounded-[2rem] transition-all duration-400 active:scale-[0.98]",
                        isDisabled ? "opacity-55 grayscale-[40%]" : "hover:-translate-y-1.5 hover:shadow-2xl"
                      )}>

                        {/* ── Top dark image band ── */}
                        <div className="relative h-36 md:h-48 overflow-hidden"
                          style={!isDisabled ? {
                            background: `linear-gradient(135deg, ${c.bg.includes('1a1a2e') ? '#1a1a2e,#0f3460' : c.bg.includes('0d1f0d') ? '#0d2010,#133313' : c.bg.includes('1f1a0d') ? '#1f1a0d,#332a13' : '#1f0d1a,#4a1a2e'})`,
                          } : { background: '#1e1e2e' }}
                        >
                          {/* Background image overlay */}
                          {!isDisabled && (
                            <div className="absolute inset-0 opacity-15"
                              style={{ backgroundImage: `url(${LEVELS_BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          )}
                          {/* Dot grid overlay */}
                          <div className="absolute inset-0 opacity-[0.07]"
                            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                          {/* Glow effect */}
                          {!isDisabled && (
                            <div className="glow-dot absolute top-6 right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
                              style={{ background: c.glow }} />
                          )}
                          {/* Disabled icon */}
                          {isDisabled && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ShieldOff className="w-12 h-12 text-white/30" />
                            </div>
                          )}
                          {/* Stats badges top-left */}
                          {!isDisabled && (
                            <div className="absolute top-4 right-4 md:top-5 md:right-5 flex flex-col gap-2">
                              <span className={cn("flex items-center gap-1.5 text-[9px] md:text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm", c.badge)}>
                                <Layers className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                {subjectCounts[level.id] || 0} مادة
                              </span>
                              <span className={cn("flex items-center gap-1.5 text-[9px] md:text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-sm", c.badge)}>
                                <HelpCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                {(questionCounts[level.id] || 0).toLocaleString('ar-EG')} سؤال
                              </span>
                            </div>
                          )}
                          {/* Big number bottom-left */}
                          <div className="absolute bottom-4 left-4 md:bottom-5 md:left-6 float-badge">
                            <span className={cn("text-5xl md:text-7xl font-black leading-none select-none opacity-80", c.num)}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>
                          {/* Accent bar bottom */}
                          <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                            style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }} />
                        </div>

                        {/* ── Content bottom white band ── */}
                        <div className="bg-white dark:bg-slate-900 border border-t-0 border-slate-100 dark:border-slate-800 rounded-b-[2rem] px-6 md:px-8 py-5 md:py-6 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className={cn("w-4 h-4 shrink-0", isDisabled ? 'text-slate-400' : c.icon)} />
                              <h2 className={cn(
                                "font-black text-lg md:text-xl tracking-tight truncate",
                                isDisabled ? 'text-slate-400' : 'text-slate-800 dark:text-white'
                              )}>
                                {level.name}
                              </h2>
                              {isDisabled && (
                                <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black shrink-0">
                                  غير متاح
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 text-[11px] md:text-xs font-medium leading-relaxed line-clamp-1">
                              {level.description || 'بنك اختبارات الشريعة والقانون'}
                            </p>
                          </div>

                          {/* Arrow button */}
                          <div className={cn(
                            "shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                            isDisabled
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              : 'group-hover:scale-110 group-hover:shadow-lg'
                          )}
                            style={!isDisabled ? { background: c.accent, boxShadow: `0 4px 14px ${c.glow}` } : {}}
                          >
                            <ArrowLeft className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-0.5", isDisabled ? '' : 'text-white')} />
                          </div>
                        </div>

                      </div>
                    </CardWrapper>
                  );
                })
            }
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