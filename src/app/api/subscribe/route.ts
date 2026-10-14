import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireUser } from "@/lib/auth";
import { apiRoute, serializeUser, readJsonBody, HttpError } from "@/lib/api-utils";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const POST = apiRoute(async (req: Request) => {
  const user = await requireUser();
  const body = await readJsonBody(req);
  const planId = typeof body.planId === "string" ? body.planId : "";

  if (!planId) throw new HttpError(400, "planId is required");

  const { plans, users } = await collections();
  const plan = await plans.findOne({ id: planId });
  if (!plan) throw new HttpError(400, "Plan not found");

  const planExpiry = plan.price > 0 ? new Date(Date.now() + THIRTY_DAYS_MS) : null;

  await users.updateOne(
    { _id: user._id },
    { $set: { plan: plan.id, planExpiry } },
  );

  const updated = await users.findOne({ _id: user._id });
  return NextResponse.json({ user: updated ? serializeUser(updated) : null });
});
