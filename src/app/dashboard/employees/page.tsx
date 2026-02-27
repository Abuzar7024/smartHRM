"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Search, Plus, UserPlus, Mail, ShieldCheck, AlertTriangle, Users, Calendar, Trash2, CheckCircle, XCircle, Lock, Settings, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function EmployeesPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { employees, documents, docTemplates, requestMultipleDocuments, addDocTemplate, deleteDocTemplate, attendance, payroll, leaves, updateEmployeePermissions, createNotification, deleteEmployeeCascade, approveRegistration, rejectRegistration, pendingRegistrations } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [deletingEmp, setDeletingEmp] = useState<{ id: string; name: string; email: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedDocsToReq, setSelectedDocsToReq] = useState<string[]>([]);

    // Document Template Modal State
    const [isManageDocsOpen, setIsManageDocsOpen] = useState(false);
    const [docTitle, setDocTitle] = useState("");
    const [docRequired, setDocRequired] = useState(false);

    // Form State
    const [empName, setEmpName] = useState("");
    const [empEmail, setEmpEmail] = useState("");
    const [empRole, setEmpRole] = useState("");
    const [empPosition, setEmpPosition] = useState("");
    const [empDept, setEmpDept] = useState("");
    const [empPassword, setEmpPassword] = useState("");
    const [ctc, setCtc] = useState("");
    const [pf, setPf] = useState("");
    const [tds, setTds] = useState("");
    const [insuranceOpted, setInsuranceOpted] = useState(false);
    const [insuranceAmount, setInsuranceAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Limits & Razorpay Upgrade State
    const [employeeLimit, setEmployeeLimit] = useState(5);
    const [fetchingLimit, setFetchingLimit] = useState(true);

    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

    useEffect(() => {
        if (role === "employer") {
            fetch("/api/billing/status")
                .then(res => res.json())
                .then(data => {
                    if (data.subscription?.employeeLimit) {
                        setEmployeeLimit(data.subscription.employeeLimit);
                    }
                })
                .catch(() => { })
                .finally(() => setFetchingLimit(false));
        }
    }, [role]);

    const isLimitReached = employees.length >= employeeLimit && !fetchingLimit;

    const togglePermission = (perm: string) => {
        if (!selectedEmp) return;
        const current = selectedEmp.permissions || [];
        const updated = current.includes(perm) ? current.filter((p: string) => p !== perm) : [...current, perm];
        setSelectedEmp({ ...selectedEmp, permissions: updated });
    };

    const handleSavePermissions = () => {
        if (selectedEmp) {
            if (selectedEmp.id) updateEmployeePermissions(selectedEmp.id, selectedEmp.permissions || []);
            toast.success("Permissions Updated", { description: `Access tokens updated for ${selectedEmp.name}.` });
            createNotification({
                title: "Security Clearance Updated",
                message: `Permissions have been redefined for ${selectedEmp.name}.`,
                targetRole: "employer"
            });
            createNotification({
                title: "Clearance Updated",
                message: "Your internal access clearances have been actively updated by central administration.",
                targetEmail: selectedEmp.email,
                targetRole: "employee"
            });
            setPermissionsModalOpen(false);
            setSelectedEmp(null);
        }
    };

    const handleDeleteEmployee = async () => {
        if (!deletingEmp) return;
        setDeleteLoading(true);
        try {
            await deleteEmployeeCascade(deletingEmp.id, deletingEmp.email);
            toast.success("Employee Record Purged", { description: "Cascade deletion complete. All related node data has been removed." });
            setDeletingEmp(null); // Clear the deleting employee after successful deletion
        } catch (err) {
            console.error(err);
            toast.error("Cleanup Failed", { description: "Employee record was removed, but recursive cleanup failed." });
        } finally {
            setDeleteLoading(false);
        }
    };


    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Only administrative accounts can access the employee directory.</p>
            </div>
        );
    }

    const filtered = employees.filter(emp =>
        (emp.name?.toLowerCase() || "").includes((searchTerm || "").toLowerCase()) ||
        (emp.department?.toLowerCase() || "").includes((searchTerm || "").toLowerCase()) ||
        (emp.email?.toLowerCase() || "").includes((searchTerm || "").toLowerCase())
    );


    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!empName || !empEmail || !empPassword) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch('/api/employees/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: empName,
                    email: empEmail,
                    password: empPassword,
                    role: empRole || "Staff",
                    position: empPosition || "Staff",
                    department: empDept || "General",
                    ctc,
                    pf,
                    tds,
                    insuranceOpted,
                    insuranceAmount: insuranceOpted ? insuranceAmount : ""
                }),
            });

            if (response.ok) {
                toast.success("Employee Successfully Onboarded!", { description: `${empName} has been added to the Workforce Database.` });
                createNotification({
                    title: "System Onboarding Success",
                    message: `Operative ${empName} (${empEmail}) was added to the ${empDept} unit as a ${empRole}.`,
                    targetRole: "employer"
                });

                if (selectedDocsToReq.length > 0) {
                    await requestMultipleDocuments(empEmail, selectedDocsToReq);
                    toast.success("Documents Requested", { description: "Onboarding documents have been requested." });
                }

                setShowForm(false);
                setEmpName("");
                setEmpEmail("");
                setEmpPassword("");
                setEmpRole("");
                setEmpPosition("");
                setEmpDept("");
                setSelectedDocsToReq([]);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to add employee");
                if (data.error?.includes("Subscription limits exceeded")) {
                    // Force the button logic to update immediately
                    setEmployeeLimit(employees.length);
                } else {
                    toast.error("Process Failed", { description: data.error || "Could not complete onboarding. Check permissions or network." });
                    createNotification({
                        title: "Onboarding Terminated",
                        message: `Internal System Error while trying to recruit ${empEmail}: ${data.error || "Network error"}`,
                        targetRole: "employer"
                    });
                }
            }
        } catch (err) {
            setError("A network error occurred.");
            toast.error("Network Exception", { description: "Please ensure you have a stable connection and the server is running." });
            createNotification({
                title: "Network Exception Incident",
                message: `Failed secure connection to recruitment servers involving ${empEmail}.`,
                targetRole: "employer"
            });
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
                    <p className="text-sm text-slate-500">Manage your workforce, roles, and departmental access.</p>
                </div>
                {isLimitReached ? (
                    <Button
                        className="rounded-lg shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        onClick={() => router.push("/dashboard/billing")}
                    >
                        <Lock className="w-4 h-4 mr-2" /> Upgrade to Add Seats
                    </Button>
                ) : (
                    <Button
                        className="rounded-lg shadow-sm"
                        variant={showForm ? "outline" : "corporate"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? <Plus className="w-4 h-4 mr-2 rotate-45 transition-transform" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {showForm ? "Close Form" : "Add Employee"}
                    </Button>
                )}
            </div>

            {/* ── Add Form ── */}
            <AnimatePresence>
                {showForm && !isLimitReached && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-slate-200 shadow-md rounded-xl">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold">Onboard New Employee</CardTitle>
                                <CardDescription>Register a new member to the organization. Limt: {employees.length}/{employeeLimit} used.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                                        <Input required value={empName} onChange={e => setEmpName(e.target.value)} placeholder="e.g. Jane Doe" className="rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Work Email</Label>
                                        <Input required type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="e.g. jane.doe@acmecorp.com" className="rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Initial Password</Label>
                                        <Input required type="password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} placeholder="••••••••" className="rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Job Role</Label>
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            value={empRole}
                                            onChange={e => setEmpRole(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Software Engineer">Software Engineer</option>
                                            <option value="HR Specialist">HR Specialist</option>
                                            <option value="Designer">Designer</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Position</Label>
                                        <Input required value={empPosition} onChange={e => setEmpPosition(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Department</Label>
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            value={empDept}
                                            onChange={e => setEmpDept(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Human Resources">Human Resources</option>
                                            <option value="Design">Design</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Sales">Sales</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>

                                    {/* Onboarding Documents Field */}
                                    <div className="md:col-span-2 lg:col-span-3 space-y-4 pt-6 border-t mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <Label className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-indigo-600" /> Compensation Details
                                            </Label>
                                            <Badge variant="outline" className="text-[10px] font-bold bg-indigo-50 border-indigo-100 text-indigo-700">Financial Setup</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Annual CTC (₹) *</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 1200000"
                                                    value={ctc}
                                                    onChange={e => setCtc(e.target.value)}
                                                    required
                                                    className="rounded-lg h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Monthly PF (₹)</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 1800"
                                                    value={pf}
                                                    onChange={e => setPf(e.target.value)}
                                                    className="rounded-lg h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Monthly TDS (₹) *</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="e.g. 5000"
                                                    value={tds}
                                                    onChange={e => setTds(e.target.value)}
                                                    required
                                                    className="rounded-lg h-10"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-600">Insurance</Label>
                                                <div className="flex items-center gap-2 h-10">
                                                    <input
                                                        type="checkbox"
                                                        id="insOpt"
                                                        checked={insuranceOpted}
                                                        onChange={() => setInsuranceOpted(!insuranceOpted)}
                                                        className="rounded border-slate-300 w-4 h-4 text-indigo-600"
                                                    />
                                                    <Label htmlFor="insOpt" className="text-xs cursor-pointer">Opted</Label>
                                                    {insuranceOpted && (
                                                        <Input
                                                            type="number"
                                                            placeholder="Premium"
                                                            value={insuranceAmount}
                                                            onChange={e => setInsuranceAmount(e.target.value)}
                                                            className="rounded-lg h-8 text-xs flex-1"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Estimated Monthly In-Hand</p>
                                                <p className="text-2xl font-black text-slate-900">
                                                    ₹{Number(ctc ? (Number(ctc) / 12) - Number(pf || 0) - Number(tds || 0) - (insuranceOpted ? Number(insuranceAmount || 0) : 0) : 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right text-[10px] text-slate-500 font-medium">
                                                <p>Calculation: (CTC/12) - PF - TDS {insuranceOpted ? "- Insurance" : ""}</p>
                                                <p className="mt-0.5 italic">subject to professional taxes & other deductions</p>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="md:col-span-2 lg:col-span-3 bg-rose-50 border border-rose-200 p-3 rounded-lg flex flex-col gap-2 text-rose-600 text-xs font-medium">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                {error}
                                            </div>
                                        </div>
                                    )}

                                    <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                                        <Button type="submit" variant="corporate" disabled={loading} className="min-w-[140px]">
                                            {loading ? "Registering..." : "Confirm & Onboard"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Directory Table ── */}
            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-4 md:p-6 bg-slate-50/50 border-b flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold">Workforce Database</CardTitle>
                        <CardDescription>
                            Total active personnel: {employees.length} / {fetchingLimit ? "..." : employeeLimit} Seats Used
                        </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Find a colleague by name or email..."
                            className="pl-9 h-9 rounded-lg border-slate-200 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                                <TableHead className="h-10">Name & Contact</TableHead>
                                <TableHead className="h-10">Role & Position</TableHead>
                                <TableHead className="h-10">Department</TableHead>
                                <TableHead className="h-10">DOJ / Status</TableHead>
                                <TableHead className="h-10 text-right">Permissions & Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((emp) => (
                                <TableRow key={emp.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                                                {((emp.name || emp.email || "U")?.[0] || "U").toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{emp.name || "Unnamed"}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {emp.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-slate-700">
                                        <div className="font-medium">{emp.role}</div>
                                        {emp.position && <div className="text-xs text-slate-500 mt-0.5">{emp.position}</div>}
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-slate-500">{emp.department}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                                <Calendar className="w-3 h-3" />
                                                {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : "Unknown"}
                                            </div>
                                            <Badge variant={
                                                emp.status === "Active" ? "success" :
                                                    emp.status === "On Leave" ? "warning" : "destructive"
                                            } className="rounded-md font-bold text-[10px] h-5 px-2">
                                                {emp.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] h-7 px-2 rounded-md mr-2"
                                            onClick={() => {
                                                setSelectedEmp(emp);
                                                setPermissionsModalOpen(true);
                                            }}
                                        >
                                            <ShieldCheck className="w-3 h-3 mr-1" /> Perms
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="text-slate-400 rounded-lg hover:text-rose-600 hover:bg-rose-50"
                                            onClick={() => setDeletingEmp({ id: emp.id!, name: emp.name, email: emp.email })}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24 text-slate-400">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Users className="w-8 h-8" />
                                            <p className="text-sm font-medium">No matching records found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* ── Pending Registrations ── */}
            {
                pendingRegistrations.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50 shadow-none">
                        <CardHeader className="pb-2 pt-4 px-5">
                            <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Pending Employee Registration Requests ({pendingRegistrations.length})
                            </CardTitle>
                            <CardDescription className="text-amber-700 text-xs">These users registered and are awaiting your approval to join your organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 space-y-2">
                            {pendingRegistrations.map(reg => {
                                const matchedEmp = employees.find(e => e.email === reg.email);
                                return (
                                    <div key={reg.uid} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg p-3 gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{reg.email}</p>
                                            {reg.companyName && <p className="text-xs text-slate-500">Company: {reg.companyName}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            {matchedEmp ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => { approveRegistration(reg.uid, matchedEmp.id!); toast.success("Approved!", { description: `${reg.email} can now log in.` }); }}
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                        onClick={() => { rejectRegistration(reg.uid); toast.error("Rejected", { description: `${reg.email} has been denied access.` }); }}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <p className="text-xs text-amber-600 italic">Add this email as an employee first to approve</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )
            }

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={!!deletingEmp} onOpenChange={(v) => { if (!v) setDeletingEmp(null); }}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <Trash2 className="w-5 h-5" /> Delete Employee
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete <strong>{deletingEmp?.name}</strong> and ALL their associated data including tasks, documents, leaves, payroll records, and chat messages. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setDeletingEmp(null)} disabled={deleteLoading}>Cancel</Button>
                        <Button
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={handleDeleteEmployee}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "Deleting..." : "Yes, Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Permissions Modal ── */}
            <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Manage Permissions</DialogTitle>
                        <DialogDescription>
                            Configure what {selectedEmp?.name} can access or manage.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEmp && (
                        <div className="py-4 space-y-4">
                            {[
                                { id: "assign_tasks", label: "Assign Tasks", desc: "Can create and assign tasks to other employees." },
                                { id: "manage_leaves", label: "Manage Leaves", desc: "Can approve/reject leaves and assign leave balances." },
                                { id: "view_payroll", label: "View Payroll", desc: "Can view payroll information for employees." }
                            ].map(perm => (
                                <div key={perm.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => togglePermission(perm.id)}>
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={(selectedEmp.permissions || []).includes(perm.id)}
                                            onChange={() => togglePermission(perm.id)}
                                            className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-2"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{perm.label}</p>
                                        <p className="text-[10px] text-slate-500">{perm.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPermissionsModalOpen(false)}>Cancel</Button>
                        <Button variant="corporate" onClick={handleSavePermissions}>Save Permissions</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div >
    );
}
