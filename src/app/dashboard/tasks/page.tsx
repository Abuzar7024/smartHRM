"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApp, Task, Employee } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, CheckCircle2, Clock, Search, MoreHorizontal, Calendar, Layout, Paperclip, MessageSquare, History, UsersRound, Briefcase, Play, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export default function TasksPage() {
    const { role, user } = useAuth();
    const router = useRouter();
    const { tasks, employees, teams, updateTaskStatus, deleteTask, updateTask, addTaskComment, addTaskAttachment, manageTaskTeam } = useApp();
    const [search, setSearch] = useState("");
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [filterAssignee, setFilterAssignee] = useState("all");
    const [filterOverdue, setFilterOverdue] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Task>>({});
    const [newLink, setNewLink] = useState({ name: "", url: "" });
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [editTagsString, setEditTagsString] = useState("");

    const myEmp = employees.find((emp: Employee) => emp.email === user?.email);
    const isTeamLeader = teams.some(t => t.leaderEmail === user?.email);
    const myLedTeam = teams.find(t => t.leaderEmail === user?.email);

    const visibleTasks = (role === "employer" || (myEmp?.permissions || []).includes("admin_access"))
        ? tasks
        : isTeamLeader && myLedTeam
            ? tasks.filter(t =>
                t.assigneeEmails.includes(user?.email || "") ||
                t.creatorEmail === user?.email ||
                (myLedTeam.memberEmails || []).some(email => t.assigneeEmails.includes(email))
            )
            : tasks.filter(t => t.assigneeEmails.includes(user?.email || "") || t.creatorEmail === user?.email);

    const filteredTasks = visibleTasks.filter((task: Task) => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.assigneeEmails.some(email => email.toLowerCase().includes(search.toLowerCase()));
        const matchesAssignee = filterAssignee === "all" || task.assigneeEmails.includes(filterAssignee);
        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "Completed";
        const matchesOverdue = !filterOverdue || isOverdue;

        return matchesSearch && matchesAssignee && matchesOverdue;
    });

    const columns = [
        { id: "Pending", title: "To Do", icon: Clock },
        { id: "In Progress", title: "In Progress", icon: Play },
        { id: "Completed", title: "Done", icon: CheckCircle2 }
    ];

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50/30">
            {/* --- Header Area --- */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Layout className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Project Board</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Workflow Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            placeholder="Filter by title or user..."
                            className="h-9 pl-9 rounded-xl bg-slate-100/50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="h-9 rounded-xl bg-slate-100/50 border-none text-xs font-bold px-3 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            value={filterAssignee}
                            onChange={(e) => setFilterAssignee(e.target.value)}
                        >
                            <option value="all">All Personnel</option>
                            {employees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}
                        </select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterOverdue(!filterOverdue)}
                            className={cn(
                                "h-9 rounded-xl text-xs font-bold px-3",
                                filterOverdue ? "bg-rose-50 text-rose-600" : "text-slate-400"
                            )}
                        >
                            Overdue
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard/tasks/assign")}
                            className="h-9 rounded-xl bg-slate-900 border-none text-white font-bold text-xs px-4 shadow-lg shadow-slate-200 flex items-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Assign Task</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- Kanban Board --- */}
            <div className="flex-1 overflow-x-auto p-6 md:p-8">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    <LayoutGroup>
                        {columns.map((col) => (
                            <div
                                key={col.id}
                                className="flex-1 flex flex-col min-w-[320px] max-w-[400px]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    const taskId = e.dataTransfer.getData("taskId");
                                    const task = tasks.find(t => t.id === taskId);
                                    if (taskId && task) {
                                        if (task.assigneeEmails.includes(user?.email || "") || role === "employer") {
                                            updateTaskStatus(taskId, col.id as any);
                                        } else {
                                            import("sonner").then(({ toast }) => toast.error("Access Denied", { description: "You can only update tasks assigned to you." }));
                                        }
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", col.id === "Pending" ? "bg-slate-400" : col.id === "In Progress" ? "bg-indigo-500" : "bg-emerald-500")} />
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">{col.title}</h3>
                                        <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 shadow-sm">
                                            {filteredTasks.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-8 h-8 rounded-full hover:bg-white transition-all flex items-center justify-center text-slate-300 cursor-pointer">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className={cn("flex-1 p-3 rounded-[2.5rem] bg-slate-100/40 border-2 border-transparent hover:border-indigo-100 transition-all duration-300 overflow-y-auto")}>
                                    <div className="space-y-4">
                                        <AnimatePresence mode="popLayout">
                                            {filteredTasks
                                                .filter(t => t.status === col.id)
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((task) => (
                                                    <motion.div
                                                        layout
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e: any) => e.dataTransfer.setData("taskId", task.id!)}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-indigo-200/20 transition-all duration-300"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex flex-col gap-1.5 items-start">
                                                                <div className={cn(
                                                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                                    task.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                                        task.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                                                            "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                )}>
                                                                    {task.priority}
                                                                </div>
                                                                {task.category && (
                                                                    <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                                        <Briefcase className="w-2 h-2" /> {task.category}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="text-slate-200 group-hover:text-slate-400 transition-colors">
                                                                <Dialog open={activeTaskId === task.id} onOpenChange={(open) => {
                                                                    setActiveTaskId(open ? task.id! : null);
                                                                    if (!open) { setIsEditing(false); setEditData({}); }
                                                                }}>
                                                                    <DialogTrigger asChild>
                                                                        <button
                                                                            className="p-1 hover:bg-slate-50 rounded-lg transition-colors"
                                                                            onClick={() => {
                                                                                setActiveTaskId(task.id!);
                                                                                setEditData({
                                                                                    title: task.title,
                                                                                    description: task.description,
                                                                                    priority: task.priority,
                                                                                    dueDate: task.dueDate,
                                                                                    assigneeEmails: task.assigneeEmails,
                                                                                    category: task.category,
                                                                                    estimatedHours: task.estimatedHours
                                                                                });
                                                                                setEditTagsString((task.tags || []).join(", "));
                                                                            }}
                                                                        >
                                                                            <MoreHorizontal className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="rounded-3xl border-none shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
                                                                        <DialogHeader>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className={cn(
                                                                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                                                                                    task.priority === "High" ? "bg-rose-50 text-rose-600" :
                                                                                        task.priority === "Medium" ? "bg-amber-50 text-amber-600" :
                                                                                            "bg-emerald-50 text-emerald-600"
                                                                                )}>
                                                                                    {task.priority} Priority
                                                                                </div>
                                                                                <Badge variant="outline" className="text-[10px] font-bold rounded-md">{task.status}</Badge>
                                                                            </div>
                                                                            <DialogTitle className="text-2xl font-black text-slate-900">{task.title}</DialogTitle>
                                                                            <DialogDescription className="text-slate-500 font-medium">
                                                                                Created {new Date(task.createdAt).toLocaleDateString()} • Assigned to {task.assigneeEmails.length} personnel
                                                                            </DialogDescription>
                                                                        </DialogHeader>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                                                                            <div className="md:col-span-2 space-y-6">
                                                                                <div className="space-y-2">
                                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</h5>
                                                                                    {isEditing ? (
                                                                                        <Textarea
                                                                                            className="rounded-2xl min-h-[100px] bg-slate-50 border-slate-100 text-sm"
                                                                                            value={editData.description || ""}
                                                                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                                                                        />
                                                                                    ) : (
                                                                                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                                                                                            "{task.description}"
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                {isEditing && (
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <div className="space-y-2">
                                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</h5>
                                                                                            <select
                                                                                                className="w-full h-10 rounded-xl bg-slate-50 border border-slate-100 text-xs px-2"
                                                                                                value={editData.priority}
                                                                                                onChange={e => setEditData({ ...editData, priority: e.target.value as any })}
                                                                                            >
                                                                                                <option value="Low">Low</option>
                                                                                                <option value="Medium">Medium</option>
                                                                                                <option value="High">High</option>
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</h5>
                                                                                            <Input
                                                                                                type="date"
                                                                                                className="h-10 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                                                                                                value={editData.dueDate}
                                                                                                onChange={e => setEditData({ ...editData, dueDate: e.target.value })}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</h5>
                                                                                            <select
                                                                                                className="w-full h-10 rounded-xl bg-slate-50 border border-slate-100 text-xs px-2"
                                                                                                value={editData.category}
                                                                                                onChange={e => setEditData({ ...editData, category: e.target.value })}
                                                                                            >
                                                                                                {["General", "Development", "Design", "Marketing", "Management", "Operations", "Urgent"].map(c => (
                                                                                                    <option key={c} value={c}>{c}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="space-y-2">
                                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effort (Hrs)</h5>
                                                                                            <HourClockPicker
                                                                                                value={editData.estimatedHours || 0}
                                                                                                onChange={h => setEditData({ ...editData, estimatedHours: h })}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="col-span-2 space-y-2">
                                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags (comma separated)</h5>
                                                                                            <Input
                                                                                                className="h-10 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                                                                                                value={editTagsString}
                                                                                                onChange={e => setEditTagsString(e.target.value)}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <div className="space-y-4">
                                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                                        <MessageSquare className="w-3 h-3" /> Comments ({task.comments?.length || 0})
                                                                                    </h5>
                                                                                    <div className="space-y-3">
                                                                                        {task.comments?.map((c, i) => (
                                                                                            <div key={i} className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm">
                                                                                                <div className="flex items-center justify-between mb-1">
                                                                                                    <span className="text-[10px] font-black text-indigo-600">{c.user.split('@')[0]}</span>
                                                                                                    <span className="text-[9px] font-bold text-slate-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                                </div>
                                                                                                <p className="text-xs text-slate-600 font-medium">{c.text}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                        <div className="flex gap-2 mt-2">
                                                                                            <Input
                                                                                                placeholder="Add a comment..."
                                                                                                className="h-9 rounded-xl text-xs bg-slate-50 border-slate-100"
                                                                                                value={commentText}
                                                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === 'Enter' && commentText.trim()) {
                                                                                                        addTaskComment(task.id!, commentText);
                                                                                                        setCommentText("");
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                            <Button
                                                                                                size="sm"
                                                                                                className="h-9 w-9 rounded-xl bg-slate-900 text-white p-0"
                                                                                                onClick={() => {
                                                                                                    if (commentText.trim()) {
                                                                                                        addTaskComment(task.id!, commentText);
                                                                                                        setCommentText("");
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-6 border-l border-slate-100 pl-6">
                                                                                <div className="space-y-3">
                                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                                        <History className="w-3 h-3" /> Activity Log
                                                                                    </h5>
                                                                                    <div className="space-y-4">
                                                                                        {task.history?.slice(-5).reverse().map((h, i) => (
                                                                                            <div key={i} className="flex gap-3 relative last:after:hidden after:absolute after:left-[7px] after:top-4 after:bottom-[-20px] after:w-[1px] after:bg-slate-200">
                                                                                                <div className="w-4 h-4 rounded-full bg-slate-200 border-4 border-white z-10 flex-shrink-0" />
                                                                                                <div className="space-y-0.5">
                                                                                                    <p className="text-[10px] font-black text-slate-900 leading-tight">{h.type}</p>
                                                                                                    <p className="text-[9px] text-slate-500 font-bold">{h.detail || h.user.split('@')[0]}</p>
                                                                                                    <p className="text-[8px] text-slate-400 font-bold">{new Date(h.timestamp).toLocaleDateString()}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {task.assignmentType === "Delegate" && task.assigneeEmails[0] === user?.email && (
                                                                                    <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
                                                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                                            <UsersRound className="w-3 h-3" /> Team Management
                                                                                        </h5>
                                                                                        <div className="flex flex-wrap gap-2 p-2 rounded-2xl border border-slate-200 bg-slate-50/10 min-h-[44px]">
                                                                                            {employees.map(emp => (
                                                                                                <button
                                                                                                    key={emp.id}
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        const current = task.assigneeEmails;
                                                                                                        let newList;
                                                                                                        if (current.includes(emp.email)) {
                                                                                                            if (current.indexOf(emp.email) === 0) return;
                                                                                                            newList = current.filter(e => e !== emp.email);
                                                                                                        } else {
                                                                                                            newList = [...current, emp.email];
                                                                                                        }
                                                                                                        manageTaskTeam(task.id!, newList);
                                                                                                    }}
                                                                                                    className={cn(
                                                                                                        "px-3 py-1 rounded-xl text-[10px] font-bold border transition-all",
                                                                                                        task.assigneeEmails.includes(emp.email)
                                                                                                            ? "bg-slate-800 text-white border-slate-800"
                                                                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                                                                    )}
                                                                                                >
                                                                                                    {emp.name}
                                                                                                </button>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                <div className="space-y-3 pt-4">
                                                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                                        <Paperclip className="w-3 h-3" /> Attachments
                                                                                    </h5>
                                                                                    <div className="space-y-2">
                                                                                        {task.attachments?.map((a, i) => (
                                                                                            <a key={i} href={a.url.startsWith('http') ? a.url : `https://${a.url}`} target="_blank" className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                                                                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                                                                    <Paperclip className="w-3 h-3 text-indigo-500" />
                                                                                                </div>
                                                                                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 truncate">{a.name}</span>
                                                                                            </a>
                                                                                        ))}

                                                                                        {isAddingLink ? (
                                                                                            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                                                <Input
                                                                                                    placeholder="Link Name"
                                                                                                    className="h-8 text-[10px] rounded-lg"
                                                                                                    value={newLink.name}
                                                                                                    onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                                                                                                />
                                                                                                <Input
                                                                                                    placeholder="URL"
                                                                                                    className="h-8 text-[10px] rounded-lg"
                                                                                                    value={newLink.url}
                                                                                                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                                                                                />
                                                                                                <div className="flex gap-2">
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        className="h-7 flex-1 text-[10px] bg-slate-900"
                                                                                                        onClick={() => {
                                                                                                            if (newLink.name && newLink.url) {
                                                                                                                addTaskAttachment(task.id!, newLink.name, newLink.url);
                                                                                                                setNewLink({ name: "", url: "" });
                                                                                                                setIsAddingLink(false);
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        Add
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="ghost"
                                                                                                        className="h-7 text-[10px]"
                                                                                                        onClick={() => setIsAddingLink(false)}
                                                                                                    >
                                                                                                        Cancel
                                                                                                    </Button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="w-full h-8 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:text-indigo-500 text-[10px] font-bold"
                                                                                                onClick={() => setIsAddingLink(true)}
                                                                                            >
                                                                                                <Plus className="w-3 h-3 mr-1" /> Add Link
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <DialogFooter className="flex sm:justify-between items-center border-t border-slate-100 pt-6 mt-4">
                                                                            <div className="flex gap-2">
                                                                                {role === "employer" && (
                                                                                    <>
                                                                                        {isEditing ? (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                className="rounded-xl bg-indigo-600 text-white font-bold text-xs px-4"
                                                                                                onClick={async () => {
                                                                                                    const finalData = {
                                                                                                        ...editData,
                                                                                                        tags: editTagsString.split(",").map(t => t.trim()).filter(t => t !== "")
                                                                                                    };
                                                                                                    await updateTask(task.id!, finalData);
                                                                                                    setIsEditing(false);
                                                                                                }}
                                                                                            >
                                                                                                Save
                                                                                            </Button>
                                                                                        ) : (
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs px-4"
                                                                                                onClick={() => setIsEditing(true)}
                                                                                            >
                                                                                                Edit
                                                                                            </Button>
                                                                                        )}
                                                                                        <Button variant="ghost" className="rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs" onClick={() => deleteTask(task.id!)}>Delete</Button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">ID: {task.id?.slice(-6)}</Badge>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        </div>

                                                        <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-tight">{task.title}</h4>
                                                        <p className="text-[11px] text-slate-500 line-clamp-2 font-medium mb-4 leading-relaxed">{task.description}</p>

                                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                            <div className="flex items-center -space-x-2">
                                                                {task.assigneeEmails.slice(0, 3).map((email, idx) => (
                                                                    <div key={idx} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-600 ring-1 ring-slate-100" title={email}>
                                                                        {email[0].toUpperCase()}
                                                                    </div>
                                                                ))}
                                                                {task.assigneeEmails.length > 3 && (
                                                                    <div className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 ring-1 ring-indigo-50">
                                                                        +{task.assigneeEmails.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                {task.comments && task.comments.length > 0 && (
                                                                    <div className="flex items-center gap-1 text-slate-400">
                                                                        <MessageSquare className="w-3 h-3" />
                                                                        <span className="text-[10px] font-bold">{task.comments.length}</span>
                                                                    </div>
                                                                )}
                                                                {task.attachments && task.attachments.length > 0 && (
                                                                    <div className="flex items-center gap-1 text-slate-400">
                                                                        <Paperclip className="w-3 h-3" />
                                                                        <span className="text-[10px] font-bold">{task.attachments.length}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(task.dueDate).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 flex items-center gap-2">
                                                            {(role === "employer" || task.assigneeEmails.includes(user?.email || "")) && (
                                                                <>
                                                                    {task.status === "Pending" && (
                                                                        <Button
                                                                            onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id!, "In Progress"); }}
                                                                            size="sm"
                                                                            className="h-8 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-indigo-100"
                                                                        >
                                                                            <Play className="w-3 h-3 mr-1.5" /> Start
                                                                        </Button>
                                                                    )}
                                                                    {task.status === "In Progress" && (
                                                                        <Button
                                                                            onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id!, "Completed"); }}
                                                                            size="sm"
                                                                            className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-emerald-100"
                                                                        >
                                                                            <Check className="w-3 h-3 mr-1.5" /> Complete
                                                                        </Button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                        </AnimatePresence>

                                        {filteredTasks.filter(t => t.status === col.id).length === 0 && (
                                            <div className="py-12 flex flex-col items-center gap-2 opacity-30 select-none">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                    <col.icon className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registry Empty</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </LayoutGroup>
                </div>
            </div>
        </div>
    );
}

function HourClockPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold flex items-center gap-2 transition-all hover:bg-slate-100 focus:ring-4 focus:ring-indigo-100"
            >
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>{value} Hours</span>
                <span className="ml-auto text-[9px] text-slate-400 font-black uppercase">Set</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-[60] bg-slate-900/10 backdrop-blur-[2px]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full mb-3 left-0 z-[70] p-5 bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-5 min-w-[240px]"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Hours</h4>
                                <div className="text-2xl font-black text-indigo-600 tabular-nums">{value}<span className="text-slate-300 text-sm ml-1">HRS</span></div>
                            </div>

                            <div className="relative w-40 h-40 rounded-full bg-slate-50 border-4 border-white shadow-inner flex items-center justify-center">
                                <div className="absolute w-1.5 h-1.5 rounded-full bg-indigo-600 z-20" />
                                <motion.div
                                    className="absolute bottom-1/2 left-1/2 w-1 bg-indigo-600 rounded-full origin-bottom z-10"
                                    style={{
                                        height: '55px',
                                        translateX: '-50%',
                                        rotate: (value % 12) * 30
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />

                                {hours.map((h, i) => {
                                    const angle = (i * 30) - 90;
                                    const radius = 60;
                                    const x = Math.cos(angle * (Math.PI / 180)) * radius;
                                    const y = Math.sin(angle * (Math.PI / 180)) * radius;

                                    return (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => onChange(h)}
                                            className={cn(
                                                "absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all hover:scale-125 z-30",
                                                value % 12 === h % 12 ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-indigo-600"
                                            )}
                                            style={{
                                                left: `calc(50% + ${x}px)`,
                                                top: `calc(50% + ${y}px)`,
                                                transform: 'translate(-50%, -50%)'
                                            }}
                                        >
                                            {h}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => onChange(Math.max(0, value - 1))}
                                    className="flex-1 h-8 rounded-lg bg-slate-50 text-slate-600 font-bold text-[10px] hover:bg-slate-100 transition-colors"
                                >
                                    -1
                                </button>
                                <button
                                    onClick={() => onChange(value + 1)}
                                    className="flex-1 h-8 rounded-lg bg-slate-50 text-slate-600 font-bold text-[10px] hover:bg-slate-100 transition-colors"
                                >
                                    +1
                                </button>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                className="w-full rounded-xl h-8 bg-slate-900 text-white font-black text-[10px]"
                            >
                                Confirm
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
