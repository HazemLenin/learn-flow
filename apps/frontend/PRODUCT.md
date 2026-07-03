# LearnFlow — Frontend

## What
Demo UI for an event-driven mini e-learning platform (NestJS microservices + RabbitMQ).
Four screens: course catalog, course detail (enroll / add lesson), my enrollments,
and a live notification log that makes the RabbitMQ event flow visible.

## Audience
Recruiters and engineers skimming a portfolio repo. They spend two minutes here;
the UI's job is to make the *event architecture* legible and feel crafted.

## Register
product — the design serves the demo; clarity over spectacle, but with a
distinct brand voice (this is a portfolio piece).

## The single job
Let a visitor trigger both event flows from the browser and *see* them work:
buy a course (payment.completed) and publish a lecture (lecture.created →
retries → instructor summary).

## Fixed demo identity
No auth. TEST_USER from @learn-flow/contracts is the acting student.
