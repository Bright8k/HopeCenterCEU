import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Resource = Database['public']['Tables']['resources']['Row'];

const PREVIEW_RESOURCES: Resource[] = [
  {
    id: '1', title: 'Applied Behavior Analysis (3rd ed.)',
    author: 'Cooper, Heron & Heward', type: 'book',
    description: 'The definitive ABA textbook covering foundational concepts, measurement, and intervention for RBT and BCBA candidates.',
    url: null, track: null, category: 'general', is_featured: true, published_year: 2020,
    created_at: new Date().toISOString(),
  },
  {
    id: '2', title: 'Ethics for Behavior Analysts (3rd ed.)',
    author: 'Jon Bailey & Mary Burch', type: 'book',
    description: 'A practical guide to the BACB Ethics Code with annotated case studies and decision-making frameworks.',
    url: null, track: 'BCBA', category: 'ethics', is_featured: true, published_year: 2022,
    created_at: new Date().toISOString(),
  },
  {
    id: '3', title: 'RBT Task List Study Guide',
    author: 'BACB', type: 'website',
    description: 'Official BACB resource outlining every task and competency area covered by the RBT certification exam.',
    url: 'https://www.bacb.com/rbt/', track: 'RBT', category: 'general', is_featured: false, published_year: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '4', title: 'Supervision Strategies for Behavior Analysts',
    author: 'Sellers, Valentino & LeBlanc', type: 'article',
    description: 'Evidence-based strategies for delivering effective performance feedback and structured supervisory relationships.',
    url: null, track: 'BCBA', category: 'supervision', is_featured: false, published_year: 2016,
    created_at: new Date().toISOString(),
  },
  {
    id: '5', title: 'Behavior Reduction: A Practical Guide',
    author: 'Cipani & Schock', type: 'book',
    description: 'Comprehensive coverage of function-based behavior intervention planning and data-driven decision making.',
    url: null, track: null, category: 'behavior-reduction', is_featured: false, published_year: 2011,
    created_at: new Date().toISOString(),
  },
];

export function useResources(trackFilter?: 'RBT' | 'BCBA' | 'STUDENT' | null) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setResources(PREVIEW_RESOURCES);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('resources')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (trackFilter) {
      query = query.or(`track.is.null,track.eq.${trackFilter}`);
    }

    query.then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setResources(data ?? []);
      setLoading(false);
    });
  }, [trackFilter]);

  return { resources, loading, error };
}
