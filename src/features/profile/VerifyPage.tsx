import { useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks";
import { memberService } from "@/services/memberService";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { VerificationPanel } from "@/features/onboarding/VerificationPanel";

export function VerifyPage() {
  useDocumentTitle("Verification");
  const me = useMe();
  const toast = useToast();
  const v = me.verification;
  return (
    <Page>
      <PageHeader title="Get verified" subtitle="Verification keeps KodeCupid a community of real professionals." back="/app/me" />
      <Card>
        <VerificationPanel status={v.status} method={v.method} history={v.history} reviewerNote={v.reviewerNote}
          onSubmit={async (s) => { await memberService.submitVerification(me.user.id, s); toast.success("Submitted for review", "Status: pending review"); }}
          onDemoSkip={async () => { await memberService.submitVerification(me.user.id, { method: "demo" }); toast.success("Marked verified (demo)"); }} />
      </Card>
    </Page>
  );
}
