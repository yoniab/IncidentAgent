# Canonical Investigation Request Boundary Implementation Plan

The checkboxes below support manual red/green execution after review. The approved final YON-5 simplification uses native Temporal under [ADR 012](../architecture/decisions/012-native-temporal-request-timestamps.md), superseding ADR 011 and its Day.js policies. Only Task 1 is authorized; Task 2 (YON-6) remains deferred.

**Goal:** Establish and test the canonical one-service investigation request, including UTC time normalization, half-open interval validation, and the CLI's `local` environment default.

**Architecture:** Input/output types live in `request.types.ts` and the field-specific error in `request.error.ts`. The pure core function uses `Temporal.Instant.from`, `compare`, and `toString` to validate and normalize explicitly timezone-qualified ISO instants. A separate, deferred CLI resolver will supply the environment default. Neither module starts an investigation or depends on telemetry, a model, or a CLI runner.

**Tech Stack:** Approved Node.js 26 LTS, strict TypeScript, pnpm, native ESM with NodeNext module resolution, `tsc` without bundling, and Vitest. `typescript`, `@types/node`, and `vitest` are development dependencies to add only when execution begins. Pin their resolved versions in `pnpm-lock.yaml`; pin the pnpm version in the future package manifest. Vitest uses Vite internally for tests, but this plan has no Vite application build or development server. See [TypeScript's NodeNext guidance](https://www.typescriptlang.org/docs/handbook/modules/reference), [Vitest's setup guide](https://vitest.dev/guide/), and [Vitest's test discovery guide](https://vitest.dev/guide/learn/writing-tests).

**Spec:** [V1 requirements](../product/v1-requirements.md), [V1 architecture](../architecture/v1-architecture.md), ADRs [003](../architecture/decisions/003-data-security-boundary.md), [008](../architecture/decisions/008-service-identity-and-time.md), [009](../architecture/decisions/009-application-stack.md), and [012](../architecture/decisions/012-native-temporal-request-timestamps.md). ADR 011 remains historical. The [roadmap](v1-implementation-roadmap.md) explains milestone order.

Status: Task 1 and its final native Temporal simplification are approved for implementation and review. ADR 012 supersedes previous parsing decisions. Task 2 is not authorized by YON-5.

There are no runtime dependencies. Remove Day.js from the manifest and lockfile; do not add a polyfill or other dependency. Native Temporal must be exposed by the installed Node.js 26 runtime. TypeScript must support its bundled `ESNext.Temporal` declarations, enabled alongside `ES2022` in the root configuration.

**Approved final simplification:** Delegate ISO parsing, UTC normalization, and nanosecond comparison to native `Temporal.Instant`. Require `Z` or a numeric offset; reject missing timezones, invalid dates, and nonpositive intervals. Remove format lists, regexes, offset adapters, and fractional padding. Use canonical `Instant.toString()` output rather than fixed millisecond serialization. ADR 012 documents native syntax, range, precision, annotation, and leap-second semantics.

## Global constraints

- V1 remains manual, read-only, one-service, bounded-window, synthetic/local, and single-user/single-tenant. This milestone makes no telemetry query and contains no incident reasoning.
- The core identity contains `service` and `environment`; the CLI boundary defaults an omitted environment to `local` and will later display the resolved value ([ADR 008](../architecture/decisions/008-service-identity-and-time.md)).
- Internally represent the interval as two UTC instants with `[start, end)` semantics. A positive interval is required. Numeric maximum duration is deliberately deferred to the coordinator milestone.
- Approved timestamp input contract (ADR 012): use `Temporal.Instant.from` for ISO instants with an explicit timezone. Reject missing timezones and invalid timestamps through field-specific errors; compare instants natively and require a positive interval. Return native canonical UTC strings, preserving up to nanosecond precision. Add no custom parsing or calendar logic.
- Use native ESM: the future `package.json` has `"type": "module"`; TypeScript uses `module` and `moduleResolution` set to `NodeNext`. Relative imports in emitted application code use `.js` specifiers. No bundler or Vite application configuration is added.
- Keep the core request function independent of CLI, Prometheus, Loki, Alloy, and OpenAI. Do not add a CLI executable, telemetry stack, model dependency, Docker configuration, or scenario fixtures in this milestone.
- Before any actual local secret is introduced, Git must ignore `.env`; the first milestone's `.gitignore` also ignores dependency/build output and permits a future `.env.example` ([ADR 003](../architecture/decisions/003-data-security-boundary.md)).

## Review focus

The tests in Tasks 1–2 must pin these likely input failures:

1. Missing timezone information is rejected identically under UTC, New York, and Tokyo (Task 1).
2. Explicit UTC/numeric offsets normalize correctly; invalid dates and numeric fragments produce field-specific errors. Valid early years and nanosecond precision must not be lost (Task 1).
3. Equal or reversed endpoints are rejected so `[start, end)` is always positive (Task 1).
4. A blank or whitespace-only service/environment is rejected before it can become a telemetry selector (Task 1).
5. An explicitly supplied environment, including an explicitly blank one, is never silently replaced by the CLI default (Task 2).

---

## Expected file map

| File | Responsibility |
| --- | --- |
| `package.json` | Native-ESM Node 26 package, pinned pnpm toolchain, build/typecheck/test scripts, and development dependencies only. |
| `pnpm-lock.yaml` | Exact resolved dependency versions for reproducible `pnpm install --frozen-lockfile`. |
| `tsconfig.json` | Editor-discoverable strict NodeNext no-emit project for `src/` and `test/`, including Node types and `.ts` test imports. |
| `tsconfig.build.json` | Application build extending the root project: compile `src/` only to ESM in `dist/`. |
| `tsconfig.test.json` | Strict no-emit typecheck for `src/` and `test/`, including `.ts` imports in Vitest test files. |
| `.gitignore` | Ignore `node_modules/`, `dist/`, `.vitest/`, `.env`, and `.env.*`; explicitly allow `.env.example`. |
| `src/investigation/request.types.ts` | Readonly core request input/output types. |
| `src/investigation/request.error.ts` | Field-specific request validation error. |
| `src/investigation/request.ts` | Native Temporal parsing, comparison, and UTC normalization; imports only request types and error. |
| `test/investigation/request.test.ts` | Core contract and malformed-input tests. |
| `src/cli/resolve-request.ts` | Pure CLI-boundary environment default and delegation to core normalization; no argument parser or terminal output yet. |
| `test/cli/resolve-request.test.ts` | Default, explicit-environment, and blank-environment tests. |

No Vite or Vitest config is needed: the test script scopes Vitest to `test/`, and `tsc` emits only `src/`. The final simplification adds ADR 012, marks ADR 011 superseded, and updates this plan and the roadmap. Generated output remains ignored. The executable CLI is deferred.

## Proposed interfaces

`src/investigation/request.types.ts` exports:

```ts
export type InvestigationRequestInput = Readonly<{
  service: string;
  environment: string;
  start: string;
  end: string;
}>;

export type InvestigationRequest = Readonly<{
  service: string;
  environment: string;
  startUtc: string;
  endUtc: string;
}>;
```

`src/investigation/request.error.ts` exports:

```ts
export class InvestigationRequestError extends Error {
  readonly field: "service" | "environment" | "start" | "end" | "window";
  constructor(field: InvestigationRequestError["field"], message: string);
}
```

`src/investigation/request.ts` imports the types through `./request.types.js` and the error through `./request.error.js`, and exports:

```ts
export function normalizeInvestigationRequest(input: InvestigationRequestInput): InvestigationRequest;
```

When Task 2 is separately authorized, `src/cli/resolve-request.ts` imports the request types from `../investigation/request.types.js` and exports:

```ts
export type CliInvestigationRequestInput = Omit<InvestigationRequestInput, "environment"> & {
  environment?: string;
};

export function resolveCliInvestigationRequest(input: CliInvestigationRequestInput): InvestigationRequest;
```

The CLI resolver defaults **only an omitted** environment. The core function requires an explicit environment. Both preserve the supplied service/environment identity rather than changing case or guessing a catalog entry. The returned UTC strings designate instants; the half-open comparison is made on instants, not on raw input text. A future CLI renders the resolved environment and a future coordinator applies its numeric bounds.

## Tasks in execution order

### Task 1: Canonical core request

**Files:** Retain the existing scaffolding and separate request types/error/logic/test files. Update `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `src/investigation/request.ts`, and `test/investigation/request.test.ts`; create ADR 012, mark ADR 011 superseded, and update this plan and the roadmap. Preserve the historical decisions.

**Interfaces:** Consumes only input strings. Produces `InvestigationRequest`, `InvestigationRequestError`, and `normalizeInvestigationRequest` exactly as above for Task 2 and later coordinator use.

- [ ] **Compatibility gate:** Before implementation, verify native Temporal parsing/comparison/serialization on the installed Node.js 26 runtime and compile a TypeScript API probe with bundled `ESNext.Temporal` declarations. If either runtime or compiler support is unavailable, stop and report the blocker. Do not add dependencies or polyfills. Enable `lib: ["ES2022", "ESNext.Temporal"]` in the root configuration after verification.

- [ ] **Step 1: Establish the minimal build/test harness.** Create a private `package.json` with `"type": "module"`, a pinned pnpm `packageManager`, and scripts `build: tsc -p tsconfig.build.json`, `typecheck:test: tsc -p tsconfig.test.json --noEmit`, and `test: vitest run --dir test`. The strict root `tsconfig.json` is the editor project for both `src/**/*.ts` and `test/**/*.ts`: use `rootDir: "."`, `outDir: "dist"`, `noEmit: true`, `allowImportingTsExtensions: true`, `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, and Node types. `tsconfig.build.json` extends it with `rootDir: "src"`, `noEmit: false`, `allowImportingTsExtensions: false`, and `include: ["src/**/*.ts"]` so only application modules are emitted. Keep `tsconfig.test.json` as the no-emit test typecheck entry point extending the root project. The timezone subprocess tests compile using `tsconfig.build.json` before loading the emitted ESM. No `test/tsconfig.json` is needed. Create `.gitignore` with the file-map patterns and `!.env.example`. Pin development dependencies using `pnpm add --save-dev --save-exact typescript @types/node@26 vitest`. Verify the frozen install succeeds and no generated output or `.env` appears in Git status.
- [ ] **Step 2: Write failing contract tests.** Replace the Day.js contract with ISO inputs containing `Z` or numeric offsets. Cover offset minutes/day rollover, early years, leap days, canonical fractions, and nanosecond intervals; reject missing timezones, readable/date-only inputs, impossible dates, malformed offsets, excessive precision, and out-of-range values. Preserve identity and field-specific errors. Run valid/invalid fixtures under UTC, New York, and Tokyo. Pin the documented native leap-second and annotation behavior. Discovery must list exactly `test/investigation/request.test.ts`.
- [ ] **Step 3: Run the red check.** Run `pnpm test`. Discovery must succeed and the changed timezone/precision contract must fail against the Day.js implementation. A no-tests-found result does not count as red.
- [ ] **Step 4: Implement the normalization contract.** Preserve the existing types, error class, and identity checks. Wrap `Temporal.Instant.from` failures with the corresponding error field, require positive `Temporal.Instant.compare` ordering, and serialize via `toString()`. Remove Day.js and all format/offset/fraction adapters. Declare Node.js 26 in the package runtime requirements. Do not add a dependency, polyfill, duration limit, environment allowlist, or `Date` fallback.
- [ ] **Step 5: Run the green check.** Run `pnpm test`, `pnpm run build`, and `pnpm run typecheck:test`. Expected: the valid Vitest cases pass, the strict checks pass, and `tsc` emits only application modules under `dist/`.
- [ ] **Step 6: Verify and review independently.** Run frozen install, application build and no-emit application check, strict test typecheck, complete suite, discovery, whitespace, emitted ESM, and ignore/status checks. Confirm no runtime dependencies or YON-6 files remain. Request an independent correctness/security/complexity review; resolve important findings, then stop for final review without commits.

### Task 2: CLI-facing environment resolution

Deferred (YON-6): this section records the future interface only and is not authorized by YON-5.

**Files:** Create `src/cli/resolve-request.ts` and `test/cli/resolve-request.test.ts`.

**Interfaces:** Consumes the proposed `CliInvestigationRequestInput`. Calls `normalizeInvestigationRequest` from Task 1. Produces a fully resolved `InvestigationRequest` for a later CLI command and coordinator.

- [ ] **Step 1: Write failing resolver tests.** In `test/cli/resolve-request.test.ts`, import Vitest's `test`/`expect` and the source module via a `.ts` relative specifier. Assert that omitted `environment` becomes `local`; an explicit `test` environment stays `test`; an explicit empty or whitespace-only environment raises `InvestigationRequestError` for `environment`; service and UTC interval are delegated unchanged to the core contract. Run `pnpm exec vitest list --filesOnly --dir test`; expected: both planned `*.test.ts` files are listed, with no `dist/` test file.
- [ ] **Step 2: Run the red check.** Run `pnpm test`. Expected: Vitest discovers both test files and exits nonzero because `resolveCliInvestigationRequest` is absent or unimplemented.
- [ ] **Step 3: Implement the resolver.** Export the interface and function above. Set `environment` to `local` only when it is `undefined`, then call `normalizeInvestigationRequest` through a relative `.js` import specifier that works in emitted NodeNext ESM. Do not parse command-line arguments or print progress in this milestone.
- [ ] **Step 4: Run the green check.** Run `pnpm test` and `pnpm run typecheck:test`. Expected: both test files execute, all core and resolver tests pass, and the strict test typecheck passes.
- [ ] **Step 5: Verify the boundary.** Run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run typecheck:test`, `pnpm exec vitest list --filesOnly --dir test`, `pnpm test`, and `git diff --check`. Confirm Vitest lists exactly the two planned test files and runs a nonzero number of tests in both. For each newly created, still-untracked file, run `git diff --no-index --check -- NUL <file>`; exit code 1 with no diagnostics means the new file differs from the empty file and has no whitespace error. Inspect emitted `dist/` files for native ESM imports and inspect `git status --short`: no telemetry, model, Docker, CLI runner, secret, or generated output should be tracked. Confirm `.env` is ignored using `git check-ignore .env` (the path need not exist).

## Definition of done

- The approved timestamp input contract and toolchain appear consistently in the source and test setup. Routine output serialization and error-shape details follow the reviewed plan.
- `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run typecheck:test`, and `pnpm test` succeed on Node.js 26 LTS. For Task 1, Vitest lists and runs exactly `test/investigation/request.test.ts`, including its Review focus cases, without services or credentials. Both planned test files are required only after Task 2 is separately authorized and implemented.
- The core contract always returns explicit service/environment and UTC `[start, end)` instants, with clear field-specific errors for invalid requests. The CLI boundary defaults only an omitted environment to `local`.
- `.env` and generated output are ignored. No runtime dependency, polyfill, real key, telemetry service, executable CLI, model integration, infrastructure, README, or unrelated documentation is added.
- The diff contains only the expected milestone files. No claim is made that the Incident Agent can investigate a service yet.

## Decisions and handoff

- **Approved for milestone 1:** Canonical Investigation Request Boundary first; Node.js 26 native Temporal, strict TypeScript with bundled Temporal declarations, pnpm, native ESM/NodeNext, `tsc`, and Vitest. ADR 012 supersedes Day.js parsing. Explicit-timezone ISO instants, nanosecond-aware native comparison, and positive half-open UTC intervals are required. Only Task 1/YON-5 is authorized.
- **Verified toolchain:** Node.js 26.13.0 exposes Temporal; TypeScript 7.0.2 supports the API via `ESNext.Temporal`. Native canonical `toString()` serialization replaces fixed millisecond formatting. No new dependency is needed.
- **Deferred:** CLI flag spelling, display/exit conventions, numeric window and query budgets, metric/log schemas, heartbeat cadence, coverage thresholds, supported query intents, exact OpenAI model, final result enum names, and synthetic evaluation thresholds. None is required to test this request boundary.
- **Architectural change gate:** expanding beyond one service or synthetic/local telemetry; adding direct model queries, remediation, asynchronous jobs, or an agent framework requires explicit review of the relevant accepted ADRs, not a silent plan edit.

Stop after this milestone when it is later authorized; seek review before planning or starting milestone 2 execution.
