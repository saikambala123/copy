"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Loader2, Save } from "lucide-react";
import type { PlanId, SiteSettings } from "@/lib/types";
import { api } from "@/lib/api";
import { EASE, ErrorState } from "@/components/app/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const PLANS: { value: PlanId; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium 4K" },
];

export function AdminSettings() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api<{ settings: SiteSettings }>("/api/admin/settings"),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (error || !data?.settings) {
    return (
      <div className="max-w-2xl">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : "Settings are unavailable."
          }
          onRetry={refetch}
        />
      </div>
    );
  }

  /* keyed by dataUpdatedAt so the form remounts with fresh server state */
  return (
    <SettingsForm key={dataUpdatedAt} initial={data.settings} />
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [savedFlash, setSavedFlash] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (payload: SiteSettings) =>
      api<{ settings: SiteSettings }>("/api/admin/settings", {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved", {
        description: "Changes are live across the platform.",
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty =
    initial.siteName !== form.siteName ||
    initial.heroAutoplay !== form.heroAutoplay ||
    initial.maintenanceMode !== form.maintenanceMode ||
    initial.defaultPlan !== form.defaultPlan;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide configuration.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="space-y-6 rounded-2xl border border-white/10 bg-card p-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="settings-site-name">Site name</Label>
          <Input
            id="settings-site-name"
            value={form.siteName}
            onChange={(e) =>
              setForm((f) => ({ ...f, siteName: e.target.value }))
            }
            placeholder="NOVA"
            className="h-11 rounded-xl border-white/10 bg-white/5"
          />
          <p className="text-xs text-zinc-500">
            Shown in the browser tab and across marketing surfaces.
          </p>
        </div>

        <SettingRow
          title="Hero autoplay"
          description="Rotate the home hero carousel automatically every 6 seconds."
        >
          <Switch
            checked={form.heroAutoplay}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, heroAutoplay: v }))
            }
            aria-label="Hero autoplay"
            className="data-[state=checked]:bg-rose-500"
          />
        </SettingRow>

        <SettingRow
          title="Maintenance mode"
          description="Show a maintenance notice to all visitors except admins."
        >
          <Switch
            checked={form.maintenanceMode}
            onCheckedChange={(v) =>
              setForm((f) => ({ ...f, maintenanceMode: v }))
            }
            aria-label="Maintenance mode"
            className="data-[state=checked]:bg-amber-500"
          />
        </SettingRow>

        <div className="space-y-1.5">
          <Label htmlFor="settings-default-plan">Default plan</Label>
          <Select
            value={form.defaultPlan}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, defaultPlan: v as PlanId }))
            }
          >
            <SelectTrigger
              id="settings-default-plan"
              className="h-11 w-full rounded-xl border-white/10 bg-white/5 sm:w-56"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-popover">
              {PLANS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-500">
            Assigned to new accounts on registration.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 pt-5">
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending || !dirty}
            className="h-11 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-6 font-bold shadow-[0_0_30px_-10px_rgba(244,63,94,0.6)] hover:from-rose-400 hover:to-rose-500 disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : savedFlash ? (
              <>
                <Check aria-hidden className="size-4" />
                Saved
              </>
            ) : (
              <>
                <Save aria-hidden className="size-4" />
                Save settings
              </>
            )}
          </Button>
          {dirty && !savedFlash && (
            <p className="text-xs font-medium text-amber-400">
              Unsaved changes
            </p>
          )}
          {savedFlash && (
            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-400"
            >
              <Check aria-hidden className="size-3.5" />
              All changes saved
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
