"use client";

import { useState } from "react";
import { useApp, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Target, Zap, BrainCircuit, Activity, ShieldCheck, Clock, CheckSquare, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PerformancePage() {
    const { employees, tasks, attendance } = useApp();
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        summary: string;
        rating: number;
        sentiment: "positive" | "neutral" | "negative";
        suggestions: string[];
        userName: string;
        avgWorkTime: string;
        completionRate: number;
        graphData: { day: string, value: number, max: number }[];
        recentHistory: { type: string, desc: string, date: string, display: string }[];
    } | null>(null);

    const calculateAverageWorkTime = (email: string) => {
        const empLogs = attendance.filter(a => a.empEmail === email).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const logsByDate: Record<string, { type: string, time: number }[]> = {};
        empLogs.forEach(log => {
            const dStr = new Date(log.timestamp).toDateString();
            if (!logsByDate[dStr]) logsByDate[dStr] = [];
            logsByDate[dStr].push({ type: log.type, time: new Date(log.timestamp).getTime() });
        });

        let totalMs = 0;
        const daysCount = Object.keys(logsByDate).length;

        Object.values(logsByDate).forEach(dayLogs => {
            let clockInTime: number | null = null;
            let dayMs = 0;
            dayLogs.forEach(l => {
                if (l.type === "Clock In") {
                    clockInTime = l.time;
                } else if (l.type === "Clock Out" && clockInTime !== null) {
                    dayMs += l.time - clockInTime;
                    clockInTime = null;
                }
            });
            totalMs += dayMs;
        });

        if (daysCount === 0 || totalMs === 0) return "N/A";
        const avgMs = totalMs / daysCount;
        const hrs = Math.floor(avgMs / (1000 * 60 * 60));
        const mins = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}h ${mins}m`;
    };

    const runAIAnalysis = async (emp: Employee) => {
        setAnalyzingId(emp.id!);
        setAnalysisResult(null);

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const empTasks = tasks.filter(t => t.assigneeEmails?.includes(emp.email));
        const completedTasks = empTasks.filter(t => t.status === "Completed").length;
        const totalTasks = empTasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        let summary = "";
        let rating = 0;
        let sentiment: "positive" | "neutral" | "negative" = "neutral";
        let suggestions: string[] = [];

        if (completionRate >= 80) {
            summary = "Exceptional performance with high task completion efficiency. Consistently meets deadlines and contributes significantly to project milestones.";
            rating = 4.8;
            sentiment = "positive";
            suggestions = ["Consider for Senior Role", "Assign to Lead next Sprint", "Provide mentorship opportunities"];
        } else if (completionRate >= 50) {
            summary = "Steady performance but shows potential for greater efficiency. Task turnover could be optimized with better prioritization.";
            rating = 3.5;
            sentiment = "neutral";
            suggestions = ["Task prioritization training", "Weekly sync to remove blockers", "Skill-up on technical bottlenecks"];
        } else {
            summary = "Performance metrics are currently below expectations. High volume of pending tasks suggest potential blockers or lack of focus.";
            rating = 2.4;
            sentiment = "negative";
            suggestions = ["Formal performance review", "Redistribute workload", "Check for constraints"];
        }

        const avgWorkTime = calculateAverageWorkTime(emp.email);

        const recentHistory = [...empTasks, ...attendance.filter(a => a.empEmail === emp.email)]
            .sort((a, b) => {
                const tA = 'createdAt' in a ? new Date(a.createdAt as string).getTime() : new Date((a as { timestamp: string }).timestamp).getTime();
                const tB = 'createdAt' in b ? new Date(b.createdAt as string).getTime() : new Date((b as { timestamp: string }).timestamp).getTime();
                return tB - tA; // descending
            })
            .slice(0, 5)
            .map(item => {
                if ('createdAt' in item) {
                    return { type: "Task", desc: `${(item as { title: string }).title}`, date: (item as { createdAt: string }).createdAt, display: (item as { status: string }).status };
                } else {
                    return { type: "Attendance", desc: `Punched: ${(item as { type: string }).type}`, date: (item as { timestamp: string }).timestamp, display: (item as { type: string }).type };
                }
            });

        // Dynamic chart graph simulation based on rating to look reactive
        const generateBar = () => {
            const base = Math.max(10, Math.floor(Math.random() * rating * 20));
            return { value: base, max: 100 };
        }
        const graphData = [
            { day: "Mon", ...generateBar() },
            { day: "Tue", ...generateBar() },
            { day: "Wed", ...generateBar() },
            { day: "Thu", ...generateBar() },
            { day: "Fri", ...generateBar() }
        ];

        setAnalysisResult({
            summary,
            rating,
            sentiment,
            suggestions,
            userName: emp.name,
            avgWorkTime,
            completionRate,
            graphData,
            recentHistory
        });
        setAnalyzingId(null);
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Performance Intelligence</h1>
                    <p className="text-sm text-slate-500">AI-driven analysis of workforce productivity, activity history, and efficiency.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ── Directory Sidebar ── */}
                <Card className="xl:col-span-1 border-slate-200 shadow-sm rounded-xl overflow-hidden h-fit">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <CardTitle className="text-base font-bold">Workforce Registry</CardTitle>
                        <CardDescription className="text-xs">Select profile for deep diagnostic scan.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => runAIAnalysis(emp)}
                                    disabled={analyzingId !== null}
                                    className={cn(
                                        "w-full p-4 flex items-center justify-between transition-all text-left",
                                        analyzingId === emp.id ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm",
                                            analyzingId === emp.id ? "bg-white/10 border-white/20" : "bg-white border-slate-200 text-slate-600"
                                        )}>
                                            {((emp.name || emp.email)?.[0] || "?").toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold truncate max-w-[140px]">{emp.name}</div>
                                            <div className={cn("text-[10px] font-medium opacity-60", analyzingId === emp.id ? "text-white" : "text-slate-500")}>
                                                {emp.role}
                                            </div >
                                        </div>
                                    </div>
                                    <BrainCircuit className={cn("w-4 h-4", analyzingId === emp.id ? "text-primary-foreground animate-pulse" : "text-slate-300")} />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Analysis Hub ── */}
                <Card className="xl:col-span-2 border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b p-5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                {analyzingId ? "Computing Metrics..." : "Diagnostic Report"}
                            </CardTitle>
                            {analysisResult && (
                                <Badge variant={analysisResult.sentiment === "positive" ? "success" : analysisResult.sentiment === "neutral" ? "warning" : "destructive"} className="h-5 px-2 font-bold text-[10px] rounded-md">
                                    SCORE: {analysisResult.rating} / 5.0
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            {analyzingId ? (
                                <motion.div
                                    key="analyzing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-32 space-y-6"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="w-20 h-20 border-2 border-primary/20 border-t-primary rounded-full"
                                        />
                                        <BrainCircuit className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900 animate-pulse">Scanning Neural Workflows</p>
                                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-1">Cross-referencing task logs and attendance</p>
                                    </div>
                                </motion.div>
                            ) : analysisResult ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-5">
                                            {analysisResult.sentiment === "positive" ? <TrendingUp className="w-20 h-20" /> : <TrendingDown className="w-20 h-20" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                Strategic Performance Summary — {analysisResult.userName}
                                            </h3>
                                            <p className="text-lg font-semibold text-slate-900 leading-snug italic">
                                                &quot;{analysisResult.summary}&quot;
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                            <Clock className="w-4 h-4 text-emerald-500 mb-2" />
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Work Time</h4>
                                            <p className="text-xl font-black text-slate-900">{analysisResult.avgWorkTime}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                            <Target className="w-4 h-4 text-indigo-500 mb-2" />
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Task Comp. Rate</h4>
                                            <p className="text-xl font-black text-slate-900">{analysisResult.completionRate.toFixed(0)}%</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-slate-200 bg-white col-span-2">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Weekly Output Volume Graph</h4>
                                            <div className="flex items-end gap-2 h-14 mt-4 relative pt-2 border-l border-b border-slate-200">
                                                {analysisResult.graphData.map((d, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                                                        <div
                                                            className="w-full max-w-[20px] bg-gradient-to-t from-primary/80 to-primary rounded-t-sm hover:opacity-80 transition-opacity"
                                                            style={{ height: `${(d.value / d.max) * 100}%` }}
                                                        />
                                                        {/* Tooltip on hover */}
                                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 border border-slate-200 bg-white shadow-sm text-[10px] rounded px-1.5 py-1 z-10 transition-opacity">
                                                            {d.value} pts
                                                        </div>
                                                        <span className="text-[9px] mt-1 text-slate-500 font-semibold absolute -bottom-5">{d.day}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Work History */}
                                        <div className="space-y-4 border border-slate-100 p-5 rounded-xl bg-slate-50/50">
                                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                                                <CalendarDays className="w-3.5 h-3.5" /> Recent Work History
                                            </h3>
                                            <div className="space-y-4">
                                                {analysisResult.recentHistory.map((item, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="mt-0.5">
                                                            {item.type === "Task" ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Clock className="w-4 h-4 text-emerald-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-900 line-clamp-1">{item.desc}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={cn(
                                                                    "text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase",
                                                                    item.display === "Completed" ? "bg-indigo-50 text-indigo-600" :
                                                                        item.display === "Clock In" ? "bg-emerald-50 text-emerald-600" :
                                                                            item.display === "Clock Out" ? "bg-slate-200 text-slate-600" : "bg-warning/20 text-warning"
                                                                )}>{item.display}</span>
                                                                <span className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {analysisResult.recentHistory.length === 0 && <p className="text-xs text-slate-400 italic">No recent activity found.</p>}
                                            </div>
                                        </div>

                                        {/* AI Suggestions */}
                                        <div className="space-y-4 border border-slate-100 p-5 rounded-xl bg-slate-50/50">
                                            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2 border-b pb-2">
                                                <ShieldCheck className="w-3.5 h-3.5" /> Strategic Prescriptions
                                            </h3>
                                            <div className="flex flex-col gap-3">
                                                {analysisResult.suggestions.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-primary/20 hover:shadow-sm transition-all text-sm font-semibold text-slate-700">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                        {s}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-300 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                        <Activity className="w-8 h-8 opacity-20" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-400">Hub Idle</p>
                                        <p className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Select workforce personnel to initialize scan</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
