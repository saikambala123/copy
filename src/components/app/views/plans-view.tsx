"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import type { Plan, User } from "@/lib/types";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { EASE, ErrorState } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "What is included in a NOVA membership?",
    a: "Unlimited streaming of movies and series, with quality up to 4K HDR on supported plans. Watch on any device — phone, tablet, laptop, TV.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. NOVA is flexible — cancel your subscription online at any time from your Account page with no cancellation fees.",
  },
  {
    q: "How many devices can I stream on?",
    a: "It depends on your plan — from 1 screen on Basic up to 4 simultaneous streams on Premium 4K. Check the plan comparison above.",
  },
  {
    q: "Is there a free plan?",
    a: "The Free tier lets you browse the catalog and maintain a watchlist. Upgrade any time to unlock unlimited streaming.",
  },
];

export function PlansView() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const openAuth = useAppStore((s) => s.openAuth);
  const qc = useQueryClient();
  const [burst, setBurst] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api<{ plans: Plan[] }>("/api/plans"),
    retry: 1,
  });

  const subscribe = useMutation({
    mutationFn: (planId: string) =>
      api<{ user: User }>("/api/subscribe", { json: { planId } }),
    onSuccess: (res) => {
      setUser(res.user);
      qc.invalidateQueries();
      qc.invalidateQueries({ queryKey: ["me"] });
      const plan = data?.plans.find((p) => p.id === res.user.plan);
      toast.success(`Subscribed to ${plan?.name ?? res.user.plan}!`, {
        description: "Your 30-day all-access pass is active. Enjoy the show.",
      });
      setBurst(true);
      setTimeout(() => setBurst(false), 1600);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plans = useMemo(() => data?.plans ?? [], [data]);

  return (
    <section
      aria-label="Plans and pricing"
      className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28"
    >
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Sparkles aria-hidden className="size-3.5" />
          Membership
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Choose the plan that&apos;s{" "}
          <span className="gradient-text-rose">right for you</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          Billed monthly, cancel anytime. Downgrade or upgrade whenever you
          like — your watchlist and progress always carry over.
        </p>
      </motion.div>

      {/* cards */}
      <div className="relative mt-10">
        {burst && <ConfettiBurst />}
        {isLoading ? (
          <div className="grid gap-5 pt-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <Skeleton className="mb-4 h-5 w-24" />
                <Skeleton className="mb-6 h-10 w-28" />
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="mb-3 h-4 w-full" />
                ))}
                <Skeleton className="mt-6 h-12 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : error || !plans.length ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Plans are unavailable right now."
            }
            onRetry={refetch}
          />
        ) : (
          <div className="grid items-stretch gap-5 pt-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan, i) => {
              const isCurrent = user?.plan === plan.id;
              const highlight = plan.highlight;
              return (
                <motion.article
                  key={plan._id ?? plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  whileHover={highlight ? { scale: 1.03 } : { y: -4 }}
                  className={cn(
                    "relative flex flex-col rounded-2xl p-6",
                    highlight
                      ? "border border-transparent bg-gradient-to-b from-rose-500/15 via-card to-card md:-my-3 md:py-9 xl:z-10"
                      : "border border-white/10 bg-card"
                  )}
                >
                  {highlight && (
                    <>
                      <span className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-rose-500/40 via-rose-500/10 to-transparent p-px [mask:linear-gradient(#fff,#fff)_content-box,linear-gradient(#fff,#fff)] [mask-composite:exclude]" />
                      <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-1 text-[11px] font-black uppercase tracking-widest text-white shadow-[0_0_24px_-6px_rgba(244,63,94,0.8)]">
                        <Crown aria-hidden className="size-3" />
                        Most Popular
                      </span>
                    </>
                  )}
                  {isCurrent && (
                    <span className="absolute right-4 top-4 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Current plan
                    </span>
                  )}

                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {plan.name}
                  </h2>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black tabular-nums tracking-tight text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {plan.quality} • {plan.maxStreams}
                  </p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-start gap-2.5 text-sm text-zinc-300"
                      >
                        <Check
                          aria-hidden
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            highlight ? "text-rose-400" : "text-emerald-400"
                          )}
                        />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => {
                      if (!user) {
                        openAuth("login");
                        toast.info("Sign in to subscribe");
                        return;
                      }
                      if (isCurrent) {
                        toast.info("You're already on this plan");
                        return;
                      }
                      subscribe.mutate(plan.id);
                    }}
                    disabled={subscribe.isPending || isCurrent}
                    className={cn(
                      "mt-7 h-12 w-full rounded-full text-base font-bold",
                      highlight
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500"
                        : "border border-white/15 bg-white/5 text-foreground hover:border-rose-500/50 hover:bg-rose-500/10",
                      isCurrent && "border-emerald-500/40 text-emerald-400"
                    )}
                  >
                    {subscribe.isPending && subscribe.variables === plan.id ? (
                      <>
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                        Subscribing…
                      </>
                    ) : isCurrent ? (
                      "Active"
                    ) : highlight ? (
                      <>
                        <Zap aria-hidden className="size-4 fill-current" />
                        Go {plan.name}
                      </>
                    ) : (
                      user?.plan === "free" || !user
                        ? "Subscribe"
                        : "Switch plan"
                    )}
                  </Button>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 text-center text-2xl font-bold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="rounded-2xl border border-white/10 bg-white/[0.02] px-6"
        >
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-white/10"
            >
              <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* confetti-ish burst (CSS particles via framer motion)                */
/* ------------------------------------------------------------------ */

const BURST_COLORS = ["#f43f5e", "#fb7185", "#f59e0b", "#fbbf24", "#ffffff"];

function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 160;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 60,
          rotate: Math.random() * 540 - 270,
          scale: 0.5 + Math.random() * 0.9,
          color: BURST_COLORS[i % BURST_COLORS.length],
          round: i % 3 === 0,
        };
      }),
    []
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute block",
            p.round ? "size-2.5 rounded-full" : "h-2 w-4 rounded-sm"
          )}
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: p.scale }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 260],
            opacity: [1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
