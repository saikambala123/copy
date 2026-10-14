// ============================================================
// NOVA — API helpers: route wrapper, serializers, misc utils
// (Next-side only — never imported from seed.ts / scripts)
// ============================================================
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { HttpError } from "./http";
import type {
  Title,
  User,
  Plan,
  WatchProgressItem,
} from "./types";
import type {
  TitleDoc,
  UserDoc,
  PlanDoc,
  ProgressDoc,
} from "./doc-types";

export { HttpError };

/* ------------------------------------------------------------------ */
/* Route wrapper — uniform error handling for every handler            */
/* ------------------------------------------------------------------ */

type RouteHandler<C> = (
  req: Request,
  ctx: C,
) => Promise<Response> | Response;

/** Wraps a route handler: HttpError → {error} + status, else 500. */
export function apiRoute<C = unknown>(fn: RouteHandler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("[api] unhandled error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/* ------------------------------------------------------------------ */
/* Serializers — Mongo docs → API contract shapes                      */
/* (_id → string, dates → ISO strings, passwordHash stripped)          */
/* ------------------------------------------------------------------ */

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

export function serializeTitle(doc: Partial<TitleDoc> & { _id: ObjectId }): Title {
  return {
    _id: String(doc._id),
    slug: doc.slug ?? "",
    title: doc.title ?? "",
    type: doc.type === "series" ? "series" : "movie",
    year: typeof doc.year === "number" ? doc.year : 0,
    maturity: doc.maturity ?? "PG-13",
    rating: typeof doc.rating === "number" ? doc.rating : 0,
    durationMinutes: typeof doc.durationMinutes === "number" ? doc.durationMinutes : 0,
    seasons: doc.seasons ?? [],
    genres: doc.genres ?? [],
    description: doc.description ?? "",
    cast: doc.cast ?? [],
    director: doc.director ?? "",
    language: doc.language ?? "English",
    poster: doc.poster ?? "",
    backdrop: doc.backdrop ?? "",
    trailer: doc.trailer ?? "",
    video: doc.video ?? "",
    featured: !!doc.featured,
    trending: !!doc.trending,
    isNew: !!doc.isNew,
    quality: doc.quality === "4K" ? "4K" : "HD",
    views: typeof doc.views === "number" ? doc.views : 0,
    createdAt: iso(doc.createdAt),
  };
}

export function serializeUser(doc: Partial<UserDoc> & { _id: ObjectId }): User {
  return {
    _id: String(doc._id),
    name: doc.name ?? "",
    email: doc.email ?? "",
    role: doc.role === "admin" ? "admin" : "user",
    avatar: doc.avatar ?? "rose",
    plan: doc.plan ?? "free",
    planExpiry: doc.planExpiry ? iso(doc.planExpiry) : null,
    banned: !!doc.banned,
    createdAt: iso(doc.createdAt),
  };
}

export function serializePlan(doc: Partial<PlanDoc> & { _id: ObjectId }): Plan {
  return {
    _id: String(doc._id),
    id: doc.id ?? "free",
    name: doc.name ?? "",
    price: typeof doc.price === "number" ? doc.price : 0,
    quality: doc.quality ?? "",
    devices: typeof doc.devices === "number" ? doc.devices : 1,
    maxStreams: doc.maxStreams ?? "",
    perks: doc.perks ?? [],
    ...(doc.highlight ? { highlight: true } : {}),
  };
}

export function serializeProgressItem(
  doc: Partial<ProgressDoc> & { titleId: ObjectId },
  title: Title,
): WatchProgressItem {
  return {
    titleId: String(doc.titleId),
    title,
    progressSeconds: typeof doc.progressSeconds === "number" ? doc.progressSeconds : 0,
    durationSeconds: typeof doc.durationSeconds === "number" ? doc.durationSeconds : 0,
    updatedAt: iso(doc.updatedAt),
  };
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export const AVATAR_GRADIENTS = [
  "rose",
  "amber",
  "emerald",
  "violet",
  "cyan",
  "orange",
  "pink",
] as const;

/** Escape a string for safe embedding in a RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive "contains" regex. */
export function containsRegex(input: string): RegExp {
  return new RegExp(escapeRegex(input), "i");
}

/** Parse `id` into an ObjectId, or null when invalid. */
export function toObjectId(id: unknown): ObjectId | null {
  return typeof id === "string" && ObjectId.isValid(id)
    ? new ObjectId(id)
    : null;
}

/** Safely read a JSON object body (returns {} for empty/invalid). */
export async function readJsonBody(
  req: Request,
): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

/** UTC YYYY-MM-DD key for a date. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Slugify a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The last `n` UTC day keys, oldest first, ending today. */
export function lastDayKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(today.getTime() - i * 86400000)));
  }
  return keys;
}
