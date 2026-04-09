/**
 * Alnasser Tech Digital Solutions
 * Component: HeroSection — World-Class Redesign
 * Version: 3.0
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Scale, ChevronDown, Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// عداد متحرك
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString('ar-EG')}{suffix}
    </span>
  );
}

// جلب إجمالي الزيارات من Supabase (أرشيف + حالية)
function useTotalVisits() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        // الأرشيف من platform_stats
        const { data: savedStats } = await supabase
          .from('platform_stats')
          .select('total_visits')
          .eq('id', 1)
          .single();
        const archivedVisits = (savedStats as any)?.total_visits ?? 0;

        // الزيارات الحالية من site_analytics
        const { count: currentCount } = await supabase
          .from('site_analytics')
          .select('id', { count: 'exact', head: true });

        setTotal(archivedVisits + (currentCount ?? 0));
      } catch {
        setTotal(null);
      }
    };
    fetchVisits();
  }, []);

  return total;
}

// عداد الزيارات البارز
function VisitsCounter() {
  const total = useTotalVisits();
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (total === null || started.current) return;
    started.current = true;
    const duration = 2200;
    const steps = 80;
    const increment = total / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= total) {
        setDisplayed(total);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <div
      className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))',
        border: '1px solid rgba(59,130,246,0.25)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeSlideUp 0.8s 0.15s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* نقطة نابضة */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
      </span>

      <Eye className="w-4 h-4" style={{ color: 'hsl(217 91% 75%)' }} />

      <div className="flex items-baseline gap-1.5" dir="rtl">
        <span
          className="font-cairo font-black tabular-nums"
          style={{
            fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
            background: 'linear-gradient(135deg, #fff 40%, hsl(217 91% 75%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {total === null ? '...' : displayed.toLocaleString('ar-EG')}+
        </span>
        <span
          className="font-bold text-sm"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          زيارة موثّقة
        </span>
      </div>

      {/* فاصل */}
      <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.12)' }} />

      <span
        className="text-[10px] font-black uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        منذ الإطلاق
      </span>
    </div>
  );
}

