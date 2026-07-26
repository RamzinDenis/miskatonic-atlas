import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/site";

/** Everything public is crawlable; admin routes exist only in dev builds. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
