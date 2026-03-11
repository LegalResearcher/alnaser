import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, BarChart3, Play,
  TrendingUp, TrendingDown, GraduationCap
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/database';
import { cn } from '@/lib/utils';

const QUESTIONS_PER_SUBJECT = 3;

interface Level {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
}

interface SubjectSample {
  subjectId: string;
  subjectName: string;
  questions: Question[];
}

interface SubjectScore {
  subjectId: string;
  subjectName: string;
  correct: number;
  total: number;
  pct: number;
}

const DiagnosticTest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'name' | 'level' | 'loading' | 'test' | 'result'>('name');
  const [studentName, setStudentName] = useState('');
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [_samples, setSamples] = useState<SubjectSample[]>([]);
  const [allQuestions, setAllQuestions] = useState<(Question & { subjectId: string; subjectName: string })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  const handleNameNext = useCallback(async () => {
    if (!studentName.trim()) return;
    const { data } = await supabase
      .from('levels')
      .select('id, name, color, order_index')
      .eq('is_disabled', false)
      .order('order_index');
    setLevels((data as Level[]) || []);
    setStep('level');
  }, [studentName]);

  const loadQuestions = useCallback(async (level: Level) => {
    setSelectedLevel(level);
    setStep('loading');
    try {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('level_id', level.id)
        .limit(10);

      if (!subjects || subjects.length === 0) { setStep('level'); return; }

      const samplesData: SubjectSample[] = [];
      for (const subj of subjects) {
        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', subj.id)
          .eq('status', 'active')
          .limit(20);
        if (qs && qs.length >= QUESTIONS_PER_SUBJECT) {
          const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_SUBJECT);
          samplesData.push({ subjectId: subj.id, subjectName: subj.name, questions: shuffled as Question[] });
        }
      }

      if (samplesData.length === 0) { setStep('level'); return; }

      const flat = samplesData.flatMap(s =>
        s.questions.map(q => ({ ...q, subjectId: s.subjectId, subjectName: s.subjectName }))
      );
      setSamples(samplesData);
      setAllQuestions(flat.sort(() => Math.random() - 0.5));
      setStep('test');
    } catch { setStep('level'); }
  }, []);

  const handleAnswer = (opt: string) => {
    if (hasAnswered) return;
    setSelected(opt);
    setHasAnswered(true);
    const q = allQuestions[currentIndex];
    setAnswers(prev => ({ ...prev, [q.id]: opt }));
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelected(null);
      setHasAnswered(false);
    } else {
      const scores: Record<string, SubjectScore> = {};
      allQuestions.forEach(q => {
        if (!scores[q.subjectId]) {
          scores[q.subjectId] = { subjectId: q.subjectId, subjectName: q.subjectName, correct: 0, total: 0, pct: 0 };
        }
        scores[q.subjectId].total++;
        if (answers[q.id] === q.correct_option) scores[q.subjectId].correct++;
      });
      const finalScores = Object.values(scores).map(s => ({ ...s, pct: Math.round((s.correct / s.total) * 100) }));
      setSubjectScores(finalScores.sort((a, b) => b.pct - a.pct));
      setStep('result');
    }
  };

  // ── الخطوة 1: الاسم ──
  if (step === 'name') return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-screen" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate('/levels')} className="mb-8 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> رجوع
            </button>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-violet-600" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-3">الاختبار التشخيصي</h1>
              <div className="space-y-1 text-sm text-muted-foreground font-bold">
                <p>أسئلة سريعة من مواد المستوى الذي تختاره</p>
                <p>تكشف نقاط قوتك وضعفك خلال دقائق</p>
              </div>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="اسمك الكامل..."
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && studentName.trim() && handleNameNext()}
                className="h-13 rounded-xl font-bold bg-muted/30 border-border focus:border-violet-500 text-right"
              />
              <Button onClick={handleNameNext} disabled={!studentName.trim()} className="w-full h-13 rounded-xl font-black bg-violet-600 hover:bg-violet-700 text-white">
                التالي <ChevronRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );

  // ── الخطوة 2: اختيار المستوى ──
  if (step === 'level') return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-screen" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-lg mx-auto">
            <button onClick={() => setStep('name')} className="mb-8 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-4 h-4" /> رجوع
            </button>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-10 h-10 text-violet-600" />
              </div>
              <h1 className="text-3xl font-black text-foreground mb-2">اختر مستواك</h1>
              <p className="text-sm text-muted-foreground font-bold">
                مرحباً <span className="text-violet-600">{studentName}</span>، حدد المستوى الذي تريد تشخيصه
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {levels.map((level, i) => (
                <button
                  key={level.id}
                  onClick={() => loadQuestions(level)}
                  className="group w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-violet-400 hover:bg-violet-50 transition-all duration-200 flex items-center gap-4 text-right active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center font-black text-violet-700 text-xl transition-colors shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-foreground text-base">{level.name}</p>
                    <p className="text-xs text-muted-foreground font-bold mt-0.5">أسئلة تشخيصية من جميع مواد هذا المستوى</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );

  // ── تحميل ──
  if (step === 'loading') return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        <span className="mr-3 font-black text-foreground">جاري تحضير أسئلة {selectedLevel?.name}...</span>
      </div>
    </MainLayout>
  );

  // ── الاختبار ──
  if (step === 'test') {
    const q = allQuestions[currentIndex];
    const opts = ['A','B','C','D'] as const;
    const progress = ((currentIndex + 1) / allQuestions.length) * 100;

    return (
      <MainLayout>
        <section className="py-6 md:py-10 min-h-screen" dir="rtl">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">

              <div className="flex items-center justify-between mb-2 text-sm font-black text-muted-foreground">
                <span>{currentIndex + 1} / {allQuestions.length}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-bold">{selectedLevel?.name}</span>
                  <span className="text-violet-600">{q.subjectName}</span>
                </div>
              </div>

              <div className="h-2 rounded-full bg-muted mb-8 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="bg-card rounded-3xl border border-border p-6 md:p-10 mb-6 shadow-lg">
                <h2 className="text-lg md:text-2xl font-black text-foreground mb-8 leading-relaxed">{q.question_text}</h2>

                <div className="space-y-3">
                  {opts.map(opt => {
                    const key = `option_${opt.toLowerCase()}` as keyof Question;
                    const text = q[key] as string;
                    if (!text?.trim()) return null;
                    const isSel = selected === opt;
                    const isCorr = q.correct_option === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        disabled={hasAnswered}
                        className={cn(
                          'w-full p-4 rounded-2xl border-2 flex items-center gap-3 text-right transition-all duration-200 font-bold text-sm',
                          !hasAnswered && 'hover:border-violet-300 hover:bg-violet-50 active:scale-[0.99]',
                          hasAnswered && isCorr && 'bg-emerald-50 border-emerald-400 text-emerald-700',
                          hasAnswered && isSel && !isCorr && 'bg-rose-50 border-rose-400 text-rose-700',
                          !hasAnswered && 'bg-card border-border text-foreground',
                          hasAnswered && !isSel && !isCorr && 'bg-card border-border text-muted-foreground opacity-60'
                        )}
                      >
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-xs shrink-0">{opt}</span>
                        <span className="flex-1">{text}</span>
                        {hasAnswered && isCorr && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                        {hasAnswered && isSel && !isCorr && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasAnswered && (
                <Button onClick={handleNext} className="w-full h-13 rounded-2xl font-black bg-violet-600 hover:bg-violet-700 text-white">
                  {currentIndex < allQuestions.length - 1
                    ? <><ChevronRight className="w-4 h-4 ml-1" /> التالي</>
                    : <><BarChart3 className="w-4 h-4 ml-1" /> عرض النتائج</>}
                </Button>
              )}
            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  // ── النتيجة ──
  if (step === 'result') {
    const totalCorrect = allQuestions.filter(q => answers[q.id] === q.correct_option).length;
    const totalPct = Math.round((totalCorrect / allQuestions.length) * 100);
    const weakSubjects = subjectScores.filter(s => s.pct < 60);
    const strongSubjects = subjectScores.filter(s => s.pct >= 80);

    return (
      <MainLayout>
        <section className="py-8 md:py-16 min-h-screen" dir="rtl">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto space-y-5">

              <div className="bg-gradient-to-br from-violet-600 to-indigo-800 rounded-3xl p-8 text-center text-white">
                <div className="w-16 h-16 bg-white dark:bg-card/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black mb-1">نتيجة التشخيص</h1>
                <p className="text-white/70 font-bold text-sm">{studentName}</p>
                <p className="text-white/50 font-bold text-xs mb-4">{selectedLevel?.name}</p>
                <p className="text-5xl font-black mb-1">{totalPct}%</p>
                <p className="text-white/60 text-sm font-bold">{totalCorrect} من {allQuestions.length} إجابة صحيحة</p>
              </div>

              {weakSubjects.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    <h3 className="font-black text-rose-700">تحتاج تركيزاً أكثر</h3>
                  </div>
                  <div className="space-y-2">
                    {weakSubjects.map(s => (
                      <div key={s.subjectId} className="flex items-center justify-between bg-white dark:bg-card rounded-xl p-3">
                        <span className="font-bold text-sm text-foreground">{s.subjectName}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-rose-100 overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-rose-600">{s.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {strongSubjects.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-black text-emerald-700">نقاط قوتك</h3>
                  </div>
                  <div className="space-y-2">
                    {strongSubjects.map(s => (
                      <div key={s.subjectId} className="flex items-center justify-between bg-white dark:bg-card rounded-xl p-3">
                        <span className="font-bold text-sm text-foreground">{s.subjectName}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-emerald-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className="text-xs font-black text-emerald-600">{s.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {weakSubjects.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <h3 className="font-black text-amber-700">توصية المنصة</h3>
                  </div>
                  <p className="text-sm font-bold text-amber-800 leading-relaxed">
                    ابدأ بالتركيز على: {weakSubjects.map(s => s.subjectName).join(' و ')}. ستجد أسئلة مخصصة لها في صفحة المستويات.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={() => {
                    setStep('level');
                    setAllQuestions([]);
                    setAnswers({});
                    setCurrentIndex(0);
                    setSelected(null);
                    setHasAnswered(false);
                  }}
                  variant="outline"
                  className="h-13 rounded-2xl font-black"
                >
                  تشخيص مستوى آخر
                </Button>
                <Button onClick={() => navigate('/levels')} className="h-13 rounded-2xl font-black bg-violet-600 hover:bg-violet-700">
                  ابدأ المذاكرة
                </Button>
              </div>

            </div>
          </div>
        </section>
      </MainLayout>
    );
  }

  return null;
};

export default DiagnosticTest;
