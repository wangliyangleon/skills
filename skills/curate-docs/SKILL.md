---
name: curate-docs
description: Audit and restructure a project's documentation down to a small durable layout - glossary, ADRs, architecture map, product non-goals - distilling, relocating or deleting every document that cannot earn its place. Nothing is rewritten or deleted without the user confirming it first.
argument-hint: [scope (optional, defaults to docs/)]
disable-model-invocation: true
---

# Curate Docs

## Role and goal

Act as the **curator** of this project's documentation. A curated collection earns its value from what it excludes. Documentation accumulates because writing feels productive and deleting feels risky, until reading the collection costs more than it repays and its stale claims actively mislead the agents and people who trust it.

Your goal is to bring the project to the **target layout** below and make every surviving document earn its place. Analysis first, writes only after the user has seen them.

**This skill never modifies source code.** If a document and the code disagree, the document is the suspect, and only the user decides which one is wrong.

## The one test

> A document earns its place only if it holds information that cannot be recovered from the code, or can only be recovered at high cost.

Apply it to every document, and to every section inside a document that survives.

| Recoverability | Content | Verdict |
|---|---|---|
| Not recoverable | why a decision was made, rejected alternatives, prohibitions and traps, product intent, domain vocabulary, constraints imposed from outside the repo | highest value, keep |
| Expensive to recover | a flow assembled across many files, what sits behind an indirection layer (dependency injection, code generation, plugin registration, build-time moves) | keep, and keep terse |
| Cheap to recover | file and module inventories, function signatures, parameter meanings, what a class does, how a function is called | delete, the code says it better and stays true |

**Prohibitions outrank descriptions.** "Do not edit X, it is generated", "Y looks wrong but is deliberate", "we tried Z and it failed because W" cannot be learned by reading the code at all. Descriptions of what the code does can.

## Three tenses

Staleness only applies to one of them. Sort each document before judging it:

- **Current-state** - architecture map, README, glossary. Claims to describe how things are *now*, so it rots. Must match the code, or be corrected, or go.
- **Historical record** - ADR, post-mortem. A dated record of a moment, so it cannot rot: it never claimed to be current. Never rewrite one to match today's code; supersede it and leave the original standing.
- **Future intent** - plan, PRD, roadmap, feature status. Expires on delivery. This is work tracking that landed in the filesystem by mistake, and it is the usual reason a `docs/` directory has grown out of control.

## Target layout

Everything durable lives in one of these homes. There are no others.

| Home | Holds | Notes |
|---|---|---|
| `README.md` | what the project is, install, usage | for humans and users |
| `CLAUDE.md` or `AGENTS.md` | core value, non-goals, pointers to the rest | always in context, so every line is a recurring cost - keep the whole block under ~20 lines |
| `CONTEXT.md` (repo root) | domain glossary, nothing else | no implementation detail, no spec, no scratch |
| `docs/adr/NNNN-slug.md` | decisions and their reasons | append-only: supersede, never edit |
| `docs/architecture.md` | navigation map | only what search gets wrong - see Step 5 |
| `docs/agents/*.md` | toolchain and tracker configuration | leave alone if present, it is machine-facing config |

**Create a home only when there is something to put in it.** An empty `docs/adr/` is scaffolding, and scaffolding is what got the project here. If the `domain-modeling` skill is installed, use its `CONTEXT-FORMAT.md` and `ADR-FORMAT.md` for the exact formats.

Everything else is not documentation and does not belong in the repo:

- **Feature plans, PRDs, specs, tickets, status** - the issue tracker. A closed issue is dated, immutable and searchable, and can never be mistaken for a description of the present.
- **Session handoffs, generated reports** - the OS temp directory.
- **Research notes** - a throwaway branch or somewhere outside the repo. Notes on third-party APIs rot faster than anything else in the collection.

## Hard constraints

- Never edit source code, tests, or build configuration.
- Never touch `CHANGELOG.md` or any file marked auto-generated.
- Never delete or overwrite a file the user has not seen your intent for.
- Never invent product intent. Core value, non-goals and roadmap exist only in the user's head; extract candidates and confirm, never author them.
- Edit whichever of `CLAUDE.md` / `AGENTS.md` already exists. If both are absent, ask which to create; never create the second one alongside the first.
- Write in the project's existing documentation language.

## Step 0: Make deletion cheap

Run `git status --short`. If the tree is dirty, stop and ask the user to commit or stash first.

A clean tree is what makes this skill safe: every deletion is one `git checkout` away from returning, so the curation can be decisive instead of timid. Say this to the user when you ask.

## Step 1: Inventory the doc surface

Scope defaults to `docs/`. If `$ARGUMENTS` names a directory or describes a narrower target, use that instead.

