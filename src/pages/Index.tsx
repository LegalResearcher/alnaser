import { MainLayout } from '@/components/layout/MainLayout';
import { useEffect, useState } from 'react';
import { HomeSEO } from '@/components/seo/SEOHead';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { LibraryBanner } from '@/components/home/LibraryBanner';
import { TelegramBotBanner } from '@/components/home/TelegramBotBanner';
import { LevelsPreview } from '@/components/home/LevelsPreview';
import { FAQSection } from '@/components/home/FAQSection';
import { ContactSection } from '@/components/home/ContactSection';
import { useAutoPreload } from '@/hooks/useDataPreloader';
import { Onboarding, useOnboarding } from '@/components/Onboarding';

const TELEGRAM_PLATFORM_VISIT_ENDPOINT = 'https://moilegbot-cd9jlnvj.manus.space/api/telegram/platform-visit';

type TelegramMiniApp = { initData?: string; ready: () => void };
type TelegramWindow = Window & { Telegram?: { WebApp?: TelegramMiniApp } };

const Index = () => {
  useAutoPreload();
  const [telegramVisitStatus, setTelegramVisitStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');

  useEffect(() => {
    const webApp = (window as TelegramWindow).Telegram?.WebApp;
    if (!webApp?.initData) return;
    webApp.ready();
    setTelegramVisitStatus('checking');
    fetch(TELEGRAM_PLATFORM_VISIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: webApp.initData }),
    })
      .then(response => {
        if (!response.ok) throw new Error('verification-failed');
        setTelegramVisitStatus('verified');
      })
      .catch(() => setTelegramVisitStatus('failed'));
  }, []);
  const { show, dismiss } = useOnboarding();

  return (
    <MainLayout>
      <HomeSEO />
      {telegramVisitStatus !== 'idle' && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-primary/20 bg-white/95 px-4 py-3 text-center text-sm font-bold text-slate-800 shadow-xl backdrop-blur dark:bg-slate-900/95 dark:text-white" role="status">
          {telegramVisitStatus === 'checking' && 'جارٍ توثيق زيارتك لمنصة الناصر…'}
          {telegramVisitStatus === 'verified' && 'تم توثيق زيارتك لمنصة الناصر بنجاح.'}
          {telegramVisitStatus === 'failed' && 'تعذر توثيق الزيارة حاليًا. افتح المنصة من زر التحقق داخل البوت وحاول مرة أخرى.'}
        </div>
      )}
      {show && <Onboarding onDone={dismiss} />}

      {/* كل الصفحة على خلفية داكنة موحّدة */}
      <div className="relative overflow-hidden" style={{ background: '#070d1a' }}>
        <div className="relative z-10">
          <HeroSection />
        </div>
        <div className="relative z-20 -mt-10 md:-mt-16">
          <StatsSection />
        </div>
        <TelegramBotBanner />
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
