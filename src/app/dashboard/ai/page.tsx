"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
    Brain, TrendingUp, Users, Trophy, Zap, ShieldCheck,
    Target, Activity, Layers, Briefcase,
    Calendar, AlertCircle, ChevronRight, ArrowUpRight,
    PieChart as PieIcon, BarChart3, LineChart
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AIInsightsPage() {
    const { employees, tasks, teams, leaveBalances, attendance } = useApp();
    const { role } = useAuth();

    // ── CORPORATE DATA PROCESSING: Teams Performance Benchmarking ──
    const teamStats = useMemo(() => {
        return teams.map(team => {
            const members = [team.leaderEmail, ...(team.memberEmails || [])];
            const teamTasks = tasks.filter(t => t.assigneeEmails?.some(email => members.includes(email)));
            const completed = teamTasks.filter(t => t.status === "Completed").length;
            const total = teamTasks.length;
            const rate = total > 0 ? (completed / total) * 100 : 0;
            return {
                name: team.name,
                efficiency: Math.round(rate),
                operations: total,
                status: rate > 75 ? "Optimal" : rate > 50 ? "Stable" : "Critical"
            };
        }).sort((a, b) => b.efficiency - a.efficiency);
    }, [teams, tasks]);

    // ── CORPORATE DATA PROCESSING: Top 3 Employee Performance (Pie Chart) ──
    const topPerformersPie = useMemo(() => {
        const sorted = employees.map(emp => {
            const empTasks = tasks.filter(t => t.assigneeEmails?.includes(emp.email));
            const completed = empTasks.filter(t => t.status === "Completed").length;
            return { name: emp.name?.split(' ')[0] || emp.email.split('@')[0], value: completed };
        }).sort((a, b) => b.value - a.value).slice(0, 3);

        // Add "Others" segment for a proper pie visual
        const othersValue = tasks.filter(t => t.status === "Completed").length - sorted.reduce((acc, curr) => acc + curr.value, 0);
        if (othersValue > 0) {
            sorted.push({ name: "Others", value: othersValue });
        }
        return sorted;
    }, [employees, tasks]);

    // ── CORPORATE DATA PROCESSING: Quarterly Forecast / Trend (Simulated) ──
    const performanceTrend = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map((month, i) => ({
            month,
            revenue: 2000 + (i * 400) + Math.floor(Math.random() * 500),
            efficiency: 60 + (i * 4) + Math.floor(Math.random() * 10),
            utilization: 70 + Math.floor(Math.random() * 15)
        }));
    }, []);

    const CORPORATE_PALETTE = ['#0f172a', '#334155', '#64748b', '#94a3b8'];
    const STATUS_COLORS = {
        Optimal: "bg-emerald-50 text-emerald-700 border-emerald-100",
        Stable: "bg-blue-50 text-blue-700 border-blue-100",
        Critical: "bg-rose-50 text-rose-700 border-rose-100"
    };

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-rose-50 rounded-full">
                    <AlertCircle className="w-12 h-12 text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
                <p className="text-slate-500 max-w-sm text-center">Neural workforce analysis is restricted to administrative accounts only.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto bg-[#f8fafc] min-h-screen font-sans">
            {/* ── TOP NAV / BREADCRUMB STYLE HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Enterprise Analytics Hub</span>
                        <div className="h-[1px] w-8 bg-slate-200" />
                        <Badge className="bg-slate-900 text-white rounded-none font-bold text-[9px] px-1.5 h-4">V3.2.0</Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">AI Insights & Performance Intelligence</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Consolidated strategic assessment of organizational throughput and talent allocation.</p>
                </div>

                <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                    <div className="px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">AI Sync Active</span>
                    </div>
                </div>
            </div>

            {/* ── KEY PERFORMANCE INDICATORS (KPIs) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Operational Velocity", value: "84.2%", trend: "+2.4%", icon: TrendingUp, color: "text-indigo-600" },
                    { label: "Talent Utilization", value: "92.8%", trend: "+1.1%", icon: Users, color: "text-blue-600" },
                    { label: "Task Efficiency", value: "76.4%", trend: "-0.5%", icon: Zap, color: "text-amber-600" },
                    { label: "AI Prediction Accuracy", value: "99.1%", trend: "Stable", icon: ShieldCheck, color: "text-emerald-600" }
                ].map((kpi, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm rounded-xl hover:shadow-md transition-all overflow-hidden bg-white">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className={cn("p-2 rounded-lg bg-slate-50", kpi.color)}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                                    kpi.trend.includes("+") ? "bg-emerald-50 text-emerald-600" :
                                        kpi.trend === "Stable" ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-600")}>
                                    {kpi.trend}
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                            <h2 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h2>
                        </div>
                        <div className="h-1 bg-slate-100 w-full">
                            <div className={cn("h-full", kpi.color.replace("text", "bg"))} style={{ width: '60%' }} />
                        </div>
                    </Card>
                ))}
            </div>

            {/* ── PRIMARY ANALYTICS ROW ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* ── TEAM PERFORMANCE BAR CHART ── */}
                <Card className="xl:col-span-2 border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-slate-400" /> Organizational Team Performance
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">Efficiency rating (%) by operational unit</CardDescription>
                        </div>
                        <select className="text-xs font-bold border-slate-200 rounded-md p-1 outline-none">
                            <option>Current Quarter</option>
                            <option>Previous Quarter</option>
                        </select>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={teamStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                    />
                                    <Bar dataKey="efficiency" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* ── TOP 3 EMPLOYEE PERFORMANCE PIE CHART ── */}
                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-slate-400" /> Talent Output Distribution
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">Top 3 performers contribution to total resolved tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topPerformersPie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {topPerformersPie.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CORPORATE_PALETTE[index % CORPORATE_PALETTE.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700 }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(val) => <span className="text-[10px] font-bold text-slate-500 uppercase">{val}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── SECONDARY ANALYTICS & STRATEGIC RECOMMENDATIONS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* ── PERFORMANCE TREND LINE CHART ── */}
                <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 border-b border-slate-100">
                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-slate-400" /> Structural Trend Analysis
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">Predictive forecasting of efficiency and resource utilization</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={performanceTrend}>
                                    <defs>
                                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                                    <Area type="monotone" dataKey="efficiency" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#trendGrad)" />
                                    <Area type="monotone" dataKey="utilization" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* ── STRATEGIC BRIEFING & ACTIONABLE INSIGHTS ── */}
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-2xl bg-[#0f172a] text-white overflow-hidden border-none p-8 relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-white/10 border border-white/10">
                                    <Brain className="w-5 h-5 text-indigo-300" />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">Executive Neural Summary</h3>
                            </div>
                            <p className="text-lg font-medium text-slate-300 leading-relaxed italic">
                                &quot;Strategic assessment identifies a <span className="text-white font-black underline decoration-indigo-500/50">structural bottleneck</span> in department-wide task turnover. Recommendation: Prioritize resource reallocation to the Top 3 performers to capitalize on current operational momentum.&quot;
                            </p>
                            <div className="flex items-center gap-6 mt-10">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Risk Assessment</p>
                                    <p className="text-xl font-bold text-emerald-400">Low Exposure</p>
                                </div>
                                <div className="h-10 w-[1px] bg-white/10" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Growth Forecast</p>
                                    <p className="text-xl font-bold text-white">+14.2% YoY</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mb-20" />
                    </Card>
                </div>
            </div>

            {/* ── DETAILED PERFORMANCE TABLE (CORPORATE ROSTER) ── */}
            <Card className="border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Operational Unit Roster</CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">High-fidelity efficiency assessment by operational team</CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Operational Unit</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Efficiency Rating</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Load Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Operational Scale</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teamStats.map((team, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-slate-900">{team.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Synced: {new Date().toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-900" style={{ width: `${team.efficiency}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{team.efficiency}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase rounded-md h-5 px-2", STATUS_COLORS[team.status as keyof typeof STATUS_COLORS])}>
                                            {team.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-slate-900">{team.operations} <span className="text-[10px] text-slate-400 font-medium">Ops</span></span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
