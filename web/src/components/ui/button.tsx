import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 border font-medium whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-faint focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.99] cursor-pointer select-none";

const variants: Record<Variant, string> = {
  primary: "border-accent bg-accent text-accent-ink hover:bg-ink-2 hover:border-ink-2",
  secondary: "border-ink bg-canvas text-ink hover:bg-subtle",
  ghost: "border-transparent bg-transparent text-ink hover:underline hover:bg-subtle/50",
  destructive: "border-accent bg-accent text-accent-ink hover:bg-ink-2 hover:border-ink-2",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs font-mono tracking-wider uppercase",
  md: "h-10 px-4 text-sm font-sans",
  lg: "h-12 px-6 text-base font-sans font-medium",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
): string {
  return cx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
