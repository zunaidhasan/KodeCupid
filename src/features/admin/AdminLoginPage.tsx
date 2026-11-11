import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { ADMIN_EMAIL, ADMIN_PASSWORD, authService } from "@/services/authService";

export function AdminLoginPage() {
  useDocumentTitle("Admin sign in");
  const { isAdmin } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Enter your email and password."); return; }
    setBusy(true); setError("");
    try { await authService.adminLogin(email, password); navigate("/admin"); } catch (err) { setError((err as Error).message); setBusy(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Admin console</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to review verifications, reports and account requests.</p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
          <Button type="submit" full size="lg" loading={busy}>Sign in</Button>
        </form>
        <div role="note" className="mt-6 flex gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50 p-4 text-sm text-teal-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div><p className="font-semibold">Mock login · prototype</p><p>Email <code className="font-bold">{ADMIN_EMAIL}</code><br />Password <code className="font-bold">{ADMIN_PASSWORD}</code></p><button type="button" className="mt-2 font-semibold underline" onClick={() => { setEmail(ADMIN_EMAIL); setPassword(ADMIN_PASSWORD); }}>Fill in demo credentials</button></div>
        </div>
        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-brand-700 hover:underline">← Back to site</Link>
      </div>
    </div>
  );
}
