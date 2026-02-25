"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/Sidebar").then(mod => mod.Sidebar), {
    ssr: false,
    loading: () => <div className="w-64 bg-slate-900 animate-pulse h-screen hidden lg:block" />
});
import { Loader2, Bell, CalendarDays, Menu, X, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Assuming this path for cn utility
import { motion } from "framer-motion"; // For animation

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, role } = useAuth();
    const { leaves, notifications, markNotificationRead } = useApp();
    const router = useRouter();
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

    // Trigger toast for new notifications
    useEffect(() => {
        if (!isClient) return;
        const recentUnread = myNotifications.filter(n => !n.isRead && new Date(n.timestamp).getTime() > Date.now() - 5000);
        recentUnread.forEach(n => {
            toast.info(n.title, { description: n.message, id: n.id });
        });
    }, [myNotifications, isClient]);

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
                                                onClick={() => !notif.isRead && markNotificationRead(notif.id!)}
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
