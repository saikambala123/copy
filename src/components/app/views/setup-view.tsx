"use client";

// ============================================================
// NOVA — first-run gate screens
//   mode="setup" — database is connected but has zero users:
//                  "Set up NOVA" (first account becomes admin)
//   mode="db"    — MONGODB_URI missing or unreachable:
//                  "Connect your database" (Atlas instructions)
// Rendered by AppShell instead of the normal views.
// ============================================================

import { motion } from "framer-motion";
import {
  Check,
  Database,
  Loader2,
  RefreshCw,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react";
import type { HealthPayload } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { EASE, Logo } from "@/components/app/bits";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Shared cinematic backdrop                                            */
/* ------------------------------------------------------------------ */

function Backdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-rose-600/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-[8%] size-72 rounded-full bg-amber-500/10 blur-[100px]"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* "Set up NOVA" — first-run wizard entry point                         */
/* ------------------------------------------------------------------ */

export function SetupScreen({ onSignIn }: { onSignIn?: () => void }) {
  const openAuth = useAppStore((s) => s.openAuth);

  return (
    <section
      aria-label="Set up NOVA"
      className="relative flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-16"
    >
      <Backdrop />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="glass relative w-full max-w-xl overflow-hidden rounded-3xl p-8 text-center md:p-12"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_0_60px_-12px_rgba(244,63,94,0.8)]"
        >
          <Rocket aria-hidden className="size-9" />
        </motion.div>

        <div className="mt-6 flex items-center justify-center gap-2.5">
          <Logo size="sm" />
          <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-400">
            First run
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Welcome to <span className="gradient-text-rose">NOVA</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          Your streaming platform is connected to its database and ready to go.
          Create the first account — it becomes the{" "}
          <strong className="font-semibold text-foreground">
            owner &amp; administrator
          </strong>
          .
        </p>

        <ul className="mx-auto mt-7 max-w-sm space-y-3 text-left">
          {[
            "First account is granted full admin access",
            "Default plans & settings are created automatically",
            "Add movies and series from the Admin Portal",
          ].map((f, i) => (
            <motion.li
              key={f}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.12, duration: 0.4, ease: EASE }}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-300"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
                <Check aria-hidden className="size-3" />
              </span>
              {f}
            </motion.li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => openAuth("register")}
            className="h-13 w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-8 text-base font-bold shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500 active:scale-[0.98] sm:w-auto"
          >
            <Sparkles aria-hidden className="size-4" />
            Set up NOVA
          </Button>
          {onSignIn && (
            <Button
              variant="ghost"
              onClick={onSignIn}
              className="h-13 w-full rounded-full text-zinc-300 hover:bg-white/10 hover:text-white sm:w-auto"
            >
              I already have an account
            </Button>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <Shield aria-hidden className="size-3.5" />
          NOVA ships with an empty database — no demo content, ever.
        </p>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* "Connect your database" — MONGODB_URI missing / unreachable          */
/* ------------------------------------------------------------------ */

const ENV_SNIPPET = `MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net"
MONGODB_DB="nova"
NOVA_SECRET="<long-random-secret>"`;

export function ConnectDatabaseScreen({
  status,
  onRetry,
  checking,
}: {
  status: HealthPayload["db"];
  onRetry: () => void;
  checking: boolean;
}) {
  return (
    <section
      aria-label="Connect your database"
      className="relative flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-16"
    >
      <Backdrop />
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="glass relative w-full max-w-2xl overflow-hidden rounded-3xl p-8 md:p-10"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_0_40px_-10px_rgba(245,158,11,0.7)]"
          >
            <Database aria-hidden className="size-8" />
          </motion.div>
          <div>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
              Configuration needed
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
              Connect your database
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              NOVA stores every title, account and analytic in your own
              MongoDB. Point it at a{" "}
              <strong className="font-semibold text-foreground">
                MongoDB Atlas
              </strong>{" "}
              cluster (or any MongoDB URI) to bring the platform to life.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Environment variables
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-[12px] leading-relaxed text-zinc-300">
            <code>{ENV_SNIPPET}</code>
          </pre>
          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-zinc-400">
            <li>
              • Local development — put these in a{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-zinc-200">.env</code>{" "}
              file at the project root (see{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-zinc-200">.env.example</code>
              ).
            </li>
            <li>
              • Vercel — Project → Settings → Environment Variables, then
              redeploy.
            </li>
            <li>
              • Atlas tip — allow access from <code>0.0.0.0/0</code> (or your
              deployment IPs) in the cluster&apos;s Network Access list.
            </li>
          </ul>
        </div>

        {status.error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium leading-relaxed text-rose-300"
          >
            {status.error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            {checking ? (
              <>
                <Loader2 aria-hidden className="size-3.5 animate-spin text-rose-400" />
                Checking the database automatically…
              </>
            ) : (
              <>
                <Database aria-hidden className="size-3.5" />
                {status.configured
                  ? `Waiting for ${status.dbName ?? "the database"} to answer`
                  : "Waiting for MONGODB_URI"}
              </>
            )}
          </p>
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={checking}
            className="h-10 rounded-full border-white/15 bg-white/5 hover:border-rose-500/50 hover:bg-rose-500/10"
          >
            <RefreshCw aria-hidden className={checking ? "size-4 animate-spin" : "size-4"} />
            Retry now
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
