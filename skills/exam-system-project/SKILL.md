---
name: exam-system-project
description: "Project-specific workflow for the Exam System repository. Use when working in this repo to follow its required order: read docs, update spec/api/todolist first, implement frontend or backend changes on Windows PowerShell, validate with the correct build/test commands, then commit, push, and prepare a release report."
---

# Exam System Project

Use this skill for any development task inside the `exam_system_new` repository.

## Workflow

1. Read `todolist.md`, `spec.md`, and `api.md` before changing code.
2. Update `spec.md` and `api.md` first when the task changes behavior, UI rules, workflow, or developer assets.
3. Add the task to `todolist.md`, mark progress during execution, and close it after validation.
4. Keep changes minimal and scoped to one task.
5. Validate before finishing. Prefer the smallest command that proves the change.
6. When asked to release, summarize the exact files changed, tests run, commit hash, branch, and push result.

## Execution Rules

- Use Traditional Chinese in user-facing output.
- Use commands compatible with Windows PowerShell 7+.
- Use `apply_patch` for manual file edits.
- Prefer `rg` for file and text search.
- Do not revert unrelated user changes.
- For frontend work, preserve mobile behavior and only expand layouts responsively.
- For backend work, respect the configured Java versions and current project structure.

## Task Routing

- For project context, commands, structure, and release checklist, read `references/project-context.md`.
- For backend behavior or API contracts, read the relevant sections in `spec.md` and `api.md` instead of duplicating them here.
- For frontend page changes, inspect the target page and its shared components before editing.

## Release Output

When the user asks for `commit`, `push`, `發布`, or `發布報告`, include:

- branch name
- commit hash
- commit message
- whether push succeeded
- tests or build commands executed
- known warnings or residual risks
