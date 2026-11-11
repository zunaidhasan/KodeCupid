import { Link } from "react-router-dom";
import { buttonStyles } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-semibold text-coral-500">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">We couldn't find that page</h1>
      <p className="mt-2 max-w-sm text-ink-soft">The link may be old, or the page may have moved. Let's get you back on track.</p>
      <div className="mt-6 flex gap-2"><Link to="/" className={buttonStyles()}>Go home</Link><Link to="/app" className={buttonStyles({ variant: "secondary" })}>Open app</Link></div>
    </div>
  );
}
