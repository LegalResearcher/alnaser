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
  isRoleLoading: boolean;
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
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  
  const isMounted = useRef(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    // إذا كانت البيانات موجودة في الكاش لنفس المستخدم، لا داعي لطلبها مجدداً
    if (cachedUserId === userId && cachedRole !== null) {
      setRole(cachedRole);
      setIsRoleLoading(false);
      return cachedRole;
    }

    setIsRoleLoading(true);
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
      if (isMounted.current) {
        setRole(userRole);
        setIsRoleLoading(false);
      }
      return userRole;
    } catch (error) {
      console.error('⚠️ Auth Error [Role Fetch]:', error);
      if (isMounted.current) {
        setRole(null);
        setIsRoleLoading(false);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout - ensure loading never stays true indefinitely
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        console.warn('Auth loading timeout - forcing completion');
        setIsLoading(false);
      }
    }, 5000);

    // 1. Set up auth state listener FIRST (critical order)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted.current) return;

        // Synchronous state updates only - NO async/await here
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Always end loading on any auth event
        setIsLoading(false);

        if (event === 'SIGNED_OUT') {
          setRole(null);
          setIsRoleLoading(false);
          cachedRole = null;
          cachedUserId = null;
        } else if (currentSession?.user) {
          // Defer Supabase calls with setTimeout(0) to prevent deadlock
          const userId = currentSession.user.id;
          setTimeout(() => {
            if (isMounted.current) {
              fetchUserRole(userId);
            }
          }, 0);
        }
      }
    );

    // 2. THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted.current) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);

      if (currentSession?.user) {
        // Defer role fetch
        setTimeout(() => {
          if (isMounted.current) {
            fetchUserRole(currentSession.user.id);
          }
        }, 0);
      }
    }).catch((error) => {
      console.error('⚠️ Auth Init Error:', error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
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
      // Clear cache first
      cachedRole = null;
      cachedUserId = null;
      setRole(null);
      setUser(null);
      setSession(null);
      
      await supabase.auth.signOut();
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
    isRoleLoading,
    signIn,
    signUp,
    signOut,
  }), [user, session, role, isLoading, isRoleLoading, signIn, signUp, signOut]);

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
