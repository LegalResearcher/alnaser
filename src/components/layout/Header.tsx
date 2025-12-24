import { Link, useLocation } from 'react-router-dom';
import { Scale, Menu, X, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/levels', label: 'المستويات' },
  { href: '/#faq', label: 'الأسئلة الشائعة' },
  { href: '/#contact', label: 'تواصل معنا' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // تتبع التمرير لإضافة تأثيرات عند نزول الصفحة
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 ease-in-out w-full",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b shadow-sm py-2" 
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo Section - تصميم أيقونة أكثر عمقاً */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative overflow-hidden w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-primary/25 group-hover:shadow-2xl transition-all duration-500">
              <Scale className="w-6 h-6 text-white relative z-10 transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground leading-none">
                الباحث <span className="text-primary">القانوني</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1 opacity-70">
                منصة الاختبارات الذكية
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - روابط بتفاعل "Modern Pill" */}
          <nav className="hidden md:flex items-center bg-muted/50 p-1 rounded-full border border-border/50 backdrop-blur-sm">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/20 animate-in fade-in zoom-in duration-300" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions Section */}
          <div className="flex items-center gap-4">
            <Link to="/levels" className="hidden sm:block">
              <Button className="rounded-full px-6 font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white border-0 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
                ابدأ رحلتك
                <ArrowLeft className="mr-2 w-4 h-4 rotate-180" />
              </Button>
            </Link>
            
            {/* Mobile Menu Toggle - تصميم زر أكثر حداثة */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - قائمة منسدلة بتأثير Glassmorphism كامل */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 p-4 rounded-3xl border border-border bg-background/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-5 py-4 rounded-2xl text-sm font-bold transition-all",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-border">
                <Link to="/levels" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full h-12 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20">
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
