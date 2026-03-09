"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Users, CalendarDays, CheckCircle, Clock, CheckSquare, User as UserIcon, Settings, FileText, Plus, Trash2, XCircle, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { useRouter } from "next/navigation";

export default function DashboardOverview() {
    const router = useRouter();
    const [accepting, setAccepting] = useState(false);
    const { role, user, status } = useAuth();
    const { attendance, clockIn, clockOut, takeBreak, endBreak, employees, tasks, leaves, documents, requestDocument, requestMultipleDocuments, sendDocumentReminder, uploadDocument, updateDocumentStatus, docTemplates, addDocTemplate, deleteDocTemplate, announcements } = useApp();

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

        if (file.size > 700 * 1024) {
            toast.error("File Too Large", { description: "Maximum file size for database storage is 700KB. Compress your image or use PDF." });
            return;
        }

        setUploadingDocId(docId);

        toast.promise(
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject("Failed to read file.");
                reader.onloadend = async () => {
                    try {
                        const base64Url = reader.result as string;
                        await uploadDocument(docId, base64Url);
                        resolve(base64Url);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsDataURL(file);
            }),
            {
                loading: 'Uploading document securely to cloud...',
                success: () => {
                    setUploadingDocId(null);
                    return 'File securely transmitted.';
                },
                error: (e) => {
                    setUploadingDocId(null);
                    console.error("Upload error context", e);
                    return 'Failed to upload document. Base64 Error or Payload Exceeded.';
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-0.5">
                            Welcome, {user?.email?.split("@")[0] || "User"}
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status: Operational • {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat, i) => (
                    <Card key={i} className="shadow-sm border-slate-100 overflow-hidden group hover:border-slate-300 transition-colors">
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg shrink-0", stat.bg)}>
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate leading-none mb-1">{stat.title}</p>
                                <h3 className="text-lg font-black text-slate-900 leading-none">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
                            <p className="text-xs text-amber-700 mt-0.5 leading-tight">
                                Your employer has requested {myPendingDocs.length} document{myPendingDocs.length > 1 ? "s" : ""} that require{myPendingDocs.length === 1 ? "s" : ""} your attention.
                            </p>
                        </div>
                        <a href="/dashboard/profile#documents" className="text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">
                            Upload Now →
                        </a>
                    </div>
                );
            })()}

            {/* ── Pending Submissions Panel (Employer only) ── */}
            {
                role === "employer" && (() => {
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
                                                    {(emp?.name || doc.empEmail || "?").charAt(0).toUpperCase()}
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
                })()
            }

            {/* ── Main content grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Attendance + Employees */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 2. Attendance Logs */}
                    <Card className="shadow-sm">
                        <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-semibold">Recent Attendance Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                                <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
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
                                                    {((emp.name || emp.email || "U")?.[0] || "U").toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm leading-tight">{emp.name || "Unnamed"}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{emp.email || "No Email"}</p>
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

                {/* Right: Announcements + Priority Tasks + Documents */}
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
                </div >
            </div >
        </div >
    );
}
