import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@smart-campus/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-white shadow dark:bg-zinc-100 dark:text-zinc-950",
        secondary:
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        warning:
          "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
        success:
          "border-transparent bg-emerald-600 text-white shadow hover:bg-emerald-700",
        outline:
          "text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
