import { useCallback, useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type AceSettings = Database['public']['Tables']['ace_settings']['Row'];
export type AceSettingsUpdate = Database['public']['Tables']['ace_settings']['Update'];

export const PREVIEW_ACE_SETTINGS: AceSettings = {
  id: true,
  provider_name: 'Hope Center for Behavior Change',
  provider_number: null,
  coordinator_name: null,
  coordinator_email: null,
  approval_expires_on: null,
  checklist: {},
  updated_at: '2026-11-16T00:00:00Z',
};

export function useAceSettings() {
  const [settings, setSettings] = useState<AceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    if (!hasSupabaseEnv) {
      setSettings(PREVIEW_ACE_SETTINGS);
      setLoading(false);
      return;
    }
    supabase
      .from('ace_settings')
      .select('*')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!active) return;
        setSettings((data as AceSettings | null) ?? PREVIEW_ACE_SETTINGS);
        setError(err ? 'Provider settings could not be loaded.' : null);
        setLoading(false);
      });
    return () => { active = false; };
  }, [nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  const save = useCallback(async (update: AceSettingsUpdate): Promise<string | null> => {
    if (!hasSupabaseEnv) return 'Connect Supabase to save provider settings.';
    const { data, error: err } = await supabase
      .from('ace_settings')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', true)
      .select('*')
      .single();
    if (err) return 'Settings could not be saved. Try again.';
    setSettings(data as AceSettings);
    return null;
  }, []);

  return { settings, loading, error, refetch, save };
}
