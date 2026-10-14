import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { apiRoute, serializeUser } from "@/lib/api-utils";

export const GET = apiRoute(async () => {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? serializeUser(user) : null });
});
