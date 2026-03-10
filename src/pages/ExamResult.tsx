/**
 * Alnasser Tech Digital Solutions
 * Component: ExamResult — Version 3.0 (World-Class)
 */

import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, Target,
  RotateCcw, Home, Share2, Eye, EyeOff,
  Trophy, Medal, AlertCircle, ChevronDown, Sparkles, Zap, Download, Loader2, Star, Award
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Question } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo.jpg';

interface ResultState {
  studentName:    string;
  score:          number;
  totalQuestions: number;
  passingScore:   number;
  passed:         boolean;
  timeTaken:      number;
  questions:      Question[];
  answers:        Record<string, string>;
  subjectName?:   string;
  levelName?:     string;
  examYear?:      number;
}

// دائرة النسبة المئوية
function ScoreRing({ percentage, passed }: { percentage: number; passed: boolean }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - percentage / 100)), 300);
    return () => clearTimeout(t);
  }, [percentage, circ]);

  const color = passed ? '#10b981' : '#ef4444';

  return (
    <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto">
      <svg className="-rotate-90 w-full h-full" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-cairo font-black text-4xl md:text-5xl text-white leading-none">
          {percentage}
        </span>
        <span className="text-white/50 font-bold text-lg">%</span>
      </div>
    </div>
  );
}

// كونفيتي احتفالي
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${5 + Math.random() * 90}%`,
          top: '-12px',
          width: `${5 + Math.random() * 7}px`,
          height: `${5 + Math.random() * 7}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: colors[i % colors.length],
          animation: `confFall ${1 + Math.random() * 1.2}s ease-in ${Math.random() * 0.6}s forwards`,
          opacity: 0,
        }} />
      ))}
      <style>{`
        @keyframes confFall {
          0%   { opacity:1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity:0; transform: translateY(100vh) rotate(600deg) scale(0.4); }
        }
      `}</style>
    </div>
  );
}

