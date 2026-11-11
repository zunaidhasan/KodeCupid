import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { AppSettings, Db, MemberRecord, Session, Wallet } from "@/types";
import { getEntitlements, type Entitlements } from "@/lib/entitlements";
import { useDb, useNow } from "@/hooks";
import { settingsFor, walletFor } from "@/services/db";
import { getMe } from "@/services/selectors";
import { dateService } from "@/services/dateService";
import { consultService } from "@/services/consultService";

interface AppValue {
  db: Db;
  session: Session;
  /** The signed-in member (undefined for guests / mid-onboarding) */
  me?: MemberRecord;
  isMember: boolean;
  isAdmin: boolean;
  entitlements: Entitlements;
  settings: AppSettings;
  wallet: Wallet;
  unreadCount: number;
}

const AppContext = createContext<AppValue | null>(null);

/** Single place where UI reads session + derived state. Swap `useDb` for your auth/query hooks in production. */
export function AppProvider({ children }: { children: ReactNode }) {
  const d = useDb();
  const now = useNow(30_000);
  useEffect(() => {
    dateService.resolveStale();
    consultService.resolveStale();
  }, []);

  const value = useMemo<AppValue>(() => {
    const me = getMe(d);
    const uid = me?.user.id ?? null;
    return {
      db: d,
      session: d.session,
      me,
      isMember: !!me,
      isAdmin: !!d.session.adminEmail,
      entitlements: getEntitlements(me?.user ?? { plan: "free" }, now),
      settings: settingsFor(d, uid),
      wallet: walletFor(d, uid),
      unreadCount: uid ? d.notifications.filter((n) => n.userId === uid && !n.read && !n.held).length : 0,
    };
  }, [d, now]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/** For screens that only render for signed-in members. */
export function useMe(): MemberRecord {
  const { me } = useApp();
  if (!me) throw new Error("useMe requires a signed-in member");
  return me;
}
