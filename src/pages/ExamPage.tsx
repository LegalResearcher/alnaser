/**
 * Alnasser Tech Digital Solutions
 * Project: Alnaser Legal Platform
 * Component: Exam Engine (Active Quiz)
 * Developed by: Mueen Al-Nasser
 * Version: 2.3 (Full UX Enhancement: Confetti + Shake + Score + Circular Timer + Slide + Next-After-Answer)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle2, XCircle, Star, Share2, Check, MessageSquare } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
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
  examForm?: string;
  isTrial?: boolean;
  allQuestions?: boolean;
  examTime: number;
  questionsCount: number;
  subjectName?: string;
  levelName?: string;
  challengeMode?: boolean;
  challengeSessionId?: string;
  forcedQuestionIds?: string[];
}

const cleanOptionText = (text: string | null | undefined): string => {
  if (!text) return '';
  // نحذف فقط بادئات الترقيم مثل "أ-" أو "1." أو "A)" وليس الأرقام الجزء من النص
  return text
    .replace(/^[\s]*[A-Dأبجد][\.\-\)]\s*/, '')  // حذف بادئات الترقيم فقط
    .replace(/^[\s]*\d+[\.\-\)]\s*/, '')          // حذف أرقام الترقيم فقط مثل "1."
    .trim();
};

