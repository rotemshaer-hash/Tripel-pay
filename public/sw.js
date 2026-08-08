// Minimal service worker — exists only to satisfy Chrome's PWA installability
// requirement (a registered SW with a fetch handler). It does no caching, so
// it never risks serving stale data for the Firebase-backed screens.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
