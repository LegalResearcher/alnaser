/**
 * StatsSection.tsx — أرقام ضخمة، dark موحّد
 * مع الحفاظ على المنطق الأصلي لجلب البيانات من Supabase
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { Users, BookOpen, CheckCircle, Trophy } from 'lucide-react';

/* ── عداد متحرك ── */
function Counter({ target, visible, suffix = '' }: { target: number; visible: boolean; suffix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const dur = 1800, steps = 70;
    let cur = 0;
    const inc = target / steps;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.round(cur));
    }, dur / steps);
  }, [visible, target]);
  return <>{val.toLocaleString('ar-EG')}{suffix}</>;
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  /* جلب الإحصائيات */
  const { data: questionCount = 0 } = useCachedQuery<number>(['stats-questions'], async () => {
    const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'active');
    return count ?? 0;
  });

  const { data: levelCount = 0 } = useCachedQuery<number>(['stats-levels'], async () => {
    const { count } = await supabase.from('levels').select('id', { count: 'exact', head: true });
    return count ?? 0;
  });

  const { data: subjectCount = 0 } = useCachedQuery<number>(['stats-subjects'], async () => {
    const { count } = await supabase.from('subjects').select('id', { count: 'exact', head: true });
    return count ?? 0;
  });

  const { data: examCount = 0 } = useCachedQuery<number>(['stats-exams'], async () => {
    const { count } = await supabase.from('exam_sessions').select('id', { count: 'exact', head: true });
    return count ?? 0;
  });

  const STATS = [
    { icon: BookOpen,    value: questionCount, suffix: '+', label: 'سؤال نشط',       color: 'hsl(217 91% 62%)' },
    { icon: Trophy,      value: levelCount,    suffix: '',  label: 'مستوى دراسي',     color: '#c8a84b' },
    { icon: CheckCircle, value: subjectCount,  suffix: '+', label: 'مادة قانونية',    color: '#34d399' },
    { icon: Users,       value: examCount,     suffix: '+', label: 'اختبار أُجري',    color: '#f472b6' },
  ];

  return (
    <div ref={sectionRef} dir="rtl" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #070d1a 0%, #08111f 100%)', padding: '56px 0 64px' }}>

      {/* خط أعلى */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,168,75,0.18), transparent)', pointerEvents: 'none' }} />

      {/* خلفية شبكة خفيفة */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(200,168,75,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(200,168,75,0.025) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* فاصل رأسي */}
              {i > 0 && (
                <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0', flexShrink: 0 }} />
              )}
              <div
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '28px 24px', textAlign: 'center',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
                }}
              >
                {/* أيقونة */}
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                  <s.icon style={{ width: 20, height: 20, color: s.color }} strokeWidth={1.6} />
                </div>

                {/* الرقم */}
                <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 8, letterSpacing: '-0.02em' }}>
                  <Counter target={s.value} visible={visible} suffix={s.suffix} />
                </div>

                {/* التسمية */}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {s.label}
                </div>

                {/* خط ملوّن */}
                <div style={{ width: 28, height: 2, borderRadius: 2, marginTop: 14, background: s.color, opacity: 0.5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* خط أسفل */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none' }} />
    </div>
  );
}
