"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, Task, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Clock, Search, Filter, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export default function TasksPage() {
    const { role, user } = useAuth();
    const { tasks, employees, teams, addTask, updateTaskStatus } = useApp();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isAddOpen, setIsAddOpen] = useState(false);

    const myEmp = employees.find((emp: Employee) => emp.email === user?.email);
    const isTeamLeader = teams.some(t => t.leaderEmail === user?.email);
    const canAssignTasks = role === "employer" || isTeamLeader || (myEmp?.permissions || []).includes("assign_tasks");

    // Team leader can only assign tasks to their own team members
    const myLedTeam = teams.find(t => t.leaderEmail === user?.email);
    const assignableEmployees = role === "employer"
        ? employees
        : myLedTeam
            ? employees.filter(e => (myLedTeam.memberEmails || []).includes(e.email))
            : [];

    // Employers see all tasks; team leaders see tasks for their team; employees see only their own
    const visibleTasks = role === "employer"
        ? tasks
        : isTeamLeader && myLedTeam
            ? tasks.filter(t =>
                t.assigneeEmail === user?.email ||
                (myLedTeam.memberEmails || []).includes(t.assigneeEmail)
            )
            : tasks.filter(t => t.assigneeEmail === user?.email);

    // New task form state
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        assigneeId: "",
        priority: "Medium" as "Low" | "Medium" | "High",
        dueDate: ""
    });

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const assignee = employees.find((emp: Employee) => emp.id === newTask.assigneeId);
        if (!assignee) return;

        await addTask({
            title: newTask.title,
            description: newTask.description,
            assigneeId: assignee.id!,
            assigneeEmail: assignee.email,
            status: "Pending",
            priority: newTask.priority,
            dueDate: newTask.dueDate,
            createdAt: new Date().toISOString()
        });
        setIsAddOpen(false);
        setNewTask({ title: "", description: "", assigneeId: "", priority: "Medium", dueDate: "" });
    };

    const filteredTasks = visibleTasks.filter((task: Task) => {
        const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.assigneeEmail.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Completed": return "success";
            case "In Progress": return "warning";
            case "Pending": return "secondary";
            default: return "default";
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
                    <p className="text-sm text-slate-500">Track and manage employee workloads and deadlines.</p>
                </div>
                {canAssignTasks && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="corporate" className="rounded-lg shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Assign New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] rounded-xl border-slate-200">
                            <form onSubmit={handleAddTask}>
                                <DialogHeader className="border-b pb-4 mb-4">
                                    <DialogTitle className="text-xl font-bold">Assign Task</DialogTitle>
                                    <DialogDescription>Create a new task and assign it to an employee.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
                                        <Input
                                            id="title"
                                            className="rounded-lg"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            placeholder="Task title..."
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                        <Textarea
                                            id="description"
                                            className="rounded-lg min-h-[100px]"
                                            value={newTask.description}
                                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                            placeholder="Task details..."
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Assignee</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={newTask.assigneeId}
                                                onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                                required
                                            >
                                                <option value="">Select employee</option>
                                                {assignableEmployees.map((emp) => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Priority</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={newTask.priority}
                                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label className="text-sm font-semibold">Due Date</Label>
                                            <Input
                                                type="date"
                                                className="rounded-lg"
                                                value={newTask.dueDate}
                                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="mt-8 pt-4 border-t gap-2 md:gap-0">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="corporate">Assign Task</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* ── Filters ── */}
            <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden border">
                <CardHeader className="p-4 md:p-6 bg-slate-50/50 border-b">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by task title or email..."
                                className="pl-9 rounded-lg border-slate-200 bg-white h-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
                            <select
                                className="h-9 w-full sm:w-40 rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white">
                                <TableHead className="w-[300px] h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Information</TableHead>
                                <TableHead className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</TableHead>
                                <TableHead className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Priority</TableHead>
                                <TableHead className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</TableHead>
                                <TableHead className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="h-10 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredTasks.map((task) => (
                                    <motion.tr
                                        key={task.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                                    >
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-slate-900">{task.title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                                    {task.assigneeEmail[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm text-slate-600 font-medium truncate max-w-[120px]">
                                                    {task.assigneeEmail.split('@')[0]}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                task.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-200" :
                                                    task.priority === "Medium" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                        "bg-emerald-50 text-emerald-600 border-emerald-200"
                                            )}>
                                                {task.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-slate-500">
                                            {new Date(task.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant={getStatusVariant(task.status)} className="rounded-md font-semibold text-[10px] uppercase px-2 h-5">
                                                {task.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            {role === "employee" && task.status !== "Completed" && (
                                                <div className="flex justify-end gap-2">
                                                    {task.status === "Pending" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-[11px] rounded-lg"
                                                            onClick={() => updateTaskStatus(task.id!, "In Progress")}
                                                        >
                                                            Start
                                                        </Button>
                                                    )}
                                                    {task.status === "In Progress" && (
                                                        <Button
                                                            size="sm"
                                                            variant="corporate"
                                                            className="h-8 text-[11px] rounded-lg shadow-none"
                                                            onClick={() => updateTaskStatus(task.id!, "Completed")}
                                                        >
                                                            Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            {canAssignTasks && (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredTasks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-24 text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 className="w-8 h-8 opacity-20" />
                                            <p className="text-sm font-medium">No tasks found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
