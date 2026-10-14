// ============================================================
// NOVA — first-run system bootstrap
// ------------------------------------------------------------
// NOVA ships with an EMPTY database: no demo users, no seeded
// titles. When the very first account is created (the "Set up
// NOVA" moment) this module idempotently installs the system
// documents the platform needs to function:
//   • the `settings` document (site config)
//   • the four default subscription tiers (Free → Premium)
// Everything is created with $setOnInsert, so an administrator
// can freely edit or extend these afterwards — bootstrap never
// overwrites existing data.
// ============================================================
import type { Db } from "mongodb";

interface PlanSeed {
  id: string;
  name: string;
  price: number;
  quality: string;
  devices: number;
  maxStreams: string;
  perks: string[];
  highlight?: boolean;
}

const DEFAULT_PLANS: PlanSeed[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    quality: "SD",
    devices: 1,
    maxStreams: "1 stream",
    perks: [
      "Explore the full catalog",
      "SD quality streaming",
      "Ad-supported",
      "Watch on 1 device",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    quality: "720p HD",
    devices: 1,
    maxStreams: "1 stream",
    perks: [
      "Ad-free streaming",
      "720p HD quality",
      "Watch on 1 device",
      "Cancel anytime",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 15.99,
    quality: "1080p Full HD",
    devices: 2,
    maxStreams: "2 streams",
    perks: [
      "Ad-free streaming",
      "1080p Full HD",
      "Watch on 2 devices at once",
      "Offline downloads on 2 devices",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 21.99,
    quality: "4K Ultra HD + HDR",
    devices: 4,
    maxStreams: "4 streams",
    perks: [
      "4K Ultra HD + HDR10",
      "Spatial audio",
      "Watch on 4 devices at once",
      "Offline downloads on 6 devices",
      "Early access to NOVA Originals",
    ],
  },
];

/**
 * Ensure the system documents exist. Safe to call on every
 * registration — inserts only what is missing.
 */
export async function ensureSystemBootstrap(db: Db): Promise<void> {
  await db.collection("settings").updateOne(
    { _id: "settings" },
    {
      $setOnInsert: {
        siteName: "NOVA",
        heroAutoplay: true,
        maintenanceMode: false,
        defaultPlan: "free",
      },
    },
    { upsert: true },
  );

  for (const plan of DEFAULT_PLANS) {
    await db.collection("plans").updateOne(
      { id: plan.id },
      { $setOnInsert: { ...plan } },
      { upsert: true },
    );
  }
}
