# 012 — Native Temporal request timestamps

Status: Accepted by the YON-5 Final Simplification approval. Supersedes [ADR 011](011-request-timestamp-parsing.md).

## Context

Day.js required format lists and adapters for UTC mode, strict offsets, fractional seconds, and early years. The approved Node.js 26 runtime provides `Temporal.Instant`, which owns parsing, normalization, precision, and comparison without application date-parsing rules or runtime dependencies. ADR 011 is retained as the historical decision; the identity and half-open interval meaning in ADR 008 remains unchanged.

## Decision

- Require Node.js 26 with native Temporal. Verification on Node.js 26.13.0 confirmed `Temporal.Instant.from`, `compare`, and `toString`. TypeScript 7.0.2 supports these APIs through its bundled `ESNext.Temporal` library declarations, enabled alongside `ES2022` in the root configuration. There is no polyfill or added dependency.
- Accept ISO 8601 instant strings through `Temporal.Instant.from`. Inputs must contain an explicit `Z` or numeric UTC offset. Reject missing timezones, date-only/readable dates, invalid calendar/clock values, and inputs outside Temporal's representable range. Do not maintain regexes, format lists, offset detection, fractional padding, or native `Date` fallback.
- Wrap parsing failures in `InvestigationRequestError` for the corresponding `start` or `end` field. Preserve the existing readonly input/output types, separate error class, explicit environment, and nonblank service/environment validation without changing identity.
- Compare parsed instants with `Temporal.Instant.compare` and require `end > start`. Keep the investigation interval half-open, `[start, end)`, without imposing an application maximum duration here.
- Serialize with `Temporal.Instant.toString()` to canonical UTC strings ending in `Z`. Fractional precision is automatic up to nanoseconds, with unnecessary trailing zeroes omitted. This replaces fixed millisecond output and preserves positive submillisecond intervals.
- Remove Day.js and its plugins from the manifest and lockfile. Do not add dependencies or implement YON-6.

## Rationale

An exact instant API matches the request's internal meaning. Explicit offsets eliminate machine-local timezone interpretation, and the native parser rejects invalid dates without duplicate calendar logic. Native comparison avoids lexicographic comparisons and millisecond rounding. The core implementation remains independent of a CLI, telemetry, and model integrations.

## Native API semantics and limits

Accepted syntax follows Temporal's ISO 8601/RFC 9557 instant grammar rather than an application-owned format allowlist. Basic ISO forms and supported annotations can therefore be accepted. When a timezone annotation accompanies a numeric offset, the offset determines the instant; the annotation does not establish or validate a named-zone/offset match. A named zone alone does not replace the required offset.

Temporal does not model leap seconds: an accepted seconds value of `60` is normalized to `59`. Precision beyond nine fractional digits and values outside its native instant range are rejected. No application-specific overrides are added for these native semantics. See the [Temporal.Instant documentation](https://tc39.es/proposal-temporal/docs/instant.html).

## Verification

Tests cover ISO UTC/basic/offset inputs, offset minutes and date rollover, valid leap days and early years, invalid/missing timezones, impossible dates, equal/reversed and one-nanosecond intervals, identity validation, canonical fractional output, and the documented native leap-second/annotation behavior. Run valid and invalid fixtures under UTC, New York, and Tokyo. Require frozen install, build, strict application/test typechecks, the complete suite, whitespace/status checks, and independent correctness/security/complexity review. Stop for final review without commits.
