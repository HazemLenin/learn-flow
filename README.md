# LearnFlow — Mini E-Learning Platform

[![CI](https://github.com/HazemLenin/learn-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/HazemLenin/learn-flow/actions/workflows/ci.yml)

A scoped-down e-learning platform built to demonstrate **NestJS microservices communicating over RabbitMQ**, with independent data stores per service, in an Nx monorepo.

![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs) ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-4-ff6600?logo=rabbitmq) ![MongoDB](https://img.shields.io/badge/MongoDB-8-47a248?logo=mongodb) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql) ![Nx](https://img.shields.io/badge/Nx-23-143055?logo=nx)

## Architecture

```
                     ┌─────────────────────┐
                     │   Catalog  :3001    │
                     │   NestJS + MongoDB  │
                     │  courses / lessons  │
                     └─────┬─────────▲─────┘
     publishes lecture.created       │ consumes payment.completed
                           │         │ (idempotent $addToSet)
                     ┌─────▼─────────┴─────┐
                     │      RabbitMQ       │
                     │   durable queues    │
                     │     manual ack      │
                     └─────┬─────────▲─────┘
     consumes lecture.created        │ publishes payment.completed
                           │         │
      ┌────────────────────▼──┐   ┌──┴────────────────────┐
      │  Notification  :3003  │   │   Enrollment  :3002   │
      │  NestJS (in-memory)   │   │  NestJS + PostgreSQL  │
      │  mock email + retry   │   │ enrollments/payments  │
      └───────────────────────┘   └───────────────────────┘
```

### Event flows

1. **Buy a course** — `POST /api/enrollments` creates a pending enrollment, runs a mock payment, and on success publishes **`payment.completed`** `{ userId, userEmail, courseId, enrollmentId }`. Catalog consumes it and adds the student to the course (`$addToSet` — safe under event redelivery; `enrolledCount` is derived from the array).
2. **Publish a lecture** — `POST /api/courses/:id/lessons` publishes **`lecture.created`** carrying the enrolled students' emails (event-carried state — no synchronous callback between services). Notification emails each student with retry (exponential backoff 1s/2s/4s, max 3 attempts). If any student ultimately fails, the instructor gets **one** summary email listing all failures.

## Run it

```bash
npm ci
docker compose up -d          # RabbitMQ (+ mgmt UI :15672), MongoDB, PostgreSQL
npx nx run-many -t serve -p catalog enrollment notification frontend
```

Frontend: [http://localhost:4200](http://localhost:4200) — browse courses, buy one
(with an optional simulated decline), publish a lesson, and watch the **delivery
feed** show the notification fan-out live.

Swagger: [catalog](http://localhost:3001/api/docs) · [enrollment](http://localhost:3002/api/docs) · [notification](http://localhost:3003/api/docs)

### Demo the event flows

```bash
# 1. Seed courses (two come pre-enrolled, incl. fail.student@test.local)
curl -X POST localhost:3001/api/courses/seed

# 2. Buy a course → watch catalog consume payment.completed
COURSE_ID=$(curl -s localhost:3001/api/courses | node -pe "JSON.parse(require('fs').readFileSync(0)).find(c => c.enrolledCount === 0).id")
curl -X POST localhost:3002/api/enrollments -H "Content-Type: application/json" \
  -d "{\"userId\":\"user-1\",\"userEmail\":\"test.user@test.local\",\"courseId\":\"$COURSE_ID\",\"amount\":19.99}"

# add "simulateFailure": true to see a declined payment instead

# 3. Add a lesson to the pre-enrolled course → notification fan-out with
#    2 successes, 3 retries for the failing student, 1 instructor summary
SEEDED_ID=$(curl -s localhost:3001/api/courses | node -pe "JSON.parse(require('fs').readFileSync(0))[0].id")
curl -X POST localhost:3001/api/courses/$SEEDED_ID/lessons -H "Content-Type: application/json" \
  -d '{"title":"Brand new lecture","content":"...","order":10}'

# 4. Inspect the notification log
curl localhost:3003/api/notifications
```

## Tests

```bash
npx nx run-many -t test       # unit tests across all services
npx nx e2e frontend-e2e       # Playwright, needs docker + all 3 services running
```

Unit tests cover: payment success/failure and 409-duplicate logic, idempotent event handling, ack/nack behavior, retry backoff timing, single-instructor-summary guarantee.
Playwright drives the real stack end-to-end: browsing, buying (success, decline, duplicate, retry), publishing a lesson, and the delivery feed showing retries plus the instructor summary.

## Repo layout

```
apps/
  catalog/        NestJS + Mongoose  — courses, lessons, both event ends
  enrollment/     NestJS + TypeORM   — enrollments, mock payments
  notification/   NestJS             — email fan-out, retry, failure log
  frontend/       React + Vite + Tailwind — 4 screens incl. the delivery feed
  frontend-e2e/   Playwright         — full-stack end-to-end suite
libs/
  contracts/      shared event payloads, queue names, demo identities
```

## Conscious trade-offs (demo scope)

- **At-least-once delivery** — messages are acked after the whole notification batch; a crash mid-batch replays it, so duplicate emails are possible. Consumers are idempotent where it matters (catalog).
- **Mock payment & email** — deterministic simulations (`simulateFailure` flag; addresses containing `fail` always bounce). No real gateway/SMTP.
- **`synchronize: true`** — TypeORM auto-creates the schema for clone-and-run simplicity; production would use migrations.
- **No auth** — a fixed demo user/instructor from `libs/contracts`.
