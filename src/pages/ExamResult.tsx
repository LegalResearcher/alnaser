/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Result View
 * Developed by: Mueen Al-Nasser
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, Target, Award, 
  RotateCcw, Home, Share2, Eye, EyeOff, 
  Trophy, Medal, AlertCircle, ChevronDown
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Question } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ResultState {
  studentName: string;
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  timeTaken: number;
  questions: Question[];
  answers: Record<string, string>;
  // أضفنا هذه الحقول لتستقبل البيانات من صفحة البداية
  subjectName?: string;
  levelName?: string;
  examYear?: number;
}

const ExamResult = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState;
  const [showReview, setShowReview] = useState(false);

  if (!state) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 text-xl font-bold mb-8">عذراً، لا توجد نتائج متاحة حالياً</p>
          <Link to="/levels">
            <Button size="lg" className="rounded-2xl px-10 font-bold bg-primary shadow-xl shadow-primary/20">
              العودة للمستويات الدراسية
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const scorePercentage = Math.round((state.score / state.totalQuestions) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}د و ${secs}ث`;
  };

  // --- التعديل النهائي والحل الجذري لمشكلة الأسماء ---
  const handleShare = async () => {
    // جلب البيانات من الـ state القادم من الاختبار
    const subject = state.subjectName || "اختبار قانوني";
    const level = state.levelName || "منصة الناصر";
    const year = state.examYear || "2025";

    const shareText = `${level} - نموذج ${year}
🎓 نتيجتي في اختبار ${subject}

📊 النتيجة: ${state.score}/${state.totalQuestions} (${scorePercentage}%)
${state.passed ? '✅ لقد نجحت في الاختبار!' : '❌ سأحاول مجدداً لتحسين نتيجتي'}

🔗 اختبر نفسك الآن عبر منصة الناصر:
https://alnaser.vercel.app/

✨ تطوير: الناصر تِك للحلول الرقمية`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `نتيجة اختبار ${subject}`,
          text: shareText,
        });
      } catch (err) {
        console.error("خطأ في المشاركة:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "تم نسخ النتيجة والرابط",
        description: "يمكنك الآن مشاركة نجاحك مع زملائك عبر الواتساب",
      });
    }
  };

  return (
    <MainLayout>
      <section className="py-12 md:py-24 bg-slate-50/50 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            
            <div className={cn(
              "relative bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden mb-10 transition-all duration-700 animate-in zoom-in-95",
              state.passed ? "border-emerald-100 shadow-emerald-200/50" : "border-rose-100 shadow-rose-200/50"
            )}>
              <div className={cn(
                "h-48 flex items-center justify-center relative overflow-hidden",
                state.passed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-slate-700 to-slate-900"
              )}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
                <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 flex items-center justify-center animate-bounce duration-[3000ms]">
                   {state.passed ? <Trophy className="w-12 h-12 text-white" /> : <Medal className="w-12 h-12 text-white opacity-50" />}
                </div>
              </div>

              <div className="p-10 md:p-16 text-center">
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] mb-2 text-xs">
                  {state.levelName} | {state.subjectName}
                </p>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-8 tracking-tight">
                  {state.passed ? "تهانينا، لقد أنجزت المهمة!" : "محاولة جيدة، استمر في التعلم"}
                </h1>

                <div className="relative inline-block mb-10">
                   <div className={cn(
                     "text-8xl md:text-9xl font-black tracking-tighter transition-colors",
                     state.passed ? "text-emerald-500" : "text-slate-800"
                   )}>
                     {scorePercentage}<span className="text-4xl md:text-5xl opacity-30">%</span>
                   </div>
                   <div className="flex items-center justify-center gap-2 text-slate-400 font-bold mt-2">
                      <Target className="w-4 h-4" />
                      <span>{state.score} إجابة صحيحة من أصل {state.totalQuestions}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 group hover:border-primary/20 transition-all">
                    <Medal className="w-6 h-6 text-primary mx-auto mb-3" />
                    <p className="text-2xl font-black text-slate-800">{state.passingScore}%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">درجة النجاح</p>
                  </div>
                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 group hover:border-primary/20 transition-all">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-3" />
                    <p className="text-2xl font-black text-slate-800">{formatTime(state.timeTaken)}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الوقت المستغرق</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowReview(!showReview)}
                    className="flex-1 h-16 rounded-2xl gap-3 font-black border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    {showReview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleShare}
                    className="flex-1 h-16 rounded-2xl gap-3 font-black border-slate-200 hover:bg-slate-50 transition-all text-primary"
                  >
                    <Share2 className="w-5 h-5" />
                    مشاركة النتيجة
                  </Button>
                </div>
              </div>
            </div>

            {showReview && (
              <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
                <div className="flex items-center justify-between px-6 mb-8">
                   <h2 className="text-2xl font-black text-slate-800">تفاصيل الإجابات</h2>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      تصفح للأسفل <ChevronDown className="w-4 h-4 animate-bounce" />
                   </div>
                </div>

                {state.questions.map((q, index) => {
                  const userAnswer = state.answers[q.id];
                  const isCorrect = userAnswer === q.correct_option;

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        "bg-white rounded-[2.5rem] border shadow-sm p-8 transition-all hover:shadow-xl",
                        isCorrect ? "border-emerald-100" : "border-rose-100"
                      )}
                    >
                      <div className="flex items-start gap-5 mb-8">
                        <span className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg shadow-sm",
                          isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {index + 1}
                        </span>
                        <p className="font-bold text-xl text-slate-800 leading-relaxed pt-1">{q.question_text}</p>
                      </div>

                      <div className="grid gap-3 mb-6">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                          const optionText = q[optionKey] as string;
                          const isUserAnswer = userAnswer === option;
                          const isCorrectOption = q.correct_option === option;

                          return (
                            <div
                              key={option}
                              className={cn(
                                "p-5 rounded-2xl border-2 flex items-center gap-4 transition-all",
                                isCorrectOption && "bg-emerald-50 border-emerald-500/30",
                                isUserAnswer && !isCorrectOption && "bg-rose-50 border-rose-500/30",
                                !isCorrectOption && !isUserAnswer && "border-slate-50 bg-slate-50/30 opacity-60"
                              )}
                            >
                              <span className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                                isCorrectOption ? "bg-emerald-500 text-white" : 
                                isUserAnswer ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-500"
                              )}>
                                {option}
                              </span>
                              <span className={cn("flex-1 font-bold", isCorrectOption ? "text-emerald-700" : isUserAnswer ? "text-rose-700" : "text-slate-500")}>
                                {optionText}
                              </span>
                              {isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                              {isUserAnswer && !isCorrectOption && <XCircle className="w-5 h-5 text-rose-500" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.hint && (
                        <div className="bg-blue-50/50 text-blue-800 p-6 rounded-3xl border border-blue-100 flex gap-4 items-start">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                             <Medal className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">المرجع القانوني</p>
                            <p className="text-sm font-bold leading-relaxed">{q.hint}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-5 mt-16 px-4">
              <Link to="/levels" className="flex-1">
                <Button variant="ghost" className="w-full h-16 rounded-2xl gap-3 font-black text-slate-500 hover:bg-slate-100">
                  <Home className="w-5 h-5" />
                  العودة للرئيسية
                </Button>
              </Link>
              <Button
                size="lg"
                onClick={() => navigate(-2)}
                className="flex-1 h-16 rounded-2xl bg-slate-900 hover:bg-primary text-white font-black shadow-2xl shadow-slate-300 gap-3"
              >
                <RotateCcw className="w-5 h-5" />
                محاولة اختبار جديد
              </Button>
            </div>

          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ExamResult;
