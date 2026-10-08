export const CELEBRATION_MODES = ["pembuka", "penutup"] as const;

export type CelebrationMode = (typeof CELEBRATION_MODES)[number];

export const CELEBRATION_TITLE = "1st anniversary";
export const CELEBRATION_DATE = "10 October 2026";
export const CELEBRATION_DATE_ISO = "2026-10-10";

export function isCelebrationMode(value: string): value is CelebrationMode {
  return (CELEBRATION_MODES as readonly string[]).includes(value);
}
