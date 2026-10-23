import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/blog/AdSlot";
import { RichText } from "@/components/blog/RichText";
import {
  BLOG_SITE_URL,
  blogPosts,
  formatPostDate,
  getPost,
  postUrl,
} from "@/data/blog";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.metaDescription,
      url: postUrl(post.slug),
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: ["Cart & Go Editorial Team"],
      section: post.category,
      images: [{ url: post.image, alt: post.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = postUrl(post.slug);
  const related = post.related.map((s) => getPost(s)).filter((p) => p !== undefined);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      mainEntityOfPage: url,
      image: `${BLOG_SITE_URL}${post.image}`,
      author: { "@type": "Organization", name: "Cart & Go Travels Editorial Team" },
      publisher: {
        "@type": "Organization",
        name: "Cart & Go Travels",
        url: BLOG_SITE_URL,
        logo: { "@type": "ImageObject", url: `${BLOG_SITE_URL}/assets/logo.jpg` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        ["Home", BLOG_SITE_URL],
        ["Blog", `${BLOG_SITE_URL}/blog`],
        [post.title, url],
      ].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_300px] lg:px-8">
        <article className="min-w-0 max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#07141a]/60">
            <Link href="/" className="text-[#0098ba] hover:underline">
              Home
            </Link>{" "}
            ›{" "}
            <Link href="/blog" className="text-[#0098ba] hover:underline">
              Blog
            </Link>{" "}
            › {post.category}
          </nav>

          <h1 className="text-3xl font-bold leading-tight text-[#042c43] md:text-4xl">{post.title}</h1>
          <p className="mb-5 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#07141a]/60">
            <span>By Cart &amp; Go Editorial Team</span>
            <span>
              Published <time dateTime={post.datePublished}>{formatPostDate(post.datePublished)}</time>
            </span>
            <span>
              Updated <time dateTime={post.dateModified}>{formatPostDate(post.dateModified)}</time>
            </span>
            <span>{post.readMinutes} min read</span>
          </p>

          <div className="relative mb-6 h-56 overflow-hidden rounded-xl bg-[#042c43] md:h-72">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
            />
          </div>

          <section className="mb-5 rounded-lg border border-[#d7dfe5] border-l-4 border-l-[#f0a42f] bg-white p-5">
            <h2 className="mb-2 font-bold text-[#042c43]">Key takeaways</h2>
            <ul className="list-disc space-y-1 pl-5 text-[15px] leading-6">
              {post.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <nav aria-label="In this guide" className="mb-6 rounded-lg border border-[#d7dfe5] bg-white p-5">
            <p className="mb-2 font-bold text-[#042c43]">In this guide</p>
            {post.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block py-0.5 text-[15px] text-[#0098ba] hover:underline">
                {s.heading}
              </a>
            ))}
          </nav>

          {post.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="mb-3 mt-8 text-2xl font-bold text-[#042c43]">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="mb-4 text-base leading-7 text-[#33384a]">
                  <RichText text={p} />
                </p>
              ))}
              {section.list && (
                <ul className="mb-4 list-disc space-y-1.5 pl-6 leading-7 text-[#33384a]">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {index === 0 && <AdSlot placement="inArticle" />}
            </section>
          ))}

          <section className="my-8 rounded-xl bg-[#042c43] p-6 text-white">
            <h2 className="text-xl font-bold">Check your documents before you pay any fee</h2>
            <p className="mb-4 mt-1 text-white/75">
              Consular reviews your statement of account, SOP and more the way a real visa officer would.
            </p>
            <Link
              href="/ai-consular-check"
              className="inline-flex rounded-full bg-[linear-gradient(135deg,#f3b94c,#df8f48)] px-6 py-3 text-sm font-semibold text-[#05131d]"
            >
              Try Consular
            </Link>
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Related guides">
          {related.length > 0 && <p className="mb-3 font-bold text-[#042c43]">Related guides</p>}
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/blog/${r.slug}`}
              className="mb-3 block rounded-xl border border-[#d7dfe5] bg-white p-4 hover:border-[#0098ba]"
            >
              <span className="font-semibold text-[#042c43]">{r.title}</span>
              <span className="mt-1 block text-xs text-[#07141a]/55">{r.readMinutes} min read</span>
            </Link>
          ))}
          <AdSlot placement="sidebar" />
        </aside>
      </div>
    </>
  );
}
