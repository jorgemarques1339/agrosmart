import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'circular' | 'rectangular' | 'text';
    animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    animation = 'pulse',
}) => {
    const baseClasses = 'bg-gray-200 dark:bg-neutral-800 pointer-events-none';

    const variantClasses = {
        circular: 'rounded-full',
        rectangular: 'rounded-2xl',
        text: 'rounded-md',
    };

    const getAnimationProps = () => {
        switch (animation) {
            case 'pulse':
                return {
                    animate: { opacity: [0.5, 1, 0.5] },
                    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
                };
            case 'wave':
                // Wave animation uses CSS gradient instead of framer motion for performance
                return {};
            default:
                return {};
        }
    };

    return (
        <motion.div
            {...getAnimationProps()}
            className={clsx(
                baseClasses,
                variantClasses[variant],
                animation === 'wave' && 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent',
                className
            )}
        />
    );
};
