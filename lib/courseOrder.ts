interface Orderable {
  title: string;
  created_at: string;
}

/**
 * Newest courses first, but courses added on the same day read in title order, so a
 * series uploaded together (Section A, B, C…) appears A→Z instead of reversed.
 */
export function sortCourseLibrary<T extends Orderable>(courses: T[]): T[] {
  return [...courses].sort((a, b) => {
    const day = b.created_at.slice(0, 10).localeCompare(a.created_at.slice(0, 10));
    return day !== 0 ? day : a.title.localeCompare(b.title, undefined, { numeric: true });
  });
}
