# 005 — V1 evaluation strategy

Status: Accepted

## Context

LLM-generated incident analysis cannot be considered successful merely because its conclusion sounds plausible or happens to identify the expected cause. V1 needs repeatable scenarios that evaluate the quality of the investigation process and its conclusions.

## Decision

V1 will be evaluated against representative synthetic incident scenarios. The evaluation set must include both:

- Incidents where the root cause can reasonably be inferred from the named service's available telemetry.
- Incidents where available telemetry is deliberately insufficient.

Evaluation will assess at least the following qualities.

### Evidence grounding

Substantive claims and hypotheses should be supported by telemetry evidence actually retrieved during the investigation. The agent should not substitute plausible guesses for evidence.

### Uncertainty handling

The agent should recognize when available evidence is insufficient. `Insufficient evidence` is a successful outcome when available telemetry cannot support a stronger conclusion. The agent must not fabricate a root cause merely because one is expected.

### Evidence relevance

The agent should surface the evidence most relevant to the investigation instead of returning large volumes of unrelated telemetry. Progressive investigation should reduce noise rather than dump raw data on the engineer.

### Actionability

The final analysis should recommend useful next investigation and/or remediation steps connected to the evidence and hypotheses. Recommendations must respect V1's read-only boundary. The agent may recommend an action but must not execute remediation.

### Counterevidence handling

The agent must actively consider evidence that weakens or contradicts its hypotheses. It must not ignore contradictory evidence merely because other evidence supports its initial hypothesis. When counterevidence materially weakens a hypothesis, the agent should revise its assessment or continue investigating other possibilities.

### Evolution testing

Some scenarios should intentionally require information outside V1's one-service boundary. In V1, the expected result for those scenarios may be `insufficient evidence`. When dependency investigation is introduced later, the same scenarios can be rerun to verify that the agent can follow the additional evidence and reach a better-supported conclusion.

## Rationale

Repeatable synthetic scenarios assess the investigation process and whether its conclusions are supported by the available evidence.

## Deferred

- Production incident datasets.
- Automated LLM-as-judge evaluation.
- Large evaluation suites.
- Continuous production evaluation.
- Cross-service evaluation requiring capabilities beyond V1.
