import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: string;
    wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, wrapperClassName, icon, error, type, ...props }, ref) => {
        return (
            <div className={cn("relative w-full", wrapperClassName)}>
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-14 w-full rounded-2xl border-none bg-gray-50 dark:bg-neutral-900/50",
                        "px-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-medium",
                        "transition-all duration-200 outline-none",
                        "focus:ring-2 focus:ring-agro-green/50 dark:focus:ring-agro-green/30 focus:bg-white dark:focus:bg-neutral-800",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-12",
                        error && "ring-2 ring-red-500/50 bg-red-50/50 dark:bg-red-900/10 focus:ring-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <span className="text-xs font-bold text-red-500 mt-2 ml-1 inline-block animate-fade-in">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
