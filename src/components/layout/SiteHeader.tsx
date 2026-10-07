"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { navGroups } from "@/data/site";
import { Icon } from "@/components/ui/Icon";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d7dfe5]/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2 md:gap-3" onClick={() => setIsMenuOpen(false)}>
          <Image
            src="/assets/logo.jpg"
            alt="CartandGo Travels logo"
            width={44}
            height={44}
            className="h-8 w-8 rounded-md bg-black object-cover ring-1 ring-black/10 md:h-11 md:w-11"
            priority
          />
          <span className="text-base font-black tracking-tight text-[#07141a] md:text-xl">
            Cart<span className="text-[#0098ba]">&amp;</span>Go{" "}
            <span className="text-[#f0a42f]">Travels</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {navGroups.map((group) => (
            "href" in group ? (
              <Link
                key={group.label}
                href={group.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[#07141a]/70 transition hover:bg-[#e8f6fb] hover:text-[#07141a]"
              >
                {group.label}
              </Link>
            ) : (
              <div key={group.label} className="group relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[#07141a]/70 transition hover:bg-[#e8f6fb] hover:text-[#07141a] group-focus-within:bg-[#e8f6fb] group-focus-within:text-[#07141a]"
                  aria-haspopup="true"
                >
                  {group.label}
                  <Icon
                    name="Chevron"
                    className="h-3.5 w-3.5 transition group-hover:rotate-180 group-focus-within:rotate-180"
                  />
                </button>
                <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="w-56 rounded-lg border border-[#d7dfe5] bg-white p-2 shadow-[0_24px_60px_-30px_rgba(0,29,47,.45)]">
                    {group.items.map(([label, href]) => (
                      <Link
                        key={label}
                        href={href}
                        className="block rounded-md px-3 py-2.5 text-sm text-[#07141a]/75 transition hover:bg-[#e8f6fb] hover:text-[#07141a] focus:bg-[#e8f6fb] focus:text-[#07141a] focus:outline-none"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/contact"
            className="rounded-md bg-[#f0a42f] px-5 py-2.5 text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="rounded-full p-2 xl:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <Icon name="Menu" />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`border-t border-[#d7dfe5] bg-white xl:hidden ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <nav className="mx-auto grid max-w-7xl gap-2 px-5 py-4" aria-label="Mobile navigation">
          {navGroups.map((group) => (
            "href" in group ? (
              <Link
                key={group.label}
                href={group.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-semibold text-[#07141a] transition hover:bg-[#e8f6fb]"
              >
                {group.label}
              </Link>
            ) : (
              <details key={group.label} className="rounded-md px-3 py-2 open:bg-[#f6fbfd]">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#07141a]">
                  {group.label}
                  <Icon name="Chevron" className="h-3.5 w-3.5" />
                </summary>
                <div className="mt-2 grid gap-1 border-l border-[#d7dfe5] pl-3">
                  {group.items.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-sm text-[#07141a]/75 transition hover:bg-[#e8f6fb] hover:text-[#07141a]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </details>
            )
          ))}

          <div className="mt-2 grid gap-2 border-t border-[#d7dfe5] pt-4">
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md bg-[#f0a42f] px-5 py-3 text-center text-sm font-black text-[#07141a] transition hover:bg-[#ffb347]"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
