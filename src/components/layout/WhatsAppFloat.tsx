"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const whatsappNumbers = [
  {
    label: "+234 807 323 1272",
    href: "https://wa.me/2348073231272",
  },
  {
    label: "+1 347 420 0238",
    href: "https://wa.me/13474200238",
  },
] as const;

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div
        className={`w-56 origin-bottom overflow-hidden rounded-md border border-[#e2dacb] bg-white shadow-[0_24px_60px_-28px_rgba(0,29,47,.7)] transition duration-200 ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="border-b border-[#e2dacb] px-4 py-3 text-xs font-bold text-[#0f1e3d]">
          Chat on WhatsApp
        </div>
        <div className="p-2">
          {whatsappNumbers.map((number) => (
            <a
              key={number.href}
              href={number.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded px-3 py-2.5 text-sm font-semibold text-[#0f1e3d] transition hover:bg-[#fbf8f2] hover:text-[#c68a2e]"
            >
              <Icon name="WhatsApp" className="h-4 w-4 text-[#1aa6b7]" />
              {number.label}
            </a>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label="Show WhatsApp numbers"
        className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f3b94c,#df8f48)] px-5 py-3 text-sm font-semibold text-[#05131d] shadow-[0_24px_60px_-28px_rgba(0,29,47,.7)] transition hover:scale-105"
      >
        <Icon name="WhatsApp" className="h-4 w-4" />
        Chat with us
      </button>
    </div>
  );
}
