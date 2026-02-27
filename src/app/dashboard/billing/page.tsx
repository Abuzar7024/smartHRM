"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CreditCard, Shield, Users, CheckCircle2, Loader2, RefreshCw, Lock, Receipt, Building2 } from "lucide-react";

type SubscriptionData = {
    plan: string;
    status: string;
    employeeLimit: number;
    paidSeats: number;
    activeUntil: string | null;
    razorpaySubscriptionId?: string | null;
};

type PaymentLog = {
    id: string;
    transactionId: string | null;
    orderId: string | null;
    amount: number;
    currency: string;
    status: string;
    createdAt: string | null;
};

export default function BillingPage() {
    const { role } = useAuth();
    const { employees } = useApp();

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [payments, setPayments] = useState<PaymentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [seatsToAdd, setSeatsToAdd] = useState<number>(1);

    const fetchBillingStatus = async () => {
        try {
            const res = await fetch("/api/billing/status");
            const data = await res.json();
            if (data.subscription) {
                setSubscription(data.subscription);
            }
        } catch (err) {
            console.error("Failed to fetch billing status:", err);
        }
    };

    const fetchPaymentHistory = async () => {
        try {
            const res = await fetch("/api/billing/history");
            const data = await res.json();
            if (data.payments) {
                setPayments(data.payments);
            }
        } catch (err) {
            console.error("Failed to fetch billing history:", err);
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([fetchBillingStatus(), fetchPaymentHistory()]);
        setLoading(false);
    };

    useEffect(() => {
        if (role === "employer") {
            loadAllData();
        }
    }, [role]);

    const handleRefresh = async () => {
        toast.promise(loadAllData(), {
            loading: "Refreshing billing data...",
            success: "Data synchronized successfully!",
            error: "Failed to refresh data."
        });
    };

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async () => {
        if (seatsToAdd < 1) return toast.error("Please enter a valid number of seats.");
        
        setUpgradeLoading(true);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Razorpay SDK failed to load. Check your internet connection.");
                setUpgradeLoading(false);
                return;
            }

            const orderRes = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeesToAdd: seatsToAdd }),
            });
            const orderData = await orderRes.json();

            if (orderData.error) {
                toast.error(orderData.error);
                setUpgradeLoading(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "SmartHRM Corporate",
                description: `Add ${seatsToAdd} employee seats`,
                order_id: orderData.order.id,
                theme: { color: "#0f172a" }, // Corporate color mapping
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                employeesToAdd: seatsToAdd,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            toast.success("Payment Successful!", {
                                description: `${seatsToAdd} seats added to your plan.`,
                            });
                            setSeatsToAdd(1);
                            loadAllData();
                        } else {
                            toast.error("Verification Failed", { description: verifyData.message });
                        }
                    } catch {
                        toast.error("Payment verification failed.");
                    }
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", function (response: any) {
                toast.error(`Payment Failed: ${response.error.description}`);
            });
            rzp.open();
        } catch (err) {
            toast.error("Something went wrong during checkout.");
        } finally {
            setUpgradeLoading(false);
        }
    };

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50">
                <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <Lock className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                    Only administrators can manage the billing and subscription parameters.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Retrieving Financials...</p>
                </div>
            </div>
        );
    }

    const currentEmployees = employees.length;
    const maxEmployees = subscription?.employeeLimit || 5;
    const isFreePlan = subscription?.plan === "free" || !subscription?.plan || subscription?.plan === "none";
    const isActive = subscription?.status === "active" || isFreePlan;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
            {/* Header Area */}
            <div className="relative border-b border-slate-200 bg-white px-8 py-10 mb-8 sm:px-12">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-5 h-5 text-slate-400" />
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organization Billing</h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Manage your subscription capacity and review transaction history.</p>
                    </div>
                    <Button onClick={handleRefresh} variant="outline" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 font-semibold shadow-sm">
                        <RefreshCw className="w-4 h-4 mr-2" /> Synchronize
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                
                {/* Status KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                        <CardContent className="p-6">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Current Plan
                            </p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Standard Pro</h3>
                            <p className="text-sm text-slate-500 font-medium">₹99 per seat / month</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Personnel Limits
                                </p>
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold">
                                    {Math.round((currentEmployees / maxEmployees) * 100)}% Consumed
                                </Badge>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{currentEmployees} / {maxEmployees}</h3>
                            <p className="text-sm text-slate-500 font-medium">Licensed seats utilized</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-white">
                        <CardContent className="p-6">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Access Status
                            </p>
                            <h3 className={cn("text-2xl font-black tracking-tight mb-1", isActive ? "text-emerald-600" : "text-rose-600")}>
                                {isActive ? "Operational" : "Restricted"}
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">Account subscription standing</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Add Capacity Module */}
                    <div className="lg:col-span-5">
                        <Card className="border-slate-200 shadow-lg rounded-3xl bg-white overflow-hidden text-center md:text-left">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center justify-center md:justify-start gap-2">
                                    Scale Infrastructure
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                    Purchase additional seats instantly via Razorpay to accommodate team growth.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="space-y-3 relative">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Seats to Add</label>
                                        <div className="flex items-center">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={1000}
                                                value={seatsToAdd}
                                                onChange={e => setSeatsToAdd(parseInt(e.target.value) || 0)}
                                                className="h-14 text-center md:text-left text-xl font-black bg-slate-50 border-slate-200 rounded-xl placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="text-center md:text-left mb-4 md:mb-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Invoice Total</p>
                                            <p className="text-3xl font-black text-slate-900">₹{seatsToAdd * 99 || 0}</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleUpgrade}
                                        disabled={upgradeLoading || seatsToAdd < 1}
                                        className="w-full h-14 rounded-xl font-bold bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800"
                                    >
                                        {upgradeLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                        ) : (
                                            "Procesor Payment"
                                        )}
                                    </Button>
                                    
                                    <div className="text-center mt-4 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1.5">
                                        <Lock className="w-3 h-3 text-slate-300" />
                                        End-to-End SSL Encrypted
                                    </div>
                                    <div className="text-center mt-2 text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                                        All transactions securely managed through Razorpay gateway infrastructure.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment History Module */}
                    <div className="lg:col-span-7">
                        <Card className="border-slate-200 shadow-sm rounded-3xl bg-white h-full flex flex-col">
                            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Receipt className="w-5 h-5" /> Transaction Ledger
                                    </CardTitle>
                                    <CardDescription>Historical overview of finalized transactions.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-slate-50 uppercase text-[10px] font-black tracking-widest">
                                        <TableRow>
                                            <TableHead className="py-4 px-6 slate-500">Transaction ID</TableHead>
                                            <TableHead className="py-4 px-6 slate-500">Amount</TableHead>
                                            <TableHead className="py-4 px-6 slate-500">Status</TableHead>
                                            <TableHead className="py-4 px-6 slate-500 text-right">Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-16 text-center text-slate-400">
                                                    <Receipt className="w-10 h-10 mx-auto opacity-20 mb-3" />
                                                    <p className="font-semibold text-sm text-slate-600">No payment records found</p>
                                                    <p className="text-xs">Your transaction history will populate here automatically.</p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            payments.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="px-6 py-4">
                                                        <span className="font-mono text-xs text-slate-600 font-medium">#{p.transactionId?.slice(0,12) || "TRX_N/A"}</span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 font-bold text-slate-900">
                                                        ₹{(p.amount / 100).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4">
                                                        <Badge variant={p.status === "captured" || p.status === "success" ? "success" : "warning"} className="text-[10px] font-bold uppercase py-0.5">
                                                            {p.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                                                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
