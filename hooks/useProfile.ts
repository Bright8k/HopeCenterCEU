import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types/database';

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!hasSupabaseEnv || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile((data as UserProfile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, refetch };
}

export function formatRenewalDate(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
