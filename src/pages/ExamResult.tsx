/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Result View
 * Developed by: Mueen Al-Nasser
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, XCircle, Clock, Target, 
  RotateCcw, Home, Share2, Eye, EyeOff, 
  Trophy, Medal, AlertCircle, ChevronDown, Sparkles, Zap, Download, Loader2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Question } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface ResultState {
  studentName: string;
  score: number;
  totalQuestions: number;
  passingScore: number;
  passed: boolean;
  timeTaken: number;
  questions: Question[];
  answers: Record<string, string>;
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
  const [isSavingImage, setIsSavingImage] = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  if (!state) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-xl font-bold mb-8">عذراً، لا توجد نتائج متاحة حالياً</p>
          <Link to="/levels">
            <Button size="lg" className="rounded-2xl px-10 font-bold shadow-xl shadow-primary/20">
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

  const handleShare = async () => {
    const subject = state.subjectName || "اختبار قانوني";
    const level = state.levelName || "منصة الناصر";
    const year = state.examYear || "2025";

    const shareText = `${level} - نموذج ${year}
🎓 نتيجتي في اختبار ${subject}

📊 النتيجة: ${state.score}/${state.totalQuestions} (${scorePercentage}%)
${state.passed ? '✅ لقد نجحت في الاختبار!' : '❌ سأحاول مجدداً لتحسين نتيجتي'}

🔗 اختبر نفسك الآن عبر منصة الباحث القانوني:
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

  const handleSaveAsImage = async () => {
    if (!resultCardRef.current) return;
    
    setIsSavingImage(true);
    try {
      const canvas = await html2canvas(resultCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `نتيجة-${state.subjectName || 'الاختبار'}-${scorePercentage}%.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({
        title: "تم حفظ الصورة بنجاح",
        description: "يمكنك الآن مشاركتها مع زملائك",
      });
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من حفظ الصورة",
        variant: "destructive",
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <MainLayout>
      <section className="py-8 md:py-16 min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            
            {/* بطاقة النتيجة الرئيسية */}
            <div 
              ref={resultCardRef}
              className={cn(
              "relative bg-card rounded-3xl border shadow-2xl overflow-hidden mb-8 transition-all duration-500 animate-in zoom-in-95",
              state.passed 
                ? "border-emerald-500/20 shadow-emerald-500/10 dark:shadow-emerald-500/5" 
                : "border-rose-500/20 shadow-rose-500/10 dark:shadow-rose-500/5"
            )}>
              {/* الجزء العلوي مع الأيقونة */}
              <div className={cn(
                "relative h-40 md:h-48 flex items-center justify-center overflow-hidden",
                state.passed 
                  ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" 
                  : "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800"
              )}>
                {/* تأثيرات الخلفية */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-4 left-8 w-24 h-24 bg-white/15 rounded-full blur-xl" />
                </div>
                
                {/* نجوم متحركة للنجاح */}
                {state.passed && (
                  <>
                    <Sparkles className="absolute top-6 right-12 w-5 h-5 text-yellow-300 animate-pulse" />
                    <Sparkles className="absolute top-12 left-16 w-4 h-4 text-yellow-200 animate-pulse delay-300" />
                    <Sparkles className="absolute bottom-8 right-20 w-3 h-3 text-yellow-300 animate-pulse delay-500" />
                  </>
                )}
                
                {/* أيقونة الكأس */}
                <div className={cn(
                  "relative z-10 w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-2xl md:rounded-3xl",
                  "border border-white/30 flex items-center justify-center",
                  "shadow-lg shadow-black/10",
                  state.passed && "animate-bounce"
                )} style={{ animationDuration: '2s' }}>
                  {state.passed ? (
                    <Trophy className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                  ) : (
                    <Medal className="w-10 h-10 md:w-12 md:h-12 text-white/70" />
                  )}
                </div>
              </div>

              {/* محتوى البطاقة */}
              <div className="p-6 md:p-10 text-center">
                {/* معلومات المادة والمستوى */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {state.levelName}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {state.subjectName}
                  </span>
                </div>
                
                {/* العنوان الرئيسي */}
                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-6 tracking-tight">
                  {state.passed ? (
                    <span className="flex items-center justify-center gap-2">
                      تهانينا، لقد أنجزت المهمة!
                      <Zap className="w-6 h-6 text-yellow-500" />
                    </span>
                  ) : (
                    "محاولة جيدة، استمر في التعلم"
                  )}
                </h1>

                {/* عرض النتيجة */}
                <div className="relative mb-8">
                  <div className={cn(
                    "text-7xl md:text-8xl font-black tracking-tighter transition-colors",
                    state.passed ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"
                  )}>
                    {scorePercentage}
                    <span className="text-3xl md:text-4xl opacity-40">%</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground font-semibold mt-2">
                    <Target className="w-4 h-4" />
                    <span>{state.score} إجابة صحيحة من أصل {state.totalQuestions}</span>
                  </div>
                </div>

                {/* إحصائيات */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted/50 rounded-2xl p-4 md:p-5 border border-border/50 group hover:border-primary/30 hover:bg-muted/70 transition-all duration-300">
                    <Medal className="w-5 h-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xl md:text-2xl font-black text-foreground">{state.passingScore}%</p>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">درجة النجاح</p>
                  </div>
                  <div className="bg-muted/50 rounded-2xl p-4 md:p-5 border border-border/50 group hover:border-primary/30 hover:bg-muted/70 transition-all duration-300">
                    <Clock className="w-5 h-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xl md:text-2xl font-black text-foreground">{formatTime(state.timeTaken)}</p>
                    <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">الوقت المستغرق</p>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowReview(!showReview)}
                      className="flex-1 h-14 rounded-xl gap-2 font-bold border-border hover:bg-muted transition-all active:scale-[0.98]"
                    >
                      {showReview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShare}
                      className="flex-1 h-14 rounded-xl gap-2 font-bold border-primary/30 text-primary hover:bg-primary/10 transition-all active:scale-[0.98]"
                    >
                      <Share2 className="w-5 h-5" />
                      مشاركة النتيجة
                    </Button>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSaveAsImage}
                    disabled={isSavingImage}
                    className="w-full h-14 rounded-xl gap-2 font-bold bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    {isSavingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        حفظ كصورة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* قسم مراجعة الإجابات */}
            {showReview && (
              <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between px-2 mb-6">
                  <h2 className="text-xl md:text-2xl font-black text-foreground">تفاصيل الإجابات</h2>
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
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
                        "bg-card rounded-2xl border shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-lg",
                        isCorrect 
                          ? "border-emerald-500/20 hover:border-emerald-500/40" 
                          : "border-rose-500/20 hover:border-rose-500/40"
                      )}
                    >
                      {/* رأس السؤال */}
                      <div className="flex items-start gap-4 mb-5">
                        <span className={cn(
                          "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-base shadow-sm",
                          isCorrect 
                            ? "bg-emerald-500 text-white" 
                            : "bg-rose-500 text-white"
                        )}>
                          {index + 1}
                        </span>
                        <p className="font-bold text-base md:text-lg text-foreground leading-relaxed pt-1.5">{q.question_text}</p>
                      </div>

                      {/* الخيارات */}
                      <div className="grid gap-2 mb-4">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                          const optionText = q[optionKey] as string;
                          const isUserAnswer = userAnswer === option;
                          const isCorrectOption = q.correct_option === option;

                          return (
                            <div
                              key={option}
                              className={cn(
                                "p-3.5 md:p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                                isCorrectOption && "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/5",
                                isUserAnswer && !isCorrectOption && "bg-rose-500/10 border-rose-500/40 dark:bg-rose-500/5",
                                !isCorrectOption && !isUserAnswer && "border-border/50 bg-muted/30 opacity-60"
                              )}
                            >
                              <span className={cn(
                                "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                isCorrectOption 
                                  ? "bg-emerald-500 text-white" 
                                  : isUserAnswer 
                                    ? "bg-rose-500 text-white" 
                                    : "bg-muted text-muted-foreground"
                              )}>
                                {option}
                              </span>
                              <span className={cn(
                                "flex-1 font-semibold text-sm md:text-base",
                                isCorrectOption 
                                  ? "text-emerald-700 dark:text-emerald-400" 
                                  : isUserAnswer 
                                    ? "text-rose-700 dark:text-rose-400" 
                                    : "text-muted-foreground"
                              )}>
                                {optionText}
                              </span>
                              {isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                              {isUserAnswer && !isCorrectOption && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* التلميح/المرجع */}
                      {q.hint && (
                        <div className="bg-primary/5 text-primary p-4 rounded-xl border border-primary/20 flex gap-3 items-start">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Medal className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">المرجع القانوني</p>
                            <p className="text-sm font-semibold leading-relaxed">{q.hint}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* أزرار التنقل السفلية */}
            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link to="/levels" className="flex-1">
                <Button 
                  variant="ghost" 
                  className="w-full h-14 rounded-xl gap-2 font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Home className="w-5 h-5" />
                  العودة للرئيسية
                </Button>
              </Link>
              <Button
                size="lg"
                onClick={() => navigate(-2)}
                className="flex-1 h-14 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
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
