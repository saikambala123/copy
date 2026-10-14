import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { apiRoute, serializeUser, containsRegex } from "@/lib/api-utils";

export const GET = apiRoute(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = containsRegex(q);
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const { users } = await collections();
  const docs = await users
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({ users: docs.map(serializeUser) });
});
