# liyang-claude-skills

Personal Agent Skills library — usable across all projects (quant work, personal projects, games), and across any Agent-Skills-compatible tool, not just Claude Code.

Each skill is a plain `SKILL.md` file following the open [Agent Skills standard](https://agentskills.io). The same file works unmodified in Claude Code, Codex CLI, Antigravity CLI, and other adopting tools — only the install *location* differs per tool, which is what the installer below handles.

## Install

### Option A: straight from GitHub (no npm publish needed)

```bash
npx --package=github:wangliyangleon/skills liyang-skills
```

This installs every skill in this repo into:
- `~/.claude/skills/` (Claude Code) — verified against Claude Code's own docs
- `~/.codex/skills/` (Codex CLI) — verified against OpenAI's own docs

Other flags:

```bash
# see what's available without installing anything
npx --package=github:wangliyangleon/skills liyang-skills --list

# target specific tools; antigravity/cursor/gemini are unverified against first-party
# docs, so they're opt-in only
npx --package=github:wangliyangleon/skills liyang-skills --agents=claude,codex,antigravity
```

Share the exact same command with anyone — no npm account, no publishing, no GitHub auth needed since the repo is public.

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

The package name `liyang-claude-skills` is currently free on the npm registry. After publishing, `npx liyang-skills` and `npx --package=github:wangliyangleon/skills liyang-skills` behave identically — the registry route is just shorter to type and doesn't require the repo to stay public.

## Repo layout

```
skills/
  code-simplification-plan/
    SKILL.md                             # the actual skill
bin/install.js                           # cross-tool installer, zero dependencies
package.json
```

## Adding a new skill

1. `mkdir -p skills/<new-skill>`
2. Add `skills/<new-skill>/SKILL.md`.
3. Commit and push. `npx ... liyang-skills` picks it up automatically — no changes needed to `bin/install.js`.

## Updating a skill

Edit its `SKILL.md`, commit, push. npx users get the update next time they run the install command (it always re-copies the current version).
