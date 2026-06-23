/**
 * LegalLibraryHome.tsx — تصميم احترافي عالمي
 * Dark hero header + بطاقات بيضاء مع accent ذهبي + typography راقية
 */
import { useState, useEffect, ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  BookMarked, Gavel, FolderOpen, FileStack, Search, AlignJustify, ChevronLeft,
  Heart, Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalSidebarDrawer } from '@/components/legal-library/LegalSidebarDrawer';
import { LegalWelcomeOnboarding, hasSeenLegalOnboarding } from '@/components/legal-library/LegalWelcomeOnboarding';
import { TrialEndedScreen, LimitedUsageModal } from '@/components/legal-library/LegalLimitedAccessModals';
import { useLegalAccessMode } from '@/hooks/useLegalLibrary';
import { LegalAboutModal } from '@/components/legal-library/LegalAboutModal';

/* ─── بيانات الأقسام ─── */
interface Section {
  icon: ElementType;
  title: string;
  subtitle: string;
  tag: string;
  route: string;
  iconColor: string;
  badgeColor: string;
}

const SECTIONS: Section[] = [
  {
    icon: BookMarked,
    title: 'القوانين اليمنية',
    subtitle: 'القوانين والتشريعات بآخر التعديلات الرسمية',
    tag: 'تشريعات',
    route: '/library/laws',
    iconColor: '#c8a84b',
    badgeColor: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Gavel,
    title: 'القواعد القضائية',
    subtitle: 'مبادئ وأحكام المحكمة العليا',
    tag: 'قضاء',
    route: '/library/judicial',
    iconColor: '#6366f1',
    badgeColor: 'bg-indigo-50 text-indigo-700',
  },
  {
    icon: FolderOpen,
    title: 'تعليمات النيابة',
    subtitle: 'الملفات والتعليمات الجزائية',
    tag: 'نيابة',
    route: '/library/prosecutions',
    iconColor: '#0ea5e9',
    badgeColor: 'bg-sky-50 text-sky-700',
  },
  {
    icon: FileStack,
    title: 'اللوائح والأنظمة',
    subtitle: 'اللوائح التنفيذية والتشريعية المعمول بها',
    tag: 'لوائح',
    route: '/library/regulations',
    iconColor: '#10b981',
    badgeColor: 'bg-emerald-50 text-emerald-700',
  },
];

/* ─── بطاقة القسم ─── */
function SectionCard({ section, index }: { section: Section; index: number }) {
  const navigate = useNavigate();
  const Icon = section.icon;

  return (
    <button
      onClick={() => navigate(section.route)}
      className="w-full group flex items-center gap-4 bg-white rounded-2xl p-4 text-right active:scale-[0.985] transition-transform duration-150"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* أيقونة مع حلقة دائرية */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl"
        style={{ background: `${section.iconColor}12` }}
      >
        <Icon
          className="w-7 h-7"
          style={{ color: section.iconColor }}
          strokeWidth={1.6}
        />
      </div>

      {/* النص */}
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-2 justify-end mb-1">
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight">{section.title}</h3>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', section.badgeColor)}>
            {section.tag}
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">{section.subtitle}</p>
      </div>

      {/* سهم */}
      <ChevronLeft
        className="flex-shrink-0 w-4 h-4 text-gray-300 group-active:text-gray-500 transition-colors"
        strokeWidth={2.5}
      />
    </button>
  );
}

/* ─── الصفحة الرئيسية ─── */
export default function LegalLibraryHome() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLimitedUsageModal, setShowLimitedUsageModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const { shouldShowTrialEndedScreen, enterLimitedMode, trialDates } = useLegalAccessMode();

  useEffect(() => {
    if (!hasSeenLegalOnboarding()) setShowOnboarding(true);
  }, []);

  return (
    <MainLayout>

      {/* ══════════ HERO HEADER ══════════ */}
      <div
        className="sticky top-0 z-30 pt-5 pb-6 px-5"
        style={{
          background: 'linear-gradient(160deg, #0f1923 0%, #162032 60%, #1a2a40 100%)',
        }}
      >
        {/* الصف الأعلى */}
        <div className="flex items-center justify-between mb-5">
          {/* العنوان */}
          <div>
            <p className="text-[11px] font-medium text-gray-400 tracking-widest uppercase mb-0.5">
              Al-Naser Platform
            </p>
            <h1 className="text-xl font-black text-white leading-tight">
              المكتبة القانونية
            </h1>
          </div>

          {/* أزرار الهيدر الثلاثة */}
          <div className="flex items-center gap-2">

            {/* زر المفضلة */}
            <button
              onClick={() => navigate('/library/favorites')}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 active:bg-white/15 transition-colors"
              style={{ background: 'rgba(200,168,75,0.12)' }}
              aria-label="المفضلة"
            >
              <Heart className="w-4.5 h-4.5" style={{ color: '#c8a84b' }} strokeWidth={1.8} />
            </button>

            {/* زر حول */}
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 active:bg-white/15 transition-colors"
              style={{ background: 'rgba(99,149,255,0.12)' }}
              aria-label="حول المكتبة"
            >
              <Info className="w-4.5 h-4.5 text-sky-400" strokeWidth={1.8} />
            </button>

            {/* زر القائمة */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/8 border border-white/10 text-white active:bg-white/15 transition-colors"
              aria-label="القائمة"
            >
              <AlignJustify className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* شريط إحصائي صغير */}
        <div
          className="flex items-center justify-around rounded-2xl py-3"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {[
            { value: '٢٧٢', label: 'قانون ووثيقة' },
            { value: '١٩٩٧', label: 'قاعدة قضائية' },
            { value: '٥', label: 'دوائر قضائية' },
          ].map((stat, i) => (
            <div key={i} className="text-center px-2">
              <p className="text-[17px] font-black text-[#c8a84b] leading-tight">{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ المحتوى ══════════ */}
      <div className="bg-[#f4f6f9] dark:bg-background min-h-[calc(100vh-180px)] pb-28">

        {/* عنوان الأقسام */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">
            الأقسام
          </span>
          <div className="h-px flex-1 mx-3 bg-gray-200" />
        </div>

        {/* البطاقات */}
        <div className="px-4 flex flex-col gap-3">
          {SECTIONS.map((section, i) => (
            <SectionCard key={section.route} section={section} index={i} />
          ))}
        </div>

        {/* فاصل */}
        <div className="mx-4 mt-5 mb-1 h-px bg-gray-200" />

        {/* hint صغير */}
        <p className="text-center text-[11px] text-gray-400 py-2">
          جميع المحتويات مُحدَّثة وفق آخر الإصدارات الرسمية
        </p>
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

      <LegalSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <LegalAboutModal
        open={showAbout}
        onClose={() => setShowAbout(false)}
        sectionLabel="وثائق وقوانين المكتبة القانونية"
      />

      {showOnboarding && (
        <LegalWelcomeOnboarding onDone={() => setShowOnboarding(false)} />
      )}

      {!showOnboarding && shouldShowTrialEndedScreen && !showLimitedUsageModal && (
        <TrialEndedScreen
          trialDates={trialDates}
          onGoSubscribe={() => navigate('/library/subscription')}
          onContinueLimited={() => setShowLimitedUsageModal(true)}
        />
      )}

      {showLimitedUsageModal && (
        <LimitedUsageModal
          onEnter={() => { enterLimitedMode(); setShowLimitedUsageModal(false); }}
        />
      )}
    </MainLayout>
  );
}
