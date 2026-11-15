# 011 — Request timestamp parsing

Status: Superseded by [ADR 012 — Native Temporal request timestamps](012-native-temporal-request-timestamps.md). The historical Day.js decision below is retained unchanged.

## Context

The initial milestone required strict RFC 3339 input. A subsequent lenient Day.js policy normalized impossible dates and needed application regexes to select formats. The approved simplification now requires small Day.js format lists, UTC interpretation, and rejection of impossible dates. This supersedes the earlier lenient policy.

This decision supersedes the strict timestamp input contract in the original milestone plan and roadmap. [ADR 008](008-service-identity-and-time.md) remains the historical service/time decision: explicit service and environment identity, UTC internal instants, and half-open intervals are retained. ADR 008 itself is preserved unchanged.

## Decision

- Use Day.js with its bundled UTC and CustomParseFormat plugins. Strict Day.js parsing validates the calendar and clock; do not maintain format-selection regexes, leap-year rules, or month-length calculations. Never use native string-date fallback.
- Support `YYYY-MM-DD`; ISO-like date-times with `T` or a space separator and `HH:mm`, `HH:mm:ss`, or `HH:mm:ss.SSS`; and English `MMMM D, YYYY` / `MMM D, YYYY`, optionally followed by ` HH:mm:ss` (for example, `November 4, 2026 12:00:00` or `Nov 4, 2026`). One-to-three fractional digits are supported. An attached `Z` or signed `HH:mm` offset is optional. English names use standard capitalization.
- Reject impossible dates such as `2026-02-30`, clock overflow, ambiguous numeric-only values, unsupported forms, surrounding whitespace, and trailing text. This supersedes the earlier lenient calendar-normalization policy.
- Interpret timezone-free timestamps as UTC. Respect explicit offsets and normalize the resulting instants to UTC.
- Reject unparseable start/end values with the corresponding `InvestigationRequestError` field. Reject equal or reversed normalized instants with field `window`.
- Retain canonical ISO UTC output strings with millisecond precision and positive `[start, end)` semantics. Preserve nonblank service/environment identity unchanged.
- Keep input/output types in `request.types.ts`; keep request validation and normalization in `request.ts`.

## Rationale

Delegating strict validation to Day.js removes duplicate date rules and prevents a typo from silently changing the investigation interval. UTC interpretation avoids changing that interval with the engineer's machine timezone. A readable list of common formats keeps acceptance explicit without requiring RFC 3339 spelling everywhere.

## Trade-offs

The pinned Day.js 1.11.23 release has three relevant limitations verified during implementation:

- Its UTC format-array overload recursively parses candidates in local time. Keep one array of supported formats, but try each individually with `dayjs.utc(value, format, true)` so every candidate uses UTC.
- Strict numeric-offset parsing compares the UTC round-trip with the original offset spelling and rejects valid timestamps. Isolate suffix detection, validate wall time and offset (`HH:mm`) strictly with Day.js, then apply the offset using an explicit Day.js format. Only this already-validated conversion is non-strict. No application offset arithmetic is needed.
- Strict `S`/`SS` parsing cannot round-trip those fractional tokens. Pad one/two fractional digits to `SSS` before strict parsing. Reject more than three digits instead of silently truncating.

Strict CustomParseFormat rejects years `0000`–`0099` because of its underlying year handling; keep those inputs invalid instead of substituting the current year or 1900s. Leap seconds, timezone names/IANA zones, slash-separated numeric dates, and unlisted formats remain unsupported. English month names use Day.js's default English locale.

The adapter uses no native parsing fallback. Every supported timezone-free spelling means UTC, and explicit offsets preserve their instant. See the [Day.js strict parsing and format-array documentation](https://day.js.org/docs/en/parse/string-format/) and [UTC documentation](https://day.js.org/docs/en/parse/utc).

## Verification and scope

Tests cover every supported format in UTC, New York, and Tokyo subprocesses; impossible dates with and without offsets; ambiguous values and year-zero rejection; positive/negative minute offsets and offset day rollover; equal/reversed windows; a positive one-millisecond interval; and blank identity. Build, strict test typecheck, and the complete suite must pass. Types and errors remain in their own files. This decision authorizes only YON-5; no YON-6 implementation, unrelated dependency, integration, or commit is authorized.
