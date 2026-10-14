import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { verifyPassword, signToken, setAuthCookie, HttpError } from "@/lib/auth";
import { apiRoute, readJsonBody, serializeUser } from "@/lib/api-utils";

export const POST = apiRoute(async (req: Request) => {
  const body = await readJsonBody(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) throw new HttpError(400, "Email and password are required");

  const { users } = await collections();
  const user = await users.findOne({ email });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.banned) throw new HttpError(403, "Your account has been banned");

  const res = NextResponse.json({ user: serializeUser(user) });
  return setAuthCookie(res, signToken(String(user._id), user.role));
});
