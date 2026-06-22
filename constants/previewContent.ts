import type { Database } from '@/types/database';

export type Course = Database['public']['Tables']['courses']['Row'];

export const PREVIEW_COURSES: Course[] = [
  {
    id: 'preview-rbt-1',
    title: 'Behavior Skills Training Essentials',
    description:
      'A practical walkthrough of instruction, modeling, rehearsal, and feedback for frontline ABA teams.',
    track: 'RBT',
    category: null,
    ceu_value: 1,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 2700,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-16T00:00:00Z',
  },
  {
    id: 'preview-bcba-1',
    title: 'Ethics in Supervision Decisions',
    description:
      'Case-based review of documentation, scope, and supervisory judgment for practicing BCBAs.',
    track: 'BCBA',
    category: 'ethics',
    ceu_value: 2,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 4200,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-15T00:00:00Z',
  },
  {
    id: 'preview-student-1',
    title: 'Mock Exam: Measurement and Data Display',
    description:
      'Targeted question set designed to mirror board-style prompts and pacing for student analysts.',
    track: 'STUDENT',
    category: null,
    ceu_value: 0,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 3000,
    pass_score: 80,
    is_published: true,
    created_at: '2026-04-14T00:00:00Z',
  },
];

export type PreviewDomain = {
  name: string;
  questions: number;
  description: string;
  difficulty: string;
  attempts: number;
  accuracy: number | null;
};

export const PREVIEW_EXAM_DOMAINS: PreviewDomain[] = [
  {
    name: 'Measurement and Data Display',
    questions: 42,
    description:
      'Sharpen fluency with graph reading, measurement systems, and selecting the right data collection methods.',
    difficulty: 'Warm up',
    attempts: 18,
    accuracy: 72,
  },
  {
    name: 'Experimental Design',
    questions: 36,
    description:
      'Practice distinguishing designs, identifying control, and interpreting functional relations with confidence.',
    difficulty: 'Moderate',
    attempts: 12,
    accuracy: 68,
  },
  {
    name: 'Behavior Change Procedures',
    questions: 58,
    description:
      'Reinforcement, stimulus control, motivating operations, and intervention choices in board-style wording.',
    difficulty: 'Core',
    attempts: 25,
    accuracy: 75,
  },
  {
    name: 'Supervision and Professionalism',
    questions: 27,
    description:
      'Target cases around supervision, performance feedback, documentation, and ethical decision making.',
    difficulty: 'Applied',
    attempts: 8,
    accuracy: 70,
  },
  {
    name: 'Ethics and Scope of Practice',
    questions: 31,
    description:
      'Build better instincts around risk, boundaries, consent, confidentiality, and consultation.',
    difficulty: 'High focus',
    attempts: 15,
    accuracy: 64,
  },
];

export type PreviewCertificate = {
  id: string;
  title: string;
  completedAt: string;
  ceuValue: number;
  passed: boolean;
  certUrl: string | null;
};

export const PREVIEW_CERTIFICATES: PreviewCertificate[] = [
  {
    id: 'preview-cert-1',
    title: 'Behavior Skills Training Essentials',
    completedAt: '2026-04-10T00:00:00Z',
    ceuValue: 1,
    passed: true,
    certUrl: null,
  },
  {
    id: 'preview-cert-2',
    title: 'Ethics in Supervision Decisions',
    completedAt: '2026-04-05T00:00:00Z',
    ceuValue: 2,
    passed: true,
    certUrl: null,
  },
];
