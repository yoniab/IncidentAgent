# Repository agent instructions

## Adopt the task's isolated worktree

Each task runs in a separate Codex TUI session started with `codex --worktree`. Adopt that session's current isolated worktree; do not create another worktree, nested checkout, wrapper or launcher.

Before issue exploration, planning or project-file edits:
1. Perform essential Git preflight: verify the absolute worktree root, linked-worktree state, branch/detached HEAD, status and remotes. Preserve all existing work. If this is the shared checkout or isolation/permissions cannot be verified, stop and report; start the task in the required native session instead.
2. Fetch the latest `origin/main`. For a fresh, clean task worktree, create a unique issue-named feature branch from that fetched ref in the current worktree, then verify branch name and `HEAD` equal to `origin/main` before edits. Native worktrees may start detached or at a stale base; isolation alone does not establish the correct branch/base. Stop if switching would displace existing work. Follow the checks in [the worktree procedure](docs/engineering/workflow.md).
3. When continuing this issue's existing branch/PR, reuse its worktree and branch after verifying ownership and the recorded base; preserve its commits rather than resetting/rebasing onto newer main. Keep every shell command's `workdir` and file-tool absolute paths inside the adopted worktree. A shell `cd` does not persist across calls or change sandbox permissions.

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

For library, framework, SDK, API, CLI or cloud-service work that depends on current APIs, verify against current official documentation. Prefer read-only documentation tools or official sites that do not download and execute packages. Use Context7 when available through an approved tool or an already approved, version-pinned CLI; resolve the library before fetching focused documentation. Do not run unpinned package runners such as `npx ctx7@latest`, install tooling, authenticate, or change credential configuration merely to satisfy a documentation lookup. New tooling needs separate human approval for its exact version, purpose and permissions; project dependencies also follow the dependency approval rule above. Keep queries free of credentials, private source code and sensitive data. If documentation cannot be accessed safely, report the limitation rather than silently relying on memory.

Run shell commands in the sandbox by default. A sandbox denial, DNS/network failure or tooling error does not authorize execution outside it. Use a permitted alternative or report the blocker; if broader access is indispensable, request narrowly scoped approval through the environment's permission flow and wait for its decision. Approval for one command is not blanket permission for future execution. Never automatically retry outside the sandbox or use permission-bypass flags.

Use `gh` normally. If unavailable on this Windows machine, try `C:\Program Files\GitHub CLI\gh.exe` before reporting it unavailable.
