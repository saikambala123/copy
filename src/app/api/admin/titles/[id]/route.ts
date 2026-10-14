import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import {
  apiRoute,
  serializeTitle,
  readJsonBody,
  toObjectId,
  HttpError,
} from "@/lib/api-utils";
import { parseTitleBody, ensureUniqueSlug } from "@/lib/title-input";

export const PATCH = apiRoute<{ params: Promise<{ id: string }> }>(
  async (req: Request, ctx) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const oid = toObjectId(id);
    if (!oid) throw new HttpError(400, "Invalid title id");

    const { titles } = await collections();
    const existing = await titles.findOne({ _id: oid });
    if (!existing) throw new HttpError(404, "Title not found");

    const body = await readJsonBody(req);
    const patch = parseTitleBody(body, { requireCore: false });

    /* slug change → keep unique */
    if (typeof body.slug === "string" && body.slug.trim() && body.slug.trim() !== existing.slug) {
      patch.slug = await ensureUniqueSlug(titles, body.slug, oid);
    }
    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, "No valid fields to update");
    }

    await titles.updateOne({ _id: oid }, { $set: patch });
    const updated = await titles.findOne({ _id: oid });
    return NextResponse.json({ title: updated ? serializeTitle(updated) : null });
  },
);

export const DELETE = apiRoute<{ params: Promise<{ id: string }> }>(
  async (_req: Request, ctx) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const oid = toObjectId(id);
    if (!oid) throw new HttpError(400, "Invalid title id");

    const { titles, watchlist, progress, ratings } = await collections();
    const deleted = await titles.deleteOne({ _id: oid });
    if (!deleted.deletedCount) throw new HttpError(404, "Title not found");

    /* cleanup user data pointing at the removed title */
    await Promise.all([
      watchlist.deleteMany({ titleId: oid }),
      progress.deleteMany({ titleId: oid }),
      ratings.deleteMany({ titleId: oid }),
    ]);

    return NextResponse.json({ ok: true });
  },
);
