import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { apiRoute } from "@/lib/api-utils";

export const POST = apiRoute(async () => {
  const res = NextResponse.json({ ok: true });
  return clearAuthCookie(res);
});
