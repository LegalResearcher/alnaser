import { MainLayout } from '@/components/layout/MainLayout';
import { HomeSEO } from '@/components/seo/SEOHead';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { LibraryBanner } from '@/components/home/LibraryBanner';
import { LevelsPreview } from '@/components/home/LevelsPreview';
import { FAQSection } from '@/components/home/FAQSection';
import { ContactSection } from '@/components/home/ContactSection';
import { useAutoPreload } from '@/hooks/useDataPreloader';
import { Onboarding, useOnboarding } from '@/components/Onboarding';

const Index = () => {
  useAutoPreload();
  const { show, dismiss } = useOnboarding();

  return (
    <MainLayout>
      <HomeSEO />
      {show && <Onboarding onDone={dismiss} />}

      {/* كل الصفحة على خلفية داكنة موحّدة */}
      <div className="relative overflow-hidden" style={{ background: '#070d1a' }}>
        <div className="relative z-10">
          <HeroSection />
        </div>
        <div className="relative z-20 -mt-10 md:-mt-16">
          <StatsSection />
        </div>
        <LibraryBanner />
        <section className="relative">
          <LevelsPreview />
        </section>
        <FAQSection />
        <ContactSection />
      </div>
    </MainLayout>
  );
};

export default Index;
