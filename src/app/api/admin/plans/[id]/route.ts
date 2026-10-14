// ============================================================
// /api/admin/plans/[id] — update / delete a subscription tier
// (the `[id]` param is the plan's string `id`, e.g. "premium")
//   PATCH  — partial update
//   DELETE — remove (guarded: in use / default / last plan)
// ============================================================
import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { apiRoute, serializePlan, readJsonBody, HttpError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
}

export const PATCH = apiRoute<Ctx>(async (req: Request, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJsonBody(req);

  const { plans } = await collections();
  const doc = await plans.findOne({ id });
  if (!doc) throw new HttpError(404, "Plan not found");

  const setPatch: Record<string, unknown> = {};
  let unsetHighlight = false;

  if (typeof body.name === "string" && body.name.trim()) {
    setPatch.name = body.name.trim();
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 10000) {
      throw new HttpError(400, "Price must be a number between 0 and 10000");
    }
    setPatch.price = Math.round(price * 100) / 100;
  }
  if (typeof body.quality === "string" && body.quality.trim()) {
    setPatch.quality = body.quality.trim();
  }
  if (body.devices !== undefined) {
    const devices = Number(body.devices);
    if (!Number.isFinite(devices) || devices < 1 || devices > 50) {
      throw new HttpError(400, "Devices must be a number between 1 and 50");
    }
    setPatch.devices = Math.floor(devices);
  }
  if (typeof body.maxStreams === "string" && body.maxStreams.trim()) {
    setPatch.maxStreams = body.maxStreams.trim();
  }
  const perks = toStringArray(body.perks);
  if (perks) setPatch.perks = perks;
  if (body.highlight !== undefined) {
    if (body.highlight) setPatch.highlight = true;
    else unsetHighlight = true;
  }

  if (Object.keys(setPatch).length === 0 && !unsetHighlight) {
    throw new HttpError(400, "Nothing to update");
  }

  const update: Record<string, Record<string, unknown>> = {};
  if (Object.keys(setPatch).length > 0) update.$set = setPatch;
  if (unsetHighlight) update.$unset = { highlight: "" };

  await plans.updateOne({ id }, update);
  const updated = await plans.findOne({ id });
  return NextResponse.json({ plan: updated ? serializePlan(updated) : null });
});

export const DELETE = apiRoute<Ctx>(async (_req: Request, ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;

  const { plans, users, settings } = await collections();
  const doc = await plans.findOne({ id });
  if (!doc) throw new HttpError(404, "Plan not found");

  const planCount = await plans.countDocuments({});
  if (planCount <= 1) {
    throw new HttpError(400, "This is the only plan left — create another before deleting it");
  }

  const userCount = await users.countDocuments({ plan: id });
  if (userCount > 0) {
    throw new HttpError(
      400,
      `${userCount} ${userCount === 1 ? "user is" : "users are"} on this plan — move them to another tier first`,
    );
  }

  const siteSettings = await settings.findOne({ _id: "settings" });
  if (siteSettings?.defaultPlan === id) {
    throw new HttpError(
      400,
      "This plan is the default for new accounts — change it in Settings first",
    );
  }

  await plans.deleteOne({ id });
  return NextResponse.json({ ok: true });
});
