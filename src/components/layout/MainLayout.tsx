import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { pathname } = useLocation();

  // إظهار الفوتر فقط في الصفحة الرئيسية
  const showFooter = pathname === '/';

  // التأكد من صعود الصفحة للأعلى عند تغيير المسار (UX احترافي)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col relative bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      
      {/* عناصر الخلفية الفنية (Ambient Background) - تعطي طابعاً عالمياً */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* توهج علوي خفيف */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
        
        {/* أشكال هندسية باهتة جداً لإعطاء عمق */}
        <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      {/* الهيدر المطور */}
      <Header />

      {/* منطقة المحتوى الرئيسي مع أنيميشن دخول ناعم */}
      <main className="flex-1 w-full flex flex-col animate-in fade-in duration-700 ease-out">
        <div className="w-full mx-auto">
          {children}
        </div>
      </main>

      {/* الفوتر - يظهر فقط في الصفحة الرئيسية */}
      {showFooter && <Footer />}
    </div>
  );
}
