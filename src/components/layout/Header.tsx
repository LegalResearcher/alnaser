/**
 * Alnasser Tech Digital Solutions
 * Component: Header — Version 7.0 (100% Exact Shield-Right Text-Left Match)
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
      <div
        className="absolute bottom-0 right-0 h-[1.5px] pointer-events-none transition-all duration-150"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(to left, #e2cb99, transparent)',
        }}
      />

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-14" dir="rtl">

          {/* الهوية البصرية: الشعار (الكرة والدرع) يمين، والنص يسار كما في الصورة حرفياً */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0 select-none">
            
            {/* 1. الأيقونة الرسومية المتقدمة (الآن مستقرة في جهة اليمين تماماً) */}
            <div className="relative flex items-center justify-center w-12 h-12 transition-transform duration-300 group-hover:scale-[1.03]">
              <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_4px_12px_rgba(226,203,153,0.15)]">
                <defs>
                  <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f5e6c4" />
                    <stop offset="30%" stopColor="#d1b47b" />
                    <stop offset="70%" stopColor="#b09358" />
                    <stop offset="100%" stopColor="#e2cb99" />
                  </linearGradient>
                  <linearGradient id="shield-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0b0f19" />
                  </linearGradient>
                </defs>

                {/* هيكل الدرع ثلاثي الأبعاد */}
                <path 
                  d="M60 12 L98 28 C98 68, 82 94, 60 106 C38 94, 22 68, 22 28 Z" 
                  fill="url(#shield-shadow)" 
                  stroke="url(#gold-metallic)" 
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <path 
                  d="M60 20 L90 32 C90 64, 76 87, 60 97 C44 87, 30 64, 30 32 Z" 
                  fill="#030712" 
                  stroke="url(#gold-metallic)" 
                  strokeWidth="1.5" 
                  opacity="0.85"
                />

                {/* شبكة الكرة الأرضية الدائرية الخلفية للميزان */}
                <g stroke="url(#gold-metallic)" strokeWidth="1.2" fill="none" opacity="0.65">
                  <circle cx="60" cy="56" r="26" strokeWidth="2" />
                  <path d="M34 56 L86 56" />
                  <path d="M60 30 L60 82" />
                  <path d="M37.5 43 Q60 52 82.5 43" />
                  <path d="M37.5 69 Q60 60 82.5 69" />
                  <path d="M47 33 Q56 56 47 79" />
                  <path d="M73 33 Q64 56 73 79" />
                </g>

                {/* ميزان العدالة والسيف المعدني */}
                <g stroke="url(#gold-metallic)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="60" y1="32" x2="60" y2="80" strokeWidth="3.5" />
                  <line x1="50" y1="80" x2="70" y2="80" strokeWidth="4" />
                  <path d="M36 46 Q60 41 84 46" strokeWidth="3.5" />
                  <line x1="36" y1="46" x2="29" y2="64" strokeWidth="1.2" />
                  <line x1="36" y1="46" x2="43" y2="64" strokeWidth="1.2" />
                  <path d="M26 64 L46 64 L36 72 Z" fill="url(#gold-metallic)" strokeWidth="1" />
                  <line x1="84" y1="46" x2="77" y2="64" strokeWidth="1.2" />
                  <line x1="84" y1="46" x2="91" y2="64" strokeWidth="1.2" />
                  <path d="M74 64 L94 64 L84 72 Z" fill="url(#gold-metallic)" strokeWidth="1" />
                </g>
              </svg>
            </div>

            {/* 2. النصوص الجانبية (مستقرة على جهة اليسار ومحاذاتها لليمين باتجاه الشعار) */}
            <div className="flex flex-col text-right leading-[1.25]">
              <span className={cn(
                "text-[17px] md:text-[20px] font-black tracking-tight font-sans transition-colors duration-300", 
                isLightBg ? "text-slate-900" : "text-white"
              )}>
                منصة الناصر القانونية
              </span>
              <span className={cn(
                "text-[8px] md:text-[9.5px] font-bold tracking-[0.05em] font-sans transition-colors duration-300", 
                isLightBg ? "text-amber-700/90" : "text-[#e2cb99]"
              )}>
                AL-NASSER LEGAL PLATFORM
              </span>
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

          {/* الأزرار الجانبية اليسرى (أيقونة القائمة والـ Theme) */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "rounded-full p-1 transition-colors duration-200",
              isHeroPage ? "bg-white/5 hover:bg-white/10 text-white" : ""
            )}>
              <ThemeToggle />
            </div>
            
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
                <div className="flex flex-col gap-[5px] items-start w-[22px]">
                  <span className={cn("block h-[2px] w-full rounded-full transition-all", isLightBg ? "bg-slate-900" : "bg-white")} />
                  <span className={cn("block h-[2px] w-[14px] rounded-full transition-all", isLightBg ? "bg-slate-900/70" : "bg-white/80")} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* قائمة المحمول المنسدلة */}
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
                      isActive ? "text-[#e2cb99] bg-[#e2cb99]/10" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    {link.label}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#e2cb99]" />}
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
