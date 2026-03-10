/**
 * Alnasser Tech Digital Solutions
 * Component: HeroSection — World-Class Redesign
 * Version: 3.0
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Award, CheckCircle, Scale, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

const STATS = [
  { value: 5000, suffix: '+', label: 'سؤال قانوني', sub: 'مراجع ومحدّث' },
  { value: 43,   suffix: '',  label: 'مادة تخصصية', sub: 'في كل فروع القانون' },
  { value: 4,    suffix: '',  label: 'مستويات دراسية', sub: 'من المبتدئ للمحترف' },
  { value: 98,   suffix: '%', label: 'رضا المستخدمين', sub: 'بناءً على التقييمات' },
];

const FEATURES = [
  { icon: BookOpen,    label: '+5000 سؤال',   sublabel: 'متنوع ومحدث' },
  { icon: Users,       label: '4 مستويات',     sublabel: 'تدريجية' },
  { icon: Award,       label: '43 مادة',        sublabel: 'قانونية' },
  { icon: CheckCircle, label: 'نتائج فورية',   sublabel: 'مع التصحيح' },
];

export function HeroSection() {
  const dotGridRef = useRef<HTMLDivElement>(null);
  const glowTopRef = useRef<HTMLDivElement>(null);

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
            <p
              className="text-center max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'rgba(255,255,255,0.55)',
                animation: 'fadeSlideUp 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              منصة تفاعلية متكاملة تضم أكثر من{' '}
              <span style={{ color: 'hsl(217 91% 75%)', fontWeight: 700 }}>5000 سؤال</span>
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
            </div>

            {/* FEATURE CARDS */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mb-8"
              style={{ animation: 'fadeSlideUp 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              {FEATURES.map((item, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center text-center p-4 md:p-5 rounded-2xl transition-all duration-300 hover:scale-[1.03] cursor-default"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)',
                    animationDelay: `${0.4 + i * 0.07}s`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(16,185,129,0.15))',
                      border: '1px solid rgba(59,130,246,0.3)',
                    }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: 'hsl(217 91% 75%)' }} />
                  </div>
                  <p className="font-black text-white text-sm md:text-base">{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.sublabel}</p>
                </div>
              ))}
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
