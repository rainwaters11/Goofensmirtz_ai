import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "gradient-brand text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:border-primary/40 hover:text-accent-foreground transition-colors",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        "ghost-brand":
          "text-primary hover:bg-primary/8 hover:text-primary",
        link:
          "text-primary underline-offset-4 hover:underline",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-9 rounded-lg px-3 text-xs",
        lg:      "h-11 rounded-xl px-6",
        xl:      "h-12 rounded-xl px-7 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
