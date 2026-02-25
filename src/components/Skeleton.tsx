import { cn } from '../utils/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-slate-200/60 rounded-md",
                variant === 'circle' && "rounded-full",
                variant === 'text' && "h-4 w-full",
                className
            )}
        />
    );
}