Read every markdown file in scope **in full** - a title lies about content more often than not. Also read the root-level markdown (`README.md`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`) whether or not it is in scope, since those are the homes distilled content moves into.

Then gather evidence per document, so the verdict rests on facts rather than impressions:

- **Broken references.** Grep every file path, module name and symbol the document mentions. Ones that no longer exist are proof of rot and cost nothing to check.
- **Age against churn.** Compare `git log -1 --format=%as -- <doc>` with the commit activity in the code it describes. A document untouched while its subject churned is stale until proven otherwise.
- **Tense markers.** Checkboxes, "will", "planned", "TODO", milestone dates - all signal future-intent, which belongs on the tracker.
- **Overlap.** Group documents covering the same topic. Where several cover one topic and none is authoritative, at most one survives.

## Step 2: Assign a verdict to every document

One of four, with the evidence behind it:

- **Keep** - has a home in the target layout, claims match the code, passes the one test.
- **Distill** - durable content buried in perishable content. Name the exact lines worth saving and the home each moves to, then the original goes.
- **Relocate** - not documentation. Name the destination from the target layout section.
- **Delete** - everything in it is recoverable from code, superseded, or was never true.

An aspirational document - one describing how the system *should* work, that the code never matched and git shows never landed - is a Delete, not a Distill. Check the history before deciding; the alternative reading is that the code is wrong, and that is a question for the user.

## Step 3: Confirm before writing

Present a single table of every document with its verdict, evidence, and destination. Then:

- **Keep with no edits** needs no confirmation. List it and move on.
- **Everything else** needs the user's go-ahead. Batch the obvious ones into a single approval; the user should not have to answer ten times to approve ten identical deletions.
- **The four cases below you cannot judge alone.** Ask each one separately, and ask a real question - "this document says X, the code does Y, which is right?" - never "what would you like me to do with this file?".

1. **A document that contradicts the code.** It is either a stale document or a live bug, and the difference is invisible from here.
2. **A document describing unshipped work.** Is the work live or abandoned? That decides tracker or bin.
3. **Anything about product intent** - value, non-goals, roadmap, scope decisions.
4. **Anything written for an audience outside the repo** - users, contributors, downstream teams. You cannot see whether that audience exists.

Iterate until every verdict is settled.

## Step 4: Execute, in this order

1. **Distill first.** Write the extracted content into its home and show it to the user before removing the source. Losing a distillation because the original was deleted first is the one unrecoverable mistake available here.
2. **Relocate.** For tracker-bound content, create the issue and confirm it exists before deleting the file. For temp-directory and throwaway-branch destinations, move rather than copy.
3. **Delete last**, in one commit, so a single revert restores the whole sweep.

An ADR is worth writing during distillation only when all three hold: **hard to reverse**, **surprising without context**, and **the result of a real trade-off**. Two out of three is not enough. Keep it to a paragraph - the value is recording that a decision happened and why, not filling in sections. Number it above the highest existing ADR.

A glossary term belongs in `CONTEXT.md` only when it is specific to this project's domain. General programming concepts do not belong there however much the project uses them.

## Step 5: Fill the two homes that are usually empty

Most projects reach this step missing both. Neither can be authored from the code alone, and both are read constantly, so their line budgets are strict.

**`docs/architecture.md` - the navigation map.**

Every line must answer: *what would an agent get wrong, or waste a search on, if this line were absent?* A line that fails that test is describing something search already answers, and search stays true for free.

Include only: module ownership that the naming does not reveal; where an indirection actually lands (dependency injection, code generation, plugin registration, build-time moves); a flow that exists in no single file; and traps - generated files, deliberate-looking-wrong code, the file that looks like the entry point but is not.

Exclude directory trees, file inventories, and anything restating a name that is already descriptive.

Past roughly 50 lines, the surplus is failing the test. Cut it.

**Core value and non-goals in `CLAUDE.md` / `AGENTS.md`.**

- **Core value**: one to three sentences on what this project is for and who for.
- **Non-goals**: what the project deliberately does not do, each with a one-line reason. These are the most durable and most useful lines in the file, because they are prohibitions an agent can check its own proposals against, and they survive a thousand commits untouched.

Harvest candidates from what you read in Step 1 - out-of-scope sections in old specs, rejected proposals, decisions that closed a direction - present them as a list, and let the user cut, correct and add. Write only what the user confirms.

## Step 6: Report

Close with a recap the user can read without scrolling:

- **Before and after**: file count and total line count in scope.
- **What moved where**: each distillation and its destination, one line each.
- **What was deleted**, and the commit that removed it, so the revert is one command away.
- **What was left unresolved**: every document you could not settle, and the question still open on it. This is the most valuable section - an unresolved document that is written down survives the session; one that stays in the conversation does not.
