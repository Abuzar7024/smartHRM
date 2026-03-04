"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Casual Leave"];

export default function AllocateLeavePage() {
    const { user, role } = useAuth();
    const { employees, addLeaveBalance } = useApp();

    // RBAC: employers always allowed; employees need allocate_leave permission
    const myEmpDoc = employees.find(e => e.email === user?.email);
    const canAllocateLeave =
        role?.toLowerCase() === "employer" ||
        (myEmpDoc?.permissions ?? []).includes("allocate_leave");

    const [selectedEmp, setSelectedEmp] = useState<string>("");
    const [leaveType, setLeaveType] = useState<string>("Annual Leave");
    const [balance, setBalance] = useState<string>("");

    const employeeOptions = useMemo(
        () => employees.filter(e => e.role === "employee"),
        [employees]
    );

    const handleSubmit = async () => {
        if (!canAllocateLeave) {
            toast.error("Permission Denied", {
                description: "You do not have the allocate_leave permission.",
            });
            return;
        }
        if (!selectedEmp || !balance) {
            toast.error("Missing fields", { description: "Select employee and enter balance." });
            return;
        }
        const numericBal = Number(balance);
        if (isNaN(numericBal) || numericBal < 0) {
            toast.error("Invalid balance", { description: "Enter a positive number." });
            return;
        }
        try {
            await addLeaveBalance({
                empEmail: selectedEmp,
                type: leaveType,
                balance: numericBal,
                year: new Date().getFullYear(),
            });
            toast.success("Leave balance allocated", {
                description: `${selectedEmp} now has ${numericBal} days of ${leaveType}`,
            });
            setSelectedEmp("");
            setBalance("");
        } catch (e: any) {
            if (e?.status === 403 || e?.message?.includes("Permission denied")) {
                toast.error("Permission Denied", {
                    description: "Backend rejected: missing allocate_leave permission.",
                });
            } else {
                console.error(e);
                toast.error("Failed to allocate", { description: "Check console for details." });
            }
        }
    };

    if (!canAllocateLeave) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50/30 p-6">
                <div className="text-center p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 max-w-sm w-full">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                        🚫
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-sm font-medium text-slate-500">
                        You do not have the{" "}
                        <code className="bg-slate-100 px-1 rounded">allocate_leave</code>{" "}
                        permission. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <Card className="shadow-lg rounded-2xl border-slate-100">
                <CardHeader>
                    <CardTitle className="text-xl font-black">Allocate Leave Balance</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Grant leave days to an employee for a specific leave type.
                    </p>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Employee selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Employee
                        </label>
                        <select
                            value={selectedEmp}
                            onChange={e => setSelectedEmp(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Select employee…</option>
                            {employeeOptions.map(emp => (
                                <option key={emp.email} value={emp.email}>
                                    {emp.name || emp.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Leave type */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Leave Type
                        </label>
                        <select
                            value={leaveType}
                            onChange={e => setLeaveType(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {LEAVE_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Balance input */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Number of Days
                        </label>
                        <Input
                            type="number"
                            placeholder="e.g. 12"
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            min={0}
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    >
                        Allocate Balance
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
