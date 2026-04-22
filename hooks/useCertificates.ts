import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PREVIEW_CERTIFICATES, type PreviewCertificate } from '@/constants/previewContent';

export type CertificateRecord = PreviewCertificate;

export function useCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchCertificates() {
      if (!hasSupabaseEnv || !user) {
        if (active) {
          setCertificates([]);
          setErrorMessage(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('completions')
        .select('id, passed, cert_url, completed_at, courses(title, ceu_value)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (!active) return;

      if (error) {
        setCertificates([]);
        setErrorMessage(error.message);
      } else {
        const mapped = ((data as any[]) ?? []).map((record) => ({
          id: record.id,
          title: record.courses?.title ?? 'Untitled course',
          completedAt: record.completed_at,
          ceuValue: record.courses?.ceu_value ?? 0,
          passed: Boolean(record.passed),
          certUrl: record.cert_url ?? null,
        }));
        setCertificates(mapped);
      }

      setLoading(false);
    }

    fetchCertificates();

    return () => {
      active = false;
    };
  }, [user]);

  const displayCertificates = useMemo(
    () => (hasSupabaseEnv && certificates.length > 0 ? certificates : PREVIEW_CERTIFICATES),
    [certificates],
  );

  return {
    certificates,
    displayCertificates,
    loading,
    errorMessage,
    usingPreviewData: !hasSupabaseEnv || certificates.length === 0,
  };
}
