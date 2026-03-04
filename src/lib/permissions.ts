/**
 * ─────────────────────────────────────────────────────────────────
 *  HRMS – Centralised Permission System
 * ─────────────────────────────────────────────────────────────────
 *
 *  PERMISSION MODEL
 *  ─────────────────
 *  Each permission is a dot-separated string:   <resource>.<action>
 *
 *    assign_task           – create / assign tasks to others
 *    allocate_leave        – grant leave days to employees
 *    request_leave         – submit own leave requests
 *    approve_leave         – approve / reject leave requests
 *    view_payroll          – view payroll records
 *    manage_employees      – add / edit / remove employees
 *    manage_teams          – create / edit / delete teams
 *    post_jobs             – post and manage job openings
 *
 *  EMPLOYER ROLE
 *  ─────────────
 *  Users with role === "employer" automatically have EVERY permission.
 *  No permissions array is required on their employee doc.
 *
 *  EMPLOYEE ROLE
 *  ─────────────
 *  Permissions are stored as a string[] on the employee Firestore doc.
 *  Example:
 *    { permissions: ["assign_task", "request_leave"] }
 *
 *  USAGE
 *  ─────
 *  Option A – hook (recommended for logic-heavy components):
 *    const { can, cannot } = usePermission();
 *    if (can("assign_task")) { … }
 *
 *  Option B – component gate (recommended for JSX):
 *    <PermissionGate perm="assign_task">
 *      <AssignTaskButton />
 *    </PermissionGate>
 *
 *  Option C – context method (good for API calls inside AppContext):
 *    hasPermission("request_leave")   // already wired in AppContext
 * ─────────────────────────────────────────────────────────────────
 */

// All valid permission strings – add new ones here only.
export const PERMISSIONS = {
    ASSIGN_TASK: "assign_task",
    ALLOCATE_LEAVE: "allocate_leave",
    REQUEST_LEAVE: "request_leave",
    APPROVE_LEAVE: "approve_leave",
    VIEW_PAYROLL: "view_payroll",
    MANAGE_EMPLOYEES: "manage_employees",
    MANAGE_TEAMS: "manage_teams",
    POST_JOBS: "post_jobs",
} as const;

export type AppPermission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
