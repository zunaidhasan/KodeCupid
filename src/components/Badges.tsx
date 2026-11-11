import { BadgeCheck, CalendarCheck, CalendarClock, CalendarX, Clock, HelpCircle, ShieldAlert, Sparkles } from "lucide-react";
import type { VerificationStatus } from "@/types";
import type { ScheduleCompat } from "@/lib/schedule";
import type { MatchScoreResult } from "@/lib/matchScore";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

/** Verification is shown respectfully: members only see the status, never the documents. */
export function VerificationBadge({ status, size = "md", className }: { status: VerificationStatus; size?: "sm" | "md"; className?: string }) {
  const map: Record<VerificationStatus, { tone: BadgeProps["tone"]; label: string; icon: React.ReactNode }> = {
    verified: { tone: "brand", label: "Verified professional", icon: <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> },
    pending: { tone: "warning", label: "Verification pending", icon: <Clock className="h-3.5 w-3.5" aria-hidden /> },
    needs_info: { tone: "warning", label: "Verification in progress", icon: <Clock className="h-3.5 w-3.5" aria-hidden /> },
    denied: { tone: "danger", label: "Not verified", icon: <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> },
    unverified: { tone: "neutral", label: "Not yet verified", icon: <HelpCircle className="h-3.5 w-3.5" aria-hidden /> },
  };
  const m = map[status];
  return <Badge tone={m.tone} icon={m.icon} size={size} className={className}>{m.label}</Badge>;
}

export function ScheduleBadge({ compat, size = "md", className }: { compat: ScheduleCompat; size?: "sm" | "md"; className?: string }) {
  const map = {
    great: { tone: "success" as const, icon: <CalendarCheck className="h-3.5 w-3.5" aria-hidden />, label: "Great schedule overlap" },
    some: { tone: "warning" as const, icon: <CalendarClock className="h-3.5 w-3.5" aria-hidden />, label: "Some overlap" },
    different: { tone: "coral" as const, icon: <CalendarX className="h-3.5 w-3.5" aria-hidden />, label: "Different schedules" },
  }[compat.level];
  return <Badge tone={map.tone} icon={map.icon} size={size} title={compat.reason} className={className}>{map.label}</Badge>;
}

export function CompatPill({ score, className, dark }: { score: MatchScoreResult; className?: string; dark?: boolean }) {
  return (
    <span
      title="Prototype matching estimate"
      className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm", dark ? "bg-white/90 text-brand-800 backdrop-blur" : "bg-coral-50 text-coral-700", className)}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      {score.total}% match
    </span>
  );
}
