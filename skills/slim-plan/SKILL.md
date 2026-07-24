---
name: slim-plan
description: Analyzes the codebase for redundant code, over-engineered abstractions, and poor-readability code, then produces a task-breakdown planning document under docs/. Use when asked to simplify, clean up, reduce complexity, or "slim down" the codebase. Does not modify any code.
argument-hint: [target-directory (optional, defaults to whole repo)]
disable-model-invocation: true
---

# Code Simplification Plan

## Role and goal

Act as a senior code-quality and refactoring analyst. Your goal is to analyze the codebase (or, if `$ARGUMENTS` specifies a path, only that subdirectory) and identify code that can be simplified, then output a structured task-breakdown document for later, independent rounds of refactoring.

**This skill does not modify any production code.** It only reads code, runs the existing test suite once to establish a baseline, and produces a planning document. Actual refactoring happens in separate, later sessions, one task at a time, guided by the document you produce here.

## Hard constraints

- Do not modify any code files in this run — the only writes allowed are the output document and (if needed) creating the `docs/` directory.
- Do not propose changes that would alter existing business logic, unless explicitly marked "behavior-preserving refactor — must verify all tests still pass."
- Every conclusion must be backed by evidence from the actual code (cite file path + line range). No speculation stated as fact.
- If you cannot determine whether something can be safely simplified (e.g. missing test coverage, can't verify equivalence), mark it "needs human confirmation" instead of deciding unilaterally.

## Step 0: Establish a test baseline

Before analyzing anything, find and run the project's test suite once. Record in the output document:

- The exact command(s) used to run tests.
- Current pass/fail/skip counts. If any tests already fail or are flaky, list them — "all tests pass" in later task acceptance criteria means "matches this baseline," not "100% green."
- If a coverage tool is configured, capture a coverage snapshot. If not, note which major modules appear to have little or no test coverage based on reading the test directory.

If no test suite exists at all, say so prominently: every proposed change then carries elevated risk, and the plan should recommend adding characterization tests before any behavior-preserving refactor.

## Step 1: Identify correctness-critical paths

Before classifying anything as redundant, identify the parts of this codebase where **intentional redundancy** is plausible. These vary by domain — infer them from the project itself. Examples:

- Trading / financial systems: risk checks, order validation, position limits, reconciliation
- Games: save-file integrity, state validation, anti-cheat, settlement/scoring logic
- Web services: authentication, authorization, payment flows, input sanitization
- Any system: invariant checks at trust boundaries, validation repeated across layers

**Rule: duplicated checks on correctness-critical paths are presumed to be defense-in-depth, not redundancy.** They may only be listed as "needs human confirmation," with the duplication described neutrally — never placed in the deletion queue. Genuinely identical utility-function duplication in these areas is still fair game; it's the *repeated validation/guard logic* that gets the presumption of intent.

List the paths you identified as correctness-critical in the output document, with a one-line rationale each, so the human can correct the list.

## Scope: three categories of findings

### 1. Redundant code
Duplicate implementations, dead code (no references / not exported / never called), near-identical logic that could be merged, duplicate utility functions.

- Cite concrete evidence — e.g. "identical logic appears in A, B, and C" or "confirmed via global search: this function has zero references."
- **Dead-code caveat for compiled/dynamic languages**: text search alone is not proof. Registration macros, templates, reflection, dynamic loading, and external consumers of a library can all create invisible references. For any "unused" finding, state which of these risks apply, and require the executing task to verify by actually removing the code and doing a full build + test run. If the project is a library consumed by other repositories, downgrade all unused-export findings to "needs human confirmation."

### 2. Over-engineered code
Abstraction layers, interfaces, design patterns (strategy/factory/observer/etc.), or configurability introduced for "future extensibility" that isn't needed now and isn't likely to be needed.

Judge each case by:
- How many real implementations does this abstraction currently have? (An interface with exactly one implementation is a strong signal.)
- Has this extension point actually been used to extend anything, historically? (`git log` on the file helps: an extension point untouched for years is a signal.)
- Does the roadmap / requirements docs mention a concrete future need for it?
- Apply YAGNI as the default lens.

- If future extension likelihood is **low** → mark as simplifiable, with a concrete simplification (drop the interface and use the concrete class directly, remove the unnecessary factory, flatten the layer).
- If extension likelihood is **reasonable** (multiple real implementations exist, or the roadmap explicitly mentions it) → keep it, and state why in the document.

### 3. Poor-readability code
Overly long functions, deep nesting, magic numbers/strings, bad naming, tangled control flow, large blocks of commented-out code.

- **Exclusion**: performance-critical hot paths (tight loops, serialization/deserialization cores, high-frequency low-level functions). Even if hard to read, do not propose changing them — mark them "performance-sensitive path, not recommended for change" with reasoning (call frequency, benchmark data, profiling evidence).
- **Coverage gate**: readability rewrites are the highest-risk category — behavior-equivalent rewrites are where subtle bugs in error-handling order and edge cases creep in. Only propose readability refactors for code with meaningful test coverage. For uncovered code, either propose "add characterization tests first" as a prerequisite task, or leave it alone.

## Test code policy

Simplifying production code often requires changing tests (e.g. removing an interface removes the mocks built on it). The rule:

- Changing test **structure** is allowed: deleting mocks of removed abstractions, updating construction/setup, renaming.
- Changing what tests **assert about behavior** is not. If a proposed simplification would force an assertion to change, the simplification is not behavior-preserving — reclassify it or drop it.

State explicitly in each task whether test files will need structural changes, and list them.

## Suggested analysis process

1. Read the project structure; understand module boundaries and core domains.
2. Run the baseline (Step 0) and identify correctness-critical paths (Step 1).
3. Go module by module. Useful signals:
   - Repeated code patterns across files
   - Unreferenced exports (with the dead-code caveat above)
   - `TODO` / `FIXME` / stale comments / commented-out blocks
   - `git log` change frequency per file
4. For each finding: classify, record evidence, assess risk.

## Output

- If `docs/` does not exist at the project root, create it.
- Write the document to `docs/slim-plan.md`.
- Structure:

### 1. Overview
Scope, methodology, baseline test results (from Step 0), identified correctness-critical paths (from Step 1), finding counts by category.

### 2. Findings list
Grouped by "Redundant code / Over-engineered / Poor readability." Each entry:
- Finding ID
- Location (file path + line range)
- Description and evidence
- Suggested fix
- Risk level (low / medium / high)
- Flags: performance-sensitive path ("keep as-is" + reason), correctness-critical path ("needs human confirmation"), insufficient test coverage

### 3. Task breakdown
Turn the findings into subtasks. Each subtask must:
- Have a self-contained scope, independent of other subtasks — no overlapping files/modules, so tasks can run in parallel without conflicts.
- Be sized for one session: **target a diff under ~200 lines and at most ~5 files** (production + test files combined). Split larger findings into multiple tasks.
- Have explicit acceptance criteria.

Each subtask entry:
- Task ID
- Title
- Related finding IDs
- Files involved (including test files needing structural changes)
- Priority (redundant code first, then over-engineering, then readability; within a category, low-risk before high-risk)
- Estimated risk
- Acceptance criteria (must include: no business-logic changes; test results match the recorded baseline; full build passes for compiled languages)
- Execution instructions: the exact instruction to hand to the fresh Claude Code session that executes this task later, e.g. "Delete unused function X in file Y, run `<baseline test command>`, confirm results match baseline: N passed, M skipped."

### 4. Dependency notes
If any subtasks have unavoidable overlap (e.g. share a file), call it out explicitly and suggest an execution order. Avoid this wherever possible.

## Additional rules

- This run only produces the analysis document — no refactoring.
- Write the document in English, or match the project's existing documentation language.
