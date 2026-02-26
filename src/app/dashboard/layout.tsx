"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => mod.Sidebar), {
    ssr: false,
    loading: () => <div className="w-64 bg-slate-900 animate-pulse h-screen hidden lg:block" />
});
import { Loader2, Bell, CalendarDays, Menu, X, Info, Hourglass, Building2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Assuming this path for cn utility
import { motion } from "framer-motion"; // For animation

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, role, status, companyName, logout } = useAuth();
    const { leaves, notifications, markNotificationRead } = useApp();
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !loading && !user) {
            router.push("/login");
        }
    }, [isClient, user, loading, router]);

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
            toast.info(n.title, { description: n.message, id: n.id });
        });
    }, [myNotifications, isClient]);

    useEffect(() => {
        if (isClient && !loading && !user) {
            // Frontend Auth state was lost but session cookie let them in.
            // Force logout to clear cookie and redirect.
            logout();
        }
    }, [isClient, loading, user, logout]);

    if (!isClient || loading) {
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
                        <button className="relative p-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md transition-all group">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white shadow-lg shadow-rose-500/20"
                                >
                                    {unreadCount}
                                </motion.span>
                            )}

                            {/* Detailed Notification Dropdown (Creative Micro-UI) */}
                            <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-lg shadow-2xl border border-slate-100 p-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50 text-left max-h-[400px] overflow-y-auto">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 px-2">Recent Alerts</h3>
                                <div className="space-y-3">
                                    {myNotifications.length > 0 ? (
                                        myNotifications.slice(0, 10).map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    if (!notif.isRead) markNotificationRead(notif.id!);
                                                    router.push(getNotifRoute(notif.title, notif.message));
                                                }}
                                                className={cn(
                                                    "p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer",
                                                    notif.isRead ? "bg-slate-50 opacity-70" : "bg-primary/5 hover:bg-primary/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center text-white",
                                                    notif.isRead ? "bg-slate-300" : "bg-primary"
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
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-4">All caught up!</p>
                                    )}
                                </div>
                            </div>
                        </button>

                        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter capitalize">{role} Account</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg bg-[#0f172a] flex items-center justify-center text-white font-bold shadow-sm">
                                {user?.email?.[0].toUpperCase()}
                            </div>
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
