"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Check,
  Crown,
  Loader2,
  LogIn,
  LogOut,
  Save,
  UserRound,
} from "lucide-react";
import type { User, WatchProgressItem } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  AVATAR_GRADIENTS,
  AVATAR_KEYS,
  EASE,
  EmptyState,
  ErrorState,
  formatDate,
  GradientAvatar,
  PlanBadge,
} from "@/components/app/bits";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function AccountView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const openAuth = useAppStore((s) => s.openAuth);
  const setView = useAppStore((s) => s.setView);
  const qc = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "rose");
  const [savedFlash, setSavedFlash] = useState(false);

  /* re-sync the editor whenever the signed-in user changes (render-time) */
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setName(user?.name ?? "");
    setAvatar(user?.avatar ?? "rose");
    setSavedFlash(false);
  }

  const profileMutation = useMutation({
    mutationFn: () =>
      api<{ user: User }>("/api/me", {
        method: "PATCH",
        json: { name: name.trim(), avatar },
      }),
    onSuccess: (res) => {
      setUser(res.user);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setUser(null);
      qc.invalidateQueries();
      setView("browse");
      toast.success("Signed out", { description: "See you soon on NOVA." });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: historyData, isLoading: historyLoading, error: historyError, refetch: historyRefetch } =
    useQuery({
      queryKey: ["history"],
      queryFn: () => api<{ items: WatchProgressItem[] }>("/api/me/history"),
      enabled: !!user,
      retry: 0,
    });

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-24 md:px-8 md:pt-32">
        <EmptyState
          icon={LogIn}
          title="Sign in to manage your account"
          description="Your profile, plan and viewing activity live here."
          action={
            <Button
              onClick={() => openAuth("login")}
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-7 font-bold shadow-[0_0_36px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              Sign In
            </Button>
          }
        />
      </section>
    );
  }

  const history = historyData?.items ?? [];

  return (
    <section
      aria-label="Account"
      className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-24 md:px-8 md:pt-28"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          <UserRound aria-hidden className="size-8 text-rose-500" />
          Account
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Manage your profile, plan and viewing activity.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* profile card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
          className="rounded-2xl border border-white/10 bg-card p-6"
        >
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Profile
          </h2>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <GradientAvatar
              name={name || user.name}
              gradient={avatar}
              className="size-20 text-2xl"
            />
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="account-name">Display name</Label>
                <Input
                  id="account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-12 rounded-xl border-white/10 bg-white/5"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  value={user.email}
                  readOnly
                  disabled
                  className="h-12 rounded-xl border-white/10 bg-white/[0.02] text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Label className="mb-2.5 block">Avatar color</Label>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Avatar gradient">
              {AVATAR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={avatar === key}
                  aria-label={`Avatar gradient ${key}`}
                  onClick={() => setAvatar(key)}
                  className={cn(
                    "size-11 rounded-full bg-gradient-to-br transition-all",
                    AVATAR_GRADIENTS[key],
                    avatar === key
                      ? "scale-110 ring-2 ring-rose-500 ring-offset-2 ring-offset-card"
                      : "opacity-70 hover:scale-105 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={() => {
                if (name.trim().length < 2) {
                  toast.error("Name must be at least 2 characters");
                  return;
                }
                profileMutation.mutate();
              }}
              disabled={profileMutation.isPending}
              className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-semibold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              {profileMutation.isPending ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : savedFlash ? (
                <>
                  <Check aria-hidden className="size-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save aria-hidden className="size-4" />
                  Save changes
                </>
              )}
            </Button>
            <p className="text-xs text-zinc-500">
              Member since{" "}
              <span suppressHydrationWarning>{formatDate(user.createdAt)}</span>
            </p>
          </div>
        </motion.div>

        {/* plan card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-rose-500/10 via-card to-card p-6"
        >
          <div
            aria-hidden
            className="absolute -right-12 -top-12 size-40 rounded-full bg-rose-600/20 blur-3xl"
          />
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <Crown aria-hidden className="size-5 text-amber-400" />
            Current plan
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <PlanBadge plan={user.plan} />
            <span className="text-sm capitalize text-zinc-300">{user.plan}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {user.planExpiry ? (
              <>
                Renews on{" "}
                <span
                  suppressHydrationWarning
                  className="font-semibold text-zinc-200"
                >
                  {formatDate(user.planExpiry)}
                </span>
              </>
            ) : (
              "No active billing cycle — upgrade to unlock unlimited streaming."
            )}
          </p>
          <Button
            onClick={() => setView("plans")}
            variant="outline"
            className="mt-5 h-11 w-full rounded-full border-white/15 bg-white/5 hover:border-rose-500/50 hover:bg-rose-500/10"
          >
            {user.plan === "premium" ? "View all plans" : "Upgrade plan"}
            <ArrowUpRight aria-hidden className="size-4" />
          </Button>

          {/* danger zone */}
          <div className="mt-8 border-t border-white/10 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Danger zone
            </h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={logoutMutation.isPending}
                  className="mt-3 h-11 w-full rounded-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut aria-hidden className="size-4" />
                  {logoutMutation.isPending ? "Signing out…" : "Sign out"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-white/10 bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of NOVA?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You can sign back in anytime — your watchlist and progress
                    will be waiting.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">
                    Stay signed in
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => logoutMutation.mutate()}
                    className="rounded-full bg-rose-600 hover:bg-rose-500"
                  >
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>

      {/* viewing activity */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        className="rounded-2xl border border-white/10 bg-card p-6"
      >
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Viewing activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your recently watched titles and progress.
        </p>

        <div className="mt-5">
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <Skeleton className="h-14 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-2 w-full max-w-xs rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyError ? (
            <ErrorState
              compact
              message={
                historyError instanceof Error
                  ? historyError.message
                  : "History unavailable."
              }
              onRetry={historyRefetch}
            />
          ) : history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
              Nothing watched yet — press play on something great.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((item) => {
                const pct =
                  item.durationSeconds > 0
                    ? Math.min(100, (item.progressSeconds / item.durationSeconds) * 100)
                    : 0;
                return (
                  <li
                    key={item.titleId}
                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15"
                  >
                    <button
                      type="button"
                      onClick={() => setView("watch", { titleId: item.titleId })}
                      aria-label={`Resume ${item.title.title}`}
                      className="h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={item.title.backdrop || item.title.poster}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {item.title.title}
                      </p>
                      <Progress
                        value={pct}
                        className="mt-2 h-1.5"
                        aria-label={`${Math.round(pct)}% watched`}
                      />
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        {Math.round(pct)}% watched •{" "}
                        <span suppressHydrationWarning>
                          {formatDate(item.updatedAt)}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setView("watch", { titleId: item.titleId })}
                      className="h-9 rounded-full px-4 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      Resume
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </section>
  );
}
