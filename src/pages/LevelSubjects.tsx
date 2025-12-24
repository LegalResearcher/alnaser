import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Target, User, Lock, BookOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Level, Subject } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';

const LevelSubjects = () => {
  const { levelId } = useParams<{ levelId: string }>();

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

  const isLoading = (levelLoading && !level) || (subjectsLoading && subjects.length === 0);

  return (
    <MainLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link to="/levels" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمستويات</span>
          </Link>

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            {isLoading ? (
              <>
                <div className="h-10 w-48 mx-auto mb-4 bg-muted animate-pulse rounded" />
                <div className="h-6 w-72 mx-auto bg-muted animate-pulse rounded" />
              </>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  مواد <span className="text-gradient-primary">{level?.name}</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  اختر المادة التي تريد اختبارها
                </p>
              </>
            )}
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
              ))
            ) : subjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد مواد في هذا المستوى حالياً</p>
              </div>
            ) : (
              subjects.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/exam/${subject.id}`}
                  className="group"
                >
                  <div className="bg-card rounded-2xl border p-6 card-hover h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                      {subject.password && (
                        <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          محمي
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                    
                    {subject.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-primary" />
                        <span>{subject.questions_per_exam} سؤال</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{subject.default_time_minutes} دقيقة</span>
                      </div>
                      {subject.author_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-primary" />
                          <span>{subject.author_name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-primary font-medium mt-4">
                      <span>ابدأ الاختبار</span>
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
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

export default LevelSubjects;
