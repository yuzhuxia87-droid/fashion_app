import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-pink-100 text-pink-700 shadow-sm",
        secondary:
          "border-transparent bg-purple-100 text-purple-500 shadow-sm",
        destructive:
          "border-transparent bg-red-100 text-red-600 shadow-sm",
        outline: "border-white/20 bg-white/90 backdrop-blur-md shadow-lg text-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
