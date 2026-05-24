import sharp from "sharp";
import { rename } from "node:fs/promises";

/**
 * Center-crop an image file to the target aspect ratio (e.g. "9:16", "16:9", "4:5").
 * Overwrites the original file. Returns the new dimensions.
 */
export async function cropToAspect(filePath: string, aspect: string): Promise<{ width: number; height: number } | null> {
  if (aspect === "1:1") return null;
  const m = /^(\d+):(\d+)$/.exec(aspect);
  if (!m) return null;
  const targetW = parseInt(m[1], 10);
  const targetH = parseInt(m[2], 10);
  if (!targetW || !targetH) return null;

  const img = sharp(filePath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) return null;

  const sourceRatio = meta.width / meta.height;
  const targetRatio = targetW / targetH;

  let cropWidth = meta.width;
  let cropHeight = meta.height;

  if (targetRatio > sourceRatio) {
    // Target is wider — crop height
    cropHeight = Math.floor(meta.width / targetRatio);
  } else if (targetRatio < sourceRatio) {
    // Target is taller — crop width
    cropWidth = Math.floor(meta.height * targetRatio);
  } else {
    return { width: meta.width, height: meta.height };
  }

  const left = Math.floor((meta.width - cropWidth) / 2);
  const top = Math.floor((meta.height - cropHeight) / 2);

  const tmp = filePath + ".tmp.png";
  await sharp(filePath)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .png()
    .toFile(tmp);
  await rename(tmp, filePath);

  return { width: cropWidth, height: cropHeight };
}
