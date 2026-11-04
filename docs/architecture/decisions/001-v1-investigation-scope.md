# 001 — V1 investigation scope

Status: Accepted

## Context

Incident Agent V1 should provide the smallest useful end-to-end incident investigation capability. We want to build the system incrementally so each capability can be tested and validated before expanding the investigation scope.

## Decision

V1 will:

- Be initiated manually by an engineer.
- Investigate one explicitly named service.
- Be read-only.
- Inspect that service's logs and metrics.
- Operate within a bounded investigation time window.
- Correlate available telemetry evidence.
- Distinguish observations and facts from hypotheses.
- Provide supporting evidence for substantive conclusions.
- Include counterevidence when relevant.
- Identify data gaps.
- Recommend next investigation or remediation steps.
- Support `insufficient evidence` as a valid investigation outcome.
- Never claim a definitive root cause when available evidence does not support that conclusion.

## Rationale

We want to establish a small, testable investigation loop before expanding the agent's capabilities. Limiting V1 to one service makes it easier to validate whether the agent correctly:

- Queries telemetry.
- Progressively investigates an incident.
- Correlates evidence.
- Avoids unsupported conclusions.
- Handles missing or insufficient evidence.

## Trade-offs

The agent may be unable to identify the actual cause when the problem originates outside the investigated service. This is acceptable. In such cases, the correct V1 result may be `insufficient evidence` with recommendations for further investigation.

## Deferred

Explicitly outside V1:

- Dependency telemetry investigation.
- Cross-service investigation.
- Deployment-event investigation.
- Automatic incident detection.
- Automatic remediation.
- Service restarts.
- Rollbacks.
- Deployments.
- Infrastructure modifications.
