import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: any;

// Additional routes to precache for 100% offline access
const extraPrecacheEntries: (PrecacheEntry | string)[] = [
  { url: "/help", revision: "1" },
  { url: "/offline", revision: "1" },
];

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST || []), ...extraPrecacheEntries],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname === "/help",
      handler: new NetworkFirst({
        cacheName: "help-page-cache",
        networkTimeoutSeconds: 3,
      }),
    },
    {
      matcher: ({ url }) => url.pathname === "/api/schemes",
      handler: new NetworkFirst({
        cacheName: "schemes-catalog-cache",
        networkTimeoutSeconds: 3,
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
