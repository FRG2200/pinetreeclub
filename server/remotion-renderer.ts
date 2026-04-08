import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const GENERATIONS_DIR = path.join(process.cwd(), "uploads", "generations");

export interface VideoAdRenderProps {
  productName: string;
  headline: string;
  tagline: string;
  scenes: Array<{ time: string; caption: string; visual: string }>;
  hashtags: string[];
  accentColor?: string;
  productImageUrl?: string;
  brandName?: string;
}

let bundleCache: string | null = null;

async function getBundle(): Promise<string> {
  if (bundleCache) return bundleCache;

  // Lazy-import to avoid loading at startup (heavy)
  const { bundle } = await import("@remotion/bundler");

  const remotionRoot = path.resolve(process.cwd(), "remotion", "Root.tsx");
  console.log("[remotion] Bundling composition...");

  bundleCache = await bundle({
    entryPoint: remotionRoot,
    webpackOverride: (config) => config,
  });

  console.log("[remotion] Bundle ready:", bundleCache);
  return bundleCache;
}

export async function renderVideoAd(props: VideoAdRenderProps): Promise<string> {
  const { renderMedia, selectComposition } = await import("@remotion/renderer");

  if (!fs.existsSync(GENERATIONS_DIR)) {
    fs.mkdirSync(GENERATIONS_DIR, { recursive: true });
  }

  const outputFile = path.join(
    GENERATIONS_DIR,
    `video-ad-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
  );

  const serveUrl = await getBundle();

  const inputProps = props as unknown as Record<string, unknown>;

  const composition = await selectComposition({
    serveUrl,
    id: "VideoAd",
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputFile,
    inputProps,
    concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
    onProgress: ({ renderedFrames }) => {
      if (renderedFrames % 30 === 0) {
        console.log(`[remotion] Rendered: ${renderedFrames} frames`);
      }
    },
  });

  console.log("[remotion] Render complete:", outputFile);
  return outputFile;
}
