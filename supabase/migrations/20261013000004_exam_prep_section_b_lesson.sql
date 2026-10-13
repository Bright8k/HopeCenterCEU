-- Adds "ABA Exam Prep — Section B: Behavior Assessment" as a draft STUDENT lesson
-- with its full transcript and follow-along slides (uploaded to course-slides separately).
-- Fixed UUID + ON CONFLICT keeps this idempotent.

INSERT INTO courses
  (id, title, description, track, category, ceu_value, pass_score, duration_seconds,
   quiz_required, status, is_published, slides_path, transcript)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  'ABA Exam Prep — Section B: Behavior Assessment',
  'Covers task list items B.1–B.3: preference assessments (MSWO, paired stimulus, free operant), skill strengths and deficit assessments, and functional assessment procedures — including the RBT''s role and BCBA supervision requirements.',
  'STUDENT',
  NULL,
  0,
  80,
  3000,
  false,
  'draft',
  false,
  '20000000-0000-0000-0000-000000000002/slides.pdf',
  $transcript$
## Introduction

Welcome, everyone. Today we're covering one of the most foundational sections of your RBT training — Behavior Assessment.

This section is broken into three task list items:
• B.1 — Preference Assessments
• B.2 — Skill Strengths and Deficits
• B.3 — Functional Assessment Procedures

These aren't just exam topics — they're things you will use in real sessions, possibly every single day. Understanding why we assess, what we're assessing for, and how you as an RBT fit into that process is critical.

Before we dive in, I want to set the tone for this whole section: assessment in ABA is not a one-time event. It's an ongoing, dynamic process. The data you collect today informs what your learner's program looks like tomorrow. So take this seriously.

Let's start with B.1 — Preference Assessments.

## B.1 — Conduct Preference Assessments

Let me ask you this — have you ever tried to motivate a child with a sticker chart, only to discover they couldn't care less about stickers? Or offered a "reward" that the child just ignored?

That's exactly the problem preference assessments solve.

A preference assessment is a structured way of figuring out which items or activities will actually work as reinforcers for a specific learner. Not what we assume they like. Not what their parents say they liked last year. What functions as a reinforcer right now, today.

And this matters because in ABA, the effectiveness of everything — every teaching program, every behavior reduction plan — depends on having powerful, individualized reinforcers.

## Why Preference Assessment Matters

Read this definition on the slide: "Preference assessments identify stimuli that function as reinforcers for a learner."

Notice the word "function." A reinforcer isn't just something a person likes — it's something that, when delivered after a behavior, increases the likelihood of that behavior happening again. So we assess preference to find candidates for reinforcers, and then we watch the data to confirm they're working.

Preferences also change over time. Something that motivated a learner three months ago might be completely ineffective today. This is why preference assessments are run frequently — sometimes even at the beginning of each session.

## The Three Methods

We're going to walk through all three methods on this slide. For each one, I want you to understand the procedure, the purpose, and your role as an RBT.

## 1. Multiple Stimulus Without Replacement (MSWO)

This is probably the most commonly used preference assessment in clinic settings.

Here's how it works:
• You lay out 5 to 7 items in front of the learner — these might be toys, snacks, activities, whatever you're testing.
• The learner picks one. You remove that item — that's the "without replacement" part — and rearrange the remaining items so the learner isn't just grabbing what's in front of them.
• You repeat until the learner stops choosing or you've completed at least 3 trials.
• At the end, you rank the items by how often they were selected. The item chosen first, most often? That's your top preference.

Why do we rearrange? To control for position bias — learners sometimes just grab whatever is closest or on the left. Rearranging helps ensure the choices reflect actual preference.

This method is efficient and gives you a ranked list of preferences fairly quickly.

## 2. Paired Stimulus (PS) / Forced Choice

This method is more systematic and is great for learners who need a cleaner, simpler choice.
• You present two items at a time and record which one the learner chooses.
• You rotate through every possible pairing of your item set.
• At the end, you calculate the percentage of times each item was selected across all trials.
• Higher percentage = higher preference ranking.

This gives you very precise data. The tradeoff? It takes longer because you're running every combination.

It's especially useful when you want to compare specific items against each other — "Does Tommy prefer the iPad over the Legos? Does he prefer Legos over the ball?" You get a clear hierarchy.

## 3. Free Operant (Naturalistic Observation)

This one looks different from the other two — there's no structured trial, no presenting items one by one.
• You place multiple items in the environment — on a table, spread around the room.
• The learner has free access with no demands made of them.
• You observe and record: How long do they engage with each item? How close do they go to it? Do they return to it repeatedly?
• Duration of engagement and frequency of interaction are your indicators of preference.

This method is especially valuable for learners who don't respond well to structured choice formats, or for identifying preferences in a more natural context. It also captures things like sensory items or movement-based preferences that might not show up in a traditional assessment.

## The Position Bias Warning

The slide has a warning at the bottom: "Always present items in a counterbalanced order to control for position bias."

