import type { ReactNode } from "react";
import {
  privacyPolicyMeta,
  privacyPolicySections,
  type PolicyBlock,
} from "@/data/privacyPolicy";

const tokenPattern = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

function renderInline(text: string): ReactNode[] {
  return text.split(tokenPattern).map((part, index) => {
    if (part.startsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[#0f1e3d]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("[[")) {
      return (
        <mark key={index} className="rounded bg-[#fcf1d8] px-1 text-[#7a5a16]">
          [{part.slice(2, -2)}]
        </mark>
      );
    }
    return part;
  });
}

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case "h3":
      return <h3 className="mb-2 mt-7 text-lg font-semibold text-[#0f1e3d]">{block.text}</h3>;
    case "p":
      return <p className="mb-4 leading-7 text-[#33384a]">{renderInline(block.text)}</p>;
    case "ul":
      return (
        <ul className="mb-4 list-disc space-y-1.5 pl-6 leading-7 text-[#33384a]">
          {block.items.map((item) => (
            <li key={item}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14.5px]">
            <thead>
              <tr>
                {block.head.map((heading) => (
                  <th key={heading} className="border border-[#e2dacb] bg-[#0f1e3d] px-3 py-2.5 text-white">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell} className="border border-[#e2dacb] px-3 py-2.5 align-top text-[#33384a]">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-[#0f1e3d]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <h1 className="font-serif text-3xl font-semibold text-white md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm italic text-[#c9d0e0]">
            Last updated: {privacyPolicyMeta.lastUpdated}
          </p>
        </div>
      </section>

      <section className="bg-[#fbf8f2]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 lg:grid-cols-[230px_1fr] lg:px-8">
          <nav
            aria-label="Privacy policy sections"
            className="hidden self-start border-l-2 border-[#e2dacb] text-sm lg:sticky lg:top-24 lg:flex lg:flex-col"
          >
            {privacyPolicySections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3.5 py-1.5 text-[#5a5f6b] hover:text-[#0f1e3d]"
              >
                {section.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </nav>

          <main className="max-w-3xl">
            {privacyPolicySections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-24 ${index === 0 ? "" : "mt-11 border-t border-[#e2dacb] pt-3"}`}
              >
                <h2 className="mb-3 mt-3 font-serif text-2xl font-semibold text-[#0f1e3d]">
                  {section.title}
                </h2>
                {section.blocks.map((block, blockIndex) => (
                  <PolicyBlockView key={blockIndex} block={block} />
                ))}
              </section>
            ))}
          </main>
        </div>
      </section>
    </>
  );
}
