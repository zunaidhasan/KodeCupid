import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ToastViewport, type ToastItem, type ToastTone } from "@/components/ui/Toast";
import { pushProvider } from "@/services/providers";

interface ToastApi {
  toast: (t: { title: string; description?: string; tone?: ToastTone; link?: string; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const navigate = useNavigate();

  const dismiss = useCallback((id: string) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const toast = useCallback<ToastApi["toast"]>(({ duration = 4500, tone = "info", ...rest }) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev.slice(-3), { id, tone, ...rest }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  // Mock push notifications arrive as toasts (never real OS notifications)
  useEffect(
    () => pushProvider.subscribe((p) => toast({ title: p.title, description: p.body, tone: "push", link: p.link, duration: 6000 })),
    [toast]
  );

  const api = useMemo<ToastApi>(
    () => ({ toast, success: (title, description) => toast({ title, description, tone: "success" }), error: (title, description) => toast({ title, description, tone: "error", duration: 6000 }) }),
    [toast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} onOpen={(link) => navigate(link)} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
