import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, serializeTitle, toObjectId, HttpError } from "@/lib/api-utils";
import type { TitleDoc } from "@/lib/doc-types";

export const GET = apiRoute(async () => {
  const user = await requireUser();
  const { watchlist, titles } = await collections();

  const entries = await watchlist
    .find({ userId: user._id })
    .sort({ addedAt: -1 })
    .toArray();

  const titleMap = new Map<string, TitleDoc>();
  if (entries.length) {
    const docs = await titles
      .find({ _id: { $in: entries.map((e) => e.titleId) } })
      .toArray();
    for (const t of docs) titleMap.set(String(t._id), t);
  }

  const result = entries
    .map((e) => titleMap.get(String(e.titleId)))
    .filter((t): t is TitleDoc => !!t)
    .map(serializeTitle);

  return NextResponse.json({ titles: result });
});

export const POST = apiRoute(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const titleId = toObjectId(body.titleId);
  if (!titleId) throw new HttpError(400, "A valid titleId is required");

  const { watchlist, titles } = await collections();
  const title = await titles.findOne({ _id: titleId });
  if (!title) throw new HttpError(404, "Title not found");

  const existing = await watchlist.findOne({ userId: user._id, titleId });
  if (existing) {
    await watchlist.deleteOne({ _id: existing._id });
    return NextResponse.json({ added: false });
  }

  await watchlist.insertOne({
    userId: user._id,
    titleId,
    addedAt: new Date(),
  });
  return NextResponse.json({ added: true });
});
