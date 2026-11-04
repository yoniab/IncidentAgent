# 003 — V1 data and security boundary

Status: Accepted

## Context

Production telemetry may contain customer information, credentials, internal infrastructure information, and other sensitive data. Building production-grade telemetry sanitization and multi-tenant security would significantly expand V1.

## Decision

V1 will operate using **synthetic/local telemetry only**. V1 is single-user and single-tenant, and is not intended to process real customer or production telemetry.

Raw synthetic telemetry may be sent to the configured managed LLM without an application-level redaction layer.

Local secrets such as LLM API keys must remain outside source control. For local development, `.env` may contain actual local secrets and must be ignored by Git. A committed `.env.example` may describe required environment variables but must never contain real secrets.

## Rationale

The purpose of V1 is to validate the Incident Agent investigation workflow. Synthetic telemetry lets us exercise that workflow without prematurely implementing production data-governance infrastructure.

## Trade-offs

V1 must not be considered production-ready from a security or data-governance perspective. Additional controls will be required before real production telemetry can be processed.

## Deferred

- PII redaction/sanitization.
- Secret detection inside telemetry.
- Data residency policies.
- Model-provider retention policies.
- Multi-tenancy.
- Tenant isolation.
- Production authorization.
- Production credential management.
- Cloud/Kubernetes secret management.
