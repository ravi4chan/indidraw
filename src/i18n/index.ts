// Stable English keys for stored titles and save-state comparisons.
// Display translations and language preferences live in languages.tsx.
export const en = {
  saved: "Saved on this device",
  saving: "Saving…",
  title: "Untitled drawing",
  start: "Start Drawing",
  offline: "Offline · drawing stays on this device",
} as const;
export type MessageKey = keyof typeof en;
export const t = (key: MessageKey): string => en[key];
