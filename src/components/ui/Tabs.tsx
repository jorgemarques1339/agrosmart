import React from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

const Tabs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("w-full", className)} {...props} />
    )
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-neutral-800 p-1 text-gray-500",
                className
            )}
            {...props}
        />
    )
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className, active, ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 flex-1 relative",
                active
                    ? "text-gray-900 dark:text-white"
                    : "hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 hover:text-gray-900 dark:hover:text-white",
                className
            )}
            {...props}
        >
            {active && (
                <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200/50 dark:border-neutral-700/50 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10">{props.children}</span>
        </button>
    )
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends HTMLMotionProps<"div"> {
    active?: boolean;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className, active, ...props }, ref) => {
        if (!active) return null;
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    ref={ref}
                    className={cn(
                        "mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
                        className
                    )}
                    {...props}
                />
            </AnimatePresence>
        );
    }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
