/**
 * Alnasser Tech Digital Solutions
 * Component: Onboarding — شاشة الترحيب والجولة السريعة
 * يظهر للمستخدم الجديد مرة واحدة فقط
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowLeft, ArrowRight, BookOpen, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'alnaseer_onboarding_done';

const steps = [
  {
    icon: <BookOpen className="w-10 h-10" />,
    emoji: '⚖️',
    color: 'from-blue-600 to-blue-800',
    accentColor: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-600',
    title: 'مرحباً بك في منصة الناصر',
    subtitle: 'للتحضير القانوني الاحترافي',
    description: 'أكبر بنك أسئلة قانوني في اليمن — أكثر من 10,000 سؤال معتمد لجميع مستويات كلية الحقوق.',
    badge: 'منصة رقم 1',
  },
  {
    icon: <Target className="w-10 h-10" />,
    emoji: '🎯',
    color: 'from-violet-600 to-violet-800',
    accentColor: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-600',
    title: 'اختر مستواك وابدأ',
    subtitle: '4 مستويات دراسية كاملة',
    description: 'من السنة الأولى حتى الرابعة — اختر مستواك ثم المادة التي تريد الاختبار فيها بأسئلة حقيقية من الاختبارات السابقة.',
    badge: '43 مادة',
  },
  {
    icon: <TrendingUp className="w-10 h-10" />,
    emoji: '📊',
    color: 'from-emerald-600 to-emerald-800',
    accentColor: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-600',
    title: 'راجع أخطاءك وتطور',
    subtitle: 'نظام تتبع ذكي',
    description: 'بعد كل اختبار تظهر نتيجتك التفصيلية. المنصة تحفظ الأسئلة التي أخطأت فيها لتراجعها لاحقاً وتتحسن باستمرار.',
    badge: 'مجاناً 100%',
  },
  {
    icon: <Zap className="w-10 h-10" />,
    emoji: '🚀',
    color: 'from-amber-500 to-orange-600',
    accentColor: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-600',
    title: 'جاهز للنجاح؟',
    subtitle: 'ابدأ الآن بدون تسجيل',
    description: 'لا تحتاج حساباً للبدء. فقط أدخل اسمك واختر مادتك وابدأ الاختبار فوراً. بسيط وسريع وفعّال.',
    badge: 'ابدأ الآن',
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export const Onboarding = ({ onDone }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const navigate = useNavigate();

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const goTo = (nextStep: number, dir: 'next' | 'prev') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      goTo(step + 1, 'next');
    }
  };

  const handlePrev = () => {
    if (step > 0) goTo(step - 1, 'prev');
  };

  const handleFinish = () => {
    setExiting(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setTimeout(() => {
      onDone();
      navigate('/levels');
    }, 400);
  };

  const handleSkip = () => {
    setExiting(true);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setTimeout(() => onDone(), 400);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'transition-all duration-400',
        exiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      )}
      dir="rtl"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">

        {/* Gradient Header */}
        <div className={cn('relative bg-gradient-to-br h-64 flex flex-col items-center justify-center overflow-hidden', current.color)}>
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-white/20 blur-2xl rounded-full" />

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step badge */}
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/15 text-white text-[10px] font-black tracking-widest uppercase">
            {step + 1} / {steps.length}
          </div>

          {/* Emoji + Icon */}
          <div
            className={cn(
              'relative z-10 flex flex-col items-center gap-3 transition-all duration-300',
              animating
                ? direction === 'next' ? '-translate-x-8 opacity-0' : 'translate-x-8 opacity-0'
                : 'translate-x-0 opacity-100'
            )}
          >
            <div className="text-6xl leading-none select-none">{current.emoji}</div>
            <div className="px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-black tracking-wider">
              {current.badge}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-7 py-6 space-y-4">
          <div
            className={cn(
              'transition-all duration-300',
              animating
                ? direction === 'next' ? 'translate-x-4 opacity-0' : '-translate-x-4 opacity-0'
                : 'translate-x-0 opacity-100'
            )}
          >
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{current.subtitle}</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-snug">{current.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">{current.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 py-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > step ? 'next' : 'prev')}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === step
                    ? cn('w-6 h-2', current.accentColor)
                    : 'w-2 h-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <Button
              onClick={handleNext}
              className={cn(
                'flex-1 h-12 rounded-2xl font-black text-white text-sm gap-2 shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0',
                `bg-gradient-to-l ${current.color} hover:opacity-90 shadow-slate-900/20`
              )}
            >
              {isLast ? (
                <>ابدأ رحلتك الآن <span className="text-base">🚀</span></>
              ) : (
                <>التالي <ArrowLeft className="w-4 h-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Hook للتحقق هل يجب إظهار الـ Onboarding */
export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // تأخير بسيط ليظهر بعد تحميل الصفحة
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => setShow(false);

  return { show, dismiss };
}
