# Incident Agent V1 requirements

## Product goal

An engineer can report that a service is unhealthy and ask the Incident Agent to investigate. The agent inspects the service's logs and metrics, correlates the evidence, and returns a structured incident analysis.

The analysis contains:

- Observations.
- Likely causes or hypotheses.
- Supporting evidence.
- Counterevidence when present.
- Data gaps.
- Recommended next investigation steps.
- Recommended remediation steps when supported by the evidence.

V1 is intended to validate the smallest useful end-to-end incident investigation workflow.

## Approved V1 boundaries

The approved decisions define how V1 satisfies this product goal:

- [Investigation scope](../architecture/decisions/001-v1-investigation-scope.md): manual, read-only investigation of one named service within a bounded time window; `insufficient evidence` is a valid outcome.
- [Telemetry stack](../architecture/decisions/002-telemetry-stack.md): Prometheus metrics, Loki logs, and Grafana Alloy log collection, queried progressively and with bounds.
- [Data and security boundary](../architecture/decisions/003-data-security-boundary.md): single-user, single-tenant use of synthetic/local telemetry only.
- [Invocation model](../architecture/decisions/004-invocation-model.md): a synchronous CLI that communicates progress.
- [Evaluation strategy](../architecture/decisions/005-evaluation-strategy.md): representative synthetic incidents assess evidence grounding, uncertainty, relevance, actionability, and counterevidence handling.
