// ============================================================
// GET /api — NOVA service health + setup status
// Used by the SPA to decide between:
//   • "Connect your database" screen (MONGODB_URI missing/unreachable)
//   • "Set up NOVA" first-run screen (database empty)
//   • the normal app
// Always answers 200 so the client can branch on payload fields.
// ============================================================
import { NextResponse } from "next/server";
import { getDbStatus } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getDbStatus();
  return NextResponse.json({
    ok: true,
    service: "NOVA",
    db: {
      configured: status.configured,
      connected: status.connected,
      dbName: status.dbName,
      error: status.error,
    },
    needsSetup: status.needsSetup,
  });
}
