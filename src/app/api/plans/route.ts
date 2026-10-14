import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { apiRoute, serializePlan } from "@/lib/api-utils";

export const GET = apiRoute(async () => {
  const { plans } = await collections();
  const docs = await plans.find({}).sort({ price: 1 }).toArray();
  return NextResponse.json({ plans: docs.map(serializePlan) });
});
