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
import { X, CalendarDays, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function LeavesPage() {
    const { role, user } = useAuth();
    const { employees, leaves, requestLeave, leaveBalances, bulkAddLeaveBalances, approveLeaveRequest, rejectLeaveRequest } = useApp();

    const [showForm, setShowForm] = useState(false);

    // Employee states
    const [leaveType, setLeaveType] = useState("Annual Leave");
    const [leaveFrom, setLeaveFrom] = useState("");
    const [leaveTo, setLeaveTo] = useState("");
    const [leaveDescription, setLeaveDescription] = useState("");

    // Employer states
    const [allocateModalEmpEmail, setAllocateModalEmpEmail] = useState("");
    const [allocateDays, setAllocateDays] = useState("");

    // MVP view logic
    const calcDays = (from: string, to: string) => {
        if (!from || !to) return 0;
        return Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000 + 1));
    };

    const handleEmployeeRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leaveFrom || !leaveTo) return;
        const days = calcDays(leaveFrom, leaveTo);

        await requestLeave({
            empName: user?.email?.split("@")[0] || "Employee",
            empEmail: user?.email || "",
            type: leaveType,
            days,
            from: leaveFrom,
            to: leaveTo,
            status: "Pending",
            description: leaveDescription
        });
        toast.success("Leave Requested successfully.");
        setShowForm(false);
        setLeaveFrom("");
        setLeaveTo("");
        setLeaveDescription("");
    };

    const handleEmployerAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        const days = Number(allocateDays);
        if (days <= 0 || !allocateModalEmpEmail) return;

        await bulkAddLeaveBalances([{ empEmail: allocateModalEmpEmail, balance: days, type: "Annual Leave" }]);
        toast.success(`Allocated ${days} days.`);
        setAllocateModalEmpEmail("");
        setAllocateDays("");
    };

    if (role === "employee") {
        const myLeaves = leaves.filter(l => l.empEmail === user?.email);
        const myBalances = leaveBalances.filter(b => b.empEmail === user?.email);

        const totalLeavesInAccount = myBalances.reduce((acc, b) => acc + b.balance, 0);
        const totalLeavesTaken = myLeaves.filter(l => l.status === "Approved").reduce((acc, l) => acc + (l.days || 0), 0);

        return (
            <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Leaves</h1>
                        <p className="text-sm text-slate-500">Manage your leave balance and applications.</p>
                    </div>
                    <Button variant="corporate" onClick={() => setShowForm(true)} className="rounded-lg">
                        <Plus className="w-4 h-4 mr-2" /> Request Leave
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Leaves in Account</p>
                                <p className="text-2xl font-bold text-slate-900">{totalLeavesInAccount} Days</p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Leaves Taken</p>
                                <p className="text-2xl font-bold text-rose-600">{totalLeavesTaken} Days</p>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {showForm && (
                    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-base font-bold">New Leave Request</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleEmployeeRequest} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-sm font-semibold">Leave Type</Label>
                                    <select
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                                        value={leaveType}
                                        onChange={e => setLeaveType(e.target.value)}
                                    >
                                        <option>Annual Leave</option>
                                        <option>Sick Leave</option>
                                        <option>Casual Leave</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Start Date</Label>
                                    <Input required type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">End Date</Label>
                                    <Input required type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label className="text-sm font-semibold">Reason</Label>
                                    <Input required value={leaveDescription} onChange={e => setLeaveDescription(e.target.value)} />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                                    <Button type="submit" variant="corporate">Submit Request</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <CardTitle className="text-base font-bold">My Leave History</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myLeaves.map(leave => (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-semibold">{leave.type}</TableCell>
                                    <TableCell>{new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}</TableCell>
                                    <TableCell>{leave.days}</TableCell>
                                    <TableCell>
                                        <Badge variant={leave.status === "Approved" ? "success" : leave.status === "Pending" ? "warning" : "destructive"}>
                                            {leave.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {myLeaves.length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">No requests found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        );
    }

    // Employer View
    const getEmpTotalAllocated = (email: string) => leaveBalances.filter(b => b.empEmail === email).reduce((acc, b) => acc + b.balance, 0);
    const getEmpTotalTaken = (email: string) => leaves.filter(l => l.empEmail === email && l.status === "Approved").reduce((acc, l) => acc + (l.days || 0), 0);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Leaves Dashboard</h1>
                <p className="text-sm text-slate-500">Manage employee leave accounts and requests.</p>
            </div>

            {/* Employee Cards List */}
            <div>
                <h2 className="text-lg font-bold mb-4">Employee Leave Accounts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees.filter(e => e.status === "Active").map(emp => (
                        <Card key={emp.id} className="border-slate-200 shadow-sm rounded-xl hover:border-indigo-300 transition-colors">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Allocated</p>
                                        <p className="font-semibold text-slate-900">{getEmpTotalAllocated(emp.email)} Days</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Taken</p>
                                        <p className="font-semibold text-rose-600">{getEmpTotalTaken(emp.email)} Days</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full text-xs font-bold"
                                    onClick={() => setAllocateModalEmpEmail(emp.email)}
                                >
                                    Allocate Leaves
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Pending Requests Table */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden mt-8">
                <CardHeader className="bg-slate-50/50 border-b p-5">
                    <CardTitle className="text-base font-bold">Pending Approvals</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaves.filter(l => l.status === "Pending").map(leave => (
                                <TableRow key={leave.id}>
                                    <TableCell className="font-semibold">{leave.empName}</TableCell>
                                    <TableCell>{leave.type}</TableCell>
                                    <TableCell>{new Date(leave.from).toLocaleDateString()} - {new Date(leave.to).toLocaleDateString()}</TableCell>
                                    <TableCell>{leave.days}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon-sm" variant="ghost" className="text-rose-500" onClick={() => rejectLeaveRequest(leave.id!)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="corporate" onClick={() => approveLeaveRequest(leave.id!)}>Approve</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {leaves.filter(l => l.status === "Pending").length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-slate-500">No pending leave requests.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Allocation Modal */}
            <AnimatePresence>
                {allocateModalEmpEmail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-5 border-b flex items-center justify-between">
                                <h3 className="font-bold">Allocate Annual Leaves</h3>
                                <button onClick={() => setAllocateModalEmpEmail("")} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Total Additional Days</Label>
                                    <Input type="number" value={allocateDays} onChange={e => setAllocateDays(e.target.value)} placeholder="e.g. 15" />
                                </div>
                                <Button className="w-full" variant="corporate" onClick={handleEmployerAllocate}>Add Allocation</Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
