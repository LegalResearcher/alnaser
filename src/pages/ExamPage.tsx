import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';
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

interface ExamState {
  studentName: string;
  examYear: number;
  examTime: number;
  questionsCount: number;
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

  // Redirect if no state
  useEffect(() => {
    if (!state?.studentName) {
      navigate(`/exam/${subjectId}`);
    }
  }, [state, subjectId, navigate]);

  // Questions need fresh data (random selection), so no caching
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
      
      // Shuffle and limit questions
      const shuffled = (data as Question[]).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, state.questionsCount);
    },
    enabled: !!subjectId && !!state?.examYear,
  });

  // Cache subject data for faster display
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

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Calculate score
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        score++;
      }
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const passed = scorePercentage >= (subject?.passing_score || 60);
    const timeTaken = (state?.examTime || 30) * 60 - timeLeft;

    // Save result
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

    // Navigate to results
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
      },
    });
  }, [answers, questions, subject, state, subjectId, timeLeft, navigate, isSubmitting]);

  if (!state?.studentName) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isTimeWarning = timeLeft < 60;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="h-96 max-w-3xl mx-auto rounded-2xl bg-muted animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-card rounded-2xl border p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  السؤال {currentIndex + 1} من {questions.length}
                </div>
                <Progress value={progress} className="w-32 h-2" />
              </div>
              <div className={cn(
                "flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-lg",
                isTimeWarning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"
              )}>
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-card rounded-2xl border p-8 mb-6 animate-fade-in">
                <h2 className="text-xl font-bold mb-6 leading-relaxed">
                  {currentQuestion.question_text}
                </h2>

                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                    const optionText = currentQuestion[optionKey] as string;
                    const isSelected = answers[currentQuestion.id] === option;

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(currentQuestion.id, option)}
                        className={cn(
                          "w-full text-right p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            {option}
                          </span>
                          <span className="flex-1">{optionText}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>

              {/* Question Pills */}
              <div className="hidden sm:flex items-center gap-1 flex-wrap justify-center max-w-md">
                {questions.slice(0, 10).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      currentIndex === i
                        ? "bg-primary text-primary-foreground"
                        : answers[q.id]
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                {questions.length > 10 && (
                  <span className="text-muted-foreground text-sm">+{questions.length - 10}</span>
                )}
              </div>

              {currentIndex === questions.length - 1 ? (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="gradient-primary text-primary-foreground border-0 gap-2"
                >
                  <Flag className="w-4 h-4" />
                  إنهاء الاختبار
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="gap-2"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              تأكيد إنهاء الاختبار
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {answeredCount < questions.length ? (
                <span className="text-destructive">
                  لديك {questions.length - answeredCount} سؤال لم تتم الإجابة عليه.
                </span>
              ) : (
                <span>لقد أجبت على جميع الأسئلة.</span>
              )}
              <br />
              هل أنت متأكد من إنهاء الاختبار؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>متابعة الاختبار</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              className="gradient-primary text-primary-foreground border-0"
            >
              إنهاء الاختبار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ExamPage;
