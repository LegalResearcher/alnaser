import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Clock, Target, User, 
  Lock, BookOpen, Layers, Sparkles, ChevronLeft, Settings2 
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

  const isLoading = (levelLoading && !level) || (subjectsLoading && subjects.length === 0);

  return (
    <MainLayout>
      <LevelSubjectsSEO levelName={level?.name ?? ''} levelNumber={Number(levelId)} subjectsCount={subjects?.length ?? 0} />
      <section className="py-8 md:py-24 bg-slate-50/30 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 md:px-6">
          
          {/* زر العودة بتصميم عصري */}
          <button 
            onClick={() => navigate('/levels')}
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-8 md:mb-12 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>العودة لجميع المستويات</span>
          </button>

          {/* الهيدر: عنوان المستوى ووصفه */}
          <div className="max-w-4xl mb-10 md:mb-16 animate-in fade-in slide-in-from-right duration-700">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-10 md:h-12 w-48 md:w-64 bg-slate-200 animate-pulse rounded-2xl" />
                <div className="h-5 md:h-6 w-72 md:w-96 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 text-primary">
                  <Layers className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em]">المحتوى الدراسي</span>
                </div>
                <h1 className="text-3xl md:text-6xl font-black text-slate-900 mb-4 md:mb-6 tracking-tight">
                  مواد <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600 italic">
                    {level?.name}
                  </span>
                </h1>
                <p className="text-slate-500 text-base md:text-xl max-w-2xl leading-relaxed font-medium">
                  استعرض قائمة المواد القانونية المتاحة في هذا المستوى، وابدأ رحلة التقييم الذاتي وتطوير مهاراتك.
                </p>
              </>
            )}
          </div>

          {/* شبكة المواد */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 md:h-64 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-slate-100 shadow-sm animate-pulse" />
              ))
            ) : subjects.length === 0 ? (
              <div className="col-span-full py-16 md:py-24 text-center bg-white rounded-[2rem] md:rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
                </div>
                <p className="text-slate-500 text-lg md:text-xl font-bold">لا توجد مواد في هذا المستوى حالياً</p>
                <p className="text-slate-400 text-sm mt-2">سيتم إضافة المحتوى قريباً من قبل الإدارة</p>
              </div>
            ) : (
              subjects.map((subject) => (
                <div key={subject.id} className="group relative">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSettingsSubject({ ...subject, levelName: level?.name }); }}
                    className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 opacity-0 group-hover:opacity-100"
                    title="إعدادات المادة"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/exam/${subject.id}`}
                    className="block"
                  >
                    {/* Subject Card */}
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 p-5 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full flex flex-col group-hover:-translate-y-2 relative overflow-hidden active:scale-[0.98]">
                      
                      {/* خلفية تزيينية خفيفة */}
                      <div className="absolute -top-10 -right-10 w-24 md:w-32 h-24 md:h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                      <div className="flex items-start justify-between mb-5 md:mb-8 relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
                          <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                        {subject.password && (
                          <div className="bg-amber-50 text-amber-600 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 md:gap-2">
                            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            دخول خاص
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-black text-xl md:text-2xl text-slate-800 mb-2 md:mb-3 group-hover:text-primary transition-colors leading-tight">
                        {subject.name}
                      </h3>
                      
                      {subject.description && (
                        <p className="text-slate-500 text-xs md:text-sm mb-5 md:mb-8 line-clamp-2 leading-relaxed font-medium">
                          {subject.description}
                        </p>
                      )}
                      
                      {/* Metadata Grid */}
                      <div className="mt-auto pt-4 md:pt-6 border-t border-slate-50 grid grid-cols-2 gap-y-3 md:gap-y-4 gap-x-2 relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary/70" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tighter">
                            {countsLoading ? (
                              <span className="inline-block w-8 h-3 bg-slate-200 animate-pulse rounded" />
                            ) : (
                              <>{questionCounts[subject.id] ?? 0} سؤال</>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary/70" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tighter">{subject.default_time_minutes} دقيقة</span>
                        </div>
                        {subject.author_name && (
                          <div className="col-span-2 flex items-center gap-2 md:gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary/70" />
                            </div>
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tighter truncate">{subject.author_name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex items-center justify-between mt-5 md:mt-8 text-primary font-black text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em]">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" />
                          <span>ابدأ الاختبار</span>
                        </div>
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
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
