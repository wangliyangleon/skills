# liyang-skills

Personal Agent Skills library - usable across all projects (quant work, personal projects, games), and across any Agent-Skills-compatible tool, not just Claude Code.

Each skill is a plain `SKILL.md` file following the open [Agent Skills standard](https://agentskills.io). The same file works unmodified in Claude Code, Codex CLI, Antigravity CLI, and other adopting tools - only the install *location* differs per tool, which is what the installer below handles.

## Install

### Option A: straight from GitHub (no npm publish needed)

```bash
npx --package=github:wangliyangleon/skills liyang-skills
```

This installs every skill in this repo into:
- `~/.claude/skills/` (Claude Code) - verified against Claude Code's own docs
- `~/.codex/skills/` (Codex CLI) - verified against OpenAI's own docs
- `~/.gemini/config/skills/` (Antigravity CLI) - verified against Google's own docs

Other flags:

```bash
# see what's available without installing anything
npx --package=github:wangliyangleon/skills liyang-skills --list

# target specific tools; cursor/gemini are unverified against first-party
# docs, so they're opt-in only
npx --package=github:wangliyangleon/skills liyang-skills --agents=claude,codex,antigravity,cursor,gemini
```

Share the exact same command with anyone - no npm account, no publishing, no GitHub auth needed since the repo is public.

### Option B: from the npm registry

Same installer, shorter command, once the package has been published:

```bash
npx liyang-skills
```

This requires a one-time publish, which only the package owner can do (needs an npm account logged in on that machine):

```bash
npm login
npm publish
```

The package name `liyang-skills` is currently free on the npm registry. After publishing, `npx liyang-skills` and `npx --package=github:wangliyangleon/skills liyang-skills` behave identically - the registry route is just shorter to type and doesn't require the repo to stay public.

## ul-mode

[ul-mode](skills/ul-mode/SKILL.md) guides feature implementation, bug fixes, and refactoring with three stages: **First Make it Work**, **Then Make it Right**, and **Follow Practice**. Its instructions are written in Chinese.

It favors direct code, current requirements, and extending existing business-contract tests. Temporary TDD cases are consolidated only after their regression protection is preserved. It keeps documentation and progress reports small, requires no companion quality tools, and leaves commits, pushes, and cleanup subject to task authorization.

After installing with one of the commands above, invoke it with your task:

```text
# Codex
$ul-mode Implement the file-import feature defined in the current MVP PRD.

# Claude Code
/ul-mode Implement the file-import feature defined in the current MVP PRD.
```

Adapted from the engineering principles and three-stage organization of [Uncle Bob's ub-mode](https://github.com/unclebob/ub-mode), with project-specific testing and delivery preferences. This is a customized skill, not a full translation of the original.

## Repo layout

```
skills/
  ul-mode/
    SKILL.md                             # concise coding and testing principles
  slim-plan/
    SKILL.md                             # the actual skill
  curate-docs/
    SKILL.md
    MEMORY-SOURCES.md                    # reference file, installed alongside
bin/install.js                           # cross-tool installer, zero dependencies
package.json
```

A skill directory is copied whole, so a `SKILL.md` that has grown too long can push reference material into a sibling file and point at it with a relative link. The sibling ships to every tool the skill does.

## Adding a new skill

1. `mkdir -p skills/<new-skill>`
2. Add `skills/<new-skill>/SKILL.md`, plus any sibling files it points at.
3. Commit and push. `npx ... liyang-skills` picks it up automatically - no changes needed to `bin/install.js`.

## Updating a skill

Edit its `SKILL.md` or anything beside it, commit, push. npx users get the update next time they run the install command (it always re-copies the current version).
