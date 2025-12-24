import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { LevelsPreview } from '@/components/home/LevelsPreview';
import { FAQSection } from '@/components/home/FAQSection';
import { ContactSection } from '@/components/home/ContactSection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
      <LevelsPreview />
      <FAQSection />
      <ContactSection />
    </MainLayout>
  );
};

export default Index;
