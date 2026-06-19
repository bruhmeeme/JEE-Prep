import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'physics' | 'chemistry' | 'maths' | 'outline';
  className?: string;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
        {
          "border-transparent bg-bg-card text-gray-100 hover:bg-border-subtle": variant === "default",
          "border-transparent bg-subject-physics/20 text-subject-physics": variant === "physics",
          "border-transparent bg-subject-chemistry/20 text-subject-chemistry": variant === "chemistry",
          "border-transparent bg-subject-maths/20 text-subject-maths": variant === "maths",
          "border-border-subtle text-gray-200": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
