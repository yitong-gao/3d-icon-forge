import { GoogleGenAI } from "@google/genai";
import { writeFile } from "node:fs/promises";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set. Copy .env.example to .env and paste your key.");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

export async function generateImage(prompt: string, outPath: string): Promise<{ bytes: number; ms: number }> {
  const ai = getClient();
  const t0 = Date.now();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  let imageData: string | undefined;
  let imageMime = "image/png";
  let textBlocks: string[] = [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      imageData = part.inlineData.data;
      if (part.inlineData.mimeType) imageMime = part.inlineData.mimeType;
    } else if (part.text) {
      textBlocks.push(part.text);
    }
  }

  if (!imageData) {
    const ctx = textBlocks.join(" | ").slice(0, 300);
    throw new Error(`No image returned from model${ctx ? ` (response text: ${ctx})` : ""}`);
  }

  const buf = Buffer.from(imageData, "base64");
  await writeFile(outPath, buf);
  return { bytes: buf.byteLength, ms: Date.now() - t0 };
}

export function imageModelName(): string {
  return MODEL;
}
