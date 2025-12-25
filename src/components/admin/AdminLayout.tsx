import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scale, LayoutDashboard, BookOpen, Users, Settings, 
  BarChart3, LogOut, Menu, X, Trash2, Layers, 
  FolderOpen, ChevronLeft, ExternalLink, ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/levels', label: 'إدارة المستويات', icon: Layers, adminOnly: true },
  { href: '/admin/subjects', label: 'إدارة المواد', icon: FolderOpen, adminOnly: true },
  { href: '/admin/questions', label: 'إدارة الأسئلة', icon: BookOpen },
  { href: '/admin/users', label: 'إدارة المستخدمين', icon: Users, adminOnly: true },
  { href: '/admin/deletion-requests', label: 'طلبات الحذف', icon: Trash2, adminOnly: true },
  { href: '/admin/statistics', label: 'الإحصائيات التحليلية', icon: BarChart3, adminOnly: true },
  { href: '/admin/settings', label: 'إعدادات المنصة', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isLoading, isRoleLoading, signOut } = useAuth();

  useEffect(() => {
    // لا توجه المستخدم إلا إذا انتهى التحميل ولا يوجد مستخدم
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // إظهار شاشة التحميل إذا كان المستخدم موجوداً ولكن الدور لم يُجلب بعد
  if (isLoading || (user && isRoleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || !role) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - تصميم "Dark Premium" */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-72 bg-[#0f172a] text-slate-300 transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static border-l border-white/5 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          
          {/* Header Sidebar - الهوية */}
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-black text-white text-lg tracking-tight leading-none">الإدارة</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {role === 'admin' ? 'مدير النظام' : 'محرر محتوى'}
                    </span>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                className="lg:hidden text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Navigation - روابط بتفاعل عصري */}
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              if (item.adminOnly && role !== 'admin') return null;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 group-hover:text-primary")} />
                    <span className="font-bold text-sm tracking-wide">{item.label}</span>
                  </div>
                  {isActive && <ChevronLeft className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section - فوتر القائمة */}
          <div className="p-6 border-t border-white/5 bg-black/20">
            <div className="mb-6 px-2">
               <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">المستخدم الحالي</p>
               <p className="text-sm font-bold text-white truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl h-12 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold">تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar - تصميم زجاجي شفاف */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl bg-slate-100 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="hidden md:flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">مرحباً بك مجدداً</h1>
              <p className="text-xs text-slate-500 font-medium">لوحة التحكم في منصة الباحث القانوني</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" className="rounded-full border-slate-200 hover:bg-slate-50 hover:text-primary gap-2 font-bold transition-all px-6">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">معاينة الموقع</span>
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Content Section - مع أنيميشن ناعم */}
        <main className="flex-1 p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* ذيل الصفحة البسيط */}
        <footer className="p-6 text-center text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] border-t border-slate-200">
          Alnaser Legal Researcher Admin • v2.0
        </footer>
      </div>
    </div>
  );
}
