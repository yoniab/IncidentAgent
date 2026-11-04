# Incident Agent V1 implementation roadmap

Status: Milestone 1 and its technology stack are approved; [ADR 011](../architecture/decisions/011-request-timestamp-parsing.md) replaces the original strict timestamp contract with lenient Day.js UTC parsing. Only Task 1 (YON-5) and its review refactor are currently authorized. Task 2 (YON-6), later milestone sequencing, and unresolved implementation choices remain deferred or proposed. This roadmap does not independently authorize implementation.

## Authority and scope

This roadmap applies the [V1 requirements](../product/v1-requirements.md), the [accepted architecture](../architecture/v1-architecture.md), and ADRs 001–010 linked from that architecture. The ADRs remain the source of truth; the order below is a recommendation. V1 remains a manual, synchronous, read-only CLI investigation of one named service using synthetic/local Prometheus metrics and Loki logs collected by Grafana Alloy. The Node.js/TypeScript application uses the OpenAI API through the official SDK, without an agent framework.

The [first milestone plan](v1-milestone-01-request-boundary-plan.md) specifies only the approved first slice. Each later milestone needs its own reviewed implementation plan before execution. No milestone below authorizes a change to an accepted architectural boundary.

## Sequence

### 1. Canonical investigation request boundary

- **Objective and deliverables:** A minimal Node.js 26 LTS/strict TypeScript test harness using pnpm, native ESM, `tsc`, and Vitest; separate readonly request types and pure request validation/normalization using Day.js with its UTC plugin. Interpret timezone-free timestamps as UTC, preserve explicit offsets, and establish a positive half-open `[start, end)` interval. A separately authorized CLI-facing resolver will apply the approved `local` default. No executable investigation CLI or telemetry integration yet.
- **Dependencies:** [ADR 008](../architecture/decisions/008-service-identity-and-time.md), [ADR 009](../architecture/decisions/009-application-stack.md), and the synthetic-only boundary in [ADR 003](../architecture/decisions/003-data-security-boundary.md). No running observability stack or API key.
- **Acceptance criteria:** Accept Day.js-parseable timestamps, including lenient calendar normalization; timezone-free inputs mean UTC, explicit offsets are respected, and output is canonical ISO UTC with millisecond precision. Unparseable dates, nonpositive intervals, and blank service/environment values produce field-specific errors. Independent processes with different machine timezones return identical normalized instants. Day.js is the only runtime dependency; no custom date parser, strict RFC 3339 gate, CLI, network, or model dependency is added. The omitted CLI environment default belongs to deferred YON-6.
- **Verification:** `pnpm run build`, `pnpm run typecheck:test`, and `pnpm test` run locally; Vitest discovery lists the planned test files. No Docker services, telemetry, or secret are needed. Inspect that only the intended source/test/tooling files appear.
- **Key risks and unresolved decisions:** Day.js UTC parsing is verified across machine timezones for ISO-like forms; other accepted strings can use native fallback parsing and retain machine-timezone dependence. Broader-format UTC handling remains an open review decision in ADR 011. Numeric maximum window belongs with coordinator bounds later. This slice proves request semantics but not telemetry availability.

### 2. Local synthetic telemetry slice

- **Objective and deliverables:** A reproducible local Prometheus, Loki, and Grafana Alloy stack plus one synthetic service that emits service/environment-labelled latency and error metrics, structured logs, and periodic heartbeat logs. Include a normal interval and one controlled unhealthy interval in the synthetic signal source. Grafana may be added for human inspection but is not on the agent path.
- **Dependencies:** Milestone 1 tooling is useful for a TypeScript synthetic service; the telemetry slice can otherwise be verified independently. [ADRs 002](../architecture/decisions/002-telemetry-stack.md), [003](../architecture/decisions/003-data-security-boundary.md), and [007](../architecture/decisions/007-log-coverage-strategy.md) constrain it.
- **Acceptance criteria:** Direct Prometheus and Loki API queries for known bounded windows return the expected metrics, logs, and heartbeats for the named service/environment; a deliberately empty or broken interval demonstrates that missing results are distinguishable from normal behavior when coverage evidence permits. No real or production telemetry enters the stack.
- **Verification:** Start the local stack, check component health, issue bounded API queries, compare responses to the controlled scenario, then stop the stack. Record deterministic reproduction instructions with the milestone.
- **Key risks and unresolved decisions:** Docker/runtime availability, metric names and units, log field schema, heartbeat cadence, scenario reproducibility, and collector health signal. These need resolution in this milestone's plan, not in milestone 1.

