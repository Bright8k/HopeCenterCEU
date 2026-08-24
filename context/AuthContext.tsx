import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { updateStreak } from '@/lib/streaks';
import type { UserRole } from '@/constants/roles';
import type { Database } from '@/types/database';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  refetchRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signIn: async () => null,
  signOut: () => {},
  refetchRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchRole(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    const profile = data as Database['public']['Tables']['profiles']['Row'] | null;
    setRole((profile?.role as UserRole) ?? null);
    setLoading(false);
    // Record a daily login streak — no-op if already updated today
    void updateStreak(userId);
  }

  const signIn = async (email: string, password: string): Promise<string | null> => {
    // Hold loading=true so the tab guard won't bounce us back to sign-in
    // before onAuthStateChange fires and sets the session in context.
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return error.message;
    }
    // On success, onAuthStateChange will call fetchRole which sets loading=false.
    return null;
  };

  const signOut = () => {
    // Clear auth state synchronously so all guards update before navigation.
    setSession(null);
    setRole(null);
    setLoading(false);
    router.replace('/(auth)/sign-in');
    if (hasSupabaseEnv) {
      void supabase.auth.signOut();
    }
  };

  const refetchRole = async () => {
    const userId = session?.user?.id;
    if (hasSupabaseEnv && userId) {
      await fetchRole(userId);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, loading, signIn, signOut, refetchRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
