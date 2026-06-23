/**
 * LibraryBanner.tsx — Hero لا يمكن تجاهله
 * تصميم عالمي: شاشة كاملة، typography ضخمة، particles ذهبية، beam متحرك
 */

import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, Scale, FileText, Gavel, BookMarked, Search } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

/* ══════════════════════════════════════════════
   PARTICLES CANVAS — جسيمات ذهبية عائمة
══════════════════════════════════════════════ */
function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      alphaDir: number;
    }

    const COUNT = 55;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.1,
      alphaDir: Math.random() > 0.5 ? 1 : -1,
    }));

    let animId: number;
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir * 0.004;
        if (p.alpha > 0.6 || p.alpha < 0.05) p.alphaDir *= -1;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(200,168,75,${p.alpha})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}

/* ══════════════════════════════════════════════
   ANIMATED COUNTER — عداد بالأرقام العربية
══════════════════════════════════════════════ */
const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabic(n: number) {
  return String(Math.round(n)).split('').map(c => AR[+c] ?? c).join('');
}

function Counter({ target, visible }: { target: number; visible: boolean }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const dur = 1600, steps = 60;
    let cur = 0;
    const inc = target / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(cur);
    }, dur / steps);
  }, [visible, target]);
  return <span>{toArabic(val)}</span>;
}

/* ══════════════════════════════════════════════
   MAIN BANNER
══════════════════════════════════════════════ */
const STATS = [
  { target: 272,  label: 'قانون ووثيقة',      color: '#c8a84b' },
  { target: 1997, label: 'قاعدة قضائية',       color: '#6ee7b7' },
  { target: 5,    label: 'دوائر المحكمة العليا', color: '#93c5fd' },
];

const TAGS = [
  { icon: Scale,       label: 'قوانين ولوائح'  },
  { icon: Gavel,       label: 'قواعد قضائية'   },
  { icon: FileText,    label: 'تعليمات النيابة' },
  { icon: BookMarked,  label: 'تشريعات رسمية'  },
];

