import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/blog/AdSlot";
import { TravelOrbit } from "@/components/blog/TravelOrbit";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { BLOG_SITE_URL, blogPosts } from "@/data/blog";

const title = "The Cart & Go Journal: Visa, Study & Travel Guides";
const description =
  "Verified visa guides, study routes and destination playbooks for Nigerian travellers, reviewed by the Cart & Go visa team before they publish.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title,
    description,
    url: `${BLOG_SITE_URL}/blog`,
    type: "website",
    images: [{ url: "/assets/hero-travel.jpg", width: 1280, height: 960, alt: "Cart & Go Journal" }],
  },
};

export default function BlogPage() {
  const cards = [...blogPosts]
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
    .map(({ slug, category, title, excerpt, image, imageAlt, datePublished, readMinutes }) => ({
      slug,
      category,
      title,
      excerpt,
      image,
      imageAlt,
      datePublished,
      readMinutes,
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Cart & Go Journal",
    url: `${BLOG_SITE_URL}/blog`,
    description,
    publisher: { "@type": "Organization", name: "Cart & Go Travels", url: BLOG_SITE_URL },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${BLOG_SITE_URL}/blog/${post.slug}`,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-7xl px-5 pb-6 pt-14 lg:px-8 lg:pt-20">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <h1 className="font-[family-name:var(--font-fraunces)]! text-3xl font-normal leading-[1.1] tracking-tight text-[#111] md:text-5xl">
            Visa, Study &amp; Travel Insights
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-[20px] leading-7 text-[#07141a]/65">
            Not rumours, not guesswork. Straight talk from the team that checks documents, files visas and
            gets people moving.
          </p>
        </header>

        <AdSlot placement="top" className="mt-0" />
        <BlogIndex posts={cards} />
      </div>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-16 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[#1c1c1c] text-white">
          <TravelOrbit className="pointer-events-none absolute z-0 left-1/2 top-[40%] hidden -translate-x-1/2 -translate-y-1/2 scale-[1.4] opacity-40 lg:block" />

          <div className="relative z-10 px-7 pb-8 pt-16 text-center md:px-12 md:pt-20">
            <p className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wide">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#ff3b30]" />
              Documents → Approval
            </p>
            <h2 className="mx-auto mt-6 max-w-xl font-[family-name:var(--font-fraunces)]! text-4xl font-normal leading-[1.08] tracking-tight text-white md:text-6xl">
              Got a trip or visa you want to make happen?
            </h2>
            <Link
              href="/contact"
              className="mt-10 inline-flex rounded-full bg-white px-7 py-3.5 text-[15px] font-medium text-[#111] shadow-[0_0_28px_rgba(255,255,255,.25)] transition hover:scale-[1.03]"
            >
              Book a consultation
            </Link>

            <div className="mt-14 border-t border-white/10 pt-7 md:mt-20">
              <ul className="flex flex-wrap justify-between gap-x-8 gap-y-3 font-mono text-[13px] uppercase tracking-wide text-white/65">
                <li>
                  <a href="https://wa.me/2348073231272" className="hover:text-white">
                    WhatsApp (NG)
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/13474200238" className="hover:text-white">
                    WhatsApp (US)
                  </a>
                </li>
                <li>
                  <a href="mailto:visaofficer@cartandgotravels.com" className="hover:text-white">
                    Email
                  </a>
                </li>
                <li>
                  <Link href="/ai-consular-check" className="inline-block py-1 hover:text-white">
                    Consular Check
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
