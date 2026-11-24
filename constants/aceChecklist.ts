// Steps that need provider details or offline work before Hope Center can award BACB credit.
// Auto items are checked from data; manual items are ticked off by an admin.

export interface ManualAceTask {
  key: string;
  title: string;
  detail: string;
}

export const MANUAL_ACE_TASKS: ManualAceTask[] = [
  {
    key: 'apply_ace',
    title: 'Apply for (or renew) BACB ACE Provider approval',
    detail: 'The ACE Coordinator must have been a BCBA for at least 5 years with no published disciplinary actions. Approval lasts one year.',
  },
  {
    key: 'instructor_evidence',
    title: 'Keep proof of every instructor’s qualifications',
    detail: 'CVs, publications, or other documents showing their credential and topic expertise. An instructor’s own attestation does not count.',
  },
  {
    key: 'pd_form',
    title: 'Get the BACB PD documentation form for RBT courses',
    detail: 'RBT PDUs must be documented on the BACB’s fillable form; the app only issues a record of completion for RBT courses.',
  },
  {
    key: 'feedback_review',
    title: 'Review learner feedback and share it with instructors within 45 days',
    detail: 'Feedback for each course is listed at the bottom of its edit screen.',
  },
  {
    key: 'records',
    title: 'Keep ACE records for 3 years',
    detail: 'The app keeps completions, quiz results, every certificate issued, and feedback (use the exports below). Keep course materials, instructor evidence, your responses to feedback, and marketing materials yourself.',
  },
  {
    key: 'disclosures',
    title: 'Add affiliation disclosures where needed',
    detail: 'Any company, product, or service featured in a course must be disclosed on the course page before learners start.',
  },
];
