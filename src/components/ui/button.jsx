import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131816] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#2BA84A] text-white shadow hover:bg-[#248232]",
        destructive:
          "bg-[#DC2626] text-white shadow-sm hover:bg-[#B91C1C]",
        outline:
          "border border-[#223029] bg-[#121715] text-[#F4F7F5] shadow-sm hover:bg-[#18221E] hover:text-[#F4F7F5]",
        secondary:
          "bg-[#18221E] text-[#F4F7F5] border border-[#223029] shadow-sm hover:bg-[#223029]",
        ghost: "text-[#B6C2BC] hover:bg-[#18221E] hover:text-[#F4F7F5]",
        link: "text-[#2BA84A] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }