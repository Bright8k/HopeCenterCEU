-- Text transcript for course videos (WCAG 1.2.1 / 1.2.8 media alternative).
-- Lines starting with "## " render as section headings; blank lines separate paragraphs.

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS transcript TEXT;
