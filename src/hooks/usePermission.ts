"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import type { AppPermission } from "@/lib/permissions";

/**
 * usePermission()
 * ───────────────
 * A single, reusable hook that knows who the current user is,
 * looks up their employee record, and returns helpers for
 * checking any permission defined in src/lib/permissions.ts.
 *
 * Employers always return `true` for every check.
 * Employees must have the permission string in their `permissions[]`.
 *
 * Example:
 *   const { can, cannot, isEmployer } = usePermission();
 *   if (can("assign_task")) { … }
 *   if (cannot("allocate_leave")) return <AccessDenied />;
 */
export function usePermission() {
    const { user, role } = useAuth();
    const { employees } = useApp();

    const isEmployer = role?.toLowerCase() === "employer";

    // Look up the current user's employee doc (memoized)
    const myEmployeeDoc = useMemo(
        () => employees.find(e => e.email === user?.email),
        [employees, user?.email]
    );

    const myPermissions: string[] = useMemo(
        () => myEmployeeDoc?.permissions ?? [],
        [myEmployeeDoc]
    );

    /**
     * Returns true if the current user has the given permission.
     * Employers always return true.
     */
    const can = (perm: AppPermission): boolean => {
        if (isEmployer) return true;
        // Everyone is allowed to request their own leave
        if (perm === "request_leave") return true;
        return myPermissions.includes(perm);
    };

    /**
     * Inverse of `can`.
     */
    const cannot = (perm: AppPermission): boolean => !can(perm);

    /**
     * Check multiple permissions at once.
     * @param mode "any"  – returns true if user has AT LEAST ONE of the perms
     *             "all"  – returns true only if user has ALL perms
     */
    const canAny = (perms: AppPermission[]): boolean =>
        perms.some(p => can(p));

    const canAll = (perms: AppPermission[]): boolean =>
        perms.every(p => can(p));

    return {
        can,
        cannot,
        canAny,
        canAll,
        isEmployer,
        myPermissions,
        myEmployeeDoc,
    };
}
