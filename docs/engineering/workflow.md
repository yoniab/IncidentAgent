# Engineering workflow

## Worktree start (agent-operated PowerShell)

Open Codex normally and request an issue. The agent performs this procedure; no custom launcher or routine human setup command is needed. Substitute a unique issue branch and a sibling directory; stop on any failed command or unexpected state. If that directory or Git metadata is outside the writable roots, obtain a narrowly scoped permission grant through the environment or use the native handoff below; the isolation requirement does not authorize bypassing permissions.

```powershell
git status --short
git branch --show-current
git worktree list
git remote -v
git fetch origin main
# Reuse an existing valid task worktree rather than duplicating it.
git worktree add -b feat/YON-8-topic C:/repos/IncidentAgent-worktrees/YON-8-topic origin/main
```

Preserve any existing work, even in a dirty source checkout; never transfer/reset it. In the selected worktree, verify `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`, and `git rev-parse HEAD origin/main`. At creation both SHAs must match. For resumed task work, verify the known task base remains an ancestor; do not reset the branch to a newer main. Keep shell `workdir` and file-tool absolute paths inside this worktree throughout. Do not run project edits in the source checkout.

### Codex CLI/TUI limitation and native fallback

On Windows, Codex CLI 0.169.0 exposes `--worktree` and `-C/--cd`. Native managed worktrees start detached; create the issue-named branch before edits. Prefer the native worktree tool if exposed, otherwise use the Git procedure above.

Creating a worktree does not move an already-running session's cwd or grant filesystem access. In the YON-7 run, explicit shell `workdir` successfully selected the new worktree and preserved its branch, but the sandbox root stayed at the shared checkout and its execution helper failed before launch. Separately approved commands outside the sandbox worked in that run; this is historical evidence, not a recommended workaround or continuing permission grant. Follow the sandbox-first permission rule in AGENTS.md for every command. This verifies command execution in the worktree, not an automatic persistent TUI cwd/sandbox transition.

If the current session cannot safely target the worktree, stop before edits. The least-friction native fallback is the TUI's `/worktree` selection when supported, then verify its directory/base and name its branch. Alternatively restart Codex using `codex -C <existing-task-worktree>`; do not also pass `--worktree` for an existing task checkout. For a new managed session, `codex --worktree` creates isolation, but its base must still be verified against freshly fetched main and its detached HEAD named before editing. If native facilities cannot select the intended latest-main base safely, use the Git-created worktree and `-C`. No permissions bypass flags are part of this procedure.

After this policy lands, validate a fresh issue/demo: start Codex normally, request an issue, and record the initial/source status, fetch/base SHA, distinct task path and branch, and verification before the first edit. YON-7's current-session worktree check does not substitute for that fresh-session demo. Keep YON-6 unstarted until YON-7 is completed by the human.

## CI and main protection

`.github/workflows/ci.yml` runs on every PR targeting main and on main pushes. The stable required job is **Verify** in **CI**. It uses Node.js 26 and the pnpm version from `package.json`, a frozen install, build, test typecheck and the full test suite. Only official checkout/setup-node actions are used, pinned to immutable commits. Checkout credentials are not persisted; the token has only contents read access. There are no project secrets, deployment permissions or dependency additions.

GitHub settings are external to this checkout. An administrator must configure and read back protection for `main`:

- Require a PR; require **Verify** from the GitHub Actions app, with the branch up to date before merge.
- Apply protection to administrators; allow no bypass actors for PRs.
- Set required approving reviews to **0** for this single-maintainer repository.
- Disable force pushes and branch deletion; keep main unlocked so a human can merge approved PRs.
- Keep auto-merge disabled; only a human decides when to merge.

Repository administrators can later change protections. Agents sharing the maintainer's credential are not a separate GitHub identity, so GitHub cannot distinguish an approved human merge from an agent using that identity. The no-agent-merge instruction remains a policy boundary; technical identity separation would require separate credentials/permissions and is outside this issue.

Verify the check exists on the PR and succeeds before selecting it as required. Read back branch protection, including admin enforcement, required-check source, zero required approvals, no PR bypasses, and disabled force pushes/deletion. Record actual evidence in the PR. If permissions or plan limitations prevent configuration, report the exact blocker and leave the issue incomplete; YAML and this document alone do not activate protection.

## Cleanup after human merge

Keep the worktree while its PR is open. After the human confirms merge, inspect its status including untracked files, verify the PR merge on GitHub, fetch main, and ensure no unique work needs preserving (squash merges need PR/diff confirmation rather than ancestry alone). From outside the worktree, use `git worktree remove <verified-task-path>` without force only after it is clean and all work is accounted for. Delete the task branch only when safe; never force deletion to work around an unmerged warning. Do not automatically remove worktrees containing uncommitted or unmerged work, or clean up other tasks' worktrees.

References: [GitHub workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [setup-node](https://github.com/actions/setup-node), [branch protection API](https://docs.github.com/en/rest/branches/branch-protection), [Codex managed worktree behavior](https://github.com/openai/codex/blob/main/codex-rs/tui/src/managed_worktree_tools.rs).
