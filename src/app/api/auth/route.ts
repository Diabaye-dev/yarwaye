/**
 * ROUTE /api/auth — authentification & personnel
 * 
 * GET  : renvoie la liste du personnel (sans les mots de passe).
 * POST : selon "action" :
 *          - "switch"   : ouvre la session d'un membre existant (démo)
 *          - "register" : crée un nouveau membre du personnel
 *          - (défaut)   : connexion par e-mail
 * NB : projet de démonstration -> le "passwordHash" n'est pas vérifié
 * cryptographiquement, il faudrait bcrypt/argon2 en production.
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Les routes touchent la base : on interdit toute pré-génération au build
// (sinon Next.js exécuterait le handler pendant "Collecting page data").
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Impossible de récupérer les utilisateurs" }, { status: 500 });
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
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      }
      const { passwordHash: _, ...userWithoutPass } = user;
      return NextResponse.json({ user: userWithoutPass, token: `session_${user.id}_${Date.now()}` });
    }

    // Register new staff
    if (action === "register") {
      if (!name || !email) {
        return NextResponse.json({ error: "Le nom et l'e-mail sont obligatoires" }, { status: 400 });
      }

      const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ error: "Cet e-mail est déjà enregistré" }, { status: 400 });
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
      return NextResponse.json({ error: "L'e-mail est obligatoire" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user) {
      return NextResponse.json({ error: "Aucun utilisateur trouvé avec cet e-mail" }, { status: 404 });
    }

    // In demo environment, allow login
    const { passwordHash: _, ...userWithoutPass } = user;
    return NextResponse.json({ user: userWithoutPass, token: `session_${user.id}_${Date.now()}` });
  } catch (error) {
    return NextResponse.json({ error: "Échec de l'authentification" }, { status: 500 });
  }
}
