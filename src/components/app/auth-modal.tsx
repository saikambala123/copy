"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Play,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  DEMO_ACCOUNTS,
  EASE,
  Logo,
} from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  email: string;
  password: string;
}

const EMPTY: FormState = { name: "", email: "", password: "" };

export function AuthModal() {
  const open = useAppStore((s) => s.authOpen);
  const mode = useAppStore((s) => s.authMode);
  const setAuthMode = useAppStore((s) => s.setAuthMode);
  const closeAuth = useAppStore((s) => s.closeAuth);
  const setUser = useAppStore((s) => s.setUser);
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [serverError, setServerError] = useState("");

  /* reset transient state when the modal opens / mode switches (render-time) */
  const sessionKey = `${open}-${mode}`;
  const [prevSessionKey, setPrevSessionKey] = useState(sessionKey);
  if (sessionKey !== prevSessionKey) {
    setPrevSessionKey(sessionKey);
    setErrors({});
    setServerError("");
  }

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
    setServerError("");
  };

  const validate = (): boolean => {
    const er: Partial<FormState> = {};
    if (mode === "register" && form.name.trim().length < 2)
      er.name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      er.email = "Please enter a valid email address.";
    if (form.password.length < 6)
      er.password = "Password must be at least 6 characters.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "login") {
        return api<{ user: User }>("/api/auth/login", {
          json: { email: form.email.trim(), password: form.password },
        });
      }
      return api<{ user: User }>("/api/auth/register", {
        json: {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        },
      });
    },
    onSuccess: (res) => {
      setUser(res.user);
      closeAuth();
      setForm(EMPTY);
      qc.invalidateQueries();
      toast.success(
        mode === "login"
          ? `Welcome back, ${res.user.name}`
          : `Welcome to NOVA, ${res.user.name}`,
        {
          description:
            res.user.role === "admin"
              ? "You have admin access — check the Admin Portal."
              : "Your personalized streaming experience awaits.",
        }
      );
    },
    onError: (e: Error) => setServerError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const quickFill = (kind: keyof typeof DEMO_ACCOUNTS) => {
    const acc = DEMO_ACCOUNTS[kind];
    setForm({ name: "", email: acc.email, password: acc.password });
    setErrors({});
    setServerError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeAuth();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[900px] gap-0 overflow-hidden rounded-2xl border-white/10 bg-card p-0 sm:max-w-[900px]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{mode === "login" ? "Sign in to NOVA" : "Create your NOVA account"}</DialogTitle>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="grid min-h-[540px] md:grid-cols-[42%_58%]"
        >
          {/* brand panel */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-rose-700 via-rose-600 to-rose-900 p-8 md:flex">
            <motion.div
              aria-hidden
              className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-24 -left-16 size-72 rounded-full bg-amber-500/20 blur-3xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 7, repeat: Infinity }}
            />
            <div className="relative">
              <Logo size="lg" className="text-white" />
              <p className="mt-10 text-3xl font-black leading-tight tracking-tight text-white">
                Stream
                <br />
                Beyond
                <br />
                Limits.
              </p>
              <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-rose-100/80">
                Award-winning films, bingeable series and 4K quality — all in
                one cinematic home.
              </p>
            </div>
            <ul className="relative space-y-3 text-sm text-rose-50">
              {[
                "Thousands of titles in 4K HDR",
                "Watch on any device, anytime",
                "New episodes every week",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="flex size-6 items-center justify-center rounded-full bg-white/15">
                    <Sparkles aria-hidden className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* form panel */}
          <div className="relative p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-between md:hidden">
              <Logo />
            </div>

            {/* login / register toggle */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="relative mb-7 grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1"
            >
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setAuthMode(m)}
                  className={cn(
                    "relative z-10 h-11 rounded-full text-sm font-semibold transition-colors",
                    mode === m ? "text-white" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-mode-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_24px_-8px_rgba(244,63,94,0.8)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -28 : 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 28 : -28 }}
                transition={{ duration: 0.32, ease: EASE }}
              >
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  {mode === "login"
                    ? "Welcome back"
                    : "Join NOVA today"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login"
                    ? "Sign in to continue watching."
                    : "Create an account to start streaming instantly."}
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                  {mode === "register" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="auth-name">Full name</Label>
                      <div className="relative">
                        <UserIcon
                          aria-hidden
                          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                        />
                        <Input
                          id="auth-name"
                          autoComplete="name"
                          placeholder="Ada Lovelace"
                          value={form.name}
                          onChange={set("name")}
                          aria-invalid={!!errors.name}
                          className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-base"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-rose-400">{errors.name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email">Email</Label>
                    <div className="relative">
                      <Mail
                        aria-hidden
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set("email")}
                        aria-invalid={!!errors.email}
                        className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-base"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-400">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-password">Password</Label>
                    <div className="relative">
                      <Lock
                        aria-hidden
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                      />
                      <Input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder="••••••••"
                        value={form.password}
                        onChange={set("password")}
                        aria-invalid={!!errors.password}
                        className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 pr-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden className="size-4" />
                        ) : (
                          <Eye aria-hidden className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-400">{errors.password}</p>
                    )}
                  </div>

                  {serverError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      role="alert"
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300"
                    >
                      {serverError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-base font-bold shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500 active:scale-[0.98]"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                        {mode === "login" ? "Signing in…" : "Creating account…"}
                      </>
                    ) : (
                      <>
                        <Play aria-hidden className="size-4 fill-current" />
                        {mode === "login" ? "Sign In" : "Start Streaming"}
                      </>
                    )}
                  </Button>
                </form>

                {/* demo quick-fill */}
                <div className="mt-6">
                  <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    Just exploring? Try a demo account
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => quickFill("demo")}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-rose-500/50 hover:text-white"
                    >
                      Try demo
                    </button>
                    <button
                      type="button"
                      onClick={() => quickFill("admin")}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-amber-500/50 hover:text-amber-300"
                    >
                      Try admin
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-500">
                  By continuing you agree to NOVA&apos;s Terms of Use and
                  acknowledge the Privacy Policy. This is a demo — demo@nova.stream
                  / Demo@123.
                </p>
              </motion.div>
            </AnimatePresence>

            {/* close */}
            <button
              type="button"
              onClick={closeAuth}
              aria-label="Close dialog"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