const ExamResult = () => {
  const { toast }    = useToast();
  const location     = useLocation();
  const navigate     = useNavigate();
  const state        = location.state as ResultState;
  const [showReview, setShowReview]           = useState(false);
  const [isSavingImage, setIsSavingImage]     = useState(false);
  const [isShareLoading, setIsShareLoading]   = useState<'whatsapp' | 'twitter' | null>(null);
  const [showConfetti, setShowConfetti]       = useState(false);
  const resultCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.passed) {
      const t = setTimeout(() => setShowConfetti(true), 500);
      const t2 = setTimeout(() => setShowConfetti(false), 3500);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [state?.passed]);

  if (!state) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-xl font-bold mb-8">عذراً، لا توجد نتائج متاحة حالياً</p>
          <Link to="/levels">
            <Button size="lg" className="rounded-2xl px-10 font-bold shadow-xl shadow-primary/20">العودة للمستويات</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const scorePercentage = Math.round((state.score / state.totalQuestions) * 100);

  const earnedPoints = (() => {
    let pts = state.score * 10;
    if (scorePercentage >= 90) pts += 50;
    if (scorePercentage === 100) pts += 100;
    if (state.timeTaken < 300) pts += 20;
    return pts;
  })();

  const newBadges = (() => {
    const b: { icon: string; label: string }[] = [];
    if (scorePercentage === 100) b.push({ icon: '💯', label: 'إتقان تام!' });
    else if (scorePercentage >= 90) b.push({ icon: '🏆', label: 'متفوق!' });
    if (state.passed) b.push({ icon: '✅', label: 'ناجح' });
    return b;
  })();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}د ${sec}ث`;
  };

  // ── Canvas Generator ──
  const generateResultCanvas = async (): Promise<HTMLCanvasElement> => {
    const W = 600, H = 800, SC = 2;
    const canvas = document.createElement('canvas');
    canvas.width = W * SC; canvas.height = H * SC;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SC, SC);
    ctx.direction = 'rtl'; ctx.textAlign = 'center';

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (state.passed) { grad.addColorStop(0,'#10b981'); grad.addColorStop(0.4,'#059669'); grad.addColorStop(1,'#1e293b'); }
    else { grad.addColorStop(0,'#475569'); grad.addColorStop(0.4,'#334155'); grad.addColorStop(1,'#1e293b'); }
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(W/2,120,60,0,Math.PI*2); ctx.fill();
    ctx.font = 'bold 50px Arial'; ctx.fillStyle = 'white';
    ctx.fillText(state.passed ? '🏆' : '🎖️', W/2, 135);
    ctx.font = 'bold 18px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('منصة الباحث القانوني', W/2, 220);
    ctx.font = '14px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${state.levelName||''} • ${state.subjectName||''}`, W/2, 250);
    ctx.font = 'bold 24px Arial'; ctx.fillStyle = 'white';
    ctx.fillText(state.passed ? 'تهانينا، لقد نجحت! 🎉' : 'محاولة جيدة، استمر!', W/2, 300);
    ctx.font = 'bold 100px Arial'; ctx.fillStyle = state.passed ? '#34d399' : 'white';
    ctx.fillText(`${scorePercentage}%`, W/2, 420);
    ctx.font = 'bold 18px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${state.score} إجابة صحيحة من أصل ${state.totalQuestions}`, W/2, 470);
    const bY=510, bW=140, bH=80, gap=20;
    ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(W/2-bW-gap/2,bY,bW,bH,15); ctx.fill();
    ctx.font='bold 28px Arial'; ctx.fillStyle='white';
    ctx.fillText(`${state.passingScore}%`, W/2-bW/2-gap/2, bY+40);
    ctx.font='12px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('درجة النجاح', W/2-bW/2-gap/2, bY+62);
    ctx.fillStyle='rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(W/2+gap/2,bY,bW,bH,15); ctx.fill();
    ctx.font='bold 22px Arial'; ctx.fillStyle='white';
    ctx.fillText(formatTime(state.timeTaken), W/2+bW/2+gap/2, bY+40);
    ctx.font='12px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText('الوقت المستغرق', W/2+bW/2+gap/2, bY+62);
    ctx.font='bold 20px Arial'; ctx.fillStyle='white';
    ctx.fillText(`الطالب: ${state.studentName}`, W/2, 650);
    ctx.font='14px Arial'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.fillText(new Date().toLocaleDateString('ar-SA'), W/2, 680);

    const logo = new Image(); logo.crossOrigin='anonymous'; logo.src=logoImage;
    await new Promise<void>(res => { logo.onload=()=>{
      const ls=60,pad=20,x=W-ls-pad,y=H-ls-pad;
      ctx.save(); ctx.globalAlpha=0.95;
      ctx.beginPath(); ctx.arc(x+ls/2,y+ls/2,ls/2+4,0,Math.PI*2);
      ctx.fillStyle='white'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(x+ls/2,y+ls/2,ls/2,0,Math.PI*2);
      ctx.clip(); ctx.drawImage(logo,x,y,ls,ls); ctx.restore();
      res();
    }; logo.onerror=()=>res(); });

    return canvas;
  };

  const handleSaveAsImage = async () => {
    setIsSavingImage(true);
    try {
      const canvas = await generateResultCanvas();
      const link = document.createElement('a');
      link.download = `نتيجة-${state.subjectName||'الاختبار'}-${scorePercentage}%.png`;
      link.href = canvas.toDataURL('image/png'); link.click();
      toast({ title: 'تم حفظ الصورة بنجاح', description: 'يمكنك مشاركتها مع زملائك' });
    } catch { toast({ title: 'حدث خطأ', variant: 'destructive' }); }
    finally { setIsSavingImage(false); }
  };

  const getShareText = () =>
    `${state.levelName||'منصة الناصر'} - نموذج ${state.examYear||2025}\n🎓 نتيجتي في ${state.subjectName||'اختبار'}\n📊 ${state.score}/${state.totalQuestions} (${scorePercentage}%)\n${state.passed?'✅ نجحت!':'❌ سأحاول مجدداً'}\n🔗 https://alnaseer.org/`;

  const handleShareWhatsApp = async () => {
    setIsShareLoading('whatsapp');
    try {
      const canvas = await generateResultCanvas();
      const blob = await new Promise<Blob>(res => canvas.toBlob(b=>res(b!),'image/png'));
      const file = new File([blob],'نتيجة.png',{type:'image/png'});
      if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],text:getShareText()});
      else window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`,'_blank');
    } catch { window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`,'_blank'); }
    finally { setIsShareLoading(null); }
  };

  const handleShareTwitter = async () => {
    setIsShareLoading('twitter');
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`,'_blank','width=550,height=420');
    setIsShareLoading(null);
  };

  const passedColor = state.passed
    ? { from:'#10b981', to:'#059669', glow:'rgba(16,185,129,0.3)', text:'#10b981' }
    : { from:'#64748b', to:'#475569', glow:'rgba(100,116,139,0.2)', text:'#94a3b8' };

  return (
    <MainLayout>
      <Confetti active={showConfetti} />

      <section className="py-8 md:py-16 min-h-screen" dir="rtl">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* ── بطاقة النتيجة الرئيسية ── */}
            <div
              ref={resultCardRef}
              className="relative overflow-hidden rounded-3xl animate-in zoom-in-95 fade-in duration-500"
              style={{
                background: `linear-gradient(160deg, ${passedColor.from} 0%, ${passedColor.to} 40%, #0f172a 100%)`,
                boxShadow: `0 32px 80px ${passedColor.glow}, 0 0 0 1px rgba(255,255,255,0.06)`,
              }}
            >
              {/* نسيج */}
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'24px 24px' }} />

              {/* نجوم للنجاح */}
              {state.passed && (
                <>
                  <Sparkles className="absolute top-8 right-10 w-5 h-5 text-yellow-300 animate-pulse" />
                  <Sparkles className="absolute top-14 left-14 w-4 h-4 text-yellow-200 animate-pulse" style={{animationDelay:'0.3s'}} />
                  <Star className="absolute top-6 left-1/3 w-3 h-3 text-yellow-300 animate-pulse" style={{animationDelay:'0.6s'}} />
                </>
              )}

              <div className="relative z-10 p-8 md:p-12 text-center">

                {/* معلومات المادة */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    {state.levelName}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)' }}>
                    {state.subjectName}
                  </span>
                </div>

                {/* أيقونة */}
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{ background:'rgba(255,255,255,0.15)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.25)',
                    animation: state.passed ? 'gentleBounce 2s ease-in-out infinite' : 'none' }}>
                  {state.passed
                    ? <Trophy className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                    : <Medal  className="w-10 h-10 md:w-12 md:h-12 text-white/70" />
                  }
                </div>

                {/* العنوان */}
                <h1 className="font-cairo font-black text-white mb-8 leading-tight" style={{ fontSize:'clamp(1.4rem,3.5vw,2rem)' }}>
                  {state.passed
                    ? <span className="flex items-center justify-center gap-2">تهانينا، لقد أنجزت المهمة! <Zap className="w-6 h-6 text-yellow-300" /></span>
                    : 'محاولة جيدة، استمر في التعلم'}
                </h1>

                {/* دائرة النتيجة */}
                <ScoreRing percentage={scorePercentage} passed={state.passed} />

                <div className="flex items-center justify-center gap-2 mt-4 mb-8">
                  <Target className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 font-bold">{state.score} إجابة صحيحة من أصل {state.totalQuestions}</span>
                </div>

                {/* إحصائيات */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: Medal, label: 'درجة النجاح', value: `${state.passingScore}%` },
                    { icon: Clock, label: 'الوقت المستغرق', value: formatTime(state.timeTaken) },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 md:p-5 rounded-2xl text-center"
                      style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}>
                      <stat.icon className="w-5 h-5 mx-auto mb-2 text-white/60" />
                      <p className="font-cairo font-black text-xl md:text-2xl text-white">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* اسم الطالب */}
                <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl mb-6"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-white/50 text-sm font-bold">الطالب:</span>
                  <span className="text-white font-black">{state.studentName}</span>
                </div>

                {/* أزرار الإجراءات */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowReview(!showReview)}
                    className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
                    style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white' }}
                  >
                    {showReview ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleShareWhatsApp} disabled={isShareLoading==='whatsapp'}
                      className="h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                      style={{ background:'rgba(22,163,74,0.2)', border:'1px solid rgba(22,163,74,0.3)', color:'#4ade80' }}>
                      {isShareLoading==='whatsapp' ? <Loader2 className="w-4 h-4 animate-spin"/> :
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      }
                      واتساب
                    </button>
                    <button onClick={handleShareTwitter} disabled={isShareLoading==='twitter'}
                      className="h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                      style={{ background:'rgba(14,165,233,0.15)', border:'1px solid rgba(14,165,233,0.3)', color:'#38bdf8' }}>
                      {isShareLoading==='twitter' ? <Loader2 className="w-4 h-4 animate-spin"/> :
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      }
                      تويتر
                    </button>
                  </div>

                  <button onClick={handleSaveAsImage} disabled={isSavingImage}
                    className="w-full h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    style={{ background:'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))', boxShadow:'0 4px 20px rgba(59,130,246,0.3)' }}>
                    {isSavingImage ? <><Loader2 className="w-4 h-4 animate-spin"/> جاري الحفظ...</> : <><Download className="w-4 h-4"/> حفظ كصورة</>}
                  </button>
                </div>
              </div>
            </div>

            {/* ── قسم مراجعة الإجابات ── */}
            {showReview && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-400">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h2 className="text-xl font-black text-foreground">تفاصيل الإجابات</h2>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                    اسحب للأسفل <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                  </span>
                </div>

                {state.questions.map((q, index) => {
                  const userAnswer    = state.answers[q.id];
                  const isCorrect     = userAnswer === q.correct_option;
                  const correctCount  = ['A','B','C','D'].filter(o => q[`option_${o.toLowerCase()}` as keyof Question]).length;

                  return (
                    <div key={q.id}
                      className={cn(
                        "bg-card rounded-2xl border p-5 md:p-6 transition-all duration-300 hover:shadow-lg",
                        isCorrect ? "border-emerald-500/20 hover:border-emerald-500/35" : "border-rose-500/20 hover:border-rose-500/35"
                      )}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm shadow-sm",
                          isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                          {index + 1}
                        </span>
                        <p className="font-bold text-base text-foreground leading-relaxed pt-1">{q.question_text}</p>
                      </div>

                      <div className="grid gap-2 mb-3">
                        {['A','B','C','D'].map(opt => {
                          const k = `option_${opt.toLowerCase()}` as keyof Question;
                          const text = q[k] as string;
                          if (!text?.trim()) return null;
                          const isSel  = userAnswer === opt;
                          const isCorr = q.correct_option === opt;
                          return (
                            <div key={opt} className={cn(
                              "p-3 rounded-xl border-2 flex items-center gap-3 transition-all",
                              isCorr && "bg-emerald-500/8 border-emerald-500/35",
                              isSel && !isCorr && "bg-rose-500/8 border-rose-500/35",
                              !isCorr && !isSel && "border-border/40 bg-muted/20 opacity-55"
                            )}>
                              <span className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                isCorr ? "bg-emerald-500 text-white" :
                                isSel  ? "bg-rose-500 text-white" :
                                "bg-muted text-muted-foreground"
                              )}>{opt}</span>
                              <span className={cn(
                                "flex-1 text-sm font-semibold",
                                isCorr ? "text-emerald-700 dark:text-emerald-400" :
                                isSel  ? "text-rose-700 dark:text-rose-400" :
                                "text-muted-foreground"
                              )}>{text}</span>
                              {isCorr && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                              {isSel && !isCorr && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.hint && (
                        <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/15 flex gap-3 items-start mt-2">
                          <Medal className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-0.5">المرجع القانوني</p>
                            <p className="text-sm text-primary/80 font-semibold leading-relaxed">{q.hint}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── أزرار التنقل ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/levels" className="flex-1">
                <Button variant="ghost" className="w-full h-13 rounded-xl gap-2 font-bold text-muted-foreground hover:text-foreground">
                  <Home className="w-4 h-4" /> العودة للمستويات
                </Button>
              </Link>
              <Button size="lg" onClick={() => navigate(-2)}
                className="flex-1 h-13 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 hover:shadow-primary/30 active:scale-[0.98]">
                <RotateCcw className="w-4 h-4" /> محاولة اختبار جديد
              </Button>
            </div>

          </div>
        </div>
      </section>

      <style>{`
        @keyframes gentleBounce {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-6px); }
        }
      `}</style>
    </MainLayout>
  );
};

export default ExamResult;
