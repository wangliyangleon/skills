#!/usr/bin/env node
'use strict';

/**
 * Cross-tool Agent Skills installer.
 *
 * Copies each skill under skills/<name>/skills/<name>/SKILL.md into the
 * install directory of whichever Agent-Skills-compatible tool you target.
 * The SKILL.md format is identical across tools (agentskills.io open
 * standard) -- only the destination directory differs.
 *
 * Verified against each tool's own docs at the time of writing:
 *   - Claude Code:      ~/.claude/skills/<name>/        (code.claude.com/docs/en/skills)
 *   - Codex CLI:        ~/.codex/skills/<name>/          (developers.openai.com/codex/skills)
 *   - Antigravity CLI:  ~/.gemini/config/skills/<name>/ (antigravity.google/docs/skills)
 *
 * NOT verified against first-party docs -- off by default, opt in with --agents:
 *   - Cursor, Gemini CLI: paths vary by source and may be wrong or stale.
 *     Check that tool's own docs before relying on this.
 *
 * Usage:
 *   npx --package=github:<user>/<repo> liyang-skills            # install into claude + codex
 *   npx --package=github:<user>/<repo> liyang-skills --list
 *   npx --package=github:<user>/<repo> liyang-skills --agents=claude,codex,antigravity
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.join(__dirname, '..');
const SKILLS_ROOT = path.join(REPO_ROOT, 'skills');

const AGENT_TARGETS = {
  claude: {
    label: 'Claude Code',
    dir: () => path.join(os.homedir(), '.claude', 'skills'),
    confident: true,
  },
  codex: {
    label: 'Codex CLI',
    dir: () => path.join(os.homedir(), '.codex', 'skills'),
    confident: true,
  },
  antigravity: {
    label: 'Antigravity CLI',
    dir: () => path.join(os.homedir(), '.gemini', 'config', 'skills'),
    confident: true,
  },
  cursor: {
    label: 'Cursor',
    dir: () => path.join(process.cwd(), '.cursor', 'skills'),
    confident: false,
  },
  gemini: {
    label: 'Gemini CLI',
    dir: () => path.join(os.homedir(), '.gemini', 'skills'),
    confident: false,
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { agents: null, list: false };
  for (const a of args) {
    if (a === '--list') opts.list = true;
    else if (a.startsWith('--agents=')) {
      opts.agents = a.slice('--agents='.length).split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return opts;
}

function findSkills() {
  // Repo layout: skills/<name>/SKILL.md
  const skills = [];
  if (!fs.existsSync(SKILLS_ROOT)) return skills;
  for (const skillName of fs.readdirSync(SKILLS_ROOT)) {
    const skillDir = path.join(SKILLS_ROOT, skillName);
    if (fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
      skills.push({ name: skillName, dir: skillDir });
    }
  }
  return skills;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const opts = parseArgs();
  const skills = findSkills();

  if (skills.length === 0) {
    console.error('No skills found under skills/. Nothing to install.');
    process.exit(1);
  }

  if (opts.list) {
    console.log('Available skills:');
    for (const s of skills) console.log(`  - ${s.name}`);
    return;
  }

  const requested = opts.agents || Object.keys(AGENT_TARGETS).filter((k) => AGENT_TARGETS[k].confident);

  console.log(`Installing ${skills.length} skill(s) for: ${requested.join(', ')}\n`);

  for (const agentKey of requested) {
    const agent = AGENT_TARGETS[agentKey];
    if (!agent) {
      console.warn(`Unknown agent "${agentKey}", skipping. Known agents: ${Object.keys(AGENT_TARGETS).join(', ')}`);
      continue;
    }
    if (!agent.confident) {
      console.warn(`Note: the ${agent.label} install path below is not verified against that tool's own docs. If it doesn't get picked up, check ${agent.label}'s current documentation for the right location.`);
    }
    const targetRoot = agent.dir();
    for (const skill of skills) {
      const dest = path.join(targetRoot, skill.name);
      copyDir(skill.dir, dest);
      console.log(`  [${agent.label}] ${skill.name} -> ${dest}`);
    }
  }

  console.log('\nDone.');
}

main();
