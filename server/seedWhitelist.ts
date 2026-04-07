import { db } from "./db";
import { allowedUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

const INITIAL_WHITELIST = [
  { email: "aiichirotamura@bronxvilleinc.com", isAdmin: true },
  { email: "info@bronxvilleinc.com", isAdmin: true },
  { email: "imagawa@xrdive.net", isAdmin: false },
  { email: "kenjiarai19871117@gmail.com", isAdmin: false },
];

export async function seedWhitelist() {
  try {
    for (const entry of INITIAL_WHITELIST) {
      const [existing] = await db
        .select()
        .from(allowedUsers)
        .where(eq(allowedUsers.email, entry.email));

      if (!existing) {
        await db.insert(allowedUsers).values({
          email: entry.email,
          isAdmin: entry.isAdmin,
          addedBy: "system",
        });
        console.log(`Whitelist: added ${entry.email}`);
      }
    }
    console.log("Whitelist seed complete");
  } catch (error) {
    console.error("Whitelist seed error:", error);
  }
}
