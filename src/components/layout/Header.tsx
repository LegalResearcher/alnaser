/**
 * Header.tsx — قائمة جانبية عالمية dark
 * مع الحفاظ على كامل المنطق والوظائف الأصلية
 */
import { Link, useLocation } from 'react-router-dom';
import { X, Download, Smartphone, CheckCircle, Search, BookOpen, GraduationCap, BarChart2, Award, HelpCircle, Lightbulb, Info, MessageCircle, Home, Layers, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoImage from '@/assets/logo.jpg';

/* ── روابط التنقل مع أيقونات ── */
const navLinks = [
  { href: '/',                   label: 'الرئيسية',         icon: Home },
  { href: '/levels',             label: 'المستويات',         icon: GraduationCap },
  { href: '/library',            label: 'المكتبة',           icon: BookOpen },
  { href: '/features',           label: 'المزايا',           icon: Layers },
  { href: '/diagnostic',         label: 'التشخيص',           icon: BarChart2 },
  { href: '/progress',           label: 'تقدمي',             icon: BarChart2 },
  { href: '/honor-certificate',  label: 'لوحة الشرف',        icon: Award },
  { href: '/about',              label: 'عن المنصة',          icon: Info },
  { href: '/#faq',               label: 'الأسئلة الشائعة',   icon: HelpCircle },
  { href: '/suggest',            label: 'أضف سؤالاً',        icon: Lightbulb },
  { href: 'https://t.me/MuenAlnaser', label: 'تواصل معنا', icon: MessageCircle, external: true },
];

/* ── روابط Navbar الرئيسية (مختصرة) ── */
const mainNavLinks = [
  { href: '/',           label: 'الرئيسية' },
  { href: '/levels',     label: 'المستويات' },
  { href: '/library',    label: 'المكتبة' },
  { href: '/diagnostic', label: 'التشخيص' },
  { href: '/progress',   label: 'تقدمي' },
  { href: '/about',      label: 'عن المنصة' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [isScrolled, setIsScrolled]         = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQuery, setSearchQuery]       = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => { setIsMenuOpen(false); setSearchQuery(''); }, [location.pathname]);

  // إغلاق بالـ Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // منع scroll الخلفية عند فتح القائمة
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Focus على البحث عند الفتح
  useEffect(() => {
    if (isMenuOpen) setTimeout(() => searchRef.current?.focus(), 200);
  }, [isMenuOpen]);

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

  // فلترة روابط البحث
  const filteredLinks = searchQuery.trim()
    ? navLinks.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : navLinks;

  return (
    <>
      <header
        className={cn('sticky top-0 z-50 w-full transition-all duration-500')}
        style={{
          backgroundColor: isScrolled ? 'rgba(7,13,26,0.97)' : 'rgb(7,13,26)',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          boxShadow: isScrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
          padding: isScrolled ? '8px 0' : '14px 0',
        }}
      >
        {/* شريط تقدم القراءة */}
        <div
          style={{
            position: 'absolute', bottom: 0, right: 0, height: 2, pointerEvents: 'none',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(to left, hsl(217 91% 60%), hsl(199 89% 55%), transparent)',
            transition: 'width 0.15s linear',
          }}
        />

        <div className="container mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-14" dir="rtl">

            {/* الشعار */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative overflow-hidden w-10 h-10 rounded-2xl transition-all duration-300 group-hover:scale-105"
                style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)' }}>
                <img src={logoImage} alt="شعار منصة الناصر" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col leading-none gap-[3px]">
                <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                  الباحث{' '}
                  <span style={{ background: 'linear-gradient(135deg, #c8a84b, #f0d080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    القانوني
                  </span>
                </span>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  منصة الناصر
                </span>
              </div>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center p-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              {mainNavLinks.map(link => {
                const isActive = location.pathname === link.href;
                return (
                  <Link key={link.href} to={link.href}
                    className="relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
                    style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.5)' }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full -z-10"
                        style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))' }} />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* الأيمن: theme + burger */}
            <div className="flex items-center gap-2">
              <div style={{ '--tw-ring-color': 'rgba(255,255,255,0.1)' } as React.CSSProperties}
                className="[&_button]:bg-white/8 [&_button]:text-white [&_button:hover]:bg-white/15">
                <ThemeToggle />
              </div>

              {/* زر القائمة */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="فتح القائمة"
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isMenuOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', transition: 'all 0.2s ease',
                }}
              >
                {isMenuOpen ? (
                  <X style={{ width: 20, height: 20 }} />
                ) : (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span style={{ display: 'block', height: 2, width: 20, borderRadius: 2, background: '#fff' }} />
                    <span style={{ display: 'block', height: 2, width: 13, borderRadius: 2, background: 'rgba(255,255,255,0.45)' }} />
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════ SIDEBAR OVERLAY ════════════════ */}
      {/* Backdrop */}
      <div
        onClick={() => setIsMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? 'all' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sidebar Panel */}
      <div
        dir="rtl"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 999,
          width: 'min(340px, 90vw)',
          background: '#080f1c',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-16px 0 60px rgba(0,0,0,0.6)',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* رأس القائمة */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              القائمة
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* حقل البحث */}
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.3)' }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في القائمة..."
              style={{
                width: '100%', height: 40, borderRadius: 10, paddingRight: 36, paddingLeft: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', direction: 'rtl',
              }}
            />
          </div>
        </div>

        {/* روابط التنقل */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredLinks.map((link, i) => {
              const isActive = !link.external && location.pathname === link.href;
              const Icon = link.icon;
              const Wrapper = link.external
                ? ({ children }: any) => <a href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none' }}>{children}</a>
                : ({ children }: any) => <Link to={link.href} onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none' }}>{children}</Link>;

              return (
                <Wrapper key={i}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 12,
                    background: isActive ? 'rgba(99,149,255,0.12)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99,149,255,0.2)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isActive ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isActive ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                      <Icon style={{ width: 14, height: 14, color: isActive ? 'hsl(217 91% 72%)' : 'rgba(255,255,255,0.35)' }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', flex: 1 }}>
                      {link.label}
                    </span>
                    {link.external && <ExternalLink style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
                    {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(217 91% 65%)', flexShrink: 0 }} />}
                  </div>
                </Wrapper>
              );
            })}

            {filteredLinks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                لا توجد نتائج
              </div>
            )}
          </div>
        </div>

        {/* أسفل القائمة */}
        <div style={{ padding: '16px 12px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>

          {/* قناة تيليغرام */}
          <a href="https://t.me/muen2025" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, textDecoration: 'none', background: 'rgba(34,158,217,0.08)', border: '1px solid rgba(34,158,217,0.18)', color: '#229ED9', fontSize: 13, fontWeight: 700, transition: 'all 0.2s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,158,217,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,158,217,0.08)'; }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor', flexShrink: 0 }}>
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            قناة منصة الناصر القانونية
          </a>

          {/* زر ابدأ الاختبار */}
          <Link to="/levels" onClick={() => setIsMenuOpen(false)}>
            <button style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(199 89% 48%))', color: '#fff', fontSize: 15, fontWeight: 900, fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(59,130,246,0.3)', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              ابدأ الاختبار الآن
            </button>
          </Link>

          {/* تثبيت التطبيق */}
          {!isInstalled && (
            <button
              onClick={() => { handleInstall(); setIsMenuOpen(false); }}
              disabled={!deferredPrompt || isInstalling}
              style={{ width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: (!deferredPrompt || isInstalling) ? 'not-allowed' : 'pointer', opacity: (!deferredPrompt || isInstalling) ? 0.4 : 1, fontFamily: 'inherit', transition: 'all 0.2s ease' }}
            >
              {isInstalling ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'hd-spin 0.8s linear infinite' }} />جاري التثبيت...</>
              ) : !deferredPrompt ? (
                <><Smartphone style={{ width: 14, height: 14 }} />افتح القائمة ← تثبيت</>
              ) : (
                <><Download style={{ width: 14, height: 14 }} />تحميل التطبيق</>
              )}
            </button>
          )}

          {isInstalled && (
            <div style={{ height: 40, borderRadius: 12, border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.06)', color: '#34d399', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle style={{ width: 14, height: 14 }} />
              التطبيق مثبّت
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes hd-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
