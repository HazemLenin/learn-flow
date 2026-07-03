import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

/**
 * The signature screen: a console-style ledger of every mock email the
 * Notification service attempted, straight from the RabbitMQ consumer.
 */
export function NotificationsPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications,
    refetchInterval: 3000,
  });

  const newest = entries?.[entries.length - 1];

  return (
    <div className="page-enter">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Delivery feed</h1>
        <span className="relative flex size-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
      </div>
      <p className="mt-1 max-w-[65ch] text-muted">
        Every mock email the notification service attempted after consuming a{' '}
        <code className="font-mono text-sm">lecture.created</code> event.
        Addresses containing <code className="font-mono text-sm">fail</code>{' '}
        bounce on purpose: three attempts, then one summary to the instructor.
      </p>

      <div className="mt-8 font-mono text-sm">
        {isLoading && <p className="text-muted">Loading feed…</p>}
        {entries?.length === 0 && (
          <div className="rounded-lg border border-line p-8 text-center font-sans">
            <p className="font-medium">No deliveries yet.</p>
            <p className="mt-1 text-sm text-muted">
              <Link to="/" className="text-primary-strong underline">
                Open a course
              </Link>{' '}
              and publish a lesson to trigger the fan-out.
            </p>
          </div>
        )}
        {entries && entries.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[640px] text-left" data-testid="delivery-feed">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="px-4 py-2.5 font-semibold">status</th>
                  <th className="px-4 py-2.5 font-semibold">recipient</th>
                  <th className="px-4 py-2.5 font-semibold">attempts</th>
                  <th className="px-4 py-2.5 font-semibold">subject</th>
                  <th className="px-4 py-2.5 font-semibold">time</th>
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((entry, i) => (
                  <tr
                    key={`${entry.lectureId}-${entry.recipient}-${entry.timestamp}`}
                    className={`border-b border-line last:border-0 ${
                      entry === newest && i === 0 ? 'feed-new' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {entry.status === 'sent' ? (
                        <span className="text-primary-strong">✓ sent</span>
                      ) : (
                        <span className="text-red">✗ failed</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">{entry.recipient}</td>
                    <td className="px-4 py-2.5">
                      <span className={entry.attempts > 1 ? 'text-amber' : ''}>
                        {entry.attempts}/3
                      </span>
                    </td>
                    <td className="max-w-72 truncate px-4 py-2.5" title={entry.subject}>
                      {entry.subject}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
