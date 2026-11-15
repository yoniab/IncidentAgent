# YON-7 implementation plan

Spec: https://linear.app/yoniab/issue/YON-7

Goal: establish CI, main protection, and concise Codex boundaries without changing V1 behavior or dependencies.

Approach: one GitHub Actions job with immutable official checkout/setup-node actions, Node.js 26, manifest-selected pnpm, frozen install, build, test typecheck, and tests. Prefer one stable required check over a matrix that adds no requested coverage. Use GitHub branch protection for enforcement and AGENTS.md for agent conduct; no custom launcher or hooks.

1. Add `.github/workflows/ci.yml` for PRs to main and pushes to main, read-only contents, no persisted checkout credentials, no project secrets, and a bounded runtime.
2. Add root `AGENTS.md` with isolation before exploration/edits, autonomous scope, approval boundaries, dependency review requirements, prohibited operations, local verification and independent review. Retain the supplied Context7 and Windows gh guidance.
3. Add `docs/engineering/workflow.md` with an agent-operated PowerShell start procedure, native Codex fallback, safe cleanup, protection configuration and evidence requirements.
4. Verify frozen install/build/test typecheck/tests and whitespace; obtain a fresh independent review. Commit and push only the issue branch; open a PR to main and confirm its CI succeeds.
5. Configure main to require the observed CI check and PRs, apply to admins, require up-to-date checks, block force pushes/deletion, and require no third-party approval. Read back effective settings and PR checks; report any limitation. Never merge.

Constraints: no product code, manifest or lockfile changes; no new direct dependencies; no project secrets or production/customer data. Keep YON-6 unstarted. The user explicitly requested independent planning and implementation, so no additional design/plan approval gate is needed within this scope.

Validation: local Node 26.13.0/pnpm 10.26.0 baseline passes build, test typecheck and 53 tests. Worktree created from origin/main at 8ce7460; explicit command workdir verified before edits. Session sandbox root remains the original checkout; unsandboxed commands require approval. Do not represent explicit command workdir as a persistent TUI cwd change. A fresh-session isolation demo remains a separate handoff check after these instructions land.
