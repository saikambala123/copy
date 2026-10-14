import { create } from "zustand";
import type { User } from "@/lib/types";

export type View =
  | "browse"
  | "movies"
  | "series"
  | "search"
  | "mylist"
  | "plans"
  | "account"
  | "watch"
  | "admin";

export type AdminTab = "dashboard" | "titles" | "plans" | "users" | "settings";

export interface ViewParams {
  titleId?: string;
  adminTab?: AdminTab;
  query?: string;
  genre?: string;
}

export type AuthMode = "login" | "register";

interface AppState {
  view: View;
  previousView: View;
  viewParams: ViewParams;
  user: User | null;
  authOpen: boolean;
  authMode: AuthMode;
  /** title id for the full-screen detail dialog (works on every view) */
  detailId: string | null;
  setView: (view: View, params?: ViewParams) => void;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  setAuthMode: (mode: AuthMode) => void;
  setUser: (user: User | null) => void;
  openDetail: (titleId: string) => void;
  closeDetail: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "browse",
  previousView: "browse",
  viewParams: {},
  user: null,
  authOpen: false,
  authMode: "login",
  detailId: null,
  setView: (view, params = {}) =>
    set((state) => ({
      view,
      viewParams: params,
      previousView: state.view,
      detailId: null,
    })),
  openAuth: (mode = "login") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setUser: (user) => set({ user }),
  openDetail: (titleId) => set({ detailId: titleId }),
  closeDetail: () => set({ detailId: null }),
}));
