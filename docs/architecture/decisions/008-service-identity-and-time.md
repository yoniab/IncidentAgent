# 008 — Service identity and time

Status: Accepted

## Context

Prometheus and Loki queries need consistent service and environment scope. The engineer supplies a time window through the synchronous CLI under [ADR 004](004-invocation-model.md). Ambiguous environment or timezone handling could produce convincing evidence from the wrong source or interval.

## Alternatives considered

- Use service name alone and an implicit environment. This reduces CLI input but hides query scope.
- Require the environment on every invocation. This makes scope explicit but adds friction for a single local environment.
- Default the CLI environment to `local` and display the resolved value.

Time intervals could be treated as closed at both ends or normalized to a half-open interval. A half-open interval gives adjacent windows a consistent boundary without counting the same instant twice.

## Trade-offs

The default reduces local invocation friction while requiring the CLI to make the resolved environment visible. Backend APIs may use different boundary conventions, so their query modules must translate from the internal interval deliberately.

## Approved decision

The core service identity includes `service` and `environment`. The CLI defaults environment to `local` and displays the resolved value. Timestamps are normalized to UTC. Internal investigation intervals are half-open: `[start, end)`.

## Reasoning

The decision keeps the local V1 path simple while making the actual telemetry selector and interval explicit in the investigation context.

## Consequences

Request validation must reject ambiguous or invalid time windows. Prometheus and Loki access modules must preserve the internal interval meaning when translating to backend queries. The exact CLI argument spelling and timestamp presentation are not decided here.

## Deferred options

Additional environment-discovery or service-catalog behavior is outside V1.
