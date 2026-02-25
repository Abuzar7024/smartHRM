"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import {
    Users,
    CreditCard,
    CalendarDays,
    Briefcase,
    User,
    LayoutDashboard,
    PanelLeftClose,
    PanelLeftOpen,
    CheckSquare,
    LogOut,
    BarChart3,
    BarChart2,
    UsersRound,
    MessageSquare,
    Network
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const { role, logout, user } = useAuth();
    const { teams } = useApp();
    const [collapsed, setCollapsed] = useState(false);

    const isTeamLeader = teams.some(t => t.leaderEmail === user?.email);

    const employerLinks = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "Employees", href: "/dashboard/employees", icon: Users },
        { name: "Teams", href: "/dashboard/teams", icon: UsersRound },
        { name: "Hierarchy", href: "/dashboard/hierarchy", icon: Network },
        { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
        { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
        { name: "Performance", href: "/dashboard/performance", icon: BarChart3 },
        { name: "Payroll", href: "/dashboard/payroll", icon: CreditCard },
        { name: "Leaves", href: "/dashboard/leaves", icon: CalendarDays },
        { name: "Recruitment", href: "/dashboard/recruitment", icon: Briefcase },
    ];

    const employeeLinks = [
        { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
        ...(isTeamLeader ? [{ name: "My Teams", href: "/dashboard/teams", icon: UsersRound }] : []),
        { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
        { name: "My Profile", href: "/dashboard/profile", icon: User },
        { name: "My Payslips", href: "/dashboard/payslips", icon: CreditCard },
        { name: "My Leaves", href: "/dashboard/leaves", icon: CalendarDays },
    ];

    const navLinks = role === "employer" ? employerLinks : employeeLinks;

    return (
        <motion.aside
            initial={{ width: 256 }}
            animate={{ width: collapsed ? 72 : 256 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-screen flex flex-col justify-between sticky top-0 bg-[#0f172a] border-r border-white/5 shadow-xl overflow-hidden"
        >
            {/* ── Header / Logo ── */}
            <div>
                <div className={cn(
                    "flex items-center border-b border-white/8 h-16",
                    collapsed ? "justify-center px-4" : "justify-between px-5"
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center flex-shrink-0">
                                <BarChart2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-white font-semibold text-lg tracking-tight whitespace-nowrap">SmartHR</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                            <BarChart2 className="w-4 h-4 text-white" />
                        </div>
                    )}

                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden md:flex w-7 h-7 rounded-md items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {!collapsed && (
                    <div className="px-5 pt-4 pb-2">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                            {role} Portal
                        </div>
                    </div>
                )}

                {/* ── Nav links ── */}
                <nav className={cn("p-3 space-y-0.5 mt-2", collapsed && "mt-4")}>
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <span
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 group",
                                        isActive
                                            ? "bg-slate-800 text-white font-medium"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                        collapsed ? "justify-center" : ""
                                    )}
                                >
                                    <link.icon className={cn("w-[18px] h-[18px] flex-shrink-0 transition-transform", isActive ? "text-white" : "group-hover:scale-110")} />
                                    {!collapsed && (
                                        <span className="text-sm">{link.name}</span>
                                    )}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* ── Footer ── */}
            <div className="p-3 border-t border-white/8">
                {!collapsed && user && (
                    <div className="mb-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/8">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-500/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-blue-300">
                                    {user.email?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-white/90 truncate">{user.email}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{role} Account</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 text-sm font-medium",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>

                {collapsed && (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="w-full flex items-center justify-center mt-1 py-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.aside>
    );
}