export function HeroSection() {
  const dotGridRef = useRef<HTMLDivElement>(null);
  const glowTopRef = useRef<HTMLDivElement>(null);
  const [questionsCount, setQuestionsCount] = useState(10000);

  useEffect(() => {
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then(({ count }) => { if (count) setQuestionsCount(count); });
  }, []);

  const STATS = [
    { value: questionsCount, suffix: '+', label: 'سؤال قانوني', sub: 'مراجع ومحدّث' },
    { value: 43,   suffix: '',  label: 'مادة تخصصية', sub: 'في كل فروع القانون' },
    { value: 4,    suffix: '',  label: 'مستويات دراسية', sub: 'من المبتدئ للمحترف' },
    { value: 98,   suffix: '%', label: 'رضا المستخدمين', sub: 'بناءً على التقييمات' },
  ];



  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (dotGridRef.current) {
        dotGridRef.current.style.transform = `translateY(${y * 0.075}px)`;
      }
      if (glowTopRef.current) {
        glowTopRef.current.style.transform = `translateX(-50%) translateY(${y * 0.125}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[100svh] flex flex-col" dir="rtl">

      {/* ═══════════════════════════════════════════
          BACKGROUND LAYERS
      ═══════════════════════════════════════════ */}

      {/* طبقة أساسية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950" />

      {/* نسيج نقطي خفيف */}
      <div
        ref={dotGridRef}
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          willChange: 'transform',
        }}
      />

      {/* توهج أزرق علوي */}
      <div
        ref={glowTopRef}
        className="absolute -top-40 left-1/2 w-[900px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.5) 0%, transparent 70%)',
          transform: 'translateX(-50%)',
          filter: 'blur(60px)',
          willChange: 'transform',
        }}
      />

      {/* توهج أخضر سفلي */}
      <div
        className="absolute bottom-0 -left-20 w-[500px] h-[400px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, hsl(160 84% 39% / 0.6) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* خطوط هندسية خلفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(217 91% 60%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(160 84% 39%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(6)].map((_, i) => (
            <line
              key={i}
              x1={`${-10 + i * 22}%`} y1="0%"
              x2={`${20 + i * 22}%`} y2="100%"
              stroke="url(#lineGrad)"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="container mx-auto px-4 md:px-6 pt-24 pb-12 md:pt-32 md:pb-16 flex-1 flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center">

            {/* BADGE */}
            <div
              className="inline-flex items-center gap-2.5 mb-4 px-5 py-2.5 rounded-full border text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.1))',
                borderColor: 'rgba(59,130,246,0.3)',
                color: 'hsl(217 91% 75%)',
                animation: 'fadeSlideDown 0.7s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <Scale className="w-4 h-4" />
              <span>المنصة الأولى للباحث القانوني في اليمن</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* اسم صاحب المنصة */}
            <div
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-black"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
                animation: 'fadeSlideDown 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <span>✍️</span>
              <span>إعداد وتطوير: </span>
              <span style={{ color: 'hsl(217 91% 75%)', fontWeight: 900 }}>أ. معين الناصر</span>
            </div>

            {/* HEADLINE */}
            <h1
              className="text-center font-cairo leading-[1.15] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
                fontWeight: 900,
                animation: 'fadeSlideUp 0.8s 0.1s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <span className="text-white block mb-1">اختبر معرفتك القانونية</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(135deg, hsl(217 91% 70%), hsl(199 89% 60%), hsl(160 84% 55%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                وطوّر مهاراتك للاحتراف
              </span>
            </h1>

            {/* DESCRIPTION */}
            <VisitsCounter />

            <p
              className="text-center max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'rgba(255,255,255,0.55)',
                animation: 'fadeSlideUp 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              منصة تفاعلية متكاملة تضم أكثر من{' '}
              <span style={{ color: 'hsl(217 91% 75%)', fontWeight: 700 }}>{questionsCount.toLocaleString('ar-EG')}+ سؤال</span>
              {' '}في مختلف مجالات القانون — مصممة لمساعدتك في التحضير للامتحانات والارتقاء بمستواك المهني.
            </p>

            {/* CTA BUTTONS */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              style={{ animation: 'fadeSlideUp 0.8s 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <Link to="/levels">
                <button
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-lg text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))',
                    boxShadow: '0 0 40px rgba(59,130,246,0.4), 0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="relative z-10">ابدأ الاختبار الآن</span>
                  <ArrowLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform duration-200" />
                  {/* shimmer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    }}
                  />
                </button>
              </Link>

              <Link to="/about">
                <button
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.97]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  تعرّف على المنصة
                </button>
              </Link>

              {/* زر تحميل التطبيق */}
              <a
                href="https://yuo/Legal/alnaser-mobile/s/la/download/default.apk"
                download="alnaser.apk"
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm hover:scale-105 active:scale-95 shadow-lg hover:shadow-white/10"
              >
                {/* توهج خلفي */}
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* أيقونة أندرويد */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-400 shrink-0 relative z-10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.523 15.341a.673.673 0 0 1-.672.672.673.673 0 0 1-.673-.672V10.16a.673.673 0 0 1 .673-.672.673.673 0 0 1 .672.672v5.181zm-10.37 0a.673.673 0 0 1-.672.672.673.673 0 0 1-.673-.672V10.16a.673.673 0 0 1 .673-.672.673.673 0 0 1 .672.672v5.181zM8.818 2.146l-.96-1.664a.2.2 0 0 0-.274-.073.2.2 0 0 0-.073.274l.977 1.692A6.14 6.14 0 0 0 5.9 5.6h12.2a6.14 6.14 0 0 0-2.588-3.225l.977-1.692a.2.2 0 0 0-.073-.274.2.2 0 0 0-.274.073l-.96 1.664A6.08 6.08 0 0 0 12 1.6a6.08 6.08 0 0 0-3.182.546zM10.4 4a.6.6 0 1 1-1.2 0 .6.6 0 0 1 1.2 0zm4.4 0a.6.6 0 1 1-1.2 0 .6.6 0 0 1 1.2 0zM5.9 6.8v10.4c0 .88.72 1.6 1.6 1.6h.8v2.527a.873.873 0 0 0 .873.873.873.873 0 0 0 .873-.873V18.8h1.908v2.527a.873.873 0 0 0 .873.873.873.873 0 0 0 .873-.873V18.8h.8c.88 0 1.6-.72 1.6-1.6V6.8H5.9z"/>
                </svg>

                <span className="relative z-10 flex flex-col items-start">
                  <span className="text-[10px] text-white/60 font-medium leading-none mb-0.5">حمّل التطبيق مجاناً</span>
                  <span className="text-sm font-black leading-none">Android APK</span>
                </span>

                {/* سهم تحميل */}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-white/60 stroke-2 relative z-10 group-hover:translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>



          </div>
        </div>

        {/* ═══════════════════════════════════════════
            STATS BAR — الجزء الأهم بصرياً
        ═══════════════════════════════════════════ */}
        <div
          className="relative border-t"
          style={{
            borderColor: 'rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 max-w-4xl mx-auto">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center text-center py-2 ${i < STATS.length - 1 ? 'md:border-l md:border-white/10' : ''}`}
                >
                  <div
                    className="font-cairo font-black leading-none mb-1"
                    style={{
                      fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                      background: 'linear-gradient(135deg, hsl(217 91% 75%), hsl(160 84% 60%))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="font-bold text-sm text-white/80">{stat.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 pointer-events-none hidden md:flex">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase">اكتشف</span>
          <ChevronDown className="w-4 h-4 text-white animate-bounce" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CSS ANIMATIONS
      ═══════════════════════════════════════════ */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
