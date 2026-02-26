"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, CalendarDays, CheckCircle, Clock, CheckSquare, User, Settings, FileText, Plus, Trash2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function DashboardOverview() {
    const [accepting, setAccepting] = useState(false);
    const { role, user, status } = useAuth();
    const { attendance, clockIn, clockOut, takeBreak, endBreak, employees, tasks, leaves, documents, requestDocument, requestMultipleDocuments, sendDocumentReminder, uploadDocument, updateDocumentStatus, docTemplates, addDocTemplate, deleteDocTemplate } = useApp();

    const [docTitle, setDocTitle] = useState("");
    const [docRequired, setDocRequired] = useState(false);
    const [isManageDocsOpen, setIsManageDocsOpen] = useState(false);
    const [selectedDocTitles, setSelectedDocTitles] = useState<string[]>([]);
    const [docEmpEmail, setDocEmpEmail] = useState("");

    const handleAcceptInvitation = async () => {
        setAccepting(true);
        try {
            const res = await fetch('/api/auth/accept-invitation', { method: 'POST' });
            if (res.ok) { window.location.reload(); }
        } catch (e) {
            console.error(e);
        } finally {
            setAccepting(false);
        }
    };

    const pendingOnboardingCount = employees.filter(e => e.status === "Invited" || e.status === "pending").length;
    const approvedDocsCount = documents.filter(d => d.status === "Approved").length;
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingDocId(docId);
        const storageRef = ref(storage, `documents/${docId}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        toast.promise(
            new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    null,
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        await uploadDocument(docId, downloadURL);
                        resolve(downloadURL);
                    }
                );
            }),
            {
                loading: 'Uploading document securely to cloud...',
                success: () => {
                    setUploadingDocId(null);
                    return 'File securely transmitted.';
                },
                error: () => {
                    setUploadingDocId(null);
                    return 'Failed to upload document.';
                }
            }
        );
    };
    const rejectedDocsCount = documents.filter(d => d.status === "Rejected").length;

    const employerStats = [
        { title: "Total Employees", value: employees.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Pending Onboarding", value: pendingOnboardingCount.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Approved Documents", value: approvedDocsCount.toString(), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Rejected Documents", value: rejectedDocsCount.toString(), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    ];

    const myTasks = tasks.filter(t => t.assigneeEmails?.includes(user?.email || ""));
    const myPendingTasks = myTasks.filter(t => t.status !== "Completed");

    const employeeStats = [
        { title: "My Pending Tasks", value: myPendingTasks.length.toString(), icon: CheckSquare, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Approved Leaves", value: leaves.filter(l => l.empEmail === user?.email && l.status === "Approved").length.toString(), icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Payslip Status", value: "Verified", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    const stats = role === "employer" ? employerStats : employeeStats;

    // ── Live timer (ticks every second) ──
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Today's attendance records ──
    const todayStr = new Date().toDateString();
    const myTodayRecords = attendance
        .filter(a => a.empEmail === user?.email && new Date(a.timestamp).toDateString() === todayStr)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const lastRecord = myTodayRecords[myTodayRecords.length - 1];
    const lastType = lastRecord?.type as string | undefined;
    const isClockedIn = lastType === "Clock In" || lastType === "Break End";
    const isClockedOut = lastType === "Clock Out";
    const isOnBreak = lastType === "Break Start";
    const hasAnyRecord = myTodayRecords.length > 0;

    // ── Compute worked & break ms ──
    let totalWorkedMs = 0;
    let totalBreakMs = 0;
    let currentClockIn: number | null = null;
    let currentBreakStart: number | null = null;

    myTodayRecords.forEach(record => {
        const ts = new Date(record.timestamp).getTime();
        const t = record.type as string;
        if (t === "Clock In" || t === "Break End") {
            currentClockIn = ts;
            currentBreakStart = null;
        } else if (t === "Clock Out" && currentClockIn !== null) {
            totalWorkedMs += ts - currentClockIn;
            currentClockIn = null;
        } else if (t === "Break Start" && currentClockIn !== null) {
            totalWorkedMs += ts - currentClockIn;
            currentClockIn = null;
            currentBreakStart = ts;
        } else if (t === "Break End" && currentBreakStart !== null) {
            totalBreakMs += ts - currentBreakStart;
            currentBreakStart = null;
        }
    });

    if (isClockedIn && currentClockIn !== null) totalWorkedMs += now - currentClockIn;
    if (isOnBreak && currentBreakStart !== null) totalBreakMs += now - currentBreakStart;

    const fmtMs = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const formattedWorkingTime = fmtMs(totalWorkedMs);
    const formattedBreakTime = fmtMs(totalBreakMs);

    const getStatus = () => {
        if (isOnBreak) return "On Break";
        if (isClockedIn) return "On Duty";
        if (isClockedOut) return "Shift Completed";
        return "Not Clocked In";
    };

    const firstClockIn = myTodayRecords.find(r => (r.type as string) === "Clock In");
    const clockInTimeStr = firstClockIn
        ? new Date(firstClockIn.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null;

    // ── Pending status gate ──
    if (status === "pending") {
        return (
            <div className="flex items-center justify-center min-h-[70vh] p-4 md:p-8">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center pt-8">
                        <CardTitle className="text-xl font-bold text-slate-900">Account Pending Approval</CardTitle>
                        <CardDescription className="text-slate-500 mt-2">
                            Your employer needs to approve your account before you can access the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 text-center">
                        <Button onClick={handleAcceptInvitation} disabled={accepting} className="mt-4">
                            {accepting ? "Processing..." : "Accept Invitation"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Greeting ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.email?.split("@")[0] || "User"}
                        </h1>
                        <p className="text-sm text-slate-500">{"Here's what's happening today."}</p>
                    </div>
                </div>
            </div>

            {/* ── Pending Documents Warning Banner (Employee only) ── */}
            {role === "employee" && (() => {
                const myPendingDocs = documents.filter(d => d.empEmail === user?.email && d.status === "Pending");
                if (myPendingDocs.length === 0) return null;
                return (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-amber-800">Action Required — Pending Document{myPendingDocs.length > 1 ? "s" : ""}</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Your employer has requested {myPendingDocs.length} document{myPendingDocs.length > 1 ? "s" : ""} that require{myPendingDocs.length === 1 ? "s" : ""} your attention:
                            </p>
                            <ul className="mt-1.5 space-y-1">
                                {myPendingDocs.map(d => (
                                    <li key={d.id} className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                        {d.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <a href="#onboarding-docs" className="text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">
                            Upload Now →
                        </a>
                    </div>
                );
            })()}

            {/* ── Stats + Timeclock grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="shadow-sm border-slate-200">
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

                {/* ── Timeclock Widget ── */}
                {role === "employee" && (
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 flex flex-col justify-between gap-3 text-white shadow-md md:col-span-2 lg:col-span-1">
                        <div className="flex flex-col w-full gap-2">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] font-bold text-indigo-100 tracking-widest uppercase">Work Timeclock</h3>
                                {clockInTimeStr && (
                                    <span className="text-[10px] bg-white/10 border border-white/20 rounded-full px-2 py-0.5 font-semibold">
                                        In: {clockInTimeStr}
                                    </span>
                                )}
                            </div>

                            {/* Main timer */}
                            <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center gap-3">
                                <Clock className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                                <span className="font-mono text-2xl font-bold tracking-widest text-white">{formattedWorkingTime}</span>
                            </div>

                            {/* Break time bar */}
                            {(totalBreakMs > 0 || isOnBreak) && (
                                <div className="flex items-center justify-between bg-amber-400/20 border border-amber-300/30 rounded-lg px-3 py-2">
                                    <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">☕ Break</span>
                                    <span className="font-mono text-sm font-bold text-amber-200">{formattedBreakTime}</span>
                                </div>
                            )}

                            {/* Status dot */}
                            <div className="flex items-center gap-2 mt-1">
                                <div className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    isClockedIn ? "bg-emerald-400 animate-pulse" :
                                        isOnBreak ? "bg-amber-400 animate-pulse" :
                                            isClockedOut ? "bg-slate-400" : "bg-slate-500"
                                )} />
                                <p className="text-[11px] font-semibold uppercase tracking-widest">{getStatus()}</p>
                            </div>
                        </div>

                        {/* ── Buttons ── */}
                        <div className="flex gap-2 w-full">
                            {!hasAnyRecord && (
                                <button
                                    onClick={() => clockIn(user!.email!)}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-bold uppercase text-xs transition-colors"
                                >
                                    ⏵ Clock In
                                </button>
                            )}
                            {isClockedIn && (
                                <>
                                    <button
                                        onClick={() => takeBreak(user!.email!)}
                                        className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-900 rounded-lg font-bold uppercase text-xs transition-colors"
                                    >
                                        ☕ Break
                                    </button>
                                    <button
                                        onClick={() => clockOut(user!.email!)}
                                        className="flex-1 py-2.5 bg-indigo-900 border border-indigo-400/30 hover:bg-indigo-800 text-white rounded-lg font-bold uppercase text-xs transition-colors"
                                    >
                                        ⏹ Clock Out
                                    </button>
                                </>
                            )}
                            {isOnBreak && (
                                <button
                                    onClick={() => endBreak(user!.email!)}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg font-bold uppercase text-xs transition-colors"
                                >
                                    ▶ Resume Work
                                </button>
                            )}
                            {isClockedOut && (
                                <div className="w-full text-center text-xs font-semibold text-indigo-200 py-2.5">
                                    ✓ Shift completed for today
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Pending Submissions Panel (Employer only) ── */}
            {role === "employer" && (() => {
                const pendingDocs = documents.filter(d => d.status === "Pending");
                if (pendingDocs.length === 0) return null;
                return (
                    <div className="border border-rose-200 bg-rose-50 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                <h2 className="text-sm font-bold text-rose-800">
                                    Pending Document Submissions ({pendingDocs.length})
                                </h2>
                            </div>
                            <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Awaiting Upload</span>
                        </div>
                        <div className="space-y-2">
                            {pendingDocs.map(doc => {
                                const emp = employees.find(e => e.email === doc.empEmail);
                                return (
                                    <div key={doc.id} className="flex items-center justify-between bg-white border border-rose-100 rounded-lg px-4 py-3 gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-rose-600 text-xs flex-shrink-0">
                                                {(emp?.name || doc.empEmail).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {emp?.name || doc.empEmail.split("@")[0]}
                                                </p>
                                                <p className="text-xs text-rose-600 font-medium truncate">
                                                    📄 {doc.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {doc.requestedAt && (
                                                <span className="text-[10px] text-slate-400 hidden sm:block">
                                                    Requested {new Date(doc.requestedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                className="h-7 text-[11px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-3"
                                                onClick={async () => {
                                                    await sendDocumentReminder(doc.empEmail, doc.title);
                                                    toast.success("Reminder Sent", {
                                                        description: `${emp?.name || doc.empEmail} has been notified about "${doc.title}"`,
                                                    });
                                                }}
                                            >
                                                🔔 Remind
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* ── Main content grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Attendance + Employees */}
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
                                                <td className="px-5 py-3 text-slate-900 font-medium">{record.empEmail.split("@")[0]}</td>
                                                <td className="px-5 py-3">
                                                    <Badge
                                                        variant={
                                                            (record.type as string) === "Clock In" ? "success" :
                                                                (record.type as string) === "Clock Out" ? "secondary" :
                                                                    (record.type as string) === "Break Start" ? "warning" : "default"
                                                        }
                                                        className="px-2 font-medium"
                                                    >
                                                        {record.type}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3 text-slate-500">
                                                    {new Date(record.timestamp).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
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

                    {role === "employer" && (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="p-5 border-b border-slate-100">
                                <CardTitle className="text-base font-semibold">Recently Added Employees</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {employees.slice(0, 5).map(emp => (
                                        <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-xs">
                                                    {emp.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm leading-tight">{emp.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{emp.email}</p>
                                                </div>
                                            </div>
                                            <Badge variant={emp.status === "Active" ? "success" : "warning"} className="text-[10px]">
                                                {emp.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {employees.length === 0 && (
                                        <div className="p-8 text-center text-slate-500 text-sm">No employees configured.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Priority Tasks + Documents */}
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
                                            Due on {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                        </div>
                                    </div>
                                ))}
                                {((role === "employer" ? tasks.filter(t => t.priority === "High") : myPendingTasks).length === 0) && (
                                    <div className="p-8 text-center text-slate-500 text-sm">No priority tasks at the moment.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader id="onboarding-docs" className="p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-semibold">Onboarding Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {role === "employer" && (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> Request Form
                                        </p>
                                        <Dialog open={isManageDocsOpen} onOpenChange={setIsManageDocsOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-slate-400 hover:text-primary">
                                                    <Settings className="w-3.5 h-3.5" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Document Templates</DialogTitle>
                                                    <DialogDescription>Add or remove required onboarding document types.</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-3">
                                                    <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50 max-h-[250px] overflow-y-auto">
                                                        {docTemplates.map(tpl => (
                                                            <div key={tpl.id} className="flex items-center justify-between bg-white p-2 border rounded-md shadow-sm">
                                                                <div>
                                                                    <p className="text-sm font-semibold">{tpl.title}</p>
                                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{tpl.required ? "Mandatory" : "Optional"}</p>
                                                                </div>
                                                                <Button variant="ghost" size="icon-sm" onClick={() => deleteDocTemplate(tpl.id!)} className="text-rose-500 h-6 w-6">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        {docTemplates.length === 0 && <p className="text-xs text-slate-500 italic">No document types available.</p>}
                                                    </div>
                                                    <div className="space-y-2 pt-2 border-t">
                                                        <Label className="text-xs font-bold">Add Document Type</Label>
                                                        <Input placeholder="e.g. 2024 W2 Tax Form" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="h-9 text-sm" />
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <input type="checkbox" id="reqDoc" checked={docRequired} onChange={() => setDocRequired(!docRequired)} className="rounded border-slate-300 w-3.5 h-3.5 text-primary" />
                                                            <Label htmlFor="reqDoc" className="text-xs">Is this document mandatory?</Label>
                                                        </div>
                                                        <Button
                                                            variant="corporate"
                                                            className="w-full mt-2 h-9 text-xs"
                                                            onClick={() => {
                                                                if (docTitle.trim()) {
                                                                    addDocTemplate(docTitle.trim(), docRequired);
                                                                    setDocTitle("");
                                                                    setDocRequired(false);
                                                                    toast.success("Template Added!");
                                                                }
                                                            }}
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <select
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm"
                                        value={docEmpEmail}
                                        onChange={e => setDocEmpEmail(e.target.value)}
                                    >
                                        <option value="">Select Employee File</option>
                                        {employees.map(e => <option key={e.id} value={e.email}>{e.name} ({e.email})</option>)}
                                    </select>
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto p-2 border border-slate-100 rounded-md bg-white">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Select Documents to Request:</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {docTemplates.map(d => (
                                                <label key={d.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedDocTitles.includes(d.title)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedDocTitles([...selectedDocTitles, d.title]);
                                                            } else {
                                                                setSelectedDocTitles(selectedDocTitles.filter(t => t !== d.title));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-xs font-medium text-slate-700">
                                                        {d.title} {d.required && <span className="text-rose-500">*</span>}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        disabled={!docEmpEmail || selectedDocTitles.length === 0}
                                        onClick={async () => {
                                            if (docEmpEmail && selectedDocTitles.length > 0) {
                                                try {
                                                    await requestMultipleDocuments(docEmpEmail, selectedDocTitles);
                                                    toast.success("Request Executed", { description: `${selectedDocTitles.length} documents requested formally.` });
                                                    setSelectedDocTitles([]);
                                                } catch {
                                                    toast.error("Transmission Error", { description: "Unable to request documents at this time." });
                                                }
                                            } else {
                                                toast.error("Form Incomplete", { description: "Please select an employee and at least one document template." });
                                            }
                                        }}
                                    >
                                        Issue Request ({selectedDocTitles.length})
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
                                            <Badge variant={doc.status === "Approved" ? "success" : doc.status === "Rejected" ? "destructive" : "warning"} className="text-[10px] h-5">
                                                {doc.status}
                                            </Badge>
                                        </div>
                                        {role === "employee" && (doc.status === "Pending" || doc.status === "Rejected") && (
                                            <div className="relative w-full mt-2 h-7 group">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-full text-xs rounded pointer-events-none"
                                                    disabled={uploadingDocId === doc.id}
                                                >
                                                    {uploadingDocId === doc.id ? "Uploading..." : "Upload Now"}
                                                </Button>
                                                {!uploadingDocId && (
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileUpload(e, doc.id!)}
                                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {role === "employer" && doc.status === "Uploaded" && (
                                            <div className="flex items-center gap-2 mt-2 w-full">
                                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => updateDocumentStatus(doc.id!, "Approved")}>Approve</Button>
                                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100" onClick={() => updateDocumentStatus(doc.id!, "Rejected")}>Reject</Button>
                                            </div>
                                        )}
                                        {(doc.status === "Uploaded" || doc.status === "Approved") && role === "employee" && (
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                <CheckCircle className="w-3 h-3" /> {doc.status === "Approved" ? "Verified & Approved" : "Processing Verification"}
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
