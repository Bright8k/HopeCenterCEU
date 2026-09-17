-- Allows admins to mark a course as part of a series with no standalone quiz.
-- Existing courses default to true so behaviour is unchanged.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS quiz_required BOOLEAN NOT NULL DEFAULT true;
