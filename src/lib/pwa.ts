/** Registers the offline-shell service worker (production builds served over http/https only). */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD || !window.location.protocol.startsWith("http")) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* The prototype is also served as a single HTML file; ignore registration failures. */
    });
  });
}
