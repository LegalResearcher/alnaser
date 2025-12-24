/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Engine (Active Quiz)
 * Developed by: Mueen Al-Nasser
 */

// ... (نفس المستوردات السابقة بدون تغيير)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/database';
import { cn } from '@/lib/utils';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// تحديث الواجهة لاستقبال البيانات الإضافية
interface ExamState {
  studentName: string;
  examYear: number;
  examTime: number;
  questionsCount: number;
  subjectName?: string; // أضفنا هذا
  levelName?: string;   // أضفنا هذا
}

const ExamPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamState;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((state?.examTime || 30) * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state?.studentName) {
      navigate(`/exam/${subjectId}`);
    }
  }, [state, subjectId, navigate]);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['exam-questions', subjectId, state?.examYear, state?.questionsCount],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('exam_year', state.examYear)
        .eq('status', 'active');
      if (error) throw error;
      const shuffled = (data as Question[]).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, state.questionsCount);
    },
    enabled: !!subjectId && !!state?.examYear,
  });

  const { data: subject } = useCachedQuery(
    ['subject', subjectId],
    async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    { enabled: !!subjectId }
  );

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // --- التعديل الجوهري هنا ---
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) score++;
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const passed = scorePercentage >= (subject?.passing_score || 60);
    const timeTaken = (state?.examTime || 30) * 60 - timeLeft;

    // حفظ النتيجة في قاعدة البيانات
    try {
      await supabase.from('exam_results').insert({
        subject_id: subjectId,
        student_name: state.studentName,
        score,
        total_questions: totalQuestions,
        passing_score: subject?.passing_score || 60,
        passed,
        exam_year: state.examYear,
        time_taken_seconds: timeTaken,
        answers,
      });
    } catch (e) {
      console.error("خطأ في حفظ النتيجة:", e);
    }

    // الانتقال لصفحة النتيجة مع تمرير كافة البيانات المطلوبة للمشاركة
    navigate(`/exam/${subjectId}/result`, {
      state: {
        studentName: state.studentName,
        score,
        totalQuestions,
        passingScore: subject?.passing_score || 60,
        passed,
        timeTaken,
        questions,
        answers,
        // إضافة هذه الأسطر لضمان ظهور الأسماء في رسالة المشاركة
        subjectName: state.subjectName || subject?.name,
        levelName: state.levelName,
        examYear: state.examYear
      },
    });
  }, [answers, questions, subject, state, subjectId, timeLeft, navigate, isSubmitting]);

  // ... (بقية الكود الخاص بالواجهة الرسومية يظل كما هو)
  
  if (!state?.studentName) return null;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isTimeWarning = timeLeft < 60;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-20 w-full bg-slate-100 animate-pulse rounded-3xl" />
            <div className="h-80 w-full bg-slate-100 animate-pulse rounded-[3rem]" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-8 bg-slate-50/50 min-h-[calc(100vh-80px)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Header: التقدم والوقت */}
            <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 p-3 md:p-5 mb-8 shadow-xl shadow-slate-200/50 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1 max-w-[60%]">
                <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest px-2">
                  <span>السؤال {currentIndex + 1} / {questions.length}</span>
                  <span className="text-primary">{Math.round(progress)}% اكتمل</span>
                </div>
                <Progress value={progress} className="h-3 rounded-full bg-slate-100" />
              </div>
              
              <div className={cn(
                "flex items-center gap-3 font-black text-xl md:text-2xl px-6 py-3 rounded-2xl transition-all duration-500",
                isTimeWarning 
                  ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200" 
                  : "bg-slate-900 text-white shadow-lg shadow-slate-300"
              )}>
                <Clock className={cn("w-6 h-6", isTimeWarning && "animate-bounce")} />
                <span dir="ltr">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="relative group animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 p-8 md:p-14 mb-8">
                  
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">
                    <HelpCircle className="w-3.5 h-3.5" />
                    اختبار عام {state.examYear}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-12 leading-[1.6] tracking-tight">
                    {currentQuestion.question_text}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                      const optionText = currentQuestion[optionKey] as string;
                      const isSelected = answers[currentQuestion.id] === option;

                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswer(currentQuestion.id, option)}
                          className={cn(
                            "group/opt w-full text-right p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-5",
                            isSelected
                              ? "border-primary bg-primary/[0.03] shadow-inner"
                              : "border-slate-100 bg-slate-50/50 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-slate-200"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all",
                            isSelected 
                              ? "bg-primary text-white rotate-[360deg] shadow-lg shadow-primary/30" 
                              : "bg-white text-slate-400 border border-slate-200 group-hover/opt:text-primary group-hover/opt:border-primary/20"
                          )}>
                            {option}
                          </div>
                          <span className={cn(
                            "flex-1 text-lg font-bold transition-colors",
                            isSelected ? "text-primary" : "text-slate-600 group-hover/opt:text-slate-900"
                          )}>
                            {optionText}
                          </span>
                          {isSelected && <CheckCircle2 className="w-6 h-6 text-primary animate-in zoom-in" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation & Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
              <div className="flex items-center gap-3 order-2 md:order-1">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="rounded-2xl h-14 px-8 border-slate-200 font-bold hover:bg-white hover:text-primary"
                >
                  <ChevronRight className="ml-2 w-5 h-5" />
                  السابق
                </Button>

                {currentIndex === questions.length - 1 ? (
                  <Button
                    size="lg"
                    onClick={() => setShowSubmitDialog(true)}
                    className="rounded-2xl h-14 px-10 bg-slate-900 hover:bg-primary text-white font-black shadow-xl shadow-slate-200 transition-all gap-2"
                  >
                    <Flag className="w-5 h-5" />
                    تسليم الاختبار
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="rounded-2xl h-14 px-10 bg-primary hover:bg-blue-600 text-white font-black shadow-xl shadow-primary/20 transition-all"
                  >
                    السؤال التالي
                    <ChevronLeft className="mr-2 w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-2 order-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-black transition-all border",
                      currentIndex === i
                        ? "bg-primary text-white border-primary shadow-lg scale-110"
                        : answers[q.id]
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-white text-slate-300 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Alert Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-8 md:p-12 shadow-2xl">
          <AlertDialogHeader>
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-center text-slate-900">
              هل أنت جاهز للنتيجة؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg text-slate-500 mt-4 leading-relaxed">
              {answeredCount < questions.length ? (
                <span className="text-rose-500 font-bold block mb-2">
                  انتبه! يوجد {questions.length - answeredCount} سؤال بدون إجابة.
                </span>
              ) : (
                <span className="text-green-600 font-bold block mb-2">أحسنت! لقد أكملت جميع الأسئلة.</span>
              )}
              بمجرد الضغط على "تأكيد"، سيتم تصحيح اختبارك وحفظ النتيجة في سجلك القانوني.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col md:flex-row-reverse gap-4 mt-8">
             <AlertDialogAction
              onClick={handleSubmit}
              className="w-full md:flex-1 h-14 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black shadow-xl shadow-primary/20"
            >
              تأكيد وتسليم
            </AlertDialogAction>
            <AlertDialogCancel className="w-full md:flex-1 h-14 rounded-2xl border-slate-200 font-bold">
              مراجعة الأسئلة
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ExamPage;
