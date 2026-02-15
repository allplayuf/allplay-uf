import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-[#223029] bg-[#18221E] px-3 py-1 text-base text-[#F4F7F5] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#F4F7F5] placeholder:text-[#9EAAA4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131816] disabled:cursor-not-allowed disabled:opacity-60 disabled:text-[#7B8A83] md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }