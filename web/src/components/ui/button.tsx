import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 border font-medium whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-faint";

const variants: Record<Variant, string> = {
  primary: "border-accent bg-accent text-accent-ink hover:bg-ink-2 hover:border-ink-2",
  secondary: "border-ink bg-canvas text-ink hover:bg-subtle",
  ghost: "border-transparent bg-transparent text-ink hover:underline",
  destructive: "border-accent bg-accent text-accent-ink hover:bg-ink-2 hover:border-ink-2",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
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
