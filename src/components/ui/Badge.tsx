import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {

        const variants = {
            default: "bg-agro-green/10 text-agro-green",
            success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
            warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
            error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
            neutral: "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300",
            outline: "border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-gray-100",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };
