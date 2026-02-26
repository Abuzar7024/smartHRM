"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard,
    Shield,
    Users,
    Zap,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Crown,
    TrendingUp,
    Clock,
    AlertTriangle,
    Loader2,
    IndianRupee,
    RefreshCw,
    Star,
    Lock
} from "lucide-react";

type SubscriptionData = {
    plan: string;
    status: string;
    employeeLimit: number;
    paidSeats: number;
    activeUntil: string | null;
    razorpaySubscriptionId?: string | null;
};

export default function BillingPage() {
    const { role, user } = useAuth();
    const { employees } = useApp();

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [seatsToAdd, setSeatsToAdd] = useState(5);
    const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("growth");

    const fetchBillingStatus = async () => {
        try {
            const res = await fetch("/api/billing/status");
            const data = await res.json();
            if (data.subscription) {
                setSubscription(data.subscription);
            }
        } catch (err) {
            console.error("Failed to fetch billing status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingStatus();
    }, []);

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
        setUpgradeLoading(true);
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Razorpay SDK failed to load. Check your internet connection.");
                setUpgradeLoading(false);
                return;
            }

            // Create order
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
                name: "SmartHRM",
                description: `Add ${seatsToAdd} employee seats`,
                order_id: orderData.order.id,
                theme: { color: "#4f46e5" },
                handler: async function (response: any) {
                    // Verify payment
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
                            fetchBillingStatus();
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
            toast.error("Something went wrong during upgrade.");
        } finally {
            setUpgradeLoading(false);
        }
    };

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">
                    Only administrators can manage billing and subscriptions.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500 font-medium">Loading billing information...</p>
                </div>
            </div>
        );
    }

    const currentEmployees = employees.length;
    const maxEmployees = subscription?.employeeLimit || 5;
    const usagePercent = Math.min(Math.round((currentEmployees / maxEmployees) * 100), 100);
    const isFreePlan = subscription?.plan === "free" || !subscription?.plan || subscription?.plan === "none";
    const isPaid = !isFreePlan;
    const isActive = subscription?.status === "active" || isFreePlan;
    const activeUntil = subscription?.activeUntil ? new Date(subscription.activeUntil) : null;

    const plans = [
        {
            id: "starter" as const,
            name: "Starter",
            price: "Free",
            priceSubtext: "forever",
            seats: 5,
            features: [
                "Up to 5 employees",
                "Core HR features",
                "Chat & messaging",
                "Task management",
                "Leave tracking",
            ],
            icon: Zap,
            gradient: "from-slate-500 to-slate-700",
            ring: "ring-slate-200",
            current: isFreePlan,
        },
        {
            id: "growth" as const,
            name: "Growth",
            price: "₹99",
            priceSubtext: "/seat/month",
            seats: "Unlimited",
            features: [
                "Everything in Starter",
                "Unlimited employees",
                "Priority support",
                "Advanced analytics",
                "Payroll processing",
                "Performance reviews",
            ],
            icon: TrendingUp,
            gradient: "from-indigo-500 to-violet-600",
            ring: "ring-indigo-300",
            current: isPaid && subscription?.paidSeats && subscription.paidSeats <= 50,
            popular: true,
        },
        {
            id: "enterprise" as const,
            name: "Enterprise",
            price: "₹79",
            priceSubtext: "/seat/month",
            seats: "Unlimited",
            features: [
                "Everything in Growth",
                "Custom integrations",
                "Dedicated account manager",
                "SLA guarantee",
                "Audit logs",
                "SSO & SAML",
            ],
            icon: Crown,
            gradient: "from-amber-500 to-orange-600",
            ring: "ring-amber-300",
            current: isPaid && (subscription?.paidSeats ?? 0) > 50,
        },
    ];

    return (
        <div className="min-h-screen pb-20 font-sans">
            {/* Animated Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 md:p-12 mb-10 shadow-2xl shadow-indigo-500/20">
                {/* Animated bg elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute top-8 right-12 w-20 h-20 border border-white/10 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-8 right-32 w-12 h-12 border border-white/10 rounded-xl"
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-white/15 text-white border-white/20 text-xs font-bold uppercase tracking-widest px-3 py-1">
                                {isPaid ? "Pro Plan" : "Free Tier"}
                            </Badge>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                            Billing & Subscription
                        </h1>
                        <p className="text-indigo-200 text-sm md:text-base max-w-lg">
                            Manage your SmartHRM subscription, add employee seats, and keep your team powered up.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => fetchBillingStatus()}
                            variant="ghost"
                            className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 rounded-xl h-10"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-indigo-600" />
                                </div>
                                <Badge className={cn("text-[10px] font-bold uppercase", usagePercent >= 90 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                                    {usagePercent}% used
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Employee Seats</p>
                            <p className="text-2xl font-black text-slate-900">
                                {currentEmployees} <span className="text-sm font-medium text-slate-400">/ {maxEmployees}</span>
                            </p>
                            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${usagePercent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className={cn("h-full rounded-full", usagePercent >= 90 ? "bg-rose-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-indigo-500")}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                </div>
                                {isActive ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold uppercase">Active</Badge>
                                ) : (
                                    <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-bold uppercase">Inactive</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Subscription Status</p>
                            <p className="text-2xl font-black text-slate-900 capitalize">
                                {subscription?.plan || "Free"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {isPaid ? `${subscription?.paidSeats || 0} paid seats` : "5 free seats included"}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-violet-600" />
                                </div>
                                {isPaid && activeUntil && (
                                    <Badge className="bg-violet-50 text-violet-600 border-violet-200 text-[10px] font-bold uppercase">
                                        {Math.ceil((activeUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Renewal Date</p>
                            <p className="text-2xl font-black text-slate-900">
                                {activeUntil ? activeUntil.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {isPaid ? "Auto-renews monthly" : "No renewal needed"}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Pricing Plans */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Choose Your Plan</h2>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (index + 1) }}
                        >
                            <Card
                                className={cn(
                                    "relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl group",
                                    selectedPlan === plan.id ? `ring-2 ${plan.ring} shadow-lg` : "border-slate-200 shadow-sm hover:border-slate-300",
                                    plan.current && "border-indigo-300"
                                )}
                                onClick={() => setSelectedPlan(plan.id)}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                                            Most Popular
                                        </div>
                                    </div>
                                )}
                                {plan.current && (
                                    <div className="absolute top-0 left-0">
                                        <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-br-xl">
                                            Current Plan
                                        </div>
                                    </div>
                                )}

                                <CardContent className="p-8">
                                    <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform", plan.gradient)}>
                                        <plan.icon className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 mb-1">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                                        <span className="text-sm text-slate-400 font-medium">{plan.priceSubtext}</span>
                                    </div>

                                    <div className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {plan.current ? (
                                        <Button disabled className="w-full h-11 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed">
                                            Current Plan
                                        </Button>
                                    ) : plan.id === "starter" ? (
                                        <Button disabled className="w-full h-11 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed">
                                            Free Plan
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedPlan(plan.id);
                                            }}
                                            className={cn(
                                                "w-full h-11 rounded-xl font-bold shadow-lg transition-all",
                                                selectedPlan === plan.id
                                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/40"
                                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                            )}
                                        >
                                            Select Plan <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Quick Upgrade Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10">
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute top-6 right-10 w-3 h-3 bg-indigo-400 rounded-full opacity-50"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                            className="absolute bottom-10 right-28 w-2 h-2 bg-violet-400 rounded-full opacity-40"
                        />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Scale Your Team</h3>
                                    <p className="text-xs text-indigo-300 font-medium">First 5 employees free, then ₹99/seat/month</p>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col md:flex-row items-stretch gap-6">
                                {/* Seat Selector */}
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.25em] mb-3">Select seats to add</p>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {[5, 10, 25, 50].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setSeatsToAdd(n)}
                                                className={cn(
                                                    "relative rounded-2xl py-4 text-center font-black text-lg transition-all duration-300 border",
                                                    seatsToAdd === n
                                                        ? "bg-gradient-to-b from-indigo-500 to-violet-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/40 scale-105"
                                                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
                                                )}
                                            >
                                                {n}
                                                <span className="block text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-60">seats</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0">Custom:</p>
                                        <input
                                            type="range"
                                            min={1}
                                            max={100}
                                            value={seatsToAdd}
                                            onChange={e => setSeatsToAdd(parseInt(e.target.value))}
                                            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <span className="text-white font-black text-sm w-8 text-center">{seatsToAdd}</span>
                                    </div>
                                </div>

                                {/* Price Display & Pay */}
                                <div className="md:w-72 flex flex-col justify-between bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                                    <div className="text-center mb-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-2">Monthly Cost</p>
                                        <motion.div
                                            key={seatsToAdd}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 300 }}
                                            className="flex items-baseline justify-center gap-0.5"
                                        >
                                            <span className="text-2xl font-black text-indigo-300">₹</span>
                                            <span className="text-5xl font-black text-white tracking-tight">{seatsToAdd * 99}</span>
                                        </motion.div>
                                        <p className="text-xs text-slate-500 mt-1">{seatsToAdd} seats × ₹99 / month</p>
                                    </div>

                                    <Button
                                        onClick={handleUpgrade}
                                        disabled={upgradeLoading}
                                        className="w-full h-14 rounded-2xl font-bold text-base bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-[0.98] disabled:opacity-50 border border-indigo-400/30"
                                    >
                                        {upgradeLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Upgrade Now
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                                        <Shield className="w-3 h-3" /> Secured by Razorpay
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Payment Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-600" /> Secure Payments
                        </h3>
                        <div className="space-y-3 text-xs text-slate-500">
                            <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Payments processed securely via <strong className="text-slate-700">Razorpay</strong> — India&apos;s most trusted payment gateway.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Supports UPI, Credit/Debit Cards, Net Banking, and Wallets.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>256-bit SSL encryption. PCI DSS Level 1 certified.</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" /> Billing FAQ
                        </h3>
                        <div className="space-y-3 text-xs text-slate-500">
                            <div>
                                <p className="font-bold text-slate-700 mb-0.5">What happens when my billing expires?</p>
                                <p>Employee accounts will be temporarily locked. Admin access remains available to resolve billing.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 mb-0.5">Can I downgrade?</p>
                                <p>You can contact support to adjust your seat count. Overage seats will be released at the next billing cycle.</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 mb-0.5">Refund policy?</p>
                                <p>Full refund within 7 days of purchase if unused. Pro-rated refunds available after.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
