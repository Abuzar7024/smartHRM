"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea as BaseTextArea } from "@/components/ui/Textarea";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

export function InputField({ label, icon, error, className, ...props }: InputFieldProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</Label>}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors">
                        {icon}
                    </div>
                )}
                <Input
                    className={cn(
                        "rounded-xl h-11 border-slate-200 bg-white px-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none",
                        icon && "pl-11",
                        error && "border-rose-500 focus:ring-rose-500",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest leading-none">{error}</p>}
        </div>
    );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function TextAreaField({ label, error, className, ...props }: TextAreaProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</Label>}
            <BaseTextArea
                className={cn(
                    "rounded-xl border-slate-200 bg-white p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none min-h-[100px] resize-none",
                    error && "border-rose-500 focus:ring-rose-500",
                    className
                )}
                {...props}
            />
            {error && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest leading-none">{error}</p>}
        </div>
    );
}

interface DropdownSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
    error?: string;
}

export function DropdownSelect({ label, options, error, className, ...props }: DropdownSelectProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</Label>}
            <select
                className={cn(
                    "w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all appearance-none cursor-pointer",
                    error && "border-rose-500 focus:ring-rose-500",
                    className
                )}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest leading-none">{error}</p>}
        </div>
    );
}
