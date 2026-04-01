/**
 * Alnasser Tech Digital Solutions
 * Component: SharedQuestion — صفحة السؤال المشارك
 * التصميم يطابق ExamPage بالكامل
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/database';
import {
  CheckCircle2, XCircle, ArrowLeft, Zap, BookOpen,
  Trophy, ChevronLeft, Share2, Check, AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';

/* ── helpers ── */
const cleanOptionText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/^[\s]*[A-Dأبجد][\.\-\)]\s*/, '')
    .replace(/^[\s]*\d+[\.\-\)]\s*/, '')
    .trim();
};

const OPTION_LABELS: Record<string, string> = { A: 'أ', B: 'ب', C: 'ج', D: 'د' };

/* ── أيقونات المشاركة ── */
const WhatsappIcon = () => (
  <svg className="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const TelegramIcon = () => (
  <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.64-.203-.654-.64.136-.953l11.57-4.461c.537-.194 1.006.131.326.889z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg className="w-4 h-4 text-slate-800 dark:text-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const CopyIcon = () => (
  <svg className="w-4 h-4 text-slate-400 dark:text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════════ */

export default function SharedQuestion() {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  /* ── جلب السؤال ── */
  const { data: question, isLoading, isError } = useQuery<Question>({
    queryKey: ['shared-question', questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions').select('*')
        .eq('id', questionId!).eq('status', 'active').single();
      if (error || !data) throw new Error('السؤال غير موجود');
      return data as Question;
    },
    enabled: !!questionId,
    retry: 1,
  });

  /* ── جلب المادة ── */
  const { data: subject } = useQuery({
    queryKey: ['subject-for-shared', question?.subject_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subjects').select('id, name')
        .eq('id', question!.subject_id).single();
      return data;
    },
    enabled: !!question?.subject_id,
  });

  /* ── خيارات السؤال ── */
  const options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[] = question
    ? ([
        { key: 'A' as const, text: cleanOptionText(question.option_a) },
        { key: 'B' as const, text: cleanOptionText(question.option_b) },
        { key: 'C' as const, text: cleanOptionText(question.option_c) },
        { key: 'D' as const, text: cleanOptionText(question.option_d) },
      ] as { key: 'A' | 'B' | 'C' | 'D'; text: string }[]).filter(o => o.text)
    : [];

  /* ── دوال الإجابة ── */
  const handleSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    setAnswered(true);
    setTimeout(() => {
      setShowBanner(true);
      setTimeout(() => setBannerVisible(true), 50);
    }, 900);
  };

  /* ── دوال المشاركة ── */
  const getShareUrl  = () => `${window.location.origin}/question/${questionId}`;
  const getShareText = () =>
    `📚 سؤال من ${subject?.name || 'اختبار قانوني'}\n\n${question?.question_text || ''}\n\nجرب إجابته على منصة الناصر القانونية:\n${getShareUrl()}`;

  const handleShareWhatsapp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, '_blank'); setShowShareMenu(false); };
  const handleShareTelegram = () => { window.open(`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(question?.question_text || '')}`, '_blank'); setShowShareMenu(false); };
  const handleShareTwitter  = () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`, '_blank'); setShowShareMenu(false); };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    setShowShareMenu(false);
  };

  const goToExam = () => navigate(`/exam/${question?.subject_id}`);

  /* ── أنماط الخيارات — مطابقة لـ ExamPage ── */
  const getOptionStyle = (opt: string) => {
    const isSel  = selected === opt;
    const isCorr = question?.correct_option === opt;
    if (!answered) return isSel
      ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]'
      : 'border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-primary/30 hover:bg-white dark:hover:bg-slate-600 hover:scale-[1.005]';
    if (isCorr) return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg';
    if (isSel && !isCorr) return 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 shadow-md';
    return 'border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 opacity-40';
  };

  const getBadgeStyle = (opt: string) => {
    const isSel  = selected === opt;
    const isCorr = question?.correct_option === opt;
    if (!answered) return isSel
      ? 'bg-primary text-white shadow-primary/40 shadow-lg'
      : 'bg-white dark:bg-slate-600 text-slate-500 dark:text-white border border-slate-200 dark:border-slate-500';
    if (isCorr) return 'bg-emerald-500 text-white';
    if (isSel && !isCorr) return 'bg-rose-500 text-white';
    return 'bg-white dark:bg-slate-600 text-slate-300 border border-slate-200 dark:border-slate-500';
  };

  /* ══════════════ Loading ══════════════ */
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  /* ══════════════ Error ══════════════ */
  if (isError || !question) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6" dir="rtl">
      <div className="text-5xl">🔍</div>
      <h1 className="text-xl font-bold text-foreground">السؤال غير موجود</h1>
      <p className="text-muted-foreground text-sm text-center">ربما تم حذف هذا السؤال أو الرابط غير صحيح</p>
      <button onClick={() => navigate('/')} className="mt-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
        الذهاب للرئيسية
      </button>
    </div>
  );

  const isCorrect = answered && selected === question.correct_option;

  /* ══════════════ Render ══════════════ */
  return (
    <MainLayout>
      <div className="min-h-screen" dir="rtl">
        <div className="container max-w-2xl mx-auto px-4 py-6 pb-40">

          {/* شريط التنقل */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              الرئيسية
            </button>
          </div>

          {/* ══ بطاقة السؤال — نفس تصميم ExamPage ══ */}
          <div
            className="rounded-[2rem] p-5 md:p-10 mb-4 bg-white dark:bg-slate-800"
            style={{
              border: '1px solid rgba(99,102,241,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 4px 16px rgba(99,102,241,0.06)',
            }}
          >
            {/* بانر السؤال المحدَّث */}
            {(question as any).report_applied === true && (
              <div
                className="mb-5 relative overflow-hidden rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #431407 0%, #7c2d12 50%, #431407 100%)',
                  border: '1px solid rgba(251,146,60,0.4)',
                  boxShadow: '0 8px 32px rgba(234,88,12,0.25)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #fb923c, #fbbf24, #fb923c, transparent)' }} />
                <div className="relative z-10 flex items-start gap-3 px-4 py-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.4)' }}>
                    <AlertOctagon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1" style={{ background: 'rgba(251,146,60,0.25)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>🔄 محدَّث</span>
                    <p className="text-sm font-black text-orange-200">تنبيه: تم تحديث هذا السؤال مؤخراً</p>
                    <p className="text-[11px] text-orange-300/80 font-bold mt-0.5">تأكد من قراءته بعناية — قد تكون الإجابة قد تغيّرت</p>
                  </div>
                </div>
              </div>
            )}

            {/* رأس البطاقة */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {/* أيقونة المادة */}
              <div
                className="w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-lg shrink-0 relative"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5, #7c3aed)', boxShadow: '0 8px 24px rgba(99,102,241,0.5), 0 0 0 1px rgba(255,255,255,0.15) inset' }}
              >
                <BookOpen className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
              </div>

              {/* شارة المادة والسنة */}
              {subject && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-black tracking-widest">
                  {subject.name}
                  {question.exam_year && ` · ${question.exam_year}`}
                  {(question as any).exam_form === 'Parallel' ? ' · موازي' : (question as any).exam_form === 'General' ? ' · عام' : ''}
                </span>
              )}

              {/* زر المشاركة */}
              <div className="mr-auto relative">
                <button
                  onClick={() => setShowShareMenu(prev => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  style={showShareMenu
                    ? { background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                    : { background: 'linear-gradient(135deg, #f0f4ff, #e8ecff)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 2px 8px rgba(99,102,241,0.1)' }}
                >
                  <Share2 className="w-3.5 h-3.5" /> مشاركة
                </button>

                {showShareMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                      <button onClick={handleShareWhatsapp} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-700 transition-colors text-right">
                        <WhatsappIcon /> واتساب
                      </button>
                      <button onClick={handleShareTelegram} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-blue-50 hover:text-blue-700 transition-colors text-right border-t border-slate-50 dark:border-slate-700">
                        <TelegramIcon /> تيليجرام
                      </button>
                      <button onClick={handleShareTwitter} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-slate-50 hover:text-slate-900 transition-colors text-right border-t border-slate-50 dark:border-slate-700">
                        <TwitterIcon /> تويتر (X)
                      </button>
                      <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-slate-700 dark:text-foreground/90 hover:bg-slate-50 transition-colors text-right border-t border-slate-50 dark:border-slate-700">
                        {copied
                          ? <><Check className="w-4 h-4 text-emerald-500 shrink-0" /><span className="text-emerald-600">تم النسخ!</span></>
                          : <><CopyIcon />نسخ الرابط</>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* نص السؤال */}
            <h2 className="text-base md:text-xl font-black text-slate-800 dark:text-slate-100 mb-7 leading-relaxed text-right">
              {question.question_text}
            </h2>

            {/* ── الخيارات ── */}
            <div className="flex flex-col gap-3">
              {options.map(({ key, text }) => {
                const isCorr = key === question.correct_option;
                const isSel  = selected === key;
                return (
                  <button
                    key={key}
                    disabled={answered}
                    onClick={() => handleSelect(key)}
                    className={cn(
                      'w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all duration-200 text-right',
                      getOptionStyle(key),
                      !answered && 'cursor-pointer active:scale-[0.98]',
                      answered && 'cursor-default'
                    )}
                  >
                    {/* أيقونة النتيجة */}
                    <div className="mr-auto shrink-0 w-5">
                      {answered && isCorr && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {answered && isSel && !isCorr && <XCircle className="w-5 h-5 text-rose-500" />}
                    </div>

                    {/* نص الخيار */}
                    <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                      {text}
                    </span>

                    {/* حرف الخيار */}
                    <span className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors duration-200',
                      getBadgeStyle(key)
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
                'mt-5 rounded-2xl p-4 flex items-center gap-3 border transition-all duration-500',
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
              )}>
                {isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                }
                <div className="flex-1 text-right">
                  <p className={cn(
                    'font-black text-sm',
                    isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    {isCorrect ? '🎉 إجابة صحيحة!' : '❌ إجابة خاطئة'}
                  </p>
                  {!isCorrect && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      الإجابة الصحيحة:{' '}
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {OPTION_LABELS[question.correct_option]} — {cleanOptionText(question[`option_${question.correct_option.toLowerCase()}` as keyof Question] as string)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* تلميح قبل الإجابة */}
            {!answered && (
              <p className="text-center text-xs text-muted-foreground mt-6">
                اختر إجابتك للكشف عن الحل
              </p>
            )}
          </div>
        </div>

        {/* ══ بانر الدعوة للاختبار الكامل ══ */}
        {showBanner && (
          <>
            <div
              className={cn(
                'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300',
                bannerVisible ? 'opacity-100' : 'opacity-0'
              )}
              onClick={goToExam}
            />
            <div className={cn(
              'fixed bottom-0 inset-x-0 z-50 transition-all duration-500 ease-out',
              bannerVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            )}>
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 rounded-t-3xl shadow-2xl overflow-hidden border-t border-slate-700/50">
                <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-400 to-primary opacity-80" />
                <div className="px-5 pt-5 pb-8" dir="rtl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-white font-black text-lg leading-tight">هل أنت مستعد للاختبار الكامل؟</h2>
                      <p className="text-slate-400 text-xs mt-0.5">{subject?.name || 'اختبار قانوني'} · أكثر من 500 سؤال بانتظارك</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { icon: '⏱️', label: 'وقت مرن',        sub: '10-60 دقيقة' },
                      { icon: '📊', label: 'نتائج فورية',    sub: 'مع التحليل'  },
                      { icon: '🔁', label: 'تكرار لا محدود', sub: 'مجاناً'      },
                    ].map(item => (
                      <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                        <div className="text-lg mb-0.5">{item.icon}</div>
                        <div className="text-white text-[10px] font-bold leading-tight">{item.label}</div>
                        <div className="text-slate-400 text-[9px] mt-0.5">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={goToExam}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/30 group"
                  >
                    <Zap className="w-5 h-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                    <span className="text-primary-foreground font-black text-base tracking-wide">ابدأ الاختبار الآن</span>
                    <ArrowLeft className="w-4 h-4 text-primary-foreground/80 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
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
    </MainLayout>
  );
}
