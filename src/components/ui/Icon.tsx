import type { ReactNode } from "react";

type IconProps = {
  name: string;
  className?: string;
};

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, ReactNode> = {
    Arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </>
    ),
    Sparkles: (
      <>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="M19 3v4" />
        <path d="M21 5h-4" />
      </>
    ),
    Menu: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </>
    ),
    Chevron: <path d="m6 9 6 6 6-6" />,
    File: (
      <>
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2Z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    Plane: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2l-1.4 2.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3 2.3-1.1Z" />,
    Search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    Swap: (
      <>
        <path d="M7 7h12" />
        <path d="m15 3 4 4-4 4" />
        <path d="M17 17H5" />
        <path d="m9 21-4-4 4-4" />
      </>
    ),
    Briefcase: (
      <>
        <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 12h18" />
      </>
    ),
    Hotel: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" />
        <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
      </>
    ),
    Care: (
      <>
        <path d="M6 3v6a6 6 0 0 0 12 0V3" />
        <path d="M8 3v2M16 3v2" />
        <path d="M12 15v2a4 4 0 0 0 8 0v-3" />
        <circle cx="20" cy="12" r="2" />
      </>
    ),
    Shield: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6c3 0 5.5-1.2 8-3 2.5 1.8 5 3 8 3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    Cap: (
      <>
        <path d="m22 10-10-5-10 5 10 5 10-5Z" />
        <path d="M6 12v4c3 2 9 2 12 0v-4" />
      </>
    ),
    Book: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z" />
      </>
    ),
    Money: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </>
    ),
    Globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </>
    ),
    Message: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
    WhatsApp: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5Z" />
        <path d="M8.7 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.7 1.7c.1.3.1.5-.1.7l-.4.5c-.2.2-.2.4-.1.6.4.8 1.1 1.6 1.9 2 .2.1.4.1.6-.1l.6-.7c.2-.2.4-.3.7-.2l1.6.7c.4.2.5.4.5.6v.5c0 .4-.2.7-.5.9-.5.4-1.4.6-2.5.2-2.9-.9-5.1-3.3-5.8-5.7-.3-1 0-1.7.4-2.3Z" />
      </>
    ),
    User: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="10" r="3" />
        <path d="M7 20a5 5 0 0 1 10 0" />
      </>
    ),
    Calendar: (
      <>
        <path d="M8 2v4M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    Users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    Location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    Star: (
      <path d="m12 2 2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1L6.1 20l1.2-6.5L2.5 8.9 9.1 8 12 2Z" />
    ),
    Heart: (
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    ),
    Bed: (
      <>
        <path d="M2 18V7" />
        <path d="M2 14h20v4" />
        <path d="M6 14V9h7a3 3 0 0 1 3 3v2" />
        <path d="M6 10h.01" />
      </>
    ),
    Filter: (
      <>
        <path d="M3 5h18" />
        <path d="M6 12h12" />
        <path d="M10 19h4" />
      </>
    ),
    Check: <path d="m5 12 4 4L19 6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}
