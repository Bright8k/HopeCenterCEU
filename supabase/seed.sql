-- Hope Center CEU — seed data
-- Idempotent: uses fixed UUIDs and ON CONFLICT DO NOTHING.
-- Apply with: supabase db reset  OR  psql ... -f supabase/seed.sql

-- ── Courses ──────────────────────────────────────────────────────────────────

insert into public.courses
  (id, title, description, track, category, ceu_value, pass_score, duration_seconds, is_published)
values
  -- RBT track
  ('10000000-0000-0000-0000-000000000001',
   'Behavior Skills Training Essentials',
   'A practical walkthrough of instruction, modeling, rehearsal, and performance feedback for frontline ABA teams. Learn how to run effective BST sessions that build durable skills quickly.',
   'RBT', null, 1.0, 80, 3600, true),

  ('10000000-0000-0000-0000-000000000002',
   'Measurement and Data Collection for RBTs',
   'Covers frequency, duration, latency, and interval recording methods. Includes practice identifying the right measurement strategy for different behavior targets.',
   'RBT', null, 1.5, 80, 5400, true),

  ('10000000-0000-0000-0000-000000000003',
   'Understanding Reinforcement in ABA',
   'Explores the science of reinforcement — positive, negative, differential — and how to select and deliver reinforcers that maintain meaningful behavior change.',
   'RBT', null, 1.0, 80, 3600, true),

  -- BCBA track
  ('10000000-0000-0000-0000-000000000004',
   'Ethics in Supervision Decisions',
   'Case-based review of documentation, scope of practice, and supervisory judgment for practicing BCBAs. Draws directly from the BACB Ethics Code for Behavior Analysts.',
   'BCBA', 'ethics', 2.0, 80, 7200, true),

  ('10000000-0000-0000-0000-000000000005',
   'Effective BCBA Supervision Practices',
   'Covers supervisory competency, performance monitoring, and structured feedback delivery. Satisfies BACB supervision CEU sub-requirements.',
   'BCBA', 'supervision', 3.0, 80, 10800, true),

  ('10000000-0000-0000-0000-000000000006',
   'Functional Behavior Assessment Methods',
   'Compares indirect, descriptive, and experimental FBA approaches. Guides practitioners through the design of individualized hypothesis-driven intervention plans.',
   'BCBA', 'general', 2.0, 80, 7200, true),

  -- STUDENT track (exam prep)
  ('10000000-0000-0000-0000-000000000007',
   'Mock Exam: Measurement and Data Display',
   'Targeted question set mirroring board-style prompts on frequency, duration, latency, momentary time sampling, and graphing conventions.',
   'STUDENT', null, 0, 80, 3000, true),

  ('10000000-0000-0000-0000-000000000008',
   'Mock Exam: Behavior Change Procedures',
   'Practice set covering reinforcement schedules, extinction, shaping, chaining, stimulus control, and motivating operations in board-style wording.',
   'STUDENT', null, 0, 80, 3600, true)

on conflict (id) do nothing;


-- ── Questions ─────────────────────────────────────────────────────────────────
-- options stored as {"0":"...","1":"...","2":"...","3":"..."}
-- answer is 0-indexed integer

insert into public.questions
  (id, course_id, track, domain, stem, options, answer, explanation)
