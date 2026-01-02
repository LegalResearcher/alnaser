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
import logoImage from '@/assets/logo.jpg';

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
  const [isShareLoading, setIsShareLoading] = useState<'whatsapp' | 'twitter' | null>(null);
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


  // دالة إنشاء Canvas للصورة
  const generateResultCanvas = async (): Promise<HTMLCanvasElement> => {
    const width = 600;
    const height = 800;
    const scale = 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    
    // تفعيل دعم النص العربي
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    
    // الخلفية
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (state.passed) {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.4, '#059669');
      gradient.addColorStop(1, '#1e293b');
    } else {
      gradient.addColorStop(0, '#475569');
      gradient.addColorStop(0.4, '#334155');
      gradient.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // أيقونة الكأس/الميدالية
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(width / 2, 120, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = 'bold 50px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(state.passed ? '🏆' : '🎖️', width / 2, 135);
    
    // اسم المنصة
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('منصة الباحث القانوني', width / 2, 220);
    
    // المستوى والمادة
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const levelSubject = `${state.levelName || ''} • ${state.subjectName || ''}`;
    ctx.fillText(levelSubject, width / 2, 250);
    
    // العنوان الرئيسي
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    if (state.passed) {
      ctx.fillText('تهانينا، لقد نجحت! 🎉', width / 2, 300);
    } else {
      ctx.fillText('محاولة جيدة، استمر!', width / 2, 300);
    }
    
    // النتيجة الكبيرة
    ctx.font = 'bold 100px Arial';
    ctx.fillStyle = state.passed ? '#34d399' : 'white';
    ctx.fillText(`${scorePercentage}%`, width / 2, 420);
    
    // الإجابات الصحيحة
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${state.score} إجابة صحيحة من أصل ${state.totalQuestions}`, width / 2, 470);
    
    // مربعات الإحصائيات
    const boxY = 510;
    const boxWidth = 140;
    const boxHeight = 80;
    const gap = 20;
    
    // مربع درجة النجاح
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(width / 2 - boxWidth - gap / 2, boxY, boxWidth, boxHeight, 15);
    ctx.fill();
    
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`${state.passingScore}%`, width / 2 - boxWidth / 2 - gap / 2, boxY + 40);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('درجة النجاح', width / 2 - boxWidth / 2 - gap / 2, boxY + 62);
    
    // مربع الوقت
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(width / 2 + gap / 2, boxY, boxWidth, boxHeight, 15);
    ctx.fill();
    
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(formatTime(state.timeTaken), width / 2 + boxWidth / 2 + gap / 2, boxY + 40);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('الوقت المستغرق', width / 2 + boxWidth / 2 + gap / 2, boxY + 62);
    
    // اسم الطالب
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`الطالب: ${state.studentName}`, width / 2, 650);
    
    // التاريخ
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(new Date().toLocaleDateString('ar-SA'), width / 2, 680);
    
    // إضافة الشعار
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = logoImage;
    
    await new Promise<void>((resolve) => {
      logo.onload = () => {
        const logoSize = 60;
        const padding = 20;
        const x = width - logoSize - padding;
        const y = height - logoSize - padding;
        
        // خلفية بيضاء للشعار
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
        
        // رسم الشعار دائري
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, x, y, logoSize, logoSize);
        ctx.restore();
        
        resolve();
      };
      logo.onerror = () => resolve();
    });
    
    return canvas;
  };

  // دالة حفظ الصورة
  const handleSaveAsImage = async () => {
    setIsSavingImage(true);
    try {
      const canvas = await generateResultCanvas();
      
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

  // نص المشاركة
  const getShareText = () => {
    const subject = state.subjectName || "اختبار قانوني";
    const level = state.levelName || "منصة الناصر";
    const year = state.examYear || "2025";
    
    return `${level} - نموذج ${year}
🎓 نتيجتي في اختبار ${subject}

📊 النتيجة: ${state.score}/${state.totalQuestions} (${scorePercentage}%)
${state.passed ? '✅ لقد نجحت في الاختبار!' : '❌ سأحاول مجدداً لتحسين نتيجتي'}

🔗 اختبر نفسك الآن عبر منصة الباحث القانوني:
https://alnaser.vercel.app/

✨ تطوير: الناصر تِك للحلول الرقمية`;
  };

  // مشاركة على واتساب
  const handleShareWhatsApp = async () => {
    setIsShareLoading('whatsapp');
    try {
      const canvas = await generateResultCanvas();
      
      // تحويل canvas إلى blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      const file = new File([blob], 'نتيجة-الاختبار.png', { type: 'image/png' });
      
      // محاولة استخدام Web Share API مع الصورة
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'نتيجة الاختبار',
          text: getShareText(),
        });
      } else {
        // فتح واتساب مع النص فقط
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(getShareText())}`;
        window.open(whatsappUrl, '_blank');
        
        toast({
          title: "تلميح",
          description: "للمشاركة مع الصورة، احفظها أولاً ثم أرفقها في واتساب",
        });
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      // فتح واتساب كخطة بديلة
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(getShareText())}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setIsShareLoading(null);
    }
  };

  // مشاركة على تويتر
  const handleShareTwitter = async () => {
    setIsShareLoading('twitter');
    try {
      const subject = state.subjectName || "اختبار قانوني";
      const twitterText = `🎓 نتيجتي في اختبار ${subject}

📊 ${state.score}/${state.totalQuestions} (${scorePercentage}%)
${state.passed ? '✅ نجحت!' : '❌ سأحاول مجدداً'}

🔗 اختبر نفسك:
https://alnaser.vercel.app/`;
      
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
      
    } catch (error) {
      console.error('Error sharing to Twitter:', error);
    } finally {
      setIsShareLoading(null);
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
                  {/* زر مراجعة الإجابات */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowReview(!showReview)}
                    className="w-full h-12 rounded-xl gap-2 font-bold border-border hover:bg-muted transition-all active:scale-[0.98]"
                  >
                    {showReview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                  </Button>
                  
                  {/* أزرار المشاركة */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShareWhatsApp}
                      disabled={isShareLoading === 'whatsapp'}
                      className="h-12 rounded-xl gap-2 font-bold border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all active:scale-[0.98]"
                    >
                      {isShareLoading === 'whatsapp' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      )}
                      واتساب
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleShareTwitter}
                      disabled={isShareLoading === 'twitter'}
                      className="h-12 rounded-xl gap-2 font-bold border-sky-500/30 text-sky-500 hover:bg-sky-500/10 transition-all active:scale-[0.98]"
                    >
                      {isShareLoading === 'twitter' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      تويتر
                    </Button>
                  </div>
                  
                  {/* زر حفظ كصورة */}
                  <Button
                    size="lg"
                    onClick={handleSaveAsImage}
                    disabled={isSavingImage}
                    className="w-full h-12 rounded-xl gap-2 font-bold bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
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
