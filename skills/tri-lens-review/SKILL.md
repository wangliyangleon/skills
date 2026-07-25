---
name: tri-lens-review
description: Reviews a product or codebase through three independent lenses - Product Manager, User, and Architect - then merges the findings into a single dated proposal document under docs/. Each item is tagged with lens, type, priority (P0-P3), complexity (XS-XL), scope, an AI-speed schedule estimate, status, and explicit inter-task dependencies. Read-only - it never modifies product code.
argument-hint: [focus / target description (optional, defaults to the whole current project)]
disable-model-invocation: true
---

# Tri-Lens Review

## Role and goal

Review a product (or a specific part of it) from three deliberately different professional standpoints, then consolidate everything into one actionable proposal. The value of this skill comes from keeping the three viewpoints **genuinely independent** while they analyze, and only merging at the end - a single reviewer wearing three hats tends to blur them and miss the tensions between them (e.g. the PM wants to add a flow, the architect knows it breaks a module boundary, the user finds it confusing). Preserving that friction is the point.

**This run is read-only.** It reads code, docs, and product surface area, and writes exactly one output: the proposal document (plus creating `docs/` if it's missing). No product code, config, or content is modified.

## Input: what to review

`$ARGUMENTS` is a free-text description of the target and/or focus. Interpret it loosely:

- **Empty** → review the whole current project/repo.
- **A path or module name** (e.g. `src/pricing`, "the onboarding flow") → scope the review to that area, but still allow findings about how it fits the larger product.
- **A focus/theme** (e.g. "focus on retention", "we're about to add billing") → review the whole project but weight the lenses toward that theme.
- **A mix** → honor both the scope and the theme.

Before diving in, restate in one line what you understood the target and focus to be, so a wrong interpretation surfaces immediately.

## Step 0: Build shared context

Do this once, up front, so all three lenses start from the same facts (not so they share opinions):

- Read the project structure, README, and any docs/ or product/spec material. Identify: what the product *is*, who it's *for*, and what its *core value* is claimed to be.
- Skim `git log` for the general trajectory and recent focus areas.
- Note the project's documentation language - the output doc must match it.

Capture this as a short neutral brief. Each lens gets this brief as its starting point.

## The three lenses

Run the three lenses as **three independent reviews**. If your runtime supports parallel sub-agents, spawn one sub-agent per lens with the brief below and run them concurrently. If it doesn't, run them sequentially - but reset your framing between them and do not let one lens's conclusions steer the next. Each lens reads the actual product/code and returns raw findings; you (the orchestrator) merge them afterward.

Give every lens the same **return contract** so merging is mechanical. Each finding it returns should carry:

- `title` - one line
- `type` - see the type taxonomy below
- `description + evidence` - what's wrong/missing/opportune, backed by concrete evidence (file path + line range for code-level points; a named user scenario for UX points; a specific product claim for direction points). No speculation stated as fact.
- `suggestion` - concrete proposed change or addition
- `initial_priority` (P0-P3) and `initial_complexity` (XS-XL) - a first guess; you reconcile these at merge time

### Lens 1 - Product Manager

Ask: is the product still on its main line? Specifically:

- Does the current feature set drift away from the core value, or is it coherent? Flag features that pull the product off its main line.
- Is there a clear, articulable methodology / thesis behind the roadmap, or is it a pile of features? If you can't state the product's thesis in one sentence from the evidence, that itself is a finding.
- Is the product actually aimed at a well-defined **core user**, and does it concentrate on creating **core value** for them?
- Given a clear line, where is the next point (or surface) worth pushing on? Propose concrete next bets, tied to the thesis.

### Lens 2 - User

Simulate real usage across **both core and non-core users**. Walk concrete scenarios end to end, not abstractly ("a first-time user on mobile trying to X", "a power user doing Y for the 100th time"). For each scenario surface:

- Friction / clumsy or tedious flows - steps that are slower or more confusing than they should be.
- Missing functionality that the scenario clearly needs.
- Missing feedback - places where the user acts and the product gives no confirmation, progress, or error signal.
- Concrete fixes or additions for each pain point.
- **Redundant features the user probably doesn't need** - not everything is an addition; call out surface area that could be cut to reduce confusion.

### Lens 3 - Architect

Start from the high-level engineering architecture, not line-by-line:

- Module separation and boundaries - are responsibilities cleanly split, or are there tangles/leaks that will get worse?
- Architectural design and tech/stack choices - do they still fit the *current* product needs and the *medium-to-long-term* direction (from the PM brief and roadmap)? Flag where they'll bottleneck growth.
- Revisit unresolved / deferred design questions - open decisions, TODO-level architectural debt, "we'll figure this out later" spots. Either answer them or frame the decision that's still owed.

## Merge: from findings to a proposal

Once all three lenses return, consolidate:

1. **De-duplicate and reconcile.** The same underlying issue may show up from two lenses (e.g. user finds a confusing flow, architect finds the module that causes it). Merge into one item, note that multiple lenses converged (that raises confidence and usually priority), and record all originating lenses.
2. **Assign final priority and complexity** using the rubrics below (don't just average the lenses' guesses - re-judge with full context).
3. **Assign task IDs and dependencies** (below).
4. **Estimate an AI-speed schedule** (below).

### Type taxonomy

Pick the closest; add your own if none fit. Suggested types: `direction-drift`, `missing-feature`, `ux-friction`, `missing-feedback`, `redundant-surface`, `next-bet`, `module-coupling`, `architecture-debt`, `tech-choice`, `open-design-question`.

### Priority (P0-P3, Buganizer-style)

- **P0** - Blocks core value or a critical user journey, or the product has drifted fundamentally off its main line. Needs immediate attention; no reasonable workaround.
- **P1** - Significant impact on core users or the product's main line. Should be addressed soon. A workaround may exist but its cost is clearly felt.
- **P2** - Moderate impact. Worth doing and fits normal scheduling. An acceptable workaround exists.
- **P3** - Minor improvement, nice-to-have, or redundant-surface cleanup. Safe to defer.

### Complexity (XS-XL, by estimated files touched + LOC)

These are anchors, not hard rules - adjust for genuine difficulty (a 30-line change to a load-bearing module can warrant a higher band).

- **XS** - ~1 file, under ~20 lines.
- **S** - 1-2 files, under ~100 lines.
- **M** - a handful of files, ~100-300 lines.
- **L** - spans several modules, ~300-1000 lines.
- **XL** - cross-cutting or architecture-level; many modules, over ~1000 lines, or requires a significant refactor/migration.

### AI-speed schedule

Estimate how long the item takes **at the pace of an AI agent designing and executing it - not a human's calendar time.** An AI can hold the whole scope in context, write and run code continuously, and iterate fast, so estimates should be dramatically shorter than a human sprint estimate. Anchor off complexity but add slack for uncertainty, verification, and review cycles. Express in AI-time, e.g. `~15 min`, `~1h`, `~half day (AI)`, `~1-2 days (AI)`. State the unit explicitly so no one misreads it as human days.

### Task IDs and dependencies

- Give every proposal item a stable ID: `T-1`, `T-2`, `T-3`, ...
- For **every** item, state its dependencies explicitly - including when there are none. Write `depends on: none` or `depends on: T-1, T-4`.
- A dependency means T-x cannot correctly start until the listed tasks are done (shared files, a prerequisite refactor, a decision that must land first). Keep the dependency graph a DAG - if you spot a cycle, that's itself a finding worth surfacing.
- **Do not decide parallelization.** Independent tasks (no dependencies between them) are left for the user to schedule; the user decides at execution time whether to run them in parallel. Your job is only to make the dependency relationships unambiguous.

### Status

Every proposal item also gets a `Status` field, derived from its dependencies:

- `Not Started` - default, for items whose `depends on` is `none` or lists only already-completed tasks.
- `Blocked` - for items whose `depends on` list includes at least one task that is not yet done.

Since every item in a freshly generated proposal is by definition not yet done, only these two statuses are assigned during generation. The document may be revisited and hand-updated later as tasks get executed elsewhere; the additional statuses `Expired`, `Abandoned`, and `Completed: <commit list>` (followed by the commit(s) that implemented it) are reserved for that later bookkeeping - do not assign them here.

## Output

- Create `docs/` at the project root if it doesn't exist.
- Write to `docs/proposal-<YYYY-MM-DD>.md`. If a focus/target was given, append a short slug: `docs/proposal-<YYYY-MM-DD>-<slug>.md`. If a file of that name already exists, append `-2`, `-3`, etc. - never overwrite.
- Write the document in the project's existing documentation language (from Step 0); default to the language the user wrote their request in if the project has no docs.

Use this structure:

### 1. Overview
Target and focus (as you restated it), date, the three-lens methodology in one line, and finding counts broken down by lens and by priority.

### 2. Findings by lens
Three subsections (Product Manager / User / Architect). Under each, the narrative findings from that lens with their evidence. This is where the reasoning and citations live, so the table in section 3 can stay compact.

### 3. Proposal items
A single table, one row per item, sorted by priority (P0 first) then complexity. Columns:

| ID | Title | Lens(es) | Type | Priority | Complexity | Scope (files/areas) | AI schedule | Depends on | Status |

"Lens(es)" lists every originating lens - multi-lens convergence is a signal, so make it visible.

### 4. Dependencies
List each task and its dependencies (`T-4 depends on: T-1, T-3`), including the `none` cases, so the full DAG is readable at a glance. A short Mermaid graph is welcome but optional. Do not prescribe which independent tasks to parallelize.

### 5. Next bets (optional)
If the PM lens surfaced concrete "where to push next" directions that are broader than a single task, summarize them here as a short forward-looking section.

## Additional rules

- Read-only run: the only writes are the proposal document and creating `docs/`.
- Every finding must be backed by concrete evidence from the actual product/code - cite file paths and line ranges for engineering points. No speculation presented as fact; mark genuine uncertainty as such.
- Keep the three lenses independent during analysis; only converge at the merge step.
