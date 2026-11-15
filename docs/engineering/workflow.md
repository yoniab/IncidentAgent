# Engineering workflow

## Adopt the native session worktree

Start each task in a separate Codex TUI session using `codex --worktree`. The agent adopts the current linked worktree provisioned by that session. No second worktree, custom launcher, wrapper or alias is needed. For this existing PR, continue in its verified YON-7 worktree/branch; do not recreate or move it just to update instructions.

Before reading/planning the issue beyond essential identification or editing project files, perform Git preflight in the current session directory. Inspect every result and stop on any failed command or unexpected state:

```powershell
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir
git rev-parse --show-superproject-working-tree
git branch --show-current
git status --porcelain=v1 --untracked-files=all
git worktree list
git remote -v
git fetch origin main
```

Confirm the absolute root is the session's task worktree, the Git directory differs from the common Git directory, and this is a linked worktree rather than a submodule or the shared checkout. Verify the intended origin remote. If isolation or permissions are missing, stop and report; start the task in its own `codex --worktree` session rather than creating another worktree from inside it. Native session isolation does not authorize permission bypasses.

### Establish the issue branch before edits

For a fresh task, require a clean worktree, including untracked files. A native worktree may start detached at an older commit. Verify that its HEAD is an ancestor of freshly fetched main before switching, so unique detached work is not abandoned:

```powershell
git merge-base --is-ancestor HEAD origin/main
# Continue only on exit code 0 and with no existing task work to preserve.
git switch --no-track -c feat/YON-8-topic origin/main
git branch --show-current
git rev-parse HEAD origin/main
git status --porcelain=v1 --untracked-files=all
```

Substitute a unique branch for the requested Linear issue. Both SHAs must match, the branch must be the intended issue branch, and status must remain clean before the first project edit. Record the path, branch and base SHA. If there are changes, unique commits, another task's branch, an existing branch-name collision or uncertain ownership, stop and report rather than resetting, discarding, force-creating a branch or switching away from work. Do not create a second worktree to work around the problem.

For a resumed issue/PR, reuse its verified worktree and issue branch. Verify the recorded task base is an ancestor of HEAD, inspect existing changes, and preserve all task/user commits. Fetching newer main does not authorize resetting or rebasing an in-progress branch, and HEAD need not equal today's origin/main. Continue only when existing work and task ownership are understood.

Keep shell `workdir` and file-tool absolute paths inside the adopted worktree throughout. Creating or selecting a Git worktree does not itself change an already-running session's cwd or sandbox grants. Follow the sandbox-first permission rule in AGENTS.md; obtain narrowly scoped permission if indispensable, or report the blocker. No automatic sandbox escape or permissions-bypass flags are part of this workflow.

After this policy lands, validate a fresh-session issue/demo: start with `codex --worktree`, request an issue, and record the provisioned path, initial Git state, fetched main SHA, issue branch and equal base SHAs before the first edit. Confirm no additional worktree was created. The existing YON-7 worktree check is historical evidence and does not substitute for that fresh-session demo. Keep YON-6 unstarted until YON-7 is completed by the human.

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
