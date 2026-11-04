# 002 — V1 telemetry stack

Status: Accepted

## Context

V1 needs to inspect metrics and logs programmatically while supporting progressive, bounded investigation. The project should be easy to run locally while retaining a reasonable path toward future AWS/Kubernetes deployment.

## Decision

Use:

- **Prometheus** for metrics.
- **Loki** for logs.
- **Grafana Alloy** for log collection.
- **Grafana** optionally for human inspection; it is not required by the Incident Agent.

The Incident Agent should interact directly with Prometheus and Loki through their APIs rather than automating Grafana's UI.

### Metrics

Metrics must support time-range queries, filtering, aggregation, and bounded queries.

### Logs

Logs must support time-range queries, filtering by service/environment and relevant fields, bounded result volumes, and progressive narrowing or expansion of queries.

### Telemetry coverage

The investigation must reason about telemetry availability. An empty filtered query must **not** automatically mean nothing happened. The system should distinguish coverage states such as `available`, `partial`, `absent`, and `unknown`. The agent should preserve relevant telemetry query warnings and avoid treating missing data as evidence of normal behavior.

## Rationale

Prometheus and Loki satisfy V1's known-service and bounded-time-window investigation model without introducing the heavier operational requirements of an indexed search platform. They allow the telemetry environment to run locally while retaining credible migration paths toward Kubernetes and AWS.

## Trade-offs

Loki is weaker than systems such as OpenSearch for arbitrary full-text searches across very large log datasets. That capability is not currently required because V1 investigations begin with a known service and bounded time window.

Prometheus and Loki also expose different query models that the application will eventually need to handle.

## Deferred

- OpenSearch/full-text-oriented log architecture.
- CloudWatch-native telemetry.
- Large-scale distributed telemetry architecture.
- Production telemetry retention/scaling design.
- Cross-service tracing.
