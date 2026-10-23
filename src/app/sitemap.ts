import type { MetadataRoute } from "next";
import { BLOG_SITE_URL, blogPosts } from "@/data/blog";
import { routePages } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = blogPosts.map((p) => p.dateModified).sort().at(-1);

  return [
    { url: BLOG_SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...Object.keys(routePages).map((slug) => ({
      url: `${BLOG_SITE_URL}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BLOG_SITE_URL}/blog`,
      lastModified: latestPost,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts.map((post) => ({
      url: `${BLOG_SITE_URL}/blog/${post.slug}`,
      lastModified: post.dateModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
