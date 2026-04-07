import { pgTable, text, serial, integer, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import Auth Models
export * from "./models/auth";
// Import Chat Models
export * from "./models/chat";

// === USER CREDITS ===
export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  planCredits: integer("plan_credits").notNull().default(10),
  additionalCredits: integer("additional_credits").notNull().default(0),
  monthlyLimit: integer("monthly_limit").notNull().default(20),
  plan: text("plan").notNull().default("free"), // free, standard, premium, ultra
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === GENERATIONS ===
export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'text2image', 'image2image', 'text2video', 'image2video', 'video2video'
  prompt: text("prompt").notNull(),
  negativePrompt: text("negative_prompt"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  sourceImageUrl: text("source_image_url"),
  sourceVideoUrl: text("source_video_url"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  model: text("model").notNull().default("Midnight Lab V4"),
  aspectRatio: text("aspect_ratio").default("1:1"),
  resolution: text("resolution").default("2K"),
  duration: text("duration").default("5s"),
  numOutputs: integer("num_outputs").default(1),
  isFavorite: boolean("is_favorite").default(false),
  isPublic: boolean("is_public").default(false),
  creditsCost: integer("credits_cost").default(1),
  settings: jsonb("settings"),
  kieTaskId: text("kie_task_id"),
  kieApiType: text("kie_api_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === TASKS (Achievements/Missions) ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  rewardCredits: integer("reward_credits").notNull().default(0),
  requiredCount: integer("required_count").notNull().default(1),
  taskType: text("task_type").notNull(), // 'image_generation', 'video_generation', 'share', 'profile'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === USER TASK PROGRESS ===
export const userTaskProgress = pgTable("user_task_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: integer("task_id").notNull(),
  currentCount: integer("current_count").notNull().default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === AI MODELS ===
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'image', 'video'
  provider: text("provider").notNull(),
  iconUrl: text("icon_url"),
  description: text("description"),
  usagePercentage: text("usage_percentage").default("0%"),
  rank: integer("rank").default(0),
  creditsCost: integer("credits_cost").default(1),
  apiCostUsd: text("api_cost_usd"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === APPS/TOOLS ===
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  targetRoute: text("target_route").notNull(),
  presetPrompt: text("preset_prompt"),
  presetModel: text("preset_model"),
  presetParams: text("preset_params"),
  creditCost: integer("credit_cost").default(2),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === INSPIRATION GALLERY ===
export const inspirations = pgTable("inspirations", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  prompt: text("prompt"),
  model: text("model"),
  type: text("type").notNull(), // 'image', 'video'
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === CREDIT PACKAGES ===
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  price: integer("price").notNull(), // In JPY
  unitPrice: text("unit_price"),
  discount: text("discount"),
  isVip: boolean("is_vip").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WHITELIST ===
export const allowedUsers = pgTable("allowed_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === INSERT SCHEMAS ===
export const insertGenerationSchema = createInsertSchema(generations).omit({ 
  id: true, 
  createdAt: true,
  status: true,
  imageUrl: true,
  videoUrl: true,
  thumbnailUrl: true,
});

export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertUserTaskProgressSchema = createInsertSchema(userTaskProgress).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertAiModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  createdAt: true,
});

export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
});

export const insertInspirationSchema = createInsertSchema(inspirations).omit({
  id: true,
  createdAt: true,
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  id: true,
  createdAt: true,
});

// === TYPES ===
export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type UserTaskProgress = typeof userTaskProgress.$inferSelect;
export type InsertUserTaskProgress = z.infer<typeof insertUserTaskProgressSchema>;

export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;

export type App = typeof apps.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;

export type Inspiration = typeof inspirations.$inferSelect;
export type InsertInspiration = z.infer<typeof insertInspirationSchema>;

export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;

export type AllowedUser = typeof allowedUsers.$inferSelect;

// === API TYPES ===
export type CreateGenerationRequest = InsertGeneration;
export type GenerationResponse = Generation;
