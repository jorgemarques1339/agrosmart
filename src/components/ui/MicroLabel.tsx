import React from 'react';
import { cn } from '../../utils/cn';

export interface MicroLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    as?: React.ElementType;
    children: React.ReactNode;
}

const MicroLabel = React.forwardRef<HTMLSpanElement, MicroLabelProps>(
    ({ className, as: Component = 'span', children, ...props }, ref) => {
        return (
            <Component
                ref={ref}
                className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    className
                )}
                {...props}
            >
                {children}
            </Component>
        );
    }
);
MicroLabel.displayName = "MicroLabel";

export { MicroLabel };
