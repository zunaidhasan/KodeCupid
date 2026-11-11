import { useDocumentTitle } from "@/hooks";
import { useMe } from "@/context/AppContext";
import { memberService } from "@/services/memberService";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";
import { PrivacyFields } from "./PrivacyFields";
import { WorkplacePrivacyEditor } from "./WorkplacePrivacyEditor";

/** Workplace privacy (mock geofence) + per-field visibility. Saves automatically. */
export function PrivacyPage() {
  useDocumentTitle("Privacy");
  const me = useMe();
  const p = me.profile;
  return (
    <Page>
      <PageHeader title="Privacy" subtitle="Decide who sees what. Changes save automatically." back="/app/me" />
      <div className="space-y-6">
        <Card>
          <SectionHeading title="Workplace privacy" description="Hide your profile near your workplace" />
          <WorkplacePrivacyEditor value={p.workplacePrivacy} workplaceFacilityId={me.professional.facilityId} selfId={me.user.id} onChange={(v) => memberService.update(me.user.id, (m) => { m.profile.workplacePrivacy = v; })} />
        </Card>
        <Card>
          <SectionHeading title="Profile visibility" description="Sensitive fields are always your choice" />
          <PrivacyFields value={p.privacy} onChange={(v) => memberService.update(me.user.id, (m) => { m.profile.privacy = v; })} />
        </Card>
        <p className="text-center text-xs text-ink-mute">Verification documents are only visible to KodeCupid moderators — never to other members.</p>
      </div>
    </Page>
  );
}
