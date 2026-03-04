"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Briefcase, ChevronRight, Users, Clock, AlertTriangle, Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";

export default function AIInsights() {
    const { leaves, tasks, attendance, leaveBalances } = useApp();
    const { user, role } = useAuth();
    const [insights, setInsights] = useState<any[]>([]);

    useEffect(() => {
        const list = [];
        const now = new Date().toISOString().split('T')[0];

        // 1. Leave & Low Balance Alert (Priority)
        if (role === "employer") {
            const onLeave = (leaves || []).filter(l => l.status === "Approved" && now >= l.from && now <= l.to);
            onLeave.forEach(leave => {
                const balances = (leaveBalances || []).filter(b => b.empEmail === leave.empEmail && b.type === leave.type);
                const currentBalance = balances[0]?.balance || 0;

                if (currentBalance <= 3) {
                    list.push({
                        title: "Balance Risk",
                        desc: `${leave.empName.split(' ')[0]} is reaching credit limit while on ${leave.type}.`,
                        icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
                        type: "Critical",
                        color: "rose"
                    });
                }
            });
        }

        // 2. Pending Requests
        const pendingLeaves = (leaves || []).filter(l => l.status === "Pending");
        if (role === "employer" && pendingLeaves.length > 0) {
            list.push({
                title: "Approval Queue",
                desc: `You have ${pendingLeaves.length} pending leave requests requiring attention.`,
                icon: <Clock className="w-4 h-4 text-amber-500" />,
                type: "Action",
                color: "amber"
            });
        }

        // 3. Task Alerts
        const myTasks = (tasks || []).filter(t => (t.assigneeEmails || []).includes(user?.email || "") && t.status !== "Completed");
        if (myTasks.length > 0) {
            list.push({
                title: "Active Workflow",
                desc: `${myTasks.length} assigned tasks are currently in your active pipeline.`,
                icon: <ChevronRight className="w-4 h-4 text-indigo-500" />,
                type: "Task",
                color: "indigo"
            });
        }

        // 4. Default Insight
        if (list.length === 0) {
            list.push({
                title: "Operational Status",
                desc: "All workforce parameters are within normal operating ranges.",
                icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
                type: "Status",
                color: "emerald"
            });
        }

        setInsights(list.slice(0, 3));
    }, [leaves, tasks, attendance, role, user, leaveBalances]);

    return (
        <div className="space-y-4 mb-10">
            {/* Professional Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-900 rounded-lg">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Smart AI Records</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Automated analysis of your current workforce state.</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Real-time</span>
                </div>
            </div>

            {/* Matching Theme Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className={cn(
                                "p-2 rounded-xl transition-colors",
                                insight.color === "rose" ? "bg-rose-50" :
                                    insight.color === "amber" ? "bg-amber-50" :
                                        insight.color === "indigo" ? "bg-indigo-50" : "bg-emerald-50"
                            )}>
                                {insight.icon}
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold py-0 h-5 px-2 border-slate-100 bg-slate-50/50 text-slate-500">
                                {insight.type}
                            </Badge>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 leading-none">
                                {insight.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                {insight.desc}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
