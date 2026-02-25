"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Download, CreditCard, ShieldCheck, Wallet, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { useState } from "react";

const mockPayslips = [
    { id: "PS-042024", period: "April 2024", date: "April 28, 2024", netPay: "₹142,000.00", status: "Processed" },
    { id: "PS-032024", period: "March 2024", date: "March 28, 2024", netPay: "₹140,500.00", status: "Processed" },
    { id: "PS-022024", period: "February 2024", date: "February 28, 2024", netPay: "₹142,000.00", status: "Processed" },
];

export default function PayslipsPage() {
    const { role, user } = useAuth();
    const { requestPayslip } = useApp();
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
                            <p className="text-xl font-bold">{mockPayslips[0].netPay}</p>
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
                            <p className="text-xl font-bold text-slate-900">{mockPayslips[0].date}</p>
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
                                <TableHead className="h-10">Pay Period</TableHead>
                                <TableHead className="h-10">Disbursement Date</TableHead>
                                <TableHead className="h-10">Net Amount</TableHead>
                                <TableHead className="h-10">Status</TableHead>
                                <TableHead className="h-10 text-right">View/Download</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPayslips.map((ps) => (
                                <TableRow key={ps.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-4 text-[10px] font-bold text-slate-400 font-mono">
                                        {ps.id}
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="font-semibold text-slate-900">{ps.period}</div>
                                    </TableCell>
                                    <TableCell className="py-4 text-xs font-medium text-slate-500">
                                        {ps.date}
                                    </TableCell>
                                    <TableCell className="py-4 font-bold text-slate-900">
                                        {ps.netPay}
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
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
