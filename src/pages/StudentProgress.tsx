import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Target, Flame, TrendingUp, BookOpen,
  Award, ChevronLeft, Search, Loader2, Star, Zap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface StudentProfile {
  student_name: string;
  total_exams: number;
  total_correct: number;
  total_questions_answered: number;
  best_score: number;
  current_streak: number;
  longest_streak: number;
  last_exam_date: string | null;
  badges: string[];
}

const ALL_BADGES = [
  { id: 'first_exam', icon: '🎯', label: 'أول اختبار' },
  { id: 'streak_3',   icon: '🔥', label: '3 أيام متتالية' },
  { id: 'streak_7',   icon: '⚡', label: 'أسبوع متواصل' },
  { id: 'perfect',    icon: '💯', label: 'إتقان تام' },
  { id: 'score_90',   icon: '🏆', label: 'متفوق' },
  { id: 'exams_10',   icon: '📚', label: 'مثابر' },
  { id: 'exams_50',   icon: '🎓', label: 'خبير' },
];

const StudentProgress = () => {
  const navigate = useNavigate();
  const [nameInput, setNameInput] = useState('');
  const [searchName, setSearchName] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile', searchName],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('student_name', searchName)
        .maybeSingle();
      return data as StudentProfile | null;
    },
    enabled: !!searchName,
  });

  const { data: recentResults } = useQuery({
    queryKey: ['student-recent', searchName],
    queryFn: async () => {
      const { data } = await supabase
        .from('exam_results')
        .select('score, total_questions, passed, created_at, subjects(name)')
        .eq('student_name', searchName)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!searchName,
  });

  const avgScore = profile && profile.total_questions_answered > 0
    ? Math.round((profile.total_correct / profile.total_questions_answered) * 100)
    : 0;

  const handleSearch = () => {
    if (nameInput.trim()) setSearchName(nameInput.trim());
  };

  return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-screen" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">

            <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> رجوع
            </button>

            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-10 h-10 text-violet-600" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-2">تقدمي الدراسي</h1>
              <p className="text-muted-foreground font-bold text-sm">ادخل اسمك كما تكتبه في الاختبار</p>
            </div>

            <div className="flex gap-2 mb-8">
              <Input
                placeholder="اسمك الكامل..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="h-12 rounded-xl font-bold bg-background border-border focus:border-primary"
              />
              <Button onClick={handleSearch} className="h-12 rounded-xl px-5">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {isLoading && (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            )}

            {searchName && !isLoading && !profile && (
              <div className="text-center py-16 bg-muted/30 rounded-3xl border border-border">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-black text-foreground text-lg">لا توجد بيانات لـ &quot;{searchName}&quot;</p>
                <p className="text-muted-foreground text-sm font-bold mt-1">تأكد أن الاسم مطابق تماماً</p>
              </div>
            )}

            {profile && (
              <div className="space-y-5">

                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                      🎓
                    </div>
                    <div>
                      <h2 className="text-xl font-black">{profile.student_name}</h2>
                      <div className="flex gap-3 mt-1 text-white/70 text-xs font-bold">
                        {profile.current_streak > 1 && (
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {profile.current_streak} يوم متواصل
                          </span>
                        )}
                        <span>{profile.total_exams} اختبار</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Target className="w-5 h-5" />, value: `${avgScore}%`, label: 'متوسط النتائج', color: 'bg-blue-50 border-blue-100 text-blue-800' },
                    { icon: <Trophy className="w-5 h-5" />, value: `${profile.best_score}%`, label: 'أفضل نتيجة', color: 'bg-yellow-50 border-yellow-100 text-yellow-800' },
                    { icon: <BookOpen className="w-5 h-5" />, value: profile.total_exams, label: 'إجمالي الاختبارات', color: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
                    { icon: <Flame className="w-5 h-5" />, value: `${profile.longest_streak} يوم`, label: 'أطول سلسلة', color: 'bg-orange-50 border-orange-100 text-orange-800' },
                  ].map((s, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl border text-center", s.color)}>
                      <div className="mb-1 flex justify-center">{s.icon}</div>
                      <p className="text-2xl font-black">{s.value}</p>
                      <p className="text-[10px] font-bold mt-0.5 opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-card rounded-3xl border border-border p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-black text-foreground">الشارات</h3>
                    <span className="mr-auto text-xs font-bold text-muted-foreground">
                      {(profile.badges || []).length}/{ALL_BADGES.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_BADGES.map(badge => {
                      const earned = (profile.badges || []).includes(badge.id);
                      return (
                        <div key={badge.id} className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all",
                          earned ? "bg-amber-50 border border-amber-200" : "bg-muted/40 opacity-40"
                        )}>
                          <span className="text-2xl">{badge.icon}</span>
                          <span className="text-[9px] font-black text-foreground">{badge.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {recentResults && recentResults.length > 0 && (
                  <div className="bg-card rounded-3xl border border-border p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-primary" />
                      <h3 className="font-black text-foreground">آخر الاختبارات</h3>
                    </div>
                    <div className="space-y-2">
                      {recentResults.map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                          <span className={cn("w-2 h-2 rounded-full", r.passed ? "bg-emerald-500" : "bg-rose-400")} />
                          <span className="flex-1 text-sm font-bold text-foreground">{r.subjects?.name || 'مادة'}</span>
                          <span className={cn("text-sm font-black", r.passed ? "text-emerald-600" : "text-rose-500")}>
                            {Math.round((r.score / r.total_questions) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default StudentProgress;
