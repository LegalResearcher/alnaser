/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Engine (Active Quiz)
 * Developed by: Mueen Al-Nasser
 * Version: 2.1 (Full Cleanup: Start & End Symbols + Exam Forms + Hide Empty)
 */

import { useState, useEffect, useCallback } from 'react';
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

// تعريف واجهة البيانات القادمة من صفحة البداية
interface ExamState {
  studentName: string;
  examYear: number;
  examForm?: string;
  examTime: number;
  questionsCount: number;
  subjectName?: string;
  levelName?: string;
}

// دالة تنظيف نص الخيار من البادئات والرموز النهائية (مثل +، -، والأرقام بين أقواس)
const cleanOptionText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    // 1. تنظيف البداية من الرموز (+، -، *) والأرقام والأقواس
    .replace(/^[\+\-\*\s\(\)\d\.\-\/]+/, '') 
    
    // 2. تنظيف النهاية من الرموز والبادئات الزائدة مثل (1 -) أو (+ 3)
    .replace(/[\s\(\)\d\+\-\.\/]+$/, '') 
    
    // 3. إزالة أي مسافات زائدة من الطرفين
    .trim();
};

const ExamPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamState;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState((state?.examTime || 30) * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حماية من الدخول المباشر بدون بيانات
  useEffect(() => {
    if (!state?.studentName) {
      navigate(`/exam/${subjectId}`);
    }
  }, [state, subjectId, navigate]);

  // جلب الأسئلة من قاعدة البيانات مع دعم النموذج وإلغاء القيود
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['exam-questions', subjectId, state?.examYear, state?.examForm, state?.questionsCount],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('status', 'active');
      
      if (state.examYear) {
        query = query.eq('exam_year', state.examYear);
      }
      if (state.examForm && state.examForm !== 'Mixed') {
        query = query.eq('exam_form', state.examForm);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // خلط الأسئلة وإرجاعها بالكامل دون حد الـ 20
      const shuffled = (data as Question[]).sort(() => Math.random() - 0.5);
      return shuffled;
    },
    enabled: !!subjectId && !!state?.examYear,
  });

  const { data: subject } = useCachedQuery(
    ['subject', subjectId],
    async () => {
      const { data, error } = await supabase.from('subjects').select('*').eq('id', subjectId).maybeSingle();
      if (error) throw error;
      return data;
    },
    { enabled: !!subjectId }
  );

  // وظيفة تسليم الاختبار وحساب النتيجة
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !questions.length) return;
    setIsSubmitting(true);

    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) score++;
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const passed = scorePercentage >= (subject?.passing_score || 60);
    const timeTaken = (state?.examTime || 30) * 60 - timeLeft;

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
      console.error("Database Save Error:", e);
    }

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
        subjectName: state.subjectName || subject?.name,
        levelName: state.levelName,
        examYear: state.examYear
      },
    });
  }, [answers, questions, subject, state, subjectId, timeLeft, navigate, isSubmitting]);

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

  if (isLoading) return (
    <MainLayout>
      <div className="container mx-auto px-6 py-24 text-center font-bold text-slate-400 animate-pulse">
        جاري تحضير أسئلة الاختبار...
      </div>
    </MainLayout>
  );

  if (!questions.length) return (
    <MainLayout>
      <div className="container mx-auto px-6 py-24 text-center font-bold">عذراً، لا توجد أسئلة متاحة لهذا النموذج حالياً.</div>
    </MainLayout>
  );

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isTimeWarning = timeLeft < 60;

  // تحضير الخيارات المتاحة (إخفاء الفارغة لأسئلة الصح والخطأ والمتعدد)
  const availableOptions = ['A', 'B', 'C', 'D'].filter(option => {
    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
    const optionText = currentQuestion[optionKey] as string;
    return optionText && optionText.trim().length > 0;
  });

  return (
    <MainLayout>
      <section className="py-8 bg-slate-50/50 min-h-screen font-cairo text-right" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            
            {/* Header: التقدم والوقت */}
            <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 p-3 md:p-5 mb-8 shadow-xl flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1 max-w-[60%]">
                <div className="flex items-center justify-between text-xs font-black text-slate-400">
                  <span>السؤال {currentIndex + 1} / {questions.length}</span>
                  <span className="text-primary">{Math.round(progress)}% اكتمل</span>
                </div>
                <Progress value={progress} className="h-3 rounded-full" />
              </div>
              
              <div className={cn(
                "flex items-center gap-3 font-black text-xl md:text-2xl px-6 py-3 rounded-2xl",
                isTimeWarning ? "bg-rose-500 text-white animate-pulse" : "bg-slate-900 text-white"
              )}>
                <Clock className="w-6 h-6" />
                <span dir="ltr">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* بطاقة السؤال */}
            {currentQuestion && (
              <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-8 md:p-14 mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest mb-8">
                  اختبار عام {state.examYear} {state.examForm === 'Parallel' ? '- موازي' : ''}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-12 leading-relaxed text-right">
                  {currentQuestion.question_text}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  {availableOptions.map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                    const rawOptionText = currentQuestion[optionKey] as string;
                    // تطبيق التنظيف الشامل (البداية والنهاية)
                    const optionText = cleanOptionText(rawOptionText);
                    const isSelected = answers[currentQuestion.id] === option;

                    return (
                      <button
                        key={option}
                        onClick={() => setAnswers({...answers, [currentQuestion.id]: option})}
                        className={cn(
                          "w-full text-right p-6 rounded-3xl border-2 transition-all flex items-center gap-5",
                          isSelected ? "border-primary bg-primary/[0.03]" : "border-slate-100 bg-slate-50 hover:border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0",
                          isSelected ? "bg-primary text-white" : "bg-white text-slate-400 border border-slate-200"
                        )}>
                          {option}
                        </div>
                        <span className={cn("flex-1 text-lg font-bold text-right", isSelected ? "text-primary" : "text-slate-600")}>
                          {optionText}
                        </span>
                        {isSelected && <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* أزرار التنقل */}
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="rounded-2xl h-14 px-8 border-slate-200 font-bold"
              >
                <ChevronRight className="ml-2 w-5 h-5" /> السابق
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="rounded-2xl h-14 px-10 bg-slate-900 text-white font-black"
                >
                  <Flag className="w-5 h-5 ml-2" /> تسليم الاختبار
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="rounded-2xl h-14 px-10 bg-primary text-white font-black"
                >
                  السؤال التالي <ChevronLeft className="mr-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* حوار تأكيد التسليم */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 md:p-12 text-right" dir="rtl">
          <AlertDialogHeader>
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-center">هل أنت جاهز للنتيجة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg text-slate-500 mt-4 leading-relaxed">
              {answeredCount < questions.length ? (
                <span className="text-rose-500 font-bold">انتبه! لم تجب على جميع الأسئلة.</span>
              ) : (
                <span className="text-green-600 font-bold">رائع! لقد أكملت جميع الإجابات.</span>
              )}
              <br />بمجرد التأكيد، سيتم تصحيح اختبارك وإصدار النتيجة فوراً ولا يمكنك الرجوع لتعديل الإجابات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
             <AlertDialogCancel 
               onClick={() => { setShowSubmitDialog(false); setShowReviewDialog(true); }}
               className="flex-1 h-14 rounded-2xl font-bold"
             >
               مراجعة الأسئلة
             </AlertDialogCancel>
             <AlertDialogAction onClick={handleSubmit} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20">
              تأكيد وتسليم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار مراجعة الأسئلة */}
      <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-6 md:p-8 max-w-3xl max-h-[90vh] overflow-hidden text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-center mb-4">مراجعة الأسئلة</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-slate-500">
              اضغط على رقم السؤال للانتقال إليه وتعديل إجابتك
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowReviewDialog(false);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-xl font-black text-lg transition-all border-2 flex items-center justify-center",
                      isAnswered 
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700" 
                        : "bg-rose-50 border-rose-300 text-rose-600",
                      currentIndex === index && "ring-4 ring-primary ring-offset-2 scale-110 z-10"
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-slate-600 my-4 px-2 bg-slate-50 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-400 rounded"></div>
              <span>تمت الإجابة ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-300 rounded"></div>
              <span>بانتظار الإجابة ({questions.length - answeredCount})</span>
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl font-bold border-slate-200">
              متابعة المراجعة
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { setShowReviewDialog(false); setShowSubmitDialog(true); }}
              className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black"
            >
              <Flag className="w-4 h-4 ml-2" />
              تسليم النهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ExamPage;
