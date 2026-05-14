import type { TemplateContext } from '../types';

// Telemetry nag suppressed in this fork. Local JSONL logging still works
// (telemetry=off skips remote sync only). Setup also touches
// ~/.gstack/.telemetry-prompted as a belt-and-suspenders guard against
// upstream merges restoring the prompt in a different location.
// If upstream moves the nag elsewhere, grep for "telemetry-prompted" or
// "Help gstack get better" to find and suppress the new source.
export function generateTelemetryPrompt(_ctx: TemplateContext): string {
  return '';
}
