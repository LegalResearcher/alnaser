import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale, LayoutDashboard, BookOpen, Users, Settings, BarChart3, LogOut, Menu, X, Trash2, Layers, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/admin/levels', label: 'إدارة المستويات', icon: Layers, adminOnly: true },
  { href: '/admin/subjects', label: 'إدارة المواد', icon: FolderOpen, adminOnly: true },
  { href: '/admin/questions', label: 'إدارة الأسئلة', icon: BookOpen },
  { href: '/admin/users', label: 'إدارة المستخدمين', icon: Users, adminOnly: true },
  { href: '/admin/deletion-requests', label: 'طلبات الحذف', icon: Trash2, adminOnly: true },
  { href: '/admin/statistics', label: 'الإحصائيات', icon: BarChart3, adminOnly: true },
  { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !role)) {
      navigate('/admin/login');
    }
  }, [user, role, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !role) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-[280px] sm:w-64 bg-card border-l transform transition-transform duration-300 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo & Close Button */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-2 sm:gap-3" onClick={() => setSidebarOpen(false)}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base sm:text-lg block truncate">لوحة التحكم</span>
                  <span className="text-xs text-muted-foreground">
                    {role === 'admin' ? 'مسؤول' : 'محرر'}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0 h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // Hide admin-only items for editors
              if (item.adminOnly && role !== 'admin') return null;

              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors text-sm sm:text-base",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 text-sm sm:text-base h-10 sm:h-11"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card border-b px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2 sm:gap-4 mr-auto">
            <Link to="/" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
              عرض الموقع
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-safe">
          {children}
        </main>
      </div>
    </div>
  );
}
