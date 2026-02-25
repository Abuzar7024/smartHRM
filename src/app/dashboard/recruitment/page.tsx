"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Users, Plus, Building, UserPlus, Clock, Briefcase, ShieldCheck, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const openPositions = [
    { id: "REQ-001", title: "Senior React Developer", department: "Engineering", applicants: 24, posted: "2 weeks ago", type: "Full-time" },
    { id: "REQ-002", title: "Product Marketing Manager", department: "Marketing", applicants: 12, posted: "1 month ago", type: "Full-time" },
    { id: "REQ-003", title: "UX/UI Designer", department: "Design", applicants: 45, posted: "3 days ago", type: "Contract" },
];

export default function RecruitmentPage() {
    const { role } = useAuth();

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Recruitment pipelines are restricted to administrative accounts.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Recruitment Hub</h1>
                    <p className="text-sm text-slate-500">Manage active job requisitions and candidate funnels.</p>
                </div>
                <Button className="rounded-lg shadow-sm" variant="corporate">
                    <Plus className="w-4 h-4 mr-2" /> Create Requisition
                </Button>
            </div>

            {/* ── Hiring Indicators ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Jobs", value: "3", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Candidates", value: "81", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Interviews Slated", value: "5", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Hired (YTD)", value: "11", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50" },
                ].map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Open Positions ── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Requisitions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {openPositions.map((job) => (
                        <Card key={job.id} className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-slate-300 transition-all cursor-pointer group flex flex-col">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 rounded-md font-bold text-[10px] h-5 px-2">
                                        {job.department}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {job.posted.toUpperCase()}
                                    </span>
                                </div>
                                <CardTitle className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                                    {job.title}
                                </CardTitle>
                                <CardDescription className="text-xs font-medium text-slate-500">
                                    {job.id} • {job.type}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 py-2 flex-1 flex flex-col justify-end">
                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Active Pipeline</span>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-3 h-3 text-slate-300" />
                                        <span className="font-bold text-slate-900">{job.applicants}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100 mt-2">
                                <Button variant="ghost" className="w-full text-xs font-bold text-primary hover:bg-primary/5 rounded-lg h-9">
                                    View Funnel <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
