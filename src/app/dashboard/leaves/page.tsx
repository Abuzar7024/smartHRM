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
import { X, CalendarDays, Users, CheckCircle, Clock, AlertTriangle, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeavesPage() {
    const { role, user } = useAuth();
    const { employees, leaves, requestLeave, updateLeaveStatus, updateLeaveBalance } = useApp();

    const [showForm, setShowForm] = useState(false);
    const [selectedEmpEmail, setSelectedEmpEmail] = useState("");
    const [leaveType, setLeaveType] = useState("Sick Leave");
    const [leaveFrom, setLeaveFrom] = useState("");
    const [leaveTo, setLeaveTo] = useState("");
    const [leaveDescription, setLeaveDescription] = useState("");
    const [leaveDaysAllocation, setLeaveDaysAllocation] = useState(0);

    const displayLeaves = role === "employer"
        ? leaves
        : leaves.filter(l => l.empEmail === user?.email);

    const handleRequest = (e: React.FormEvent) => {
        e.preventDefault();

        if (role === "employer") {
            if (!selectedEmpEmail || leaveDaysAllocation <= 0) return;
            const targetEmp = employees.find(e => e.email === selectedEmpEmail);
            if (!targetEmp || !targetEmp.id) return;

            // Assign numerical leave balance
            updateLeaveBalance(targetEmp.id, leaveDaysAllocation);
            setShowForm(false);
            setSelectedEmpEmail("");
            setLeaveDaysAllocation(0);
            return;
        }

        // Employee request logic
        if (!leaveFrom || !leaveTo) return;
        requestLeave({
            empName: user?.email?.split('@')[0] || "Employee",
            empEmail: user?.email || "",
            type: leaveType,
            from: leaveFrom,
            to: leaveTo,
            status: "Pending",
            description: leaveDescription
        });
        setShowForm(false);
        setLeaveFrom("");
        setLeaveTo("");
        setLeaveDescription("");
    };

    // Stats
    const approvedAnnual = displayLeaves.filter(l => l.type === "Annual Leave" && l.status === "Approved").length;
    const approvedSick = displayLeaves.filter(l => l.type === "Sick Leave" && l.status === "Approved").length;
    const totalRequestsCount = displayLeaves.length;
    const myLeaveBalance = role === "employee" ? (employees.find(e => e.email === user?.email)?.leaveBalance || 0) : null;

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
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Balance</p>
                                <p className="text-xl font-bold text-slate-900">{myLeaveBalance} Days</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {[
                    { label: "Total Requests", value: totalRequestsCount, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Annual Leave", value: approvedAnnual, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Sick Leave", value: approvedSick, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    ...(role === "employer" ? [{ label: "Alerts", value: displayLeaves.filter(l => l.status === "Pending").length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" }] : [])
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

            {/* ── Request Form ── */}
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
                                    {role === "employer" ? "Set the total number of allowed leave days for an employee." : "Complete the details below to request a leave."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {role === "employer" ? (
                                        <>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-sm font-semibold">Employee</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={selectedEmpEmail}
                                                    onChange={(e) => setSelectedEmpEmail(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select employee</option>
                                                    {employees.map(emp => (
                                                        <option key={emp.id} value={emp.email}>{emp.name} ({emp.email})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-semibold">Total Days Allocated</Label>
                                                <Input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    placeholder="e.g. 20"
                                                    className="rounded-lg"
                                                    value={leaveDaysAllocation}
                                                    onChange={e => setLeaveDaysAllocation(Number(e.target.value))}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-semibold">Leave Type</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                    value={leaveType}
                                                    onChange={(e) => setLeaveType(e.target.value)}
                                                >
                                                    <option>Sick Leave</option>
                                                    <option>Annual Leave</option>
                                                    <option>Unpaid Leave</option>
                                                    <option>Half Day Leave</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm font-semibold">Start Date</Label>
                                                <Input
                                                    required
                                                    type="date"
                                                    className="rounded-lg"
                                                    value={leaveFrom}
                                                    onChange={e => setLeaveFrom(e.target.value)}
                                                />
                                            </div>
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
                                            <div className="space-y-1.5 lg:col-span-3">
                                                <Label className="text-sm font-semibold">Reason / Notes</Label>
                                                <Input
                                                    required
                                                    className="rounded-lg"
                                                    placeholder="Provide context for this leave..."
                                                    value={leaveDescription}
                                                    onChange={e => setLeaveDescription(e.target.value)}
                                                />
                                            </div>
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

            {/* ── Table / List ── */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-4 md:p-6 bg-slate-50/50 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold">Leave History</CardTitle>
                        <CardDescription>View and manage {role === "employer" ? "all" : "your"} leave applications.</CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                {role === "employer" && <TableHead className="w-[200px] h-10">Employee</TableHead>}
                                <TableHead className="h-10">Type</TableHead>
                                <TableHead className="h-10">Period</TableHead>
                                <TableHead className="h-10">Status</TableHead>
                                {role === "employer" && <TableHead className="h-10 text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayLeaves.map((leave) => (
                                <TableRow key={leave.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    {role === "employer" && (
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-slate-900">{leave.empName}</div>
                                            <div className="text-[11px] text-slate-500">{leave.empEmail}</div>
                                        </TableCell>
                                    )}
                                    <TableCell className="py-4">
                                        <div className="font-medium text-slate-800">{leave.type}</div>
                                        <div className="text-xs text-slate-400 italic line-clamp-1 truncate max-w-[200px]">
                                            "{leave.description || "No notes"}"
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="text-sm font-medium text-slate-700">
                                            {new Date(leave.from).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                                            to {new Date(leave.to).toLocaleDateString()}
                                        </div>
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
                                                            onClick={() => updateLeaveStatus(leave.id!, "Denied")}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="corporate"
                                                            className="h-8 text-[11px] rounded-lg shadow-none"
                                                            onClick={() => updateLeaveStatus(leave.id!, "Approved")}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                            {displayLeaves.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={role === "employer" ? 5 : 3} className="text-center py-20 text-slate-400">
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
        </div>
    );
}
