import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, serializeUser, readJsonBody, AVATAR_GRADIENTS, HttpError } from "@/lib/api-utils";

export const PATCH = apiRoute(async (req: Request) => {
  const user = await requireUser();
  const body = await readJsonBody(req);

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2) throw new HttpError(400, "Name must be at least 2 characters");
    update.name = name;
  }
  if (body.avatar !== undefined) {
    const avatar = typeof body.avatar === "string" ? body.avatar : "";
    if (!(AVATAR_GRADIENTS as readonly string[]).includes(avatar)) {
      throw new HttpError(400, "Invalid avatar gradient");
    }
    update.avatar = avatar;
  }
  if (Object.keys(update).length === 0) {
    throw new HttpError(400, "Nothing to update");
  }

  const { users } = await collections();
  await users.updateOne({ _id: user._id }, { $set: update });

  const updated = await users.findOne({ _id: user._id });
  return NextResponse.json({ user: updated ? serializeUser(updated) : null });
});