This applies especially to MSWO and Paired Stimulus. Some learners will consistently pick whatever is on their left, or whatever is in the center. If you never rearrange or rotate positions, your data is meaningless — you're measuring position preference, not item preference.

Counterbalancing means you systematically vary which positions items appear in across trials. Your BCBA will tell you how to do this for your specific learner, but the principle is something you need to understand and apply.

## RBT Reminders for B.1

Your role in preference assessments is to administer the assessment accurately as trained by your BCBA. That means:
• Following the exact procedure for whichever method is in your learner's program.
• Recording data correctly.
• Not accidentally prompting the learner toward a specific item.
• Not "skipping" the reassessment because you already know what your learner likes.

Preference can shift. Always run the assessment.

## B.2 — Skill Strengths and Deficit Assessments

Now that we know how to identify what motivates a learner, let's talk about identifying what they can and can't do — which is exactly what skill assessments are for.

Skill assessment is how BCBAs figure out where to start teaching. If we don't know what a learner already has in their repertoire, we might waste time teaching things they already know, or we might skip foundational skills they need.

## Types of Skill Assessments

There are three major categories here.

1. Curriculum-based assessment. These assessments are tied to specific, structured ABA curricula. You'll likely hear names like:
• VB-MAPP (Verbal Behavior Milestones Assessment and Placement Program)
• ABLLS-R (Assessment of Basic Language and Learning Skills – Revised)
• AFLS (Assessment of Functional Living Skills)

Each of these tools organizes skills into domains and skill levels. The BCBA uses the assessment to identify which milestones the learner has already achieved and which ones represent gaps — those gaps become teaching targets. These are comprehensive and detailed. A VB-MAPP assessment, for example, evaluates hundreds of skills across language, social, and learning behaviors.

2. Developmental assessment. This type compares a learner's skills to typical developmental milestones — what a child of a certain age would typically be expected to do. The domains usually include:
• Communication — expressive and receptive language
• Motor skills — fine motor and gross motor
• Social development — interaction, play, theory of mind
• Adaptive behavior — self-care, daily living

Developmental assessments help the team understand where delays exist across the board and can also guide referrals to other specialists — occupational therapy, speech therapy, and so on.

3. Social skills assessment. This evaluates a learner's ability to interact with peers and adults in socially appropriate ways. Methods can include:
• Direct observation in natural settings or structured play
• Role-play scenarios to see how the learner responds
• Rating scales filled out by parents, teachers, or clinicians

Social skills deficits are common in the populations we serve, and this assessment helps identify very specific skills to target — like how to initiate a conversation, how to take turns, or how to respond to being told no.

## The RBT's Role in Skill Assessment

This is where your day-to-day role comes in. Let's go through each bullet on the slide.

"Administer probes under BCBA direction." You will be given probe protocols by your BCBA. Your job is to follow them precisely. Probes are how we gather baseline data and track progress.

"Use standardized procedures — no prompting during baseline probes." This is critical. If you prompt during a baseline probe, you contaminate the data. We need to know what the learner can do independently. Even a subtle gesture or expression can function as a prompt. Keep your face neutral, your body language neutral, and do not help.

"Record data accurately using agreed-upon codes." You'll be recording things like correct (C), incorrect (I), or no response (NR). Use the exact coding system your BCBA has established. Consistency is everything.

"Score responses correctly." Make sure you know what counts as a correct response for each target. "Close enough" is not a data category. If you're unsure, ask before the session, not during.

"Report data to the supervising BCBA promptly." Don't let data sheets pile up. Your BCBA is making clinical decisions based on what you're collecting. Timely reporting matters.

"Maintain consistency across sessions." You want the data you collect to be comparable across days. That means presenting materials the same way, using the same language, and using the same timing.

"Communicate any concerns." If you notice the learner seems to be performing worse than usual, or if you're unsure whether a response should be scored as correct, flag it. Your clinical observation is valuable.

## Supervision Reminder

The slide closes with: "All assessments must be conducted under the direction and supervision of a BCBA."

This isn't just a legal disclaimer. It's there because assessment in ABA requires clinical judgment that goes beyond the RBT's scope. Your BCBA decides which assessments to run, how to interpret the results, and what to target next. Your job is to administer and record accurately.

## B.3 — Functional Assessment Procedures

We've talked about what motivates learners and what skills they have. Now we're talking about behavior — specifically, problem behavior — and the fundamental question in ABA: why is this behavior happening?

This is the core of functional assessment. And it's one of the most important concepts in the field, because if we don't know why a behavior is occurring, any intervention we design is just a guess.

Behavior doesn't happen randomly. Every behavior has a function — a reason it has been maintained over time. And that reason is always rooted in what happens in the environment: what comes before the behavior and what comes after it.

## The Four Functions of Behavior

