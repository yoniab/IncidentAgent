# Repository agent instructions

## Start every implementation task in isolation

Before issue exploration, planning, or project-file edits, perform only essential Git preflight: inspect status, branch, worktrees and remotes; preserve all existing changes; fetch the latest `origin/main`.

1. Reuse an existing isolated worktree only when it belongs to this issue and its base is verified. Otherwise create a unique issue-named feature branch and separate worktree from `origin/main`, preferring native Codex tools when available. Never develop in the shared main checkout or create duplicate/nested worktrees.
2. Select the worktree execution directory and verify its absolute top-level path, issue branch, base and clean initial state before further work. Use that directory explicitly on every shell command and absolute paths for file tools. A shell `cd` does not persist across calls or change the session sandbox root.
3. If safe execution or filesystem permissions cannot be established, stop and report. Use the native Codex handoff in [the worktree procedure](docs/engineering/workflow.md); no launcher, wrapper, alias or extra routine per-ticket command is required.

## Autonomy and approval

Implement autonomously within the requested issue, accepted ADRs, existing dependencies and engineering conventions. Read relevant `docs/architecture/`, `docs/product/` and `docs/plans/` documents after isolation. Keep the PR limited to the approved scope; do not begin blocked follow-up issues.

Obtain explicit human approval before:
- Adding any new direct dependency, runtime or development. First explain its purpose, existing/native alternatives, license, maintenance and security signals. Do not change the manifest or lockfile to add it before approval.
- Changing public contracts or architecture, secrets/data access, or security/CI policy beyond explicitly approved task scope.
- Merging any PR. Opening a PR does not authorize merging, auto-merge or direct pushes to main.

Never access production/customer data or secrets, force-push, rewrite history, discard unrelated work, or push directly to main. Use synthetic/local fixtures and approved interfaces. Preserve user changes; report conflicts instead of resetting, rebasing or overwriting them.

## Verification and handoff

Run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run typecheck:test` and `pnpm test` locally; inspect results and `git diff --check`. Obtain independent review for meaningful changes and resolve material findings before handoff. Open a scope-limited PR with verification evidence and remaining limitations; leave merging to the human. Keep the worktree for review; follow the linked procedure for safe post-merge cleanup.

Agent instructions guide conduct; they neither provision session isolation nor replace sandbox permissions, required CI or GitHub branch protection.

## Current documentation and Windows tools

For library, framework, SDK, API, CLI or cloud-service questions and implementation that depends on their APIs, use Context7 outside the default sandbox, even for familiar technologies:
1. Resolve with `npx ctx7@latest library <official-name> "<specific concept>"` unless given a `/org/project` ID.
2. Select the best relevant official/high-reputation result; fetch with `npx ctx7@latest docs <id> "<specific concept>"`. Use returned version IDs when applicable and separate distinct concepts. Maximum three commands per question; include no credentials or sensitive data.
3. Use the fetched documentation. On quota errors, report them and suggest `npx ctx7@latest login` or `CONTEXT7_API_KEY`; do not silently substitute memory. Rerun DNS/network failures outside the sandbox. General programming, API-independent refactoring and review do not require Context7.

Use `gh` normally. If unavailable on this Windows machine, try `C:\Program Files\GitHub CLI\gh.exe` before reporting it unavailable.
