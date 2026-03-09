/**
 * Alnasser Tech Digital Solutions
 * Component: StatsSection — Version 3.0 (World-Class)
 */

import { BookOpen, Users, Award, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { useEffect, useRef, useState } from 'react';

interface Stats {
  questionsCount: number;
  subjectsCount:  number;
  examsCount:     number;
  passRate:       number;
}

// عداد متحرك مع IntersectionObserver
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal]      = useState(0);
  const ref                = useRef<HTMLSpanElement>(null);
  const started            = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const steps = 55;
      const dur   = 1600;
      let curr    = 0;
      const inc   = target / steps;
      const t     = setInterval(() => {
        curr += inc;
        if (curr >= target) { setVal(target); clearInterval(t); }
        else setVal(Math.floor(curr));
      }, dur / steps);
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString('ar-EG')}{suffix}</span>;
}

export function StatsSection() {
  const { data: stats } = useCachedQuery<Stats>(
    ['site-stats'],
    async () => {
      const [qRes, sRes, eRes] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('exam_results').select('id, passed', { count: 'exact' }),
      ]);
      const examsData  = eRes.data || [];
      const examsCount = eRes.count || 0;
      const passed     = examsData.filter(e => e.passed).length;
      return {
        questionsCount: qRes.count  || 0,
        subjectsCount:  sRes.count  || 0,
        examsCount,
        passRate: examsCount > 0 ? Math.round((passed / examsCount) * 100) : 85,
      };
    }
  );

  const items = [
    { icon: BookOpen, value: stats?.questionsCount ?? 5000, suffix: '+', label: 'سؤال قانوني',   sub: 'مراجع ومحدَّث باستمرار',    color: 'from-blue-500 to-indigo-500',   glow: 'rgba(59,130,246,0.35)' },
    { icon: Users,    value: stats?.examsCount      ?? 500,  suffix: '+', label: 'باحث ومختبر',   sub: 'سجّلوا نتائجهم على المنصة', color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.35)' },
    { icon: Award,    value: stats?.subjectsCount   ?? 43,   suffix: '',  label: 'مادة تعليمية', sub: 'في كل فروع القانون',          color: 'from-emerald-500 to-teal-500',  glow: 'rgba(16,185,129,0.35)' },
    { icon: Target,   value: stats?.passRate        ?? 85,   suffix: '%', label: 'نسبة النجاح',  sub: 'بناءً على نتائج المنصة',    color: 'from-orange-500 to-amber-500',  glow: 'rgba(249,115,22,0.35)' },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'linear-gradient(180deg, #050d1f 0%, #080f20 50%, #060c1a 100%)' }}>

      {/* نسيج نقطي */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* توهج مركزي */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center mb-14 md:mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-[10px] font-black uppercase tracking-[0.25em]"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'hsl(217 91% 75%)' }}>
            <TrendingUp className="w-3 h-3" />
            إحصائيات المنصة الحية
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="font-cairo font-black text-white leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            نحن ننمو{' '}
            <span style={{
              background: 'linear-gradient(135deg, hsl(217 91% 70%), hsl(160 84% 55%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              بثقتكم
            </span>
            {' '}كل يوم
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="group relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 cursor-default"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                animation: `fadeSlideUp 0.7s ${i * 0.1}s cubic-bezier(0.16,1,0.3,1) both`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px ${item.glow}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* أيقونة */}
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                style={{ boxShadow: `0 8px 32px ${item.glow}` }}>
                <item.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>

              {/* رقم */}
              <div className="font-cairo font-black leading-none mb-1.5 tabular-nums"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  background: 'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.6))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                <Counter target={item.value} suffix={item.suffix} />
              </div>

              <p className="font-bold text-sm md:text-base text-white/80 mb-1">{item.label}</p>
              <p className="text-[10px] md:text-xs text-white/35 leading-relaxed">{item.sub}</p>

              {/* خط تزييني */}
              <div className={`mt-4 h-0.5 w-0 group-hover:w-12 rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
