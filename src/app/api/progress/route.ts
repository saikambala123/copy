import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, serializeTitle, serializeProgressItem, toObjectId, dayKey, HttpError } from "@/lib/api-utils";
import type { TitleDoc } from "@/lib/doc-types";

async function listProgressItems(userId: import("mongodb").ObjectId) {
  const { progress, titles } = await collections();
  const docs = await progress
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  const titleMap = new Map<string, TitleDoc>();
  if (docs.length) {
    const found = await titles
      .find({ _id: { $in: docs.map((d) => d.titleId) } })
      .toArray();
    for (const t of found) titleMap.set(String(t._id), t);
  }

  return docs
    .filter((d) => titleMap.has(String(d.titleId)))
    .map((d) => serializeProgressItem(d, serializeTitle(titleMap.get(String(d.titleId))!)));
}

export const GET = apiRoute(async () => {
  const user = await requireUser();
  return NextResponse.json({ items: await listProgressItems(user._id) });
});

export const POST = apiRoute(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const titleId = toObjectId(body.titleId);
  if (!titleId) throw new HttpError(400, "A valid titleId is required");

  const progressSeconds = Number(body.progressSeconds);
  const durationSeconds = Number(body.durationSeconds);
  if (
    !Number.isFinite(progressSeconds) ||
    progressSeconds < 0 ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    throw new HttpError(400, "progressSeconds and durationSeconds must be valid numbers");
  }

  const { progress, titles, viewEvents } = await collections();
  const title = await titles.findOne({ _id: titleId });
  if (!title) throw new HttpError(404, "Title not found");

  await progress.updateOne(
    { userId: user._id, titleId },
    {
      $set: {
        progressSeconds: Math.floor(progressSeconds),
        durationSeconds: Math.floor(durationSeconds),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  /* ----------------------------------------------------------
   * Real analytics: record one view event per user / title /
   * UTC day (unique index dedupes repeat saves while watching).
   * The first event of a day also bumps the title's view count.
   * -------------------------------------------------------- */
  const day = dayKey(new Date());
  const event = await viewEvents.updateOne(
    { titleId, userId: user._id, day },
    { $setOnInsert: { day, at: new Date() } },
    { upsert: true },
  );
  if (event.upsertedId) {
    await titles.updateOne({ _id: titleId }, { $inc: { views: 1 } });
  }

  return NextResponse.json({ ok: true });
});
