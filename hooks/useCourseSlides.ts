import { useState } from 'react';
import * as Linking from 'expo-linking';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export const SLIDES_BUCKET = 'course-slides';
const SIGNED_URL_TTL_SECONDS = 3600;

export function useCourseSlides(slidesPath: string | null) {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed lazily on tap so the link is always fresh
  async function openViewer() {
    if (!slidesPath || !hasSupabaseEnv) return;
    setOpening(true);
    setError(null);
    const { data, error: signError } = await supabase.storage
      .from(SLIDES_BUCKET)
      .createSignedUrl(slidesPath, SIGNED_URL_TTL_SECONDS);
    if (signError || !data) {
      setError('Slides could not be opened. Check your connection and try again.');
    } else {
      setViewerUrl(data.signedUrl);
    }
    setOpening(false);
  }

  async function openExternal() {
    if (!viewerUrl) return;
    try {
      await Linking.openURL(viewerUrl);
    } catch {
      setError('No app is available to open the slides.');
    }
  }

  return { viewerUrl, openViewer, closeViewer: () => setViewerUrl(null), openExternal, opening, error };
}
