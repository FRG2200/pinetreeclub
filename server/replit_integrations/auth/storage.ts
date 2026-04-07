import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  registerLocalUser(email: string, password: string, firstName: string, lastName: string): Promise<User>;
  verifyLocalUser(email: string, password: string): Promise<User | null>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.email) {
      const [existing] = await db.select().from(users).where(eq(users.email, userData.email));
      if (existing && existing.id !== userData.id) {
        const [updated] = await db
          .update(users)
          .set({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            authProvider: "replit",
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updated;
      }
    }
    const [user] = await db
      .insert(users)
      .values({ ...userData, authProvider: "replit" })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          authProvider: "replit",
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async registerLocalUser(email: string, password: string, firstName: string, lastName: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        authProvider: "local",
        firstName,
        lastName,
      })
      .returning();
    return user;
  }

  async verifyLocalUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}

export const authStorage = new AuthStorage();
