"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ── LAYOUT COMPONENTS ──────────────────────────────────────────

interface CardContainerProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function CardContainer({ children, className, onClick }: CardContainerProps) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden transition-all duration-300",
                onClick && "cursor-pointer hover:shadow-md hover:-translate-y-1",
                className
            )}
        >
            {children}
        </Card>
    );
}

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    badge?: React.ReactNode;
    className?: string;
}

export function SectionHeader({ title, subtitle, icon: Icon, badge, className }: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 mb-8", className)}>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-8 h-8 text-slate-900" />}
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase tracking-widest">{title}</h1>
                    {badge && <div className="ml-2">{badge}</div>}
                </div>
                {subtitle && <p className="text-sm text-slate-500 font-bold italic opacity-70 ml-1">{subtitle}</p>}
            </div>
        </div>
    );
}

// ── ALERT COMPONENTS ──────────────────────────────────────────

interface AlertBannerProps {
    title: string;
    message?: string;
    variant?: "success" | "warning" | "error" | "info";
    className?: string;
}

export function AlertBanner({ title, message, variant = "info", className }: AlertBannerProps) {
    const variants = {
        success: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
        warning: { icon: AlertCircle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        error: { icon: X, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
        info: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
    };

    const config = variants[variant];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "p-5 rounded-2xl border flex items-start gap-4 shadow-sm",
                config.bg,
                config.text,
                config.border,
                className
            )}
        >
            <div className={cn("p-2 rounded-xl bg-white/50", config.text)}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="font-black uppercase tracking-[0.1em] text-xs mb-1">{title}</p>
                {message && <p className="text-xs font-bold opacity-80 leading-relaxed">{message}</p>}
            </div>
        </motion.div>
    );
}

// ── MODAL COMPONENTS ──────────────────────────────────────────

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = "md" }: ModalProps) {
    const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className={cn(
                            "relative bg-white rounded-[2.5rem] shadow-2xl w-full overflow-hidden border border-slate-200",
                            widths[maxWidth]
                        )}
                    >
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h3>
                                {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{subtitle}</p>}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-2xl hover:bg-slate-100 flex-shrink-0"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {footer && (
                            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
