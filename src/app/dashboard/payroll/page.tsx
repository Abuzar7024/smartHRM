"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ShieldCheck, IndianRupee, CreditCard, Download, User, X, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function PayrollPage() {
    const { role } = useAuth();
    const { employees, updateEmployee, processSinglePayroll, payroll, payslipRequests, fulfillPayslipRequest } = useApp();

    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
    const [ctc, setCtc] = useState("");
    const [pf, setPf] = useState("");
    const [tds, setTds] = useState("");
    const [insuranceOpted, setInsuranceOpted] = useState(false);
    const [insuranceAmount, setInsuranceAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Only administrative accounts can access the organization&apos;s payroll data.</p>
            </div>
        );
    }

    const openDisburseModal = (emp: Employee) => {
        setSelectedEmp(emp);
        setCtc(emp.ctc || "");
        setPf(emp.pf || "");
        setTds(emp.tds || "");
        setInsuranceOpted(emp.insuranceOpted || false);
        setInsuranceAmount(emp.insuranceAmount || "");
    };

    const handleDisburse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmp?.id) return;

        setIsSubmitting(true);
        try {
            await updateEmployee(selectedEmp.id, {
                ctc,
                pf,
                tds,
                insuranceOpted,
                insuranceAmount
            });

            await processSinglePayroll({
                ...selectedEmp,
                ctc, pf, tds, insuranceOpted, insuranceAmount
            });

            // Automatically fulfill any pending payslip request for this employee
            const pendingReq = payslipRequests.find(r => r.empEmail === selectedEmp.email && r.status === "Pending");
            if (pendingReq && pendingReq.id) {
                await fulfillPayslipRequest(pendingReq.id, selectedEmp.email);
            }

            toast.success("Payslip generated and disbursed successfully.");
            setSelectedEmp(null);
        } catch (err) {
            toast.error("Failed to disburse salary.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Payroll Processing</h1>
                <p className="text-sm text-slate-500">Manage salary disbursement and departmental budgets.</p>
            </div>

            {/* ── Employee Selection for Disbursement ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Employee Directory</h2>
                    <Badge variant="outline" className="text-slate-500 bg-white">Select an employee to disburse</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {employees.filter(e => e.status === "Active").map(emp => {
                        const hasPendingRequest = payslipRequests.some(r => r.empEmail === emp.email && r.status === "Pending");
                        return (
                            <Card key={emp.id} className={cn("cursor-pointer transition-all overflow-hidden", hasPendingRequest ? "border-amber-300 shadow-md shadow-amber-100" : "hover:border-slate-300")} onClick={() => openDisburseModal(emp)}>
                                <CardContent className="p-4 flex items-center justify-between gap-3 border-b-0 overflow-hidden">
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0", hasPendingRequest ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{emp.department}</p>
                                        </div>
                                    </div>
                                    {hasPendingRequest && (
                                        <div className="shrink-0 flex items-center gap-1 bg-amber-500 text-white font-bold text-[9px] px-2 py-1 rounded-md shadow-sm animate-pulse">
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="hidden sm:inline-block">PENDING</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                    {employees.filter(e => e.status === "Active").length === 0 && (
                        <p className="text-sm text-slate-500 italic col-span-full bg-slate-50 p-6 rounded-lg text-center border border-dashed border-slate-200">No active employees found to disburse salary to.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border-slate-200 shadow-sm rounded-xl overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <CardTitle className="text-base font-bold">Transaction Registry</CardTitle>
                        <CardDescription className="text-xs">Verification logs for all processed salary events.</CardDescription>
                    </CardHeader>
                    <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                        <Table className="min-w-[600px] w-full">
                            <TableHeader>
                                <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                    <TableHead className="h-10">TID</TableHead>
                                    <TableHead className="h-10">Beneficiary</TableHead>
                                    <TableHead className="h-10">Net Amount</TableHead>
                                    <TableHead className="h-10">Date</TableHead>
                                    <TableHead className="h-10">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.map((pr) => (
                                    <TableRow key={pr.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-4 text-[10px] font-bold text-slate-400 font-mono">
                                            {pr.transactionId || pr.id?.slice(-8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-slate-900">{pr.name}</div>
                                            <div className="text-[11px] text-slate-500">{pr.empEmail}</div>
                                        </TableCell>
                                        <TableCell className="py-4 font-bold text-slate-900">{pr.amount}</TableCell>
                                        <TableCell className="py-4 text-xs font-medium text-slate-500">{pr.date}</TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={pr.status === "Paid" ? "success" : "warning"} className="rounded-md font-bold text-[10px] h-5 px-2">
                                                {pr.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payroll.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <CreditCard className="w-8 h-8" />
                                                <p className="text-sm font-medium">No payroll history found.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Payslip Requests */}
                <Card className="xl:col-span-1 border-slate-200 shadow-sm rounded-xl bg-white h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Service Requests</CardTitle>
                                <CardDescription className="text-xs">Employee payslip requests.</CardDescription>
                            </div>
                            <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-bold">
                                {payslipRequests.filter(r => r.status === "Pending").length} NEW
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {payslipRequests.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <IndianRupee className="w-8 h-8 mx-auto opacity-20 mb-3" />
                                    <p className="text-sm font-semibold">No pending requests</p>
                                </div>
                            ) : (
                                payslipRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()).map((req) => (
                                    <div key={req.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px] flex-shrink-0">
                                                    {(req.empName?.[0] || "?").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{req.empName}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{req.empEmail}</p>
                                                    <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4 mt-1 bg-indigo-50 text-indigo-700">
                                                        {req.month}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {req.status === "Pending" ? (
                                                <Button size="sm" variant="corporate" className="h-8 text-[10px] px-3 font-bold" onClick={() => fulfillPayslipRequest(req.id!, req.empEmail)}>
                                                    Send
                                                </Button>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-600 font-bold text-[9px]">
                                                    FULFILLED
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Disburse Modal */}
            <AnimatePresence>
                {selectedEmp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Disburse Salary</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {selectedEmp.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEmp(null)}
                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="disburseForm" onSubmit={handleDisburse} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Annual CTC (₹)</Label>
                                        <Input
                                            type="number"
                                            required
                                            value={ctc}
                                            onChange={e => setCtc(e.target.value)}
                                            placeholder="e.g. 1200000"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">PF Deduction (₹)</Label>
                                            <Input
                                                type="number"
                                                value={pf}
                                                onChange={e => setPf(e.target.value)}
                                                placeholder="e.g. 1800"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">TDS Deduction (₹)</Label>
                                            <Input
                                                type="number"
                                                value={tds}
                                                onChange={e => setTds(e.target.value)}
                                                placeholder="e.g. 5000"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="optInsurance"
                                                checked={insuranceOpted}
                                                onChange={e => setInsuranceOpted(e.target.checked)}
                                                className="rounded border-slate-300 w-4 h-4 text-primary"
                                            />
                                            <Label htmlFor="optInsurance" className="cursor-pointer text-sm font-semibold text-slate-700">Health Insurance Opt-In</Label>
                                        </div>
                                        {insuranceOpted && (
                                            <div className="pl-7 space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-500">Monthly Deduction (₹)</Label>
                                                <Input
                                                    type="number"
                                                    value={insuranceAmount}
                                                    onChange={e => setInsuranceAmount(e.target.value)}
                                                    placeholder="e.g. 1200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                <span className={cn("text-xs font-semibold", ctc ? "text-slate-600" : "text-slate-400")}>
                                    Net Salary: {ctc ? "₹" + Math.round(Math.max(0, (Number(ctc) / 12) - Number(pf || 0) - Number(tds || 0) - (insuranceOpted ? Number(insuranceAmount || 0) : 0))).toLocaleString('en-IN') : "-"}
                                </span>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setSelectedEmp(null)}>Cancel</Button>
                                    <Button type="submit" form="disburseForm" variant="corporate" disabled={isSubmitting}>
                                        {isSubmitting ? "Processing..." : "Generate Payslip"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
