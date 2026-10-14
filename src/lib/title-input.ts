// ============================================================
// NOVA — admin title payload parsing/validation (shared by
// POST /api/admin/titles and PATCH /api/admin/titles/[id])
// ============================================================
import { ObjectId, type Collection } from "mongodb";
import type { TitleDoc, SeasonDoc } from "./doc-types";
import { slugify } from "./api-utils";
import { HttpError } from "./http";

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
}

function toSeasons(value: unknown): SeasonDoc[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seasons: SeasonDoc[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const episodes = Array.isArray(s.episodes)
      ? s.episodes
          .map((e, i) => {
            if (!e || typeof e !== "object") return null;
            const ep = e as Record<string, unknown>;
            const n = Number(ep.n);
            return {
              n: Number.isFinite(n) && n > 0 ? Math.floor(n) : i + 1,
              title: String(ep.title ?? `Episode ${i + 1}`),
              summary: String(ep.summary ?? ""),
              durationMinutes:
                Number.isFinite(Number(ep.durationMinutes)) && Number(ep.durationMinutes) > 0
                  ? Math.floor(Number(ep.durationMinutes))
                  : 45,
            };
          })
          .filter((e): e is NonNullable<typeof e> => !!e)
      : [];
    const seasonNo = Number(s.season);
    seasons.push({
      season: Number.isFinite(seasonNo) && seasonNo > 0 ? Math.floor(seasonNo) : seasons.length + 1,
      episodes,
    });
  }
  return seasons;
}

/**
 * Normalize an incoming admin title payload into a TitleDoc patch.
 * `requireCore` enforces the POST contract (title/type/year required).
 */
export function parseTitleBody(
  body: Record<string, unknown>,
  opts: { requireCore: boolean },
): Partial<TitleDoc> {
  const patch: Partial<TitleDoc> = {};

  const title = str(body.title);
  if (title !== undefined) patch.title = title;

  const type = str(body.type);
  if (type !== undefined) {
    if (type !== "movie" && type !== "series") {
      throw new HttpError(400, "Type must be 'movie' or 'series'");
    }
    patch.type = type;
  }

  if (body.year !== undefined) {
    const year = Number(body.year);
    if (!Number.isFinite(year) || year < 1888 || year > 2100) {
      throw new HttpError(400, "A valid year is required");
    }
    patch.year = Math.floor(year);
  }

  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    patch.rating = Number.isFinite(rating)
      ? Math.round(Math.min(10, Math.max(0, rating)) * 10) / 10
      : 0;
  }

  if (body.durationMinutes !== undefined) {
    const duration = Number(body.durationMinutes);
    patch.durationMinutes =
      Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : 0;
  }

  if (body.views !== undefined) {
    const views = Number(body.views);
    patch.views = Number.isFinite(views) && views > 0 ? Math.floor(views) : 0;
  }

  const maturity = str(body.maturity);
  if (maturity) patch.maturity = maturity;

  const director = str(body.director);
  if (director !== undefined) patch.director = director;

  const language = str(body.language);
  if (language) patch.language = language;

  const description = str(body.description);
  if (description !== undefined) patch.description = description;

  const poster = str(body.poster);
  if (poster !== undefined) patch.poster = poster;

  const backdrop = str(body.backdrop);
  if (backdrop !== undefined) patch.backdrop = backdrop;

  const trailer = str(body.trailer);
  if (trailer !== undefined) patch.trailer = trailer;

  const video = str(body.video);
  if (video !== undefined) patch.video = video;

  const genres = toStringArray(body.genres);
  if (genres) patch.genres = genres;

  const cast = toStringArray(body.cast);
  if (cast) patch.cast = cast;

  const quality = str(body.quality);
  if (quality) patch.quality = quality === "4K" ? "4K" : "HD";

  if (body.featured !== undefined) patch.featured = !!body.featured;
  if (body.trending !== undefined) patch.trending = !!body.trending;
  if (body.isNew !== undefined) patch.isNew = !!body.isNew;

  const seasons = toSeasons(body.seasons);
  if (seasons) patch.seasons = seasons;

  if (opts.requireCore) {
    if (!patch.title) throw new HttpError(400, "Title is required");
    if (!patch.type) throw new HttpError(400, "Type must be 'movie' or 'series'");
    if (patch.year === undefined) throw new HttpError(400, "A valid year is required");
  }

  return patch;
}

/** Ensure `desired` slug is unique, appending -2, -3, ... when needed. */
export async function ensureUniqueSlug(
  titles: Collection<TitleDoc>,
  desired: string,
  excludeId?: ObjectId,
): Promise<string> {
  let base = slugify(desired);
  if (!base) base = "title";
  let candidate = base;
  let counter = 2;
  for (;;) {
    const filter: Record<string, unknown> = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    const clash = await titles.findOne(filter, { projection: { _id: 1 } });
    if (!clash) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

/** Fill POST defaults for anything the payload omitted. */
export function applyTitleDefaults(patch: Partial<TitleDoc>): TitleDoc {
  return {
    _id: new ObjectId(),
    slug: patch.slug ?? "",
    title: patch.title ?? "",
    type: patch.type ?? "movie",
    year: patch.year ?? 2000,
    maturity: patch.maturity ?? "PG-13",
    rating: patch.rating ?? 0,
    durationMinutes: patch.durationMinutes ?? 0,
    seasons: patch.seasons ?? [],
    genres: patch.genres ?? [],
    description: patch.description ?? "",
    cast: patch.cast ?? [],
    director: patch.director ?? "",
    language: patch.language ?? "English",
    poster: patch.poster ?? "",
    backdrop: patch.backdrop ?? "",
    trailer: patch.trailer ?? "",
    video: patch.video ?? "",
    featured: patch.featured ?? false,
    trending: patch.trending ?? false,
    isNew: patch.isNew ?? false,
    quality: patch.quality ?? "HD",
    views: patch.views ?? 0,
    createdAt: patch.createdAt ?? new Date(),
  };
}
