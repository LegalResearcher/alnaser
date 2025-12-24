import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';

/**
 * واجهة بيانات الهوية المطورة
 * تضمن وضوح الصلاحيات للمطور والمدير على حد سواء
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthenticated: boolean; // إضافة للتحقق السريع من تسجيل الدخول
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// نظام التخزين المؤقت المتقدم (Cache) لمنع تكرار الطلبات غير الضرورية
let cachedRole: AppRole | null = null;
let cachedUserId: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(cachedRole);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * جلب رتبة المستخدم باحترافية
   * تعتمد على الكاش أولاً ثم قاعدة البيانات لضمان السرعة الفائقة
   */
  const fetchUserRole = useCallback(async (userId: string) => {
    if (cachedUserId === userId && cachedRole !== null) {
      setRole(cachedRole);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      const userRole = data?.role as AppRole ?? null;
      
      // تحديث الكاش المحلي
      cachedRole = userRole;
      cachedUserId = userId;
      setRole(userRole);
    } catch (error) {
      console.error('⚠️ Auth Error [Role Fetch]:', error);
      setRole(null);
      cachedRole = null;
      cachedUserId = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * مراقب حالة الهوية (Auth Observer)
   * يعمل في الخلفية لمزامنة الجلسات عبر التبويبات المختلفة
   */
  useEffect(() => {
    let mounted = true;

    // الحصول على الجلسة الحالية فور تشغيل التطبيق
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('⚠️ Auth Initialization Failed:', err);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // الاستماع للتغييرات الحية (تسجيل دخول، خروج، انتهاء جلسة)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id);
        } else {
          // تنظيف شامل للبيانات عند خروج المستخدم
          setRole(null);
          cachedRole = null;
          cachedUserId = null;
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  // وظائف الدخول والخروج مع تحسين منطق الـ TypeScript
  const signIn = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // إعادة ضبط الحالة المحلية فوراً لضمان UX سريع
    setRole(null);
    cachedRole = null;
    cachedUserId = null;
    setUser(null);
    setSession(null);
  }, []);

  // تحسين الأداء عبر useMemo لمنع إعادة الرندر غير الضرورية
  const value = useMemo(() => ({
    user,
    session,
    role,
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
  }), [user, session, role, isLoading, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * الأداة الأساسية لاستخدام الهوية في أي مكان داخل التطبيق
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
