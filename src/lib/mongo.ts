// ============================================================
// NOVA — MongoDB Atlas connection (env-only, cached singleton)
// ------------------------------------------------------------
// The app talks to exactly one MongoDB deployment, configured
// through environment variables (works identically on Vercel,
// Render, Docker or localhost):
//
//   MONGODB_URI  — required. Atlas connection string, e.g.
//                  mongodb+srv://user:pass@cluster.mongodb.net
//   MONGODB_DB   — optional. Database name (default: parsed from
//                  the URI path, falling back to "nova").
//
// There is NO bundled/seeded data and NO hardcoded localhost
// fallback: without MONGODB_URI the APIs answer 503 and the UI
// shows a "Connect your database" screen.
// ============================================================
import { MongoClient, type Db } from "mongodb";
import { HttpError } from "./http";
import type { NovaCollections } from "./doc-types";

const MONGODB_URI = process.env.MONGODB_URI?.trim() || "";
const DB_NAME =
  process.env.MONGODB_DB?.trim() ||
  (() => {
    try {
      const path = new URL(
        MONGODB_URI.replace(/^mongodb(\+srv)?:\/\//, "http://"),
      ).pathname;
      const name = path.replace(/^\//, "").split(/[?#/]/)[0];
      return name || "nova";
    } catch {
      return "nova";
    }
  })();

export const dbConfigured = MONGODB_URI.length > 0;

/** Human-readable hint shown in logs / the connect-database screen. */
export const dbConfigHint =
  "Set the MONGODB_URI environment variable to your MongoDB Atlas connection string (mongodb+srv://…), then restart the app.";

/* Cache on globalThis so dev hot-reload doesn't open new pools. */
interface MongoCache {
  client: MongoClient;
  promise: Promise<MongoClient>;
}

const globalForMongo = globalThis as unknown as {
  __novaMongo?: MongoCache;
};

function getCache(): MongoCache {
  if (!globalForMongo.__novaMongo) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000,
    });
    const promise = client.connect().catch((err: unknown) => {
      /* allow the next request to retry after a connection failure */
      globalForMongo.__novaMongo = undefined;
      throw err;
    });
    globalForMongo.__novaMongo = { client, promise };
  }
  return globalForMongo.__novaMongo;
}

/** The live NOVA database (connects on first call; cached afterwards). */
export async function getDb(): Promise<Db> {
  if (!dbConfigured) {
    throw new HttpError(503, `Database is not configured. ${dbConfigHint}`);
  }
  const cache = getCache();
  await cache.promise;
  return cache.client.db(DB_NAME);
}

/* ------------------------------------------------------------------ */
/* Indexes — created once, idempotently, on first data access          */
/* ------------------------------------------------------------------ */

let indexesPromise: Promise<void> | null = null;

async function runEnsureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("titles").createIndex({ slug: 1 }, { unique: true }),
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("plans").createIndex({ id: 1 }, { unique: true }),
    db
      .collection("watchlist")
      .createIndex({ userId: 1, titleId: 1 }, { unique: true }),
    db
      .collection("progress")
      .createIndex({ userId: 1, titleId: 1 }, { unique: true }),
    db
      .collection("ratings")
      .createIndex({ userId: 1, titleId: 1 }, { unique: true }),
    db
      .collection("viewEvents")
      .createIndex({ titleId: 1, userId: 1, day: 1 }, { unique: true }),
    db.collection("viewEvents").createIndex({ day: 1 }),
    db.collection("progress").createIndex({ updatedAt: -1 }),
  ]);
}

async function ensureIndexes(db: Db): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = runEnsureIndexes(db).catch((err: unknown) => {
      indexesPromise = null; // allow retry on next request
      throw err;
    });
  }
  await indexesPromise;
}

/* ------------------------------------------------------------------ */
/* Collection accessors                                                 */
/* ------------------------------------------------------------------ */

export async function collections(): Promise<NovaCollections> {
  const db = await getDb();
  await ensureIndexes(db);
  return {
    titles: db.collection<NovaCollections["titles"]>("titles"),
    users: db.collection<NovaCollections["users"]>("users"),
    plans: db.collection<NovaCollections["plans"]>("plans"),
    watchlist: db.collection<NovaCollections["watchlist"]>("watchlist"),
    progress: db.collection<NovaCollections["progress"]>("progress"),
    ratings: db.collection<NovaCollections["ratings"]>("ratings"),
    settings: db.collection<NovaCollections["settings"]>("settings"),
    viewEvents: db.collection<NovaCollections["viewEvents"]>("viewEvents"),
  };
}

/* ------------------------------------------------------------------ */
/* Health / setup status (used by GET /api)                             */
/* ------------------------------------------------------------------ */

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  dbName: string | null;
  /** true when the database is reachable and has zero users */
  needsSetup: boolean | null;
  error: string | null;
}

export async function getDbStatus(): Promise<DbStatus> {
  if (!dbConfigured) {
    return {
      configured: false,
      connected: false,
      dbName: null,
      needsSetup: null,
      error: dbConfigHint,
    };
  }
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const userCount = await db.collection("users").countDocuments({});
    return {
      configured: true,
      connected: true,
      dbName: DB_NAME,
      needsSetup: userCount === 0,
      error: null,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      dbName: DB_NAME,
      needsSetup: null,
      error:
        err instanceof Error
          ? `Cannot reach MongoDB: ${err.message}`
          : "Cannot reach MongoDB.",
    };
  }
}
