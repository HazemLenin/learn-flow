import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createBrowserRouter,
  NavLink,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from 'react-router-dom';
import { TEST_USER } from '../api/client';
import { Logo } from '../components/logo';
import { cn } from '../lib/utils';
import { CoursesPage } from '../pages/courses';
import { CourseDetailPage } from '../pages/course-detail';
import { EnrollmentsPage } from '../pages/enrollments';
import { NotificationsPage } from '../pages/notifications';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Shell() {
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
      isActive ? 'bg-primary-soft text-primary-strong' : 'text-muted hover:text-ink',
    );

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <NavLink to="/" aria-label="LearnFlow home">
            <Logo />
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={link}>
              Courses
            </NavLink>
            <NavLink to="/my-enrollments" className={link}>
              My enrollments
            </NavLink>
            <NavLink to="/notifications" className={link}>
              Delivery feed
            </NavLink>
          </nav>
          <span
            className="hidden font-mono text-xs text-muted sm:block"
            title="Fixed demo identity — no auth in this demo"
          >
            {TEST_USER.email}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: '/', element: <CoursesPage /> },
      { path: '/courses/:id', element: <CourseDetailPage /> },
      { path: '/my-enrollments', element: <EnrollmentsPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
