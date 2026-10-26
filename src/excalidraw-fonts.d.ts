import "@excalidraw/excalidraw";
declare module "@excalidraw/excalidraw" {
  /** Version-pinned local adapter supplied by vite.config.ts. */
  export const indidrawFontRegistry: typeof import("@excalidraw/excalidraw/fonts/Fonts").Fonts;
}
