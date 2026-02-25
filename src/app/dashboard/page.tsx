"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, AlertTriangle, CalendarDays, CheckCircle, Clock, Check, CheckSquare, ArrowUpRight, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardOverview() {
    const [accepting, setAccepting] = useState(false);
    const { role, user, status } = useAuth();
    const { attendance, clockIn, clockOut, employees, tasks, leaves, documents, requestDocument, uploadDocument } = useApp();

    const [docTitle, setDocTitle] = useState("");
    const [docType, setDocType] = useState("Passport");
    const [docEmpEmail, setDocEmpEmail] = useState("");

    const handleAcceptInvitation = async () => {
        setAccepting(true);
        try {
            const res = await fetch('/api/auth/accept-invitation', { method: 'POST' });
            if (res.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAccepting(false);
        }
    };

    if (status === "pending") {
        return (
            <div className="flex items-center justify-center min-h-[70vh] p-4 md:p-8">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center pt-8">
                        <Users className="w-10 h-10 text-primary mx-auto mb-2" />
                        <CardTitle className="text-xl">Finalize Enrollment</CardTitle>
                        <CardDescription>Welcome to the organization's platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-slate-500 text-sm text-center">
                            Please confirm your invitation to activate your professional profile and access company resources.
                        </p>
                        <Button
                            variant="corporate"
                            className="w-full h-11"
                            onClick={handleAcceptInvitation}
                            disabled={accepting}
                        >
                            {accepting ? "Processing..." : "Accept Invitation"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const employerStats = [
        { title: "Total Employees", value: employees.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Pending Leaves", value: leaves.filter(l => l.status === "Pending").length.toString(), icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Active Tasks", value: tasks.filter(t => t.status !== "Completed").length.toString(), icon: CheckSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Task Completion", value: tasks.length > 0 ? `${((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100).toFixed(0)}%` : "0%", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    const myTasks = tasks.filter(t => t.assigneeEmail === user?.email);
    const myPendingTasks = myTasks.filter(t => t.status !== "Completed");

    const employeeStats = [
        { title: "My Pending Tasks", value: myPendingTasks.length.toString(), icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Approved Leaves", value: leaves.filter(l => l.empEmail === user?.email && l.status === "Approved").length.toString(), icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Payslip Status", value: "Verified", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    const stats = role === "employer" ? employerStats : employeeStats;

    // Attendance Logic
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const todayStr = new Date().toDateString();
    const myTodayRecords = attendance
        .filter(a => a.empEmail === user?.email && new Date(a.timestamp).toDateString() === todayStr)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const lastRecord = myTodayRecords[myTodayRecords.length - 1];
    const hasClockedInToday = lastRecord?.type === "Clock In";
    const hasClockedOutToday = lastRecord?.type === "Clock Out" && myTodayRecords.length > 0;

    let totalWorkedMs = 0;
    let currentClockIn: number | null = null;

    myTodayRecords.forEach(record => {
        if (record.type === "Clock In") {
            currentClockIn = new Date(record.timestamp).getTime();
        } else if (record.type === "Clock Out" && currentClockIn !== null) {
            totalWorkedMs += (new Date(record.timestamp).getTime() - currentClockIn);
            currentClockIn = null;
        }
    });

    if (hasClockedInToday && currentClockIn !== null) {
        totalWorkedMs += (now - currentClockIn);
    }

    const totalHours = Math.floor(totalWorkedMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalWorkedMs % (1000 * 60 * 60)) / (1000 * 60));
    const formattedWorkingTime = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;

    const getEmployeeAttendanceStatus = () => {
        if (hasClockedInToday) return "On Duty";
        if (hasClockedOutToday) return "Shift Completed";
        return "Not Clocked In";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.email?.split("@")[0] || 'User'}</h1>
                        <p className="text-sm text-slate-500">Here's what's happening today.</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="shadow-none">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn("p-3 rounded-md", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</h3>
                                <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {role === "employee" && (
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 flex flex-col justify-between gap-4 text-white shadow-md">
                        <div className="flex flex-col w-full">
                            <h3 className="text-xs font-semibold text-indigo-100 tracking-wider mb-2">
                                WORK SHIFT TIMECLOCK
                            </h3>
                            <div className="bg-white/10 rounded-lg p-3 flex items-center justify-center gap-3 border border-white/20">
                                <Clock className="w-6 h-6 text-emerald-300" />
                                <span className="text-white font-mono text-3xl font-bold tracking-widest">{formattedWorkingTime}</span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", hasClockedInToday && !hasClockedOutToday ? "bg-emerald-400 animate-pulse" : "bg-slate-400")} />
                                <p className="text-xs font-medium uppercase">{getEmployeeAttendanceStatus()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                            {!hasClockedInToday ? (
                                <button
                                    onClick={() => clockIn(user!.email!)}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-bold uppercase text-xs transition-colors focus:ring-2 focus:ring-white/50 focus:outline-none"
                                >
                                    Clock In
                                </button>
                            ) : (
                                <button
                                    onClick={() => clockOut(user!.email!)}
                                    className="flex-1 py-2.5 bg-indigo-900 border border-indigo-400/30 hover:bg-indigo-800 text-white rounded-lg font-bold uppercase text-xs transition-colors focus:ring-2 focus:ring-white/50 focus:outline-none"
                                >
                                    Clock Out
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-semibold">Recent Attendance Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">Employee</th>
                                            <th className="px-5 py-3 font-medium">Log Type</th>
                                            <th className="px-5 py-3 font-medium">Time Logged</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(role === "employer" ? attendance : attendance.filter(a => a.empEmail === user?.email)).slice(0, 8).map((record, i) => (
                                            <tr key={record.id || i} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3 text-slate-900 font-medium">{record.empEmail.split('@')[0]}</td>
                                                <td className="px-5 py-3">
                                                    <Badge variant={record.type === 'Clock In' ? 'success' : 'secondary'} className="px-2 font-medium">
                                                        {record.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 text-slate-500">
                                                    {new Date(record.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {attendance.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">No recent activity found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Priority list & Documents */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="p-5 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold">Priority Tasks</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {(role === "employer" ? tasks.filter(t => t.priority === "High" && t.status !== "Completed") : myPendingTasks).slice(0, 5).map((task, i) => (
                                    <div key={task.id || i} className="p-4 hover:bg-slate-50/50">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="font-semibold text-slate-900 text-sm">{task.title}</p>
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none uppercase",
                                                task.priority === "High" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                            )}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            Due on {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                                {((role === "employer" ? tasks.filter(t => t.priority === "High") : myPendingTasks).length === 0) && (
                                    <div className="p-8 text-center text-slate-500 text-sm">
                                        No priority tasks at the moment.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-semibold">Onboarding Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {role === "employer" && (
                                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-700">Request Document</p>
                                    <select
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-primary"
                                        value={docEmpEmail}
                                        onChange={e => setDocEmpEmail(e.target.value)}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(e => <option key={e.id} value={e.email}>{e.name} ({e.email})</option>)}
                                    </select>
                                    <select
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-primary"
                                        value={docType}
                                        onChange={e => { setDocType(e.target.value); setDocTitle(""); }}
                                    >
                                        {["Passport", "National ID Card", "Address Proof", "Tax Form", "Signed Offer Letter", "Bank Details", "Other..."].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {docType === "Other..." && (
                                        <input
                                            type="text"
                                            className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-primary"
                                            placeholder="Custom Document Name"
                                            value={docTitle}
                                            onChange={e => setDocTitle(e.target.value)}
                                        />
                                    )}
                                    <Button
                                        size="sm"
                                        className="w-full bg-slate-900 text-white hover:bg-slate-800"
                                        onClick={async () => {
                                            const finalTitle = docType === "Other..." ? docTitle : docType;
                                            if (docEmpEmail && finalTitle) {
                                                try {
                                                    await requestDocument(docEmpEmail, finalTitle);
                                                    toast.success("Request Sent", { description: "Employee has been formally notified." });
                                                    setDocTitle("");
                                                    setDocType("Passport");
                                                } catch (e) {
                                                    toast.error("Transmission Error", { description: "Unable to request document at this time." });
                                                }
                                            } else {
                                                toast.error("Form Incomplete", { description: "Please select an employee and document." });
                                            }
                                        }}
                                    >
                                        Request
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-3">
                                {(role === "employer" ? documents : documents.filter(d => d.empEmail === user?.email)).map(doc => (
                                    <div key={doc.id} className="flex flex-col gap-2 p-3 border border-slate-100 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm border-slate-200 font-semibold">{doc.title}</p>
                                                {role === "employer" && <p className="text-[10px] text-slate-500">{doc.empEmail}</p>}
                                            </div>
                                            <Badge variant={doc.status === "Uploaded" ? "success" : "warning"} className="text-[10px] h-5">
                                                {doc.status}
                                            </Badge>
                                        </div>
                                        {role === "employee" && doc.status === "Pending" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs w-full mt-2 h-7 rounded"
                                                onClick={() => {
                                                    // Simulate upload
                                                    uploadDocument(doc.id!, "https://example.com/uploaded");
                                                }}
                                            >
                                                Upload Now
                                            </Button>
                                        )}
                                        {doc.status === "Uploaded" && (
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                <CheckCircle className="w-3 h-3" /> File Uploaded
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(role === "employer" ? documents : documents.filter(d => d.empEmail === user?.email)).length === 0 && (
                                    <p className="text-xs text-center text-slate-500 py-2">No documents requested.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
