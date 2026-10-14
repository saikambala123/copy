import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { apiRoute, serializeTitle, containsRegex } from "@/lib/api-utils";

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  new: { createdAt: -1 },
  popular: { views: -1 },
  rating: { rating: -1 },
  year: { year: -1 },
};

export const GET = apiRoute(async (req: Request) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type") || "";
  const genre = (url.searchParams.get("genre") || "").trim();
  const sort = url.searchParams.get("sort") || "";
  const limitRaw = parseInt(url.searchParams.get("limit") || "", 10);
  const pageRaw = parseInt(url.searchParams.get("page") || "", 10);

  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 24;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = containsRegex(q);
    filter.$or = [{ title: rx }, { description: rx }, { genres: rx }];
  }
  if (type === "movie" || type === "series") filter.type = type;
  if (genre) filter.genres = genre;

  const sortSpec = SORT_MAP[sort] ?? SORT_MAP.popular;

  const { titles } = await collections();
  const [docs, total] = await Promise.all([
    titles
      .find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    titles.countDocuments(filter),
  ]);

  return NextResponse.json({
    titles: docs.map(serializeTitle),
    total,
    page,
    pageSize: limit,
  });
});