export function LibraryBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [beamX, setBeamX] = useState(50); // % موضع الـ beam

  /* intersection */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /* beam يتحرك تلقائياً */
  useEffect(() => {
    let dir = 1, pos = 50;
    const id = setInterval(() => {
      pos += dir * 0.18;
      if (pos > 80 || pos < 20) dir *= -1;
      setBeamX(pos);
    }, 30);
    return () => clearInterval(id);
  }, []);

  /* parallax خفيف على الماوس */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    const inner = sectionRef.current?.querySelector<HTMLElement>('.lib-inner');
    if (inner) inner.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const inner = sectionRef.current?.querySelector<HTMLElement>('.lib-inner');
    if (inner) inner.style.transform = 'translate(0,0)';
  }, []);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className="relative overflow-hidden"
      style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', background: '#070d1a' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >

      {/* ── خلفية: شبكة هندسية دقيقة ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(200,168,75,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,168,75,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '72px 72px',
      }} />

      {/* ── Beam ذهبي متحرك ── */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${beamX}%`,
          width: 1,
          background: 'linear-gradient(180deg, transparent 0%, rgba(200,168,75,0.25) 30%, rgba(200,168,75,0.5) 50%, rgba(200,168,75,0.25) 70%, transparent 100%)',
          filter: 'blur(1px)',
          transition: 'left 0.08s linear',
        }}
      />

      {/* ── Particles ── */}
      <ParticlesCanvas />

      {/* ── توهج مركزي ضخم ── */}
      <div className="absolute pointer-events-none" style={{
        top: '40%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 900, height: 500,
        background: 'radial-gradient(ellipse, rgba(200,168,75,0.07) 0%, rgba(99,130,200,0.04) 40%, transparent 70%)',
        filter: 'blur(60px)',
      }} />

      {/* ── خط ذهبي علوي ── */}
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(200,168,75,0.0) 15%, rgba(200,168,75,0.7) 40%, rgba(251,191,36,1) 50%, rgba(200,168,75,0.7) 60%, rgba(200,168,75,0.0) 85%, transparent 100%)',
      }} />

      {/* ══════════ المحتوى ══════════ */}
      <div
        className="lib-inner relative z-10 w-full"
        style={{ transition: 'transform 0.15s ease-out', padding: '80px 24px 100px' }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* ── EYEBROW ── */}
          <div
            className="flex justify-center mb-8"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.6s ease 0s',
            }}
          >
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full"
              style={{
                background: 'rgba(200,168,75,0.08)',
                border: '1px solid rgba(200,168,75,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a84b', animation: 'lib-pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#c8a84b', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Al-Naser Legal Platform
              </span>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a84b', animation: 'lib-pulse 2s infinite 1s' }} />
            </div>
          </div>

          {/* ── HEADLINE ضخمة ── */}
          <div
            className="text-center mb-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
            }}
          >
            <h2 style={{
              fontSize: 'clamp(3.2rem, 10vw, 7.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.93)',
              margin: 0,
            }}>
              المكتبة
            </h2>
            <h2 style={{
              fontSize: 'clamp(3.2rem, 10vw, 7.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: 0,
              background: 'linear-gradient(135deg, #a07830 0%, #c8a84b 30%, #f0d080 55%, #c8a84b 75%, #a07830 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'lib-shine 4s linear infinite',
            }}>
              القانونية
            </h2>
          </div>

          {/* ── Subheading ── */}
          <p
            className="text-center"
            style={{
              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
              color: 'rgba(255,255,255,0.38)',
              lineHeight: 1.9,
              maxWidth: 520,
              margin: '0 auto 48px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.7s ease 0.2s',
            }}
          >
            مرجعك القانوني الشامل — تشريعات يمنية رسمية، قرارات المحكمة العليا،
            وتعليمات النيابة في متناول يدك.
          </p>

          {/* ── STATS ROW ── */}
          <div
            className="flex justify-center gap-0 mb-14"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.6s ease 0.3s',
            }}
          >
            {STATS.map((s, i) => (
              <div key={i} className="flex items-stretch">
                {/* فاصل رأسي */}
                {i > 0 && (
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                )}
                <div
                  className="text-center px-8 py-4"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `all 0.6s ease ${0.35 + i * 0.12}s`,
                  }}
                >
                  <div style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.01em' }}>
                    <Counter target={s.target} visible={visible} />
                    <span style={{ fontSize: '0.45em', opacity: 0.6 }}>+</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 6, fontWeight: 600, letterSpacing: '0.06em' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── CTA BUTTONS ── */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.7s ease 0.5s',
            }}
          >
            {/* زر رئيسي */}
            <Link to="/library">
              <button
                className="group relative flex items-center gap-3 rounded-2xl overflow-hidden"
                style={{
                  padding: '16px 36px',
                  background: 'linear-gradient(135deg, #c8a84b 0%, #a07830 100%)',
                  color: '#07100f',
                  fontSize: 15,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  boxShadow: '0 0 0 1px rgba(200,168,75,0.3), 0 8px 32px rgba(200,168,75,0.3), 0 2px 0 rgba(255,255,255,0.12) inset',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    boxShadow: '0 0 0 1px rgba(200,168,75,0.5), 0 12px 48px rgba(200,168,75,0.5), 0 2px 0 rgba(255,255,255,0.12) inset',
                    transform: 'translateY(-2px)',
                  });
                }}
                onMouseLeave={e => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    boxShadow: '0 0 0 1px rgba(200,168,75,0.3), 0 8px 32px rgba(200,168,75,0.3), 0 2px 0 rgba(255,255,255,0.12) inset',
                    transform: 'translateY(0)',
                  });
                }}
              >
                {/* shimmer */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                    transform: 'translateX(-100%)',
                    animation: 'lib-shimmer 3s ease-in-out infinite',
                  }}
                />
                <BookOpen style={{ width: 18, height: 18 }} className="relative z-10 flex-shrink-0" />
                <span className="relative z-10">استعرض المكتبة</span>
                <ArrowLeft style={{ width: 16, height: 16 }} className="relative z-10 group-hover:-translate-x-1 transition-transform duration-200 flex-shrink-0" />
              </button>
            </Link>

            {/* زر بحث */}
            <Link to="/library/search">
              <button
                className="flex items-center gap-2.5 rounded-2xl"
                style={{
                  padding: '16px 28px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: 700,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(200,168,75,0.3)',
                    color: 'rgba(255,255,255,0.85)',
                  });
                }}
                onMouseLeave={e => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                  });
                }}
              >
                <Search style={{ width: 15, height: 15 }} />
                بحث في المكتبة
              </button>
            </Link>
          </div>

          {/* ── FEATURE TAGS ── */}
          <div
            className="flex flex-wrap justify-center gap-2"
            style={{
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.6s ease 0.65s',
            }}
          >
            {TAGS.map(({ icon: Icon, label }, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.5s ease ${0.7 + i * 0.08}s`,
                }}
              >
                <Icon style={{ width: 12, height: 12, color: '#c8a84b', flexShrink: 0 }} strokeWidth={1.8} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── خط سفلي ── */}
      <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(200,168,75,0.15) 30%, rgba(200,168,75,0.4) 50%, rgba(200,168,75,0.15) 70%, transparent 100%)',
      }} />

      {/* ── تأشير scroll ── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ opacity: visible ? 0.4 : 0, transition: 'opacity 1s ease 1.2s' }}
      >
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>scroll</span>
        <div style={{
          width: 20, height: 32, border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 4,
        }}>
          <div style={{
            width: 3, height: 7, borderRadius: 2,
            background: 'rgba(200,168,75,0.7)',
            animation: 'lib-scroll 1.8s ease infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes lib-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @keyframes lib-shine {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lib-shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
        @keyframes lib-scroll {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(14px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
