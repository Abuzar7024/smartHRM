"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import {
    UsersRound,
    User,
    Briefcase,
    Calendar,
    Clock,
    Tag,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Sparkles,
    Layout,
    ArrowRight,
    Zap,
    Gauge,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = [
    { id: "details", title: "Core Details", icon: Layout },
    { id: "assignment", title: "Delegation", icon: UsersRound },
    { id: "metadata", title: "Resources & Metadata", icon: Briefcase },
    { id: "review", title: "Review & Deploy", icon: Sparkles }
];

const CATEGORIES = ["General", "Development", "Design", "Marketing", "Management", "Operations", "Urgent"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function AssignTaskPage() {
    const router = useRouter();
    const { user, role } = useAuth();
    const { employees, teams, addTask, tasks } = useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const [isOrchestrating, setIsOrchestrating] = useState(false);

    const myAssignments = tasks.filter(t => t.creatorEmail === user?.email);

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium" as "Low" | "Medium" | "High",
        dueDate: "",
        assignmentType: "Individual" as "Individual" | "Team" | "Delegate",
        assigneeEmails: [] as string[],
        teamId: "",
        estimatedHours: 0,
        category: "General",
        tags: ""
    });

    const myEmp = employees.find((emp: Employee) => emp.email === user?.email);
    const isTeamLeader = teams.some(t => t.leaderEmail === user?.email);
    const myLedTeam = teams.find(t => t.leaderEmail === user?.email);

    const assignableEmployees = (role?.toLowerCase() === "employer" || (myEmp?.permissions || []).includes("assign_tasks"))
        ? employees
        : myLedTeam
            ? employees.filter(e => (myLedTeam.memberEmails || []).includes(e.email))
            : [];

    const handleNext = () => {
        if (currentStep === 0 && !form.title) {
            toast.error("Required Field", { description: "Please enter a task title to proceed." });
            return;
        }
        if (currentStep === 1) {
            if (form.assignmentType === "Individual" && form.assigneeEmails.length === 0) {
                toast.error("Assignee Required", { description: "Select at least one individual for this task." });
                return;
            }
            if (form.assignmentType === "Team" && !form.teamId) {
                toast.error("Team Required", { description: "Select a team for this assignment." });
                return;
            }
            if (form.assignmentType === "Delegate" && form.assigneeEmails.length === 0) {
                toast.error("Lead Required", { description: "Select a lead who will assemble the team." });
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        try {
            await addTask({
                title: form.title,
                description: form.description,
                assigneeEmails: form.assigneeEmails,
                priority: form.priority,
                dueDate: form.dueDate,
                assignmentType: form.assignmentType,
                teamId: form.teamId,
                estimatedHours: form.estimatedHours,
                category: form.category,
                tags: form.tags.split(",").map(t => t.trim()).filter(t => t !== "")
            });
            toast.success("Task Orchestrated", { description: "The assignment has been successfully deployed." });
            setIsOrchestrating(false);
            setCurrentStep(0);
            setForm({
                title: "",
                description: "",
                priority: "Medium",
                dueDate: "",
                assignmentType: "Individual",
                assigneeEmails: [],
                teamId: "",
                estimatedHours: 0,
                category: "General",
                tags: ""
            });
        } catch (error) {
            toast.error("Deployment Failed", { description: "An error occurred while creating the task." });
        }
    };

    const toggleAssignee = (email: string) => {
        if (form.assignmentType === "Delegate") {
            setForm({ ...form, assigneeEmails: [email] });
        } else {
            setForm(prev => ({
                ...prev,
                assigneeEmails: prev.assigneeEmails.includes(email)
                    ? prev.assigneeEmails.filter(e => e !== email)
                    : [...prev.assigneeEmails, email]
            }));
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10">
            {/* --- Progressive Header --- */}
            <div className="max-w-5xl mx-auto mb-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-indigo-600" />
                            Task Orchestration
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Design and deploy high-impact directives across your organization.</p>
                    </div>
                    {isOrchestrating ? (
                        <Button variant="ghost" onClick={() => setIsOrchestrating(false)} className="rounded-xl font-bold text-slate-400 hover:text-slate-600">
                            Back to Assignments
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setIsOrchestrating(true)}
                            className="rounded-2xl bg-indigo-600 text-white font-black px-6 py-6 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>Assign New Task</span>
                        </Button>
                    )}
                </div>

                {!isOrchestrating && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Deployed</p>
                                <p className="text-3xl font-black text-slate-900">{myAssignments.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Directives</p>
                                <p className="text-3xl font-black text-indigo-600">{myAssignments.filter(t => t.status !== "Completed").length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Finalized</p>
                                <p className="text-3xl font-black text-emerald-600">{myAssignments.filter(t => t.status === "Completed").length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900">Assignment History</h2>
                                <Button variant="ghost" size="sm" className="text-indigo-600 font-bold text-xs" onClick={() => router.push("/dashboard/tasks")}>
                                    View Kanban Board <ArrowRight className="ml-1 w-3 h-3" />
                                </Button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {myAssignments.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Briefcase className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-bold">No tasks deployed yet.</p>
                                        <Button
                                            variant="ghost"
                                            className="mt-2 text-indigo-600 font-black text-xs"
                                            onClick={() => setIsOrchestrating(true)}
                                        >
                                            Initiate first task
                                        </Button>
                                    </div>
                                ) : (
                                    myAssignments.map((task) => (
                                        <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center group">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                                                    <span className={cn(
                                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                                        task.priority === "High" ? "bg-rose-50 text-rose-600" :
                                                            task.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                                                                "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {task.assigneeEmails.length} Assignees</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.dueDate}</span>
                                                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {task.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-sm",
                                                    task.status === "Completed" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {task.status}
                                                </span>
                                                <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => router.push(`/dashboard/tasks?id=${task.id}`)}>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isOrchestrating && (
                    <>
                        {/* --- Steps Indicator --- */}
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {STEPS.map((step, idx) => (
                                <div key={step.id} className="relative">
                                    <div className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        idx <= currentStep ? "bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)]" : "bg-slate-200"
                                    )} />
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                            idx === currentStep ? "bg-indigo-600 text-white scale-110" : idx < currentStep ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            {idx < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <step.icon className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-wider hidden sm:block",
                                            idx === currentStep ? "text-slate-900" : "text-slate-400"
                                        )}>
                                            {step.title}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* --- Form Canvas --- */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/60 bg-white min-h-[500px] flex flex-col">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-black text-slate-900">{STEPS[currentStep].title}</CardTitle>
                                        <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Step {currentStep + 1} of 4</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-4 flex-1">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentStep}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-6"
                                            >
                                                {currentStep === 0 && (
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Directive Title</Label>
                                                            <Input
                                                                placeholder="Define the primary objective..."
                                                                className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold focus:ring-4 focus:ring-indigo-100 transition-all px-6"
                                                                value={form.title}
                                                                onChange={e => setForm({ ...form, title: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Detailed Description</Label>
                                                            <Textarea
                                                                placeholder="Provide context, constraints, and success criteria..."
                                                                className="min-h-[160px] rounded-3xl bg-slate-50 border-none text-slate-600 font-medium focus:ring-4 focus:ring-indigo-100 transition-all p-6 text-sm resize-none"
                                                                value={form.description}
                                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 1 && (
                                                    <div className="space-y-8">
                                                        <div className="flex gap-4">
                                                            {[
                                                                { id: "Individual", label: "Individual", icon: User },
                                                                { id: "Team", label: "Team", icon: UsersRound },
                                                                { id: "Delegate", label: "Delegate", icon: Gauge }
                                                            ].map(type => (
                                                                <button
                                                                    key={type.id}
                                                                    onClick={() => setForm({ ...form, assignmentType: type.id as any, assigneeEmails: [], teamId: "" })}
                                                                    className={cn(
                                                                        "flex-1 p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2",
                                                                        form.assignmentType === type.id
                                                                            ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100"
                                                                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                                                    )}
                                                                >
                                                                    <type.icon className="w-5 h-5" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-4">
                                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                                {form.assignmentType === "Individual" ? "Select Personnel" : form.assignmentType === "Team" ? "Select Team" : "Select Lead Delegate"}
                                                            </Label>

                                                            {form.assignmentType === "Team" ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                    {teams.map(team => (
                                                                        <button
                                                                            key={team.id}
                                                                            onClick={() => setForm({ ...form, teamId: team.id! })}
                                                                            className={cn(
                                                                                "p-4 rounded-2xl border transition-all text-left flex items-center gap-3",
                                                                                form.teamId === team.id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-100 hover:border-slate-300"
                                                                            )}
                                                                        >
                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                                                                                <UsersRound className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-black uppercase tracking-wider">{team.name}</p>
                                                                                <p className="text-[10px] opacity-60 font-medium">{team.memberEmails?.length} Members</p>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {assignableEmployees.map(emp => (
                                                                        <button
                                                                            key={emp.id}
                                                                            onClick={() => toggleAssignee(emp.email)}
                                                                            className={cn(
                                                                                "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                                                                form.assigneeEmails.includes(emp.email)
                                                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                                                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-400"
                                                                            )}
                                                                        >
                                                                            {emp.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 2 && (
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Functional Category</Label>
                                                                <select
                                                                    className="w-full h-12 rounded-2xl bg-slate-50 border-none text-sm font-bold px-4 focus:ring-4 focus:ring-indigo-100 appearance-none transition-all"
                                                                    value={form.category}
                                                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                                                >
                                                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Execution Priority</Label>
                                                                <div className="flex gap-2">
                                                                    {PRIORITIES.map(p => (
                                                                        <button
                                                                            key={p}
                                                                            onClick={() => setForm({ ...form, priority: p as any })}
                                                                            className={cn(
                                                                                "flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                                                form.priority === p
                                                                                    ? (p === "High" ? "bg-rose-50 text-rose-600 border-rose-200" : p === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")
                                                                                    : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                                                            )}
                                                                        >
                                                                            {p}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Due Date</Label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                                    <Input
                                                                        type="date"
                                                                        className="h-12 pl-12 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                                                                        value={form.dueDate}
                                                                        onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Estimated Effort (Hours)</Label>
                                                                <HourClockPicker
                                                                    value={form.estimatedHours}
                                                                    onChange={(h) => setForm({ ...form, estimatedHours: h })}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Professional Tags (Comma separated)</Label>
                                                            <div className="relative">
                                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                                <Input
                                                                    placeholder="e.g. Frontend, API, Design-Review"
                                                                    className="h-12 pl-12 rounded-2xl bg-slate-50 border-none text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all"
                                                                    value={form.tags}
                                                                    onChange={e => setForm({ ...form, tags: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentStep === 3 && (
                                                    <div className="space-y-8">
                                                        <div className="bg-slate-50 rounded-[2rem] p-8 border border-white space-y-6">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="text-2xl font-black text-slate-900">{form.title || "Untitled Directive"}</h3>
                                                                    <div className="flex gap-2 mt-2">
                                                                        <span className={cn(
                                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                                            form.priority === "High" ? "bg-rose-100 text-rose-600" : form.priority === "Medium" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                                                        )}>
                                                                            {form.priority} Priority
                                                                        </span>
                                                                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest">
                                                                            {form.category}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                                                                    <p className="text-sm font-black text-slate-900">{form.dueDate || "Not set"}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective</p>
                                                                <p className="text-sm text-slate-600 font-medium leading-relaxed italic line-clamp-3">"{form.description || "No description provided."}"</p>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200/60">
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Personnel</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {form.assignmentType === "Team" ? (
                                                                            <span className="text-xs font-bold text-slate-900">Team: {teams.find(t => t.id === form.teamId)?.name}</span>
                                                                        ) : form.assigneeEmails.length > 0 ? (
                                                                            form.assigneeEmails.map(email => (
                                                                                <span key={email} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                                                                                    {email.split('@')[0]}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-rose-500">Unassigned</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Allocation</p>
                                                                    <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                                                                        <Clock className="w-4 h-4 text-indigo-500" />
                                                                        {form.estimatedHours} Deployment Hours
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 p-6 rounded-3xl bg-indigo-600 text-white">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                                                <Zap className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black">Ready for Deployment</p>
                                                                <p className="text-[11px] opacity-80 font-medium">This task will be immediately visible to all assigned personnel upon creation.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </CardContent>
                                    <div className="p-8 pt-0 border-t border-slate-50 flex justify-between items-center bg-slate-50/50 rounded-b-[2.5rem]">
                                        <Button
                                            variant="ghost"
                                            onClick={handleBack}
                                            disabled={currentStep === 0}
                                            className="rounded-2xl h-12 px-6 font-bold text-slate-400 hover:text-slate-900 transition-all flex gap-2 items-center"
                                        >
                                            <ChevronLeft className="w-4 h-4" /> Back
                                        </Button>

                                        {currentStep === STEPS.length - 1 ? (
                                            <Button
                                                onClick={handleSubmit}
                                                className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-200 transition-all flex gap-2 items-center"
                                            >
                                                Deploy Directive <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handleNext}
                                                className="rounded-2xl h-12 px-8 bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 transition-all flex gap-2 items-center"
                                            >
                                                Continue <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                                    <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex items-center relative overflow-hidden">
                                        <Sparkles className="absolute right-[-10px] top-[-10px] w-24 h-24 text-white/10 rotate-12" />
                                        <div className="relative z-10">
                                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Orchestration Tip</p>
                                            <h4 className="text-white font-bold text-sm">Dynamic Delegation</h4>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                            Use <span className="text-indigo-600 font-black">Delegate</span> mode to empower a senior professional. They will be responsible for assembling their own task team and managing sub-resources.
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Avg. Completion Time</p>
                                                <p className="text-xs font-black text-slate-900">48-72 Hours</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900">Enterprise Context</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: "Project Visibility", value: "Global", icon: Layout },
                                            { label: "Security Protocol", value: "Encrypted", icon: ShieldCheck },
                                            { label: "Audit Logging", value: "Real-time", icon: History }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center group cursor-help">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-black group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function HourClockPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex items-center gap-2 w-full">
            {/* Numeric input */}
            <Input
                type="number"
                min={0}
                max={99}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="flex-1 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold focus:ring-4 focus:ring-indigo-100"
            />
            {/* Decrement button */}
            <Button
                type="button"
                onClick={() => onChange(Math.max(0, value - 1))}
                className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200"
            >
                −
            </Button>
            {/* Increment button */}
            <Button
                type="button"
                onClick={() => onChange(Math.min(99, value + 1))}
                className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200"
            >
                +
            </Button>
        </div>
    );
}



function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

function History(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