### 3. Bounded telemetry read adapters

- **Objective and deliverables:** Read-only Prometheus and Loki adapters with separate backend query construction, service/environment scoping, time and result limits, normalized outcomes, warnings, truncation, and query provenance. They return data and source status; they do not infer service health.
- **Dependencies:** Milestones 1–2 and [ADRs 002](../architecture/decisions/002-telemetry-stack.md) and [006](../architecture/decisions/006-agent-query-control.md).
- **Acceptance criteria:** Bounded metric aggregation and log queries filtered by service, environment, severity, message, and relevant fields return compact, scoped results. Backend errors, partial responses, and result limits remain visible. No caller can inject arbitrary model-generated PromQL/LogQL or query another service through these interfaces.
- **Verification:** Adapter tests with controlled API responses and live smoke checks against milestone 2, including unavailable backend, partial response, and result-limit cases.
- **Key risks and unresolved decisions:** Prometheus/Loki boundary translation for `[start, end)`, backend scan cost despite returned-result caps, metric resolution, query timeout, and per-query volume caps.

### 4. Telemetry coverage assessment

- **Objective and deliverables:** A per-signal coverage assessor using metric sample/scrape information plus service heartbeat logs and Alloy/pipeline health. It records assessed interval, reasons, warnings, and uncertainty without equating coverage to service health.
- **Dependencies:** Milestones 2–3 and [ADRs 002](../architecture/decisions/002-telemetry-stack.md) and [007](../architecture/decisions/007-log-coverage-strategy.md).
- **Acceptance criteria:** Controlled normal, quiet, missing-heartbeat, missing-sample, and failed-pipeline intervals yield justified `available`, `partial`, `absent`, or `unknown` states. An empty filtered query alone never proves normal behavior; missing heartbeat alone never proves unhealthy service.
- **Verification:** Coverage tests with synthetic intervals and live checks against deliberately broken collection in milestone 2's local environment.
- **Key risks and unresolved decisions:** Heartbeat cadence, coverage thresholds, scrape expectations, and the reliability and availability of collector health signals.

### 5. Deterministic investigation loop and CLI

- **Objective and deliverables:** A synchronous CLI that accepts service, time window, and optional symptom context, displays the resolved environment and progress, and invokes a CLI-independent coordinator. The coordinator owns a transient query/evidence ledger, compact initial queries, supported next-query intents, scope/budget checks, stop conditions, and partial-failure handling. Its supported intents can narrow or expand queries only within the supplied window. A deterministic test driver chooses intents until milestone 6 supplies model reasoning.
- **Dependencies:** Milestones 1–4 and [ADRs 001](../architecture/decisions/001-v1-investigation-scope.md), [004](../architecture/decisions/004-invocation-model.md), [006](../architecture/decisions/006-agent-query-control.md), and [008](../architecture/decisions/008-service-identity-and-time.md).
- **Acceptance criteria:** An engineer can run a bounded local investigation and observe progress, actual backend queries, and a clearly labelled interim factual evidence summary. Attempts to query another service/environment, escape the time window, exceed budgets, or use an unsupported intent are rejected or reported as limitations. Failure of both telemetry sources cannot appear as a completed investigation.
- **Verification:** Coordinator tests with fake adapters and deterministic intent driver; local CLI smoke run against milestone 2. Verify the ledger and exact backend call scopes.
- **Key risks and unresolved decisions:** Supported intent catalog/templates, numeric query-count and total-runtime budgets, CLI argument spelling, progress and exit conventions. The model never gains direct query execution.

### 6. Model reasoning behind the coordinator

