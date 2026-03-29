import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Clock, Target, User, 
  Lock, BookOpen, Layers, Sparkles, ChevronLeft, Settings2, Zap 
} from 'lucide-react';
import SubjectSettingsModal from '@/components/SubjectSettingsModal';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LevelSubjectsSEO } from '@/components/seo/SEOHead';

const LevelSubjects = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settingsSubject, setSettingsSubject] = useState<(Subject & { levelName?: string }) | null>(null);

  // جلب بيانات المستوى الحالي
  const { data: level, isLoading: levelLoading } = useCachedQuery<Level | null>(
    ['level', levelId],
    async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelId)
        .maybeSingle();
      if (error) throw error;
      return data as Level | null;
    },
    { enabled: !!levelId }
  );

  // تسجيل الزيارة يتم تلقائياً عبر MainLayout — لا حاجة لتسجيل مكرر هنا

  // إعادة توجيه إذا كان المستوى معطلاً
  useEffect(() => {
    if (level && level.is_disabled) {
      toast({
        title: level.disabled_message || 'هذا القسم غير متاح حالياً',
        variant: 'destructive',
      });
      navigate('/levels', { replace: true });
    }
  }, [level, navigate, toast]);

  // جلب المواد التابعة لهذا المستوى
  const { data: subjects = [], isLoading: subjectsLoading } = useCachedQuery<Subject[]>(
    ['subjects', levelId],
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('level_id', levelId)
        .order('order_index');
      if (error) throw error;
      return data as Subject[];
    },
    { enabled: !!levelId }
  );

  // جلب عدد الأسئلة الفعلي لكل مادة
  const { data: questionCounts = {}, isLoading: countsLoading } = useQuery({
    queryKey: ['question-counts', levelId, subjects.map(s => s.id).join(',')],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        subjects.map(async (subject) => {
          const { count, error } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subject.id)
            .eq('status', 'active');
          if (!error) counts[subject.id] = count || 0;
        })
      );
      return counts;
    },
    enabled: subjects.length > 0
  });

  // جلب المواد التي أُضيفت فيها أسئلة جديدة خلال آخر 7 أيام
  const { data: subjectsWithNewQs = new Set<string>() } = useQuery<Set<string>>({
    queryKey: ['new-questions-subjects', levelId, subjects.map(s => s.id).join(',')],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('questions')
        .select('subject_id')
        .in('subject_id', subjects.map(s => s.id))
        .eq('status', 'active')
        .gte('created_at', since);
      if (error) throw error;
      return new Set((data || []).map((q: { subject_id: string }) => q.subject_id));
    },
    enabled: subjects.length > 0,
  });

  const isLoading = (levelLoading && !level) || (subjectsLoading && subjects.length === 0);

  // إجمالي الأسئلة في المستوى
  const totalQuestions = Object.values(questionCounts).reduce((a, b) => a + b, 0);

  return (
    <MainLayout>
      <LevelSubjectsSEO levelName={level?.name ?? ''} levelNumber={Number(levelId)} subjectsCount={subjects?.length ?? 0} />

      {/* ── هيدر المستوى الاحترافي ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a1628 100%)' }}>
        {/* شبكة خلفية */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* توهجات */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />

        <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 relative z-10">
          {/* زر العودة */}
          <button
            onClick={() => navigate('/levels')}
            className="group inline-flex items-center gap-2 mb-8 md:mb-12 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all font-bold text-xs uppercase tracking-widest backdrop-blur-sm active:scale-95"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            العودة لجميع المستويات
          </button>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 w-48 bg-white/10 animate-pulse rounded-2xl" />
              <div className="h-6 w-72 bg-white/5 animate-pulse rounded-xl" />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* شارة المحتوى */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-500/10 mb-6">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-300 font-black text-[10px] uppercase tracking-[0.25em]">المحتوى الدراسي</span>
              </div>

              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight mb-4 leading-none">
                مواد{' '}
                <span className="italic" style={{ background: 'linear-gradient(90deg, #60a5fa, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {level?.name}
                </span>
              </h1>

              <p className="text-white/50 text-base md:text-lg max-w-2xl leading-relaxed font-medium mb-8">
                استعرض المواد القانونية المتاحة وابدأ رحلة التقييم الذاتي — كل اختبار خطوة نحو التفوق.
              </p>

              {/* إحصائيات سريعة */}
              {!countsLoading && subjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm leading-none">{subjects.length}</p>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-0.5">مادة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm leading-none">{totalQuestions.toLocaleString('ar-SA')}</p>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-0.5">سؤال متاح</p>
                    </div>
                  </div>
                  {subjectsWithNewQs.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-black text-[10px] uppercase tracking-wider">{subjectsWithNewQs.size} مادة محدّثة</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* فاصل منحني */}
        <div className="relative h-10 md:h-14">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none" style={{ height: '100%' }}>
            <path d="M0 56L1440 56L1440 28C1200 0 960 0 720 28C480 56 240 56 0 28L0 56Z" className="fill-slate-50 dark:fill-background" />
          </svg>
        </div>
      </div>

      {/* ── شبكة المواد ── */}
      <section className="py-8 md:py-14 bg-slate-50 dark:bg-background min-h-[50vh]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 md:h-64 rounded-[2rem] bg-white dark:bg-card border border-slate-100 dark:border-border shadow-sm animate-pulse" />
              ))
            ) : subjects.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white dark:bg-card rounded-[2rem] border border-dashed border-slate-200 dark:border-border">
                <div className="w-20 h-20 bg-slate-50 dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 dark:text-muted-foreground text-xl font-bold">لا توجد مواد في هذا المستوى حالياً</p>
                <p className="text-slate-400 dark:text-muted-foreground text-sm mt-2">سيتم إضافة المحتوى قريباً</p>
              </div>
            ) : (
              subjects.map((subject, idx) => {
                const hasNew = subjectsWithNewQs.has(subject.id);
                const qCount = questionCounts[subject.id] ?? 0;
                return (
                  <div key={subject.id} className="group relative" style={{ animationDelay: `${idx * 60}ms` }}>
                    {/* زر الإعدادات */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSettingsSubject({ ...subject, levelName: level?.name }); }}
                      className="absolute top-4 left-4 z-30 w-9 h-9 rounded-xl bg-white/90 dark:bg-card border border-slate-200 dark:border-border shadow-sm flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
                      title="إعدادات المادة"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>

                    <Link to={`/exam/${subject.id}`} className="block h-full">
                      <div className={cn(
                        "relative rounded-[2rem] border p-6 md:p-7 shadow-sm transition-all duration-500 h-full flex flex-col overflow-hidden",
                        "hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98]",
                        hasNew
                          ? "bg-white dark:bg-card border-amber-200/60 dark:border-amber-800/40 hover:shadow-amber-100/60 dark:hover:shadow-amber-900/30"
                          : "bg-white dark:bg-card border-slate-100 dark:border-border hover:shadow-primary/10"
                      )}>

                        {/* شارة التحديث — ribbon احترافي */}
                        {hasNew && (
                          <div className="absolute top-0 left-0 z-20 pointer-events-none overflow-hidden w-32 h-32 rounded-tl-[2rem]">
                            {/* الشريط المائل */}
                            <div
                              className="absolute flex items-center justify-center gap-1 font-black text-[9px] tracking-wide text-black"
                              style={{
                                top: '18px',
                                left: '-30px',
                                width: '130px',
                                padding: '5px 0',
                                transform: 'rotate(-40deg)',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                                boxShadow: '0 4px 20px rgba(245,158,11,0.7), 0 0 40px rgba(245,158,11,0.3)',
                              }}>
                              {/* نقطة نابضة */}
                              <span className="relative flex w-1.5 h-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40" />
                                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-black/60" />
                              </span>
                              <Zap className="w-2.5 h-2.5" />
                              محدّث
                            </div>
                          </div>
                        )}

                        {/* توهج خلفي */}
                        <div className={cn(
                          "absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl transition-all duration-500 pointer-events-none",
                          hasNew ? "bg-amber-400/10 group-hover:bg-amber-400/20" : "bg-primary/5 group-hover:bg-primary/10"
                        )} />
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-3xl bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-all duration-500 pointer-events-none" />

                        {/* رأس البطاقة */}
                        <div className={cn("flex items-start justify-between mb-6 relative z-10", hasNew && "mt-4")}>
                          {/* أيقونة المادة */}
                          <div className="relative">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                              style={{ background: hasNew ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #4f46e5)' }}>
                              <BookOpen className="w-7 h-7 md:w-8 md:h-8 text-white" />
                            </div>
                            {hasNew && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-amber-400/50">
                                <Sparkles className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>

                          {subject.password && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
                              <Lock className="w-2.5 h-2.5" />
                              دخول خاص
                            </div>
                          )}
                        </div>

                        {/* اسم المادة */}
                        <h3 className="font-black text-xl md:text-2xl text-slate-800 dark:text-foreground mb-2 group-hover:text-primary transition-colors leading-tight relative z-10">
                          {subject.name}
                        </h3>

                        {subject.description && (
                          <p className="text-slate-400 dark:text-muted-foreground text-xs md:text-sm line-clamp-2 leading-relaxed font-medium mb-4 relative z-10">
                            {subject.description}
                          </p>
                        )}

                        {/* شريط تقدم الأسئلة */}
                        <div className="mt-auto relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">بنك الأسئلة</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-foreground">
                              {countsLoading ? <span className="inline-block w-8 h-3 bg-slate-200 animate-pulse rounded" /> : <>{qCount} سؤال</>}
                            </span>
                          </div>
                          {/* شريط بصري */}
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, (qCount / 800) * 100)}%`,
                                background: hasNew ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                              }}
                            />
                          </div>
                        </div>

                        {/* فاصل */}
                        <div className="border-t border-slate-50 dark:border-border mt-5 pt-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black">{subject.default_time_minutes} د</span>
                              </div>
                              {subject.author_name && (
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <User className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black truncate max-w-[80px]">{subject.author_name}</span>
                                </div>
                              )}
                            </div>

                            {/* زر الاختبار */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 group-hover:gap-3"
                              style={{
                                background: hasNew ? 'linear-gradient(135deg, #f59e0b20, #f59e0b10)' : 'linear-gradient(135deg, #3b82f620, #6366f110)',
                                color: hasNew ? '#d97706' : '#3b82f6',
                                border: hasNew ? '1px solid #f59e0b30' : '1px solid #3b82f620'
                              }}>
                              <Sparkles className="w-3 h-3" />
                              <span>ابدأ الاختبار</span>
                              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      {settingsSubject && (
        <SubjectSettingsModal
          subject={settingsSubject}
          onClose={() => setSettingsSubject(null)}
        />
      )}
    </MainLayout>
  );
};

export default LevelSubjects;