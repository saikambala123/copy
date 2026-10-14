import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, collections } from "@/lib/mongo";
import { ensureSystemBootstrap } from "@/lib/bootstrap";
import { hashPassword, signToken, setAuthCookie, HttpError } from "@/lib/auth";
import { apiRoute, readJsonBody, serializeUser, AVATAR_GRADIENTS } from "@/lib/api-utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = apiRoute(async (req: Request) => {
  const body = await readJsonBody(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) throw new HttpError(400, "Name must be at least 2 characters");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");

  const { users, settings } = await collections();
  const existing = await users.findOne({ email });
  if (existing) throw new HttpError(400, "An account with this email already exists");

  /* ------------------------------------------------------------
   * First-run "Set up NOVA": when the database has no users, the
   * very first account becomes the administrator and the system
   * documents (settings + default plans) are bootstrapped.
   * ---------------------------------------------------------- */
  const userCount = await users.countDocuments({});
  const isFirstUser = userCount === 0;
  if (isFirstUser) {
    await ensureSystemBootstrap(await getDb());
  }

  const siteSettings = await settings.findOne({ _id: "settings" });
  const defaultPlan = siteSettings?.defaultPlan ?? "free";

  const doc = {
    _id: new ObjectId(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: (isFirstUser ? "admin" : "user") as "admin" | "user",
    avatar: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
    plan: defaultPlan,
    planExpiry: null,
    banned: false,
    createdAt: new Date(),
  };
  await users.insertOne(doc);

  const res = NextResponse.json({ user: serializeUser(doc), setup: isFirstUser });
  return setAuthCookie(res, signToken(String(doc._id), doc.role));
});
