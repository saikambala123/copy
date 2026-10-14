// ============================================================
// NOVA — MongoDB document shapes (internal)
// Shared (type-only) by mongo.ts, auth.ts and api-utils.ts.
// ============================================================
import type { ObjectId } from "mongodb";
import type { PlanId } from "./types";

export interface EpisodeDoc {
  n: number;
  title: string;
  summary: string;
  durationMinutes: number;
}

export interface SeasonDoc {
  season: number;
  episodes: EpisodeDoc[];
}

export interface TitleDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  type: "movie" | "series";
  year: number;
  maturity: string;
  rating: number;
  durationMinutes: number;
  seasons: SeasonDoc[];
  genres: string[];
  description: string;
  cast: string[];
  director: string;
  language: string;
  poster: string;
  backdrop: string;
  trailer: string;
  video: string;
  featured: boolean;
  trending: boolean;
  isNew: boolean;
  quality: "HD" | "4K";
  views: number;
  createdAt: Date;
}

export interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  avatar: string;
  plan: PlanId;
  planExpiry?: Date | null;
  banned: boolean;
  createdAt: Date;
}

export interface PlanDoc {
  _id: ObjectId;
  id: PlanId;
  name: string;
  price: number;
  quality: string;
  devices: number;
  maxStreams: string;
  perks: string[];
  highlight?: boolean;
}

export interface WatchlistDoc {
  _id: ObjectId;
  userId: ObjectId;
  titleId: ObjectId;
  addedAt: Date;
}

export interface ProgressDoc {
  _id: ObjectId;
  userId: ObjectId;
  titleId: ObjectId;
  progressSeconds: number;
  durationSeconds: number;
  updatedAt: Date;
}

export interface RatingDoc {
  _id: ObjectId;
  userId: ObjectId;
  titleId: ObjectId;
  value: number;
  updatedAt: Date;
}

/** One real “watch start” — a user beginning to watch a title on a given UTC day. */
export interface ViewEventDoc {
  _id: ObjectId;
  titleId: ObjectId;
  userId: ObjectId;
  /** UTC YYYY-MM-DD key */
  day: string;
  at: Date;
}

export interface SettingsDoc {
  _id: string | ObjectId;
  siteName: string;
  heroAutoplay: boolean;
  maintenanceMode: boolean;
  defaultPlan: PlanId;
}

export interface NovaCollections {
  titles: import("mongodb").Collection<TitleDoc>;
  users: import("mongodb").Collection<UserDoc>;
  plans: import("mongodb").Collection<PlanDoc>;
  watchlist: import("mongodb").Collection<WatchlistDoc>;
  progress: import("mongodb").Collection<ProgressDoc>;
  ratings: import("mongodb").Collection<RatingDoc>;
  settings: import("mongodb").Collection<SettingsDoc>;
  viewEvents: import("mongodb").Collection<ViewEventDoc>;
}
