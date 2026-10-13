-- Adds "ABA Exam Prep — Section F: Ethics for RBTs" as a draft STUDENT lesson
-- with its full transcript and follow-along slides (uploaded to course-slides separately).
-- Fixed UUID + ON CONFLICT keeps this idempotent.

INSERT INTO courses
  (id, title, description, track, category, ceu_value, pass_score, duration_seconds,
   quiz_required, status, is_published, slides_path, transcript)
VALUES (
  '20000000-0000-0000-0000-000000000006',
  'ABA Exam Prep — Section F: Ethics for RBTs',
  'Core principles and professional standards from the BACB ethics code: competence and supervision, confidentiality, public statements and social media, multiple relationships, gifts, and the interpersonal skills behind ethical practice.',
  'STUDENT',
  NULL,
  0,
  80,
  3000,
  false,
  'draft',
  false,
  '20000000-0000-0000-0000-000000000006/slides.pdf',
  $transcript$
## Introduction

Welcome, everyone. I'm really glad you're here today, because what we're going to talk about over the next 50 minutes isn't just a box to check — it's the foundation of everything you do as a Registered Behavior Technician.

Today's session is called Ethics for RBTs, and we're going to walk through the core principles and professional standards drawn directly from the BACB Ethics Code — the Behavior Analyst Certification Board's guiding document for our field.

Now, I know when people hear the word "ethics," they sometimes think: rules, restrictions, legal fine print. But I want to reframe that right from the start. Ethics isn't about what you can't do — it's about who you are as a professional. It's about how you show up for your clients, your supervisors, your families, and ultimately, for yourself.

As RBTs, you are on the front lines. You are often spending more direct, one-on-one time with clients than anyone else on the team. That means your ethical conduct isn't a background consideration — it's front and center in every session.

Over the next 50 minutes, we'll cover nine key areas:
• The core ethical principles that drive our work
• How competence and supervision intersect with ethics
• Confidentiality and what it really means day-to-day
• How social media and public statements fall under your professional responsibilities
• Multiple relationships and why they're risky
• Gift giving and receiving
• The interpersonal and professional skills that make ethical practice real
• And we'll close with a summary of your ethical commitment as an RBT

By the end of this session, my goal is that each of you walks out not just knowing the rules — but understanding why they exist and feeling equipped to navigate real situations you'll face in the field.

Let's get started.

## Core Ethical Principles

Everything in the BACB Ethics Code flows from a set of foundational principles. Think of these as the "why" underneath all the specific rules. There are three core principles I want you to hold onto throughout this entire presentation.

The first is: Benefit Others.

Every decision you make in your role as an RBT should come back to one question: is this in the best interest of my client? That's the north star. When you're unsure what to do in a situation — when something feels off but you can't quite put your finger on it — ask yourself: "Does this benefit my client?" If the answer is no, or even "I'm not sure," that's a signal to pause and consult your supervisor.

Prioritizing client wellbeing isn't just a nice idea — it's a professional obligation.

The second principle is: Compassion and Dignity.

Every individual you work with — every client, every family member, every colleague — deserves to be treated with respect. Full stop. Regardless of behavior, diagnosis, background, or history. This means how you talk about clients matters. How you talk to clients matters. The tone you use, the words you choose, whether you're having a hard day or an easy one — dignity is non-negotiable.

Compassion means we bring empathy to our work. It means we recognize that our clients and their families are often going through incredibly difficult things, and we show up for them with care.

The third principle is: Integrity.

Act honestly and transparently — at all times. This sounds simple, but let's think about what it means in practice. It means you accurately record data even when the session didn't go well. It means you tell your supervisor if you're struggling with something. It means you don't cut corners. It means your actions match your words.

These three principles — benefit others, compassion and dignity, and integrity — aren't just listed at the front of the ethics code for decoration. They should be live and active in your day-to-day work. When in doubt, come back to them.

Can you think of a real situation where one of these three principles might be tested?

## Competence Before Practice (F.2 and F.3)

The next area we're covering is competence, and specifically what the BACB ethics code says about the relationship between competence and practice.

The message here is clear: you provide services only after demonstrating competency. This is captured in sections F.2 and F.3 of the ethics code.

Demonstrate first. As an RBT, you are not expected to know everything on day one. No one is. But what is expected is that before you implement any procedure, technique, or intervention, you have been trained in it and you have demonstrated that you can do it correctly. This isn't about perfection — it's about having a foundation. You wouldn't expect a surgeon to perform an operation they've only read about in a textbook. The same logic applies here.

If a supervisor asks you to run a new program and you haven't been trained on it yet, the ethical response is not to wing it. The ethical response is to say: "I want to make sure I do this right — can we go over it together first?" That's integrity in action.

Stay supervised. Section F.3 is explicit: RBTs work exclusively under the supervision of BACB-qualified supervisors. This is not just a technicality — it's a safeguard. Supervision exists to protect your clients, to support your professional development, and honestly, to protect you.

Working without proper supervision — or taking on responsibilities beyond your scope of practice — puts everyone at risk. If you ever find yourself in a situation where you're being asked to do something you don't feel qualified to do, or where proper supervision isn't in place, that's a red flag that needs to be addressed immediately.

The good news is that supervision is a resource, not a restriction. A great supervisor helps you grow, catches your blind spots, and makes you a better RBT. Lean into it.

## Effective Supervision Practices (F.4)

Building on what we just covered, let's talk about what effective supervision actually looks like — because supervision that's happening in name only is not the same as supervision that actually develops skill and ensures quality.

Section F.4 of the ethics code frames supervision as a two-way commitment. That means both the supervisor and the RBT have responsibilities in this relationship.

The slide shows four key components of quality supervision:
• Modeling — the supervisor demonstrates correct techniques and procedures. This is how you learn what "good" actually looks like. If you've never seen a skill correctly modeled, it's very difficult to replicate it. Good supervisors don't just tell you what to do — they show you.
• Rehearsal — after seeing something modeled, you get to practice it with supervisor support. This is a low-stakes environment to make mistakes and refine your skills before you're doing it independently with a client.
• Instructions — clear, specific task directions. Vague instructions breed uncertainty. Good supervision includes clear guidance about what to do, when to do it, and why it matters.
• Feedback — timely, constructive performance feedback. This is essential. Feedback that comes two weeks later isn't as useful as feedback that comes right after a session while the experience is fresh. And feedback should be specific — not just "good job" or "that didn't work," but why it worked or didn't work and what to do differently.

One more important point from this section: supervisors must also conduct direct observation of RBT service delivery. Supervisors cannot ethically sign off on your work without actually seeing you work. That direct observation is how they ensure quality and consistency in the services your clients are receiving.

Think about it: what makes feedback feel helpful versus discouraging to you? How can you use that awareness in your own professional relationships?

## Confidentiality Requirements (F.5)

Alright — let's talk about confidentiality. This is one of the most practically important ethical obligations you have as an RBT, and it's one where mistakes can have serious real-world consequences.

Section F.5 of the ethics code is unambiguous: protecting client information is non-negotiable. There are three areas where your responsibilities are clear.

Collecting. Gather only what is necessary and relevant. This means you don't dig for extra personal information about clients out of curiosity. You don't ask family members invasive questions that aren't relevant to the services being provided. You collect the data you need to do your job — and nothing more. This is called the "minimum necessary" principle, and it shows up in healthcare and behavioral services alike.

Storing and protecting. All records — data sheets, session notes, progress summaries, any documentation tied to a client — must be secured from unauthorized access. That means physical documents stored safely, digital files password-protected, and client-related materials never left out in public spaces. If you're using any kind of app or software to record data, it needs to be compliant with privacy standards.

A common mistake that can happen innocently: leaving a data sheet on the front seat of your car, or having a client's name visible on your phone screen in public. These small things matter.

Disclosing. You share client information only with authorized parties and only as allowed by guidelines. That means you do not discuss client details with friends, family, or colleagues who are not directly involved in the case — even if you're not using the client's name. Even in casual conversation, if someone could identify who you're talking about, that's a breach of confidentiality.

Let me be direct: posting about clients on social media — even without names — is a confidentiality violation. Even saying "had such a tough session today with one of my kids" publicly could be inappropriate depending on what follows.

Confidentiality is trust. When clients and families let us into their lives, they are trusting us with deeply personal information. Honor that trust.

## Public Statements and Social Media (F.6)

This one is critically relevant for today's world: your professional responsibilities don't end when you clock out. They extend to how you present yourself publicly — including online.

Section F.6 of the ethics code covers public statements and social media. Here are the key points.

Never misrepresent your credentials or role. You are an RBT. That is a meaningful, valuable credential. But you are not a BCBA, and you should never imply otherwise — whether in conversation, on a LinkedIn profile, or in any public-facing context. Misrepresenting your qualifications harms the field and, more importantly, could mislead clients and families into making decisions based on false information.

Do not overstate service outcomes. You may feel genuinely excited about a client's progress, and that's wonderful — but making claims online like "ABA cures autism" or "my client went from zero words to full sentences in a week because of my work" is unethical. It sets unrealistic expectations, oversimplifies complex work, and reflects poorly on the profession.

Apply the same standards online as in person. If you wouldn't say something in a professional meeting, don't post it online. The tone and content of your online presence should be consistent with the values you bring to your work.

Think before you post — you represent the field. This is the bottom line. When you identify yourself as an RBT or behavioral health professional in any way — even on a personal account — you become a representative of this field in the eyes of the public. The field is still fighting for credibility and public trust. Your professionalism online contributes to or detracts from that effort.

And importantly, as the slide notes: social media activity is subject to BACB ethics standards. This isn't optional or separate from your professional obligations. It is part of them.

Do a quick mental audit — is there anything on your public social media that you wouldn't want a client's parent or your supervisor to see? That's a useful gut check.

## Multiple Relationships

Multiple relationships — also called dual relationships — are one of the most nuanced and frequently misunderstood areas of ethics for RBTs. This might be the most important topic we cover today in terms of practical, day-to-day relevance.

A multiple relationship occurs when you have more than one type of relationship with a client, a client's family, or even a colleague. The ethics code is clear: these relationships create ethical risk.

There are three categories of risk:
• Personal risks — becoming friends with clients, romantic interests, or social overlap. When a professional relationship blurs into a personal one, it becomes very difficult to maintain the objectivity and boundaries necessary to serve the client well. And if the relationship goes sour, who suffers? Often, the client.
• Financial risks — gifts, favors, side arrangements. The principle here is that financial entanglement outside of your official role creates conflicts of interest and puts your professional judgment at risk.
• Professional risks — role confusion, conflicts of interest, boundary violations. For example, if you're also a family friend of a client's household, you may receive information or be put in situations that compromise your ability to be an impartial professional.

The slide also shows how to mitigate each category:
• Maintain clear social boundaries
• Adhere to all financial policies
• Prioritize your official role duties

Now — the ethics code also acknowledges that sometimes multiple relationships are unavoidable. The example on the slide is rural communities, where you might already know someone personally before beginning a professional relationship. In those cases, the guidance is:
1. Disclose to your supervisor immediately.
2. Document the situation.
3. Take steps to minimize impact on services.

The key takeaway is this: dual relationships are not always avoidable, but they are always manageable — if you're transparent and proactive. The ethical mistake isn't being in a difficult situation; it's hiding it or ignoring it.

## Gift Giving and Receiving

Gift giving and receiving might seem like a small, even pleasant topic — but it's an area where well-meaning people can inadvertently create serious ethical problems.

Let's start with the default position: avoid giving or accepting gifts from clients or families.

This isn't about being cold or ungrateful. It's about maintaining the integrity of the professional relationship. Here's why gifts are ethically complex.

The risk: gifts can create obligation, bias, or boundary confusion. When a family gives you a gift, even a small one, it subtly shifts the dynamic. You may feel obligated to them in ways that unconsciously influence how you do your job. You might be more lenient with a difficult client. You might feel guilty documenting a behavior accurately. You might start seeing the family as friends rather than clients. These shifts can be slow and hard to notice — but they're real.

Similarly, if you give gifts to clients or families, you risk blurring the professional boundary, creating expectations, or giving the impression of favoritism.

When in doubt: consult your supervisor before accepting anything. There are situations that feel gray. A family bakes holiday cookies for the whole team. A client draws you a picture. A parent offers a $5 gift card at the end of the year as a thank-you. These feel different from, say, a cash gift or an expensive item — and they might be handled differently depending on your agency's policies.

The rule is simple: when in doubt, ask first. Before you accept anything, check in with your supervisor. Your agency likely has a specific gifts and gratuities policy. Know it. Follow it.

And if you do find yourself in a situation where refusing a gift would genuinely cause harm to the therapeutic relationship — say, it would deeply offend a family whose cultural practice it is to give gifts — document it and report it to your supervisor. That context matters.

The guiding question: does accepting this gift affect my ability to be a fair, objective professional for this client?

## Interpersonal and Professional Skills

We've covered a lot of rules and requirements. Now I want to shift to something a little different — the skills that allow you to live out ethical practice every day. Because ethics isn't just about avoiding violations. It's about actively being a great professional.

This slide gives us four core interpersonal and professional skills, and I love how it frames them: how you show up matters as much as what you do.

Active listening. Be fully present — hear what clients and supervisors are saying. This sounds obvious, but it's harder than it looks. Active listening means you're not thinking about your next task, your phone, or your personal worries while someone is talking to you. It means you track what's being said, ask clarifying questions, and reflect back understanding. With clients, this builds trust. With supervisors, it demonstrates professionalism and helps you actually improve.

Accepting feedback. Receive it openly and use it to grow. This is a big one. Feedback can sometimes feel personal or critical, especially when you care about your work. But feedback is information — and it's one of the most valuable things your supervisor can give you. An RBT who responds defensively to feedback stops growing. An RBT who asks "How can I do this better?" becomes exceptional.

Collaboration. Seek input, work as a team, and share knowledge. You are not alone in supporting your clients. BCBAs, SLPs, OTs, teachers, parents — there's often a whole team involved. Ethical practice includes working with that team, not siloing yourself. Share relevant observations. Ask questions across disciplines. The client benefits when everyone works together.

Cultural humility. Identify personal biases and remain responsive across cultures. Cultural humility is ongoing — it's not a one-time training. It means recognizing that your cultural background shapes how you see the world, and that your clients' cultural backgrounds shape theirs. It means you don't assume your way is the default. It means you remain curious, ask respectful questions, and adapt your approach.

These four skills are the difference between an RBT who technically follows the rules and one who is truly excellent in their role.

## Your Ethical Commitment as an RBT

We've covered a lot of ground today. And I want to close not with a list of rules to memorize, but with a framework — four commitments that capture what it means to be an ethical RBT.

01 — Uphold Core Principles. Benefit others, act with integrity, treat all with dignity. These three principles are your compass. When you're in a difficult situation, when you're unsure, when things feel murky — come back to these. They will almost always point you in the right direction.

02 — Practice Within Your Scope. Stay competent, supervised, and within your role. You are powerful within your scope. Know what that scope is, work confidently within it, and resist the pull to operate outside it — no matter how well-intentioned. If you see a gap between what a client needs and what you're equipped to provide, the answer is to communicate that to your supervisor, not to improvise on your own.

03 — Protect and Represent. Guard confidentiality and represent the field honestly. You are a steward of your clients' privacy and a public face of the behavioral health profession. Both of those responsibilities are real and significant. Take them seriously — in session, in documentation, in conversation, and online.

04 — Grow Continuously. Embrace feedback, cultural humility, and professional development. Ethics is not static. The field evolves, clients' needs evolve, and you evolve. The commitment to growth is itself an ethical act. Seek out supervision. Pursue training. Stay curious. Remain humble.

I want to end with this.

You chose this field because you want to make a difference in people's lives. And you do. Every session, every data point, every moment of genuine connection with a client — that matters. Ethics is what makes that work sustainable and trustworthy.

The families who hand their children over to you are trusting you with what is most precious to them. The ethics code exists to honor that trust.

Go out there and live it — not because you're required to, but because you believe it.

Thank you.
$transcript$
)
ON CONFLICT (id) DO NOTHING;
