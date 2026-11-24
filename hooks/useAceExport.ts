import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { functionErrorMessage } from '@/lib/functionError';

export type AceExportType = 'completions' | 'feedback';

/** Downloads an admin CSV of ACE records via the export-ace-records Edge Function. */
export function useAceExport() {
  const [exporting, setExporting] = useState<AceExportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportRecords = useCallback(async (type: AceExportType) => {
    if (!hasSupabaseEnv) {
      setError('Connect Supabase to export records.');
      return;
    }
    setExporting(type);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('export-ace-records', { body: { type } });
    setExporting(null);
    const url = (data as { signedUrl?: string } | null)?.signedUrl;
    if (err || !url) {
      setError(err ? await functionErrorMessage(err, 'The export failed. Try again.') : 'The export failed. Try again.');
      return;
    }
    await Linking.openURL(url);
  }, []);

  return { exportRecords, exporting, error };
}
