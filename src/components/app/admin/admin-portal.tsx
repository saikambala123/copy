"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Film,
  LayoutDashboard,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  Users as UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { useAppStore, type AdminTab } from "@/lib/store";
import {
  EASE,
  GradientAvatar,
  Logo,
  PlanBadge,
} from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminDashboard } from "@/components/app/admin/admin-dashboard";
import { AdminTitles } from "@/components/app/admin/admin-titles";
import { AdminUsers } from "@/components/app/admin/admin-users";
import { AdminSettings } from "@/components/app/admin/admin-settings";

const TABS: { id: AdminTab; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "titles", label: "Content", icon: Film },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function AdminPortal() {
  const user = useAppStore((s) => s.user);
  const openAuth = useAppStore((s) => s.openAuth);
  const setView = useAppStore((s) => s.setView);
  const viewParams = useAppStore((s) => s.viewParams);
  const tab = viewParams.adminTab ?? "dashboard";

  /* guard */
  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="glass w-full max-w-md rounded-2xl p-8 text-center"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.7)]">
            <ShieldAlert aria-hidden className="size-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            Admin access required
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This area is reserved for NOVA operators. Sign in with an admin
            account to manage content, users and analytics.
          </p>
          <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
            Admin demo:{" "}
            <span className="font-semibold text-zinc-200">admin@nova.stream</span>{" "}
            / <span className="font-semibold text-zinc-200">Admin@123</span>
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              onClick={() => openAuth("login")}
              className="h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-base font-bold shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
            >
              Sign in as admin
            </Button>
            <Button
              variant="ghost"
              onClick={() => setView("browse")}
              className="h-12 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
            >
              Back to NOVA
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#0b0b10] p-5 md:flex">
        <button
          type="button"
          onClick={() => setView("browse")}
          aria-label="NOVA home"
          className="mb-8 flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
          <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-400">
            <Shield aria-hidden className="size-3" />
            Admin
          </span>
        </button>

        <nav aria-label="Admin sections" className="space-y-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView("admin", { adminTab: t.id })}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "relative flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium transition",
                tab === t.id
                  ? "bg-gradient-to-r from-rose-500/20 to-transparent text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="admin-active"
                  className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-rose-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <t.icon aria-hidden className="size-4.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => setView("browse")}
            className="flex h-11 w-full items-center gap-3 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-400 transition hover:border-rose-500/40 hover:text-white"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to site
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <GradientAvatar
              name={user.name}
              gradient={user.avatar}
              className="size-9 text-xs"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </p>
            </div>
            <PlanBadge plan={user.plan} />
          </div>
        </div>
      </aside>

      {/* mobile header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b10]/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Logo size="sm" />
          <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-rose-400">
            <Shield aria-hidden className="size-2.5" />
            Admin
          </span>
          <button
            type="button"
            onClick={() => setView("browse")}
            aria-label="Back to site"
            className="ml-auto flex size-11 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
        </div>
        <nav
          aria-label="Admin sections"
          className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView("admin", { adminTab: t.id })}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition",
                tab === t.id
                  ? "bg-rose-500/15 text-rose-400"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <t.icon aria-hidden className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 pb-16 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              {tab === "dashboard" && <AdminDashboard />}
              {tab === "titles" && <AdminTitles />}
              {tab === "users" && <AdminUsers />}
              {tab === "settings" && <AdminSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
