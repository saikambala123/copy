"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import type { User, HealthPayload } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, ErrorState, Logo } from "@/components/app/bits";
import { CursorGlow } from "@/components/app/cursor-glow";
import { Navbar } from "@/components/app/navbar";
import { Footer } from "@/components/app/footer";
import { AuthModal } from "@/components/app/auth-modal";
import { DetailOverlay } from "@/components/app/detail-overlay";
import { BrowseView } from "@/components/app/views/browse-view";
import { CatalogView } from "@/components/app/views/catalog-view";
import { SearchView } from "@/components/app/views/search-view";
import { MyListView } from "@/components/app/views/mylist-view";
import { PlansView } from "@/components/app/views/plans-view";
import { AccountView } from "@/components/app/views/account-view";
import { WatchView } from "@/components/app/views/watch-view";
import { AdminPortal } from "@/components/app/admin/admin-portal";
import {
  ConnectDatabaseScreen,
  SetupScreen,
} from "@/components/app/views/setup-view";

/* ------------------------------------------------------------------ */
/* Full-screen loader while the health check resolves                   */
/* ------------------------------------------------------------------ */

function BootLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Logo size="lg" />
      </motion.div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="sr-only" role="status">
        Starting NOVA
      </p>
    </div>
  );
}

export function AppShell() {
  const view = useAppStore((s) => s.view);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  /* ------------------------------------------------------------------
   * Health / first-run gate — GET /api reports whether the MongoDB
   * (Atlas) connection is configured & reachable, and whether the
   * database is still empty (the "Set up NOVA" moment).
   * While gated we poll every 5s so the app opens the moment the
   * operator fixes the environment / creates the first account.
   * ---------------------------------------------------------------- */
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<HealthPayload>("/api"),
    retry: false,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      return !d.db.connected || d.needsSetup === true ? 5000 : false;
    },
  });

  /* session bootstrap — never crashes when the API is missing */
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<{ user: User | null }>("/api/auth/me");
      } catch {
        return { user: null as User | null };
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (me?.user !== undefined) setUser(me.user);
  }, [me?.user, setUser]);

  /* scroll to top on view change */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const immersive = view === "watch" || view === "admin";

  /* ------------------------------------------------------------------ */
  /* Gate screens                                                         */
  /* ------------------------------------------------------------------ */

  if (health.isLoading) return <BootLoader />;

  if (health.isError || !health.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <ErrorState
            message={
              health.error instanceof Error
                ? health.error.message
                : "Cannot reach the NOVA server."
            }
            onRetry={() => health.refetch()}
          />
        </div>
      </div>
    );
  }

  const { db, needsSetup } = health.data;

  /* database missing / unreachable → connect-database instructions */
  if (!db.connected) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <CursorGlow />
        <Navbar />
        <main className="flex flex-1 flex-col">
          <ConnectDatabaseScreen
            status={db}
            onRetry={() => health.refetch()}
            checking={health.isFetching}
          />
        </main>
        <Footer />
        <AuthModal />
      </div>
    );
  }

  /* empty database → first-run setup (first account becomes admin) */
  if (needsSetup && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <CursorGlow />
        <Navbar />
        <main className="flex flex-1 flex-col">
          <SetupScreen onSignIn={() => undefined} />
        </main>
        <Footer />
        <AuthModal />
      </div>
    );
  }

  /* normal app */
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <CursorGlow />

      {!immersive && <Navbar />}

      <AnimatePresence mode="wait">
        <motion.main
          key={view}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-1 flex-col"
        >
          {view === "browse" && <BrowseView />}
          {view === "movies" && <CatalogView type="movie" />}
          {view === "series" && <CatalogView type="series" />}
          {view === "search" && <SearchView />}
          {view === "mylist" && <MyListView />}
          {view === "plans" && <PlansView />}
          {view === "account" && <AccountView />}
          {view === "watch" && <WatchView />}
          {view === "admin" && <AdminPortal />}
        </motion.main>
      </AnimatePresence>

      {!immersive && <Footer />}

      {/* global overlays */}
      <AuthModal />
      <DetailOverlay />
    </div>
  );
}
