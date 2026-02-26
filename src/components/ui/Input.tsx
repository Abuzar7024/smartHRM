"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// ── Standard Input ────────────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const isPassword = type === "password";
        const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

        return (
            <div className="relative w-full">
                <input
                    type={resolvedType}
                    className={cn(
                        // Base
                        "flex h-10 w-full rounded-xl border bg-white px-3.5 py-2 text-sm font-medium text-slate-800",
                        // Border
                        "border-slate-200 shadow-sm",
                        // Placeholder — low opacity hint
                        "placeholder:text-slate-400 placeholder:font-normal placeholder:opacity-70",
                        // Focus ring
                        "transition-all duration-200 outline-none",
                        "focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
                        // Hover
                        "hover:border-slate-300",
                        // Disabled
                        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
                        // File inputs
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        // Pad right if password (to not overlap eye button)
                        isPassword && "pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(v => !v)}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "text-slate-400 hover:text-slate-600 transition-colors",
                            "focus:outline-none"
                        )}
                    >
                        {showPassword
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />
                        }
                    </button>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export { Input };
