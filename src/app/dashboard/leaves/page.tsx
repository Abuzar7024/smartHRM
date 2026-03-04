"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
    X,
    CalendarDays,
    Plus,
    User,
    Check,
    SunMoon,
    Sun as SunBase,
    Moon,
    Users,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Briefcase,
    HeartPulse,
    Plane,
    ArrowRight,
    Zap,
    Activity
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

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

    // ── EMPLOYEE VIEW (REDESIGNED) ──────────────────────────────────────────
    if (role === "employee") {
        const myLeaves = leaves.filter(l => l.empEmail === user?.email).sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());
        const myBalances = leaveBalances.filter(b => b.empEmail === user?.email);
        const totalAllocated = myBalances.reduce((acc, b) => acc + b.balance, 0);
        const totalTaken = myLeaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + (l.days || 0), 0);
        const availableBalance = Math.max(0, totalAllocated);

        return (
            <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-10 max-w-7xl mx-auto pb-24">
                {/* Modern Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
                        <p className="text-slate-500 text-sm mt-1">View your balances and request time off.</p>
                    </div>

                    <Button
                        onClick={() => setIsApplying(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Request Leave</span>
                    </Button>
                </div>

                {/* ── LEAVE SUMMARY DASHBOARD (Employee) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[9px] uppercase">Allocated</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Yearly Credits</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalAllocated} <span className="text-sm font-medium text-slate-400">Days</span></h3>
                        </div>
                        <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-blue-500" style={{ width: '100%' }} /></div>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase">Utilized</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Credits Consumed</p>
                            <h3 className="text-2xl font-black text-slate-900">{totalTaken} <span className="text-sm font-medium text-slate-400">Days</span></h3>
                        </div>
                        <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-emerald-500" style={{ width: `${(totalTaken / (totalAllocated || 1)) * 100}%` }} /></div>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[9px] uppercase">Pending</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Awaiting Decision</p>
                            <h3 className="text-2xl font-black text-slate-900">{myLeaves.filter(l => l.status === "Pending").length} <span className="text-sm font-medium text-slate-400">Reqs</span></h3>
                        </div>
                        <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-amber-500" style={{ width: '30%' }} /></div>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-indigo-900 text-white overflow-hidden group hover:shadow-lg transition-all border-none">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 rounded-xl bg-white/10 text-indigo-200">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <Badge className="bg-white/10 text-indigo-100 border-none font-bold text-[9px] uppercase">Available</Badge>
                            </div>
                            <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest leading-none mb-1">Current Liquidity</p>
                            <h3 className="text-2xl font-black text-white">{availableBalance} <span className="text-sm font-medium text-indigo-300">Days</span></h3>
                        </div>
                        <div className="h-1 bg-white/5 w-full"><div className="h-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" style={{ width: `${(availableBalance / (totalAllocated || 1)) * 100}%` }} /></div>
                    </Card>
                </div>

                {/* Balance & Insight Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Primary Balance Card */}
                    <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden relative group">
                        <CardHeader className="p-8 pb-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-black text-slate-900">Annual Leave Quota</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Fiscal Cycle {formatYearRange(currentYear)}</CardDescription>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                    <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-12">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                    <circle
                                        cx="80" cy="80" r="70"
                                        stroke="currentColor" strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * (totalTaken / (totalAllocated || 1)))}
                                        strokeLinecap="round"
                                        className="text-indigo-600 transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute text-center">
                                    <p className="text-3xl font-black text-slate-900">{Math.round((totalTaken / (totalAllocated || 1)) * 100)}%</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Utilized</p>
                                </div>
                            </div>

                            <div className="flex-1 w-full space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Net Allocated</p>
                                        <p className="text-2xl font-black text-slate-900">{totalAllocated}d</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Net Utilized</p>
                                        <p className="text-2xl font-black text-slate-900">{totalTaken}d</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Approval</p>
                                        <p className="text-2xl font-black text-amber-600">{myLeaves.filter(l => l.status === "Pending").length}d</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">Balance Remaining</p>
                                        <p className="text-2xl font-black text-indigo-900">{availableBalance}d</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${(availableBalance / (totalAllocated || 1)) * 100}%` }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Available Balance</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-indigo-500 uppercase">Session {formatYearRange(currentYear)}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {leaveTypes.map((type) => {
                                const currentYear = new Date().getFullYear();
                                const typeAllocated = myBalances.find(b => b.type === type.name && b.year === currentYear)?.balance || 0;
                                return (
                                    <div key={type.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", type.bg, type.color)}>
                                                <type.icon className="w-5 h-5" />
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm">{type.name}</p>
                                        </div>
                                        <p className="font-black text-slate-900">{typeAllocated}d</p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Leave History Table Area */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-indigo-500" />
                            Recent Activity
                        </h2>
                    </div>

                    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-none">
                                        <TableHead className="font-bold text-slate-500 px-6 py-4">Type</TableHead>
                                        <TableHead className="font-bold text-slate-500">Period</TableHead>
                                        <TableHead className="font-bold text-slate-500">Days</TableHead>
                                        <TableHead className="font-bold text-slate-500 text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {myLeaves.map(leave => (
                                        <TableRow key={leave.id}>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full",
                                                        leave.type === "Annual Leave" ? "bg-blue-500" :
                                                            leave.type === "Sick Leave" ? "bg-red-500" : "bg-orange-500"
                                                    )} />
                                                    <span className="font-semibold text-slate-900">{leave.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {new Date(leave.from).toLocaleDateString()}
                                                {leave.from !== leave.to && ` - ${new Date(leave.to).toLocaleDateString()}`}
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900">{leave.days}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold border-none",
                                                    leave.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                                                        leave.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                                                )}>
                                                    {leave.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {myLeaves.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-20">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <Calendar className="w-12 h-12 mb-2" />
                                                    <p className="font-bold">No leave history found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Leave Application Slide Panel / Modal Replacement */}
                <AnimatePresence>
                    {isApplying && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsApplying(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative bg-white w-full max-w-lg rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-slate-900">Request Leave</h2>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setIsApplying(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <form onSubmit={handleEmployeeRequest} className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500">Leave Category</Label>
                                        <select
                                            value={leaveType}
                                            onChange={e => setLeaveType(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                        >
                                            {leaveTypes.map(t => (
                                                <option key={t.name} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500">From Date</Label>
                                            <Input required type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} className="rounded-lg h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500">To Date</Label>
                                            <Input required type="date" min={leaveFrom} value={leaveTo} onChange={e => setLeaveTo(e.target.value)} className="rounded-lg h-10" />
                                        </div>
                                    </div>

                                    {leaveFrom && leaveTo && leaveFrom === leaveTo && (
                                        <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <SunMoon className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-700">Half Day Request</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={isHalfDay ? "corporate" : "outline"}
                                                    size="sm"
                                                    onClick={() => setIsHalfDay(!isHalfDay)}
                                                    className="h-8 rounded-md"
                                                >
                                                    {isHalfDay ? "On" : "Off"}
                                                </Button>
                                            </div>

                                            {isHalfDay && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={halfDayPeriod === "First Half" ? "corporate" : "outline"}
                                                        className="h-9 text-[10px] font-bold uppercase rounded-lg"
                                                        onClick={() => setHalfDayPeriod("First Half")}
                                                    >
                                                        <SunBase className="w-3 h-3 mr-2 text-amber-500" />
                                                        Morning
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={halfDayPeriod === "Second Half" ? "corporate" : "outline"}
                                                        className="h-9 text-[10px] font-bold uppercase rounded-lg"
                                                        onClick={() => setHalfDayPeriod("Second Half")}
                                                    >
                                                        <Moon className="w-3 h-3 mr-2 text-blue-500" />
                                                        Afternoon
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500">Reason</Label>
                                        <Input required value={leaveDescription} onChange={e => setLeaveDescription(e.target.value)} placeholder="Short reason..." className="rounded-lg h-10" />
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <span className="text-xs font-bold text-slate-500">Total days: {calcDays(leaveFrom, leaveTo)}</span>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="ghost" className="rounded-lg px-6" onClick={() => setIsApplying(false)}>Cancel</Button>
                                            <Button type="submit" disabled={submitLoading} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-8">
                                                {submitLoading ? "Submitting..." : "Submit"}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ── EMPLOYER VIEW (SLIGHTLY REDESIGNED) ──────────────────────────────────────────
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

            {/* ── LEAVE SUMMARY DASHBOARD (Employer) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                                <Users className="w-5 h-5" />
                            </div>
                            <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[9px] uppercase">Staff Strength</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Workforce</p>
                        <h3 className="text-2xl font-black text-slate-900">{employees.filter(e => e.status === "Active").length} <span className="text-sm font-medium text-slate-400">Members</span></h3>
                    </div>
                    <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-slate-900" style={{ width: '100%' }} /></div>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <SunMoon className="w-5 h-5" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase">Off Today</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Physical Absences</p>
                        <h3 className="text-2xl font-black text-slate-900">
                            {leaves.filter(l => l.status === "Approved" &&
                                new Date().toISOString().split('T')[0] >= l.from &&
                                new Date().toISOString().split('T')[0] <= l.to
                            ).length} <span className="text-sm font-medium text-slate-400">Staff</span>
                        </h3>
                    </div>
                    <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-emerald-500" style={{ width: '15%' }} /></div>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[9px] uppercase">Attention</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Pending Authorizations</p>
                        <h3 className="text-2xl font-black text-slate-900">{leaves.filter(l => l.status === "Pending").length} <span className="text-sm font-medium text-slate-400">Total</span></h3>
                    </div>
                    <div className="h-1 bg-slate-100 w-full"><div className="h-full bg-amber-500" style={{ width: '60%' }} /></div>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden group hover:shadow-lg transition-all border-none">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 rounded-xl bg-white/10 text-slate-200">
                                <Activity className="w-5 h-5" />
                            </div>
                            <Badge className="bg-white/10 text-slate-100 border-none font-bold text-[9px] uppercase">Health</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Org Attendance Rate</p>
                        <h3 className="text-2xl font-black text-white">98.4% <span className="text-sm font-medium text-slate-500">Avg</span></h3>
                    </div>
                    <div className="h-1 bg-white/5 w-full"><div className="h-full bg-emerald-400" style={{ width: '98%' }} /></div>
                </Card>
            </div>



            <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" />
                    Workforce
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {employees.filter(e => e.status === "Active").map(emp => (
                        <Card key={emp.id} className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate text-sm">{emp.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{emp.role}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Allocated</p>
                                        <p className="font-bold text-sm text-slate-900">{getEmpTotalAllocated(emp.email)}</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Used</p>
                                        <p className="font-bold text-sm text-slate-900">{getEmpTotalTaken(emp.email)}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-9 rounded-lg text-xs font-semibold"
                                        onClick={() => setAllocateModalEmpEmail(emp.email)}
                                    >
                                        Allocate
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg border border-slate-200"
                                        onClick={() => {
                                            setCalendarUserEmail(emp.email);
                                            setIsCalendarOpen(true);
                                        }}
                                    >
                                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-lg border border-slate-200"
                                        onClick={() => {
                                            setManagingUserEmail(emp.email);
                                            setIsManagingBalances(true);
                                        }}
                                    >
                                        <User className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Pending Approvals Section */}
            <div className="space-y-6 pt-10">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <AlertCircle className="w-7 h-7 text-amber-500" />
                        Pending Authorization
                    </h2>
                </div>

                <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-none">
                                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest px-8 h-16">Name</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Request Category</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Duration</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16">Days</TableHead>
                                    <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest h-16 text-right pr-8">Decision</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaves.filter(l => l.status === "Pending").map(leave => (
                                    <TableRow key={leave.id} className="border-slate-50 transition-colors">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                                                    {leave.empName?.[0]}
                                                </div>
                                                <p className="font-black text-slate-800 text-xs uppercase tracking-tight">{leave.empName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs font-bold text-slate-600">{leave.type}</p>
                                            {leave.description && <p className="text-[10px] text-slate-400 italic max-w-xs truncate mt-0.5">{leave.description}</p>}
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-black text-slate-900">{leave.days}</TableCell>
                                        <TableCell className="text-right pr-8 py-5">
                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="w-10 h-10 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                    onClick={() => rejectLeaveRequest(leave.id!)}
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="corporate"
                                                    className="h-10 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-100"
                                                    onClick={() => approveLeaveRequest(leave.id!)}
                                                >
                                                    Authorize
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {leaves.filter(l => l.status === "Pending").length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center opacity-10">
                                                <CheckCircle2 className="w-16 h-16 mb-4" />
                                                <p className="text-2xl font-black uppercase tracking-[0.2em]">All Authorizations Clear</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            <AnimatePresence>
                {allocateModalEmpEmail && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setAllocateModalEmpEmail("")} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden border border-slate-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Allocate Credits</h3>
                                <Button variant="ghost" size="icon-sm" onClick={() => setAllocateModalEmpEmail("")}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500">Academic/Financial Year</Label>
                                    <select
                                        value={allocateYear}
                                        onChange={e => setAllocateYear(Number(e.target.value))}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    >
                                        {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                                            <option key={y} value={y}>{formatYearRange(y)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500">Leave Category</Label>
                                    <select
                                        value={allocateType}
                                        onChange={e => setAllocateType(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                                    >
                                        {leaveTypes.map(t => (
                                            <option key={t.name} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500">Days to Credit</Label>
                                    <Input type="number" className="h-10 rounded-lg text-center font-bold" value={allocateDays} onChange={e => setAllocateDays(e.target.value)} placeholder="0" />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="ghost" className="flex-1 h-10 rounded-lg text-xs font-bold" onClick={() => setAllocateModalEmpEmail("")}>Cancel</Button>
                                    <Button className="flex-1 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold" onClick={handleEmployerAllocate}>Add Credits</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isManagingBalances && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsManagingBalances(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden border border-slate-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Manage Allocations</h3>
                                    <p className="text-xs text-slate-500">{managingUserEmail}</p>
                                </div>
                                <Button variant="ghost" size="icon-sm" onClick={() => setIsManagingBalances(false)}><X className="w-5 h-5" /></Button>
                            </div>
                            <div className="p-6">
                                <div className="overflow-hidden border border-slate-100 rounded-lg">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="text-[10px] font-bold uppercase">Year</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase">Type</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase">Balance</TableHead>
                                                <TableHead className="text-right"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaveBalances.filter(b => b.empEmail === managingUserEmail).map(bal => (
                                                <TableRow key={bal.id}>
                                                    <TableCell className="font-bold text-slate-700">{formatYearRange(bal.year)}</TableCell>
                                                    <TableCell className="text-sm">{bal.type}</TableCell>
                                                    <TableCell className="font-bold text-slate-900">{bal.balance}d</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={async () => {
                                                                await deleteLeaveBalance(bal.id!);
                                                                toast.success("Balance removed");
                                                            }}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {leaveBalances.filter(b => b.empEmail === managingUserEmail).length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">No historical allocations found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {isCalendarOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsCalendarOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-slate-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-slate-900">Leave Calendar</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{calendarUserEmail}</p>
                                </div>
                                <Button variant="ghost" size="icon-sm" onClick={() => setIsCalendarOpen(false)}><X className="w-5 h-5" /></Button>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <Button variant="ghost" size="icon-sm" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))}>
                                        <Check className="w-4 h-4 rotate-180" />
                                    </Button>
                                    <span className="font-bold text-sm text-slate-900">
                                        {currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <Button variant="ghost" size="icon-sm" onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                                    {Array.from({ length: new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                        const day = i + 1;
                                        const dateStr = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth(), day).toISOString().split('T')[0];
                                        const isTaken = leaves.some(l => l.empEmail === calendarUserEmail && l.status === "Approved" && dateStr >= l.from && dateStr <= l.to);
                                        return (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "aspect-square flex items-center justify-center text-xs rounded-lg transition-all",
                                                    isTaken ? "bg-emerald-500 text-white font-bold shadow-sm" : "hover:bg-slate-50 text-slate-600"
                                                )}
                                            >
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Approved Leave Day</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-900">{leaves.filter(l => l.empEmail === calendarUserEmail && l.status === "Approved" && new Date(l.from).getMonth() === currentCalDate.getMonth()).length} Request(s) this month</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
