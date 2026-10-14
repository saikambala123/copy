// ============================================================
// /api/admin/plans — subscription tier management (admin only)
//   GET  — list all plans (price ascending)
//   POST — create a plan
// ============================================================
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { apiRoute, serializePlan, readJsonBody, slugify, HttpError } from "@/lib/api-utils";
import type { PlanDoc } from "@/lib/doc-types";

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

/** Parse + validate a plan payload into a PlanDoc patch. */
function parsePlanBody(
  body: Record<string, unknown>,
): Omit<PlanDoc, "_id"> {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length < 2) throw new HttpError(400, "Plan name must be at least 2 characters");

  const rawId =
    (typeof body.id === "string" && body.id.trim()) || slugify(name);
  const id = slugify(rawId);
  if (!/^[a-z0-9-]{2,40}$/.test(id)) {
    throw new HttpError(
      400,
      "Plan id must be 2-40 chars: lowercase letters, digits or dashes",
    );
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000) {
    throw new HttpError(400, "Price must be a number between 0 and 10000");
  }

  const devicesRaw = Number(body.devices);
  const devices =
    Number.isFinite(devicesRaw) && devicesRaw >= 1 && devicesRaw <= 50
      ? Math.floor(devicesRaw)
      : 1;

  const quality =
    typeof body.quality === "string" && body.quality.trim()
      ? body.quality.trim()
      : "HD";

  const maxStreams =
    typeof body.maxStreams === "string" && body.maxStreams.trim()
      ? body.maxStreams.trim()
      : `${devices} stream${devices > 1 ? "s" : ""}`;

  const perks = toStringArray(body.perks);

  return {
    id,
    name,
    price: Math.round(price * 100) / 100,
    quality,
    devices,
    maxStreams,
    perks,
    ...(body.highlight ? { highlight: true } : {}),
  };
}

export const GET = apiRoute(async () => {
  await requireAdmin();
  const { plans } = await collections();
  const docs = await plans.find({}).sort({ price: 1 }).toArray();
  return NextResponse.json({ plans: docs.map(serializePlan) });
});

export const POST = apiRoute(async (req: Request) => {
  await requireAdmin();
  const body = await readJsonBody(req);
  const parsed = parsePlanBody(body);

  const { plans } = await collections();
  const existing = await plans.findOne({ id: parsed.id });
  if (existing) {
    throw new HttpError(400, `A plan with id "${parsed.id}" already exists`);
  }

  const doc: PlanDoc = { _id: new ObjectId(), ...parsed };
  await plans.insertOne(doc);
  return NextResponse.json({ plan: serializePlan(doc) });
});
