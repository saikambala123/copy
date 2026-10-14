import { NextResponse } from "next/server";
import { collections } from "@/lib/mongo";
import { requireAdmin } from "@/lib/auth";
import {
  apiRoute,
  serializeTitle,
  serializeUser,
  lastDayKeys,
} from "@/lib/api-utils";
import type { AdminStats } from "@/lib/types";

const DAYS = 14;

export const GET = apiRoute(async () => {
  await requireAdmin();
  const { titles, users, watchlist, plans, viewEvents } = await collections();

  /* headline counts */
  const [totalUsers, totalTitles, watchlistCount] = await Promise.all([
    users.countDocuments({}),
    titles.countDocuments({}),
    watchlist.countDocuments({}),
  ]);

  const titleDocs = await titles
    .find({}, { projection: { slug: 1, views: 1, genres: 1 } })
    .toArray();
  const totalViews = titleDocs.reduce((sum, t) => sum + (t.views ?? 0), 0);

  /* premium + revenue (sum of active paid plan prices) */
  const planDocs = await plans.find({}).toArray();
  const priceByPlan = new Map(planDocs.map((p) => [p.id, p.price]));
  const userDocs = await users
    .find({}, { projection: { plan: 1, planExpiry: 1 } })
    .toArray();
  const premiumUsers = userDocs.filter((u) => u.plan === "premium").length;
  const revenueMonthly = userDocs.reduce((sum, u) => {
    if (u.plan === "free") return sum;
    const active = !u.planExpiry || u.planExpiry.getTime() > Date.now();
    return active ? sum + (priceByPlan.get(u.plan) ?? 0) : sum;
  }, 0);

  /* signups — last 14 days grouped by UTC day */
  const dayKeys = lastDayKeys(DAYS);
  const since = new Date(`${dayKeys[0]}T00:00:00.000Z`);
  const signupAgg = await users
    .aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  const signupMap = new Map(signupAgg.map((s) => [s._id, s.count]));
  const signups = dayKeys.map((date) => ({ date, count: signupMap.get(date) ?? 0 }));

  /* views by day — REAL watch events recorded by POST /api/progress */
  const viewsAgg = await viewEvents
    .aggregate<{ _id: string; count: number }>([
      { $match: { day: { $gte: dayKeys[0] } } },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  const viewsMap = new Map(viewsAgg.map((v) => [v._id, v.count]));
  const viewsByDay = dayKeys.map((date) => ({
    date,
    count: viewsMap.get(date) ?? 0,
  }));

  /* genre distribution */
  const genreAgg = await titles
    .aggregate<{ _id: string; count: number }>([
      { $unwind: "$genres" },
      { $group: { _id: "$genres", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  const genreDist = genreAgg.map((g) => ({ genre: g._id, count: g.count }));

  /* top titles + recent users */
  const [topDocs, recentDocs] = await Promise.all([
    titles.find({}).sort({ views: -1 }).limit(5).toArray(),
    users.find({}).sort({ createdAt: -1 }).limit(6).toArray(),
  ]);

  const stats: AdminStats = {
    totalUsers,
    totalTitles,
    totalViews,
    watchlistCount,
    premiumUsers,
    revenueMonthly: Math.round(revenueMonthly * 100) / 100,
    signups,
    viewsByDay,
    genreDist,
    topTitles: topDocs.map((t) => ({
      title: serializeTitle(t),
      views: t.views ?? 0,
    })),
    recentUsers: recentDocs.map(serializeUser),
  };

  return NextResponse.json({ stats });
});
