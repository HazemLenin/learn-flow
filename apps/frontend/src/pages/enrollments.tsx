import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Badge } from '../components/ui/badge';
import type { EnrollmentStatus } from '../api/types';

const statusVariant: Record<EnrollmentStatus, 'active' | 'pending' | 'failed'> = {
  active: 'active',
  pending: 'pending',
  failed: 'failed',
};

export function EnrollmentsPage() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: api.enrollments,
  });
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: api.courses,
  });

  const titleOf = (courseId: string) =>
    courses?.find((c) => c.id === courseId)?.title ?? courseId;

  return (
    <div className="page-enter">
      <h1 className="font-display text-3xl font-bold">My enrollments</h1>
      <p className="mt-1 max-w-[65ch] text-muted">
        Every purchase attempt, including declined ones — a failed payment
        never blocks buying again.
      </p>

      <div className="mt-8">
        {isLoading && <p className="text-muted">Loading enrollments…</p>}
        {enrollments?.length === 0 && (
          <div className="rounded-lg border border-line p-8 text-center">
            <p className="font-medium">Nothing here yet.</p>
            <p className="mt-1 text-sm text-muted">
              <Link to="/" className="text-primary-strong underline">
                Browse the catalog
              </Link>{' '}
              and buy a course to see it appear.
            </p>
          </div>
        )}
        <ul className="divide-y divide-line" data-testid="enrollment-list">
          {enrollments?.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex flex-wrap items-baseline justify-between gap-3 py-4 sm:px-3"
            >
              <div className="min-w-0">
                <Link
                  to={`/courses/${enrollment.courseId}`}
                  className="font-display font-bold hover:text-primary-strong"
                >
                  {titleOf(enrollment.courseId)}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {enrollment.id} ·{' '}
                  {new Date(enrollment.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge variant={statusVariant[enrollment.status]}>
                {enrollment.status}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
