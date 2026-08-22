# Memory sources

Agent tools write project-level memory outside the repo, in their own home directories. This file says where those stores live, which of them are writable, and how to find the one belonging to the project being curated.

A source that is missing or empty is a no-op, not an error.

## Finding this project's store

Claude Code names a project's directory after its absolute path, with every non-alphanumeric character replaced by `-` and case preserved:

```
/Users/alice/Dev/my_skill   ->  -Users-alice-Dev-my-skill
/Users/alice/.dotfiles      ->  -Users-alice--dotfiles
```

If the derived name is not there, list the directories under `~/.claude/projects/` and ask the user which one belongs to this project. Never guess.

## The three sources

| Source | Location | Format | Writable |
|---|---|---|---|
| Claude Code | `~/.claude/projects/<slug>/memory/` | one markdown file per fact, plus a `MEMORY.md` index | yes |
| Codex | `~/.codex/memories_1.sqlite` | SQLite, table `stage1_outputs` | no |
| Antigravity | `~/.gemini/antigravity-cli/{brain,implicit}/` | markdown artifacts and protobuf | no |

### Claude Code

Each fact is one file carrying frontmatter (`name`, `description`, and a `metadata.type` of `user`, `feedback`, `project` or `reference`). `MEMORY.md` holds a one-line index entry pointing at it.

**The index line is the part that is always loaded.** Deleting a memory file means deleting its `MEMORY.md` line in the same edit. A file removed on its own leaves a dangling index entry that still spends context every turn.

`feedback` entries duplicate the user's global `~/.claude/CLAUDE.md` more often than any other type, so read that file before judging them.

### Codex

`stage1_outputs` is derived from conversation threads, and a companion `jobs` table tracks watermarks, so the tool regenerates rows after they are removed. Inventory it read-only:

```bash
sqlite3 ~/.codex/memories_1.sqlite "select count(*), max(generated_at) from stage1_outputs;"
```

Report the count and leave removal to Codex itself.

### Antigravity

`brain/<uuid>/` holds markdown artifacts produced during a conversation, each beside a `.metadata.json` carrying a summary. `implicit/*.pb` is protobuf and `conversation_summaries.db` is a summary cache; neither reads as text. There is no project-level memory layer here, so report what `brain/` holds and leave the rest alone.
