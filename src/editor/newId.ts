/**
 * A random identifier. crypto.randomUUID only exists in secure contexts, so a
 * phone opening the dev server over http://192.168.x.x would otherwise fail.
 */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