The slide shows four functions. Let's make sure these are crystal clear:
1. Attention — The behavior is maintained by getting attention from other people. Example: a learner starts yelling, and every time they do, the teacher comes over. The teacher's attention is reinforcing the yelling.
2. Escape / Avoidance — The behavior is maintained by getting out of something aversive — a task, a demand, a sensory experience. Example: a learner throws their workbook and the session ends. Escape from the task reinforced the throwing.
3. Tangible / Access — The behavior is maintained by gaining access to a preferred item or activity. Example: a learner grabs a tablet, and instead of redirecting, the adult lets them use it. Access to the tablet reinforced the grabbing.
4. Automatic / Sensory — The behavior is maintained by the sensory feedback the behavior itself produces — it feels good, or it reduces discomfort. This one is maintained by internal reinforcement, not social consequences. Example: repetitive hand-flapping that provides sensory stimulation.

Understanding function means you can design interventions that target the root cause, not just suppress the behavior on the surface.

## Descriptive Assessment

There are two main types of functional assessment. The first is descriptive assessment, and this is where RBTs are most directly involved.

Indirect methods — these happen before you even observe the learner. They include:
• Interviews with parents, teachers, and other team members
• Rating scales and questionnaires
• Record review — looking at previous assessments, incident reports, medical records

These help generate hypotheses. They're not conclusive on their own, but they give valuable context.

Direct observation: ABC data — this is where you come in. ABC stands for Antecedent, Behavior, Consequence.
• Antecedent — What happened right before the behavior? What was the demand, the environment, the social context?
• Behavior — What exactly did the learner do? Describe it objectively and specifically.
• Consequence — What happened right after? Did the adult leave? Did the learner get something? Did the demand stop?

Over time, ABC data reveals patterns. If every episode of problem behavior is preceded by a demand and followed by the demand being removed, that's a strong sign the function is escape.

Scatter plots — these are another descriptive tool. You track when during the day problem behaviors occur — by time slot and by activity. Scatter plots can reveal patterns like: the behavior almost always happens right before lunch, or during math, or when a specific staff member is present.

Your RBT role in descriptive assessment: conduct observations and record ABC data accurately. No manipulation of the environment — you're observing what naturally occurs.

## Functional Analysis (FA)

This is the gold standard for identifying behavioral function, but it works very differently from descriptive assessment.

In a functional analysis, the environment is systematically manipulated. The team sets up specific conditions designed to test each possible function:
• Attention condition — The therapist withholds attention and delivers it only when the problem behavior occurs. If behavior is high in this condition, attention is likely the function.
• Escape condition — Demands are presented, and the problem behavior results in a brief break from demands. If behavior is high, escape is likely the function.
• Alone/Sensory condition — The learner is alone with no access to attention, tangibles, or demands. If behavior is high, automatic reinforcement is likely.
• Play condition (control) — Free access to attention and preferred items, no demands. This is the baseline. Behavior should be low here if it's maintained by social consequences.

By comparing rates of behavior across conditions, the BCBA can identify which condition produces the highest rate — and that points to the function.

Your RBT role in FA: implement the conditions exactly as trained. Collect frequency or rate data precisely. Do not deviate from the protocol.

## The Critical Warning

The warning at the bottom of this slide is non-negotiable, so I want to read it directly: "RBTs never design or independently conduct functional analyses. These require direct BCBA oversight."

A functional analysis involves deliberately evoking problem behavior — sometimes severe problem behavior. This carries real risk. It requires a clinician with the training and expertise to design safe procedures, monitor the learner, and make real-time decisions.

If someone ever asks you to run a functional analysis on your own, the answer is no. Always.

## Key Takeaways

Let's bring it all together.

B.1 — Preference Assessments: Use MSWO, Paired Stimulus, or Free Operant methods to identify reinforcers. Counterbalance item positions across trials. Re-assess frequently because preferences change.

B.2 — Skill Assessments: Administer probes per BCBA direction. Use curriculum-based, developmental, or social skill tools as assigned. Record data accurately — no prompting during baselines. Report to your BCBA promptly.

B.3 — Functional Assessment: Collect ABC data during descriptive assessments. Participate in functional analyses only under direct BCBA supervision. Never design or independently conduct an FA.

## The Golden Rule

The last line on this slide says it best: "RBTs always operate under BCBA supervision. When in doubt — ASK your supervisor."

This isn't a limitation on your role — it's a protection for your learner, for you, and for the integrity of the program. BCBAs have advanced clinical training. Your job is to implement with precision and to communicate openly. That partnership is what makes ABA work.

## Closing

Assessment is the foundation that everything else is built on. If reinforcers aren't identified correctly, teaching programs won't be effective. If skill levels aren't assessed accurately, targets will be wrong. If the function of behavior is unknown, interventions will miss the mark.

When you collect data carefully and consistently, you're not doing paperwork — you're contributing to clinical decisions that shape your learner's progress.

Any questions before we wrap up?
$transcript$
)
ON CONFLICT (id) DO NOTHING;
