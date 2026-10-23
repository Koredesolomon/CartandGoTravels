import type { ReactNode } from "react";
import Link from "next/link";

const linkPattern = /(\[[^\]]+\]\(\/[^)]*\))/g;

// Renders [label](/internal-path) as a Next link. Internal paths only.
export function RichText({ text }: { text: string }): ReactNode {
  return text.split(linkPattern).map((part, index) => {
    const match = /^\[([^\]]+)\]\((\/[^)]*)\)$/.exec(part);
    if (!match) return part;
    return (
      <Link
        key={index}
        href={match[2]}
        className="font-semibold text-[#0098ba] underline underline-offset-2 hover:text-[#042c43]"
      >
        {match[1]}
      </Link>
    );
  });
}

export function stripMarkup(text: string) {
  return text.replace(/\[([^\]]+)\]\(\/[^)]*\)/g, "$1");
}
