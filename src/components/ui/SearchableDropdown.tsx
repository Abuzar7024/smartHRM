import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableDropdownProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder: string;
    onAddTarget?: (val: string) => void;
    onAddActionLabel?: string;
    icon?: React.ElementType;
    disabled?: boolean;
}

export function SearchableDropdown({ value, onChange, options, placeholder, onAddTarget, onAddActionLabel, icon: Icon, disabled }: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative" ref={ref}>
            <div
                className={cn(
                    "flex items-center justify-between h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-shadow",
                    disabled ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-50" : "cursor-text border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50"
                )}
                onClick={() => !disabled && setIsOpen(true)}
            >
                {Icon && <Icon className="w-4 h-4 text-slate-400 mr-2 shrink-0" />}
                <input
                    className="flex-1 outline-none bg-transparent min-w-0"
                    placeholder={value ? "" : placeholder}
                    value={isOpen ? search : (value ? "" : search)}
                    onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                />
                {!isOpen && value && (
                    <span className="absolute left-3 sm:left-[44px] -ml-2 right-8 truncate pointer-events-none text-slate-900 top-1/2 -translate-y-1/2 lg:ml-0 lg:left-3">
                        {value}
                    </span>
                )}
            </div>
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute z-[100] mt-1.5 w-full bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
                        <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                            {filtered.length === 0 && !search ? (
                                <div className="p-3 text-center text-xs text-slate-500 italic">No options available.</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-500 italic">No matches found.</div>
                            ) : (
                                filtered.map(opt => (
                                    <div key={opt} onClick={() => { onChange(opt); setIsOpen(false); setSearch(""); }} className={cn("px-3 py-2 text-sm rounded-lg hover:bg-slate-50 cursor-pointer transition-colors", value === opt ? "bg-indigo-50/50 font-bold text-indigo-700" : "text-slate-700 hover:text-slate-900")}>
                                        {opt}
                                    </div>
                                ))
                            )}
                        </div>
                        {search && !options.some(o => o.toLowerCase() === search.toLowerCase()) && onAddTarget && (
                            <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
                                <button type="button" onClick={() => { onAddTarget(search); onChange(search); setIsOpen(false); setSearch(""); }} className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                                    <Plus className="w-4 h-4" /> {onAddActionLabel} <span className="text-slate-700 font-medium">"{search}"</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
