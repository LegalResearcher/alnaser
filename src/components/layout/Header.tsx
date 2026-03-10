/**
 * Alnasser Tech Digital Solutions
 * Component: Header — Version 3.0 (World-Class)
 */

import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowLeft, Scale } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.jpg';

const navLinks = [
  { href: '/',           label: 'الرئيسية' },
  { href: '/levels',     label: 'المستويات' },
  { href: '/diagnostic', label: 'التشخيص' },
  { href: '/progress',   label: 'تقدمي' },
  { href: '/about',      label: 'عن المنصة' },
  { href: '/#faq',       label: 'الأسئلة الشائعة' },
  { href: '/#contact',   label: 'تواصل معنا' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 20);

      // شريط تقدم القراءة
      const docH   = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min((y / docH) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const isHeroPage = location.pathname === '/';

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500",
      isScrolled
        ? "bg-background/90 backdrop-blur-2xl border-b border-border/60 shadow-sm py-2"
        : isHeroPage
          ? "bg-slate-950/60 backdrop-blur-sm py-4"
          : "bg-background/95 backdrop-blur-xl border-b border-border/40 py-3"
    )}>

      {/* شريط تقدم القراءة */}
      <div
        className="absolute bottom-0 right-0 h-[2px] bg-gradient-to-l from-primary via-blue-400 to-transparent transition-all duration-150 pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative overflow-hidden w-10 h-10 md:w-11 md:h-11 rounded-xl shadow-md group-hover:shadow-primary/30 group-hover:shadow-lg transition-all duration-500 ring-1 ring-border/50 group-hover:ring-primary/30">
              <img
                src={logoImage}
                alt="شعار منصة الناصر — الباحث القانوني المتخصص"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className={cn(
                "text-base md:text-lg font-black tracking-tight transition-colors duration-300",
                isHeroPage && !isScrolled ? "text-white" : "text-foreground"
              )}>
                الباحث <span className="text-primary">القانوني</span>
              </span>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5 transition-colors duration-300",
                isHeroPage && !isScrolled ? "text-white/50" : "text-muted-foreground/70"
              )}>
                Legal Researcher
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className={cn(
            "hidden md:flex items-center p-1 rounded-full border backdrop-blur-sm transition-all duration-300",
            isHeroPage && !isScrolled
              ? "bg-white/8 border-white/15"
              : "bg-muted/60 border-border/60"
          )}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative px-5 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : isHeroPage && !isScrolled
                        ? "text-white/70 hover:text-white"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/25 animate-in fade-in zoom-in-90 duration-200" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Actions ── */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link to="/levels" className="hidden sm:block">
              <button className={cn(
                "group relative flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]",
              )}
              style={{
                background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              }}>
                <span className="relative z-10">ابدأ رحلتك</span>
                <ArrowLeft className="w-4 h-4 relative z-10 rotate-180 group-hover:-translate-x-0.5 transition-transform duration-200" />
                {/* shimmer on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }} />
              </button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                isHeroPage && !isScrolled
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {isMenuOpen && (
          <nav className="md:hidden mt-3 p-3 rounded-3xl border border-border bg-background/98 backdrop-blur-2xl shadow-2xl shadow-black/10 animate-in slide-in-from-top-3 fade-in duration-250">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border-r-[3px] border-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 mt-1 border-t border-border">
                <Link to="/levels" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                    style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }}>
                    ابدأ الاختبار الآن
                  </Button>
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
