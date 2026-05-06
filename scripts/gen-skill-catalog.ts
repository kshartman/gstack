#!/usr/bin/env bun
/**
 * Generate a self-contained HTML skill catalog from .tmpl source files.
 * Shows the full upstream descriptions (not truncated), triggers, voice-triggers,
 * and a quick-reference cheat sheet.
 *
 * Usage: bun run scripts/gen-skill-catalog.ts [--out path]
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const VERSION = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf-8').trim();
const OUT_DEFAULT = path.join(ROOT, 'docs', 'skill-catalog.html');

const outArg = process.argv.indexOf('--out');
const OUT = outArg >= 0 ? process.argv[outArg + 1] : OUT_DEFAULT;

interface SkillInfo {
  name: string;
  description: string;
  triggers: string[];
  voiceTriggers: string[];
  version: string;
  preambleTier: string;
  interactive: boolean;
  allowedTools: string[];
}

function extractFrontmatter(content: string): string {
  const start = content.indexOf('---\n');
  if (start !== 0) return '';
  const end = content.indexOf('\n---', 4);
  if (end === -1) return '';
  return content.slice(4, end);
}

function extractYamlField(fm: string, field: string): string {
  const lines = fm.split('\n');
  let inField = false;
  const result: string[] = [];
  for (const line of lines) {
    if (line.match(new RegExp(`^${field}:\\s*\\|\\s*$`))) { inField = true; continue; }
    if (line.match(new RegExp(`^${field}:\\s*$`))) { inField = true; continue; }
    const singleLine = line.match(new RegExp(`^${field}:\\s+(.+)$`));
    if (singleLine) return singleLine[1].trim();
    if (inField) {
      if (line === '' || /^\s/.test(line)) { result.push(line.replace(/^  /, '')); }
      else break;
    }
  }
  return result.join('\n').trim();
}

function extractYamlList(fm: string, field: string): string[] {
  const lines = fm.split('\n');
  let inField = false;
  const items: string[] = [];
  for (const line of lines) {
    if (new RegExp(`^${field}:`).test(line)) { inField = true; continue; }
    if (inField) {
      const m = line.match(/^\s+-\s+"?([^"]+)"?\s*$/);
      if (m) items.push(m[1]);
      else if (!/^\s*$/.test(line) && !/^\s/.test(line)) break;
    }
  }
  return items;
}

function loadSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];
  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const dir of dirs) {
    const tmplPath = path.join(ROOT, dir, 'SKILL.md.tmpl');
    if (!fs.existsSync(tmplPath)) continue;
    const content = fs.readFileSync(tmplPath, 'utf-8');
    const fm = extractFrontmatter(content);
    if (!fm) continue;

    const name = extractYamlField(fm, 'name') || dir;
    const description = extractYamlField(fm, 'description');
    const triggers = extractYamlList(fm, 'triggers');
    const voiceTriggers = extractYamlList(fm, 'voice-triggers');
    const version = extractYamlField(fm, 'version') || '—';
    const preambleTier = extractYamlField(fm, 'preamble-tier') || '—';
    const interactive = fm.includes('interactive: true');
    const allowedTools = extractYamlList(fm, 'allowed-tools');

    skills.push({ name, description, triggers, voiceTriggers, version, preambleTier, interactive, allowedTools });
  }
  return skills;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHtml(skills: SkillInfo[]): string {
  const now = new Date().toISOString().split('T')[0];

  const cheatRows = skills.map(s => {
    const firstSentence = s.description.replace(/\s+/g, ' ').match(/^[^.!]+[.!]/)?.[0] || s.description.slice(0, 100);
    const triggerStr = s.triggers.slice(0, 3).map(t => `<code>${escapeHtml(t)}</code>`).join(', ');
    return `<tr>
      <td><a href="#skill-${escapeHtml(s.name)}">${escapeHtml(s.name)}</a></td>
      <td>${escapeHtml(firstSentence)}</td>
      <td>${triggerStr}</td>
      <td>${s.interactive ? 'Yes' : '—'}</td>
    </tr>`;
  }).join('\n');

  const catalogEntries = skills.map(s => {
    const descHtml = escapeHtml(s.description).replace(/\n/g, '<br>');
    const triggerBadges = s.triggers.map(t => `<span class="badge trigger">${escapeHtml(t)}</span>`).join(' ');
    const voiceBadges = s.voiceTriggers.map(t => `<span class="badge voice">${escapeHtml(t)}</span>`).join(' ');
    const toolBadges = s.allowedTools.map(t => `<span class="badge tool">${escapeHtml(t)}</span>`).join(' ');

    return `<div class="skill-card" id="skill-${escapeHtml(s.name)}">
      <div class="skill-header">
        <h3>/${escapeHtml(s.name)}</h3>
        <div class="skill-meta">
          <span class="version">v${escapeHtml(s.version)}</span>
          <span class="tier">Tier ${escapeHtml(s.preambleTier)}</span>
          ${s.interactive ? '<span class="interactive">Interactive</span>' : ''}
        </div>
      </div>
      <div class="description">${descHtml}</div>
      ${s.triggers.length > 0 ? `<div class="section"><strong>Triggers:</strong> ${triggerBadges}</div>` : ''}
      ${s.voiceTriggers.length > 0 ? `<div class="section"><strong>Voice:</strong> ${voiceBadges}</div>` : ''}
      ${s.allowedTools.length > 0 ? `<div class="section"><strong>Tools:</strong> ${toolBadges}</div>` : ''}
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>gstack Skill Catalog — v${escapeHtml(VERSION)}</title>
<style>
  :root {
    --bg: #0d1117; --surface: #161b22; --border: #30363d;
    --text: #e6edf3; --text-muted: #8b949e; --accent: #58a6ff;
    --green: #3fb950; --orange: #d29922; --purple: #bc8cff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    background: var(--bg); color: var(--text); line-height: 1.6;
    max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem;
  }
  h1 { font-size: 2rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.5rem; margin: 2.5rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
  h3 { font-size: 1.1rem; color: var(--accent); }
  .subtitle { color: var(--text-muted); margin-bottom: 2rem; }
  .stats { display: flex; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem 1.5rem; }
  .stat-num { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
  .stat-label { color: var(--text-muted); font-size: 0.85rem; }

  /* Cheat sheet table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  th { text-align: left; padding: 0.6rem 0.8rem; border-bottom: 2px solid var(--border); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 0.5rem 0.8rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  tr:hover { background: var(--surface); }
  td a { color: var(--accent); text-decoration: none; }
  td a:hover { text-decoration: underline; }
  td code { background: var(--surface); padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.8rem; }

  /* Skill cards */
  .skill-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
  .skill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
  .skill-meta { display: flex; gap: 0.5rem; }
  .skill-meta span { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
  .version { background: #1f6feb33; color: var(--accent); }
  .tier { background: #3fb95033; color: var(--green); }
  .interactive { background: #d2992233; color: var(--orange); }
  .description { color: var(--text-muted); margin-bottom: 0.75rem; font-size: 0.9rem; }
  .section { margin-top: 0.5rem; font-size: 0.85rem; }
  .section strong { color: var(--text); }
  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; margin: 0.15rem 0.1rem; font-size: 0.78rem; }
  .badge.trigger { background: #1f6feb22; color: var(--accent); border: 1px solid #1f6feb44; }
  .badge.voice { background: #bc8cff22; color: var(--purple); border: 1px solid #bc8cff44; }
  .badge.tool { background: #30363d; color: var(--text-muted); }

  /* Search */
  .search-box { width: 100%; padding: 0.6rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 1rem; margin-bottom: 1.5rem; outline: none; }
  .search-box:focus { border-color: var(--accent); }
  .search-box::placeholder { color: var(--text-muted); }

  /* Flows */
  .flow { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
  .flow h3 { margin-bottom: 0.5rem; }
  .flow p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem; }
  .flow-chain { display: flex; align-items: center; flex-wrap: wrap; gap: 0.25rem; }
  .flow-chain .step { background: #1f6feb22; color: var(--accent); border: 1px solid #1f6feb44; padding: 0.3rem 0.7rem; border-radius: 4px; font-size: 0.85rem; font-weight: 500; white-space: nowrap; text-decoration: none; }
  a.step:hover { background: #1f6feb44; text-decoration: none; }
  .flow-chain .step.action { background: #30363d; color: var(--text-muted); border-color: var(--border); }
  .flow-chain .arrow { color: var(--text-muted); font-size: 0.8rem; padding: 0 0.15rem; }

  @media (max-width: 600px) {
    body { padding: 1rem; }
    .stats { flex-direction: column; gap: 0.75rem; }
    .skill-header { flex-direction: column; align-items: flex-start; }
    .flow-chain { gap: 0.15rem; }
  }
</style>
</head>
<body>

<h1>gstack Skill Catalog</h1>
<p class="subtitle">v${escapeHtml(VERSION)} — Generated ${now} — Full upstream descriptions by <a href="https://github.com/garrytan/gstack" style="color:var(--accent)">Garry Tan</a></p>

<div class="stats">
  <div class="stat"><div class="stat-num">${skills.length}</div><div class="stat-label">Skills</div></div>
  <div class="stat"><div class="stat-num">${skills.reduce((n, s) => n + s.triggers.length, 0)}</div><div class="stat-label">Triggers</div></div>
  <div class="stat"><div class="stat-num">${skills.filter(s => s.interactive).length}</div><div class="stat-label">Interactive</div></div>
  <div class="stat"><div class="stat-num">${skills.filter(s => s.voiceTriggers.length > 0).length}</div><div class="stat-label">Voice-enabled</div></div>
</div>

<input type="text" class="search-box" placeholder="Search skills, triggers, descriptions..." id="search">

<h2>Quick Reference</h2>
<table id="cheat-table">
<thead><tr><th>Skill</th><th>Summary</th><th>Top Triggers</th><th>Interactive</th></tr></thead>
<tbody>
${cheatRows}
</tbody>
</table>

<h2>Usage Flows</h2>

<div class="flow">
  <h3>Personal tool / system utility</h3>
  <p>Side projects that touch the filesystem, processes, or network still need security review. System tools especially.</p>
  <div class="flow-chain">
    <a href="#skill-office-hours" class="step">/office-hours</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-eng-review" class="step">/plan-eng-review</a><span class="arrow">&rarr;</span>
    <span class="step action">build</span><span class="arrow">&rarr;</span>
    <a href="#skill-qa" class="step">/qa</a><span class="arrow">&rarr;</span>
    <a href="#skill-cso" class="step">/cso</a><span class="arrow">&rarr;</span>
    <a href="#skill-ship" class="step">/ship</a>
  </div>
</div>

<div class="flow">
  <h3>Shipping a product feature</h3>
  <p>Full pipeline: validate the idea, review from CEO/eng/design angles, build, test, security audit, ship, and watch production.</p>
  <div class="flow-chain">
    <a href="#skill-office-hours" class="step">/office-hours</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-ceo-review" class="step">/plan-ceo-review</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-eng-review" class="step">/plan-eng-review</a><span class="arrow">&rarr;</span>
    <span class="step action">build</span><span class="arrow">&rarr;</span>
    <a href="#skill-qa" class="step">/qa</a><span class="arrow">&rarr;</span>
    <a href="#skill-cso" class="step">/cso</a><span class="arrow">&rarr;</span>
    <a href="#skill-ship" class="step">/ship</a><span class="arrow">&rarr;</span>
    <a href="#skill-canary" class="step">/canary</a>
  </div>
</div>

<div class="flow">
  <h3>Contributing to open source</h3>
  <p>For repos you don't own. Investigate the issue, build the fix, self-review to match project conventions, then ship the PR.</p>
  <div class="flow-chain">
    <a href="#skill-investigate" class="step">/investigate</a><span class="arrow">&rarr;</span>
    <span class="step action">build</span><span class="arrow">&rarr;</span>
    <a href="#skill-review" class="step">/review</a><span class="arrow">&rarr;</span>
    <a href="#skill-ship" class="step">/ship</a>
  </div>
</div>

<div class="flow">
  <h3>Bug hunt</h3>
  <p>Something's broken. Systematic root-cause analysis, fix it, verify the fix, ship it.</p>
  <div class="flow-chain">
    <a href="#skill-investigate" class="step">/investigate</a><span class="arrow">&rarr;</span>
    <span class="step action">fix</span><span class="arrow">&rarr;</span>
    <a href="#skill-qa" class="step">/qa</a><span class="arrow">&rarr;</span>
    <a href="#skill-ship" class="step">/ship</a>
  </div>
</div>

<div class="flow">
  <h3>Design from zero</h3>
  <p>No existing design system. Research the landscape, explore variants, build it, then polish.</p>
  <div class="flow-chain">
    <a href="#skill-design-consultation" class="step">/design-consultation</a><span class="arrow">&rarr;</span>
    <a href="#skill-design-shotgun" class="step">/design-shotgun</a><span class="arrow">&rarr;</span>
    <a href="#skill-design-html" class="step">/design-html</a><span class="arrow">&rarr;</span>
    <a href="#skill-design-review" class="step">/design-review</a>
  </div>
</div>

<div class="flow">
  <h3>Full plan review (one command)</h3>
  <p>Run CEO, design, eng, and DX reviews sequentially with auto-decisions. One command, fully reviewed plan out.</p>
  <div class="flow-chain">
    <a href="#skill-autoplan" class="step">/autoplan</a>
    <span class="arrow">=</span>
    <a href="#skill-plan-ceo-review" class="step">/plan-ceo-review</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-design-review" class="step">/plan-design-review</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-eng-review" class="step">/plan-eng-review</a><span class="arrow">&rarr;</span>
    <a href="#skill-plan-devex-review" class="step">/plan-devex-review</a>
  </div>
</div>

<h2>Full Catalog</h2>
<div id="catalog">
${catalogEntries}
</div>

<script>
document.getElementById('search').addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#cheat-table tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.skill-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});
</script>

</body>
</html>`;
}

// ─── Main ───────────────────────────────────────────────────
const skills = loadSkills();
const html = generateHtml(skills);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Skill catalog: ${OUT} (${skills.length} skills)`);
