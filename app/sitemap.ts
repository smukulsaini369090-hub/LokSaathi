import type { MetadataRoute } from "next";
import { loadAllSchemes } from "@/lib/schemes-loader";

const BASE_URL = "https://lok-saathi.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/schemes`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/document`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/saved`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/help`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const schemes = loadAllSchemes();
  const schemeRoutes: MetadataRoute.Sitemap = schemes.map((scheme) => ({
    url: `${BASE_URL}/schemes/${scheme.id}`,
    lastModified: scheme.last_verified ? new Date(scheme.last_verified) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...schemeRoutes];
}
