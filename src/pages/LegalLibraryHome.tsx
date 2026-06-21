/**
 * LegalLibraryHome.tsx
 * الصفحة الرئيسية لقسم "المكتبة القانونية" — شبكة الأقسام الجذرية
 * البند 2 من مواصفة Lovable: هيدر كحلي، بطاقتان كاملتا العرض + بطاقتان بعرض نصف،
 * زر بحث شامل ثابت أسفل الشبكة.
 */
import { useState, useEffect, ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Scale, Landmark, FileText, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalSidebarDrawer } from '@/components/legal-library/LegalSidebarDrawer';
import { LegalWelcomeOnboarding, hasSeenLegalOnboarding } from '@/components/legal-library/LegalWelcomeOnboarding';
import { TrialEndedScreen, LimitedUsageModal } from '@/components/legal-library/LegalLimitedAccessModals';
import { useLegalAccessMode } from '@/hooks/useLegalLibrary';

function RootCard({
  icon: Icon, title, subtitle, fullWidth, onClick,
}: {
  icon: ElementType; title: string; subtitle: string; fullWidth?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative rounded-2xl border border-border bg-gradient-to-b from-card to-muted/40 p-6 text-center shadow-card hover:shadow-card-md transition-all duration-200 active:scale-[0.98]',
        fullWidth ? 'col-span-2' : 'col-span-1'
      )}
    >
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center">
        <Icon className="h-10 w-10 text-amber-500" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-black text-[#1a2744] dark:text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}

export default function LegalLibraryHome() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLimitedUsageModal, setShowLimitedUsageModal] = useState(false);
  const { shouldShowTrialEndedScreen, enterLimitedMode, trialDates } = useLegalAccessMode();

  useEffect(() => {
    if (!hasSeenLegalOnboarding()) setShowOnboarding(true);
  }, []);

  return (
    <MainLayout>
      {/* الهيدر الكحلي */}
      <div className="bg-[#1a2744] sticky top-0 z-30">
        <div className="container max-w-5xl flex items-center justify-between py-4">
          <h1 className="text-lg font-black text-white">الرئيـــسية</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="القائمة"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-[#f5f5f5] dark:bg-background min-h-[calc(100vh-64px)] pb-28">
        <div className="container max-w-5xl py-6">
          <div className="grid grid-cols-2 gap-4">
            <RootCard
              icon={Scale}
              title="القوانين اليمنية"
              subtitle="بآخر التعديلات"
              fullWidth
              onClick={() => navigate('/library/laws')}
            />
            <RootCard
              icon={Landmark}
              title="القواعد القضائية"
              subtitle="مبادئ المحكمة العليا"
              fullWidth
              onClick={() => navigate('/library/judicial')}
            />
            <RootCard
              icon={Landmark}
              title="تعليمات النيابة"
              subtitle=""
              onClick={() => navigate('/library/prosecutions')}
            />
            <RootCard
              icon={FileText}
              title="اللوائح"
              subtitle=""
              onClick={() => navigate('/library/regulations')}
            />
          </div>
        </div>
      </div>

      {/* زر البحث الشامل الثابت */}
      <div className="fixed bottom-0 inset-x-0 z-40">
        <div className="container max-w-5xl px-4 pb-4">
          <button
            onClick={() => navigate('/library/search')}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-[#1a2744] text-white font-bold shadow-lg"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>البحث الشامل في جميع الأقسام</span>
          </button>
        </div>
      </div>

      <LegalSidebarDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
