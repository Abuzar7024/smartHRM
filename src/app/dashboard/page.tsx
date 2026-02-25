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

export default function DashboardOverview() {
    const [accepting, setAccepting] = useState(false);
    const { role, user, status } = useAuth();
    const { attendance, clockIn, clockOut, employees, tasks, leaves, documents, requestDocument, uploadDocument, updateDocumentStatus, docTemplates, addDocTemplate, deleteDocTemplate } = useApp();

    const [docTitle, setDocTitle] = useState("");
    const [docRequired, setDocRequired] = useState(false);
    const [isManageDocsOpen, setIsManageDocsOpen] = useState(false);
    const [docType, setDocType] = useState("");
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

    const pendingOnboardingCount = employees.filter(e => e.status === "Invited" || e.status === "pending").length;
    const approvedDocsCount = documents.filter(d => d.status === "Approved").length;
    const rejectedDocsCount = documents.filter(d => d.status === "Rejected").length;

    const employerStats = [
        { title: "Total Employees", value: employees.length.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Pending Onboarding", value: pendingOnboardingCount.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { title: "Approved Documents", value: approvedDocsCount.toString(), icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Rejected Documents", value: rejectedDocsCount.toString(), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
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

    if (status === "pending") {
        return (
            <div className="flex items-center justify-center min-h-[70vh] p-4 md:p-8">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center pt-8">
                        <Users className="w-10 h-10 text-primary mx-auto mb-2" />
                        <CardTitle className="text-xl">Finalize Enrollment</CardTitle>
                        <CardDescription>Welcome to the platform.</CardDescription>
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-500">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.email?.split("@")[0] || "User"}</h1>
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
                            <p className="text-xs text-amber-700 mt-0.5">Your employer has requested {myPendingDocs.length} document{myPendingDocs.length > 1 ? "s" : ""} that require{myPendingDocs.length === 1 ? "s" : ""} your attention:</p>
                            <ul className="mt-1.5 space-y-1">
                                {myPendingDocs.map(d => (
                                    <li key={d.id} className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                        {d.title}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <a href="/dashboard/profile" className="text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900 whitespace-nowrap">Upload Now →</a>
                    </div>
                );
            })()}

            {/* Quick Actions & Stats */}
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
                                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Request Form</p>

                                        <Dialog open={isManageDocsOpen} onOpenChange={setIsManageDocsOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-slate-400 hover:text-primary"><Settings className="w-3.5 h-3.5" /></Button>
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
                                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{tpl.required ? 'Mandatory' : 'Optional'}</p>
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
                                                        <Input placeholder="e.g. W2 Tax Form or Offer Letter" value={docTitle} onChange={e => setDocTitle(e.target.value)} className="h-9 text-sm" />
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <input type="checkbox" id="reqDoc" checked={docRequired} onChange={() => setDocRequired(!docRequired)} className="rounded border-slate-300 w-3.5 h-3.5 text-primary" />
                                                            <Label htmlFor="reqDoc" className="text-xs">Is this document mandatory for active enrollment?</Label>
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
                                    <select
                                        className="w-full text-sm p-2 border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-primary bg-white shadow-sm"
                                        value={docType}
                                        onChange={e => { setDocType(e.target.value); }}
                                    >
                                        <option value="">Select Required Document Form</option>
                                        {docTemplates.map(d => <option key={d.id} value={d.title}>{d.title} {d.required ? '*' : ''}</option>)}
                                    </select>
                                    <Button
                                        size="sm"
                                        className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold"
                                        onClick={async () => {
                                            if (docEmpEmail && docType) {
                                                try {
                                                    await requestDocument(docEmpEmail, docType);
                                                    toast.success("Request Executed", { description: "Employee will be formally notified." });
                                                    setDocType("");
                                                } catch (e) {
                                                    toast.error("Transmission Error", { description: "Unable to request document at this time." });
                                                }
                                            } else {
                                                toast.error("Form Incomplete", { description: "Please select an employee and document template." });
                                            }
                                        }}
                                    >
                                        Issue Request
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
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-xs w-full mt-2 h-7 rounded"
                                                onClick={() => {
                                                    uploadDocument(doc.id!, "https://example.com/uploaded");
                                                    toast.success("File Uploaded", { description: `Securely transmitted ${doc.title}.` });
                                                }}
                                            >
                                                Upload Now
                                            </Button>
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
