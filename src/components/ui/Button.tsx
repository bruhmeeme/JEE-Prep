import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-brand text-white shadow hover:bg-brand-hover": variant === "primary",
            "border border-border-subtle bg-transparent shadow-sm hover:bg-bg-card hover:text-gray-100": variant === "secondary",
            "bg-red-600 text-white shadow-sm hover:bg-red-700": variant === "destructive",
            "hover:bg-bg-card hover:text-gray-100": variant === "ghost",
            "h-8 px-3 text-xs": size === "sm",
            "h-9 px-4 py-2": size === "md",
            "h-10 px-8": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
