# 006 — Agent query control

Status: Accepted

## Context

[ADR 001](001-v1-investigation-scope.md) requires a bounded, read-only investigation of one named service. [ADR 002](002-telemetry-stack.md) requires progressive Prometheus and Loki queries. The model needs room to follow evidence without gaining unconstrained control of backend query text, scope, or cost.

## Alternatives considered

- A fixed deterministic playbook is simple and predictable but cannot adapt much to the evidence retrieved.
- Arbitrary LLM-generated PromQL and LogQL offer flexibility but make scope, validity, and resource use harder to control.
- Supported query intents let the model choose a next line of inquiry while the application retains query construction and enforcement.

## Trade-offs

A finite intent set is easier to inspect and bound than free-form queries, but it may not express every useful investigation. The intent catalog itself needs maintenance as scenarios expand.

## Approved decision

The LLM selects from supported query intents. A deterministic coordinator validates each intent and executes only bounded, read-only queries within the named service, environment, and investigation time window. Unsupported investigations are reported as limitations. The model does not directly execute arbitrary backend queries.

## Reasoning

This division supports progressive investigation while keeping query scope and stopping behavior under application control. It is consistent with the accepted one-service, read-only V1 scope.

## Consequences

The coordinator must keep a query ledger and enforce query count, time-range, returned-volume, and runtime bounds. The exact numeric values and supported-intent catalog remain unresolved. Reaching a bound or an unsupported intent cannot justify an unsupported conclusion.

## Deferred options

Arbitrary LLM-generated queries may be evaluated in a future version, with separate controls and evidence that they improve investigations safely.
