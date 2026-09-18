/* ============================================================================
 *  FICHIER : src/app/api/auth/route.ts
 *  LANGAGE : TypeScript — Next.js Route Handler (API REST)
 *  RÔLE    : Authentification et gestion du personnel.
 *
 *    GET  /api/auth              → liste du personnel (Ousmane, Aminata, Moussa)
 *    POST /api/auth              → connexion / changement de session
 *         { action:"switch", userId: 1 }   → se connecter en tant que...
 *         { action:"register", name, email, role } → créer un compte
 *
 *  ⚠️ En production réelle, les mots de passe doivent être HACHÉS
 *  (avec bcrypt par exemple) et comparés de façon sécurisée.
 * ==========================================================================*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─────────────────── GET : liste de tout le personnel ──────────────────────
export async function GET() {
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      avatar: users.avatar,
      createdAt: users.createdAt,
    }).from(users);

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, name, role, phone, userId } = body;

    // Quick switch / login by userId
    if (action === "switch" || userId) {
      const idToFind = Number(userId);
      const [user] = await db.select().from(users).where(eq(users.id, idToFind)).limit(1);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const { passwordHash: _, ...userWithoutPass } = user;
      return NextResponse.json({ user: userWithoutPass, token: `session_${user.id}_${Date.now()}` });
    }

    // Register new staff
    if (action === "register") {
      if (!name || !email) {
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      const [newUser] = await db.insert(users).values({
        name,
        email: email.toLowerCase().trim(),
        passwordHash: password || "yarwaye123",
        role: role || "cashier",
        phone: phone || "767866536",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      }).returning();

      const { passwordHash: _, ...userWithoutPass } = newUser;
      return NextResponse.json({ user: userWithoutPass, token: `session_${newUser.id}_${Date.now()}` }, { status: 201 });
    }

    // Login with email / password
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found with this email" }, { status: 404 });
    }

    // In demo environment, allow login
    const { passwordHash: _, ...userWithoutPass } = user;
    return NextResponse.json({ user: userWithoutPass, token: `session_${user.id}_${Date.now()}` });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
