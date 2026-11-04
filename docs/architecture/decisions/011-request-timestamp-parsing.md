# 011 — Request timestamp parsing

Status: Accepted by the YON-5 code-review refactor approval.

## Context

The initial milestone plan required strict RFC 3339 timestamps with explicit timezones and rejected impossible calendar dates. Its first implementation duplicated date parsing, leap-year rules, and calendar validation in application code. The approved YON-5 review replaces that policy with lenient Day.js parsing and UTC normalization.

This decision supersedes the strict timestamp input contract in the original milestone plan and roadmap. [ADR 008](008-service-identity-and-time.md) remains the historical service/time decision: explicit service and environment identity, UTC internal instants, and half-open intervals are retained. ADR 008 itself is preserved unchanged.

## Decision

- Use Day.js with its UTC plugin as the request timestamp parser. Do not maintain application regexes, calendar calculations, a format allowlist, or strict RFC 3339 validation.
- Accept timestamps that Day.js can parse and normalize. Lenient normalization, including overflowing calendar dates, is deliberate.
- Interpret timezone-free timestamps as UTC. Respect explicit offsets and normalize the resulting instants to UTC.
- Reject unparseable start/end values with the corresponding `InvestigationRequestError` field. Reject equal or reversed normalized instants with field `window`.
- Retain canonical ISO UTC output strings with millisecond precision and positive `[start, end)` semantics. Preserve nonblank service/environment identity unchanged.
- Keep input/output types in `request.types.ts`; keep request validation and normalization in `request.ts`.

## Rationale

Delegating parsing to one established library removes duplicate date rules and makes the accepted input policy simpler to maintain. UTC interpretation avoids changing an investigation's interval with the engineer's machine timezone. Strict formatting is unnecessary for the local request boundary; consistent normalized instants and positive intervals remain the invariants that later telemetry modules consume.

## Trade-offs

Leniency can normalize an input typo rather than reject it; for example, `2026-02-29T12:00:00` becomes `2026-03-01T12:00:00.000Z`. Accepted spellings and parsing limits follow the pinned Day.js version rather than an application-owned grammar. Millisecond precision remains; leap-second support and arbitrary submillisecond precision are not added.

The adapter calls `dayjs.utc(value)` directly. Day.js documents ISO-like strings (including a space separator) for its standard string parser; some other formats fall back to native parsing. In the pinned version, `November 4, 2026 12:00:00` can consequently depend on the machine timezone even in UTC mode. The implementation therefore does not yet guarantee UTC interpretation for every non-ISO timezone-free spelling Day.js accepts. Whether to support those broader forms with an additional adapter policy is an open review decision; the application does not silently add a custom parser. See the [Day.js string parsing documentation](https://day.js.org/docs/en/parse/string) and [UTC documentation](https://day.js.org/docs/en/parse/utc).

## Verification and scope

Tests cover explicit UTC, positive/negative offsets, timezone-free and date-only inputs, lenient normalization, invalid values, nonpositive intervals, blank identity, and independent processes with different `TZ` settings. Build and strict test typecheck must pass. This decision authorizes only the YON-5 request-boundary refactor and the Day.js dependency; YON-6 environment resolution, executable CLI behavior, telemetry, and model integration remain deferred.
