"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

// ── STATUS BADGE ──────────────────────────────────────────

interface StatusBadgeProps {
    status: string;
    variant?: "default" | "outline" | "corporate" | "warning" | "error" | "success";
    className?: string;
}

export function StatusBadge({ status, variant = "outline", className }: StatusBadgeProps) {
    const statusMap: Record<string, { bg: string; text: string; border: string }> = {
        pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
        rejected: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
        completed: { bg: "bg-slate-900", text: "text-white", border: "border-slate-800" },
        "in progress": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
        active: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
        warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
        error: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" },
        success: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
    };

    const config = statusMap[status.toLowerCase()] || statusMap[variant as string] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" };

    return (
        <Badge
            variant={variant as any}
            className={cn(
                "font-black uppercase tracking-widest text-[9px] rounded-lg px-2.5 py-1 border shadow-sm whitespace-nowrap shrink-0 inline-flex items-center justify-center h-auto",
                config.bg,
                config.text,
                config.border,
                className
            )}
        >
            {status}
        </Badge>
    );
}

// ── DATA TABLE ──────────────────────────────────────────

interface DataTableColumn<T> {
    header: string;
    key: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    emptyMessage?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = "No records found" }: DataTableProps<T>) {
    return (
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-xl bg-white">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none">
                            {columns.map((col, i) => (
                                <TableHead
                                    key={i}
                                    className={cn(
                                        "font-black text-slate-400 uppercase text-[10px] tracking-widest px-8 h-16",
                                        i === columns.length - 1 && "text-right"
                                    )}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <TableRow key={index} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                                    {columns.map((col, i) => (
                                        <TableCell
                                            key={i}
                                            className={cn(
                                                "px-8 py-5 text-sm font-medium text-slate-600",
                                                i === columns.length - 1 && "text-right"
                                            )}
                                        >
                                            {col.render ? col.render(item) : (item as any)[col.key]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-24 italic text-slate-400 text-sm font-medium">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