- **Objective and deliverables:** Provider-specific OpenAI SDK calls isolated in the reasoning module. The model interprets bounded evidence, proposes only supported intents, considers counterevidence, and drafts a structured analysis. Evaluate candidate models against initial synthetic scenarios before selecting the exact V1 model.
- **Dependencies:** Milestone 5's control seam, synthetic scenarios from milestone 2, and [ADRs 005](../architecture/decisions/005-evaluation-strategy.md), [006](../architecture/decisions/006-agent-query-control.md), and [009](../architecture/decisions/009-application-stack.md).
- **Acceptance criteria:** The coordinator can use a real reasoning module to make progressive bounded queries and produce an analysis draft; unsupported intents remain explicit limitations. Model failure preserves factual findings and reports analysis unavailable. No API key is committed; the draft is not yet presented as a validated final result.
- **Verification:** Reasoning contract tests using controlled model responses, candidate-model runs on initial synthetic scenarios, and a local end-to-end development run. Inspect source boundaries for provider calls and model-generated backend query execution.
- **Key risks and unresolved decisions:** Exact model pending scenario comparison, prompt and retry behavior, token/cost limits, and output schema. LLM variability may change the query path.

### 7. Final result semantics and evidence validation

- **Objective and deliverables:** Validate structured analysis and evidence references against the run-local ledger, keep `completeness` separate from `conclusion`, and render the final CLI result with observations, hypotheses, supporting/counterevidence, gaps, next investigation steps, and evidence-supported remediation recommendations.
- **Dependencies:** Milestones 5–6 and [ADRs 001](../architecture/decisions/001-v1-investigation-scope.md), [005](../architecture/decisions/005-evaluation-strategy.md), and [010](../architecture/decisions/010-investigation-result-semantics.md).
- **Acceptance criteria:** Invalid or absent evidence references fail validation; a completed insufficient-evidence analysis differs from an incomplete or failed investigation. Both telemetry sources unavailable or unusable model output cannot be rendered as a completed analysis; a single-source failure remains visible in completeness and limitations. Structurally valid citations are not represented as proof of causation.
- **Verification:** Result contract tests using controlled ledgers and model drafts, plus local CLI runs for successful, insufficient-evidence, and failure cases.
- **Key risks and unresolved decisions:** Final result field names/enums, rendering, exit codes, and treatment of an unusable model draft. Citation checks cannot assess causal correctness.

### 8. Scenario evaluation and V1 release gate

- **Objective and deliverables:** Repeatable synthetic scenarios covering an inferable cause, insufficient evidence within one-service scope, conflicting/counterevidence, telemetry gaps, and backend/model failures. Add a small evaluation rubric and make supported limitations visible in the final CLI result.
- **Dependencies:** Milestones 2–7 and [ADR 005](../architecture/decisions/005-evaluation-strategy.md). Scenario evidence may be added incrementally earlier; this milestone consolidates V1 acceptance.
- **Acceptance criteria:** Representative runs are scored for grounding, uncertainty, relevance, actionability, and counterevidence. The agent does not fabricate a cause to satisfy a scenario, and incomplete/failed investigations differ from completed insufficient-evidence results. Deferred capabilities do not appear in the V1 path.
- **Verification:** Reproduce every scenario from a clean local start; run automated contract checks and a documented human review of the analysis against the scenario's known facts and retrieved ledger. Record model/version and scenario results so later changes can be compared.
- **Key risks and unresolved decisions:** LLM output variability, cost, scenario realism, and human scoring consistency. Do not turn this into a production incident dataset or an LLM-as-judge system.

## Why this order

| Starting path | Dependencies and feedback speed | Testability and implementation risk |
| --- | --- | --- |
| Full telemetry stack first | Exposes Prometheus/Loki/Alloy integration risk immediately, but requires the synthetic service, signal names, log schema, heartbeat cadence, containers, and scenario timing before the application has a canonical request. Setup feedback can be slow or environment-specific. | Strong live backend feedback; weak early application tests. A large first milestone can fail for several unrelated setup reasons. |
| Application skeleton first | Fast to initialize Node.js/TypeScript and a CLI, but a package shell or placeholder command proves little about incident analysis. | Easy to test superficially; risks premature command structure and misleading "working" output without telemetry. |
| **Approved first milestone: request behavior; proposed next: telemetry** | The tiny request contract implements [ADR 008](../architecture/decisions/008-service-identity-and-time.md) with no services or credentials. The proposed second milestone tests the observability stack before coordinator/model work depends on it. | Fast deterministic feedback on an important invariant, followed immediately by live integration feedback if the proposed order is retained. The cost is one milestone without end-to-end investigation capability. |

