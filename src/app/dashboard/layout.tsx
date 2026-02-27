"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => mod.Sidebar), {
    ssr: false,
    loading: () => <div className="w-64 bg-slate-900 animate-pulse h-screen hidden lg:block" />
});
import { Settings, LogOut, Menu, X, Bell, Moon, Sun, Monitor, User, AlertTriangle, Building2, Hourglass, Loader2, Info, Wallet, Lock, CreditCard } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Assuming this path for cn utility
import { motion, AnimatePresence } from "framer-motion"; // For animation

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading, role, status, companyName, logout } = useAuth();
    const { leaves, notifications, markNotificationRead, employees } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [loading, setLoading] = useState(true); // Added for initial loading state
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system"); // Added for theme state
    const [billingActive, setBillingActive] = useState(true);
    const [billingChecked, setBillingChecked] = useState(false);

    // Dropdown hover states
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const notifTimer = useRef<NodeJS.Timeout | null>(null);
    const profileTimer = useRef<NodeJS.Timeout | null>(null);

    const toggleNotif = () => setIsNotifOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);

    const handleMouseEnterProfile = () => {
        if (profileTimer.current) clearTimeout(profileTimer.current);
        setIsProfileOpen(true);
    };
    const handleMouseLeaveProfile = () => {
        profileTimer.current = setTimeout(() => setIsProfileOpen(false), 300);
    };

    const handleMouseEnterNotif = () => {
        if (notifTimer.current) clearTimeout(notifTimer.current);
        setIsNotifOpen(true);
    };
    const handleMouseLeaveNotif = () => {
        notifTimer.current = setTimeout(() => setIsNotifOpen(false), 300);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
        setIsClient(true);
        setLoading(false); // Set loading to false once client is mounted
    }, []);

    // Check billing status for employee lock
    useEffect(() => {
        if (!user || !isClient) return;
        const checkBilling = async () => {
            try {
                const res = await fetch("/api/billing/status");
                const data = await res.json();
                if (data.subscription) {
                    const sub = data.subscription;
                    const isActive = sub.status === "active" || sub.plan === "free" || sub.status === undefined;
                    // Check if activeUntil has expired
                    if (sub.activeUntil && new Date(sub.activeUntil) < new Date()) {
                        setBillingActive(false);
                    } else {
                        setBillingActive(isActive && sub.status !== "cancelled" && sub.status !== "halted");
                    }
                }
            } catch {
                // If API fails, default to active to avoid false lockouts
                setBillingActive(true);
            } finally {
                setBillingChecked(true);
            }
        };
        checkBilling();
    }, [user, isClient]);

    useEffect(() => {
        if (isClient && !authLoading && !user) {
            router.push("/login");
        }
    }, [isClient, user, authLoading, router]);

    const myNotifications = notifications.filter(
        n => (role === "employer" && n.targetRole === "employer") ||
            (role === "employee" && (n.targetEmail === user?.email || n.targetRole === "employee"))
    );

    const unreadCount = myNotifications.filter(n => !n.isRead).length;

    // Map notification title keywords → dashboard routes
    const getNotifRoute = (title: string, message: string): string => {
        const t = (title + " " + message).toLowerCase();
        if (t.includes("document") || t.includes("upload") || t.includes("file")) return "/dashboard/profile";
        if (t.includes("leave") || t.includes("time off")) return "/dashboard/leaves";
        if (t.includes("task") || t.includes("assigned")) return "/dashboard/tasks";
        if (t.includes("chat") || t.includes("message")) return "/dashboard/chat";
        if (t.includes("payroll") || t.includes("payslip") || t.includes("salary")) return "/dashboard/payroll";
        if (t.includes("registration") || t.includes("approved") || t.includes("welcome")) return "/dashboard";
        if (t.includes("attendance") || t.includes("clock")) return "/dashboard";
        return "/dashboard";
    };

    // Trigger toast for new notifications
    useEffect(() => {
        if (!isClient) return;
        const recentUnread = myNotifications.filter(n => !n.isRead && new Date(n.timestamp).getTime() > Date.now() - 5000);
        recentUnread.forEach(n => {
            // Urgent messages get a special, persistent, red error toast instead
            if ((n as any).priority === "urgent" || n.title.toLowerCase().includes("urgent")) {
                toast.error(`URGENT: ${n.title}`, { description: n.message, id: n.id, duration: 10000 });
            } else {
                toast.info(n.title, { description: n.message, id: n.id });
            }
        });
    }, [myNotifications, isClient]);

    useEffect(() => {
        if (isClient && !authLoading && !user) {
            // Frontend Auth state was lost but session cookie let them in.
            // Force logout to clear cookie and redirect.
            logout();
        }
    }, [isClient, authLoading, user, logout]);

    if (!isClient || authLoading || loading) { // Combined loading states
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // ─────────────────────────────────────────────────────────
    // WAITING SCREEN (For Pending Employees)
    // ─────────────────────────────────────────────────────────
    if (status === "pending") {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center relative z-10"
                >
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-indigo-200 rounded-full"
                        />
                        <Hourglass className="w-10 h-10 text-indigo-600 animate-pulse" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Pending</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Your account has been created successfully, but requires approval from your organization's administrator before you can access the dashboard.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8 text-left flex items-start gap-4">
                        <Building2 className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requested Organization</p>
                            <p className="text-sm font-semibold text-slate-800">{companyName || "Unknown Company"}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-md shadow-slate-900/10 flex items-center justify-center cursor-not-allowed opacity-80"
                            disabled
                        >
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Waiting for Approval...
                        </button>
                        <button
                            onClick={logout}
                            className="w-full h-12 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.div>

                {/* Background decorative elements */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/4 -right-32 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────
    // BILLING LOCK SCREEN (For Employees when billing is inactive)
    // ─────────────────────────────────────────────────────────
    if (billingChecked && !billingActive && role === "employee") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[600px] h-[600px] border border-white/5 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[400px] h-[400px] border border-white/5 rounded-full"
                />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/4 -right-32 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-lg w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-10 text-center relative z-10 shadow-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-gradient-to-br from-rose-500/20 to-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 relative border border-white/10"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-rose-300/20 rounded-3xl"
                        />
                        <Lock className="w-12 h-12 text-rose-400" />
                    </motion.div>

                    <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                        Dashboard Locked
                    </h1>
                    <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        Your organization&apos;s subscription has expired or been cancelled.
                        Please contact your administrator to restore access.
                    </p>

                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-8 text-left">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subscription Status</p>
                                <p className="text-sm font-bold text-rose-400">Inactive / Expired</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Your employer needs to renew the billing plan from the Billing page.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            className="w-full h-12 rounded-xl bg-white/10 text-white/60 font-semibold transition-all flex items-center justify-center cursor-not-allowed border border-white/10"
                            disabled
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Access Restricted
                        </button>
                        <button
                            onClick={logout}
                            className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold hover:bg-white/10 hover:text-white transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 h-screen w-full relative overflow-hidden">
            {/* Sidebar with mobile state */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <Sidebar />
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sm:px-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-600"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <div className="h-8 w-1 bg-primary rounded-full hidden sm:block" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Hub</span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Real-time Notifications */}
                        <div
                            className="relative"
                            onMouseEnter={handleMouseEnterNotif}
                            onMouseLeave={handleMouseLeaveNotif}
                        >
                            <button
                                onClick={toggleNotif}
                                className="relative p-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md transition-all"
                            >
                                <Bell className={cn("w-5 h-5", unreadCount > 0 && "text-slate-900")} />
                                <AnimatePresence>
                                    {unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white shadow-lg shadow-rose-500/20"
                                        >
                                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-25" />
                                            {unreadCount}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>

                            {/* Detailed Notification Dropdown */}
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                                        className="absolute right-0 top-full pt-2 z-50"
                                    >
                                        <div className="w-80 bg-white rounded-lg shadow-2xl border border-slate-100 p-4 text-left max-h-[400px] overflow-y-auto">
                                            <div className="flex items-center justify-between mb-4 px-2">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Alerts</h3>
                                                <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                            </div>
                                            <div className="space-y-3">
                                                {myNotifications.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic text-center py-4">All caught up!</p>
                                                ) : (
                                                    myNotifications.slice(0, 10).map(notif => (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => {
                                                                if (!notif.isRead) markNotificationRead(notif.id!);
                                                                router.push(getNotifRoute(notif.title, notif.message));
                                                            }}
                                                            className={cn(
                                                                "p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer",
                                                                notif.isRead ? "bg-slate-50 opacity-70" : "bg-primary/5 hover:bg-primary/10",
                                                                (notif as any).priority === "urgent" || notif.title.toLowerCase().includes("urgent") ? "bg-rose-50 border border-rose-200" : ""
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-white",
                                                                notif.isRead ? "bg-slate-300" : "bg-primary",
                                                                (notif as any).priority === "urgent" || notif.title.toLowerCase().includes("urgent") ? "bg-rose-500" : ""
                                                            )}>
                                                                <Info className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-left flex-1 min-w-0">
                                                                <p className={cn("text-xs font-bold truncate", notif.isRead ? "text-slate-600" : "text-slate-900")}>
                                                                    {notif.title}
                                                                </p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5 whitespace-pre-wrap leading-tight">{notif.message}</p>
                                                                <p className="text-[9px] text-slate-400 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                                                            </div>
                                                            {!notif.isRead && (
                                                                <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Profile Settings Menu */}
                        <div
                            className="relative"
                            onMouseEnter={handleMouseEnterProfile}
                            onMouseLeave={handleMouseLeaveProfile}
                            onClick={toggleProfile}
                        >
                            <button className="flex items-center gap-2 group">
                                <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-200 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105 overflow-hidden">
                                    {employees.find(e => e.email === user?.email)?.photoURL ? (
                                        <img src={employees.find(e => e.email === user?.email)!.photoURL} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        user?.email?.[0].toUpperCase() || "U"
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                                        className="absolute right-0 top-full pt-2 w-64 z-50"
                                    >
                                        <div className="bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden">
                                            <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                                <p className="text-sm font-bold text-slate-900">{user.email?.split('@')[0]}</p>
                                                <p className="text-[10px] text-slate-500 capitalize">{role} Account</p>
                                            </div>
                                            <div className="flex flex-col gap-1 p-2">
                                                <button onClick={() => router.push("/dashboard/profile")} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                                    <User className="w-4 h-4" /> My Profile
                                                </button>
                                                {role === "employer" && (
                                                    <button onClick={() => router.push("/dashboard/billing")} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                                        <Wallet className="w-4 h-4" /> Billing
                                                    </button>
                                                )}
                                                <div className="h-[1px] bg-slate-100 my-1" />
                                                <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
                                                    <LogOut className="w-4 h-4" /> Log out
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10">
                    <div className="mx-auto w-full max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
