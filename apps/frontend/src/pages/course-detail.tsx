import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Radio } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';

export function CourseDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.course(id),
    enabled: !!id,
  });
  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: api.enrollments,
  });

  const myEnrollment = enrollments?.find(
    (e) => e.courseId === id && e.status !== 'failed',
  );

  const [simulateFailure, setSimulateFailure] = useState(false);
  const enroll = useMutation({
    mutationFn: () =>
      api.enroll({ courseId: id, amount: course?.price ?? 0, simulateFailure }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const addLesson = useMutation({
    mutationFn: () =>
      api.addLesson(id, {
        title: lessonTitle,
        content: lessonContent,
        order: (course?.lessons.length ?? 0) + 1,
      }),
    onSuccess: () => {
      setLessonTitle('');
      setLessonContent('');
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    },
  });

  if (isLoading) return <p className="text-muted">Loading course…</p>;
  if (!course) return <p className="text-red">Course not found.</p>;

  return (
    <div className="page-enter">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All courses
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-[65ch]">
          <h1 className="font-display text-3xl font-bold">{course.title}</h1>
          <p className="mt-2 text-muted">{course.description}</p>
          <p className="mt-3 font-mono text-xs text-muted">
            {course.enrolledCount} enrolled · instructor{' '}
            {course.instructorEmail}
          </p>
        </div>

        <div className="w-full max-w-xs rounded-lg border border-line p-5 sm:w-auto sm:min-w-64">
          <p className="font-mono text-2xl font-semibold">
            ${course.price.toFixed(2)}
          </p>
          {myEnrollment ? (
            <p
              className="mt-3 inline-flex items-center gap-2 font-medium text-primary-strong"
              data-testid="enrolled-state"
            >
              <CheckCircle2 className="size-4" aria-hidden />
              {myEnrollment.status === 'active' ? 'Enrolled' : 'Payment pending'}
            </p>
          ) : (
            <>
              <Button
                className="mt-3 w-full"
                onClick={() => enroll.mutate()}
                disabled={enroll.isPending}
                data-testid="enroll-button"
              >
                {enroll.isPending ? 'Processing payment…' : 'Buy this course'}
              </Button>
              <label className="mt-3 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="size-3.5 accent-[var(--color-primary)]"
                  data-testid="simulate-failure"
                />
                Simulate a declined payment
              </label>
              {enroll.isError && (
                <p className="mt-2 text-xs text-red" data-testid="enroll-error">
                  {enroll.error instanceof ApiError && enroll.error.status === 409
                    ? 'You already have an enrollment for this course.'
                    : 'Enrollment failed — check that the enrollment service is running.'}
                </p>
              )}
              {enroll.isSuccess && enroll.data.status === 'failed' && (
                <p className="mt-2 text-xs text-red" data-testid="payment-declined">
                  Payment declined. You can try again.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Lessons</h2>
        {course.lessons.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No lessons yet — publish the first one below.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-line" data-testid="lesson-list">
            {course.lessons.map((lesson) => (
              <li key={lesson._id} className="flex items-baseline gap-4 py-3">
                <span className="font-mono text-xs text-muted">
                  {String(lesson.order).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-sm text-muted">{lesson.content}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10 rounded-lg border border-line p-5">
        <h2 className="font-display text-xl font-bold">Publish a lesson</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Radio className="size-3.5 text-primary" aria-hidden />
          Publishing emits <code className="font-mono text-xs">lecture.created</code> —
          every enrolled student gets a mock email. Watch it land in the{' '}
          <Link to="/notifications" className="text-primary-strong underline">
            delivery feed
          </Link>
          .
        </p>
        <form
          className="mt-4 grid gap-3 sm:max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            addLesson.mutate();
          }}
        >
          <Input
            required
            placeholder="Lesson title"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            data-testid="lesson-title"
          />
          <Textarea
            required
            rows={3}
            placeholder="What does this lesson cover?"
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            data-testid="lesson-content"
          />
          <Button
            type="submit"
            disabled={addLesson.isPending}
            data-testid="publish-lesson"
          >
            {addLesson.isPending ? 'Publishing…' : 'Publish lesson'}
          </Button>
          {addLesson.isError && (
            <p className="text-xs text-red">Publishing failed — try again.</p>
          )}
        </form>
      </section>
    </div>
  );
}