// كونفيتي بدون مكتبة خارجية
const Confetti = ({ active }: { active: boolean }) => {
  if (!active) return null;
  const pieces = Array.from({ length: 32 }, (_, i) => i);
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + Math.random() * 80}%`,
            top: '-10px',
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${0.9 + Math.random() * 1}s ease-in ${Math.random() * 0.4}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};

// CSS animations مُحقونة في head
const GlobalStyles = () => (
  <style>{`
    @keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      15%  { transform: translateX(-10px); }
      30%  { transform: translateX(10px); }
      45%  { transform: translateX(-7px); }
      60%  { transform: translateX(7px); }
      75%  { transform: translateX(-4px); }
      90%  { transform: translateX(4px); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(50px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-50px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes scoreFloat {
      0%   { opacity: 0; transform: translateY(4px) scale(0.6); }
      40%  { opacity: 1; transform: translateY(-16px) scale(1.3); }
      100% { opacity: 0; transform: translateY(-32px) scale(1); }
    }
    @keyframes glowPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
      50%     { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.85); }
      to   { opacity: 1; transform: scale(1); }
    }
    .anim-shake        { animation: shake 0.5s ease-in-out; }
    .anim-slide-right  { animation: slideInRight 0.32s ease-out; }
    .anim-slide-left   { animation: slideInLeft 0.32s ease-out; }
    .anim-score-float  { animation: scoreFloat 0.9s ease-out forwards; }
    .anim-glow         { animation: glowPulse 0.7s ease-out; }
    .anim-zoom-in      { animation: zoomIn 0.25s ease-out; }
  `}</style>
);

// مؤقت دائري
const CircularTimer = ({ timeLeft, totalTime, isWarning }: { timeLeft: number; totalTime: number; isWarning: boolean }) => {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - timeLeft / totalTime);
  const color = isWarning ? '#ef4444' : timeLeft / totalTime > 0.5 ? '#10b981' : '#f59e0b';
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  return (
    <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72" width="100%" height="100%">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-600 dark:text-foreground/70" strokeWidth="5" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
      </svg>
      <div className={cn("flex flex-col items-center z-10 gap-0.5", isWarning && "animate-pulse")}>
        <Clock className={cn("w-3 h-3", isWarning ? "text-rose-500" : "text-slate-400 dark:text-slate-400 dark:text-muted-foreground")} />
        <span className={cn("font-black text-xs md:text-sm tabular-nums leading-none", isWarning ? "text-rose-600" : "text-slate-700 dark:text-slate-200")} dir="ltr">
          {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </span>
      </div>
    </div>
  );
};

const ExamPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ExamState;
  const totalTime = (state?.examTime || 30) * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'wrong_answer' | 'wrong_question' | 'other'>('wrong_answer');
  const [reportAnswer, setReportAnswer] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportName, setReportName] = useState('');
  const [reportLevel, setReportLevel] = useState('');
  const [reportBatch, setReportBatch] = useState('');
  const [reportContact, setReportContact] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportImage, setReportImage] = useState<File | null>(null);
  const [reportImagePreview, setReportImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [showScoreFloat, setShowScoreFloat] = useState(false);

  useEffect(() => {
    if (!state?.studentName) navigate(`/exam/${subjectId}`);
  }, [state, subjectId, navigate]);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['exam-questions', subjectId, state?.examYear, state?.examForm, state?.questionsCount, state?.forcedQuestionIds?.join(',')],
    queryFn: async () => {
      // إذا كانت أسئلة محددة (مبارزة)
      if (state?.forcedQuestionIds?.length) {
        const { data, error } = await supabase.from('questions').select('*').in('id', state.forcedQuestionIds).eq('status', 'active');
        if (error) throw error;
        return (data as Question[]).sort(() => Math.random() - 0.5);
      }
      let query = supabase.from('questions').select('*').eq('subject_id', subjectId).eq('status', 'active');
      if (!state?.allQuestions) {
        if (state?.isTrial) {
          query = query.is('exam_year', null);
        } else {
          if (state.examYear) query = query.eq('exam_year', state.examYear);
          if (state.examForm && state.examForm !== 'Mixed') query = query.eq('exam_form', state.examForm);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Question[]).sort(() => Math.random() - 0.5);
    },
    enabled: !!subjectId && (!!state?.examYear || !!state?.isTrial || !!state?.allQuestions || !!state?.forcedQuestionIds?.length),
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

  const { data: currentQuestionStats } = useQuery({
    queryKey: ['question-stats', questions[currentIndex]?.id, !!answers[questions[currentIndex]?.id]],
    queryFn: async () => {
      const { data } = await supabase.from('question_stats').select('*').eq('question_id', questions[currentIndex]!.id).maybeSingle();
      return data;
    },
    enabled: !!questions[currentIndex]?.id && !!answers[questions[currentIndex]?.id],
  });

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !questions.length) return;
    setIsSubmitting(true);
    let finalScore = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_option) finalScore++; });
    const totalQuestions = questions.length;
    const passed = Math.round((finalScore / totalQuestions) * 100) >= (subject?.passing_score || 60);
    const timeTaken = totalTime - timeLeft;
    const scorePercentage = Math.round((finalScore / totalQuestions) * 100);
    try {
      // insert أساسي بدون أعمدة قد تكون غير موجودة
      const insertPayload = {
        subject_id: subjectId,
        student_name: state.studentName,
        score: finalScore,
        total_questions: totalQuestions,
        passing_score: subject?.passing_score || 60,
        passed,
        exam_year: state.isTrial ? null : (state.allQuestions ? null : state.examYear),
        exam_form: state.isTrial ? 'Trial' : (state.allQuestions ? 'All' : (state.examForm || null)),
        time_taken_seconds: timeTaken,
        answers,
        score_percentage: scorePercentage,
        challenge_session_id: state.challengeSessionId || null,
      };
      await supabase.from('exam_results').insert(insertPayload);

      // تسجيل إحصائيات الأسئلة (لا تعطل التسليم)
      try {
        const statsPromises = questions.map(q => {
          const selected = answers[q.id];
          if (!selected) return Promise.resolve();
          return supabase.rpc('record_question_answer', {
            p_question_id: q.id,
            p_selected_option: selected,
            p_is_correct: selected === q.correct_option,
          });
        });
        await Promise.allSettled(statsPromises);
      } catch { /* ignore */ }

      // تسجيل نتيجة المبارزة (لا تعطل التسليم)
      try {
        if (state.challengeMode && state.challengeSessionId) {
          await supabase.from('challenge_results').insert({
            session_id: state.challengeSessionId,
            challenger_name: state.studentName,
            score: finalScore,
            total_questions: totalQuestions,
            percentage: scorePercentage,
            time_seconds: timeTaken,
          });
        }
      } catch { /* ignore */ }

      // تحديث ملف الطالب الشخصي
      try {
        await supabase.rpc('update_student_profile', {
          p_student_name: state.studentName,
          p_score: finalScore,
          p_total_questions: totalQuestions,
          p_passed: passed,
        });
      } catch { /* تجاهل */ }

      // منح الشارات المستحقة
      try {
        const { data: prof } = await supabase
          .from('student_profiles')
          .select('total_exams, best_score, badges, current_streak')
          .eq('student_name', state.studentName)
          .maybeSingle();
        if (prof) {
          const newBadges: string[] = [];
          if (prof.total_exams === 1) newBadges.push('first_exam');
          if (scorePercentage === 100) newBadges.push('perfect');
          if (scorePercentage >= 90) newBadges.push('score_90');
          if (prof.total_exams >= 10) newBadges.push('exams_10');
          if (prof.total_exams >= 50) newBadges.push('exams_50');
          if (prof.current_streak >= 3) newBadges.push('streak_3');
          if (prof.current_streak >= 7) newBadges.push('streak_7');
          if (newBadges.length > 0) {
            const existing = (prof.badges as string[]) || [];
            const merged = [...new Set([...existing, ...newBadges])];
            await supabase
              .from('student_profiles')
              .update({ badges: merged })
              .eq('student_name', state.studentName);
          }
        }
      } catch { /* تجاهل أخطاء الشارات */ }
    } catch (e) { console.error(e); }
    navigate(`/exam/${subjectId}/result`, {
      state: {
        studentName: state.studentName, score: finalScore, totalQuestions,
        passingScore: subject?.passing_score || 60, passed, timeTaken,
        questions, answers, subjectName: state.subjectName || subject?.name,
        levelName: state.levelName, examYear: state.examYear,
        scorePercentage,
        challengeMode: state.challengeMode,
        challengeSessionId: state.challengeSessionId,
        subjectId,
        // بيانات إضافية لإعادة الاختبار مباشرة
        examForm:      state.examForm,
        isTrial:       state.isTrial,
        allQuestions:  state.allQuestions,
        examTime:      state.examTime,
        questionsCount: state.questionsCount,
      },
    });
  }, [answers, questions, subject, state, subjectId, timeLeft, navigate, isSubmitting, totalTime]);

  useEffect(() => {
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, handleSubmit]);

  if (isLoading) return (
    <MainLayout>
      <div className="container mx-auto px-6 py-24 text-center font-bold text-slate-400 dark:text-slate-500 dark:text-muted-foreground animate-pulse">جاري تحضير أسئلة الاختبار...</div>
    </MainLayout>
  );
  if (!questions.length) return (
    <MainLayout>
      <div className="container mx-auto px-6 py-24 text-center font-bold dark:text-slate-200">عذراً، لا توجد أسئلة متاحة لهذا النموذج حالياً.</div>
    </MainLayout>
  );

  // دوال المشاركة
  const getShareData = () => {
    const url = `${window.location.origin}/exam/${subjectId}`;
    const text = `📚 سؤال من ${state?.subjectName || 'اختبار قانوني'}\n\n${questions[currentIndex]?.question_text || ''}\n\nجرب إجابته على منصة الناصر القانونية:\n${url}`;
    return { url, text };
  };

  const handleShareWhatsapp = () => {
    const { text } = getShareData();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareTelegram = () => {
    const { url } = getShareData();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(questions[currentIndex]?.question_text || '')}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const { text } = getShareData();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const { url } = getShareData();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setShowShareMenu(false);
  };

  const handleSubmitReport = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setReportSubmitting(true);

    // رفع الصورة إن وجدت
    let image_url: string | null = null;
    if (reportImage) {
      const ext = reportImage.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData } = await supabase.storage
        .from('report-images')
        .upload(fileName, reportImage, { upsert: false });
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('report-images').getPublicUrl(fileName);
        image_url = urlData.publicUrl;
      }
    }

    await supabase.from('question_reports').insert({
      question_id: currentQ.id,
      error_type: reportType,
      suggested_answer: reportAnswer || null,
      note: reportNote || null,
      reporter_name: reportName || null,
      reporter_level: reportLevel || null,
      reporter_batch: reportBatch || null,
      reporter_contact: reportContact || null,
      image_url,
      exam_year: state?.isTrial ? null : (state?.allQuestions ? null : (state?.examYear || null)),
      exam_form: state?.isTrial ? 'Trial' : (state?.allQuestions ? 'All' : (state?.examForm || null)),
      level_name: state?.levelName || null,
    } as any);
    setReportSubmitting(false);
    setReportDone(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportDone(false);
      setReportAnswer('');
      setReportNote('');
      setReportType('wrong_answer');
      setReportName('');
      setReportLevel('');
      setReportBatch('');
      setReportContact('');
      setReportImage(null);
      setReportImagePreview(null);
    }, 1800);
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;
  const isTimeWarning = timeLeft < 60;
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasAnswered = !!selectedAnswer;
  // isAnswerCorrect ستُحسب بعد mappedCorrectOption
  const progressColor = progressPct < 33 ? '#ef4444' : progressPct < 66 ? '#f59e0b' : '#10b981';

  // خريطة تحويل الحروف الإنجليزية إلى عربية
  const optionLabels: Record<string, string> = { A: 'أ', B: 'ب', C: 'ج', D: 'د' };

  // خيارات عشوائية مستقرة لكل سؤال (تتغير بين الجلسات، ثابتة داخل نفس الجلسة)
  const shuffledOptionsMap = useMemo(() => {
    if (!questions.length) return {};
    const map: Record<string, { order: string[]; correctMapped: string }> = {};
    questions.forEach((q) => {
      const available = (['A', 'B', 'C', 'D'] as const).filter(opt => {
        const v = q[`option_${opt.toLowerCase()}` as keyof Question] as string;
        return v && v.trim().length > 0;
      });
      // خلط النصوص عشوائياً، الحروف تبقى A B C D بنفس ترتيبها
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      // الحرف الجديد الذي يحمل الإجابة الصحيحة بعد الخلط
      const newCorrect = String.fromCharCode(65 + shuffled.indexOf(q.correct_option));
      map[q.id] = { order: shuffled, correctMapped: newCorrect };
    });
    return map;
  }, [questions]);

  const currentShuffled = shuffledOptionsMap[currentQuestion?.id] ?? { order: ['A','B','C','D'], correctMapped: currentQuestion?.correct_option };
  const availableOptions = ['A', 'B', 'C', 'D'].filter((_, i) => currentShuffled.order[i]);
  const mappedCorrectOption = currentShuffled.correctMapped;
  const isAnswerCorrect = currentQuestion ? selectedAnswer === mappedCorrectOption : false;

  // حماية: لا تكمل إذا لم يكن هناك سؤال حالي
  if (!currentQuestion) return null;

  const handleAnswer = (option: string) => {
    if (hasAnswered) return;
    setAnswers({ ...answers, [currentQuestion.id]: option });
    if (option === mappedCorrectOption) {
      setLiveScore(s => s + 1);
      setShowConfetti(true);
      setShowScoreFloat(true);
      setTimeout(() => setShowConfetti(false), 2200);
      setTimeout(() => setShowScoreFloat(false), 900);
    } else {
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 520);
      if (currentQuestion.hint) setShowHint(true);
    }
  };

  const goTo = (index: number) => {
    setSlideDir(index > currentIndex ? 'left' : 'right');
    setAnimKey(k => k + 1);
    setCurrentIndex(index);
    setShowHint(false);
  };
  const goNext = () => goTo(Math.min(questions.length - 1, currentIndex + 1));
  const goPrev = () => goTo(Math.max(0, currentIndex - 1));

  const getOptionStyle = (opt: string) => {
    const isSel = selectedAnswer === opt;
    const isCorr = currentQuestion.correct_option === opt;
    if (!hasAnswered) return isSel ? "border-primary bg-primary/5 shadow-lg scale-[1.01]" : "border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-primary/30 hover:bg-white dark:hover:bg-slate-600 hover:scale-[1.005]";
    if (isCorr) return "border-emerald-500 bg-emerald-50 shadow-lg anim-glow";
    if (isSel && !isCorr) return "border-rose-500 bg-rose-50 shadow-md";
    return "border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 opacity-40";
  };

  const getBadgeStyle = (opt: string) => {
    const isSel = selectedAnswer === opt;
    const isCorr = currentQuestion.correct_option === opt;
    if (!hasAnswered) return isSel ? "bg-primary text-white shadow-primary/40 shadow-lg" : "bg-white dark:bg-slate-600 text-slate-500 dark:text-white border border-slate-200 dark:border-slate-500";
    if (isCorr) return "bg-emerald-500 text-white";
    if (isSel && !isCorr) return "bg-rose-500 text-white";
    return "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300";
  };

  const getTextStyle = (opt: string) => {
    const isSel = selectedAnswer === opt;
    const isCorr = currentQuestion.correct_option === opt;
    if (!hasAnswered) return isSel ? "text-primary font-black" : "text-slate-600 dark:text-slate-300 font-bold";
    if (isCorr) return "text-emerald-700 font-black";
    if (isSel && !isCorr) return "text-rose-700 font-black";
    return "text-slate-400 dark:text-muted-foreground font-medium";
  };

  // نطاق النقاط المرئية
  const dotStart = Math.max(0, currentIndex - 3);
  const dotEnd = Math.min(questions.length, currentIndex + 4);

  return (
    <MainLayout>
      <GlobalStyles />
      <Confetti active={showConfetti} />

      <section className="py-4 md:py-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 min-h-[calc(100vh-80px)] font-cairo text-right" dir="rtl">
        <div className="container mx-auto px-3 md:px-6">
          <div className="max-w-4xl mx-auto">

            {/* ── Header ── */}
            <div className="sticky top-16 md:top-20 z-40 bg-white dark:bg-card/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-border/80 dark:border-slate-700/80 p-3 md:p-5 mb-4 md:mb-8 shadow-xl flex items-center justify-between gap-3">

              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {/* أرقام + نقاط حية */}
                <div className="flex items-center justify-between text-[10px] md:text-xs font-black text-slate-400 dark:text-muted-foreground">
                  <span>السؤال {currentIndex + 1} / {questions.length}</span>
                  <div className="flex items-center gap-1 relative">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-500 font-black">{liveScore} نقطة</span>
                    {showScoreFloat && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-emerald-500 font-black text-sm anim-score-float select-none">+1</span>
                    )}
                  </div>
                </div>

                {/* شريط تقدم ملوّن */}
                <div className="h-2.5 md:h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%`, backgroundColor: progressColor }} />
                </div>

                {/* مؤشر الأسئلة الصغير */}
                <div className="flex gap-[3px] overflow-hidden">
                  {questions.map((q, i) => (
                    <div key={q.id} className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      i === currentIndex ? "bg-primary" :
                      answers[q.id] ? (answers[q.id] === q.correct_option ? "bg-emerald-400" : "bg-rose-400") :
                      "bg-slate-200"
                    )} />
                  ))}
                </div>
              </div>

              {/* مؤقت دائري */}
              <CircularTimer timeLeft={timeLeft} totalTime={totalTime} isWarning={isTimeWarning} />
            </div>

            {/* ── بطاقة السؤال ── */}
            {currentQuestion && (
              <div
                key={animKey}
                className={cn(
                  "bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 p-5 md:p-14 mb-4 md:mb-6",
                  slideDir === 'left' ? "anim-slide-left" : "anim-slide-right",
                  shakeCard && "anim-shake"
                )}
              >
                {/* رأس البطاقة */}
                <div className="flex items-center gap-3 mb-5 md:mb-8 flex-wrap">
                  <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-primary/30 shrink-0">
                    {currentIndex + 1}
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[9px] md:text-[10px] font-black tracking-widest">
                    {state.isTrial ? '🧪 النموذج التجريبي' : state.allQuestions ? '📚 جميع الأسئلة' : `اختبار عام ${state.examYear} ${state.examForm === 'Parallel' ? '· موازي' : ''}`}
                  </span>

                  {/* زر المشاركة مع قائمة منسدلة */}
                  <div className="mr-auto relative flex items-center gap-2">
                    <button
                      onClick={() => setShowShareMenu(prev => !prev)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black border transition-all duration-200",
                        showShareMenu
                          ? "bg-primary border-primary text-white"
                          : "bg-white dark:bg-card border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
                      )}
                    >
                      <Share2 className="w-3 h-3" /> مشاركة
                    </button>
                    {showShareMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                        <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl shadow-slate-200/60 overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                          <button onClick={handleShareWhatsapp} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-700 transition-colors text-right">
                            <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            واتساب
                          </button>
                          <button onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-blue-50 hover:text-blue-700 transition-colors text-right border-t border-slate-50">
                            <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.64-.203-.654-.64.136-.953l11.57-4.461c.537-.194 1.006.131.326.889z"/>
                            </svg>
                            تيليجرام
                          </button>
                          <button onClick={handleShareTwitter} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-slate-50 dark:bg-muted hover:text-slate-900 dark:text-foreground transition-colors text-right border-t border-slate-50">
                            <svg className="w-4 h-4 text-slate-800 dark:text-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            تويتر (X)
                          </button>
                          <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-slate-50 dark:bg-muted transition-colors text-right border-t border-slate-50">
                            {copied
                              ? <><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-emerald-600">تم النسخ!</span></>
                              : <><svg className="w-4 h-4 text-slate-400 dark:text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>نسخ الرابط</>
                            }
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* زر التعقيب */}
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200"
                  >
                    <MessageSquare className="w-3 h-3" /> إبلاغ عن خطأ
                  </button>

                  </div>{/* end mr-auto wrapper */}

                <h2 className="text-base md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-7 md:mb-10 leading-relaxed text-right">
                  {currentQuestion.question_text}
                </h2>

                {/* الخيارات */}
                <div className="grid grid-cols-1 gap-3 md:gap-4" onCopy={e => e.preventDefault()} onContextMenu={e => e.preventDefault()} style={{userSelect:"none",WebkitUserSelect:"none"}}>
                  {availableOptions.map((opt, optIdx) => {
                    const posLabels = ['أ', 'ب', 'ج', 'د'];
                    const k = `option_${opt.toLowerCase()}` as keyof Question;
                    const text = cleanOptionText(currentQuestion[k] as string);
                    const isCorr = currentQuestion.correct_option === opt;
                    const isSel = selectedAnswer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        disabled={hasAnswered}
                        className={cn(
                          "w-full text-right p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 flex items-center gap-3 md:gap-5",
                          getOptionStyle(opt),
                          !hasAnswered && "cursor-pointer active:scale-[0.98]",
                          hasAnswered && "cursor-default"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-base md:text-lg shrink-0 transition-all duration-300",
                          getBadgeStyle(opt)
                        )}>
                          {posLabels[optIdx] ?? opt}
                        </div>
                        <span className={cn("flex-1 text-sm md:text-base text-right transition-all duration-300", getTextStyle(opt))}>
                          {text}
                        </span>
                        {hasAnswered && isCorr && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 shrink-0" />}
                        {hasAnswered && isSel && !isCorr && <XCircle className="w-5 h-5 md:w-6 md:h-6 text-rose-500 shrink-0" />}
                        {!hasAnswered && isSel && <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* رسالة + زر التالي بعد الإجابة */}
                {hasAnswered && (
                  <div className="mt-5 md:mt-8 anim-zoom-in">
                    <div className={cn(
                      "p-4 md:p-5 rounded-2xl flex items-center gap-3 font-black text-sm md:text-base mb-4",
                      isAnswerCorrect
                        ? "bg-emerald-50 border-2 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-2 border-rose-200 text-rose-700"
                    )}>
                      {isAnswerCorrect
                        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                        : <XCircle className="w-5 h-5 shrink-0" />
                      }
                      <span>
                        {isAnswerCorrect
                          ? "إجابة صحيحة! 🎉"
                          : `إجابة خاطئة — الصحيحة: ${currentQuestion.correct_option}`}
                      </span>
                    </div>

                    {/* تلميح عند الإجابة الخاطئة */}
                    {!isAnswerCorrect && currentQuestion.hint && (
                      <div className="mb-4">
                        {showHint && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 mb-2 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 animate-in fade-in duration-300">
                            <span>💡</span>
                            <span>{currentQuestion.hint}</span>
                          </div>
                        )}
                        <button onClick={() => setShowHint(p => !p)}
                          className="flex items-center gap-1.5 text-[11px] font-black text-amber-500 hover:text-amber-600 transition-colors">
                          💡
                          {showHint ? 'إخفاء التلميح' : 'عرض التلميح'}
                        </button>
                      </div>
                    )}

                    {/* اسم المراجع */}
                    {(currentQuestion as any).reviewer_credit && (
                      <div className="mb-4 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                        <span>✏️ مراجعة:</span>
                        <span className="text-primary/70 font-black">{(currentQuestion as any).reviewer_credit}</span>
                      </div>
                    )}

                    {/* إحصائيات المستخدمين */}
                    {currentQuestionStats && (currentQuestionStats as any).total_answers >= 5 && (
                      <div className="mb-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 dark:text-muted-foreground uppercase tracking-widest">
                            إحصائيات المستخدمين — {(currentQuestionStats as any).total_answers} إجابة
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 w-8 text-left">
                            {Math.round(((currentQuestionStats as any).correct_answers / (currentQuestionStats as any).total_answers) * 100)}%
                          </span>
                          <div className="flex-1 h-2.5 bg-rose-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.round(((currentQuestionStats as any).correct_answers / (currentQuestionStats as any).total_answers) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-rose-500 w-8">
                            {Math.round((((currentQuestionStats as any).total_answers - (currentQuestionStats as any).correct_answers) / (currentQuestionStats as any).total_answers) * 100)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['A','B','C','D'] as const).map(opt => {
                            const countKey = `option_${opt.toLowerCase()}_count`;
                            const count = ((currentQuestionStats as any)[countKey] as number) || 0;
                            const pct = Math.round((count / (currentQuestionStats as any).total_answers) * 100);
                            const currentQ = questions[currentIndex];
                            const isCorr = currentQ?.correct_option === opt;
                            const isSel = answers[currentQ?.id] === opt;
                            const arLabel = opt === 'A' ? 'أ' : opt === 'B' ? 'ب' : opt === 'C' ? 'ج' : 'د';
                            return (
                              <div key={opt} className={cn('rounded-xl p-2 text-center border',
                                isCorr ? 'bg-emerald-50 border-emerald-200' :
                                isSel && !isCorr ? 'bg-rose-50 border-rose-200' : 'bg-white dark:bg-card border-slate-100 dark:border-border')}>
                                <div className={cn('text-[10px] font-black mb-1',
                                  isCorr ? 'text-emerald-600' : isSel && !isCorr ? 'text-rose-500' : 'text-slate-400 dark:text-muted-foreground')}>{arLabel}</div>
                                <div className="h-8 bg-slate-100 dark:bg-muted rounded-lg overflow-hidden flex items-end mb-1">
                                  <div className={cn('w-full rounded-lg transition-all duration-700',
                                    isCorr ? 'bg-emerald-400' : isSel && !isCorr ? 'bg-rose-400' : 'bg-slate-300')}
                                    style={{ height: `${Math.max(pct, 4)}%` }} />
                                </div>
                                <div className={cn('text-[10px] font-black', isCorr ? 'text-emerald-600' : 'text-slate-500 dark:text-muted-foreground')}>{pct}%</div>
                              </div>
                            );
                          })}
                        </div>
                        {(() => {
                          const errPct = Math.round((((currentQuestionStats as any).total_answers - (currentQuestionStats as any).correct_answers) / (currentQuestionStats as any).total_answers) * 100);
                          if (errPct >= 60) return <p className="text-[10px] text-amber-600 font-bold mt-2 bg-amber-50 px-3 py-1.5 rounded-xl">⚠️ {errPct}% من المستخدمين أخطأوا في هذا السؤال — سؤال صعب!</p>;
                          if (errPct <= 20) return <p className="text-[10px] text-emerald-600 font-bold mt-2 bg-emerald-50 px-3 py-1.5 rounded-xl">✅ {100 - errPct}% من المستخدمين أجابوا بشكل صحيح</p>;
                          return null;
                        })()}
                      </div>
                    )}

                    {/* زر السؤال التالي / التسليم */}
                    {currentIndex < questions.length - 1 ? (
                      <Button
                        onClick={goNext}
                        className="w-full h-12 md:h-14 rounded-2xl bg-gradient-to-l from-primary to-blue-600 text-white font-black text-base shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-[0.98]"
                      >
                        السؤال التالي <ChevronLeft className="mr-2 w-5 h-5" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowSubmitDialog(true)}
                        className="w-full h-12 md:h-14 rounded-2xl bg-slate-900 text-white font-black text-base shadow-lg transition-all active:scale-[0.98]"
                      >
                        <Flag className="w-5 h-5 ml-2" /> تسليم الاختبار
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── أزرار التنقل الحر ── */}
            <div className="flex justify-between items-center gap-2 md:gap-4">
              <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}
                className="rounded-xl md:rounded-2xl h-12 md:h-14 px-4 md:px-8 border-slate-200 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-800 font-bold text-sm active:scale-95">
                <ChevronRight className="ml-1 w-4 h-4" /> السابق
              </Button>

              {/* نقاط التنقل */}
              <div className="flex gap-2 items-center">
                {questions.slice(dotStart, dotEnd).map((_, i) => {
                  const ri = dotStart + i;
                  return (
                    <button key={ri} onClick={() => goTo(ri)}
                      className={cn("rounded-full transition-all duration-200",
                        ri === currentIndex ? "w-6 h-3 bg-primary" : "w-3 h-3 bg-slate-300 dark:bg-slate-600 hover:bg-primary/50"
                      )} />
                  );
                })}
              </div>

              {currentIndex === questions.length - 1 ? (
                <Button onClick={() => setShowSubmitDialog(true)}
                  className="rounded-xl md:rounded-2xl h-12 md:h-14 px-5 md:px-10 bg-slate-900 text-white font-black text-sm active:scale-95">
                  <Flag className="w-4 h-4 ml-1" /> تسليم
                </Button>
              ) : (
                <Button onClick={goNext}
                  className="rounded-xl md:rounded-2xl h-12 md:h-14 px-5 md:px-10 bg-primary text-white font-black text-sm active:scale-95">
                  التالي <ChevronLeft className="mr-1 w-4 h-4" />
                </Button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── حوار التسليم ── */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 md:p-12 text-right" dir="rtl">
          <AlertDialogHeader>
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-3xl font-black text-center">هل أنت جاهز للنتيجة؟</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-lg text-slate-500 dark:text-muted-foreground mt-4 leading-relaxed">
              {answeredCount < questions.length
                ? <span className="text-rose-500 font-bold">انتبه! لم تجب على جميع الأسئلة.</span>
                : <span className="text-green-600 font-bold">رائع! لقد أكملت جميع الإجابات.</span>}
              <br />بمجرد التأكيد، سيتم تصحيح اختبارك وإصدار النتيجة فوراً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
            <AlertDialogCancel onClick={() => { setShowSubmitDialog(false); setShowReviewDialog(true); }}
              className="flex-1 h-14 rounded-2xl font-bold">مراجعة الأسئلة</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}
              className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20">تأكيد وتسليم</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── حوار المراجعة ── */}
      <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AlertDialogContent className="rounded-[2.5rem] p-6 md:p-8 max-w-3xl max-h-[90vh] overflow-hidden text-right" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-center mb-4">مراجعة الأسئلة</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-slate-500 dark:text-muted-foreground">اضغط على رقم السؤال للانتقال إليه</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 max-h-[50vh] overflow-y-auto p-2">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {questions.map((q, index) => (
                <button key={q.id}
                  onClick={() => { goTo(index); setShowReviewDialog(false); }}
                  className={cn(
                    "w-12 h-12 rounded-xl font-black text-base transition-all border-2 flex items-center justify-center",
                    answers[q.id] ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400",
                    currentIndex === index && "ring-4 ring-primary ring-offset-2 scale-110 z-10"
                  )}>
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-foreground/70 my-4 px-2 bg-slate-50 dark:bg-muted py-3 rounded-2xl">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-400 rounded" /><span>تمت الإجابة ({answeredCount})</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-rose-300 rounded" /><span>بانتظار الإجابة ({questions.length - answeredCount})</span></div>
          </div>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl font-bold border-slate-200 dark:border-border">متابعة المراجعة</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowReviewDialog(false); setShowSubmitDialog(true); }}
              className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-black">
              <Flag className="w-4 h-4 ml-2" /> تسليم النهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* نافذة التعقيب */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col" style={{ maxHeight: '92dvh' }}>

            {reportDone ? (
              <div className="text-center py-6 space-y-3 p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="font-black text-lg">شكراً على تعقيبك!</p>
                <p className="text-sm text-muted-foreground">سيتم مراجعة ملاحظتك من قِبل الإدارة</p>
              </div>
            ) : (
              <>
                {/* رأس ثابت */}
                <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <h3 className="font-black text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    تعقيب على السؤال
                  </h3>
                  <button onClick={() => setShowReportModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* محتوى قابل للتمرير */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

                {/* نص السؤال */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                  {questions[currentIndex]?.question_text}
                </div>

                {/* نوع الخطأ */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">نوع الخطأ</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'wrong_answer', label: 'خطأ في الإجابة' },
                      { val: 'wrong_question', label: 'خطأ في السؤال' },
                      { val: 'other', label: 'ملاحظة أخرى' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setReportType(val as any)}
                        className={cn(
                          'py-2 px-2 rounded-xl text-[11px] font-black border transition-all text-center',
                          reportType === val
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'border-slate-200 dark:border-border text-slate-500 hover:border-orange-300'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* الإجابة الصحيحة المقترحة */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">الإجابة الصحيحة من وجهة نظرك</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['A','B','C','D'] as const).map(opt => {
                      const arLabel = opt === 'A' ? 'أ' : opt === 'B' ? 'ب' : opt === 'C' ? 'ج' : 'د';
                      return (
                        <button
                          key={opt}
                          onClick={() => setReportAnswer(reportAnswer === opt ? '' : opt)}
                          className={cn(
                            'py-2 rounded-xl text-sm font-black border transition-all',
                            reportAnswer === opt
                              ? 'bg-primary border-primary text-white'
                              : 'border-slate-200 dark:border-border text-slate-500 hover:border-primary/50'
                          )}
                        >
                          {arLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ملاحظة */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">ملاحظة إضافية (اختياري)</p>
                  <textarea
                    value={reportNote}
                    onChange={e => setReportNote(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* رفع صورة */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">إرفاق صورة (اختياري)</p>
                  {reportImagePreview ? (
                    <div className="relative">
                      <img src={reportImagePreview} alt="preview" className="w-full max-h-40 object-contain rounded-xl border border-slate-200" />
                      <button
                        onClick={() => { setReportImage(null); setReportImagePreview(null); }}
                        className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-border cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                      <span className="text-2xl">📎</span>
                      <span className="text-xs font-semibold text-slate-400">اضغط لاختيار صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setReportImage(file);
                            setReportImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* بيانات المُعقِّب */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">بياناتك (اختياري)</p>
                  <input
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={reportLevel}
                      onChange={e => setReportLevel(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-500"
                    >
                      <option value="">المستوى</option>
                      <option value="الأول">الأول</option>
                      <option value="الثاني">الثاني</option>
                      <option value="الثالث">الثالث</option>
                      <option value="الرابع">الرابع</option>
                    </select>
                    <input
                      value={reportBatch}
                      onChange={e => setReportBatch(e.target.value)}
                      placeholder="رقم الدفعة فقط (مثال: 50)"
                      className="rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <input
                    value={reportContact}
                    onChange={e => setReportContact(e.target.value)}
                    placeholder="رقم الجوال أو الإيميل (اختياري)"
                    className="w-full rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                </div>{/* end scrollable content */}

                {/* زر الإرسال ثابت في الأسفل */}
                <div className="px-6 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    onClick={handleSubmitReport}
                    disabled={reportSubmitting}
                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {reportSubmitting
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><MessageSquare className="w-4 h-4" /> إرسال التعقيب</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ExamPage;
