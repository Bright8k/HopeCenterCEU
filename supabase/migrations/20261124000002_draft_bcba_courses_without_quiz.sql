-- Follow-up to 20261124000001: the four BCBA placeholder courses were skipped because they have
-- seeded sample completions (test accounts only). They still have no quiz, so learners can't
-- complete them; move them to draft. Completions are kept.
update public.courses c
   set status = 'draft',
       review_note = 'Moved to draft: add quiz questions (3 per credit), an instructor, learning objectives, and a duration before it can award CEUs.'
 where c.track = 'BCBA'
   and c.status = 'published'
   and c.ceu_value > 0
   and not exists (select 1 from public.questions q where q.course_id = c.id);
