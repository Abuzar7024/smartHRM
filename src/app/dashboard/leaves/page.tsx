"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarDays, CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Leave type config: label → color
const LEAVE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    "Sick Leave": { label: "Sick", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    "Annual Leave": { label: "Annual", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    "Unpaid Leave": { label: "Unpaid", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" },
    "Half Day Leave": { label: "Half Day", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    "Casual Leave": { label: "Casual", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
    "Maternity Leave": { label: "Maternity", color: "text-pink-700", bg: "bg-pink-50", border: "border-pink-200" },
};

function LeaveTypeBadge({ type, isHalfDay }: { type: string; isHalfDay?: boolean }) {
    const cfg = LEAVE_TYPE_CONFIG[type] ?? { label: type, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
    return (
        <span className={cn(
            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
            cfg.color, cfg.bg, cfg.border
        )}>
            {cfg.label}{isHalfDay && " (½)"}
        </span>
    );
}

export default function LeavesPage() {
    const { role, user } = useAuth();
    const { employees, leaves, requestLeave, updateLeaveStatus, leaveBalances, addLeaveBalance, bulkAddLeaveBalances, updateLeaveBalance, deleteLeaveBalance, approveLeaveRequest, rejectLeaveRequest } = useApp();

    const [showForm, setShowForm] = useState(false);
    const [selectedEmpEmail, setSelectedEmpEmail] = useState("");
    const [leaveType, setLeaveType] = useState("Sick Leave");
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [leaveFrom, setLeaveFrom] = useState("");
    const [leaveTo, setLeaveTo] = useState("");
    const [leaveDescription, setLeaveDescription] = useState("");

    // Employer multi-allocation state
    const [sickAllocation, setSickAllocation] = useState(0);
    const [annualAllocation, setAnnualAllocation] = useState(0);
    const [casualAllocation, setCasualAllocation] = useState(0);
    const [otherAllocation, setOtherAllocation] = useState(0);

    const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");
    const [viewMode, setViewMode] = useState<"Requests" | "Balances">("Requests");

    const displayLeaves = (role === "employer"
        ? leaves
        : leaves.filter(l => l.empEmail === user?.email)
    ).filter(l => leaveTypeFilter === "All" || l.type === leaveTypeFilter);

    const myBalances = leaveBalances.filter(b => b.empEmail === user?.email);

    // Compute days for a leave request
    const calcDays = (from: string, to: string, half: boolean) => {
        if (half) return 0.5;
        if (!from || !to) return 0;
        return Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1));
    };
    const previewDays = calcDays(leaveFrom, leaveTo, isHalfDay);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (role === "employer") {
            if (!selectedEmpEmail) return;
            const total = sickAllocation + annualAllocation + casualAllocation + otherAllocation;
            if (total <= 0) {
                toast.error("Allocation Required", { description: "Please allocate at least one day of leave." });
                return;
            }

            const balances = [];
            if (sickAllocation > 0) balances.push({ empEmail: selectedEmpEmail, balance: sickAllocation, type: "Sick Leave" });
            if (annualAllocation > 0) balances.push({ empEmail: selectedEmpEmail, balance: annualAllocation, type: "Annual Leave" });
            if (casualAllocation > 0) balances.push({ empEmail: selectedEmpEmail, balance: casualAllocation, type: "Casual Leave" });
            if (otherAllocation > 0) balances.push({ empEmail: selectedEmpEmail, balance: otherAllocation, type: "Other Leave" });

            await bulkAddLeaveBalances(balances as any);
            toast.success("Balances Allocated", { description: `Successfully allocated total ${total} days for the employee.` });

            setShowForm(false);
            setSelectedEmpEmail("");
            setSickAllocation(0);
            setAnnualAllocation(0);
            setCasualAllocation(0);
            setOtherAllocation(0);
            return;
        }

        if (!leaveFrom || (!isHalfDay && !leaveTo)) return;
        const effectiveTo = isHalfDay ? leaveFrom : leaveTo;
        const days = calcDays(leaveFrom, effectiveTo, isHalfDay);

        await requestLeave({
            empName: user?.email?.split("@")[0] || "Employee",
            empEmail: user?.email || "",
            type: isHalfDay ? "Half Day Leave" : leaveType,
            isHalfDay,
            days,
            from: leaveFrom,
            to: effectiveTo,
            status: "Pending",
            description: leaveDescription
        });
        toast.success("Leave Requested", { description: `${days} day(s) submitted for approval.` });
        setShowForm(false);
        setLeaveFrom("");
        setLeaveTo("");
        setLeaveDescription("");
        setIsHalfDay(false);
    };

    // Stats
    const totalPending = leaves.filter(l => l.status === "Pending" && (role === "employer" || l.empEmail === user?.email)).length;
    const totalApproved = leaves.filter(l => l.status === "Approved" && (role === "employer" || l.empEmail === user?.email)).length;

    // Per-type breakdown for employee
    const usedByType: Record<string, number> = {};
    if (role === "employee") {
        leaves.filter(l => l.empEmail === user?.email && l.status === "Approved").forEach(l => {
            const d = l.isHalfDay ? 0.5 : (l.days ?? 1);
            usedByType[l.type] = (usedByType[l.type] ?? 0) + d;
        });
    }

    const leaveTypeOptions = Object.keys(LEAVE_TYPE_CONFIG);
    const allTypes = ["All", ...leaveTypeOptions];

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
                    <p className="text-sm text-slate-500">Manage time off requests and employee leave balances.</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? "outline" : "corporate"}
                    className="rounded-lg shadow-sm"
                >
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? "Cancel" : (role === "employer" ? "Allocate Leave Balance" : "Request Leave")}
                </Button>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {role === "employee" && (
                    <Card className="border-slate-200 shadow-sm rounded-xl lg:col-span-2">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Portfolio</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {myBalances.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 italic">No assigned balances yet.</p>
                                    ) : (
                                        myBalances.map(bal => {
                                            const cfg = LEAVE_TYPE_CONFIG[bal.type];
                                            return (
                                                <div key={bal.id} className={cn(
                                                    "px-3 py-2 rounded-xl border flex flex-col items-center min-w-[80px]",
                                                    cfg?.bg || "bg-slate-50",
                                                    cfg?.border || "border-slate-100"
                                                )}>
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg?.color || "text-slate-500")}>{cfg?.label || bal.type}</span>
                                                    <span className="text-lg font-bold text-slate-900">{bal.balance}d</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {[
                    { label: "Total Requests", value: leaves.filter(l => role === "employer" || l.empEmail === user?.email).length, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Approved", value: totalApproved, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending", value: totalPending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    ...(role === "employer" ? [{ label: "Alerts", value: totalPending, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" }] : [])
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Request / Allocate Form ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="border-slate-200 shadow-md rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold">
                                    {role === "employer" ? "Allocate Leave Balance" : "New Leave Request"}
                                </CardTitle>
                                <CardDescription>
                                    {role === "employer"
                                        ? "Set the total number of allowed leave days for an employee."
                                        : "Complete the details below to submit a leave request."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {role === "employer" ? (
                                        <div className="lg:col-span-full space-y-6">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Employee</Label>
                                                <select
                                                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    value={selectedEmpEmail}
                                                    onChange={e => setSelectedEmpEmail(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select employee from directory...</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.email}>
                                                            {emp.name} ({emp.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="space-y-1.5 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-600 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Sick Leaves
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-10 bg-white rounded-xl border-rose-100 focus:ring-rose-200"
                                                        value={sickAllocation || ""}
                                                        onChange={e => setSickAllocation(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-600 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Annual Leaves
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-10 bg-white rounded-xl border-blue-100 focus:ring-blue-200"
                                                        value={annualAllocation || ""}
                                                        onChange={e => setAnnualAllocation(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-violet-600 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Casual Leaves
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-10 bg-white rounded-xl border-violet-100 focus:ring-violet-200"
                                                        value={casualAllocation || ""}
                                                        onChange={e => setCasualAllocation(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-200">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Other Leaves
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        className="h-10 bg-white rounded-xl border-slate-200"
                                                        value={otherAllocation || ""}
                                                        onChange={e => setOtherAllocation(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between border border-slate-800 shadow-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                        <CalendarDays className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Annual Allocation</p>
                                                        <p className="text-xl font-black">{sickAllocation + annualAllocation + casualAllocation + otherAllocation} <span className="text-xs font-medium text-slate-400">Days per Year</span></p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black text-[10px] uppercase">Calculated Block</Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Half-day toggle */}
                                            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 lg:col-span-3">
                                                <input
                                                    type="checkbox"
                                                    id="halfDayToggle"
                                                    checked={isHalfDay}
                                                    onChange={e => {
                                                        setIsHalfDay(e.target.checked);
                                                        if (e.target.checked) setLeaveType("Half Day Leave");
                                                        else setLeaveType("Sick Leave");
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-amber-500"
                                                />
                                                <Label htmlFor="halfDayToggle" className="text-sm font-semibold cursor-pointer">
                                                    ½ Half Day Leave
                                                    <span className="ml-2 text-xs font-normal text-slate-500">— deducts 0.5 from balance</span>
                                                </Label>
                                            </div>

                                            {/* Leave type — hidden when half day */}
                                            {!isHalfDay && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-sm font-semibold">Leave Type</Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                        value={leaveType}
                                                        onChange={e => setLeaveType(e.target.value)}
                                                    >
                                                        {leaveTypeOptions.filter(t => t !== "Half Day Leave").map(t => (
                                                            <option key={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-semibold">{isHalfDay ? "Date" : "Start Date"}</Label>
                                                <Input
                                                    required
                                                    type="date"
                                                    className="rounded-lg"
                                                    value={leaveFrom}
                                                    onChange={e => setLeaveFrom(e.target.value)}
                                                />
                                            </div>

                                            {!isHalfDay && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-sm font-semibold">End Date</Label>
                                                    <Input
                                                        required
                                                        type="date"
                                                        className="rounded-lg"
                                                        value={leaveTo}
                                                        onChange={e => setLeaveTo(e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1.5 lg:col-span-3">
                                                <Label className="text-sm font-semibold">Reason / Notes</Label>
                                                <Input
                                                    required
                                                    className="rounded-lg"
                                                    placeholder="e.g. Traveling out of town for a family event..."
                                                    value={leaveDescription}
                                                    onChange={e => setLeaveDescription(e.target.value)}
                                                />
                                            </div>

                                            {/* Preview */}
                                            {leaveFrom && (
                                                <div className="lg:col-span-3 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex items-center gap-3">
                                                    <CalendarDays className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                    <p className="text-sm text-indigo-800 font-medium">
                                                        This request will deduct <strong>{previewDays} day{previewDays !== 1 ? "s" : ""}</strong> from your leave balance
                                                        {(() => {
                                                            const targetType = leaveType === "Half Day Leave" ? "Casual Leave" : leaveType;
                                                            const currentBal = myBalances.find(b => b.type === targetType)?.balance ?? 0;
                                                            return <> &nbsp;(remaining after: <strong>{Math.max(0, currentBal - previewDays)} days</strong>)</>;
                                                        })()}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="lg:col-span-full flex justify-end gap-3 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                                        <Button type="submit" variant="corporate">Confirm</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Tabs for Employer ── */}
            {role === "employer" && (
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setViewMode("Requests")}
                        className={cn(
                            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
                            viewMode === "Requests" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Requested Leaves
                    </button>
                    <button
                        onClick={() => setViewMode("Balances")}
                        className={cn(
                            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
                            viewMode === "Balances" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Employee Balances
                    </button>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            {viewMode === "Requests" && (
                <div className="flex flex-wrap gap-2">
                    {allTypes.map(t => (
                        <button
                            key={t}
                            onClick={() => setLeaveTypeFilter(t)}
                            className={cn(
                                "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                                leaveTypeFilter === t
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Leave Table ── */}
            {viewMode === "Requests" ? (
                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="p-4 md:p-6 bg-slate-50/50 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">
                                {role === "employer" && leaves.filter(l => l.status === "Pending").length > 0 ? "Pending Approvals" : "Leave History"}
                            </CardTitle>
                            <CardDescription>
                                {role === "employer" && leaves.filter(l => l.status === "Pending").length > 0
                                    ? `There are ${leaves.filter(l => l.status === "Pending").length} requests awaiting your decision.`
                                    : `View and manage ${role === "employer" ? "all" : "your"} leave applications.`}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                    {role === "employer" && <TableHead className="w-[200px] h-10">Employee</TableHead>}
                                    <TableHead className="h-10">Type</TableHead>
                                    <TableHead className="h-10">Period</TableHead>
                                    <TableHead className="h-10">Deduction</TableHead>
                                    <TableHead className="h-10">Status</TableHead>
                                    {role === "employer" && <TableHead className="h-10 text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayLeaves.map((leave) => {
                                    const deduction = leave.isHalfDay ? 0.5 : (leave.days ?? Math.max(1, Math.ceil((new Date(leave.to).getTime() - new Date(leave.from).getTime()) / 86400000 + 1)));
                                    return (
                                        <TableRow key={leave.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            {role === "employer" && (
                                                <TableCell className="py-4">
                                                    <div className="font-semibold text-slate-900">{leave.empName}</div>
                                                    <div className="text-[11px] text-slate-500">{leave.empEmail}</div>
                                                </TableCell>
                                            )}
                                            <TableCell className="py-4">
                                                <LeaveTypeBadge type={leave.type} isHalfDay={leave.isHalfDay} />
                                                <div className="text-xs text-slate-400 italic line-clamp-1 truncate max-w-[200px] mt-1">
                                                    &quot;{leave.description || "No notes"}&quot;
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="text-sm font-medium text-slate-700">
                                                    {new Date(leave.from).toLocaleDateString()}
                                                </div>
                                                {!leave.isHalfDay && (
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                                                        to {new Date(leave.to).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className={cn(
                                                    "text-sm font-bold",
                                                    leave.status === "Approved" ? "text-rose-600" : "text-slate-400"
                                                )}>
                                                    {leave.status === "Approved" ? `−${deduction}d` : `${deduction}d`}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant={
                                                        leave.status === "Approved" ? "success" :
                                                            leave.status === "Pending" ? "warning" : "destructive"
                                                    }
                                                    className="rounded-md font-bold text-[10px] h-5 px-2"
                                                >
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                            {role === "employer" && (
                                                <TableCell className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {leave.status === "Pending" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                    onClick={() => rejectLeaveRequest(leave.id!)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="corporate"
                                                                    className="h-8 text-[11px] rounded-lg shadow-none"
                                                                    onClick={() => approveLeaveRequest(leave.id!)}
                                                                >
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                                {displayLeaves.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={role === "employer" ? 6 : 5} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <CalendarDays className="w-8 h-8" />
                                                <p className="text-sm font-medium">No leave records found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            ) : (
                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="p-4 md:p-6 bg-slate-50/50 border-b">
                        <CardTitle className="text-lg font-bold">Leave Balances</CardTitle>
                        <CardDescription>Manage and update employee time-off allocations.</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                    <TableHead className="h-10">Employee</TableHead>
                                    <TableHead className="h-10">Type</TableHead>
                                    <TableHead className="h-10">Balance</TableHead>
                                    <TableHead className="h-10 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaveBalances.map((bal) => (
                                    <TableRow key={bal.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-slate-900">
                                                {employees.find(e => e.email === bal.empEmail)?.name || "Employee"}
                                            </div>
                                            <div className="text-[11px] text-slate-500">{bal.empEmail}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <LeaveTypeBadge type={bal.type} />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-700">{bal.balance} days</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-slate-400 hover:text-rose-500 rounded-lg"
                                                    onClick={() => deleteLeaveBalance(bal.id!)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                                                    onClick={() => {
                                                        const newVal = prompt("Enter new balance:", bal.balance.toString());
                                                        if (newVal !== null) updateLeaveBalance(bal.id!, Number(newVal));
                                                    }}
                                                >
                                                    Modify
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {leaveBalances.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Plus className="w-8 h-8" />
                                                <p className="text-sm font-medium">No leave balances allocated yet</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
}
