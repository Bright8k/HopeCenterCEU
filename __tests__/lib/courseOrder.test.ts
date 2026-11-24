import { sortCourseLibrary } from '@/lib/courseOrder';

describe('sortCourseLibrary', () => {
  it('puts newer days first and same-day courses in title order', () => {
    const courses = [
      { title: 'Foundations', created_at: '2026-07-22T16:54:07Z' },
      { title: 'Section F', created_at: '2026-10-13T20:05:30Z' },
      { title: 'Section A', created_at: '2026-10-13T18:45:03Z' },
      { title: 'Section C', created_at: '2026-10-13T19:40:53Z' },
      { title: 'Ethics', created_at: '2026-08-24T20:47:23Z' },
    ];
    expect(sortCourseLibrary(courses).map((c) => c.title)).toEqual([
      'Section A', 'Section C', 'Section F', 'Ethics', 'Foundations',
    ]);
  });

  it('orders numbered titles naturally and does not mutate the input', () => {
    const courses = [
      { title: 'Part 10', created_at: '2026-01-01T00:00:00Z' },
      { title: 'Part 2', created_at: '2026-01-01T00:00:00Z' },
    ];
    expect(sortCourseLibrary(courses).map((c) => c.title)).toEqual(['Part 2', 'Part 10']);
    expect(courses[0].title).toBe('Part 10');
  });
});
