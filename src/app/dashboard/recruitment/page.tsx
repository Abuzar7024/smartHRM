"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Building, UserPlus, Clock, Briefcase, ShieldCheck, ArrowUpRight, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function RecruitmentPage() {
    const { role } = useAuth();
    const { jobs, addJob, updateJobStatus } = useApp();
    const [showForm, setShowForm] = useState(false);

    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [type, setType] = useState<"Full-time" | "Contract" | "Part-time">("Full-time");

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Recruitment pipelines are restricted to administrative accounts.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addJob({ title, department, type, status: "Active" });
            toast.success("Job Posted", { description: `${title} has been added to the recruitment hub.` });
            setShowForm(false);
            setTitle("");
            setDepartment("");
        } catch (error) {
            toast.error("Failed to post job");
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Recruitment Hub</h1>
                    <p className="text-sm text-slate-500">Manage active job requisitions and candidate funnels.</p>
                </div>
                <Button
                    className="rounded-lg shadow-sm"
                    variant={showForm ? "outline" : "corporate"}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {showForm ? "Cancel" : "Create Requisition"}
                </Button>
            </div>

            {/* ── Create Job Form ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="border-slate-200 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">New Job Requisition</CardTitle>
                                <CardDescription>Post a new opening to start collecting applications.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <Input
                                            placeholder="e.g. Senior Frontend Engineer"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input
                                            placeholder="e.g. Engineering"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Employment Type</Label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary/20"
                                            value={type}
                                            onChange={(e) => setType(e.target.value as any)}
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Part-time">Part-time</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3 flex justify-end gap-3">
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Discard</Button>
                                        <Button type="submit" variant="corporate">Post Job</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hiring Indicators (Now Dynamic) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Jobs", value: jobs.filter(j => j.status === "Active").length.toString(), icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Candidates", value: jobs.reduce((acc, job) => acc + job.applicants, 0).toString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Interviews Slated", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Hired (YTD)", value: "0", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50" },
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
                {jobs.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No active job requisitions found.</p>
                        <p className="text-slate-400 text-xs mt-1">Click "Create Requisition" to add your first job post.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.id} className="border-slate-200 shadow-sm rounded-xl overflow-hidden hover:border-slate-300 transition-all group flex flex-col">
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 rounded-md font-bold text-[10px] h-5 px-2">
                                            {job.department}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(job.postedAt).toLocaleDateString().toUpperCase()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                                        {job.title}
                                    </CardTitle>
                                    <CardDescription className="text-xs font-medium text-slate-500">
                                        {job.type} • {job.status}
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
                                <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-100 mt-2 flex gap-2">
                                    <Button variant="ghost" className="flex-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg h-9">
                                        View Funnel <ArrowUpRight className="w-3 h-3 ml-1" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                        onClick={() => updateJobStatus(job.id!, "Closed")}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
