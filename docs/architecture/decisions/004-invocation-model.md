# 004 — V1 invocation and execution model

Status: Accepted

## Context

We need the smallest testable interface through which an engineer can initiate an investigation. Introducing a web application, REST service, asynchronous job infrastructure, or messaging integration would add complexity that does not yet help validate the core investigation loop.

## Decision

V1 will expose a **CLI interface**. An engineer manually starts an investigation and provides the service and investigation time window. Investigations execute **synchronously**.

The CLI remains open while the investigation runs and should communicate progress as the agent performs its investigation. Investigation times on the order of tens of seconds are acceptable for V1.

The core investigation behavior should not be inherently coupled to the CLI so other interfaces can be introduced later.

## Rationale

A synchronous CLI provides the smallest end-to-end path from engineer request to telemetry investigation to structured result. It avoids introducing job management and UI concerns before the core investigation workflow has been validated.

## Trade-offs

Long-running investigations block the CLI session. V1 does not support background investigations, persisted investigation jobs, or later retrieval of results. This is acceptable for the initial bounded investigation workflow.

## Deferred

- Asynchronous investigation jobs.
- Background workers.
- Investigation IDs.
- Persisted investigation state.
- REST API.
- Web/chat UI.
- Slack/Teams integration.
- Automatic incident triggering.
