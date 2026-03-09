"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

import { ButtonProps as ShadcnButtonProps } from "@/components/ui/Button";

interface ButtonProps extends ShadcnButtonProps {
    loading?: boolean;
    icon?: React.ReactNode;
}

export function PrimaryButton({ children, className, loading, icon, ...props }: ButtonProps) {
    return (
        <Button
            className={cn(
                "bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl h-11 px-8 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5 relative overflow-hidden group",
                className
            )}
            disabled={loading}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10 flex items-center justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : icon && <span className="mr-2 group-hover:scale-110 transition-transform duration-300">{icon}</span>}
                {children}
            </span>
        </Button>
    );
}

export function SecondaryButton({ children, className, loading, icon, ...props }: ButtonProps) {
    return (
        <Button
            variant="outline"
            className={cn(
                "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-11 px-8 transition-all disabled:opacity-50",
                className
            )}
            disabled={loading}
            {...props}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : icon && <span className="mr-2">{icon}</span>}
            {children}
        </Button>
    );
}

export function IconButton({ children, className, loading, icon, ...props }: ButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all cursor-pointer h-10 w-10",
                className
            )}
            disabled={loading}
            {...props}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (icon || children)}
        </Button>
    );
}
