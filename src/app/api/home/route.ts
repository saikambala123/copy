import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { getSessionUser } from "@/lib/auth";
import { apiRoute, serializeTitle, serializeProgressItem } from "@/lib/api-utils";
import type { TitleDoc } from "@/lib/doc-types";

const ROW_SIZE = 12;
const GENRE_ROWS = ["Sci-Fi", "Thriller", "Drama", "Action"];

export const GET = apiRoute(async () => {
  const { titles, progress } = await collections();
  const user = await getSessionUser();

  const [
    heroDocs,
    trendingDocs,
    newDocs,
    topMovieDocs,
    topSeriesDocs,
    top10Docs,
    ...genreDocs
  ] = await Promise.all([
    titles
      .find({ featured: true, backdrop: { $ne: "" } })
      .sort({ views: -1 })
      .limit(5)
      .toArray(),
    titles.find({ trending: true }).sort({ views: -1 }).limit(ROW_SIZE).toArray(),
    titles.find({ isNew: true }).sort({ createdAt: -1 }).limit(ROW_SIZE).toArray(),
    titles.find({ type: "movie" }).sort({ rating: -1 }).limit(ROW_SIZE).toArray(),
    titles.find({ type: "series" }).sort({ rating: -1 }).limit(ROW_SIZE).toArray(),
    titles.find({}).sort({ views: -1 }).limit(10).toArray(),
    ...GENRE_ROWS.map((genre) =>
      titles.find({ genres: genre }).sort({ views: -1 }).limit(ROW_SIZE).toArray(),
    ),
  ]);

  /* New Releases — isNew first, then backfill with most recent additions */
  const newReleaseDocs: TitleDoc[] = [...newDocs];
  if (newReleaseDocs.length < ROW_SIZE) {
    const seenIds = newReleaseDocs.map((d) => d._id);
    const more = await titles
      .find({ _id: { $nin: seenIds } })
      .sort({ createdAt: -1 })
      .limit(ROW_SIZE - newReleaseDocs.length)
      .toArray();
    newReleaseDocs.push(...more);
  }

  const rows = [
    { key: "trending", title: "Trending Now", items: trendingDocs },
    { key: "new-releases", title: "New Releases", items: newReleaseDocs },
    { key: "top-rated-movies", title: "Top Rated Movies", items: topMovieDocs },
    { key: "acclaimed-series", title: "Critically Acclaimed Series", items: topSeriesDocs },
    ...GENRE_ROWS.map((genre, i) => ({
      key: `genre-${genre}`,
      title: `${genre} Essentials`,
      items: genreDocs[i],
    })),
  ].map((row) => ({
    key: row.key,
    title: row.title,
    items: row.items.map(serializeTitle),
  }));

  /* Continue watching (logged-in users only) */
  let continueWatching: ReturnType<typeof serializeProgressItem>[] = [];
  if (user) {
    const progressDocs = await progress
      .find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .limit(12)
      .toArray();
    if (progressDocs.length) {
      const titleMap = new Map<string, TitleDoc>();
      const ids = progressDocs.map((p) => p.titleId);
      const found = await titles.find({ _id: { $in: ids } }).toArray();
      for (const t of found) titleMap.set(String(t._id), t);
      continueWatching = progressDocs
        .filter((p) => titleMap.has(String(p.titleId)))
        .map((p) =>
          serializeProgressItem(p, serializeTitle(titleMap.get(String(p.titleId))!)),
        );
    }
  }

  return NextResponse.json({
    hero: heroDocs.map(serializeTitle),
    rows,
    top10: top10Docs.map(serializeTitle),
    continueWatching,
  });
});
