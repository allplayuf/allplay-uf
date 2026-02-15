import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      className={cn("animate-pulse rounded-md bg-[#18221E]", className)}
      {...props} />)
  );
}

export { Skeleton }