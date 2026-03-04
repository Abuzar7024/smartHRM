"use client";

import React from "react";
import { usePermission } from "@/hooks/usePermission";
import type { AppPermission } from "@/lib/permissions";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
    /** The permission to check */
    perm: AppPermission;
    /**
     * Optional: what to render when permission is denied.
     * Pass `null` to render nothing at all (default).
     * Pass `"inline"` for a small inline "No access" badge.
     * Pass `"page"` for a full-page Access Denied screen.
     * Or pass your own React node.
     */
    fallback?: React.ReactNode | "inline" | "page" | null;
    children: React.ReactNode;
}

/**
 * PermissionGate
 * ──────────────
 * Wraps any JSX element. If the current user does not have `perm`,
 * the children are NOT rendered and the fallback is shown instead.
 *
 * Examples:
 *
 *   // Hide button silently
 *   <PermissionGate perm="assign_task">
 *     <button>Assign Task</button>
 *   </PermissionGate>
 *
 *   // Show inline no-access badge
 *   <PermissionGate perm="allocate_leave" fallback="inline">
 *     <AllocateLeaveForm />
 *   </PermissionGate>
 *
 *   // Show full page screen
 *   <PermissionGate perm="manage_employees" fallback="page">
 *     <EmployeeTable />
 *   </PermissionGate>
 *
 *   // Custom fallback
 *   <PermissionGate perm="view_payroll" fallback={<p>Contact HR</p>}>
 *     <PayrollTable />
 *   </PermissionGate>
 */
export function PermissionGate({
    perm,
    fallback = null,
    children,
}: PermissionGateProps) {
    const { can } = usePermission();

    if (can(perm)) return <>{children}</>;

    // ── Fallback variants ──────────────────────────────────────
    if (fallback === null) return null;

    if (fallback === "inline") {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                <ShieldX className="w-3.5 h-3.5" />
                No access
            </span>
        );
    }

    if (fallback === "page") {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/40 p-6">
                <div className="text-center p-10 bg-white rounded-[2rem] shadow-xl border border-slate-100 max-w-sm w-full">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShieldX className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        You don&apos;t have the{" "}
                        <code className="bg-slate-100 text-slate-700 px-1 rounded">
                            {perm}
                        </code>{" "}
                        permission. Contact your administrator to gain access.
                    </p>
                </div>
            </div>
        );
    }

    // Custom React node fallback
    return <>{fallback}</>;
}
