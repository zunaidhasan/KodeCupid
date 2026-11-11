import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/context/ToastContext";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { MemberLayout } from "@/app/layouts/MemberLayout";
import { AdminLayout } from "@/app/layouts/AdminLayout";
import { LandingPage } from "@/features/landing/LandingPage";
import { PricingPage } from "@/features/billing/PricingPage";
import { ContentPage } from "@/features/content/ContentPage";
import { NotFoundPage } from "@/features/content/NotFoundPage";
import { AccountClosurePage } from "@/features/account/AccountClosurePage";
import { SignupPage } from "@/features/auth/SignupPage";
import { OnboardingPage } from "@/features/onboarding/OnboardingPage";
import { DiscoverPage } from "@/features/discovery/DiscoverPage";
import { ProfileDetailPage } from "@/features/profile/ProfileDetailPage";
import { MePage } from "@/features/profile/MePage";
import { EditProfilePage } from "@/features/profile/EditProfilePage";
import { VerifyPage } from "@/features/profile/VerifyPage";
import { MatchesPage } from "@/features/messaging/MatchesPage";
import { ChatPage } from "@/features/messaging/ChatPage";
import { DatesPage } from "@/features/schedule/DatesPage";
import { SchedulePage } from "@/features/schedule/SchedulePage";
import { PrivacyPage } from "@/features/privacy/PrivacyPage";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { NotificationSettingsPage } from "@/features/notifications/NotificationSettingsPage";
import { ConsultPage } from "@/features/consult/ConsultPage";
import { SafetyPage } from "@/features/safety/SafetyPage";
import { SubscriptionPage } from "@/features/billing/SubscriptionPage";
import { CheckoutPage, PaymentFailedPage, PaymentSuccessPage } from "@/features/billing/CheckoutPages";
import { CoinsPage } from "@/features/billing/CoinsPage";
import { AdminLoginPage } from "@/features/admin/AdminLoginPage";
import { DashboardPage } from "@/features/admin/DashboardPage";
import { UsersPage } from "@/features/admin/UsersPage";
import { VerificationsPage } from "@/features/admin/VerificationsPage";
import { ReportsPage } from "@/features/admin/ReportsPage";
import { DeletionsPage } from "@/features/admin/DeletionsPage";
import { BillingPage } from "@/features/admin/BillingPage";
import { ContentAdminPage } from "@/features/admin/ContentAdminPage";

/**
 * Route map. HashRouter is used so the prototype works when served as a single static file
 * (e.g. the inlined dist/index.html). PRODUCTION: switch to BrowserRouter + SPA fallback rewrites.
 */
export default function App() {
  return (
    <ErrorBoundary>
    <HashRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            {/* Public / guest */}
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="terms" element={<ContentPage slug="terms" />} />
              <Route path="privacy-policy" element={<ContentPage slug="privacy-policy" />} />
              <Route path="faqs" element={<ContentPage slug="faqs" />} />
              <Route path="community-pledge" element={<ContentPage slug="community-pledge" />} />
              <Route path="safety-tips" element={<ContentPage slug="safety-tips" />} />
              <Route path="contact" element={<ContentPage slug="contact" />} />
              <Route path="account-closure" element={<AccountClosurePage />} />
              <Route path="data-deletion" element={<Navigate to="/account-closure" replace />} />
            </Route>

            {/* Auth + onboarding */}
            <Route path="signup" element={<SignupPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />

            {/* Member app */}
            <Route path="app" element={<MemberLayout />}>
              <Route index element={<DiscoverPage />} />
              <Route path="profile/:id" element={<ProfileDetailPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="chat/:id" element={<ChatPage />} />
              <Route path="dates" element={<DatesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings/notifications" element={<NotificationSettingsPage />} />
              <Route path="me" element={<MePage />} />
              <Route path="me/edit" element={<EditProfilePage />} />
              <Route path="me/verify" element={<VerifyPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="consult" element={<ConsultPage />} />
              <Route path="safety" element={<SafetyPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="payment/success" element={<PaymentSuccessPage />} />
              <Route path="payment/failed" element={<PaymentFailedPage />} />
              <Route path="coins" element={<CoinsPage />} />
            </Route>

            {/* Admin console */}
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="verifications" element={<VerificationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="deletions" element={<DeletionsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="content" element={<ContentAdminPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AppProvider>
    </HashRouter>
    </ErrorBoundary>
  );
}
