window.EXCALIDRAW_ASSET_PATH = '/';
// Apply the saved theme before first paint, so dark mode never flashes white.
try {
  if (localStorage.getItem("indidraw-theme") === "dark")
    document.documentElement.dataset.theme = "dark";
} catch {
  /* Storage may be blocked; the app applies the default theme. */
}
