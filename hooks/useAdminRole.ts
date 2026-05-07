import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type AdminRoleValue = 'admin' | 'editor' | 'publisher';

export function useAdminRole() {
  const { user } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRoleValue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user || !hasSupabaseEnv) {
      setAdminRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (!active) return;
        const row = (data as Array<{ role: AdminRoleValue }> | null)?.[0];
        setAdminRole(row?.role ?? null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  return { isAdmin: adminRole !== null, adminRole, loading };
}
