import { Component, type ErrorInfo, type ReactNode } from "react";
import { authService } from "@/services/authService";

interface State { error: Error | null }

/** Last-resort guard so one broken screen never leaves a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("KodeCupid UI error", error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="text-5xl" aria-hidden>🩹</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">We hit an unexpected snag. Try reloading — or reset the prototype data if the problem keeps happening.</p>
        <div className="mt-6 flex gap-2">
          <button className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white" onClick={() => { window.location.hash = "#/"; window.location.reload(); }}>Reload</button>
          <button className="rounded-full border border-cream-200 bg-white px-5 py-2.5 text-sm font-semibold" onClick={() => { authService.resetPrototype(); window.location.hash = "#/"; window.location.reload(); }}>Reset data</button>
        </div>
      </div>
    );
  }
}
