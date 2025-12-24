import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  isEditor: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ذاكرة تخزين مؤقت خارج المكون لمنع الوميض أثناء التنقل
let cachedRole: AppRole | null = null;
let cachedUserId: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(cachedRole);
  const [isLoading, setIsLoading] = useState(true);
  
  // استخدام Ref لمنع التداخل بين الطلبات
  const isInitialMount = useRef(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    // إذا كانت البيانات موجودة في الكاش لنفس المستخدم، لا داعي لطلبها مجدداً
    if (cachedUserId === userId && cachedRole !== null) {
      setRole(cachedRole);
      return cachedRole;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      const userRole = data?.role as AppRole ?? null;
      
      cachedRole = userRole;
      cachedUserId = userId;
      setRole(userRole);
      return userRole;
    } catch (error) {
      console.error('⚠️ Auth Error [Role Fetch]:', error);
      setRole(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // 1. الحصول على الجلسة الحالية
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchUserRole(currentSession.user.id);
        }
      } catch (error) {
        console.error('⚠️ Auth Init Error:', error);
      } finally {
        // ضمان إنهاء حالة التحميل مهما كانت النتيجة
        if (mounted) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    initialize();

    // 2. مراقبة التغييرات (دخول/خروج)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        // تجنب المعالجة المزدوجة أثناء التشغيل الأول
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchUserRole(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
          cachedRole = null;
          cachedUserId = null;
        }
        
        // تأكيد إغلاق التحميل في حال تم استدعاء هذا الحدث بدلاً من initialize
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setRole(null);
      setUser(null);
      setSession(null);
      cachedRole = null;
      cachedUserId = null;
    } catch (error) {
      console.error("Logout error", error);
    }
  }, []);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
