export const config = {
  repository: import.meta.env.VITE_REPOSITORY_URL as string | undefined,
};
export function repositoryUrl() {
  try {
    const u = new URL(config.repository ?? "");
    return u.protocol === "https:" && u.hostname === "github.com"
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
