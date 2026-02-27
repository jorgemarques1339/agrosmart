import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, className }) => {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className={cn(
                            "relative w-full max-w-smmd z-10 bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden",
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 p-6 md:p-8 text-center sm:text-left relative", className)} {...props}>
        {children}
    </div>
);
DialogHeader.displayName = "DialogHeader";

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h2 ref={ref} className={cn("text-2xl font-black leading-none tracking-tight text-gray-900 dark:text-white", className)} {...props} />
    )
);
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-wide", className)} {...props} />
    )
);
DialogDescription.displayName = "DialogDescription";

export const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6 md:p-8 pt-0", className)} {...props}>
        {children}
    </div>
);
DialogContent.displayName = "DialogContent";

export const DialogFooter = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 md:p-8 pt-0", className)} {...props}>
        {children}
    </div>
);
DialogFooter.displayName = "DialogFooter";

export const DialogClose = ({ onClose, className }: { onClose: () => void, className?: string }) => (
    <button
        onClick={onClose}
        className={cn(
            "absolute right-6 top-6 rounded-full p-2 bg-gray-100/50 dark:bg-neutral-800/50 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
            className
        )}
    >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
    </button>
);
DialogClose.displayName = "DialogClose";
