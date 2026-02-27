"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Download, CheckCircle2, IndianRupee, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PayrollPage() {
    const { role } = useAuth();
    const { payroll, processPayroll, payslipRequests, fulfillPayslipRequest } = useApp();

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Only administrative accounts can access the organization&apos;s payroll data.</p>
            </div>
        );
    }

    const totalPayroll = payroll.reduce((acc, pr) => {
        return acc + parseFloat(pr.amount.replace(/[^0-9.-]+/g, ""));
    }, 0);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Payroll Processing</h1>
                    <p className="text-sm text-slate-500">Manage salary disbursement and departmental budgets.</p>
                </div>
                <Button
                    className="rounded-lg shadow-sm"
                    variant="corporate"
                    onClick={processPayroll}
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Execute Salary Run
                </Button>
            </div>

            {/* ── Financial Indicators ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: "Total Multi-Period Expense", value: `₹${totalPayroll.toLocaleString('en-IN')}`, icon: Wallet, desc: "Cumulative payroll expenditure", color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Departmental Allocation", value: "₹0.00", icon: CreditCard, desc: "Awaiting next cycle review", color: "text-amber-600", bg: "bg-amber-50" },
                    { title: "Withholding (Est.)", value: `₹${(totalPayroll * 0.1).toLocaleString('en-IN')}`, icon: IndianRupee, desc: "Projected tax and statutory deductions", color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Transaction History & Requests ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 border-slate-200 shadow-sm rounded-xl overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <div>
                            <CardTitle className="text-base font-bold">Transaction Registry</CardTitle>
                            <CardDescription className="text-xs">Verification logs for all processed salary events.</CardDescription>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                    <TableHead className="h-10">TID / ID</TableHead>
                                    <TableHead className="h-10">Beneficiary</TableHead>
                                    <TableHead className="h-10">Net Amount</TableHead>
                                    <TableHead className="h-10">Process Date</TableHead>
                                    <TableHead className="h-10">Status</TableHead>
                                    <TableHead className="h-10 text-right">Records</TableHead>
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
                                            <div className="text-[11px] text-slate-500">{pr.department}</div>
                                        </TableCell>
                                        <TableCell className="py-4 font-bold text-slate-900">
                                            {pr.amount}
                                        </TableCell>
                                        <TableCell className="py-4 text-xs font-medium text-slate-500">
                                            {pr.date}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={pr.status === "Paid" ? "success" : "warning"} className="rounded-md font-bold text-[10px] h-5 px-2">
                                                {pr.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-primary rounded-lg">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payroll.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <CreditCard className="w-8 h-8" />
                                                <p className="text-sm font-medium">No payroll history found. Execute a Salary Run to begin.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* ── Payslip Requests Section ── */}
                <Card className="xl:col-span-1 border-slate-200 shadow-sm rounded-xl bg-white h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Service Requests</CardTitle>
                                <CardDescription className="text-xs">Employee requests for payslips/documents.</CardDescription>
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
                                    <p className="text-[10px] uppercase">All employee inquiries resolved.</p>
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
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4 bg-indigo-50 border-indigo-100 text-indigo-700">
                                                            {req.month}
                                                        </Badge>
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            {new Date(req.requestedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {req.status === "Pending" ? (
                                                <Button
                                                    size="sm"
                                                    variant="corporate"
                                                    className="h-8 text-[10px] px-3 font-bold"
                                                    onClick={() => fulfillPayslipRequest(req.id!, req.empEmail)}
                                                >
                                                    Send Payslip
                                                </Button>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px]">
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
        </div>
    );
}
