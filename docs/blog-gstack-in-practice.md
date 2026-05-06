# gstack in Practice: A Solo Developer's Toolkit for AI-Assisted Engineering

I run a fleet of Linux servers, build system tools, and ship side projects. I do
all of it with Claude Code and a skill framework called
[gstack](https://github.com/garrytan/gstack), built by Garry Tan. This post is
about what gstack does for me in practice, why I forked it, and how I use it
across seven machines every day.

## What gstack is

gstack is a skill framework for AI coding agents. It ships as a set of
prompt-engineered workflows that plug into Claude Code (and Codex, Gemini CLI,
and others). Each skill is a structured methodology: `/investigate` doesn't
just debug, it enforces four phases (investigate, analyze, hypothesize,
implement) and an iron law (no fixes without root cause). `/ship` doesn't
just push code, it detects the base branch, runs tests, reviews the diff,
bumps the version, updates the changelog, and creates the PR.

There are 46 skills covering the full development lifecycle:

- **Ideation**: `/office-hours` runs a YC-style diagnostic on your idea
- **Planning**: `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`
  each review a plan from a different angle
- **Building**: `/investigate` for bugs, `/design-consultation` for design
  systems, `/browse` for headless browser automation
- **Quality**: `/qa` tests and fixes, `/cso` runs OWASP Top 10 + STRIDE
  security audits, `/review` does pre-landing code review
- **Shipping**: `/ship` handles the full PR workflow, `/canary` monitors
  production after deploy

The key insight from Garry's [ETHOS.md](https://github.com/garrytan/gstack/blob/main/ETHOS.md)
is that AI makes the marginal cost of completeness near-zero. The last 10% that
teams used to skip? It costs seconds now. So do the complete thing. Every time.

## Why I forked it

The upstream repo at [github.com/garrytan/gstack](https://github.com/garrytan/gstack)
is designed for Garry's workflow. My fork at
[github.com/kshartman/gstack](https://github.com/kshartman/gstack) adapts it
for mine. The fork stays in sync with upstream (I merge regularly) but adds:

**Multi-machine deployment.** I run gstack on seven machines (cs, dev, xt, ws,
trex, lakedev, plus my local workstation). The fork's install script handles
remote deployment over SSH, installs dependencies, and logs every deployment.
One command updates all machines: `./install -y --host cs`.

**Token budget management.** Claude Code allocates 2% of its context window for
skill descriptions. With 46 skills, the raw descriptions blew past that budget
and Claude was dropping 52 of them after context compaction. My fork
auto-truncates descriptions at generation time (22K chars down to 7.5K) and
auto-injects routing triggers extracted from the full descriptions, so nothing
gets lost.

**Fork-aware upgrade checks.** Upstream uses a simple version check. My fork
distinguishes between "upstream moved ahead" and "your fork has updates you
haven't pulled" so I'm never confused about which direction to update.

The fork never modifies upstream template files. All changes happen in the
generator (`gen-skill-docs.ts`), the install script, and test fixtures.
Upstream merges are clean.

## How I actually use it

I use gstack across everything I build: system tools and fleet management
utilities, a portfolio trading system, and client projects. The skills adapt
to the domain because they encode process, not technology assumptions.

### Trading system

The portfolio trading system is where the full pipeline earns its keep.
`/plan-ceo-review` pressure-tests strategy decisions before I write code.
`/plan-eng-review` catches architecture issues in the data pipeline.
`/cso` is non-negotiable here: API keys, credential storage, input
validation on market data, rate limiting. The security audit runs on every
change, not just at ship time.

### System tools and fleet management

Monitoring scripts, deployment automation, data pipelines. Even personal
tools get the security pass because they touch the filesystem, processes,
and network.

**Typical flow:**
`/office-hours` &rarr; `/plan-eng-review` &rarr; build &rarr; `/qa` &rarr; `/cso` &rarr; `/ship`

The `/cso` step catches things I'd miss: hardcoded paths, missing input
validation on CLI args, overly permissive file permissions. For system tools,
these aren't theoretical OWASP exercises, they're real attack surface.

### Client projects

For client work, the review skills are the differentiator. `/plan-ceo-review`
asks whether I'm building the right thing before I build it. `/autoplan`
gives me a full CEO, design, eng, and DX review in one command, which means
every deliverable gets the same rigor whether the budget is tight or not.
AI makes thoroughness free.

### Bug hunts

`/investigate` is the skill I reach for most. It enforces the discipline I'd
skip under time pressure: no jumping to fixes before you have a root cause.
The four-phase structure (investigate, analyze, hypothesize, implement) means
I actually understand what broke before I change anything.

## The skill catalog

I built a [skill catalog](https://cs.bogometer.com/gstack/) that shows every
skill with its full upstream description, triggers, and usage flows. It's
generated from the same template files that produce the skills, so it's always
current. The cheat sheet at the top is the quick reference; the full catalog
below has Garry's original descriptions with all the context and nuance.

## The numbers

From Garry's compression table, which matches my experience:

| Task type | Human team | AI + gstack | Compression |
|-----------|-----------|-------------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |

The skills don't write better code than a senior engineer. They enforce the
process a senior engineer would follow if they had unlimited patience: always
review, always test, always check security, always write the changelog. The
AI has unlimited patience. The skill framework makes sure it uses it.

## Links

- **Upstream**: [github.com/garrytan/gstack](https://github.com/garrytan/gstack)
- **My fork**: [github.com/kshartman/gstack](https://github.com/kshartman/gstack)
- **Skill catalog**: [cs.bogometer.com/gstack](https://cs.bogometer.com/gstack/)
- **Builder ethos**: [ETHOS.md](https://github.com/garrytan/gstack/blob/main/ETHOS.md)
