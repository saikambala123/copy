"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, ShieldCheck } from "lucide-react";
import type { User } from "@/lib/types";
import { api } from "@/lib/api";
import {
  EASE,
  ErrorState,
  formatDate,
  GradientAvatar,
  PlanBadge,
} from "@/components/app/bits";
import { TableSkeleton } from "@/components/app/skeletons";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [confirmBan, setConfirmBan] = useState<User | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "users", q],
    queryFn: () =>
      api<{ users: User[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`),
    retry: 1,
  });

  const patchUser = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { role?: "user" | "admin"; banned?: boolean };
    }) => api<{ user: User }>(`/api/admin/users/${id}`, { method: "PATCH", json: payload }),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("User updated", {
        description:
          vars.payload.banned !== undefined
            ? res.user.banned
              ? `${res.user.name} is now banned.`
              : `${res.user.name} has been reinstated.`
            : `${res.user.name} is now ${res.user.role}.`,
      });
      setConfirmBan(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${users.length} registered users`}
        </p>
      </div>

      {/* search */}
      <div className="glass flex h-11 max-w-md items-center gap-2.5 rounded-full px-4">
        <Search aria-hidden className="size-4 shrink-0 text-zinc-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          aria-label="Search users"
          className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-zinc-500 focus:outline-none"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={7} cols={5} />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Users unavailable."}
          onRetry={refetch}
        />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            No users match your search
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="overflow-x-auto rounded-2xl border border-white/10 bg-card"
        >
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th scope="col" className="p-4 font-semibold">User</th>
                <th scope="col" className="p-4 font-semibold">Role</th>
                <th scope="col" className="p-4 font-semibold">Plan</th>
                <th scope="col" className="p-4 font-semibold">Joined</th>
                <th scope="col" className="p-4 font-semibold">Banned</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className={cn(
                    "border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]",
                    u.banned && "opacity-60"
                  )}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <GradientAvatar
                        name={u.name}
                        gradient={u.avatar}
                        className="size-10 text-xs"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-semibold text-foreground">
                          {u.name}
                          {u.role === "admin" && (
                            <ShieldCheck
                              aria-label="Admin"
                              className="size-3.5 shrink-0 text-amber-400"
                            />
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        patchUser.mutate({
                          id: u._id,
                          payload: { role: v as "user" | "admin" },
                        })
                      }
                    >
                      <SelectTrigger
                        aria-label={`Role for ${u.name}`}
                        className="h-9 w-28 rounded-full border-white/10 bg-white/5 text-xs capitalize"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-popover">
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td className="p-4 text-xs text-muted-foreground" suppressHydrationWarning>
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.banned}
                        onCheckedChange={(checked) => {
                          if (checked) setConfirmBan(u);
                          else
                            patchUser.mutate({
                              id: u._id,
                              payload: { banned: false },
                            });
                        }}
                        aria-label={`Ban ${u.name}`}
                        className="data-[state=checked]:bg-rose-600"
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          u.banned ? "text-rose-400" : "text-zinc-500"
                        )}
                      >
                        {u.banned ? "Banned" : "Active"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* ban confirm */}
      <AlertDialog
        open={!!confirmBan}
        onOpenChange={(o) => {
          if (!o) setConfirmBan(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {confirmBan?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be blocked from signing in until reinstated. Their
              watchlist and progress are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmBan &&
                patchUser.mutate({
                  id: confirmBan._id,
                  payload: { banned: true },
                })
              }
              className="rounded-full bg-rose-600 hover:bg-rose-500"
            >
              Ban user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
