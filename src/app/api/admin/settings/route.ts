import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import { apiRoute, readJsonBody } from "@/lib/api-utils";
import type { SiteSettings } from "@/lib/types";

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "NOVA",
  heroAutoplay: true,
  maintenanceMode: false,
  defaultPlan: "free",
};

async function validPlanIds(): Promise<Set<string>> {
  const { plans } = await collections();
  const docs = await plans.find({}, { projection: { id: 1 } }).toArray();
  return new Set(docs.map((p) => p.id));
}

function serializeSettings(
  doc: Record<string, unknown> | null,
  knownPlans: Set<string>,
): SiteSettings {
  if (!doc) return { ...DEFAULT_SETTINGS };
  const defaultPlan =
    typeof doc.defaultPlan === "string" && knownPlans.has(doc.defaultPlan)
      ? doc.defaultPlan
      : DEFAULT_SETTINGS.defaultPlan;
  return {
    siteName:
      typeof doc.siteName === "string" && doc.siteName.trim()
        ? doc.siteName.trim()
        : DEFAULT_SETTINGS.siteName,
    heroAutoplay: doc.heroAutoplay === undefined ? true : !!doc.heroAutoplay,
    maintenanceMode: !!doc.maintenanceMode,
    defaultPlan,
  };
}

export const GET = apiRoute(async () => {
  await requireAdmin();
  const { settings } = await collections();
  const doc = await settings.findOne({ _id: "settings" });
  return NextResponse.json({
    settings: serializeSettings(doc, await validPlanIds()),
  });
});

export const PUT = apiRoute(async (req: Request) => {
  await requireAdmin();
  const body = await readJsonBody();

  const siteName =
    typeof body.siteName === "string" && body.siteName.trim()
      ? body.siteName.trim()
      : DEFAULT_SETTINGS.siteName;
  const heroAutoplay =
    body.heroAutoplay === undefined ? true : !!body.heroAutoplay;
  const maintenanceMode = !!body.maintenanceMode;

  const knownPlans = await validPlanIds();
  const defaultPlan =
    typeof body.defaultPlan === "string" && knownPlans.has(body.defaultPlan)
      ? body.defaultPlan
      : DEFAULT_SETTINGS.defaultPlan;

  const { settings } = await collections();
  await settings.updateOne(
    { _id: "settings" },
    { $set: { siteName, heroAutoplay, maintenanceMode, defaultPlan } },
    { upsert: true },
  );

  return NextResponse.json({
    settings: serializeSettings(
      { siteName, heroAutoplay, maintenanceMode, defaultPlan },
      knownPlans,
    ),
  });
});
