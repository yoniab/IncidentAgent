# 009 — Application technology stack

Status: Accepted

## Context

[ADR 004](004-invocation-model.md) calls for a small synchronous CLI, and [ADR 003](003-data-security-boundary.md) permits synthetic telemetry to be sent to a configured managed LLM. The earlier architecture proposal recommended Python as one possible application language; architecture review selected a different stack. The observability stack remains fixed by [ADR 002](002-telemetry-stack.md).

## Alternatives considered

- Python supports a concise CLI and telemetry analysis, but would introduce a different application language than the one selected in architecture review.
- Node.js with TypeScript supports typed contracts throughout the selected application runtime, with the usual TypeScript build step.
- An agent framework could supply orchestration features, but would add another control layer over the intentionally bounded V1 investigation loop.
- A managed model through an AWS-oriented service could align with a later AWS deployment, but adds cloud setup to the local-first V1.

## Trade-offs

The OpenAI API is an external managed dependency and its SDK behavior is provider-specific. Avoiding an agent framework means the application owns its small investigation loop and query safeguards. Isolating provider-specific code reduces the cost of a later provider change without building a multi-provider framework now.

## Approved decision

Use Node.js and TypeScript for the application. Use the OpenAI API through the official SDK. Do not use an agent framework for V1. Keep provider-specific calls inside the LLM reasoning module.

## Reasoning

This stack supports the approved synchronous CLI and explicit, typed contracts while leaving query control with the deterministic coordinator rather than a framework or model tool loop.

## Consequences

The application needs a managed-model credential kept outside source control under [ADR 003](003-data-security-boundary.md). No Node.js/TypeScript version, package tooling, dependency set, or exact model is selected by this ADR. The exact model is chosen after synthetic-scenario evaluation.

## Deferred options

Other managed-model providers, a multi-provider abstraction, and agent frameworks may be reconsidered after V1 evidence warrants them.
