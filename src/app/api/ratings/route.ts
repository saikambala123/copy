import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, toObjectId, HttpError } from "@/lib/api-utils";

export const POST = apiRoute(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const titleId = toObjectId(body.titleId);
  if (!titleId) throw new HttpError(400, "A valid titleId is required");

  const value = Number(body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new HttpError(400, "Rating must be an integer between 1 and 5");
  }

  const { ratings, titles } = await collections();
  const title = await titles.findOne({ _id: titleId });
  if (!title) throw new HttpError(404, "Title not found");

  await ratings.updateOne(
    { userId: user._id, titleId },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true },
  );

  const [agg] = await ratings
    .aggregate<{ _id: null; average: number; count: number }>([
      { $match: { titleId } },
      { $group: { _id: null, average: { $avg: "$value" }, count: { $sum: 1 } } },
    ])
    .toArray();

  return NextResponse.json({
    ok: true,
    average: agg ? Math.round(agg.average * 10) / 10 : 0,
    count: agg?.count ?? 0,
  });
});
