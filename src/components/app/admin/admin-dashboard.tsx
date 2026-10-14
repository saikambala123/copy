"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Eye,
  Film,
  TrendingDown,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import type { AdminStats } from "@/lib/types";
import { api } from "@/lib/api";
import {
  CountUp,
  EASE,
  ErrorState,
  formatDate,
  formatViews,
  GradientAvatar,
  PlanBadge,
} from "@/components/app/bits";
import { StatCardSkeleton, TableSkeleton } from "@/components/app/skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#22d3ee",
  "#fb7185",
  "#fbbf24",
  "#34d399",
];

const TOOLTIP_STYLE = {
  background: "rgba(20,20,26,0.95)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#f4f4f6",
  fontSize: 12,
} as const;

const dayLabel = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export function AdminDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api<{ stats: AdminStats }>("/api/admin/stats"),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <StatCardSkeleton />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error || !data?.stats) {
    return (
      <ErrorState
        message={
          error instanceof Error
            ? error.message
            : "Admin statistics are unavailable."
        }
        onRetry={refetch}
      />
    );
  }

  const s = data.stats;
  const signups = s.signups ?? [];
  const viewsByDay = s.viewsByDay ?? [];
  const genreDist = s.genreDist ?? [];

  const viewsDelta =
    viewsByDay.length >= 2
      ? viewsByDay[viewsByDay.length - 1].count -
        viewsByDay[viewsByDay.length - 2].count
      : 0;
  const todaySignups = signups[signups.length - 1]?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform pulse for the last 14 days.
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total users"
          icon={UsersIcon}
          delta={`+${todaySignups} today`}
          deltaUp
          delay={0}
        >
          <CountUp value={s.totalUsers} />
        </StatCard>
        <StatCard
          label="Titles"
          icon={Film}
          delta={`${s.watchlistCount} in watchlists`}
          delay={0.05}
        >
          <CountUp value={s.totalTitles} />
        </StatCard>
        <StatCard
          label="Total views"
          icon={Eye}
          delta={`${viewsDelta >= 0 ? "+" : ""}${formatViews(viewsDelta)} vs yesterday`}
          deltaUp={viewsDelta >= 0}
          delay={0.1}
        >
          <CountUp value={s.totalViews} />
        </StatCard>
        <StatCard
          label="Monthly revenue"
          icon={DollarSign}
          delta={`${s.premiumUsers} premium subs`}
          delay={0.15}
        >
          <CountUp value={s.revenueMonthly} prefix="$" />
        </StatCard>
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        >
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingUp aria-hidden className="size-4 text-rose-500" />
                Signups — last 14 days
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={signups.map((d) => ({
                    day: dayLabel(d.date),
                    count: d.count,
                  }))}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(244,63,94,0.4)" }} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#signupFill)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        >
          <Card className="border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Eye aria-hidden className="size-4 text-amber-500" />
                Views by day
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={viewsByDay.map((d) => ({
                    day: dayLabel(d.date),
                    count: d.count,
                  }))}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ fill: "rgba(244,63,94,0.08)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* genre pie + top titles */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          <Card className="h-full border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">
                Genre distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-72 flex-col-reverse items-center gap-4 sm:flex-row">
              <div className="h-40 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreDist}
                      dataKey="count"
                      nameKey="genre"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={3}
                      stroke="none"
                      animationDuration={900}
                    >
                      {genreDist.map((g, i) => (
                        <Cell key={g.genre} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid w-full shrink-0 grid-cols-2 gap-x-4 gap-y-1.5 sm:w-44 sm:grid-cols-1">
                {genreDist.slice(0, 8).map((g, i) => (
                  <li
                    key={g.genre}
                    className="flex items-center gap-2 text-xs text-zinc-300"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate">{g.genre}</span>
                    <span className="ml-auto tabular-nums text-zinc-500">
                      {g.count}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
        >
          <Card className="h-full border-white/10 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingDown aria-hidden className="size-4 rotate-180 text-rose-500" />
                Top titles by views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {(s.topTitles ?? []).slice(0, 5).map((entry, i) => (
                  <li
                    key={entry.title._id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5"
                  >
                    <span className="w-5 text-center text-sm font-black tabular-nums text-zinc-500">
                      {i + 1}
                    </span>
                    <span className="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                      {entry.title.poster && (
                        <img
                          src={entry.title.poster}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {entry.title.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {entry.title.type === "movie" ? "Movie" : "Series"} •{" "}
                        {entry.title.year}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-rose-400">
                      <CountUp value={entry.views} format={formatViews} />
                    </span>
                  </li>
                ))}
                {!s.topTitles?.length && (
                  <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                    No view data yet.
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* recent users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
      >
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Recent users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th scope="col" className="pb-3 pr-4 font-semibold">User</th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">Plan</th>
                    <th scope="col" className="pb-3 pr-4 font-semibold">Role</th>
                    <th scope="col" className="pb-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(s.recentUsers ?? []).slice(0, 6).map((u) => (
                    <tr
                      key={u._id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <GradientAvatar
                            name={u.name}
                            gradient={u.avatar}
                            className="size-9 text-xs"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {u.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <PlanBadge plan={u.plan} />
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            u.role === "admin" ? "text-amber-400" : "text-zinc-400"
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!s.recentUsers?.length && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No users yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  delta,
  deltaUp = true,
  delay = 0,
  children,
}: {
  label: string;
  icon: typeof UsersIcon;
  delta: string;
  deltaUp?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card p-5"
    >
      <div
        aria-hidden
        className="absolute -right-8 -top-8 size-24 rounded-full bg-rose-600/10 blur-2xl"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-rose-400">
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
        {children}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
          deltaUp
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-rose-500/10 text-rose-400"
        )}
      >
        {deltaUp ? (
          <TrendingUp aria-hidden className="size-3" />
        ) : (
          <TrendingDown aria-hidden className="size-3" />
        )}
        {delta}
      </p>
    </motion.div>
  );
}
