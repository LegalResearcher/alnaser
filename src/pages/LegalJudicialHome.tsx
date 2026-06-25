/**
 * LegalJudicialHome.tsx — تصميم احترافي عالمي
 * Dark header متسق مع LegalLibraryHome + بطاقات دوائر بتصميم premium
 */
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LibraryJudicialSEO } from '@/components/seo/SEOHead';
import { ChevronLeft, ChevronRight, Search, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJudicialCircuits } from '@/hooks/useLegalLibrary';

/* ─── إعداد الدوائر ─── */
interface CircuitConfig {
  label: string;         // الاسم المعروض
  dbKey: string;         // المفتاح في قاعدة البيانات
  accent: string;        // لون الـ accent (hex)
  icon: string;          // إيموجي قانوني
  description: string;   // وصف مختصر
}

const CIRCUITS: CircuitConfig[] = [
  {
    label: 'الدائرة الإدارية',
    dbKey: 'الإدارية',
    accent: '#3b82f6',
    icon: '⚖️',
    description: 'القرارات والطعون الإدارية',
  },
  {
    label: 'الدائرة الدستورية',
    dbKey: 'الدستورية',
    accent: '#10b981',
    icon: '📜',
    description: 'المسائل الدستورية والتفسير',
  },
  {
    label: 'الدائرة التجارية',
    dbKey: 'التجارية',
    accent: '#0ea5e9',
    icon: '🏛️',
    description: 'النزاعات والعقود التجارية',
  },
  {
    label: 'الدائرة الشخصية',
    dbKey: 'الشخصية',
    accent: '#f59e0b',
    icon: '👨‍⚖️',
    description: 'الأحوال الشخصية والأسرة',
  },
  {
    label: 'الدائرة الجزائية',
    dbKey: 'الجزائية',
    accent: '#ef4444',
    icon: '🔨',
    description: 'القضايا الجنائية والعقوبات',
  },
  {
    label: 'الدائرة المدنية',
    dbKey: 'المدنية',
    accent: '#8b5cf6',
    icon: '📋',
    description: 'الحقوق والالتزامات المدنية',
  },
];

/* ─── بطاقة الدائرة ─── */
function CircuitCard({
  config,
  count,
  onPress,
}: {
  config: CircuitConfig;
  count: number;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex flex-col bg-white rounded-2xl text-right active:scale-[0.97] transition-transform duration-150 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.07)' }}
    >
      {/* شريط لوني علوي */}
      <div className="h-1 w-full" style={{ background: config.accent }} />

      <div className="p-4 flex flex-col flex-1">
        {/* أيقونة + badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl text-xl"
            style={{ background: `${config.accent}14` }}
          >
            {config.icon}
          </div>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${config.accent}14`, color: config.accent }}
          >
            {count} قاعدة
          </span>
        </div>

        {/* الاسم والوصف */}
        <h3 className="text-[13px] font-black text-gray-900 leading-tight mb-1">
          {config.label}
        </h3>
        <p className="text-[11px] text-gray-400 leading-relaxed flex-1">
          {config.description}
        </p>

        {/* سهم سفلي */}
        <div className="flex items-center justify-end mt-3">
          <ChevronLeft className="w-4 h-4 text-gray-300" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

/* ─── Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="h-1 bg-gray-200 animate-pulse" />
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse" />
          <div className="w-16 h-5 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
      </div>
    </div>
  );
}

/* ─── الصفحة ─── */
export default function LegalJudicialHome() {
  const navigate = useNavigate();
  const { data: circuitCounts = {}, isLoading } = useJudicialCircuits();

  const activeCircuits = CIRCUITS.filter(c => (circuitCounts[c.dbKey] ?? 0) > 0);
  const totalRules = Object.values(circuitCounts).reduce((a, b) => a + b, 0);

  return (
    <MainLayout>
      <LibraryJudicialSEO />

      {/* ══════════ HERO HEADER ══════════ */}
      <div
        className="sticky top-0 z-30 pt-5 pb-6 px-5"
        style={{
          background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)',
        }}
      >
        {/* زر رجوع + العنوان */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/10 text-white active:bg-white/15 transition-colors flex-shrink-0"
            aria-label="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
              Judicial Rules
            </p>
            <h1 className="text-[17px] font-black text-white leading-tight">
              القواعد القضائية
            </h1>
          </div>
          <Scale className="w-6 h-6 text-[#c8a84b] opacity-70" strokeWidth={1.5} />
        </div>

        {/* إحصائية إجمالية */}
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <p className="text-[10px] text-gray-400">إجمالي القواعد</p>
            <p className="text-2xl font-black text-[#c8a84b] leading-tight">
              {isLoading ? '...' : totalRules.toLocaleString('ar-EG')}
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-400">عدد الدوائر</p>
            <p className="text-2xl font-black text-white leading-tight">
              {isLoading ? '...' : activeCircuits.length}
            </p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] text-gray-400">المصدر</p>
            <p className="text-[13px] font-bold text-emerald-400 leading-tight">المحكمة<br />العليا</p>
          </div>
        </div>
      </div>

      {/* ══════════ المحتوى ══════════ */}
      <div className="bg-[#f4f6f9] dark:bg-background min-h-[calc(100vh-200px)] pb-28">

        {/* عنوان القسم */}
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
            الدوائر القضائية
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* الشبكة */}
        <div className="px-4 grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : activeCircuits.map(config => (
                <CircuitCard
                  key={config.dbKey}
                  config={config}
                  count={circuitCounts[config.dbKey] ?? 0}
                  onPress={() => navigate(`/library/judicial/${encodeURIComponent(config.dbKey)}`)}
                />
              ))
          }
        </div>

        {/* ملاحظة سفلية */}
        {!isLoading && (
          <>
            <div className="mx-4 mt-5 mb-1 h-px bg-gray-200" />
            <p className="text-center text-[11px] text-gray-400 py-2">
              مبادئ المحكمة العليا — مُحدَّثة بصفة دورية
            </p>
          </>
        )}
      </div>

      {/* ══════════ زر البحث الثابت ══════════ */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-[#f4f6f9] via-[#f4f6f9]/95 to-transparent pt-4 pb-4 px-4">
        <button
          onClick={() => navigate('/library/search')}
          className="w-full flex items-center gap-3 rounded-2xl px-5 active:scale-[0.98] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #0f1923 0%, #1a2a40 100%)',
            height: '54px',
            boxShadow: '0 4px 20px rgba(15,25,35,0.35)',
          }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(200,168,75,0.18)' }}
          >
            <Search className="w-4 h-4 text-[#c8a84b]" />
          </div>
          <span className="flex-1 text-right text-[14px] font-bold text-white">
            البحث الشامل في جميع الأقسام
          </span>
          <ChevronLeft className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2.5} />
        </button>
      </div>

    </MainLayout>
  );
}
