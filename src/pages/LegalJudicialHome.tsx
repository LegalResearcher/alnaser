/**
 * LegalJudicialHome.tsx
 * شبكة دوائر القواعد القضائية (البند 6 من المواصفة)
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ChevronRight, BookOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJudicialCircuits } from '@/hooks/useLegalLibrary';

// ألوان مميزة لكل دائرة — مطابقة للقطات الشاشة المرجعية
const CIRCUIT_COLORS: Record<string, string> = {
  'الإدارية': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'الادارية': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'الدستورية': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  'التجارية': 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  'الشخصية': 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  'الجزائية': 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
  'المدنية': 'text-slate-500 bg-slate-100 dark:bg-slate-800/60',
};

// ترتيب العرض الثابت كما في لقطات الشاشة
const DISPLAY_ORDER = ['الإدارية', 'الدستورية', 'التجارية', 'الشخصية', 'الجزائية', 'المدنية'];

export default function LegalJudicialHome() {
  const navigate = useNavigate();
  const { data: circuitCounts = {}, isLoading } = useJudicialCircuits();

  // نعرض فقط الدوائر التي لها عدد فعلي > 0 (لا نخترع دوائر بلا بيانات حقيقية)
  const circuits = DISPLAY_ORDER.filter(c => (circuitCounts[c] ?? 0) > 0);

  return (
    <MainLayout>
      <div className="bg-[#c8e6c9] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1)} className="text-[#1a2744] p-1 -m-1">
            <ChevronRight className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-[#1a2744]">القواعد القضائية</h1>
        </div>
      </div>

      <div className="container max-w-5xl py-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {circuits.map((circuit) => {
              const colorClass = CIRCUIT_COLORS[circuit] || 'text-slate-500 bg-slate-100';
              const count = circuitCounts[circuit] ?? 0;
              return (
                <button
                  key={circuit}
                  onClick={() => navigate(`/library/judicial/${encodeURIComponent(circuit)}`)}
                  className="bg-white dark:bg-card rounded-2xl border border-border p-5 text-center shadow-card hover:shadow-card-md transition-all"
                >
                  <div className={cn('mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center', colorClass)}>
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-black text-foreground">القواعد القضائية {circuit}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{count} قاعدة</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30">
        <div className="container max-w-5xl px-4 pb-4">
          <button
            onClick={() => navigate('/library/search')}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-700 text-white font-bold shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span>البحث الشامل</span>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
