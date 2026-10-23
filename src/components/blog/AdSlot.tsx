// Ad placement scaffold. Blog pages only; the rest of the site renders no ad markup.
//
// Placements: "top" (index leaderboard), "feed" (inside the post grid), "inArticle"
// (after the first article section), "sidebar" (sticky rail).
//
// Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is set, so no empty ad boxes show.
//
// When wiring a real provider:
//   1. Load its script only on blog routes and only after cookie consent
//      (the site has no consent banner yet, so add one first).
//   2. Render the provider's <ins>/ad unit inside the .ad-slot container below.
//   3. Keep the reserved min-height to avoid layout shift (Core Web Vitals).
//   4. Update the Privacy Policy for ad cookies and publish ads.txt in /public.

export type AdPlacement = "top" | "feed" | "inArticle" | "sidebar";

const placements: Record<AdPlacement, { minHeight: number; label: string }> = {
  top: { minHeight: 100, label: "Advertisement" },
  feed: { minHeight: 120, label: "Advertisement" },
  inArticle: { minHeight: 250, label: "Advertisement" },
  sidebar: { minHeight: 250, label: "Advertisement" },
};

export const adsConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

export function AdSlot({ placement, className = "" }: { placement: AdPlacement; className?: string }) {
  if (!adsConfigured) return null;

  const { minHeight, label } = placements[placement];

  return (
    <aside
      aria-label={label}
      data-ad-slot={placement}
      className={`ad-slot relative my-6 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#c9d6dd] bg-[#f1f6f8] text-center ${className}`}
      style={{ minHeight }}
    >
      <span className="absolute left-2 top-1 text-[10px] uppercase tracking-wide text-[#8a9aa3]">{label}</span>
    </aside>
  );
}
