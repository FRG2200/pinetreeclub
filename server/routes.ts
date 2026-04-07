import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerImageRoutes } from "./replit_integrations/image";
import { submitImageGeneration, submitVideoGeneration, waitForResult, downloadAndSaveResult } from "./kie-client";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import multer from "multer";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const GENERATIONS_DIR = path.join(UPLOADS_DIR, "generations");

function getUserId(req: any): string {
  return req.user?.claims?.sub || req.user?.id;
}

function getUserEmail(req: any): string | undefined {
  return req.user?.claims?.email || req.user?.email;
}

if (!fs.existsSync(GENERATIONS_DIR)) {
  fs.mkdirSync(GENERATIONS_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerImageRoutes(app);

  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/hero', express.static(path.join(process.cwd(), 'public', 'hero')));

  app.get('/api/download-project', async (_req, res) => {
    const { execSync } = await import('child_process');
    const archivePath = '/tmp/pinetreeclub-download.tar.gz';
    try {
      execSync(`cd ${process.cwd()} && tar czf ${archivePath} --exclude='.git' --exclude='node_modules' --exclude='.cache' --exclude='.local' --exclude='.config' --exclude='attached_assets' --exclude='.upm' --exclude='.npm' .`, { timeout: 120000 });
      res.download(archivePath, 'pinetreeclub.tar.gz', () => {
        fs.unlink(archivePath, () => {});
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create archive' });
    }
  });

  app.get(api.generations.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const items = await storage.getGenerations(userId);
    res.json(items);
  });

  app.post(api.generations.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const input = api.generations.create.input.parse(req.body);

      const credits = await storage.getUserCredits(userId);
      const totalCredits = credits ? credits.planCredits + credits.additionalCredits : 0;

      if (!input.model) {
        return res.status(400).json({ message: "モデルを選択してください" });
      }
      const modelData = await storage.getModelByName(input.model);
      if (!modelData) {
        return res.status(400).json({ message: "無効なモデルです: " + input.model });
      }
      const cost = modelData.creditsCost || 5;

      if (totalCredits < cost) {
        return res.status(402).json({
          message: "クレジットが不足しています",
          required: cost,
          available: totalCredits,
        });
      }

      await storage.deductCredits(userId, cost);

      const generation = await storage.createGeneration({
        ...input,
        userId,
        creditsCost: cost,
      });

      await storage.updateGenerationStatus(generation.id, "processing");
      res.status(201).json(generation);

      const isVideo = ["text2video", "image2video", "video2video"].includes(input.type);

      (async () => {
        try {
          let taskResult: { taskId: string; apiType: "gpt4o" | "jobs" | "flux" };

          if (isVideo) {
            const videoResult = await submitVideoGeneration({
              model: input.model || "Kling 3.0",
              prompt: input.prompt,
              aspectRatio: input.aspectRatio || "16:9",
              duration: input.duration || "5",
              sourceImageUrl: input.sourceImageUrl || undefined,
              sourceVideoUrl: input.sourceVideoUrl || undefined,
            });
            taskResult = { ...videoResult, apiType: "jobs" };
          } else {
            taskResult = await submitImageGeneration({
              model: input.model || "GPT-Image-1",
              prompt: input.prompt,
              aspectRatio: input.aspectRatio || "1:1",
              sourceImageUrl: input.sourceImageUrl || undefined,
              numOutputs: input.numOutputs || 1,
            });
          }

          await storage.updateGenerationKieTask(generation.id, taskResult.taskId, taskResult.apiType);

          const result = await waitForResult(taskResult.taskId, taskResult.apiType, 120, 5000);

          if (result.status === "completed" && result.resultUrl) {
            const localUrl = await downloadAndSaveResult(result.resultUrl, generation.id, isVideo);
            if (isVideo) {
              await storage.updateGenerationStatus(generation.id, "completed", undefined, localUrl);
              await storage.incrementTaskProgressByType(userId, "video_generation");
            } else {
              await storage.updateGenerationStatus(generation.id, "completed", localUrl);
              await storage.incrementTaskProgressByType(userId, "image_generation");
            }
          } else {
            console.error(`Generation ${generation.id} failed:`, result.error);
            await storage.updateGenerationStatus(generation.id, "failed");
            await storage.addCredits(userId, cost);
          }
        } catch (err) {
          console.error(`Generation ${generation.id} error:`, err);
          await storage.updateGenerationStatus(generation.id, "failed");
          await storage.addCredits(userId, cost);
        }
      })();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/generations/:id", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const gen = await storage.getGeneration(id);
    if (!gen) return res.status(404).json({ message: "Not found" });
    if (gen.userId !== userId) return res.status(403).json({ message: "Forbidden" });
    res.json(gen);
  });

  app.patch("/api/generations/:id/favorite", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const gen = await storage.getGeneration(id);
    if (!gen) return res.status(404).json({ message: "Not found" });
    if (gen.userId !== userId) return res.status(403).json({ message: "Forbidden" });
    const updated = await storage.toggleFavorite(id);
    res.json(updated);
  });

  app.delete("/api/generations/:id", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const gen = await storage.getGeneration(id);
    if (!gen) return res.status(404).json({ message: "Not found" });
    if (gen.userId !== userId) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteGeneration(id);
    res.status(204).send();
  });

  app.get("/api/generations/:id/download", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const id = parseInt(req.params.id);
    const gen = await storage.getGeneration(id);
    if (!gen) return res.status(404).json({ message: "Not found" });
    if (gen.userId !== userId) return res.status(403).json({ message: "Forbidden" });
    const fileUrl = gen.imageUrl || gen.videoUrl;
    if (!fileUrl) return res.status(404).json({ message: "No file available" });
    const filePath = path.join(process.cwd(), fileUrl);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    const ext = path.extname(filePath);
    const filename = `pinetreeclub-${gen.id}${ext}`;
    res.download(filePath, filename);
  });

  app.post("/api/upload", isAuthenticated, upload.single('image'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "ファイルが必要です" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  app.get(api.credits.get.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    let credits = await storage.getUserCredits(userId);
    if (!credits) {
      credits = await storage.createUserCredits(userId);
    }
    res.json(credits);
  });

  app.post("/api/credits/purchase", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const { packageId } = req.body;
    const packages = await storage.getCreditPackages();
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ message: "Invalid package" });

    await storage.addCredits(userId, pkg.credits);
    const credits = await storage.getUserCredits(userId);
    res.json(credits);
  });

  app.get(api.tasks.list.path, isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const tasksWithProgress = await storage.getUserTaskProgress(userId);
    res.json(tasksWithProgress);
  });

  app.post("/api/tasks/:id/claim", isAuthenticated, async (req: any, res) => {
    const userId = getUserId(req);
    const taskId = parseInt(req.params.id);
    const reward = await storage.claimTaskReward(userId, taskId);
    if (reward === 0) {
      return res.status(400).json({ message: "Cannot claim reward" });
    }
    res.json({ credits: reward });
  });

  app.get("/api/model-stats", async (_req, res) => {
    try {
      const allGens = await storage.getModelStats();
      res.json(allGens);
    } catch (e) {
      res.json({ image: [], video: [] });
    }
  });

  app.get(api.models.list.path, async (req, res) => {
    const models = await storage.getModels();
    res.json(models);
  });

  app.get(api.models.imageModels.path, async (req, res) => {
    const models = await storage.getImageModels();
    res.json(models);
  });

  app.get(api.models.videoModels.path, async (req, res) => {
    const models = await storage.getVideoModels();
    res.json(models);
  });

  app.get(api.apps.list.path, async (req, res) => {
    const appsList = await storage.getApps();
    res.json(appsList);
  });

  app.get(api.inspirations.list.path, async (req, res) => {
    const items = await storage.getInspirations();
    res.json(items);
  });

  app.get(api.packages.list.path, async (req, res) => {
    const packages = await storage.getCreditPackages();
    res.json(packages);
  });

  app.get("/api/whitelist/check", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    if (!email) return res.json({ allowed: false, isAdmin: false });
    const allowed = await storage.isEmailAllowed(email);
    const admin = allowed ? await storage.isAdmin(email) : false;
    res.json({ allowed, isAdmin: admin });
  });

  app.get("/api/whitelist", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const users = await storage.getAllowedUsers();
    res.json(users);
  });

  app.post("/api/whitelist", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const { email: newEmail, isAdmin: makeAdmin } = req.body;
    if (!newEmail) return res.status(400).json({ error: "Email required" });
    try {
      const user = await storage.addAllowedUser(newEmail, makeAdmin || false, email);
      res.json(user);
    } catch (e: any) {
      if (e.message?.includes("duplicate")) {
        return res.status(409).json({ error: "Email already whitelisted" });
      }
      throw e;
    }
  });

  app.delete("/api/whitelist/:id", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    await storage.removeAllowedUser(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const allUsers = await storage.getAllUsers();
    const usersWithStats = await Promise.all(
      allUsers.map(async (u) => {
        const credits = await storage.getUserCredits(u.id);
        const genCount = await storage.getUserGenerationCount(u.id);
        const { passwordHash, ...safeUser } = u as any;
        return {
          ...safeUser,
          totalCredits: credits ? credits.planCredits + credits.additionalCredits : 0,
          generationCount: genCount,
        };
      })
    );
    res.json(usersWithStats);
  });

  app.patch("/api/admin/users/:id/admin", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const { isAdmin: makeAdmin } = req.body;
    const user = await storage.updateUserAdmin(req.params.id, makeAdmin);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  app.post("/api/admin/users/:id/credits", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const { amount } = req.body;
    if (!amount || amount < 0) return res.status(400).json({ error: "Invalid amount" });
    let credits = await storage.getUserCredits(req.params.id);
    if (!credits) {
      credits = await storage.createUserCredits(req.params.id);
    }
    await storage.addCredits(req.params.id, amount);
    const updated = await storage.getUserCredits(req.params.id);
    res.json(updated);
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    const email = getUserEmail(req);
    const admin = email ? await storage.isAdmin(email) : false;
    if (!admin) return res.status(403).json({ error: "Admin only" });
    const userId = getUserId(req);
    if (req.params.id === userId) return res.status(400).json({ error: "Cannot delete yourself" });
    await storage.deleteUser(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
