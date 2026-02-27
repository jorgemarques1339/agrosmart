import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'agro';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading = false, children, onClick, disabled, ...props }, ref) => {

        // Internal haptics wrap
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled && !isLoading) {
                haptics.light();
                onClick?.(e);
            }
        };

        const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide rounded-2xl transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2";

        const variants = {
            primary: "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md hover:bg-gray-800 dark:hover:bg-gray-100",
            agro: "bg-agro-green text-white shadow-lg shadow-agro-green/30 hover:bg-agro-green/90",
            secondary: "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-neutral-700",
            outline: "border-2 border-gray-200 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:border-gray-300 dark:hover:border-neutral-600",
            danger: "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600",
            ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-14 px-8 text-base",
            icon: "h-12 w-12",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                onClick={handleClick}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
