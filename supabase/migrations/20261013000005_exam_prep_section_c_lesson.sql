-- Adds "ABA Exam Prep — Section C: Behavior Acquisition" as a draft STUDENT lesson
-- with its full transcript and follow-along slides (uploaded to course-slides separately).
-- Fixed UUID + ON CONFLICT keeps this idempotent.

INSERT INTO courses
  (id, title, description, track, category, ceu_value, pass_score, duration_seconds,
   quiz_required, status, is_published, slides_path, transcript)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  'ABA Exam Prep — Section C: Behavior Acquisition',
  'Covers task list items C.1–C.11: reinforcement, conditioned reinforcers, discrete trial and naturalistic teaching, chaining, discrimination training, prompting, generalization, maintenance, shaping, and token economies.',
  'STUDENT',
  NULL,
  0,
  80,
  3000,
  false,
  'draft',
  false,
  '20000000-0000-0000-0000-000000000003/slides.pdf',
  $transcript$
## Introduction

Welcome, everyone. Today we're diving into Section C of the BACB Task List — Behavior Acquisition. Whether you're preparing for the exam, deepening your clinical practice, or training new staff, this section is at the heart of what we do as behavior analysts.

Section C covers the core procedures we use to teach — not just manage behavior, but build new skills. We're talking about reinforcement, conditioning, discrete trial teaching, naturalistic instruction, chaining, discrimination training, prompting, generalization, maintenance, shaping, and token economies.

That's a lot of ground to cover, but by the end of the next 50 minutes, you'll have a clear, clinically grounded picture of each competency and how they connect in practice.

Let's get started.

## What We'll Cover

Here's our roadmap for today. We've organized Section C's 11 competencies into four chunks.

We'll start with C.1 and C.2 — reinforcement procedures and conditioned reinforcers — the absolute foundation of everything else we do.

Then we'll move to C.3 and C.4 — the how of teaching: discrete trial and naturalistic formats.

After that, C.5 through C.7 — chaining, discrimination training, and prompting. These are the instructional mechanics we use within those teaching formats.

And finally, C.8 through C.11 — the longer game: generalization, maintenance, shaping, and token economies.

I want this to be interactive, so please ask questions as they come up. We'll move through this together.

## C.1 — Positive and Negative Reinforcement

Alright, C.1. Reinforcement. This might feel like review, but I want to push past the definition and talk about implementation quality.

We all know the definition: reinforcement is a consequence that increases the future probability of a behavior. But knowing the definition and actually engineering effective reinforcement in a session are two different things.

Let's talk about the three dimensions on this slide.

Timing. Reinforcement must be delivered immediately and contingently. Immediately means right after the behavior — within a second or two for most learners, especially early in acquisition. Contingently means only when the behavior occurs. If you're delivering reinforcement regardless of whether the target behavior happened, you're not actually reinforcing that behavior. You might be reinforcing whatever the learner was doing when you gave the reinforcer. This is especially critical with learners who have limited language — they can't connect a delayed consequence to an earlier behavior the way a typical adult can.

Schedules. During acquisition — when a skill is brand new — we use continuous reinforcement, meaning every correct response gets reinforced. Why? Because we want to maximize the strength of the association between the behavior and the consequence. Once the behavior is occurring consistently and reliably, we thin the schedule — moving to fixed or variable ratio, or interval schedules. Thinning is essential for durability. Skills that are only maintained on continuous schedules tend to deteriorate quickly when the reinforcer isn't always available, which is almost always the case in the natural environment.

Dimensions. Here's something practitioners sometimes overlook: you need to vary what you're reinforcing with. Magnitude, intensity, type. If you give a learner the same item every session, satiation sets in — the reinforcer loses its value. A preference assessment at the start of a session isn't just a nice-to-have; it's a clinical necessity. You're calibrating your reinforcer to the learner's current motivation.

And quickly — on negative reinforcement: this is the removal of an aversive stimulus contingent on behavior, which increases that behavior. This is underused and sometimes misunderstood in practice. It's not punishment. A learner who gets to remove a heavy backpack after walking a certain distance — that's negative reinforcement of walking. We need to be intentional about how we use it, but it's a legitimate and powerful tool.

Any questions so far on C.1?

## C.2 — Conditioned Reinforcers

Moving to C.2 — conditioned reinforcers. This is about making stimuli become reinforcers that weren't before.

Unconditioned reinforcers — food, water, warmth, sensory stimulation — work immediately because of biology. We don't have to teach a hungry person that food is reinforcing. But conditioned reinforcers are learned. They acquire their value through pairing with reinforcers that already have value.

The classic example is money. Money has no intrinsic value — it's paper — but because it has been reliably paired with the ability to obtain things we want, it becomes a powerful conditioned reinforcer. Tokens in a token economy work the same way.

The pairing procedure is straightforward in principle: you present the neutral stimulus — a token, a checkmark, the words "nice job!" — immediately before or alongside a known reinforcer, consistently and repeatedly. Over time, the neutral stimulus acquires reinforcing value on its own.

