"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import {
    CalendarDays, Plus, User, Check, SunMoon, Sun as SunBase, Moon,
    Users, Send, Clock, CheckCircle2, AlertCircle, Calendar,
    Briefcase, HeartPulse, Plane, ArrowRight, Zap, Activity, Info, X, Search
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { TableRow, TableCell } from "@/components/ui/Table";

// Shared Components
import { PrimaryButton, SecondaryButton, IconButton } from "@/components/shared/buttons";
import { InputField, TextAreaField, DropdownSelect } from "@/components/shared/forms";
import { CardContainer, SectionHeader, AlertBanner, Modal } from "@/components/shared/common";
import { StatusBadge, DataTable } from "@/components/shared/tables";

export default function LeavesPage() {
    const { role, user, companyName } = useAuth();
    const { employees, leaves, requestLeave, leaveBalances, addLeaveBalance, bulkAddLeaveBalances, bulkDeleteLeaveBalances, approveLeaveRequest, rejectLeaveRequest, deleteLeaveBalance } = useApp();

    const { can, cannot, isEmployer } = usePermission();
    const canRequestLeave = can("request_leave");
    const canAllocateLeave = can("allocate_leave");

    // UI Local State
    const [isApplying, setIsApplying] = useState(false);

    // Employee Application Form State
    const [leaveType, setLeaveType] = useState("Annual Leave");
    const [leaveFrom, setLeaveFrom] = useState("");
    const [leaveTo, setLeaveTo] = useState("");
    const [leaveDescription, setLeaveDescription] = useState("");
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDayPeriod, setHalfDayPeriod] = useState<"First Half" | "Second Half">("First Half");
    const [submitLoading, setSubmitLoading] = useState(false);

    const leaveTypes = [
        { name: "Annual Leave", icon: Plane, color: "text-blue-600", bg: "bg-blue-50" },
        { name: "Sick Leave", icon: HeartPulse, color: "text-rose-600", bg: "bg-rose-50" },
        { name: "Casual Leave", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
        { name: "Medical Leave", icon: HeartPulse, color: "text-emerald-600", bg: "bg-emerald-50" },
        { name: "Unpaid Leave", icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-50" },
    ];

    // Employer Allocation State
    const [allocateModalEmpEmail, setAllocateModalEmpEmail] = useState("");
    const [allocateDays, setAllocateDays] = useState("");
    const [allocateType, setAllocateType] = useState("Annual Leave");
    const [allocateYear, setAllocateYear] = useState(new Date().getFullYear());
    const [isManagingBalances, setIsManagingBalances] = useState(false);
    const [managingUserEmail, setManagingUserEmail] = useState("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarUserEmail, setCalendarUserEmail] = useState("");
    const [currentCalDate, setCurrentCalDate] = useState(new Date());
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [empSearch, setEmpSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [visibleCount, setVisibleCount] = useState(12);
    const [filterRole, setFilterRole] = useState("All Roles");
    const [filterDept, setFilterDept] = useState("All Depts");

    // Helpers
    const currentYear = new Date().getFullYear();
    const formatYearRange = (year: number) => `${year}-${(year + 1).toString().slice(-2)}`;

    const calcDays = (from: string, to: string) => {
        if (!from || !to) return 0;
        const total = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1));
        return (total === 1 && isHalfDay) ? 0.5 : total;
    };

    const handleEmployeeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canRequestLeave) {
            toast.error("Access Restricted", { description: "You don't have permission to submit leave requests. Please contact your manager." });
            return;
        }
        if (!leaveFrom || !leaveTo) return;

        setSubmitLoading(true);
        const days = calcDays(leaveFrom, leaveTo);

        try {
            await requestLeave({
                empName: user?.displayName || user?.email?.split("@")[0] || "Employee",
                empEmail: user?.email || "",
                type: leaveType,
                days,
                from: leaveFrom,
                to: leaveTo,
                isHalfDay: leaveFrom === leaveTo ? isHalfDay : false,
                status: "Pending",
                description: leaveDescription,
                ...(leaveFrom === leaveTo && isHalfDay ? { halfDayPeriod } : {})
            });
            toast.success("Application Sent", { description: "Your leave request has been submitted for approval." });
            setIsApplying(false);
            setLeaveFrom("");
            setLeaveTo("");
            setLeaveDescription("");
            setIsHalfDay(false);
        } catch (err) {
            toast.error("Submission Failed");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEmployerAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canAllocateLeave) return;
        const days = Number(allocateDays);
        if (days <= 0 || !allocateModalEmpEmail || !allocateType) return;

        await addLeaveBalance({ empEmail: allocateModalEmpEmail, balance: days, type: allocateType, year: allocateYear });
        toast.success(`Credits Added`, { description: `Successfully added ${days} days of ${allocateType} to ${allocateModalEmpEmail}'s balance for ${allocateYear}.` });
        setAllocateModalEmpEmail("");
        setAllocateDays("");
    };

    // ── EMPLOYEE VIEW ──────────────────────────────────────────
    if (role === "employee") {
        const myLeaves = leaves.filter(l => l.empEmail === user?.email).sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());
        const myBalances = leaveBalances.filter(b => b.empEmail === user?.email);
        const totalAllocated = myBalances.reduce((acc, b) => acc + b.balance, 0);
        const totalTaken = myLeaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + (l.days || 0), 0);
        const availableBalance = Math.max(0, totalAllocated - totalTaken);

        return (
            <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-10 max-w-7xl mx-auto pb-24">
                <SectionHeader
                    title="Leave Management"
                    subtitle="View your balances and request time off."
                    badge={
                        <PrimaryButton
                            onClick={() => setIsApplying(true)}
                            icon={<Plus className="w-4 h-4" />}
                            className="h-9 px-4 text-xs shrink-0"
                        >
                            Request Leave
                        </PrimaryButton>
                    }
                />

                {availableBalance < 3 && availableBalance > 0 && (
                    <AlertBanner
                        variant="warning"
                        title="AI Strategic Alert: Low Leave Balance"
                        message={`⚠️ Your leave balance is running low. You have only ${availableBalance} ${availableBalance === 1 ? 'day' : 'days'} remaining in your current quota.`}
                        className="mb-8 border-amber-200 shadow-amber-900/5"
                    />
                )}

                {availableBalance <= 0 && totalAllocated > 0 && (
                    <AlertBanner
                        variant="error"
                        title="AI Critical Notice: Quota Exhausted"
                        message="Your leave balance has reached zero. Any further requests will be marked as unpaid leave. Please consult HR for emergency allocations."
                        className="mb-8 border-rose-200 shadow-rose-900/5"
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardContainer>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <StatusBadge status="Allocated" variant="corporate" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Yearly Credits</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalAllocated} <span className="text-sm font-medium text-slate-400">Days</span></h3>
                        </div>
                    </CardContainer>

                    <CardContainer>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <StatusBadge status="Utilized" variant="corporate" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Credits Consumed</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalTaken} <span className="text-sm font-medium text-slate-400">Days</span></h3>
                        </div>
                    </CardContainer>

                    <CardContainer>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <StatusBadge status="Pending" variant="corporate" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Awaiting Decision</p>
                            <h3 className="text-2xl font-black text-slate-900">{myLeaves.filter(l => l.status === "Pending").length} <span className="text-sm font-medium text-slate-400">Reqs</span></h3>
                        </div>
                    </CardContainer>

                    <CardContainer className="bg-slate-900 text-white border-none">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-white/10 text-indigo-200">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <StatusBadge status="Available" variant="corporate" className="bg-white/10 text-indigo-100 border-none" />
                            </div>
                            <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest leading-none mb-1">Current Liquidity</p>
                            <h3 className="text-2xl font-black text-white">{availableBalance} <span className="text-sm font-medium text-indigo-300">Days</span></h3>
                        </div>
                    </CardContainer>
                </div>

                <div className="space-y-4 pt-10">
                    <DataTable
                        columns={[
                            {
                                header: "ID / Applied", key: "id", render: (leave) => (
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">#{leave.id?.slice(-6) || 'N/A'}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                            {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString() : 'Historical Entry'}
                                        </p>
                                    </div>
                                )
                            },
                            {
                                header: "Category / Reason", key: "type", render: (leave) => (
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{leave.type}</p>
                                        <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 max-w-sm whitespace-pre-wrap">{leave.description}</p>
                                    </div>
                                )
                            },
                            {
                                header: "Duration", key: "from", render: (leave) => (
                                    <p className="text-[10px] font-black text-slate-600 uppercase">
                                        {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                    </p>
                                )
                            },
                            {
                                header: "Impact", key: "days", render: (leave) => (
                                    <p className="text-sm font-black text-slate-900">{leave.days} <span className="text-[10px] text-slate-400 font-medium">Days</span></p>
                                )
                            },
                            { header: "Status", key: "status", render: (leave) => <StatusBadge status={leave.status} /> }
                        ]}
                        data={myLeaves}
                        emptyMessage="Strategic Leave Portfolio is currently empty."
                    />
                </div>

                <Modal
                    isOpen={isApplying}
                    onClose={() => setIsApplying(false)}
                    title="Request Leave"
                    subtitle="Initial Strategic Leave Configuration"
                    footer={
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Calculated Impact: {calcDays(leaveFrom, leaveTo)} Days</span>
                            <div className="flex gap-4">
                                <SecondaryButton onClick={() => setIsApplying(false)}>Cancel</SecondaryButton>
                                <PrimaryButton onClick={handleEmployeeRequest} loading={submitLoading}>Submit Request</PrimaryButton>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <DropdownSelect
                            label="Leave Category"
                            value={leaveType}
                            onChange={e => setLeaveType(e.target.value)}
                            options={leaveTypes.map(t => ({ label: t.name, value: t.name }))}
                        />
                        <div className="grid grid-cols-2 gap-6">
                            <InputField required label="From Date" type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} />
                            <InputField required label="To Date" type="date" min={leaveFrom} value={leaveTo} onChange={e => setLeaveTo(e.target.value)} />
                        </div>
                        {leaveFrom && leaveTo && leaveFrom === leaveTo && (
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <SunMoon className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">Partial Day Configuration</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Requested as a half-day session</p>
                                    </div>
                                </div>
                                <PrimaryButton
                                    onClick={() => setIsHalfDay(!isHalfDay)}
                                    className={cn("h-8 px-4 rounded-lg text-[10px] uppercase", isHalfDay ? "bg-indigo-600" : "bg-slate-200 text-slate-500 shadow-none")}
                                >
                                    {isHalfDay ? "Enabled" : "Disabled"}
                                </PrimaryButton>
                            </div>
                        )}
                        {isHalfDay && (
                            <div className="grid grid-cols-2 gap-4">
                                <SecondaryButton
                                    className={cn(halfDayPeriod === "First Half" && "bg-slate-900 text-white hover:bg-slate-800 border-none")}
                                    icon={<SunBase className="w-4 h-4" />}
                                    onClick={() => setHalfDayPeriod("First Half")}
                                >
                                    First Half
                                </SecondaryButton>
                                <SecondaryButton
                                    className={cn(halfDayPeriod === "Second Half" && "bg-slate-900 text-white hover:bg-slate-800 border-none")}
                                    icon={<Moon className="w-4 h-4" />}
                                    onClick={() => setHalfDayPeriod("Second Half")}
                                >
                                    Second Half
                                </SecondaryButton>
                            </div>
                        )}
                        <TextAreaField
                            label="Strategic Reason / Description"
                            placeholder="Please provide full operational context for the absence..."
                            value={leaveDescription}
                            onChange={e => setLeaveDescription(e.target.value)}
                            required
                        />
                    </div>
                </Modal>
            </div>
        );
    }

    // ── EMPLOYER VIEW ──────────────────────────────────────────
    const getEmpTotalAllocated = (email: string) => {
        const year = new Date().getFullYear();
        return leaveBalances.filter(b => b.empEmail === email && b.year === year).reduce((acc, b) => acc + b.balance, 0);
    };
    const getEmpTotalTaken = (email: string) => leaves.filter(l => l.empEmail === email && l.status === "Approved" && new Date(l.from).getFullYear() === new Date().getFullYear()).reduce((acc, l) => acc + (l.days || 0), 0);

    return (
        <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel Absences</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">Strategic workforce availability management.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-2 rounded-xl bg-slate-900 text-white"><Users className="w-4 h-4" /></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Staff</p>
                        <h3 className="text-xl font-black text-slate-900">{employees.length}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><SunMoon className="w-4 h-4" /></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Off Today</p>
                        <h3 className="text-xl font-black text-slate-900">{leaves.filter(l => l.status === "Approved" && new Date().toISOString().split('T')[0] >= l.from && new Date().toISOString().split('T')[0] <= l.to).length}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><AlertCircle className="w-4 h-4" /></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending</p>
                        <h3 className="text-xl font-black text-slate-900">{leaves.filter(l => l.status === "Pending").length}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl border-none shadow-lg">
                    <div className="p-2 rounded-xl bg-white/10 text-white"><Activity className="w-4 h-4" /></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Engagement</p>
                        <h3 className="text-xl font-black text-white">98%</h3>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-2">
                    <SectionHeader
                        title="Workforce Management"
                        subtitle="Live availability and allocation matrix for all active personnel."
                        icon={Users}
                        className="mb-0"
                    />

                    <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-[2rem] border border-slate-200">
                        {/* Search Input */}
                        <div className="relative min-w-[240px] flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Search personnel..."
                                value={empSearch}
                                onChange={(e) => setEmpSearch(e.target.value)}
                                className="w-full h-10 pl-11 pr-4 bg-white border border-slate-200 rounded-[1.2rem] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="h-10 px-4 bg-white border border-slate-200 rounded-[1.2rem] text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option>All Roles</option>
                            {Array.from(new Set(employees.map(e => e.role))).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>

                        {/* Dept Filter */}
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="h-10 px-4 bg-white border border-slate-200 rounded-[1.2rem] text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option>All Depts</option>
                            {Array.from(new Set(employees.map(e => e.department))).filter(Boolean).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        {/* View Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Zap className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Activity className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === "grid" ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 px-2"
                        >
                            {employees
                                .filter(e => e.status === "Active")
                                .filter(e =>
                                    (e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                                        e.role.toLowerCase().includes(empSearch.toLowerCase())) &&
                                    (filterRole === "All Roles" || e.role === filterRole) &&
                                    (filterDept === "All Depts" || e.department === filterDept)
                                )
                                .slice(0, visibleCount)
                                .map(emp => (
                                    <div key={emp.id} className="group bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-900 truncate text-[11px] uppercase tracking-tight">{emp.name}</h4>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">{emp.role}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Allocated</p>
                                                    <p className="font-black text-xs text-slate-900">{getEmpTotalAllocated(emp.email)}D</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Used</p>
                                                    <p className="font-black text-xs text-rose-500">{getEmpTotalTaken(emp.email)}D</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <IconButton
                                                        icon={<Plus className="w-3 h-3" />}
                                                        onClick={() => setAllocateModalEmpEmail(emp.email)}
                                                        className="h-7 w-7 bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white"
                                                    />
                                                    <IconButton
                                                        icon={<CalendarDays className="w-3 h-3" />}
                                                        onClick={() => { setCalendarUserEmail(emp.email); setIsCalendarOpen(true); }}
                                                        className="h-7 w-7"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="px-2"
                        >
                            <DataTable
                                columns={[
                                    {
                                        header: "Team Member", key: "name", render: (emp) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                                    {emp.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{emp.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{emp.role}</p>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { header: "Department", key: "department", render: (emp) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{emp.department}</span> },
                                    { header: "Allocated", key: "alloc", render: (emp) => <span className="text-xs font-black text-slate-900">{getEmpTotalAllocated(emp.email)} Days</span> },
                                    { header: "Utilized", key: "used", render: (emp) => <span className="text-xs font-black text-rose-500">{getEmpTotalTaken(emp.email)} Days</span> },
                                    {
                                        header: "Quick Actions", key: "actions", render: (emp) => (
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => setAllocateModalEmpEmail(emp.email)} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase hover:bg-indigo-600 transition-colors">Allocate</button>
                                                <IconButton icon={<CalendarDays className="w-3.5 h-3.5" />} onClick={() => { setCalendarUserEmail(emp.email); setIsCalendarOpen(true); }} className="h-8 w-8 rounded-lg" />
                                                <IconButton icon={<User className="w-3.5 h-3.5" />} onClick={() => { setManagingUserEmail(emp.email); setIsManagingBalances(true); }} className="h-8 w-8 rounded-lg" />
                                            </div>
                                        )
                                    }
                                ]}
                                data={employees
                                    .filter(e => e.status === "Active")
                                    .filter(e =>
                                        (e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                                            e.role.toLowerCase().includes(empSearch.toLowerCase())) &&
                                        (filterRole === "All Roles" || e.role === filterRole) &&
                                        (filterDept === "All Depts" || e.department === filterDept)
                                    )}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Show More Pagination */}
                {employees.filter(e => e.status === "Active").length > visibleCount && (
                    <div className="flex justify-center pt-8">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 12)}
                            className="group flex flex-col items-center gap-3 transition-all"
                        >
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-indigo-600 transition-colors">Show More Members</span>
                            <div className="w-px h-12 bg-slate-200 group-hover:bg-indigo-500 transition-all group-hover:h-16" />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-6 pt-10">
                <SectionHeader
                    title="Pending Authorization"
                    subtitle="Systematic validation of workforce leave requests."
                    badge={<StatusBadge status={`${leaves.filter(l => l.status === "Pending").length} REQS`} variant="warning" />}
                />
                <DataTable
                    columns={[
                        {
                            header: "Personnel", key: "empName", render: (leave) => (
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                                        {leave.empName?.[0]}
                                    </div>
                                    <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{leave.empName}</p>
                                </div>
                            )
                        },
                        {
                            header: "Category / Reason", key: "type", render: (leave) => (
                                <div className="max-w-xs">
                                    <p className="text-xs font-black text-slate-900 uppercase">{leave.type}</p>
                                    <p className="text-[10px] text-slate-400 font-medium italic mt-1 truncate">{leave.description}</p>
                                </div>
                            )
                        },
                        {
                            header: "Duration", key: "from", render: (leave) => (
                                <p className="text-[10px] font-black text-slate-500 uppercase">
                                    {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                </p>
                            )
                        },
                        {
                            header: "Impact", key: "days", render: (leave) => (
                                <p className="text-xs font-black text-slate-900">{leave.days} <span className="text-[9px] text-slate-400 font-medium italic uppercase">Operational Days</span></p>
                            )
                        },
                        {
                            header: "Decision", key: "action", render: (leave) => (
                                <div className="flex items-center justify-end gap-2">
                                    <PrimaryButton onClick={() => approveLeaveRequest(leave.id!)} className="h-8 px-4 text-[10px] bg-emerald-600 hover:bg-emerald-700" icon={<Check className="w-3 h-3" />}>Approve</PrimaryButton>
                                    <SecondaryButton onClick={() => rejectLeaveRequest(leave.id!)} className="h-8 px-4 text-[10px] border-rose-100 text-rose-600 hover:bg-rose-50" icon={<X className="w-3 h-3" />}>Refuse</SecondaryButton>
                                </div>
                            )
                        }
                    ]}
                    data={leaves.filter(l => l.status === "Pending")}
                    emptyMessage="Operational authorization queue is currently clear."
                />
            </div>

            <div className="space-y-6 pt-10">
                <SectionHeader
                    title="Archive Registry"
                    subtitle="Historic authorization logs and cleared absences."
                />
                <DataTable
                    columns={[
                        {
                            header: "Personnel", key: "empName", render: (leave) => (
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">
                                        {leave.empName?.[0]}
                                    </div>
                                    <p className="font-black text-slate-900 text-[10px] uppercase tracking-tight">{leave.empName}</p>
                                </div>
                            )
                        },
                        {
                            header: "Duration", key: "from", render: (leave) => (
                                <p className="text-[9px] font-black text-slate-400 uppercase">
                                    {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                </p>
                            )
                        },
                        {
                            header: "Impact", key: "days", render: (leave) => (
                                <p className="text-[10px] font-black text-slate-900">{leave.days} <span className="text-[9px] text-slate-400 font-medium">U</span></p>
                            )
                        },
                        { header: "Resolution Status", key: "status", render: (leave) => <StatusBadge status={leave.status} /> }
                    ]}
                    data={leaves.filter(l => l.status !== "Pending")}
                    emptyMessage="Historic authorization logs are currently archived."
                />
            </div>

            <Modal
                isOpen={!!allocateModalEmpEmail}
                onClose={() => setAllocateModalEmpEmail("")}
                title="Allocate Leave Credits"
                subtitle={`Operational Balance Configuration for ${allocateModalEmpEmail}`}
                footer={
                    <div className="flex gap-4 w-full">
                        <SecondaryButton className="flex-1" onClick={() => setAllocateModalEmpEmail("")}>Cancel</SecondaryButton>
                        <PrimaryButton className="flex-1" onClick={handleEmployerAllocate}>Add Credits</PrimaryButton>
                    </div>
                }
            >
                <div className="space-y-6">
                    <DropdownSelect label="Strategic Fiscal Year" value={allocateYear} onChange={e => setAllocateYear(Number(e.target.value))} options={[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => ({ label: formatYearRange(y), value: y.toString() }))} />
                    <DropdownSelect label="Leave Policy Category" value={allocateType} onChange={e => setAllocateType(e.target.value)} options={leaveTypes.map(t => ({ label: t.name, value: t.name }))} />
                    <InputField label="Days to Credit" type="number" value={allocateDays} onChange={e => setAllocateDays(e.target.value)} placeholder="0" className="text-center font-black text-lg" />
                </div>
            </Modal>

            <Modal
                isOpen={isManagingBalances}
                onClose={() => setIsManagingBalances(false)}
                title="Manage Allocations"
                subtitle={`Historical strategic credits for ${managingUserEmail}`}
            >
                <div className="overflow-hidden border border-slate-100 rounded-[2rem] bg-white">
                    <DataTable
                        columns={[
                            { header: "Year", key: "year", render: (bal) => <span className="font-black text-slate-900 uppercase text-xs">{formatYearRange(bal.year)}</span> },
                            { header: "Type", key: "type", render: (bal) => <span className="text-sm font-medium text-slate-600">{bal.type}</span> },
                            { header: "Balance", key: "balance", render: (bal) => <p className="font-black text-slate-900">{bal.balance} <span className="text-[10px] text-slate-400 font-medium">Days</span></p> },
                            { header: "Action", key: "action", render: (bal) => <IconButton icon={<X className="w-4 h-4" />} className="text-rose-500 hover:bg-rose-50" onClick={async () => { await deleteLeaveBalance(bal.id!); toast.success("Balance removed"); }} /> }
                        ]}
                        data={leaveBalances.filter(b => b.empEmail === managingUserEmail)}
                        emptyMessage="No historical allocations found."
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                title="Leave Calendar"
                subtitle={`Physical Presence Roster for ${calendarUserEmail}`}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <IconButton icon={<Check className="w-4 h-4 rotate-180" />} onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="h-10 w-10" />
                        <span className="font-black text-base text-slate-900 uppercase tracking-widest">
                            {currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <IconButton icon={<Check className="w-4 h-4" />} onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="h-10 w-10" />
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="text-[10px] font-black text-slate-400 py-1 uppercase tracking-widest text-center">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                        {Array.from({ length: new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day).toISOString().split('T')[0];
                            const isTaken = leaves.some(l => l.empEmail === calendarUserEmail && l.status === "Approved" && dateStr >= l.from && dateStr <= l.to);
                            return (
                                <div key={day} className={cn("aspect-square flex items-center justify-center text-[10px] font-black rounded-xl transition-all border", isTaken ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 scale-110" : "bg-white border-slate-50 text-slate-400 hover:border-slate-200")}>
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isAbsenceModalOpen}
                onClose={() => setIsAbsenceModalOpen(false)}
                title="Absent Today"
                subtitle="Live Roster of Unauthorized Operational Absences"
                footer={<PrimaryButton className="w-full h-12 rounded-[2rem]" onClick={() => setIsAbsenceModalOpen(false)}>Dismiss Operational Roster</PrimaryButton>}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    {leaves.filter(l => l.status === "Approved" && new Date().toISOString().split('T')[0] >= l.from && new Date().toISOString().split('T')[0] <= l.to).map((leave, idx) => {
                        const emp = employees.find(e => e.email === leave.empEmail);
                        return (
                            <div key={idx} className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group transition-all space-y-6">
                                <div className="flex items-center justify-between gap-4 overflow-hidden w-full">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 shadow-sm group-hover:scale-105 transition-transform text-xl shrink-0">{leave.empName?.[0]}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-slate-900 text-base uppercase tracking-tight leading-none truncate w-full">{leave.empName}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 truncate w-full">{emp?.department || 'Operational Unit'}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={leave.type} variant="corporate" className="bg-white border-slate-100 shadow-sm shrink-0" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Session Window</p>
                                        <p className="text-[10px] font-black text-slate-900 uppercase">{new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Impact</p>
                                        <p className="text-xs font-black text-slate-900">{leave.days} <span className="text-[9px] text-slate-400 uppercase font-bold ml-1">Days</span></p>
                                    </div>
                                </div>
                                {leave.description && (
                                    <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Objective / Reason</p>
                                        <p className="text-xs text-slate-600 font-medium italic leading-relaxed whitespace-pre-wrap">{leave.description}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {leaves.filter(l => l.status === "Approved" && new Date().toISOString().split('T')[0] >= l.from && new Date().toISOString().split('T')[0] <= l.to).length === 0 && (
                        <div className="py-16 text-center opacity-20 flex flex-col items-center">
                            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                            <p className="text-lg font-black uppercase tracking-[0.3em]">Operational Readiness 100%</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
