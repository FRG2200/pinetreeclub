import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { storage } from "../../storage";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上必要です"),
  firstName: z.string().min(1, "名前を入力してください"),
  lastName: z.string().min(1, "姓を入力してください"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function registerAuthRoutes(app: Express): void {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await authStorage.getUser(userId);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        const email = req.user.claims?.email || user.email;
        const isAdmin = user.isAdmin || false;
        res.json({ ...safeUser, email, isAdmin });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const input = registerSchema.parse(req.body);

      const existing = await authStorage.getUserByEmail(input.email);
      if (existing) {
        return res.status(409).json({ message: "このメールアドレスは既に登録されています" });
      }

      const user = await authStorage.registerLocalUser(
        input.email,
        input.password,
        input.firstName,
        input.lastName
      );

      await storage.createUserCredits(user.id);

      req.login({ id: user.id, claims: { sub: user.id, email: user.email } }, (err: any) => {
        if (err) {
          console.error("Login after register failed:", err);
          return res.status(500).json({ message: "登録は成功しましたが、自動ログインに失敗しました" });
        }
        const { passwordHash, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "入力内容を確認してください" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "登録に失敗しました" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const input = loginSchema.parse(req.body);

      const user = await authStorage.verifyLocalUser(input.email, input.password);
      if (!user) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }

      req.login({ id: user.id, claims: { sub: user.id, email: user.email } }, (err: any) => {
        if (err) {
          console.error("Login failed:", err);
          return res.status(500).json({ message: "ログインに失敗しました" });
        }
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "入力内容を確認してください" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "ログインに失敗しました" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    });
  });
}
