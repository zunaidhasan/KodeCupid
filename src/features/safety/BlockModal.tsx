import { useState } from "react";
import type { MemberRecord } from "@/types";
import { safetyService } from "@/services/safetyService";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function BlockModal({ open, onClose, meId, target, onBlocked }: { open: boolean; onClose: () => void; meId: string; target: MemberRecord; onBlocked?: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const first = target.profile.displayName.split(" ")[0];
  return (
    <Modal open={open} onClose={onClose} title={`Block ${target.profile.displayName}?`} description="They won't see your profile or be able to message you, and you won't see theirs. You can unblock anytime in Safety Center."
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="accent" loading={busy} onClick={async () => { setBusy(true); await safetyService.block(meId, target.user.id); setBusy(false); toast.success(`${first} has been blocked`, "Manage blocked members in Safety Center."); onBlocked?.(); onClose(); }}>Block {first}</Button></div>}>
      <p className="text-sm text-ink-soft">Blocking is private — {first} won't be notified.</p>
    </Modal>
  );
}
