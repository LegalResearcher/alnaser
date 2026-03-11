import { MainLayout } from '@/components/layout/MainLayout';
import { HomeSEO } from '@/components/seo/SEOHead';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { LevelsPreview } from '@/components/home/LevelsPreview';
import { FAQSection } from '@/components/home/FAQSection';
import { ContactSection } from '@/components/home/ContactSection';
import { useAutoPreload } from '@/hooks/useDataPreloader';
import { cn } from '@/lib/utils';

/**
 * مكون الصفحة الرئيسية (Index)
 * يجمع بين التصميم البصري الجذاب والأداء التقني العالي عبر التحميل المسبق.
 */
const Index = () => {
  // تفعيل محرك التحميل المسبق للبيانات في الخلفية لضمان تنقل لحظي للمستخدم
  useAutoPreload();

  return (
    <MainLayout>
      <HomeSEO />
      {/* غلاف عام لإضافة لمسات جمالية خلفية للأقسام المتداخلة */}
      <div className="relative overflow-hidden bg-white dark:bg-card">
        
        {/* Hero Section: المدخل البصري الأول */}
        <div className="relative z-10">
          <HeroSection />
        </div>

        {/* Stats Section: تعزيز المصداقية عبر الأرقام الحية */}
        <div className="relative z-20 -mt-10 md:-mt-16">
          <StatsSection />
        </div>

        {/* مساحة تنفس بصرية (Spacing) */}
        <div className="py-10" />

        {/* Levels Preview: قلب المنصة والخيارات التعليمية */}
        <section className="relative group">
          {/* لمسة فنية جانبية تظهر في الخلفية */}
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          <LevelsPreview />
        </section>

        {/* FAQ Section: الإجابة على استفسارات الباحثين */}
        <section className="bg-slate-50 dark:bg-muted/50 border-y border-slate-100 dark:border-border">
          <FAQSection />
        </section>

        {/* Contact Section: جسر التواصل مع الإدارة */}
        <section className="relative">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <ContactSection />
        </section>

      </div>
    </MainLayout>
  );
};

export default Index;