values

  -- RBT: Behavior Skills Training Essentials (course 001)
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001', 'RBT', null,
   'Which component of BST involves the trainer showing the skill being taught?',
   '{"0":"Instructions","1":"Modeling","2":"Rehearsal","3":"Feedback"}', 1,
   'Modeling is the demonstration phase — the trainer performs the target skill so the learner can observe the full response before attempting it.'),

  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001', 'RBT', null,
   'BST is most effective when which sequence is followed?',
   '{"0":"Feedback → Rehearsal → Instructions → Modeling","1":"Instructions → Modeling → Rehearsal → Feedback","2":"Modeling → Instructions → Feedback → Rehearsal","3":"Rehearsal → Modeling → Instructions → Feedback"}', 1,
   'The standard BST sequence is Instructions, Modeling, Rehearsal, then Feedback — each component builds on the prior one.'),

  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001', 'RBT', null,
   'During the rehearsal phase of BST, the primary role of the trainer is to:',
   '{"0":"Re-demonstrate the skill at full speed","1":"Read the written task analysis aloud","2":"Observe the learner''s performance and prepare feedback","3":"Deliver corrective punishment for errors"}', 2,
   'During rehearsal the learner practices; the trainer observes carefully and prepares accurate, specific feedback for the next phase.'),

  ('20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001', 'RBT', null,
   'Which type of feedback is most likely to maintain the learner''s motivation during BST?',
   '{"0":"Global praise only (e.g., \"Great job!\")","1":"Specific positive feedback paired with corrective information","2":"Silent nods to avoid disrupting the rehearsal","3":"Delaying feedback until the end of the training day"}', 1,
   'Specific positive feedback (labeling what went well) combined with corrective information is most effective at both maintaining motivation and shaping accurate performance.'),

  ('20000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001', 'RBT', null,
   'BST is classified as which type of training approach?',
   '{"0":"Didactic-only instruction","1":"Self-directed e-learning","2":"Behavioral skills training combining instruction, modeling, practice, and feedback","3":"Classical conditioning protocol"}', 2,
   'BST is explicitly defined by its four active components (instructions, modeling, rehearsal, feedback) and is distinct from lecture-only or self-study formats.'),

  -- RBT: Measurement and Data Collection (course 002)
  ('20000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000002', 'RBT', null,
   'A therapist counts the total number of times a student raises their hand during a 30-minute session. This is an example of:',
   '{"0":"Duration recording","1":"Latency recording","2":"Frequency (event) recording","3":"Momentary time sampling"}', 2,
   'Frequency recording tallies each discrete occurrence of a behavior. Counting individual instances of hand-raising is a classic frequency measure.'),

  ('20000000-0000-0000-0000-000000000007',
   '10000000-0000-0000-0000-000000000002', 'RBT', null,
   'Which measurement procedure is most appropriate for a behavior that has a clear start and end but varies in length (e.g., tantrum)?',
   '{"0":"Frequency recording","1":"Duration recording","2":"Latency recording","3":"Partial interval recording"}', 1,
   'Duration recording captures how long a behavior lasts, making it ideal for behaviors like tantrums where length is clinically meaningful.'),

  ('20000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000002', 'RBT', null,
   'Latency recording measures the time between:',
   '{"0":"The start and end of a behavior","1":"Two consecutive behavior occurrences","2":"The presentation of a discriminative stimulus and the start of the behavior","3":"The observer starting and stopping the stopwatch"}', 2,
   'Latency is the elapsed time from the SD (or instruction) to the onset of the response — useful when response delay is the clinical concern.'),

  ('20000000-0000-0000-0000-000000000009',
   '10000000-0000-0000-0000-000000000002', 'RBT', null,
   'An RBT divides a 10-minute session into 30-second intervals and records whether the target behavior occurred at any point during each interval. This is:',
   '{"0":"Whole interval recording","1":"Momentary time sampling","2":"Partial interval recording","3":"Duration recording"}', 2,
   'Partial interval recording scores an interval as "yes" if the behavior occurs at any point within it — regardless of duration. It tends to overestimate behavior.'),

  ('20000000-0000-0000-0000-000000000010',
   '10000000-0000-0000-0000-000000000002', 'RBT', null,
   'Which data display format is most commonly used to show behavior change over time in ABA?',
   '{"0":"Bar graph","1":"Pie chart","2":"Scatter plot","3":"Line graph"}', 3,
   'Line graphs are the standard display in applied behavior analysis because they show trend, level, and variability across consecutive data points over time.'),

  -- RBT: Understanding Reinforcement (course 003)
  ('20000000-0000-0000-0000-000000000011',
   '10000000-0000-0000-0000-000000000003', 'RBT', null,
   'Positive reinforcement is defined as:',
   '{"0":"Adding an aversive stimulus to increase behavior","1":"Removing a stimulus to decrease behavior","2":"Adding a stimulus after a behavior that increases the future frequency of that behavior","3":"Providing praise regardless of behavior"}', 2,
   'Positive reinforcement involves adding something (the reinforcer) contingent on behavior, which results in that behavior occurring more often in the future.'),

  ('20000000-0000-0000-0000-000000000012',
   '10000000-0000-0000-0000-000000000003', 'RBT', null,
   'Which of the following BEST illustrates negative reinforcement?',
   '{"0":"A child receives a sticker for completing homework","1":"A student is sent to the hall for disrupting class","2":"An alarm stops sounding when a driver buckles their seatbelt","3":"A dog is given a treat for sitting on command"}', 2,
   'Negative reinforcement removes an aversive stimulus (the alarm) contingent on behavior (buckling up), increasing the likelihood of that behavior in the future.'),

  ('20000000-0000-0000-0000-000000000013',
   '10000000-0000-0000-0000-000000000003', 'RBT', null,
   'The process of withholding a previously delivered reinforcer to decrease a behavior is called:',
   '{"0":"Punishment","1":"Extinction","2":"Differential reinforcement","3":"Satiation"}', 1,
   'Extinction involves discontinuing the reinforcement that was maintaining a behavior. Over time this results in a decrease in the behavior''s frequency.'),

  ('20000000-0000-0000-0000-000000000014',
   '10000000-0000-0000-0000-000000000003', 'RBT', null,
   'A Motivating Operation (MO) affects behavior by:',
   '{"0":"Signaling that reinforcement is available","1":"Altering the value of a reinforcer and the behavior it maintains","2":"Physically blocking access to a reinforcer","3":"Delivering reinforcement on a fixed schedule"}', 1,
   'MOs have two effects: they change the effectiveness of a reinforcer (value-altering effect) and they change the frequency of behavior that has produced that reinforcer (behavior-altering effect).'),

  ('20000000-0000-0000-0000-000000000015',
   '10000000-0000-0000-0000-000000000003', 'RBT', null,
   'When selecting a reinforcer for a learner, the MOST important criterion is:',
   '{"0":"The reinforcer is a preferred item identified by the parent","1":"The reinforcer consistently increases the target behavior for that individual","2":"The reinforcer is commonly used in other ABA programs","3":"The reinforcer is inexpensive and easy to deliver"}', 1,
   'A reinforcer is defined by its function — it must actually increase behavior for that specific individual. Preference alone does not guarantee reinforcing function.'),

  -- BCBA: Ethics in Supervision (course 004)
  ('20000000-0000-0000-0000-000000000016',
   '10000000-0000-0000-0000-000000000004', 'BCBA', null,
   'According to the BACB Ethics Code, when a BCBA''s professional judgment conflicts with an employer directive, the BCBA should:',
   '{"0":"Always follow the employer directive to protect job security","1":"Immediately report the employer to the BACB","2":"Advocate for the client''s best interests and document the conflict","3":"Delegate the decision to a supervising psychologist"}', 2,
   'Code Section 1 requires BCBAs to prioritize client welfare. When conflicts arise, BCBAs must advocate for clients and document their efforts — not silently comply with harmful directives.'),

  ('20000000-0000-0000-0000-000000000017',
   '10000000-0000-0000-0000-000000000004', 'BCBA', null,
   'A BCBA discovers that a supervisee has been implementing a program without required documentation. The MOST appropriate first step is:',
   '{"0":"Report the supervisee to the BACB immediately","1":"Privately address the issue with the supervisee and provide corrective guidance","2":"Terminate the supervisory relationship","3":"Ignore the issue unless a client is harmed"}', 1,
   'The Ethics Code emphasizes that supervisors should address performance deficits through corrective feedback and coaching before escalating. Immediate reporting without attempting remediation is generally not the first step.'),

  ('20000000-0000-0000-0000-000000000018',
   '10000000-0000-0000-0000-000000000004', 'BCBA', null,
   'Dual relationships in ABA supervision are problematic primarily because they:',
   '{"0":"Violate insurance billing requirements","1":"Are explicitly prohibited under all circumstances in the Ethics Code","2":"Can impair objective professional judgment and exploit power differentials","3":"Reduce the quantity of supervision hours delivered"}', 2,
   'Dual relationships compromise the supervisor''s objectivity and may exploit the supervisee''s dependency on the supervisor for credentials — creating ethical conflicts even when both parties consent.'),

  ('20000000-0000-0000-0000-000000000019',
   '10000000-0000-0000-0000-000000000004', 'BCBA', null,
   'Informed consent for behavioral intervention should be:',
   '{"0":"Obtained once at the start of services and then filed","1":"An ongoing process revisited as goals and procedures change","2":"Waived when the client has an intellectual disability","3":"Delegated entirely to the RBT delivering services"}', 1,
   'Informed consent is an ongoing process. The Ethics Code requires BCBAs to ensure clients and guardians understand and agree to the current intervention as it evolves — not just at intake.'),

  ('20000000-0000-0000-0000-000000000020',
   '10000000-0000-0000-0000-000000000004', 'BCBA', null,
   'Which action BEST demonstrates scope-of-practice compliance?',
   '{"0":"A BCBA implements a medication management protocol after reviewing published research","1":"A BCBA refers a family to a speech-language pathologist for communication needs beyond ABA scope","2":"A BCBA diagnoses a co-occurring anxiety disorder to improve treatment planning","3":"A BCBA conducts neurological testing to identify the biological basis of behavior"}', 1,
   'Scope of practice requires BCBAs to recognize the boundaries of their competence and make appropriate referrals. Medical, diagnostic, and neurological assessments fall outside BCBA scope.'),

  -- BCBA: Supervision Practices (course 005)
  ('20000000-0000-0000-0000-000000000021',
   '10000000-0000-0000-0000-000000000005', 'BCBA', null,
   'The BACB requires that supervision activities include which of the following?',
   '{"0":"Exclusively in-person observations of skill implementation","1":"A mix of direct observation, performance review, and feedback","2":"Monthly written evaluations only","3":"Peer review between supervisees without BCBA involvement"}', 1,
   'BACB supervision standards require supervisors to directly observe, review data and documentation, and provide feedback — a multi-modal process, not just observation or written review.'),

  ('20000000-0000-0000-0000-000000000022',
   '10000000-0000-0000-0000-000000000005', 'BCBA', null,
   'Which supervisory practice is most likely to produce durable behavior change in a supervisee?',
   '{"0":"Emailing a detailed written critique after each session","1":"Performance-based feedback delivered immediately following observed behavior","2":"Monthly group meetings to discuss general program philosophy","3":"Providing a list of readings for the supervisee to complete independently"}', 1,
   'Immediate, specific, performance-based feedback is an evidence-based supervisory practice. Delayed or generic feedback is far less effective at shaping precise clinical skills.'),

  ('20000000-0000-0000-0000-000000000023',
   '10000000-0000-0000-0000-000000000005', 'BCBA', null,
   'A BCBA supervisor notices that a supervisee consistently rushes through discrete trial instruction. The MOST appropriate response is to:',
   '{"0":"Document the deficit and wait for the annual performance review","1":"Immediately terminate the supervisory relationship","2":"Use BST to re-train the correct trial structure and observe improvement","3":"Assign extra reading on DTT without further direct support"}', 2,
   'BST (instructions, modeling, rehearsal, feedback) is the gold-standard approach for remediating skill deficits in supervisees — the same evidence-based training method used with clients.'),

  ('20000000-0000-0000-0000-000000000024',
   '10000000-0000-0000-0000-000000000005', 'BCBA', null,
   'Supervision hours claimed toward BCBA certification must be:',
   '{"0":"Conducted in any setting at any time without documentation","1":"Documented with verifiable records including dates, activities, and supervisor signature","2":"Completed solely through online supervision platforms","3":"Distributed equally across all BACB task list items"}', 1,
   'The BACB requires that supervision hours be verifiable and accurately documented. Falsifying or inadequately documenting hours is an Ethics Code violation.'),

  ('20000000-0000-0000-0000-000000000025',
   '10000000-0000-0000-0000-000000000005', 'BCBA', null,
   'The primary goal of effective BCBA supervision is:',
   '{"0":"To ensure the supervisee passes the BCBA exam","1":"To protect the supervisor from liability","2":"To develop the supervisee''s independent clinical competence in the best interest of clients","3":"To minimize the time supervisors spend on oversight activities"}', 2,
   'Supervision must ultimately be client-focused. The BACB Ethics Code positions supervisory responsibility as a mechanism for ensuring that clients receive competent, ethical care.'),

  -- BCBA: FBA Methods (course 006)
  ('20000000-0000-0000-0000-000000000026',
   '10000000-0000-0000-0000-000000000006', 'BCBA', null,
   'Which FBA method provides the highest level of experimental control?',
   '{"0":"Interview-based indirect assessment","1":"Descriptive (ABC) observation","2":"Functional analysis","3":"Scatter plot analysis"}', 2,
   'Functional analysis (experimental FBA) is the only method that demonstrates a causal relationship between environmental variables and behavior by systematically manipulating conditions.'),

  ('20000000-0000-0000-0000-000000000027',
   '10000000-0000-0000-0000-000000000006', 'BCBA', null,
   'An ABC observation finds that a child''s aggression consistently follows peer proximity and precedes peer withdrawal. This pattern suggests which function?',
   '{"0":"Automatic reinforcement","1":"Attention","2":"Tangible","3":"Escape/avoidance — from peer proximity"}', 3,
   'The antecedent (peer proximity) and consequence (peer withdrawal) indicate the aggression is maintained by escape from social contact, not by attention-getting or access to items.'),

  ('20000000-0000-0000-0000-000000000028',
   '10000000-0000-0000-0000-000000000006', 'BCBA', null,
   'Indirect FBA methods include:',
   '{"0":"Functional analysis conditions","1":"Structured ABC recording in the natural environment","2":"Interviews and rating scales completed by caregivers or teachers","3":"Analogue assessment in a clinic setting"}', 2,
   'Indirect methods gather information through interviews, questionnaires, and checklists — not through direct observation of the behavior. They are fast but have lower reliability.'),

  ('20000000-0000-0000-0000-000000000029',
   '10000000-0000-0000-0000-000000000006', 'BCBA', null,
   'A behavior that persists even when all social consequences are withheld is most likely maintained by:',
   '{"0":"Attention","1":"Escape","2":"Tangible reinforcement","3":"Automatic (sensory) reinforcement"}', 3,
   'If a behavior continues in the absence of social consequences (attention, escape, tangibles), it is likely self-reinforcing — producing sensory consequences that are independent of others'' reactions.'),

  ('20000000-0000-0000-0000-000000000030',
   '10000000-0000-0000-0000-000000000006', 'BCBA', null,
   'The primary purpose of conducting an FBA before designing a behavior intervention plan is to:',
   '{"0":"Satisfy documentation requirements for insurance billing","1":"Identify the maintaining consequence so the intervention targets the actual function","2":"Determine whether medication is needed to reduce behavior","3":"Establish legal liability protection for the clinical team"}', 1,
   'Function-based interventions are far more effective than topography-based ones. Knowing WHY a behavior occurs allows the BCBA to address reinforcement directly rather than just suppressing the behavior.'),

  -- STUDENT: Measurement & Data (course 007, domain-tagged for exam practice)
  ('20000000-0000-0000-0000-000000000031',
   '10000000-0000-0000-0000-000000000007', 'STUDENT', 'Measurement and Data Display',
   'A practitioner records how many times a student raises their hand per minute across a 20-minute session. This is a measure of:',
   '{"0":"Duration","1":"Rate","2":"Latency","3":"Interresponse time"}', 1,
   'Rate (frequency per unit time) accounts for session length variation — it is frequency divided by the observation period. This is the most appropriate measure when session length varies.'),

  ('20000000-0000-0000-0000-000000000032',
   '10000000-0000-0000-0000-000000000007', 'STUDENT', 'Measurement and Data Display',
   'Whole interval recording is most appropriate when the behavior:',
   '{"0":"Occurs at high rates and is difficult to count individually","1":"Must be present throughout the entire interval to be scored","2":"Has a discrete and clear start and end point","3":"Occurs too infrequently to be captured with event recording"}', 1,
   'Whole interval recording scores an interval as occurring only if the behavior is present for the entire interval — it tends to underestimate behavior and is best suited for behaviors that should occur continuously.'),

  ('20000000-0000-0000-0000-000000000033',
   '10000000-0000-0000-0000-000000000007', 'STUDENT', 'Measurement and Data Display',
   'On a line graph, a phase change line indicates:',
   '{"0":"A missed data point","1":"A change in measurement system","2":"A change in the independent variable (e.g., beginning or ending an intervention)","3":"The highest data point in a series"}', 2,
   'Phase change lines visually separate experimental conditions on a graph, allowing viewers to compare behavior levels, trends, and variability across different phases.'),

  ('20000000-0000-0000-0000-000000000034',
   '10000000-0000-0000-0000-000000000007', 'STUDENT', 'Measurement and Data Display',
   'Which of the following is NOT a dimension of behavior as defined by Johnston and Pennypacker?',
   '{"0":"Countability","1":"Temporality","2":"Morality","3":"Repeatability"}', 2,
   'Johnston and Pennypacker defined three dimensions: repeatability (it can occur more than once), temporal locus (it occurs in time), and temporal extent (it has duration). Morality is not a dimension of behavior.'),

  ('20000000-0000-0000-0000-000000000035',
   '10000000-0000-0000-0000-000000000007', 'STUDENT', 'Measurement and Data Display',
   'Interobserver agreement (IOA) is calculated to assess:',
   '{"0":"Whether the intervention is producing the desired behavior change","1":"The consistency of data collection between two independent observers","2":"Whether the behavior meets the social validity standard","3":"The reliability of the treatment protocol across therapists"}', 1,
   'IOA is a measure of data quality — it tells us whether two observers independently recording the same behavior produce similar data, which is essential for trusting the measurement system.'),

  -- STUDENT: Behavior Change Procedures (course 008)
  ('20000000-0000-0000-0000-000000000036',
   '10000000-0000-0000-0000-000000000008', 'STUDENT', 'Behavior Change Procedures',
   'A fixed ratio (FR) schedule delivers reinforcement:',
   '{"0":"After a fixed amount of time has elapsed","1":"After a fixed number of responses","2":"After a variable number of responses","3":"At unpredictable times regardless of behavior"}', 1,
   'FR schedules require a set number of responses before reinforcement is delivered. FR schedules produce a characteristic post-reinforcement pause followed by rapid responding.'),

  ('20000000-0000-0000-0000-000000000037',
   '10000000-0000-0000-0000-000000000008', 'STUDENT', 'Behavior Change Procedures',
   'Shaping involves reinforcing:',
   '{"0":"Only the final target behavior from the very first trial","1":"Successive approximations of the target behavior","2":"Any behavior that precedes the target response","3":"Competing behaviors that are incompatible with the target"}', 1,
   'Shaping uses differential reinforcement to move behavior toward a target by reinforcing responses that progressively resemble the goal — starting from where the learner is and building toward the terminal behavior.'),

  ('20000000-0000-0000-0000-000000000038',
   '10000000-0000-0000-0000-000000000008', 'STUDENT', 'Behavior Change Procedures',
   'A teacher who turns off classroom lights to gain student attention is using:',
   '{"0":"Positive punishment","1":"Response cost","2":"An antecedent-based strategy","3":"Differential reinforcement of other behavior"}', 2,
   'Dimming the lights is an antecedent manipulation — changing the environment before behavior occurs to evoke attention. No consequence is delivered contingent on behavior.'),

  ('20000000-0000-0000-0000-000000000039',
   '10000000-0000-0000-0000-000000000008', 'STUDENT', 'Behavior Change Procedures',
   'The MOST resistant to extinction schedule of reinforcement is:',
   '{"0":"Continuous reinforcement (CRF)","1":"Fixed ratio","2":"Fixed interval","3":"Variable ratio"}', 3,
   'Variable ratio schedules produce the most extinction-resistant behavior because the unpredictability of reinforcement delivery prevents the learner from discriminating that reinforcement has stopped — the same principle that maintains gambling behavior.'),

  ('20000000-0000-0000-0000-000000000040',
   '10000000-0000-0000-0000-000000000008', 'STUDENT', 'Behavior Change Procedures',
   'Stimulus generalization occurs when:',
   '{"0":"A behavior trained with one SD occurs in the presence of similar but untrained stimuli","1":"A behavior is performed only in the presence of the exact training SD","2":"Multiple behaviors come under the control of a single stimulus","3":"A conditioned reinforcer loses its value over time"}', 0,
   'Generalization means the trained behavior spreads to novel stimuli that share physical or functional properties with the training SD — a desirable outcome in skill acquisition programs.')

on conflict (id) do nothing;
