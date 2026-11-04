# 007 — Log coverage strategy

Status: Accepted

## Context

[ADR 002](002-telemetry-stack.md) requires the agent to distinguish telemetry availability from normal service behavior. A filtered Loki query with no results cannot establish that the logging pipeline was working for the requested interval.

## Alternatives considered

- Infer coverage from broad log counts alone. This is simple but cannot distinguish a quiet service from a collection gap.
- Use collector or pipeline health alone. This can show pipeline problems but does not prove the named service emitted or delivered logs.
- Combine periodic synthetic-service heartbeat logs with collector/pipeline health information.

## Trade-offs

Heartbeats add synthetic telemetry and a coverage signal to maintain. They improve confidence about delivery but still do not prove that every event was captured. Pipeline health checks add another source of coverage information without expanding the incident investigation to another service.

## Approved decision

The synthetic service emits periodic heartbeat logs. The agent uses those heartbeats and collector/pipeline health information as coverage evidence. Missing heartbeats do **not** automatically mean the service is unhealthy. Coverage may remain `unknown` when the evidence cannot establish availability.

## Reasoning

The combined signals provide a stronger basis for distinguishing missing telemetry from a valid quiet interval while preserving [ADR 001](001-v1-investigation-scope.md)'s one-service investigation scope.

## Consequences

Coverage assessment must record the interval checked, the heartbeat and pipeline observations, and any uncertainty. The heartbeat cadence and rules for classifying `available`, `partial`, `absent`, or `unknown` are not set here.

## Deferred options

Production-grade end-to-end log delivery guarantees and coverage monitoring remain outside V1's synthetic/local telemetry boundary.
