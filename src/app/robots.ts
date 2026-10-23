import type { MetadataRoute } from "next";
import { BLOG_SITE_URL } from "@/data/blog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${BLOG_SITE_URL}/sitemap.xml`,
  };
}
