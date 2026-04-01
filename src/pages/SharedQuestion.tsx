/**
 * Alnasser Tech Digital Solutions
 * Component: SharedQuestion — صفحة السؤال المشارك
 * الزائر يرى السؤال، يجيب، يرى الإجابة الصحيحة، ثم إشعار للاختبار الكامل
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/database';
import { CheckCircle2, XCircle, ArrowLeft, Zap, BookOpen, Trophy, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const cleanOptionText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/^[\s]*[A-Dأبجد][\.\-\)]\s*/, '')
    .replace(/^[\s]*\d+[\.\-\)]\s*/, '')
    .trim();
};

const OPTION_LABELS: Record<string, string> = {
  A: 'أ',
  B: 'ب',
  C: 'ج',
  D: 'د',
};

export default function SharedQuestion() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  // جلب السؤال من Supabase
  const { data: question, isLoading, isError } = useQuery<Question>({
    queryKey: ['shared-question', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId!)
        .eq('status', 'active')
        .single();
      if (error || !data) throw new Error('السؤال غير موجود');
      return data as Question;
    },
    enabled: !!questionId,
    retry: 1,
  });

  // جلب اسم المادة
  const { data: subject } = useQuery({
    queryKey: ['subject-for-shared', question?.subject_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('id', question!.subject_id)
        .single();
      return data;
    },
    enabled: !!question?.subject_id,
  });

  const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = question
    ? [
        { key: 'A', text: cleanOptionText(question.option_a) },
        { key: 'B', text: cleanOptionText(question.option_b) },
        { key: 'C', text: cleanOptionText(question.option_c) },
        { key: 'D', text: cleanOptionText(question.option_d) },
      ]
    : [];

  const handleSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    setAnswered(true);
    // إظهار البانر بعد 900ms
    setTimeout(() => {
      setShowBanner(true);
      setTimeout(() => setBannerVisible(true), 50);
    }, 900);
  };

  const goToExam = () => {
    navigate(`/exam/${question?.subject_id}`);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──
  if (isError || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6" dir="rtl">
        <div className="text-5xl">🔍</div>
        <h1 className="text-xl font-bold text-foreground">السؤال غير موجود</h1>
        <p className="text-muted-foreground text-sm text-center">ربما تم حذف هذا السؤال أو الرابط غير صحيح</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
        >
          الذهاب للرئيسية
        </button>
      </div>
    );
  }

  const isCorrect = answered && selected === question.correct_option;
  const isWrong = answered && selected !== question.correct_option;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ── شريط علوي ── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            الرئيسية
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">منصة الناصر القانونية</span>
          </div>
        </div>
      </div>

      {/* ── المحتوى الرئيسي ── */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-40">
        {/* شارة المادة */}
        {subject && (
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              <BookOpen className="w-3.5 h-3.5" />
              {subject.name}
              {question.exam_year && ` · ${question.exam_year}`}
            </span>
          </div>
        )}

        {/* بطاقة السؤال */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <p className="text-foreground font-semibold text-base leading-relaxed text-right">
            {question.question_text}
          </p>
        </div>

        {/* الخيارات */}
        <div className="flex flex-col gap-3">
          {options.map(({ key, text }) => {
            const isSelected = selected === key;
            const isCorrectOption = key === question.correct_option;

            let borderClass = 'border-border hover:border-primary/40 hover:bg-primary/5';
            let bgClass = 'bg-card';
            let labelBg = 'bg-muted text-muted-foreground';
            let iconEl = null;

            if (answered) {
              if (isCorrectOption) {
                borderClass = 'border-emerald-500';
                bgClass = 'bg-emerald-50 dark:bg-emerald-950/30';
                labelBg = 'bg-emerald-500 text-white';
                iconEl = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
              } else if (isSelected && !isCorrectOption) {
                borderClass = 'border-red-400';
                bgClass = 'bg-red-50 dark:bg-red-950/30';
                labelBg = 'bg-red-400 text-white';
                iconEl = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
              }
            } else if (isSelected) {
              borderClass = 'border-primary';
              bgClass = 'bg-primary/5';
              labelBg = 'bg-primary text-primary-foreground';
            }

            return (
              <button
                key={key}
                disabled={answered}
                onClick={() => handleSelect(key)}
                className={cn(
                  'w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all duration-200 text-right',
                  borderClass,
                  bgClass,
                  !answered && 'cursor-pointer active:scale-[0.98]',
                  answered && 'cursor-default'
                )}
              >
                {/* أيقونة النتيجة */}
                <div className="mr-auto shrink-0">
                  {answered ? iconEl : null}
                </div>

                {/* نص الخيار */}
                <span className="flex-1 text-sm font-medium text-foreground leading-relaxed">
                  {text}
                </span>

                {/* حرف الخيار */}
                <span className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors duration-200',
                  labelBg
                )}>
                  {OPTION_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* رسالة النتيجة */}
        {answered && (
          <div className={cn(
            'mt-5 rounded-xl p-4 flex items-center gap-3 border transition-all duration-500',
            isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          )}>
            {isCorrect
              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            }
            <div className="flex-1 text-right">
              <p className={cn(
                'font-bold text-sm',
                isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}>
                {isCorrect ? '🎉 إجابة صحيحة!' : '❌ إجابة خاطئة'}
              </p>
              {!isCorrect && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  الإجابة الصحيحة: <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {OPTION_LABELS[question.correct_option]} — {cleanOptionText(question[`option_${question.correct_option.toLowerCase()}` as keyof Question] as string)}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* تلميح */}
        {!answered && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            اختر إجابتك للكشف عن الحل
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          بانر الدعوة للاختبار الكامل — يظهر بعد الإجابة
      ══════════════════════════════════════════════ */}
      {showBanner && (
        <>
          {/* خلفية شفافة */}
          <div
            className={cn(
              'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300',
              bannerVisible ? 'opacity-100' : 'opacity-0'
            )}
            onClick={goToExam}
          />

          {/* البانر نفسه */}
          <div
            className={cn(
              'fixed bottom-0 inset-x-0 z-50 transition-all duration-500 ease-out',
              bannerVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            )}
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-t-3xl shadow-2xl overflow-hidden border-t border-slate-700/50">
              {/* شريط متوهج علوي */}
              <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-400 to-primary opacity-80" />

              <div className="px-5 pt-5 pb-8" dir="rtl">
                {/* العنوان */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-lg leading-tight">
                      هل أنت مستعد للاختبار الكامل؟
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {subject?.name || 'اختبار قانوني'} · أكثر من 500 سؤال بانتظارك
                    </p>
                  </div>
                </div>

                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: '⏱️', label: 'وقت مرن', sub: '10-60 دقيقة' },
                    { icon: '📊', label: 'نتائج فورية', sub: 'مع التحليل' },
                    { icon: '🔁', label: 'تكرار لا محدود', sub: 'مجاناً' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center"
                    >
                      <div className="text-lg mb-0.5">{item.icon}</div>
                      <div className="text-white text-[10px] font-bold leading-tight">{item.label}</div>
                      <div className="text-slate-400 text-[9px] mt-0.5">{item.sub}</div>
                    </div>
                  ))}
                </div>

                {/* زر الدخول الرئيسي */}
                <button
                  onClick={goToExam}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/30 group"
                >
                  <Zap className="w-5 h-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-primary-foreground font-black text-base tracking-wide">
                    ابدأ الاختبار الآن
                  </span>
                  <ArrowLeft className="w-4 h-4 text-primary-foreground/80 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* رابط إغلاق خفيف */}
                <button
                  onClick={() => { setBannerVisible(false); setTimeout(() => setShowBanner(false), 300); }}
                  className="w-full text-center mt-3 text-slate-500 hover:text-slate-300 text-xs transition-colors py-1"
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
