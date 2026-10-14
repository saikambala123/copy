import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, serializeTitle, serializeProgressItem } from "@/lib/api-utils";
import type { TitleDoc } from "@/lib/doc-types";

/** Viewing activity — same shape as GET /api/progress. */
export const GET = apiRoute(async () => {
  const user = await requireUser();
  const { progress, titles } = await collections();

  const docs = await progress
    .find({ userId: user._id })
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

  const items = docs
    .filter((d) => titleMap.has(String(d.titleId)))
    .map((d) => serializeProgressItem(d, serializeTitle(titleMap.get(String(d.titleId))!)));

  return NextResponse.json({ items });
});
