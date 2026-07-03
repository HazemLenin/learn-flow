/**
 * Brand mark: two chevrons (messages) flowing into a filled square (queue).
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="14"
          y="7"
          width="18"
          height="18"
          rx="4"
          className="fill-primary"
        />
        <path d="M2 12l6 4-6 4z" className="fill-primary" />
        <path d="M9 12l6 4-6 4z" className="fill-primary" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">
        LearnFlow
      </span>
    </span>
  );
}
