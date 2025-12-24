import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Target, Award, RotateCcw, Home, Share2, Eye, EyeOff } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Question } from '@/types/database';

interface ResultState {
  studentName: string;
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  timeTaken: number;
  questions: Question[];
  answers: Record<string, string>;
}

const ExamResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState;
  const [showReview, setShowReview] = useState(false);

  if (!state) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground text-lg">لا توجد نتائج للعرض</p>
          <Link to="/levels">
            <Button className="mt-4">العودة للمستويات</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const scorePercentage = Math.round((state.score / state.totalQuestions) * 100);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة و ${secs} ثانية`;
  };

  const handleShare = async () => {
    const text = `🎓 نتيجتي في اختبار الباحث القانوني
📊 النتيجة: ${state.score}/${state.totalQuestions} (${scorePercentage}%)
${state.passed ? '✅ ناجح' : '❌ راسب'}`;

    if (navigator.share) {
      await navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <MainLayout>
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Result Card */}
            <div className={cn(
              "bg-card rounded-3xl border-2 p-8 text-center mb-8 animate-scale-in",
              state.passed ? "border-success/30" : "border-destructive/30"
            )}>
              {/* Status Icon */}
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
                state.passed ? "bg-success/10" : "bg-destructive/10"
              )}>
                {state.passed ? (
                  <Award className="w-12 h-12 text-success" />
                ) : (
                  <XCircle className="w-12 h-12 text-destructive" />
                )}
              </div>

              {/* Student Name */}
              <p className="text-muted-foreground mb-2">مرحباً</p>
              <h1 className="text-2xl font-bold mb-4">{state.studentName}</h1>

              {/* Result Status */}
              <div className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold mb-6",
                state.passed
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}>
                {state.passed ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ناجح
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    راسب
                  </>
                )}
              </div>

              {/* Score Display */}
              <div className="mb-8">
                <div className="text-6xl font-bold mb-2">
                  <span className={state.passed ? "text-success" : "text-destructive"}>
                    {scorePercentage}%
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {state.score} من {state.totalQuestions} سؤال
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/50 rounded-xl p-4">
                  <Target className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xl font-bold">{state.passingScore}%</p>
                  <p className="text-sm text-muted-foreground">درجة النجاح</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xl font-bold">{formatTime(state.timeTaken)}</p>
                  <p className="text-sm text-muted-foreground">الوقت المستغرق</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReview(!showReview)}
                  className="flex-1 gap-2"
                >
                  {showReview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة النتيجة
                </Button>
              </div>
            </div>

            {/* Review Section */}
            {showReview && (
              <div className="space-y-4 animate-slide-up">
                <h2 className="text-xl font-bold mb-4">مراجعة الإجابات</h2>
                {state.questions.map((q, index) => {
                  const userAnswer = state.answers[q.id];
                  const isCorrect = userAnswer === q.correct_option;

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "bg-card rounded-xl border-2 p-6",
                        isCorrect ? "border-success/30" : "border-destructive/30"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold",
                          isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {index + 1}
                        </span>
                        <p className="font-medium">{q.question_text}</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                          const optionText = q[optionKey] as string;
                          const isUserAnswer = userAnswer === option;
                          const isCorrectOption = q.correct_option === option;

                          return (
                            <div
                              key={option}
                              className={cn(
                                "p-3 rounded-lg border flex items-center gap-3",
                                isCorrectOption && "bg-success/10 border-success",
                                isUserAnswer && !isCorrectOption && "bg-destructive/10 border-destructive"
                              )}
                            >
                              <span className={cn(
                                "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                isCorrectOption
                                  ? "bg-success text-success-foreground"
                                  : isUserAnswer
                                  ? "bg-destructive text-destructive-foreground"
                                  : "bg-muted"
                              )}>
                                {option}
                              </span>
                              <span className="flex-1">{optionText}</span>
                              {isCorrectOption && <CheckCircle className="w-4 h-4 text-success" />}
                              {isUserAnswer && !isCorrectOption && <XCircle className="w-4 h-4 text-destructive" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.hint && (
                        <div className="bg-info/10 text-info-foreground p-4 rounded-lg border border-info/30">
                          <p className="text-sm font-medium mb-1">ملاحظة إرشادية:</p>
                          <p className="text-sm">{q.hint}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/levels" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Home className="w-4 h-4" />
                  العودة للمستويات
                </Button>
              </Link>
              <Button
                onClick={() => navigate(-2)}
                className="flex-1 gradient-primary text-primary-foreground border-0 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة الاختبار
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ExamResult;
