/**
 * Alnasser Tech Digital Solutions
 * Component: Header — Version 5.0 (100% Exact Visual Clone)
 */

import { Link, useLocation } from 'react-router-dom';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const navLinks = [
  { href: '/',                   label: 'الرئيسية' },
  { href: '/levels',             label: 'المستويات' },
  { href: '/library',            label: '📚 المكتبة' },
  { href: '/features',           label: 'المزايا' },
  { href: '/diagnostic',         label: 'التشخيص' },
  { href: '/progress',           label: 'تقدمي' },
  { href: '/honor-certificate',  label: '🏅 لوحة الشرف' },
  { href: '/about',              label: 'عن المنصة' },
  { href: '/#faq',               label: 'الأسئلة الشائعة' },
  { href: '/suggest',            label: '💡 أضف سؤالاً' },
  { href: 'https://t.me/MuenAlnaser', label: 'تواصل معنا', external: true },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isScrolled, setIsScrolled]         = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 30);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min((y / docH) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled]       = useState(false);
  const [isInstalling, setIsInstalling]     = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); setDeferredPrompt(null); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const isHeroPage = location.pathname === '/';
  const isLightBg  = !isHeroPage;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "backdrop-blur-2xl border-b border-white/5 shadow-xl shadow-black/40 py-2"
          : isHeroPage
            ? "py-4"
            : "bg-background/95 backdrop-blur-xl border-b border-border/40 py-3"
      )}
      style={isHeroPage ? { backgroundColor: isScrolled ? 'rgba(2, 6, 23, 0.98)' : '#020617' } : {}}
    >
      {/* خط تقدم القراءة السفلي البسيط */}
      <div
        className="absolute bottom-0 right-0 h-[1.5px] pointer-events-none transition-all duration-150"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(to left, #CDA052, transparent)',
        }}
      />

      <div className="container mx-auto px-4 md:px-8">
        {/* الترتيب والاتجاه متوافق 100% مع الصورة (الشعار يمين، الأزرار يسار) */}
        <div className="flex items-center justify-between h-14" dir="rtl">

          {/* قسم الشعار النصي والأيقونة المدمجة */}
          <Link to="/" className="flex items-center gap-3 group shrink-0 select-none">
            {/* النصوص بمحاذاة وإدخال لوني مطابق للصورة */}
            <div className="flex flex-col text-right leading-tight">
              <span className={cn(
                "text-[16px] md:text-[19px] font-black tracking-tight transition-colors duration-300 font-sans", 
                isLightBg ? "text-slate-900" : "text-white"
              )}>
                منصة الناصر <span className="text-[#CDA052] font-black">القانونية</span>
              </span>
              <span className={cn(
                "text-[8px] md:text-[9.5px] font-bold tracking-[0.06em] transition-colors duration-300 font-sans", 
                isLightBg ? "text-slate-500" : "text-white opacity-90"
              )}>
                AL-NASSER LEGAL PLATFORM
              </span>
            </div>

            {/* الأيقونة الرسومية الشعار (الدرع والميزان الملكي) */}
            <div className="relative flex items-center justify-center w-11 h-11 transition-transform duration-300 group-hover:scale-[1.03]">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* الخلفية الدائرية المعتمة للشعار */}
                <circle cx="50" cy="50" r="44" fill="#030a21" stroke="#CDA052" strokeWidth="1" opacity="0.4" />
                
                {/* مجسم الدرع الخارجي المستوحى من اللوجو المرفق */}
                <path 
                  d="M50 14 L82 25 C82 60, 68 82, 50 90 C32 82, 18 60, 18 25 Z" 
                  fill="none" 
                  stroke="#CDA052" 
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                
                {/* تفاصيل الميزان بدقة */}
                <g stroke="#CDA052" strokeWidth="2.5" strokeLinecap="round" fill="none">
                  {/* قاعدة وعمود الوسط */}
                  <line x1="50" y1="32" x2="50" y2="76" />
                  <line x1="40" y1="76" x2="60" y2="76" strokeWidth="3.5" />
                  
                  {/* ذراع الميزان العرضي */}
                  <line x1="30" y1="44" x2="70" y2="44" strokeWidth="3" />
                  
                  {/* كفة الميزان اليمنى وسلاسلها */}
                  <line x1="30" y1="44" x2="24" y2="58" strokeWidth="1.2" />
                  <line x1="30" y1="44" x2="36" y2="58" strokeWidth="1.2" />
                  <path d="M22 58 Q30 65 38 58 Z" fill="#CDA052" />

                  {/* كفة الميزان اليسرى وسلاسلها */}
                  <line x1="70" y1="44" x2="64" y2="58" strokeWidth="1.2" />
                  <line x1="70" y1="44" x2="76" y2="58" strokeWidth="1.2" />
                  <path d="M62 58 Q70 65 78 58 Z" fill="#CDA052" />
                </g>
              </svg>
            </div>
          </Link>

          {/* روابط النافبار العادية للشاشات الكبيرة */}
          <nav className={cn(
            "hidden md:flex items-center p-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
            isLightBg ? "bg-muted/70 border-border/50" : "bg-white/5 border-white/10"
          )}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              if ((link as any).external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                      isLightBg ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
                    )}
                  >
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                    isActive ? "text-white" : isLightBg ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full -z-10" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }} />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* الجانب الأيسر (أيقونة القائمة وزر المظهر المتطابقين تماماً مع الصورة) */}
          <div className="flex items-center gap-2">
            {/* زر التغيير بين المظهر الليلي والنهاري (الاستايل الدائري الشفاف في لقطة الشاشة) */}
            <div className={cn(
              "rounded-full p-1 transition-colors duration-200",
              isHeroPage ? "bg-white/5 hover:bg-white/10 text-white" : ""
            )}>
              <ThemeToggle />
            </div>
            
            {/* زر الـ Hamburger المطابق تماماً للشرطتين بالصورة من حيث الطول والمحاذاة */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="القائمة الحركية"
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95",
                isLightBg ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/5"
              )}
            >
              {isMenuOpen ? (
                <X className="w-[22px] h-[22px]" />
              ) : (
                <div className="flex flex-col gap-[5.5px] items-start w-[22px]">
                  {/* شرطة علوية طويلة */}
                  <span className={cn("block h-[2px] w-full rounded-full transition-all", isLightBg ? "bg-slate-900" : "bg-white")} />
                  {/* شرطة سفلية أقصر من جهة اليمين تماماً كالصورة */}
                  <span className={cn("block h-[2px] w-[14px] rounded-full transition-all", isLightBg ? "bg-slate-900/70" : "bg-white/80")} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* القائمة المنسدلة على الهواتف الذكية */}
        {isMenuOpen && (
          <nav className="md:hidden mt-3 mb-1 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 shadow-2xl shadow-black/40 animate-in slide-in-from-top-2 duration-200" dir="rtl">
            <div className="p-2 pb-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                if ((link as any).external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-150 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-150",
                      isActive ? "text-[#CDA052] bg-[#CDA052]/10" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    {link.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#CDA052]" />}
                  </Link>
                );
              })}
            </div>
            
            <div className="px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-white/5">
              <a
                href="https://t.me/muen2025"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full h-11 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] hover:bg-[#229ED9]/20 transition-all active:scale-[0.98]"
              >
                قناة منصة الناصر القانونية
              </a>
              <Link to="/levels" onClick={() => setIsMenuOpen(false)}>
                <Button
                  className="w-full h-11 rounded-xl font-bold text-white text-[15px] bg-gradient-to-r from-blue-700 to-blue-500 hover:opacity-95 transition-all"
                >
                  ابدأ الاختبار الآن
                </Button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
