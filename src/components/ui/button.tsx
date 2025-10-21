import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClassMap: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
  outline:
    "bg-background text-foreground border border-border hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted border border-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
};

const sizeClassMap: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-9 w-9",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClassMap[variant],
          sizeClassMap[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
