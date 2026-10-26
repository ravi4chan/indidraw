import type { BinaryFiles } from "@excalidraw/excalidraw/types";
// Native backups normalize upstream-inserted SVG images into PNG. This keeps
// the stricter native importer compatible with files exported by this wrapper.
export async function rasterFiles(files: BinaryFiles): Promise<BinaryFiles> {
  const output: BinaryFiles = { ...files };
  for (const [key, file] of Object.entries(files))
    if (file.mimeType === "image/svg+xml") {
      const image = new Image();
      image.src = file.dataURL;
      await image.decode();
      const max = Math.max(image.naturalWidth, image.naturalHeight);
      if (!max) throw new Error("An SVG image has invalid dimensions.");
      const scale = Math.min(1, 4096 / max);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image conversion is unavailable.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      output[key] = {
        ...file,
        mimeType: "image/png",
        dataURL: canvas.toDataURL("image/png") as typeof file.dataURL,
      };
    }
  return output;
}
