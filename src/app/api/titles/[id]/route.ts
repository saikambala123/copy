import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongo";
import { apiRoute, serializeTitle, toObjectId, HttpError } from "@/lib/api-utils";

export const GET = apiRoute<{ params: Promise<{ id: string }> }>(
  async (_req: Request, ctx) => {
    const { id } = await ctx.params;
    const { titles } = await collections();

    /* accept both ObjectId and slug */
    let doc = null;
    const oid = toObjectId(id);
    if (oid) doc = await titles.findOne({ _id: oid });
    if (!doc) doc = await titles.findOne({ slug: id });
    if (!doc) throw new HttpError(404, "Title not found");

    /* similar — same primary genre (fallback: any shared genre), 6 items */
    const primary = doc.genres?.[0];
    const similarFilter: Record<string, unknown> = {
      _id: { $ne: doc._id },
      ...(primary ? { genres: primary } : { genres: { $in: doc.genres ?? [] } }),
    };
    let similarDocs = primary
      ? await titles
          .find(similarFilter)
          .sort({ rating: -1, views: -1 })
          .limit(6)
          .toArray()
      : [];
    if (similarDocs.length < 6) {
      const seen = new Set([String(doc._id), ...similarDocs.map((d) => String(d._id))]);
      const more = await titles
        .find({ _id: { $nin: [...seen].map((s) => new ObjectId(s)) }, genres: { $in: doc.genres ?? [] } })
        .sort({ rating: -1 })
        .limit(6 - similarDocs.length)
        .toArray();
      similarDocs = [...similarDocs, ...more];
    }

    return NextResponse.json({
      title: serializeTitle(doc),
      similar: similarDocs.map(serializeTitle),
    });
  },
);
