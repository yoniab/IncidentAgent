# 010 — Investigation result semantics

Status: Accepted

## Context

[ADR 001](001-v1-investigation-scope.md) accepts `insufficient evidence` as a valid analytical outcome, while [ADR 005](005-evaluation-strategy.md) requires evidence grounding and uncertainty handling. A telemetry or model failure must not be confused with a completed investigation that found too little evidence.

## Alternatives considered

- A single outcome field is compact but conflates investigation execution with the conclusion drawn from available evidence.
- Separate completeness and conclusion fields make the distinction explicit but enlarge the output contract.
- Relying only on a model-generated citation is simple but cannot establish that the cited evidence was retrieved or supports the claim.

## Trade-offs

The richer result contract requires validation and clear CLI rendering. Ledger validation can establish that a cited reference exists in the investigation, but cannot establish causal correctness or relevance by itself.

## Approved decision

The final result separates `completeness` from `conclusion`. It distinguishes a completed investigation with insufficient evidence from an incomplete or failed investigation. Evidence references are validated against the investigation's evidence ledger. Structurally valid citations are not treated as proof of causal correctness.

## Reasoning

This preserves the meaning of `insufficient evidence` and prevents backend, model, or budget failures from being presented as completed analytical findings. It also makes the accepted synthetic evaluation strategy able to assess reference validity separately from the quality of reasoning.

## Consequences

The coordinator must retain run-local evidence provenance until the result is validated. The exact field names beyond the approved concepts, enum values, and CLI rendering/exit conventions remain unresolved.

## Deferred options

Persisted investigation records and later retrieval remain deferred under [ADR 004](004-invocation-model.md). Automated judgment of causal correctness is not supplied by structural reference validation.
