import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';

export function CoursesPage() {
  const queryClient = useQueryClient();
  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['courses'],
    queryFn: api.courses,
  });
  const seed = useMutation({
    mutationFn: api.seed,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });

  return (
    <div className="page-enter">
      <h1 className="font-display text-3xl font-bold">Courses</h1>
      <p className="mt-1 max-w-[65ch] text-muted">
        Buying a course publishes a payment event; the catalog picks it up and
        counts you in.
      </p>

      <div className="mt-8">
        {isLoading && <p className="text-muted">Loading courses…</p>}
        {isError && (
          <p className="text-red">
            Can't reach the catalog service. Start it with{' '}
            <code className="font-mono text-sm">npx nx serve catalog</code>.
          </p>
        )}
        {courses?.length === 0 && (
          <div className="rounded-lg border border-line p-8 text-center">
            <p className="font-medium">The catalog is empty.</p>
            <p className="mt-1 text-sm text-muted">
              Load four demo courses — two come with enrolled students so the
              notification flow works right away.
            </p>
            <Button
              className="mt-4"
              onClick={() => seed.mutate()}
              disabled={seed.isPending}
            >
              {seed.isPending ? 'Seeding…' : 'Seed demo courses'}
            </Button>
          </div>
        )}
        <ul className="divide-y divide-line" data-testid="course-list">
          {courses?.map((course) => (
            <li key={course.id}>
              <Link
                to={`/courses/${course.id}`}
                className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:bg-primary-soft/40 focus-visible:outline-2 focus-visible:outline-primary sm:px-3"
              >
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold group-hover:text-primary-strong">
                    {course.title}
                  </h2>
                  <p className="mt-0.5 max-w-[65ch] truncate text-sm text-muted">
                    {course.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline gap-5">
                  <span
                    className="inline-flex items-center gap-1.5 text-sm text-muted"
                    title="Enrolled students"
                  >
                    <Users className="size-3.5" aria-hidden />
                    {course.enrolledCount}
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    ${course.price.toFixed(2)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
