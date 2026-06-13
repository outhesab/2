import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export function ParspelLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      <Flame className="size-1/2" aria-hidden="true" />
    </span>
  )
}
