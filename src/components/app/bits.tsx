"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { animate, motion, useMotionValue } from "framer-motion";
import { Star, RefreshCcw, AlertTriangle, type LucideIcon } from "lucide-react";
import type { Title, User } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const AVATAR_GRADIENTS: Record<string, string> = {
  rose: "from-rose-400 via-rose-500 to-rose-700",
  amber: "from-amber-300 via-amber-500 to-orange-600",
  emerald: "from-emerald-300 via-emerald-500 to-teal-700",
  violet: "from-violet-400 via-violet-500 to-purple-700",
  cyan: "from-cyan-300 via-cyan-500 to-teal-600",
  orange: "from-orange-300 via-orange-500 to-red-600",
  pink: "from-pink-300 via-pink-500 to-rose-600",
};

export const AVATAR_KEYS = Object.keys(AVATAR_GRADIENTS);

export const GENRES_FALLBACK = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
];

export const DEMO_ACCOUNTS = {
  demo: { email: "demo@nova.stream", password: "Demo@123" },
  admin: { email: "admin@nova.stream", password: "Admin@123" },
};

/* ------------------------------------------------------------------ */
/* formatters                                                          */
/* ------------------------------------------------------------------ */

export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatSeasons(seasons?: { episodes: unknown[] }[]): string {
  if (!seasons?.length) return "";
  return seasons.length === 1 ? "1 Season" : `${seasons.length} Seasons`;
}

export function formatViews(views?: number): string {
  const v = views ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(v);
}

export function matchPercent(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `${70 + (h % 30)}% match`;
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/* hooks                                                               */
/* ------------------------------------------------------------------ */

export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** watchlist state + toggle mutation (guests get the auth modal) */
export function useWatchlist() {
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => api<{ titles: Title[] }>("/api/watchlist"),
    enabled: !!user,
    retry: 0,
  });

  const ids = useMemo(
    () => new Set((data?.titles ?? []).map((t) => t._id)),
    [data]
  );

  const mutation = useMutation({
    mutationFn: (titleId: string) =>
      api<{ added: boolean }>("/api/watchlist", { json: { titleId } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      qc.invalidateQueries({ queryKey: ["home"] });
      toast.success(
        res.added ? "Added to My List" : "Removed from My List",
        { description: res.added ? "Ready to binge later." : undefined }
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (title: Title) => {
    if (!user) {
      openAuth("login");
      toast.info("Sign in to build your watchlist");
      return;
    }
    mutation.mutate(title._id);
  };

  return {
    ids,
    isIn: (id: string) => ids.has(id),
    toggle,
    loading: isLoading,
    pending: mutation.isPending,
  };
}

/* ------------------------------------------------------------------ */
/* shared UI atoms                                                     */
/* ------------------------------------------------------------------ */

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  const box = size === "lg" ? "size-10" : size === "sm" ? "size-6" : "size-7";
  return (
    <span className={cn("flex items-center gap-2 select-none", className)}>
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 shadow-[0_0_24px_-6px_rgba(244,63,94,0.7)]",
          box
        )}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="white">
          <path d="M8 5.5l11 6.5L8 18.5z" />
        </svg>
      </span>
      <span className={cn("font-black tracking-tight text-foreground", text)}>
        NOVA
      </span>
    </span>
  );
}

export function GradientAvatar({
  name,
  gradient,
  className,
}: {
  name: string;
  gradient: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        AVATAR_GRADIENTS[gradient] ?? AVATAR_GRADIENTS.rose,
        className
      )}
    >
      {initialsOf(name)}
    </div>
  );
}

export function MaturityBadge({ value }: { value: string }) {
  return (
    <span
      aria-label={`Rated ${value}`}
      className="rounded border border-white/25 px-1.5 py-0.5 text-[11px] font-medium leading-none text-zinc-300"
    >
      {value}
    </span>
  );
}

export function MetaPills({ title }: { title: Title }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-zinc-300">
      <span className="font-semibold text-zinc-100">{title.year}</span>
      <MaturityBadge value={title.maturity} />
      <span>
        {title.type === "movie"
          ? formatDuration(title.durationMinutes)
          : formatSeasons(title.seasons)}
      </span>
      <span className="rounded border border-white/20 px-1.5 py-0.5 text-[11px] font-bold leading-none tracking-wider text-amber-400">
        {title.quality}
      </span>
      <span className="flex items-center gap-1 font-semibold text-amber-400">
        <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
        {title.rating?.toFixed(1)}
      </span>
    </div>
  );
}

/** interactive 1–5 star rating with pop animation */
export function StarRating({
  value,
  onChange,
  size = 20,
  label = "Rate this title",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const interactive = !!onChange;

  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${label}: ${value} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          aria-checked={interactive ? value === n : undefined}
          role={interactive ? "radio" : undefined}
          className={cn("rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring", interactive ? "cursor-pointer" : "cursor-default")}
          whileHover={interactive ? { scale: 1.25 } : undefined}
          whileTap={interactive ? { scale: 0.8 } : undefined}
          animate={
            n <= value ? { scale: [1, 1.35, 1] } : { scale: 1 }
          }
          transition={{ duration: 0.35, ease: EASE }}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onFocus={() => interactive && setHover(n)}
          onBlur={() => interactive && setHover(0)}
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(n);
          }}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              n <= display
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-zinc-600"
            )}
          />
        </motion.button>
      ))}
      <span className="ml-2 text-xs font-medium text-zinc-400">
        {display ? `${display}/5` : "Rate this"}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* async states                                                        */
/* ------------------------------------------------------------------ */

export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center",
        compact ? "p-6" : "p-10"
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">
          Something went wrong
        </p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {message ??
            "We couldn't load this content. The service may not be available yet."}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCcw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent text-center",
        compact ? "p-6" : "p-10"
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-amber-500/10 text-rose-400">
        <Icon className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* animated counter (admin stats)                                      */
/* ------------------------------------------------------------------ */

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.4,
  format,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: (v: number) => string;
}) {
  const mv = useMotionValue(0);
  const fmt = useMemo(
    () =>
      format ??
      ((v: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v))),
    [format]
  );
  const [text, setText] = useState(() => fmt(0));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: EASE });
    return () => controls.stop();
  }, [value, duration, mv]);

  useEffect(() => mv.on("change", (v) => setText(fmt(v))), [mv, fmt]);

  return (
    <span className="tabular-nums">
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* plan badge                                                          */
/* ------------------------------------------------------------------ */

const PLAN_STYLES: Record<string, string> = {
  free: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
  basic: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  standard: "border-rose-500/40 bg-rose-500/10 text-rose-400",
  premium: "border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300",
};

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        PLAN_STYLES[plan] ?? PLAN_STYLES.free
      )}
    >
      {plan}
    </span>
  );
}

/** small helper used across admin/users views */
export function useCurrentUser(): User | null {
  return useAppStore((s) => s.user);
}
