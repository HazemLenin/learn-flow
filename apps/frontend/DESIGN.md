# LearnFlow — Design System

## Mood
"Signal traveling a queue — everything acknowledged, green-lit."
The event system is the product; the UI borrows the vocabulary of message
delivery: acks, attempts, queues.

## Color (OKLCH, light theme — recruiters skim in daylight)
- `--bg` oklch(1 0 0) — pure white, no hidden warmth
- `--ink` oklch(0.22 0.02 140) — near-black, green-tinted
- `--primary` oklch(0.45 0.11 145) — deep pine green (brand, buttons, links)
- `--primary-soft` oklch(0.95 0.03 145) — tint for chips/hover
- `--muted` oklch(0.50 0.02 140) — secondary text (≥4.5:1 on white)
- `--line` oklch(0.90 0.01 140) — hairlines
- Semantic only: `--amber` oklch(0.65 0.13 75) retry/pending · `--red` oklch(0.55 0.19 25) failed

Strategy: restrained — white surface, green carries identity, amber/red are
earned by the retry/failure domain, never decorative.

## Type
- Display: **Space Grotesk** (headings, logo wordmark) — geometric, technical
- Body: **Inter**
- Data/log: **JetBrains Mono** — the voice of the event system (IDs, emails,
  attempts, the notification feed). Mono is semantic here: if it's mono, it
  came from the pipes.

## Signature element
The **delivery feed** (/notifications): a console-like ledger where each mock
email renders as a delivery record with attempt count and ack/fail state —
the RabbitMQ story made visible. Everything else stays quiet.

## Logo
Inline SVG wordmark: three chevrons flowing into a filled square (message
entering a queue) + "LearnFlow" in Space Grotesk.

## Motion
One page-level fade/rise on route content (180ms ease-out-quint), pulse on
the live feed's newest row. prefers-reduced-motion: everything instant.
