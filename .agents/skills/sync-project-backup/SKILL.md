---
name: sync-project-backup
description: Verify and synchronize the greenartsw/2026biz1 working copy with GitHub safely. Use when starting or finishing project work, checking whether work is backed up, recovering on another computer, comparing local and remote revisions, or committing and pushing a completed change.
---

# Sync Project Backup

Treat GitHub `greenartsw/2026biz1` and its `main` branch as the durable backup. Preserve user changes and prove synchronization with commit SHAs.

## Start work

1. Confirm the repository root and remote URL.
2. Inspect `git status -sb`; do not discard an existing change.
3. Fetch `origin` with pruning.
4. Compare `HEAD`, `main`, and `origin/main`.
5. Fast-forward only when the worktree is clean and local history has not diverged.
6. If histories diverge, stop before merging or rebasing and explain the competing commits.

## Finish and back up

1. Review the diff and stage only intended files.
2. Scan staged paths and content for credentials, tokens, private data, and generated clutter.
3. Run checks appropriate to the changed files.
4. Commit with a concise description.
5. Fetch again. Never overwrite remote history.
6. Push the intended branch. For a completed routine backup, ensure the final state is present on `origin/main`.
7. Run `scripts/check-sync.ps1` from this skill.
8. Report success only when the worktree is clean and local `HEAD` equals `origin/main`.

## Recovery on another computer

1. Clone the repository instead of downloading a ZIP.
2. Check out `main` and fetch `origin`.
3. Run `scripts/check-sync.ps1`.
4. Treat ZIP extracts as comparison sources only; they have no commit history and cannot pull or push.

## Failure handling

- Authentication or network failure: preserve the local commit, report that it is not yet backed up, and provide the commit SHA.
- Dirty worktree: identify uncommitted paths; do not claim full backup.
- Ahead of remote: push after confirming scope and remote freshness.
- Behind remote: fast-forward only with a clean worktree.
- Diverged history: do not force-push. Present local-only and remote-only commits before choosing merge or rebase.
- Missing upstream: configure it only after verifying the intended repository and branch.

## Verification

Use `scripts/check-sync.ps1`. A zero exit code means the checked-out branch is `main`, the worktree is clean, the expected remote is configured, and local `HEAD` matches `origin/main` after fetch.
