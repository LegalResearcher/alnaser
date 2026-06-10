/**
 * LibraryBanner.tsx — بطاقة المكتبة القانونية البارزة
 * منصة الناصر القانونية
 */

import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Scale, FileText, Gavel, BookMarked, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const FEATURES = [
  { icon: Scale,       label: 'قوانين ولوائح' },
  { icon: Gavel,       label: 'قواعد قضائية' },
  { icon: FileText,    label: 'صيغ ونماذج'   },
  { icon: BookMarked,  label: 'أبحاث ودراسات' },
];

export function LibraryBanner() {
  const ref   = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-16 md:py-24"
      style={{ background: 'linear-gradient(180deg, #060c1a 0%, #050d1f 100%)' }}
    >
      {/* ── خلفية نقطية ── */}
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── توهج ذهبي خلفي ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 68%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl">

        {/* ── البطاقة الرئيسية ── */}
        <div
          className="relative rounded-3xl overflow-hidden transition-all duration-700"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(59,130,246,0.08) 50%, rgba(16,185,129,0.06) 100%)',
            border: '1.5px solid rgba(245,158,11,0.30)',
            boxShadow: '0 0 60px rgba(245,158,11,0.12), 0 0 120px rgba(59,130,246,0.08)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
          }}
        >

          {/* ── شريط أمبر علوي ── */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.8), rgba(251,191,36,1), rgba(245,158,11,0.8), transparent)' }}
          />

          {/* ── بريق متحرك (shimmer) ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(245,158,11,0.05) 50%, transparent 65%)',
              animation: 'libShimmer 5s ease-in-out infinite',
            }}
          />

          {/* ── أيقونة ضخمة خلفية ── */}
          <BookOpen
            className="absolute -left-6 -bottom-6 opacity-[0.04] pointer-events-none"
            style={{ width: 200, height: 200, color: '#f59e0b' }}
          />

          {/* ── المحتوى ── */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">

            {/* أيقونة المكتبة */}
            <div className="shrink-0">
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.20), rgba(251,191,36,0.12))',
                  border: '1.5px solid rgba(245,158,11,0.35)',
                  boxShadow: '0 0 32px rgba(245,158,11,0.20)',
                }}
              >
                <BookOpen className="w-10 h-10 md:w-12 md:h-12" style={{ color: '#fbbf24' }} />
              </div>
            </div>

            {/* النص والأزرار */}
            <div className="flex-1 text-center md:text-right">

              {/* badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-[11px] font-black uppercase tracking-[0.2em]"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.30)',
                  color: '#fbbf24',
                }}
              >
                <Sparkles className="w-3 h-3" />
                جديد على المنصة
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>

              {/* العنوان */}
              <h2
                className="font-cairo font-black text-white leading-tight mb-3"
                style={{ fontSize: 'clamp(1.7rem, 4vw, 2.8rem)' }}
              >
                المكتبة{' '}
                <span
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fcd34d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  القانونية
                </span>
              </h2>

              {/* الوصف */}
              <p
                className="leading-relaxed mb-7 max-w-xl mx-auto md:mx-0"
                style={{
                  fontSize: 'clamp(0.92rem, 1.8vw, 1.05rem)',
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                مرجعك القانوني الشامل — قوانين، قرارات قضائية، صيغ عقود ونماذج رسمية، وأبحاث متخصصة في متناول يدك.
              </p>

              {/* مميزات صغيرة */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2.5 mb-8">
                {FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* زر CTA */}
              <Link to="/library">
                <button
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base overflow-hidden transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: '0 0 40px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.35)',
                    color: '#000',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 0 60px rgba(245,158,11,0.65), 0 8px 30px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 0 40px rgba(245,158,11,0.45), 0 4px 20px rgba(0,0,0,0.35)';
                  }}
                >
                  {/* shimmer على الزر */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                    }}
                  />
                  <BookOpen className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">استعرض المكتبة</span>
                  <ArrowLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform duration-200" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes libShimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}
