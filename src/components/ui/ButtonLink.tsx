import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "dark";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const styles = {
    primary:
      "bg-[linear-gradient(135deg,#f3b94c,#df8f48)] text-[#05131d] shadow-[0_24px_60px_-28px_rgba(0,29,47,.7)]",
    ghost: "border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20",
    dark: "bg-[#042c43] text-[#fcf8f1] hover:opacity-90",
  };

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:scale-[1.02] ${styles[variant]}`}
    >
      {children}
      <Icon name="Arrow" className="h-4 w-4" />
    </Link>
  );
}
