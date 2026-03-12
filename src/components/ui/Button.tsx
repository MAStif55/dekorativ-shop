import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center font-bold tracking-widest transition-all duration-300 shadow-sm";

        const variants = {
            primary: "btn-primary",
            secondary: "bg-slate-dark text-white hover:bg-slate",
            outline: "btn-outline",
            ghost: "bg-transparent text-slate-dark hover:bg-slate-100 shadow-none uppercase",
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-11 px-5 text-sm",
            lg: "h-14 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
