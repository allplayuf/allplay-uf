import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2BA84A] focus:ring-offset-2 focus:ring-offset-[#131816]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#2BA84A] text-white shadow hover:bg-[#248232]",
        secondary:
          "border-transparent bg-[#18221E] text-[#F4F7F5] hover:bg-[#223029]",
        destructive:
          "border-transparent bg-[#DC2626] text-white shadow hover:bg-[#B91C1C]",
        outline: "text-[#F4F7F5] border-[#223029]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }