import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { apiRoute, serializeUser, readJsonBody, toObjectId, HttpError } from "@/lib/api-utils";

export const PATCH = apiRoute<{ params: Promise<{ id: string }> }>(
  async (req: Request, ctx) => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const oid = toObjectId(id);
    if (!oid) throw new HttpError(400, "Invalid user id");

    const body = await readJsonBody(req);
    const update: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (body.role !== "user" && body.role !== "admin") {
        throw new HttpError(400, "Role must be 'user' or 'admin'");
      }
      update.role = body.role;
    }
    if (body.banned !== undefined) {
      if (typeof body.banned !== "boolean") {
        throw new HttpError(400, "banned must be a boolean");
      }
      update.banned = body.banned;
    }
    if (Object.keys(update).length === 0) {
      throw new HttpError(400, "Nothing to update");
    }

    /* keep admins from locking themselves out */
    const demoting =
      String(admin._id) === String(oid) &&
      ((update.role !== undefined && update.role !== "admin") || update.banned === true);
    if (demoting) {
      throw new HttpError(400, "You cannot demote or ban your own account");
    }

    const { users } = await collections();
    const updated = await users.findOneAndUpdate(
      { _id: oid },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!updated) throw new HttpError(404, "User not found");

    return NextResponse.json({ user: serializeUser(updated) });
  },
);