The clinical implication of C.2 is enormous. When a learner doesn't respond to social praise, that's not a personality trait — it's a learning history. Praise hasn't been reliably paired with meaningful reinforcers for that learner. We can build that pairing. This is how we expand a learner's reinforcer menu and move toward more naturalistic reinforcement over time.

In your programs, ask yourself: what stimuli am I systematically pairing? Are check marks, praise, and points actually functioning as conditioned reinforcers, or am I assuming they are? You can test this — deliver the conditioned reinforcer alone and see if it maintains behavior. If it doesn't, more pairing is needed.

## C.3 and C.4 — Teaching Formats

Now we get to the teaching formats — C.3, Discrete Trial Teaching, and C.4, Naturalistic Teaching. These aren't competing philosophies. They're tools, and like all tools, you choose based on what you're building.

DTT — Discrete Trial Teaching — has a clear structure: antecedent, response, consequence, with an inter-trial interval. You present a clear SD, the learner responds, you deliver a consequence, and then there's a brief pause before the next trial. It's massed and structured, which means it's excellent for building foundational skills — receptive identification, imitation, early matching — and for isolating a skill to teach it clearly.

The strengths of DTT: control, repetition, clear data collection, and the ability to build complex skills through practice. The limitations: it can feel artificial, and skills learned in DTT don't always generalize spontaneously. That's not a reason to avoid DTT — it's a reason to plan for generalization explicitly, which we'll get to in C.8.

Naturalistic Teaching — NET and incidental teaching — flips the model. Instead of the practitioner controlling the antecedent, the learner's motivation in the moment drives instruction. You follow the learner's lead, embed instruction in ongoing activities, and use the natural environment as your classroom.

The strengths here: built-in generalization, high motivation, and functional skill use from the start. The limitation: it requires a highly skilled practitioner to identify and capture teaching opportunities in real time, and it can be harder to get the repetition needed for some learners.

Best practice: most comprehensive programs use both. DTT to build and sharpen skills; NET to practice and generalize them. The question isn't DTT versus naturalistic — it's how you sequence and balance them for each individual learner and goal.

## C.5 — Task Analyzed Chaining

C.5 — Chaining. Chaining is how we teach complex, multi-step behaviors. The first step is a task analysis: breaking the terminal skill into discrete, teachable steps in a logical sequence. A good task analysis is objective enough that two practitioners can look at it and agree on what "correct" looks like for each step.

Once you have your task analysis, you choose a chaining method. Three options on this slide:
• Forward chaining — you teach step one to mastery, then add step two, and so on. The learner builds the chain from the beginning. The practitioner prompts or completes the remaining steps until they're taught. This is good when the first steps are foundational and mastering them builds momentum.
• Backward chaining — you teach the last step first. The learner always ends the chain independently, which means they always contact the terminal reinforcer on their own. This can be powerful for motivation. Think of teaching someone to tie their shoes: you complete all the steps and just have them do the final pull-through — they still experience the success of "tying their shoes."
• Total task — every step is practiced in every session. You prompt where needed and reinforce the whole chain. This works well for learners who already have some of the component behaviors and need practice integrating them, or for shorter chains.

How do you choose? Consider the learner's prerequisite skills, the length and complexity of the task, and how much instructional time you have. A learner with strong imitation skills and a short task might do well with total task. A longer chain with a learner who fatigues easily might benefit from backward chaining to maintain motivation.

## C.6 and C.7 — Discrimination Training and Prompting

C.6 and C.7 together — discrimination training and prompting. These go hand in hand.

Discrimination training is about establishing stimulus control — getting a behavior to occur in the presence of the correct stimulus (the S-plus, or SD) and not in the presence of irrelevant or incorrect stimuli (the S-delta). This is foundational to almost every skill we teach. Receptive language, matching, following instructions — all of these require discrimination.

Clear stimulus control procedures mean: your SD is consistent and unambiguous, you're conducting enough practice to build the discrimination, and you're systematically varying the S-deltas so the learner responds to the relevant feature, not an inadvertent cue. Inadvertent cues — positional cues, examiner gaze, the order you present stimuli — are a major source of false positives in skill programs. If a learner is consistently picking the third item from the left, they haven't learned the discrimination — they've learned your presentation pattern. Randomize. Rotate.

Prompting — C.7 — is what we use to occasion correct responding while the learner is still acquiring a skill. The key principle: prompts are temporary. They are training wheels. The goal from the moment you introduce a prompt is to fade it systematically.

There are several fading approaches:
• Errorless learning involves prompting before the error occurs — you deliver a full prompt and gradually reduce support.
• Least-to-most prompting starts with the minimal prompt and escalates only if the learner doesn't respond.
• Stimulus fading gradually modifies the stimulus itself to transfer control.
• Time delay inserts increasing pauses between the SD and the prompt, giving the learner the opportunity to respond independently.

Which you use depends on the learner, the skill, and your data. The wrong prompt strategy can cause prompt dependency — a learner who can only perform in the presence of a prompt. The data should show you whether prompting is serving as a scaffold or a crutch.

## C.8 and C.9 — Generalization and Maintenance

C.8 and C.9 — generalization and maintenance. These are often treated as afterthoughts, and that's a clinical mistake.

Generalization means the skill works outside of where it was taught. If a learner can label colors at a table with you, but can't label colors in the grocery store, the behavior hasn't generalized. It's trained, not learned.

We promote generalization by programming for it during instruction — not hoping it happens afterward. That means varying the instructors, the settings, the stimuli, the materials. Use multiple examples. Conduct sessions in different rooms, with different people, with different versions of the training materials. If a learner only practices with one flashcard set, they've learned to respond to those cards, not to the concept.

A useful framework: train loosely once a skill is acquired — introduce variation systematically. Use natural maintaining contingencies — make sure the skill connects to reinforcement in the real world, not just in sessions.

Maintenance is about what happens to skills over time. C.9 asks us to distinguish between acquisition procedures — dense reinforcement, high-support teaching — and maintenance procedures — thinned schedules, fluency practice, distributed review.

A common mistake: once a skill hits mastery criteria, it disappears from the program. Months later, it's gone. Skills need to be maintained. Rotate mastered targets into maintenance review. Use fluency-building activities. Gradually thin the reinforcement schedule so the behavior persists without constant reinforcement.

Acquisition and maintenance aren't opposites — they're two phases of the same process. Plan for both.

## C.10 — Shaping

C.10 — Shaping. Shaping is one of the most elegant procedures in our toolkit, and also one of the most frequently misapplied.

Shaping is the use of differential reinforcement of successive approximations to build a behavior that doesn't currently exist in the learner's repertoire. You can't wait for a behavior to occur if it never occurs — so you start with what is occurring and gradually shift the criterion toward the target behavior.

The three-step logic on this slide:
1. Define the terminal behavior clearly. What does success look like? This needs to be objective and measurable. "Speaks clearly" isn't a terminal behavior. "Produces a three-word phrase at a conversational volume" is.
2. Identify the starting approximation. What is the learner currently doing that most resembles the target? That's your starting point. Reinforce it.
3. Raise the criterion gradually. As the behavior improves, stop reinforcing the old approximation and only reinforce the closer one. This is where shaping gets hard. Raise the criterion too fast and you lose the behavior. Raise it too slowly and you get stuck — or worse, you inadvertently reinforce an intermediate form that becomes rigid.

Shaping requires real-time clinical judgment. It's not a protocol you can write down step by step and hand off — it requires a practitioner who knows the learner and can read what's happening in the session. That's both its strength and its challenge.

## C.11 — Token Economies

Our last competency: C.11 — Token Economies. Token economies are a structured application of conditioned reinforcement — which brings us full circle to C.2.

A token economy has four core components, all on this slide.

Target behaviors. You need to define exactly which behaviors earn tokens. The system breaks down when it's ambiguous. Every team member needs to know precisely what earns a token and what doesn't. Operational definitions aren't optional.

Token delivery. Tokens must be delivered immediately and contingently — same principles as reinforcement in C.1. Pair delivery with specific, behavior-specific praise: not just "good job," but "I'm giving you a token because you kept your hands to yourself during that whole activity." This strengthens the conditioned value of the token and communicates clearly to the learner.

Backup reinforcers. This is where many token economies fail. If the backup reinforcers lose their motivating value — because they're stale, too hard to earn, or always the same — the tokens lose their value too. Run preference assessments regularly. Offer a varied menu. Let the learner have input when possible.

Exchange schedule. Establish a predictable exchange schedule — the learner needs to know when and how they can trade tokens for backup reinforcers. As the learner's skills and tolerance strengthen, gradually thin the ratio. The goal is a learner who can work toward delayed reinforcement, which maps onto real-world contingencies.

Token economies are flexible, powerful, and highly individualized when done well. They're also frequently implemented inconsistently — which undermines them. Fidelity monitoring for token economy implementation is essential.

## Wrap-Up

Alright — let's bring it all together.

Section C is fundamentally about how we build skills — and every procedure we covered today connects to the others. Reinforcement makes teaching possible. Conditioned reinforcers expand our toolkit. DTT and naturalistic teaching give us flexible formats. Chaining, prompting, and discrimination training are the mechanics within those formats. Generalization and maintenance ensure skills are real and lasting. Shaping lets us build skills that don't yet exist. And token economies let us create structured, sustainable reinforcement systems.

None of these procedures works in isolation. Effective behavior acquisition programs layer these tools thoughtfully — choosing them based on the learner, the skill, and the data.

If there's one theme across all of Section C, it's this: be intentional. Know why you're choosing the procedure you're choosing. Know what data will tell you whether it's working. And adjust.

Thank you for your time today. I'll open it up for questions now — what do you have?
$transcript$
)
ON CONFLICT (id) DO NOTHING;
