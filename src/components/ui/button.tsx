import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md",
    "text-sm font-medium",
    "transition-colors",
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[var(--btn-primary-bg)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** 🔹 Primary (default) */
        default: `
          bg-[var(--btn-primary-bg)]
          text-[var(--btn-primary-text)]
          border border-[var(--btn-primary-border)]
          hover:bg-[var(--btn-primary-hover)]
        `,

        /** 🔹 Secondary */
        secondary: `
          bg-[var(--btn-secondary-bg)]
          text-[var(--btn-secondary-text)]
          border border-[var(--btn-secondary-border)]
          hover:bg-[var(--btn-secondary-hover)]
        `,

        /** 🔥 Destructive */
        destructive: `
          bg-destructive
          text-destructive-foreground
          hover:bg-destructive/90
        `,

        /** 👻 Ghost */
        ghost: `
          bg-transparent
          text-foreground
          hover:bg-accent
        `,

        /** 🔗 Link */
        link: `
          bg-transparent
          text-primary
          underline-offset-4
          hover:underline
        `,
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
