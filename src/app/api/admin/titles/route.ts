import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import {
  apiRoute,
  serializeTitle,
  readJsonBody,
  containsRegex,
  slugify,
} from "@/lib/api-utils";
import { parseTitleBody, ensureUniqueSlug, applyTitleDefaults } from "@/lib/title-input";

export const GET = apiRoute(async (req: Request) => {
  await requireAdmin();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = url.searchParams.get("type") || "";

  const filter: Record<string, unknown> = {};
  if (q) {
    const rx = containsRegex(q);
    filter.$or = [{ title: rx }, { slug: rx }];
  }
  if (type === "movie" || type === "series") filter.type = type;

  const { titles } = await collections();
  const docs = await titles
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json({ titles: docs.map(serializeTitle) });
});

export const POST = apiRoute(async (req: Request) => {
  await requireAdmin();
  const body = await readJsonBody(req);
  const patch = parseTitleBody(body, { requireCore: true });

  const { titles } = await collections();

  /* slug: explicit or auto from title, always unique */
  const desiredSlug =
    (typeof body.slug === "string" && body.slug.trim()) || slugify(patch.title ?? "");
  const slug = await ensureUniqueSlug(titles, desiredSlug || patch.title || "title");

  const doc = applyTitleDefaults({ ...patch, slug });
  await titles.insertOne(doc);

  return NextResponse.json({ title: serializeTitle(doc) });
});
