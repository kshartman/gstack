## CHANGELOG + VERSION style guide

**Versioning invariant (workspace-aware ship).** VERSION is a monotonic ordered
release identifier, not a strict semver commitment. The bump level
(major/minor/patch/micro) expresses intent at ship time. Queue-advancing past a
claimed version within the same bump level is explicitly permitted — if branch A
claims v1.7.0.0 as a MINOR and branch B is also a MINOR, B lands at v1.8.0.0
(still a MINOR relative to main). Downstream consumers must NOT rely on
"MINOR = feature-only, PATCH = fix-only" as a strict contract.

**Scale-aware bumps — use common sense.** When the diff is big, bump MINOR (or
MAJOR), not PATCH. PATCH is for bug fixes and small additions; MINOR is for
substantial new capability or substantial reduction; MAJOR is for breaking changes.

- **PATCH (X.Y.Z+1.0)**: bug fix, doc tweak, small additive change, single
  test/file added. Net diff under ~500 lines, no new user-facing capability.
- **MINOR (X.Y+1.0.0)**: new capability shipped (skill, harness, command, big
  refactor), substantial code reduction (compression, migration), or coordinated
  multi-file change. Net diff over ~2000 lines added/removed, OR a user-visible
  feature you'd put in a tweet.
- **MAJOR (X+1.0.0.0)**: breaking change to public surface (CLI flag rename,
  skill removed, config format changed), OR a release big enough to be the
  headline of a blog post.

If you find yourself debating "is 10K added + 24K removed really a PATCH?" — it
isn't. Bump MINOR. The bump level is communication to the user about what kind of
release this is; don't undersell it.

When merging origin/main brings a higher VERSION, re-evaluate the bump level
against the SCALE of your branch's work, not just whether main moved forward.

**VERSION and CHANGELOG are branch-scoped.** Every feature branch that ships gets its
own version bump and CHANGELOG entry. The entry describes what THIS branch adds —
not what was already on main.

**The CHANGELOG entry is the diff between main and the shipping branch — what users
get when they upgrade. NOT how the branch got there.** A reader landing on the entry
should learn what they can do now that they couldn't before; they should not learn
about the branch's internal version bumps, the bugs we caught and fixed mid-branch,
the plan reviews we ran, or the commits we squashed.

**Never reference branch-internal versions in a CHANGELOG entry.** If your branch
bumped VERSION from v1.5.0.0 → v1.5.1.0 → v1.6.0.0 during development and only the
final v1.6.0.0 ships to main, the entry must read as if v1.5.1.0 never existed.
Concretely, NEVER write:
- "v1.5.1.0 had a bug that v1.6.0.0 fixes"
- "The shipping headline of v1.5.1.0 was broken because..."
- "Pre-fix tests encoded the broken behavior"
- "Two surgical edits, both in the dispatch path"

Instead, describe the released system. The shipped system is what the user gets;
the path to that system is invisible to them.

**When to write the CHANGELOG entry:**
- At `/ship` time (Step 13), not during development or mid-branch.
- The entry covers ALL commits on this branch vs the base branch.
- Never fold new work into an existing CHANGELOG entry from a prior version that
  already landed on main.

**Key questions before writing:**
1. What branch am I on? What did THIS branch change?
2. Is the base branch version already released? (If yes, bump and create new entry.)
3. Does an existing entry on this branch already cover earlier work? (If yes, replace
   it with one unified entry for the final version.)

**Merging main does NOT mean adopting main's version.** Your branch still needs its
OWN version bump on top. Never jam your changes into an entry that already landed
on main. Your entry goes on top because your branch lands next.

**After merging main, always check:**
- Does CHANGELOG have your branch's own entry separate from main's entries?
- Is VERSION higher than main's VERSION?
- Is your entry the topmost entry in CHANGELOG (above main's latest)?
If any answer is no, fix it before continuing.

**After any CHANGELOG edit,** run `grep "^## \[" CHANGELOG.md` to verify no
duplicates and a sensible reverse-chronological order. Gaps between version numbers
are fine. Do not back-fill gaps with placeholder entries.

**Never orphan branch-internal versions.** The final ship consolidates ALL
branch-internal entries into a single entry at the final version. Readers see one
release, not a branch diary.

**Only document what shipped.** Keep out of the CHANGELOG:
- Branch resyncs, merge commits, rebase activity
- Plan approvals, review outcomes, scope negotiations
- "Work queued," "plan approved," "in-progress," "will ship later"
- Version-bump housekeeping when no user-facing work actually landed

If no user-facing change shipped, the honest entry is one sentence:
"Version bump for branch-ahead discipline. No user-facing changes yet."

---

### Release-summary format (every `## [X.Y.Z]` entry)

Every version entry MUST start with a release-summary section, one viewport's worth
of prose + tables. The itemized changelog goes BELOW, separated by `### Itemized changes`.

Structure:

1. **Two-line bold headline** (10-14 words total). Lands like a verdict, not marketing.
2. **Lead paragraph** (3-5 sentences). What shipped, what changed for the user.
3. **A "The X numbers that matter" section** with:
   - One short setup paragraph naming the source of the numbers.
   - A table of 3-6 key metrics with BEFORE / AFTER / Δ columns.
   - 1-2 sentences interpreting the most striking number.
4. **A "What this means for [audience]" closing paragraph** (2-4 sentences).

Voice rules:
- No em dashes (use commas, periods, "...").
- No AI vocabulary (delve, robust, comprehensive, nuanced, fundamental, etc.).
- Real numbers, real file names, real commands. Not "fast" but "~30s on 30K pages."
- Short paragraphs. Connect to user outcomes.
- Be direct about quality.

Target length: ~250-350 words for the summary.

---

### Itemized changes (below the release summary)

Write `### Itemized changes` and continue with detailed subsections (Added,
Changed, Fixed, For contributors). Always credit community contributions with
`Contributed by @username`.

CHANGELOG.md is **for users**, not contributors:
- Lead with what the user can now **do** that they couldn't before
- Use plain language, not implementation details
- Never mention TODOS.md, internal tracking, or contributor-facing details
- Put contributor/internal changes in a separate "For contributors" section
- Every entry should make someone think "oh nice, I want to try that"
