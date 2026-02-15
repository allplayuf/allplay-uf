import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-[#223029] bg-[#18221E] px-3 py-2 text-base text-[#F4F7F5] shadow-sm placeholder:text-[#9EAAA4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2BA84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131816] disabled:cursor-not-allowed disabled:opacity-60 disabled:text-[#7B8A83] md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }