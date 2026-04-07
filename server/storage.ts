import { db } from "./db";
import {
  generations,
  userCredits,
  tasks,
  userTaskProgress,
  aiModels,
  apps,
  inspirations,
  creditPackages,
  allowedUsers,
  type InsertGeneration,
  type Generation,
  type UserCredits,
  type Task,
  type UserTaskProgress,
  type AiModel,
  type App,
  type Inspiration,
  type CreditPackage,
  type AllowedUser,
} from "@shared/schema";
import { users, type User } from "@shared/models/auth";
import { eq, desc, and, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  // Generations
  createGeneration(generation: InsertGeneration): Promise<Generation>;
  getGenerations(userId: string): Promise<Generation[]>;
  getGeneration(id: number): Promise<Generation | undefined>;
  updateGenerationStatus(id: number, status: string, imageUrl?: string, videoUrl?: string): Promise<Generation | undefined>;
  updateGenerationKieTask(id: number, kieTaskId: string, kieApiType: string): Promise<void>;
  toggleFavorite(id: number): Promise<Generation | undefined>;
  deleteGeneration(id: number): Promise<void>;

  // User Credits
  getUserCredits(userId: string): Promise<UserCredits | undefined>;
  createUserCredits(userId: string): Promise<UserCredits>;
  updateUserCredits(userId: string, planCredits?: number, additionalCredits?: number): Promise<UserCredits | undefined>;
  deductCredits(userId: string, amount: number): Promise<boolean>;
  addCredits(userId: string, amount: number): Promise<UserCredits | undefined>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getUserTaskProgress(userId: string): Promise<{ task: Task; progress?: UserTaskProgress }[]>;
  updateTaskProgress(userId: string, taskId: number, increment: number): Promise<UserTaskProgress | undefined>;
  incrementTaskProgressByType(userId: string, taskType: string): Promise<void>;
  claimTaskReward(userId: string, taskId: number): Promise<number>;

  // AI Models
  getModels(): Promise<AiModel[]>;
  getModelByName(name: string): Promise<AiModel | undefined>;
  getImageModels(): Promise<AiModel[]>;
  getVideoModels(): Promise<AiModel[]>;

  // Apps
  getApps(): Promise<App[]>;

  // Inspirations
  getInspirations(): Promise<Inspiration[]>;

  // Credit Packages
  getCreditPackages(): Promise<CreditPackage[]>;

  // Model Stats
  getModelStats(): Promise<{ image: { name: string; count: number; percentage: string }[]; video: { name: string; count: number; percentage: string }[] }>;

  // Whitelist
  isEmailAllowed(email: string): Promise<boolean>;
  isAdmin(email: string): Promise<boolean>;
  getAllowedUsers(): Promise<AllowedUser[]>;
  addAllowedUser(email: string, isAdmin: boolean, addedBy: string): Promise<AllowedUser>;
  removeAllowedUser(id: number): Promise<void>;

  // Admin User Management
  getAllUsers(): Promise<User[]>;
  updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined>;
  deleteUser(userId: string): Promise<void>;
  getUserGenerationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // === GENERATIONS ===
  async createGeneration(generation: InsertGeneration): Promise<Generation> {
    const [newGeneration] = await db
      .insert(generations)
      .values(generation)
      .returning();
    return newGeneration;
  }

  async getGenerations(userId: string): Promise<Generation[]> {
    return await db
      .select()
      .from(generations)
      .where(eq(generations.userId, userId))
      .orderBy(desc(generations.createdAt));
  }

  async getGeneration(id: number): Promise<Generation | undefined> {
    const [generation] = await db
      .select()
      .from(generations)
      .where(eq(generations.id, id));
    return generation;
  }

  async updateGenerationStatus(id: number, status: string, imageUrl?: string, videoUrl?: string): Promise<Generation | undefined> {
    const [updated] = await db
      .update(generations)
      .set({ 
        status, 
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
      })
      .where(eq(generations.id, id))
      .returning();
    return updated;
  }

  async updateGenerationKieTask(id: number, kieTaskId: string, kieApiType: string): Promise<void> {
    await db.update(generations).set({ kieTaskId, kieApiType }).where(eq(generations.id, id));
  }

  async toggleFavorite(id: number): Promise<Generation | undefined> {
    const gen = await this.getGeneration(id);
    if (!gen) return undefined;
    const [updated] = await db
      .update(generations)
      .set({ isFavorite: !gen.isFavorite })
      .where(eq(generations.id, id))
      .returning();
    return updated;
  }

  async deleteGeneration(id: number): Promise<void> {
    await db.delete(generations).where(eq(generations.id, id));
  }

  // === USER CREDITS ===
  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId));
    return credits;
  }

  async createUserCredits(userId: string): Promise<UserCredits> {
    const [credits] = await db
      .insert(userCredits)
      .values({ userId, planCredits: 10, additionalCredits: 0, monthlyLimit: 20, plan: "free" })
      .returning();
    return credits;
  }

  async updateUserCredits(userId: string, planCredits?: number, additionalCredits?: number): Promise<UserCredits | undefined> {
    const updateData: Partial<UserCredits> = { updatedAt: new Date() };
    if (planCredits !== undefined) updateData.planCredits = planCredits;
    if (additionalCredits !== undefined) updateData.additionalCredits = additionalCredits;
    
    const [updated] = await db
      .update(userCredits)
      .set(updateData)
      .where(eq(userCredits.userId, userId))
      .returning();
    return updated;
  }

  async deductCredits(userId: string, amount: number): Promise<boolean> {
    let credits = await this.getUserCredits(userId);
    if (!credits) {
      credits = await this.createUserCredits(userId);
    }
    
    const totalCredits = credits.planCredits + credits.additionalCredits;
    if (totalCredits < amount) return false;

    // Deduct from plan credits first, then additional
    let remaining = amount;
    let newPlanCredits = credits.planCredits;
    let newAdditionalCredits = credits.additionalCredits;

    if (newPlanCredits >= remaining) {
      newPlanCredits -= remaining;
    } else {
      remaining -= newPlanCredits;
      newPlanCredits = 0;
      newAdditionalCredits -= remaining;
    }

    await this.updateUserCredits(userId, newPlanCredits, newAdditionalCredits);
    return true;
  }

  async addCredits(userId: string, amount: number): Promise<UserCredits | undefined> {
    let credits = await this.getUserCredits(userId);
    if (!credits) {
      credits = await this.createUserCredits(userId);
    }
    return this.updateUserCredits(userId, undefined, credits.additionalCredits + amount);
  }

  // === TASKS ===
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.isActive, true));
  }

  async getUserTaskProgress(userId: string): Promise<{ task: Task; progress?: UserTaskProgress }[]> {
    const allTasks = await this.getTasks();
    const progressList = await db
      .select()
      .from(userTaskProgress)
      .where(eq(userTaskProgress.userId, userId));

    return allTasks.map(task => ({
      task,
      progress: progressList.find(p => p.taskId === task.id),
    }));
  }

  async updateTaskProgress(userId: string, taskId: number, increment: number): Promise<UserTaskProgress | undefined> {
    const [existing] = await db
      .select()
      .from(userTaskProgress)
      .where(and(eq(userTaskProgress.userId, userId), eq(userTaskProgress.taskId, taskId)));

    if (existing) {
      const [updated] = await db
        .update(userTaskProgress)
        .set({ currentCount: existing.currentCount + increment })
        .where(eq(userTaskProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userTaskProgress)
        .values({ userId, taskId, currentCount: increment })
        .returning();
      return created;
    }
  }

  async incrementTaskProgressByType(userId: string, taskType: string): Promise<void> {
    const allTasks = await db.select().from(tasks).where(and(eq(tasks.taskType, taskType), eq(tasks.isActive, true)));
    for (const task of allTasks) {
      await this.updateTaskProgress(userId, task.id, 1);
    }
  }

  async claimTaskReward(userId: string, taskId: number): Promise<number> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) return 0;

    const [progress] = await db
      .select()
      .from(userTaskProgress)
      .where(and(eq(userTaskProgress.userId, userId), eq(userTaskProgress.taskId, taskId)));

    if (!progress || progress.currentCount < task.requiredCount || progress.isCompleted) {
      return 0;
    }

    await db
      .update(userTaskProgress)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(userTaskProgress.id, progress.id));

    await this.addCredits(userId, task.rewardCredits);
    return task.rewardCredits;
  }

  // === AI MODELS ===
  async getModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(eq(aiModels.isActive, true));
  }

  async getModelByName(name: string): Promise<AiModel | undefined> {
    const [model] = await db.select().from(aiModels).where(eq(aiModels.name, name));
    return model;
  }

  async getImageModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(and(eq(aiModels.type, "image"), eq(aiModels.isActive, true)));
  }

  async getVideoModels(): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(and(eq(aiModels.type, "video"), eq(aiModels.isActive, true)));
  }

  // === APPS ===
  async getApps(): Promise<App[]> {
    return await db.select().from(apps).where(eq(apps.isActive, true));
  }

  // === INSPIRATIONS ===
  async getInspirations(): Promise<Inspiration[]> {
    return await db.select().from(inspirations).orderBy(desc(inspirations.createdAt));
  }

  // === CREDIT PACKAGES ===
  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db.select().from(creditPackages).where(eq(creditPackages.isActive, true));
  }

  // === MODEL STATS ===
  async getModelStats(): Promise<{ image: { name: string; count: number; percentage: string }[]; video: { name: string; count: number; percentage: string }[] }> {
    const imageTypes = ['text2image', 'image2image'];
    const videoTypes = ['text2video', 'image2video', 'ref2video', 'video2video'];

    const imageResults = await db
      .select({ model: generations.model, count: count() })
      .from(generations)
      .where(inArray(generations.type, imageTypes))
      .groupBy(generations.model)
      .orderBy(desc(count()));

    const videoResults = await db
      .select({ model: generations.model, count: count() })
      .from(generations)
      .where(inArray(generations.type, videoTypes))
      .groupBy(generations.model)
      .orderBy(desc(count()));

    const calcPercentages = (results: { model: string; count: number }[]) => {
      const total = results.reduce((sum, r) => sum + r.count, 0);
      return results.map((r) => ({
        name: r.model,
        count: r.count,
        percentage: total > 0 ? ((r.count / total) * 100).toFixed(2) + "%" : "0%",
      }));
    };

    return {
      image: calcPercentages(imageResults),
      video: calcPercentages(videoResults),
    };
  }

  // === WHITELIST ===
  async isEmailAllowed(email: string): Promise<boolean> {
    const result = await db.select().from(allowedUsers).where(eq(allowedUsers.email, email.toLowerCase()));
    return result.length > 0;
  }

  async isAdmin(email: string): Promise<boolean> {
    const lowerEmail = email.toLowerCase();
    const allowedResult = await db.select().from(allowedUsers).where(
      and(eq(allowedUsers.email, lowerEmail), eq(allowedUsers.isAdmin, true))
    );
    if (allowedResult.length > 0) return true;
    const userResult = await db.select().from(users).where(
      and(eq(users.email, lowerEmail), eq(users.isAdmin, true))
    );
    return userResult.length > 0;
  }

  async getAllowedUsers(): Promise<AllowedUser[]> {
    return await db.select().from(allowedUsers).orderBy(desc(allowedUsers.createdAt));
  }

  async addAllowedUser(email: string, isAdmin: boolean, addedBy: string): Promise<AllowedUser> {
    const [user] = await db.insert(allowedUsers).values({
      email: email.toLowerCase(),
      isAdmin,
      addedBy,
    }).returning();
    return user;
  }

  async removeAllowedUser(id: number): Promise<void> {
    await db.delete(allowedUsers).where(eq(allowedUsers.id, id));
  }

  // === ADMIN USER MANAGEMENT ===
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isAdmin, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(userCredits).where(eq(userCredits.userId, userId));
    await db.delete(generations).where(eq(generations.userId, userId));
    await db.delete(userTaskProgress).where(eq(userTaskProgress.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async getUserGenerationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(generations).where(eq(generations.userId, userId));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
