import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import type { Conversation, MemberRecord } from "@/types";
import { matchService } from "@/services/matchService";
import { useToast } from "@/context/ToastContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UpgradePrompt } from "@/features/billing/UpgradePrompt";
import { ScheduleBadge } from "@/components/Badges";
import { scheduleCompatibility } from "@/lib/schedule";
import { matchScore } from "@/lib/matchScore";
import { SUPER_LIKE_COINS } from "@/data/catalog";

type Kind = "like" | "pass" | "super";

/** Shared like / pass / super-like logic + the "It's a Match!" and free-limit dialogs. */
export function useDecision(me: MemberRecord) {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<{ conv: Conversation; other: MemberRecord } | null>(null);
  const [limit, setLimit] = useState(false);
  const [superUpsell, setSuperUpsell] = useState(false);

  /** Returns true when the decision was applied (so the UI can advance). */
  const decide = async (kind: Kind, other: MemberRecord): Promise<boolean> => {
    if (busy) return false;
    setBusy(true);
    try {
      if (kind === "pass") { await matchService.pass(me.user.id, other.user.id); return true; }
      const res = await matchService.like(me.user.id, other.user.id, kind === "super" ? "super" : "like");
      if (res.status === "matched") { setMatch({ conv: res.conversation, other: res.other }); return true; }
      if (res.status === "limit") { setLimit(true); return true; }
      if (res.status === "no_credits") { setSuperUpsell(true); return false; }
      toast.success(kind === "super" ? "Super Like sent ⭐" : `You liked ${other.profile.displayName.split(" ")[0]}`, "We'll let you know if it's mutual.");
      return true;
    } catch (e) { toast.error("Couldn't save that", (e as Error).message); return false; }
    finally { setBusy(false); }
  };

  const dialogs: ReactNode = (
    <>
      <Modal open={!!match} onClose={() => setMatch(null)} title="It's a Match!" hideTitle size="sm">
        {match && (
          <div className="text-center">
            <p className="text-5xl" aria-hidden>🎉</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-coral-600">It's a Match!</h2>
            <p className="mt-1 text-sm text-ink-soft">You and {match.other.profile.displayName} liked each other.</p>
            <div className="my-6 flex items-center justify-center -space-x-4">
              <Avatar src={me.profile.photos[0]?.url} name={me.profile.displayName} size="xl" ring />
              <Avatar src={match.other.profile.photos[0]?.url} name={match.other.profile.displayName} size="xl" ring />
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-coral-50 px-3 py-1 text-sm font-bold text-coral-700">{matchScore(me, match.other).total}% match</span>
              <ScheduleBadge compat={scheduleCompatibility(me.professional, match.other.professional)} />
            </div>
            <div className="flex flex-col gap-2">
              <Button size="lg" variant="accent" onClick={() => { const id = match.conv.id; setMatch(null); navigate(`/app/chat/${id}`); }}>Send a message</Button>
              <Button variant="ghost" onClick={() => setMatch(null)}>Keep browsing</Button>
            </div>
            <p className="mt-4 text-[11px] text-ink-mute">Match percentage is a prototype estimate.</p>
          </div>
        )}
      </Modal>
      <Modal open={limit} onClose={() => setLimit(false)} title="Weekly match limit reached">
        <UpgradePrompt compact title="That could have been a match!" description="Free members can receive up to one match per week. Upgrade to Silver or Premium (or grab a day pass) to match without limits." />
      </Modal>
      <Modal open={superUpsell} onClose={() => setSuperUpsell(false)} title="Super Likes are a Premium perk" description={`Premium members get Super Likes. Each extra one costs ${SUPER_LIKE_COINS} coins.`}>
        <div className="flex flex-col gap-2"><Link to="/app/subscription" onClick={() => setSuperUpsell(false)} className={buttonStyles({ variant: "accent" })}>See Premium</Link><Link to="/app/coins" onClick={() => setSuperUpsell(false)} className={buttonStyles({ variant: "secondary" })}>Get coins</Link></div>
      </Modal>
    </>
  );

  return { decide, busy, dialogs };
}
