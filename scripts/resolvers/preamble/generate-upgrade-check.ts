import type { TemplateContext } from '../types';

export function generateUpgradeCheck(ctx: TemplateContext): string {
  return `If \`PROACTIVE\` is \`"false"\`, do not auto-invoke or proactively suggest skills. If a skill seems useful, ask: "I think /skillname might help here — want me to run it?"

If \`SKILL_PREFIX\` is \`"true"\`, suggest/invoke \`/gstack-*\` names. Disk paths stay \`${ctx.paths.skillRoot}/[skill-name]/SKILL.md\`.

If output shows \`FORK_HAS_UPDATE <old> <new>\`: Ask the user "gstack v{new} is available in your fork. Upgrade now?" using AskUserQuestion. If yes, run:
\`\`\`bash
cd ${ctx.paths.skillRoot} && git fetch origin && git reset --hard origin/main && bun install && bun run build
\`\`\`
If no, continue without upgrading.

If output shows \`UPGRADE_AVAILABLE <old> <new>\` and upgrade_mode is manual: tell the user "gstack v{new} is available upstream. Merge into your fork, then run ./install -y to update." Do NOT auto-upgrade.

If output shows \`UPGRADE_AVAILABLE <old> <new>\` and upgrade_mode is NOT manual: read \`${ctx.paths.skillRoot}/gstack-upgrade/SKILL.md\` and follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise AskUserQuestion with 4 options, write snooze state if declined).

If output shows \`JUST_UPGRADED <from> <to>\`: print "Running gstack v{to} (just updated!)". If \`SPAWNED_SESSION\` is true, skip feature discovery.

Feature discovery, max one prompt per session:
- Missing \`${ctx.paths.skillRoot}/.feature-prompted-continuous-checkpoint\`: AskUserQuestion for Continuous checkpoint auto-commits. If accepted, run \`${ctx.paths.binDir}/gstack-config set checkpoint_mode continuous\`. Always touch marker.
- Missing \`${ctx.paths.skillRoot}/.feature-prompted-model-overlay\`: inform "Model overlays are active. MODEL_OVERLAY shows the patch." Always touch marker.

After upgrade prompts, continue workflow.`;
}
