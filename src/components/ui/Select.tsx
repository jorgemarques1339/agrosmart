import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, icon, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", wrapperClassName)}>
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            "flex h-14 w-full appearance-none rounded-2xl border-none bg-gray-50 dark:bg-neutral-900/50",
            "px-4 text-sm font-bold text-gray-900 dark:text-white",
            "transition-all duration-200 outline-none",
            "focus:ring-2 focus:ring-agro-green/50 dark:focus:ring-agro-green/30 focus:bg-white dark:focus:bg-neutral-800",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-12 pr-10" : "pr-10",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
