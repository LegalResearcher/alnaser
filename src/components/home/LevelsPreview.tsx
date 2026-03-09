/**
 * Alnasser Tech Digital Solutions
 * Component: LevelsPreview — Version 3.0 (World-Class)
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, ChevronLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';
import { useCachedQuery } from '@/hooks/useCachedQuery';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG = [
  {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    glow:     'rgba(59,130,246,0.3)',
    bg:       'rgba(59,130,246,0.06)',
    border:   'rgba(59,130,246,0.2)',
    label:    'المستوى الأول',
    tag:      '.',
  },
  {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow:     'rgba(16,185,129,0.3)',
    bg:       'rgba(16,185,129,0.06)',
    border:   'rgba(16,185,129,0.2)',
    label:    'المستوى الثاني',
    tag:      '.',
  },
  {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    glow:     'rgba(245,158,11,0.3)',
    bg:       'rgba(245,158,11,0.06)',
    border:   'rgba(245,158,11,0.2)',
    label:    'المستوى الثالث',
    tag:      '.',
  },
  {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    glow:     'rgba(239,68,68,0.3)',
    bg:       'rgba(239,68,68,0.06)',
    border:   'rgba(239,68,68,0.2)',
    label:    'المستوى الرابع',
    tag:      '.',
  },
];

export function LevelsPreview() {
  const { data: levels = [] } = useCachedQuery<Level[]>(
    ['levels'],
    async () => {
      const { data, error } = await supabase.from('levels').select('*').order('order_index');
      if (error) throw error;
      return data as Level[];
    }
  );

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background" id="levels">

      {/* خلفية نقطية */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      {/* توهجات خلفية */}
      <div className="absolute top-1/3 -right-32 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.06), transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-1/3 -left-32 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)', filter: 'blur(60px)' }} />

      <div className="container mx-auto px-4 md:px-6 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-black uppercase tracking-widest"
            style={{
              background: 'hsl(var(--primary)/0.1)',
              border: '1px solid hsl(var(--primary)/0.2)',
              color: 'hsl(var(--primary))',
            }}>
            <GraduationCap className="w-3.5 h-3.5" />
            مسار التعلم الذكي
          </div>
          <h2 className="font-cairo font-black text-foreground tracking-tight leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
            استكشف{' '}
            <span style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(199 89% 50%))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              المستويات الدراسية
            </span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            كل مستوى مصمم بعناية ليأخذك من الأساسيات إلى الاحتراف القانوني عبر منهجية اختبارات عالمية.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-14">
          {levels.map((level, i) => {
            const cfg = LEVEL_CONFIG[i] || LEVEL_CONFIG[0];
            return (
              <Link
                key={level.id}
                to={`/levels/${level.id}`}
                className="group relative block"
                style={{ animation: `fadeSlideUp 0.65s ${i * 0.08}s cubic-bezier(0.16,1,0.3,1) both` }}
              >
                <div
                  className="relative h-full flex flex-col rounded-3xl border overflow-hidden transition-all duration-500 group-hover:-translate-y-2"
                  style={{
                    background: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = cfg.border;
                    el.style.boxShadow = `0 16px 60px ${cfg.glow}`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'hsl(var(--border))';
                    el.style.boxShadow = 'none';
                  }}
                >
                  {/* Header الملوّن */}
                  <div className="relative h-44 overflow-hidden" style={{ background: cfg.gradient }}>

                    {/* نسيج داخلي */}
                    <div className="absolute inset-0 opacity-[0.15]"
                      style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                      }} />

                    {/* رقم المستوى */}
                    <div className="absolute top-5 right-5 w-14 h-14 flex items-center justify-center">
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500" />
                      <span className="relative font-cairo font-black text-3xl text-white drop-shadow-md">{i + 1}</span>
                    </div>

                    {/* شارة المستوى */}
                    <div className="absolute bottom-4 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider"
                      style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {cfg.tag}
                    </div>

                    {/* توهج داخلي عند hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent)' }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-6">
                    <div className="mb-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{cfg.label}</span>
                    </div>
                    <h3 className="font-black text-lg text-foreground mb-2 transition-colors duration-300 group-hover:text-primary">
                      {level.name}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-5 flex-1">
                      {level.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/60">
                      <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>
                        <BookOpen className="w-4 h-4" />
                        عرض المواد
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:text-white group-hover:scale-110"
                        style={{ background: cfg.bg }}
                        onMouseEnter={() => {}}
                      >
                        <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/levels">
            <button
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'hsl(var(--foreground))',
                color: 'hsl(var(--background))',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px hsl(var(--primary)/0.3)';
                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--primary))';
                (e.currentTarget as HTMLElement).style.color = 'white';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground))';
                (e.currentTarget as HTMLElement).style.color = 'hsl(var(--background))';
              }}
            >
              تصفح كافة الأقسام
              <ArrowLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