This is an application-first start only in the narrow sense that the request boundary precedes telemetry. It is not a general application skeleton: milestone 1 ships a tested behavior and no placeholder investigation. Telemetry is proposed second because it is the first external integration risk and should be exercised before agent orchestration.

## Decision register for review

### Settled for milestone 1

- **First slice:** Canonical Investigation Request Boundary is approved as the first implementation milestone.
- **Toolchain:** Node.js 26 LTS, strict TypeScript, pnpm with `pnpm-lock.yaml`, native ESM using NodeNext module resolution, `tsc` without bundling, and Vitest. No Vite application build or development server. A test-only Vitest dependency does not add a Vite application path. See [TypeScript's NodeNext guidance](https://www.typescriptlang.org/docs/handbook/modules/reference) and [Vitest's test-file discovery guide](https://vitest.dev/guide/learn/writing-tests).
- **Time input:** [ADR 011](../architecture/decisions/011-request-timestamp-parsing.md) supersedes the previously approved strict RFC 3339 input policy. Use Day.js with its UTC plugin, accept parseable inputs and lenient calendar normalization, interpret timezone-free inputs as UTC, respect explicit offsets, reject unparseable inputs, and require a positive half-open `[start, end)` interval. Output uses millisecond-precision ISO UTC strings. CLI spelling remains deferred. [ADR 008](../architecture/decisions/008-service-identity-and-time.md) is preserved as the historical identity/time decision.

### Remaining before milestone 1 execution

- No architectural or tooling choice requires another approval. Pin exact pnpm, TypeScript, and Vitest versions in the future manifest/lockfile; confirm the planned field-specific error shape and UTC string serialization during implementation review. These are routine plan details, not changes to the accepted ADRs.

### Can safely wait for a later milestone

- Milestone 2: synthetic metric names/units, log schema, heartbeat cadence, controlled incident timeline, collector health probe, local container topology.
- Milestone 3: backend query translation and time resolution, query timeout and returned-volume caps.
- Milestone 4: coverage thresholds and rules for handling missing heartbeats or collector signals.
- Milestone 5: supported intent catalog/templates, query-count and total-runtime budgets, CLI syntax/progress/exit behavior.
- Milestone 6: reasoning retry policy and cost/token limits; select the exact OpenAI model only after evaluating candidates on initial synthetic scenarios.
- Milestone 7: final output field names/enums, rendering, and error exit codes.
- Milestone 8: final scenario set and evaluation rubric thresholds. Define these before claiming V1 acceptance, with model choice validated against the initial scenarios earlier.

### Require explicit architectural review if changed

- Adding production or customer telemetry, multi-tenancy, or production security claims would change [ADR 003](../architecture/decisions/003-data-security-boundary.md).
- Using CloudWatch/OpenSearch instead of Prometheus/Loki/Alloy, or placing Grafana in the agent query path, would change [ADR 002](../architecture/decisions/002-telemetry-stack.md).
- Investigating other services, dependencies, deployments, or executing remediation would change [ADR 001](../architecture/decisions/001-v1-investigation-scope.md).
- Introducing an asynchronous service/UI or persisted jobs would change [ADR 004](../architecture/decisions/004-invocation-model.md).
- Letting the model execute arbitrary queries, adding an agent framework, or moving provider calls into the coordinator would change [ADRs 006](../architecture/decisions/006-agent-query-control.md) and [009](../architecture/decisions/009-application-stack.md).
- Conflating incomplete execution with `insufficient evidence`, or accepting citations absent from the ledger, would change [ADR 010](../architecture/decisions/010-investigation-result-semantics.md).
