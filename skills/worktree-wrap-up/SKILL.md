---
name: worktree-wrap-up
description: Close out a finished worktree - rebase onto latest main, fast-forward merge, push, then clean up the worktree, branches and PR, and recap the work. Use when implementation and verification in a worktree are done and the user wants it landed and the scene tidied ("wrap up the worktree", "merge this back to main and clean up").
disable-model-invocation: true
---

# Worktree wrap-up

## Role and goal

Land the work from a finished worktree onto `main` with **linear history**, then leave no debris behind and tell the user what shipped.

This is the closing half of a worktree workflow whose opening half is `/implement`. It assumes the branch is already implemented, reviewed, and **manually verified by the user**. It does not review code and does not fix bugs.

## Preconditions - check these before touching anything

Stop and ask rather than guess if any of these is unclear:

1. **The session is in a worktree.** If the current directory is not a worktree created for this piece of work, there is nothing to wrap up.
2. **All work is committed.** `git status --short` in the worktree is clean apart from throwaway artifacts (logs, scratch output). Never commit those - if they are untracked noise, leave them; if they keep recurring, offer a `.gitignore` line.
3. **The user has verified the build.** This skill lands code; it does not decide that the code is good. If the user has not said verification passed, ask before proceeding.

## Why fast-forward, not a PR merge

The default here is: **land it locally with `--ff-only`, push, then close the PR if one exists.**

A PR merge button buys exactly two things - review by another human, and a CI gate. In a solo repo with no PR-triggered CI, it buys neither, and clicking "Create a merge commit" injects a merge commit into an otherwise linear history. If the repo *does* have branch protection or PR-triggered CI, that is the signal to invert this: mark the PR ready, let CI run, merge with **Rebase and merge** (never "Create a merge commit"), then `git pull` locally and skip to cleanup.

Check which world you are in before assuming - `gh api repos/{owner}/{repo}/branches/main/protection` and the presence of an `on: pull_request` workflow answer it.

## Step 1: Rebase onto the latest main

```
git fetch origin
git rebase origin/main
```

If the rebase conflicts, stop and resolve with the user - do not improvise a resolution in code you did not write in this session.

If `origin/main` has not moved since the branch was created, the rebase is a no-op. Say so; do not present it as work done.

## Step 2: Re-verify after the rebase

**A rebase is a code change.** It replays your commits onto other people's work, and a clean rebase is not a passing build. Re-run whatever the project uses:

- the full build (every configuration the project maintains - if it has both a debug and a release build directory, both)
- the full test suite
- any smoke/integration script the repo ships

If the rebase was a genuine no-op *and* the suites were green minutes ago, say that and skip - but say it, do not silently skip.

If anything fails here, stop. The wrap-up is blocked, not finished.

## Step 3: Fast-forward merge and push

From the **main checkout**, not the worktree:

```
git -C <main-checkout> merge --ff-only <branch>
git -C <main-checkout> push origin main
```

`--ff-only` is not a stylistic preference - it is the assertion that step 1 actually worked. If it refuses, the branch is not a descendant of main and something in the rebase went wrong; do not reach for a plain `git merge` to force it through.

Never force-push. Never push a non-fast-forward main.

## Step 4: Settle the PR

Whether a PR exists at all depends on how the work started (background/automated sessions often open a draft PR that the local flow never needed).

Check `gh pr list --state all --head <branch>`, then:

- **Branch tip == new main tip** (the normal case after a clean ff-merge): GitHub detects the merge on its own and flips the PR to `MERGED`. Verify with `gh pr view <n> --json state,mergedAt` - do not close it manually, and do not report it as merged until you have seen the state.
- **The tips differ** (you rebased locally, so the pushed branch still carries the pre-rebase SHAs): GitHub cannot see the merge and the PR stays open. Before closing it, **prove nothing was lost**: `git diff <remote-branch-tip> main -- <files that branch touched>` must be empty. `git cherry` is not sufficient here - a rebase changes patch ids, so it reports false positives. Only then `gh pr close <n>` with a comment naming the commits that landed.

## Step 5: Clean up

In order:

1. **Leave and delete the worktree.** If the session entered it via a worktree tool, use that tool's exit-and-remove action rather than `git worktree remove`, so the session's working directory is restored too. Read its output carefully: wording like "discarded N commits" refers to deleting the *branch ref*, not the commits - confirm they are on `main` before believing anything was lost.
2. **Delete the local branch**, then the remote one:
   ```
   git branch -D <branch>
   git push origin --delete <branch>
   ```
   `git branch -d` (lowercase) will often refuse here, complaining the branch is "not fully merged" - it compares against the branch's *upstream*, which still points at the pre-rebase commits, not against `main`. Read its own hint: it says "even though it is merged to HEAD". Confirm the merge into main yourself, then use `-D`.
3. **Sweep for older debris.** `git worktree list` and `git ls-remote --heads origin` will surface leftovers from previous rounds. Report them; delete them only with the user's go-ahead, and only after the same content-equivalence check as step 4.

## Step 6: Rebuild the main checkout

The main checkout's build directories are now stale - they predate the merge. Rebuild **every** configuration the project maintains.

This is not housekeeping, it is the single highest-yield step in this skill. A stale binary in the main checkout is indistinguishable from "the feature does not work": the next verification run silently exercises the old code and the user concludes the change is broken. When the merged work adds an externally observable string (a new log phase, a new flag, a new command), grep the rebuilt binary for it and show the result - that turns "I rebuilt it" into evidence.

## Step 7: Recap

Close with a recap the user can read without scrolling back. Cover:

- **What landed**: the commit range (`<old-main>..<new-main>`), the commit list, and one line on what the change actually does.
- **How it was verified**: which suites ran and their results - concrete numbers, not "tests pass".
- **What was cleaned**: worktree, local branch, remote branch, PR state.
- **What is still open**: anything the work deliberately did not do, any follow-up nobody owns yet, any leftover you found but did not delete. This is the most valuable part of the recap - a gap that is written down at wrap-up time survives; one that stays in the session does not.

State results plainly. If a step was skipped, say it was skipped and why.

## Hard constraints

- Never force-push, never push a non-fast-forward `main`, never rewrite published history.
- Never `git add -A` blind. Check `git status --short` first - LSP indexes (`.cache/clangd/`), build output, and editor droppings get swept in otherwise, and a diff swollen with binary artifacts is nearly impossible to review.
- Deleting remote branches and closing PRs are outward-facing. Do them for the branch this wrap-up is about; for anything older, ask first.
- If verification has not happened, or a suite fails at any point, the wrap-up stops. Report the failure instead of landing the code.
