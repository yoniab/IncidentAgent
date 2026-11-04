# Canonical Investigation Request Boundary Implementation Plan

The checkboxes below support manual red/green execution after review. The approved YON-5 refactor uses the parsing policy in [ADR 011](../architecture/decisions/011-request-timestamp-parsing.md), superseding this plan's original strict RFC 3339 input contract. Only Task 1 is currently authorized; Task 2 (YON-6) remains deferred.

**Goal:** Establish and test the canonical one-service investigation request, including UTC time normalization, half-open interval validation, and the CLI's `local` environment default.

**Architecture:** Input/output types live in `request.types.ts`. A pure core function in `request.ts` validates explicit service/environment identity and uses Day.js with its UTC plugin to parse and normalize timestamps. A separate, deferred CLI-facing resolver supplies the environment default, then calls the core function. Neither module starts an investigation or depends on telemetry, a model, or a CLI command runner.

**Tech Stack:** Approved Node.js 26 LTS, strict TypeScript, pnpm, native ESM with NodeNext module resolution, `tsc` without bundling, and Vitest. `typescript`, `@types/node`, and `vitest` are development dependencies to add only when execution begins. Pin their resolved versions in `pnpm-lock.yaml`; pin the pnpm version in the future package manifest. Vitest uses Vite internally for tests, but this plan has no Vite application build or development server. See [TypeScript's NodeNext guidance](https://www.typescriptlang.org/docs/handbook/modules/reference), [Vitest's setup guide](https://vitest.dev/guide/), and [Vitest's test discovery guide](https://vitest.dev/guide/learn/writing-tests).

**Spec:** [V1 requirements](../product/v1-requirements.md), [V1 architecture](../architecture/v1-architecture.md), [ADR 003](../architecture/decisions/003-data-security-boundary.md), [ADR 008](../architecture/decisions/008-service-identity-and-time.md), [ADR 009](../architecture/decisions/009-application-stack.md), and [ADR 011](../architecture/decisions/011-request-timestamp-parsing.md). The [roadmap](v1-implementation-roadmap.md) explains the milestone order.

Status: Task 1 and its Day.js parsing refactor are approved for implementation and review. The original strict timestamp input policy is superseded by ADR 011. Task 2 is not authorized by the YON-5 work.

Day.js is the only approved runtime dependency for Task 1 and is pinned exactly in the manifest and lockfile. Its UTC plugin ships with Day.js; no additional parsing library or plugin package is needed. The development toolchain remains as described above.

**Open review limitation:** The current direct `dayjs.utc(value)` adapter guarantees the tested timezone-free ISO-like/date-only forms. Some other Day.js-accepted spellings use native, machine-local fallback parsing. ADR 011 records this gap against the general UTC-interpretation goal; broader-format handling awaits review rather than introducing custom parsing logic.

## Global constraints

- V1 remains manual, read-only, one-service, bounded-window, synthetic/local, and single-user/single-tenant. This milestone makes no telemetry query and contains no incident reasoning.
- The core identity contains `service` and `environment`; the CLI boundary defaults an omitted environment to `local` and will later display the resolved value ([ADR 008](../architecture/decisions/008-service-identity-and-time.md)).
- Internally represent the interval as two UTC instants with `[start, end)` semantics. A positive interval is required. Numeric maximum duration is deliberately deferred to the coordinator milestone.
- Approved timestamp input contract (ADR 011): accept Day.js-parseable timestamps with lenient normalization, interpret timezone-free inputs as UTC, respect explicit offsets, reject unparseable values, and require a positive half-open interval after normalization. Use Day.js with its UTC plugin; do not add custom regex, leap-year, calendar, or strict-format checks. Return ISO 8601 UTC strings with millisecond precision.
- Use native ESM: the future `package.json` has `"type": "module"`; TypeScript uses `module` and `moduleResolution` set to `NodeNext`. Relative imports in emitted application code use `.js` specifiers. No bundler or Vite application configuration is added.
- Keep the core request function independent of CLI, Prometheus, Loki, Alloy, and OpenAI. Do not add a CLI executable, telemetry stack, model dependency, Docker configuration, or scenario fixtures in this milestone.
- Before any actual local secret is introduced, Git must ignore `.env`; the first milestone's `.gitignore` also ignores dependency/build output and permits a future `.env.example` ([ADR 003](../architecture/decisions/003-data-security-boundary.md)).

## Review focus

The tests in Tasks 1–2 must pin these likely input failures:

1. A timezone-free timestamp is interpreted as UTC, with identical normalization in separate machine-timezone processes (Task 1).
2. Explicit UTC and numeric offsets normalize correctly; calendar overflow accepted by Day.js is normalized deliberately, while unparseable values produce field-specific errors (Task 1).
3. Equal or reversed endpoints are rejected so `[start, end)` is always positive (Task 1).
4. A blank or whitespace-only service/environment is rejected before it can become a telemetry selector (Task 1).
5. An explicitly supplied environment, including an explicitly blank one, is never silently replaced by the CLI default (Task 2).

---

## Expected file map

| File | Responsibility |
| --- | --- |
| `package.json` | Private native-ESM Node package, pinned pnpm toolchain, `build`, `typecheck:test`, and `test` scripts; Day.js as the sole runtime dependency and the approved development dependencies. |
| `pnpm-lock.yaml` | Exact resolved dependency versions for reproducible `pnpm install --frozen-lockfile`. |
| `tsconfig.json` | Editor-discoverable strict NodeNext no-emit project for `src/` and `test/`, including Node types and `.ts` test imports. |
| `tsconfig.build.json` | Application build extending the root project: compile `src/` only to ESM in `dist/`. |
| `tsconfig.test.json` | Strict no-emit typecheck for `src/` and `test/`, including `.ts` imports in Vitest test files. |
| `.gitignore` | Ignore `node_modules/`, `dist/`, `.vitest/`, `.env`, and `.env.*`; explicitly allow `.env.example`. |
| `src/investigation/request.types.ts` | Readonly core request input/output types. |
| `src/investigation/request.error.ts` | Field-specific request validation error. |
| `src/investigation/request.ts` | Day.js UTC normalization and positive interval check; imports the request types and error. |
| `test/investigation/request.test.ts` | Core contract and malformed-input tests. |
| `src/cli/resolve-request.ts` | Pure CLI-boundary environment default and delegation to core normalization; no argument parser or terminal output yet. |
| `test/cli/resolve-request.test.ts` | Default, explicit-environment, and blank-environment tests. |

No `vite.config.*` or `vitest.config.*` is needed: the test script explicitly scopes Vitest to `test/`, and its default discovery includes `*.test.ts`. `tsc` emits only `src/`, so compiled tests cannot be rediscovered in `dist/`. The YON-5 refactor also adds ADR 011 and updates this plan and the roadmap. `dist/`, `.vitest/`, and `node_modules/` are generated locally and ignored. The final executable CLI is a later milestone.

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

**Files:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `tsconfig.build.json`, `tsconfig.test.json`, `.gitignore`, `src/investigation/request.types.ts`, `src/investigation/request.error.ts`, `src/investigation/request.ts`, and `test/investigation/request.test.ts`. For the approved review refactor, also create ADR 011 and update this plan and the roadmap; preserve historical ADRs.

**Interfaces:** Consumes only input strings. Produces `InvestigationRequest`, `InvestigationRequestError`, and `normalizeInvestigationRequest` exactly as above for Task 2 and later coordinator use.

- [ ] **Step 1: Establish the minimal build/test harness.** Create a private `package.json` with `"type": "module"`, a pinned pnpm `packageManager`, and scripts `build: tsc -p tsconfig.build.json`, `typecheck:test: tsc -p tsconfig.test.json --noEmit`, and `test: vitest run --dir test`. The strict root `tsconfig.json` is the editor project for both `src/**/*.ts` and `test/**/*.ts`: use `rootDir: "."`, `outDir: "dist"`, `noEmit: true`, `allowImportingTsExtensions: true`, `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, and Node types. `tsconfig.build.json` extends it with `rootDir: "src"`, `noEmit: false`, `allowImportingTsExtensions: false`, and `include: ["src/**/*.ts"]` so only application modules are emitted. Keep `tsconfig.test.json` as the no-emit test typecheck entry point extending the root project. The timezone subprocess tests compile using `tsconfig.build.json` before loading the emitted ESM. No `test/tsconfig.json` is needed. Create `.gitignore` with the file-map patterns and `!.env.example`. Pin development dependencies using `pnpm add --save-dev --save-exact typescript @types/node@26 vitest`. Verify the frozen install succeeds and no generated output or `.env` appears in Git status.
- [ ] **Step 2: Write failing tests for valid normalization.** In `test/investigation/request.test.ts`, import Vitest's `test`/`expect` and the source modules via `.ts` relative specifiers. Assert that `2026-11-04T12:00:00+02:00` through `2026-11-04T12:20:00+02:00` becomes `2026-11-04T10:00:00.000Z` through `2026-11-04T10:20:00.000Z`, with the service and explicit environment unchanged. Cover explicit UTC, timezone-free date-times (including a space separator), date-only input, lenient calendar normalization, and positive/negative offsets. Run the same normalization in separate Node processes with `TZ=UTC`, `TZ=America/New_York`, and `TZ=Asia/Tokyo`, asserting literal expected UTC instants. Run `pnpm exec vitest list --filesOnly --dir test`; expected: exactly `test/investigation/request.test.ts` is listed.
- [ ] **Step 3: Run the red check.** Run `pnpm test`. Expected: discovery succeeds and the new UTC/lenient cases fail against the prior strict implementation (or the core function is absent for a fresh implementation); a no-tests-found result does not count as red.
- [ ] **Step 4: Implement the normalization contract.** Extract the readonly input/output types to `request.types.ts`. Add Day.js with `pnpm add --save-exact dayjs` and enable its bundled UTC plugin using a `.js` plugin import compatible with emitted Node ESM. Keep `request.ts` focused on validation and normalization. Validate nonblank service/environment without case changes; delegate timestamp parsing and lenient normalization to Day.js in UTC mode, preserve explicit offsets, and require `end > start` on normalized instants. Return canonical ISO UTC strings. Throw `InvestigationRequestError` with the relevant field for invalid input. Do not add custom date parsing, strict RFC 3339 validation, an unapproved maximum duration, or an environment allowlist.
- [ ] **Step 5: Run the green check.** Run `pnpm test`, `pnpm run build`, and `pnpm run typecheck:test`. Expected: the valid Vitest cases pass, the strict checks pass, and `tsc` emits only application modules under `dist/`.
- [ ] **Step 6: Pin malformed-input behavior.** Test unparseable dates and empty timestamps for both `start` and `end`, offsets Day.js cannot parse, equal/reversed endpoints (including equivalent instants written with different offsets), and empty/whitespace-only service/environment; assert the corresponding error class and field. Calendar overflow that Day.js accepts is covered as valid normalization, not malformed input. Run `pnpm test` and `pnpm run typecheck:test`; expected: all tests and the strict test typecheck pass. Finish Task 1 with `pnpm install --frozen-lockfile`, build, test typecheck, discovery, tests, whitespace checks including untracked files, emitted ESM inspection, and ignore/status inspection. Stop for review without implementing Task 2 or committing.

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
- `.env` and generated output are ignored. Day.js is the only runtime dependency. No real key, telemetry service, executable CLI, model integration, infrastructure, README, or unrelated documentation is added.
- The diff contains only the expected milestone files. No claim is made that the Incident Agent can investigate a service yet.

## Decisions and handoff

- **Approved for milestone 1:** Canonical Investigation Request Boundary first; Node.js 26 LTS, strict TypeScript, pnpm, native ESM/NodeNext, `tsc` without bundling, Vitest, and Day.js with the UTC plugin under ADR 011. The new lenient parsing policy supersedes the original strict RFC 3339 contract while retaining positive half-open UTC intervals. The approved stack adds no Vite application build or development server. YON-5 authorizes only Task 1 and this review refactor.
- **Remaining routine details:** Pin the exact pnpm, TypeScript, `@types/node`, and Vitest versions during execution. The field-specific validation error and millisecond-precision UTC string representation remain plan-level choices, not additional approved architectural decisions.
- **Deferred:** CLI flag spelling, display/exit conventions, numeric window and query budgets, metric/log schemas, heartbeat cadence, coverage thresholds, supported query intents, exact OpenAI model, final result enum names, and synthetic evaluation thresholds. None is required to test this request boundary.
- **Architectural change gate:** expanding beyond one service or synthetic/local telemetry; adding direct model queries, remediation, asynchronous jobs, or an agent framework requires explicit review of the relevant accepted ADRs, not a silent plan edit.

Stop after this milestone when it is later authorized; seek review before planning or starting milestone 2 execution.
