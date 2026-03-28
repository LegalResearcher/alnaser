import { MainLayout } from '@/components/layout/MainLayout';
import { HomeSEO } from '@/components/seo/SEOHead';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
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

      {/* Onboarding — يظهر للمستخدم الجديد فقط */}
      {show && <Onboarding onDone={dismiss} />}

      <div className="relative overflow-hidden bg-white dark:bg-card">
        <div className="relative z-10">
          <HeroSection />
        </div>
        <div className="relative z-20 -mt-10 md:-mt-16">
          <StatsSection />
        </div>
        <div className="py-10" />
        <section className="relative group">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <LevelsPreview />
        </section>
        <section className="bg-slate-50 dark:bg-muted/50 border-y border-slate-100 dark:border-border">
          <FAQSection />
        </section>
        <section className="relative">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <ContactSection />
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
