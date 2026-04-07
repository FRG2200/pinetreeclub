import fs from "node:fs";
import path from "node:path";

const KIE_API_BASE = process.env.KIE_API_BASE_URL || "https://api.kie.ai";
const KIE_API_KEY = process.env.KIE_API_KEY || "";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const GENERATIONS_DIR = path.join(UPLOADS_DIR, "generations");

interface KieTaskResponse {
  code: number;
  msg: string;
  data: { taskId: string } | null;
}

interface KieRecordResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    successFlag: number;
    progress: string;
    response: {
      resultUrls?: string[];
      videoUrl?: string;
      video_url?: string;
      works?: Array<{ resource: { resource: string } }>;
    } | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
}

function headers() {
  return {
    "Authorization": `Bearer ${KIE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

const MODEL_MAP: Record<string, { endpoint: string; modelId: string; type: "gpt4o" | "jobs" | "flux" }> = {
  "GPT-Image-1": { endpoint: "/api/v1/gpt4o-image/generate", modelId: "gpt-image-1", type: "gpt4o" },
  "GPT-Image-1.5": { endpoint: "/api/v1/gpt4o-image/generate", modelId: "gpt-image-1.5", type: "gpt4o" },
  "Nano Banana": { endpoint: "/api/v1/jobs/createTask", modelId: "google/nano-banana", type: "jobs" },
  "Nano Banana Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "nano-banana-pro", type: "jobs" },
  "Nano Banana Pro 4K": { endpoint: "/api/v1/jobs/createTask", modelId: "nano-banana-pro", type: "jobs" },
  "Flux Kontext Pro": { endpoint: "/api/v1/flux/kontext/generate", modelId: "flux-kontext-pro", type: "flux" },
  "Seedream 4.0": { endpoint: "/api/v1/jobs/createTask", modelId: "seedream", type: "jobs" },
  "Seedream 4.5": { endpoint: "/api/v1/jobs/createTask", modelId: "seedream", type: "jobs" },
  "Midjourney V7": { endpoint: "/api/v1/jobs/createTask", modelId: "midjourney/v7", type: "jobs" },
  "Midjourney NIJI 7": { endpoint: "/api/v1/jobs/createTask", modelId: "midjourney/niji-7", type: "jobs" },
  "Ideogram V3": { endpoint: "/api/v1/jobs/createTask", modelId: "ideogram/v3", type: "jobs" },
  "Grok Imagine": { endpoint: "/api/v1/jobs/createTask", modelId: "grok-imagine/text-to-image", type: "jobs" },
  "Grok Imagine Edit": { endpoint: "/api/v1/jobs/createTask", modelId: "grok-imagine/image-to-image", type: "jobs" },
  "Recraft V3": { endpoint: "/api/v1/jobs/createTask", modelId: "recraft/v3", type: "jobs" },
  "Qwen Image": { endpoint: "/api/v1/jobs/createTask", modelId: "qwen/image", type: "jobs" },
  "Veo 3 Fast": { endpoint: "/api/v1/jobs/createTask", modelId: "veo3_fast", type: "jobs" },
  "Veo 3 Quality": { endpoint: "/api/v1/jobs/createTask", modelId: "veo3_quality", type: "jobs" },
  "Veo 3.1 Fast": { endpoint: "/api/v1/jobs/createTask", modelId: "veo3_fast", type: "jobs" },
  "Veo 3.1 Quality": { endpoint: "/api/v1/jobs/createTask", modelId: "veo3_quality", type: "jobs" },
  "Kling 3.0": { endpoint: "/api/v1/jobs/createTask", modelId: "kling-3.0/video", type: "jobs" },
  "Kling 3.0 1080p": { endpoint: "/api/v1/jobs/createTask", modelId: "kling-3.0/video", type: "jobs" },
  "Kling 2.6": { endpoint: "/api/v1/jobs/createTask", modelId: "kling-2.6/text-to-video", type: "jobs" },
  "Runway Aleph": { endpoint: "/api/v1/jobs/createTask", modelId: "runway-aleph", type: "jobs" },
  "Sora 2": { endpoint: "/api/v1/jobs/createTask", modelId: "sora-2/video", type: "jobs" },
  "Sora 2 Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "sora-2-pro/video", type: "jobs" },
  "Seedance 1.0 Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "seedance-1.0-pro", type: "jobs" },
  "Seedance 1.5 Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "seedance-1.5-pro", type: "jobs" },
  "WAN 2.5": { endpoint: "/api/v1/jobs/createTask", modelId: "wan-2.5/video", type: "jobs" },
  "Hailuo 2.3 Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "hailuo-2.3-pro/video", type: "jobs" },
  "Vidu Q3 Pro": { endpoint: "/api/v1/jobs/createTask", modelId: "vidu-q3-pro/video", type: "jobs" },
  "Midjourney Video": { endpoint: "/api/v1/jobs/createTask", modelId: "midjourney/video", type: "jobs" },
};

function getModelConfig(modelName: string) {
  return MODEL_MAP[modelName] || { endpoint: "/api/v1/gpt4o-image/generate", modelId: "gpt-image-1", type: "gpt4o" as const };
}

function mapAspectRatio(ratio?: string): string {
  if (!ratio) return "1:1";
  const map: Record<string, string> = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4",
    "3:2": "3:2",
    "2:3": "2:3",
    "21:9": "21:9",
  };
  return map[ratio] || "1:1";
}

export async function submitImageGeneration(params: {
  model: string;
  prompt: string;
  aspectRatio?: string;
  sourceImageUrl?: string;
  numOutputs?: number;
}): Promise<{ taskId: string; apiType: "gpt4o" | "jobs" | "flux" }> {
  const config = getModelConfig(params.model);

  if (config.endpoint.includes("flux/kontext")) {
    const body: any = {
      prompt: params.prompt,
      aspectRatio: mapAspectRatio(params.aspectRatio),
      outputFormat: "png",
      model: "flux-kontext-pro",
    };
    if (params.sourceImageUrl) {
      body.input_image_url = params.sourceImageUrl;
    }
    const res = await fetch(`${KIE_API_BASE}${config.endpoint}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json() as KieTaskResponse;
    if (data.code !== 200 || !data.data) {
      throw new Error(`Kie API error: ${data.msg}`);
    }
    return { taskId: data.data.taskId, apiType: "flux" };
  }

  if (config.type === "gpt4o") {
    const body: any = {
      prompt: params.prompt,
      size: mapAspectRatio(params.aspectRatio),
      nVariants: params.numOutputs || 1,
      isEnhance: false,
    };
    if (params.sourceImageUrl) {
      body.filesUrl = [params.sourceImageUrl];
    }
    const res = await fetch(`${KIE_API_BASE}${config.endpoint}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json() as KieTaskResponse;
    if (data.code !== 200 || !data.data) {
      throw new Error(`Kie API error: ${data.msg}`);
    }
    return { taskId: data.data.taskId, apiType: "gpt4o" };
  }

  const body: any = {
    model: config.modelId,
    callBackUrl: "",
    input: {
      prompt: params.prompt,
      aspect_ratio: mapAspectRatio(params.aspectRatio),
    },
  };
  if (params.sourceImageUrl) {
    body.input.image_urls = [params.sourceImageUrl];
  }
  const res = await fetch(`${KIE_API_BASE}${config.endpoint}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const data = await res.json() as KieTaskResponse;
  if (data.code !== 200 || !data.data) {
    throw new Error(`Kie API error: ${data.msg}`);
  }
  return { taskId: data.data.taskId, apiType: "jobs" };
}

export async function submitVideoGeneration(params: {
  model: string;
  prompt: string;
  aspectRatio?: string;
  duration?: string;
  sourceImageUrl?: string;
  sourceVideoUrl?: string;
}): Promise<{ taskId: string; apiType: "jobs" }> {
  const config = getModelConfig(params.model);

  const input: any = {
    prompt: params.prompt,
    aspect_ratio: mapAspectRatio(params.aspectRatio),
    duration: params.duration || "5",
  };

  if (config.modelId.includes("kling")) {
    input.mode = params.model.includes("1080p") ? "pro" : "std";
    input.sound = false;
  }

  if (config.modelId.includes("veo")) {
    if (params.model.includes("Quality")) {
      input.mode = "quality";
    }
  }

  if (params.sourceImageUrl) {
    input.image_urls = [params.sourceImageUrl];
  }
  if (params.sourceVideoUrl) {
    input.video_url = params.sourceVideoUrl;
  }

  const res = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: config.modelId,
      callBackUrl: "",
      input,
    }),
  });
  const data = await res.json() as KieTaskResponse;
  if (data.code !== 200 || !data.data) {
    throw new Error(`Kie API error: ${data.msg}`);
  }
  return { taskId: data.data.taskId, apiType: "jobs" };
}

export async function pollTaskResult(taskId: string, apiType: "gpt4o" | "jobs" | "flux"): Promise<{
  status: "processing" | "completed" | "failed";
  resultUrl?: string;
  error?: string;
}> {
  let url: string;
  if (apiType === "gpt4o") {
    url = `${KIE_API_BASE}/api/v1/gpt4o-image/record-info?taskId=${taskId}`;
  } else if (apiType === "flux") {
    url = `${KIE_API_BASE}/api/v1/flux/kontext/record-info?taskId=${taskId}`;
  } else {
    url = `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${taskId}`;
  }

  const res = await fetch(url, { headers: headers() });
  const data = await res.json() as KieRecordResponse;

  if (data.code !== 200 || !data.data) {
    return { status: "processing" };
  }

  const st = data.data.status?.toUpperCase();

  if (st === "SUCCESS" || data.data.successFlag === 1) {
    let resultUrl: string | undefined;
    const resp = data.data.response;
    if (resp) {
      if (resp.resultUrls && resp.resultUrls.length > 0) {
        resultUrl = resp.resultUrls[0];
      } else if (resp.videoUrl) {
        resultUrl = resp.videoUrl;
      } else if (resp.video_url) {
        resultUrl = resp.video_url;
      } else if (resp.works && resp.works.length > 0) {
        resultUrl = resp.works[0].resource?.resource;
      }
    }
    return { status: "completed", resultUrl };
  }

  if (st === "FAIL" || st === "FAILED" || st === "ERROR") {
    return { status: "failed", error: data.data.errorMessage || "Generation failed" };
  }

  return { status: "processing" };
}

export async function downloadAndSaveResult(
  resultUrl: string,
  generationId: number,
  isVideo: boolean
): Promise<string> {
  const ext = isVideo ? ".mp4" : ".png";
  const filename = `gen-${generationId}-${Date.now()}${ext}`;
  const filepath = path.join(GENERATIONS_DIR, filename);

  const res = await fetch(resultUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  if (isVideo) {
    return `/uploads/generations/${filename}`;
  }
  return `/uploads/generations/${filename}`;
}

export async function waitForResult(
  taskId: string,
  apiType: "gpt4o" | "jobs" | "flux",
  maxAttempts = 120,
  intervalMs = 5000
): Promise<{ status: "completed" | "failed"; resultUrl?: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await pollTaskResult(taskId, apiType);
    if (result.status !== "processing") {
      return result as { status: "completed" | "failed"; resultUrl?: string; error?: string };
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return { status: "failed", error: "Timeout waiting for generation result" };
}
