/**
 * Alnasser Tech Digital Solutions
 * Component: Header — Version 4.0 (World-Class)
 */

import { Link, useLocation } from 'react-router-dom';
import { X, Download, Smartphone, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.jpg';

const navLinks = [
  { href: '/',           label: 'الرئيسية' },
  { href: '/levels',     label: 'المستويات' },
  { href: '/features',   label: 'المزايا' },
  { href: '/diagnostic', label: 'التشخيص' },
  { href: '/progress',   label: 'تقدمي' },
  { href: '/about',      label: 'عن المنصة' },
  { href: '/#faq',       label: 'الأسئلة الشائعة' },
  { href: '/suggest',   label: '💡 أضف سؤالاً' },
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
          ? "backdrop-blur-2xl border-b border-white/8 shadow-xl shadow-black/25 py-2"
          : isHeroPage
            ? "py-4"
            : "bg-background/95 backdrop-blur-xl border-b border-border/40 py-3"
      )}
      style={isHeroPage ? { backgroundColor: isScrolled ? 'rgba(2,6,23,0.96)' : 'rgb(2,6,23)' } : {}}
    >
      <div
        className="absolute bottom-0 right-0 h-[2px] pointer-events-none transition-all duration-150"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(to left, hsl(217 91% 60%), hsl(199 89% 55%), transparent)',
        }}
      />

      <div className="container mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-14">

          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className={cn(
              "relative overflow-hidden w-10 h-10 rounded-2xl transition-all duration-300 group-hover:scale-105",
              isLightBg
                ? "shadow-md ring-1 ring-border/40 group-hover:ring-primary/30 group-hover:shadow-primary/20"
                : "shadow-lg ring-1 ring-white/20 group-hover:ring-white/40"
            )}>
              <img src={logoImage} alt="شعار منصة الناصر" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-none gap-[3px]">
              <span className={cn("text-[17px] font-black tracking-tight transition-colors duration-300", isLightBg ? "text-foreground" : "text-white")}>
                الباحث <span className="text-primary">القانوني</span>
              </span>
              <span className={cn("text-[8px] font-bold tracking-[0.28em] uppercase transition-colors duration-300", isLightBg ? "text-muted-foreground/50" : "text-white/35")}>
                منصة الناصر
              </span>
            </div>
          </Link>

          <nav className={cn(
            "hidden md:flex items-center p-1.5 rounded-full border backdrop-blur-md transition-all duration-300",
            isLightBg ? "bg-muted/70 border-border/50" : "bg-white/8 border-white/10"
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
                      isLightBg ? "text-muted-foreground hover:text-foreground" : "text-white/60 hover:text-white"
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
                    isActive ? "text-white" : isLightBg ? "text-muted-foreground hover:text-foreground" : "text-white/60 hover:text-white"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-full -z-10" style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }} />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className={isHeroPage ? "[&_button]:bg-white/10 [&_button]:text-white [&_button:hover]:bg-white/20" : ""}>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="فتح القائمة"
              className={cn(
                "md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                isLightBg ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"
              )}
            >
              {isMenuOpen ? (
                <X className="w-[22px] h-[22px]" />
              ) : (
                <span className="flex flex-col gap-[6px] items-end">
                  <span className={cn("block h-[2px] w-[22px] rounded-full", isLightBg ? "bg-foreground" : "bg-white")} />
                  <span className={cn("block h-[2px] w-[14px] rounded-full", isLightBg ? "bg-foreground/50" : "bg-white/50")} />
                </span>
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-2 mb-1 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 animate-in slide-in-from-top-2 fade-in duration-200">
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
                      isActive ? "text-primary bg-primary/6 dark:bg-primary/12" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    {link.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </Link>
                );
              })}
            </div>
            <div className="px-3 pb-3 pt-2 space-y-2 border-t border-slate-100 dark:border-white/6">
              <Link to="/levels" onClick={() => setIsMenuOpen(false)}>
                <Button
                  className="w-full h-11 rounded-xl font-bold text-white text-[15px] active:scale-[0.98] transition-transform"
                  style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}
                >
                  ابدأ الاختبار الآن
                </Button>
              </Link>
              {!isInstalled && (
                <button
                  onClick={() => { handleInstall(); setIsMenuOpen(false); }}
                  disabled={!deferredPrompt || isInstalling}
                  className="w-full h-11 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  {isInstalling ? (
                    <><div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />جاري التثبيت...</>
                  ) : !deferredPrompt ? (
                    <><Smartphone className="w-4 h-4" />افتح القائمة ← تثبيت</>
                  ) : (
                    <><Download className="w-4 h-4" />تحميل التطبيق</>
                  )}
                </button>
              )}
              {isInstalled && (
                <div className="w-full h-11 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/20">
                  <CheckCircle className="w-4 h-4" />
                  التطبيق مثبّت
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
