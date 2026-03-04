"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Download, CreditCard, ShieldCheck, Wallet, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useState } from "react";

export default function PayslipsPage() {
    const { role, user } = useAuth();
    const { requestPayslip, payroll } = useApp();
    const [requesting, setRequesting] = useState(false);

    if (role !== "employee") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">This terminal is only available for personal employee compensation history.</p>
            </div>
        );
    }

    const myPayslips = payroll.filter(p => p.empEmail === user?.email).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPayslip = myPayslips.length > 0 ? myPayslips[0] : null;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Compensation Records</h1>
                    <p className="text-sm text-slate-500">Secure access to your historical payslips and earnings.</p>
                </div>
                <Button
                    variant="corporate"
                    className="rounded-lg shadow-sm"
                    disabled={requesting}
                    onClick={async () => {
                        if (user?.email) {
                            setRequesting(true);
                            await requestPayslip(user.email);
                            toast.success("Payslip Requested", { description: "HR has been notified to generate your latest payslip." });
                            setTimeout(() => setRequesting(false), 2000);
                        }
                    }}
                >
                    <Send className="w-4 h-4 mr-2" /> {requesting ? "Requesting..." : "Request Latest Payslip"}
                </Button>
            </div>

            {/* ── Snapshot ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-slate-900 text-white">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-white/10">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Latest Net Earnings</p>
                            <p className="text-xl font-bold">{latestPayslip ? latestPayslip.amount : "₹0"}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Last Disbursement</p>
                            <p className="text-xl font-bold text-slate-900">{latestPayslip ? latestPayslip.date : "N/A"}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── History Table ── */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-5">
                    <div>
                        <CardTitle className="text-base font-bold">Earnings History</CardTitle>
                        <CardDescription className="text-xs">Securely download your monthly salary statements.</CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                <TableHead className="h-10">Statement ID</TableHead>
                                <TableHead className="h-10">Disbursement Date</TableHead>
                                <TableHead className="h-10">Total Paid</TableHead>
                                <TableHead className="h-10">Status</TableHead>
                                <TableHead className="h-10 text-right">View/Download</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myPayslips.map((ps) => (
                                <TableRow key={ps.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-4 text-[10px] font-bold text-slate-400 font-mono">
                                        {ps.transactionId || ps.id?.slice(-8).toUpperCase()}
                                    </TableCell>
                                    <TableCell className="py-4 text-xs font-medium text-slate-500">
                                        {ps.date}
                                    </TableCell>
                                    <TableCell className="py-4 font-bold text-slate-900">
                                        {ps.amount}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="success" className="rounded-md font-bold text-[10px] h-5 px-2 uppercase shadow-none ring-0">
                                            {ps.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-primary rounded-lg">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {myPayslips.length === 0 && (
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
        </div>
    );
}
