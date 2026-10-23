"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdSlot } from "@/components/blog/AdSlot";
import { blogCategories, formatPostDateShort, type BlogCategory } from "@/data/blog";

export type BlogCardPost = {
  slug: string;
  category: BlogCategory;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  datePublished: string;
  readMinutes: number;
};

const PAGE_SIZE = 6;

export function BlogIndex({ posts }: { posts: BlogCardPost[] }) {
  const [category, setCategory] = useState<"All" | BlogCategory>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = posts.filter((post) => category === "All" || post.category === category);
  const shown = filtered.slice(0, visible);

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter by category">
        {(["All", ...blogCategories] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={() => {
              setCategory(name);
              setVisible(PAGE_SIZE);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === name
                ? "bg-[#07141a] text-white"
                : "bg-[#ebeae7] text-[#07141a]/75 hover:bg-[#e0dfdb]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#d9d8d4] p-8 text-center text-[#07141a]/60">
          No guides in this category yet.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((post, index) => (
            <Fragment key={post.slug}>
              <article className="group flex flex-col overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,.08)] transition hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,.28)]">
                <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
                  <div className="flex flex-1 flex-col p-6 pb-8">
                    <time
                      dateTime={post.datePublished}
                      className="font-mono text-[13px] uppercase tracking-wide text-[#07141a]/45"
                    >
                      {formatPostDateShort(post.datePublished)}
                    </time>
                    <h2 className="mt-5 font-[family-name:var(--font-fraunces)]! text-[20px] font-normal leading-[1.25] tracking-tight text-[#111]">
                      {post.title}
                    </h2>
                    <p className="mt-5 text-[15px] leading-6 text-[#07141a]/60">{post.excerpt}</p>
                    <span className="mt-6 w-fit rounded-full bg-[#f1f0ee] px-4 py-2 text-sm font-medium text-[#111]">
                      {post.category}
                    </span>
                  </div>
                  <div className="relative m-1.5 aspect-[3/2] overflow-hidden rounded-[22px] bg-[#e9e7e3]">
                    <Image
                      src={post.image}
                      alt={post.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      priority={index < 3}
                    />
                  </div>
                </Link>
              </article>
              {index === 2 && <AdSlot placement="feed" className="my-0 md:col-span-2 lg:col-span-3" />}
            </Fragment>
          ))}
        </div>
      )}

      {filtered.length > visible && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-[#07141a] px-6 py-2.5 text-sm font-semibold text-[#07141a] transition hover:bg-[#07141a] hover:text-white"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
