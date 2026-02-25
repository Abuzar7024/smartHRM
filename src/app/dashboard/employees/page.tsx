"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Search, Plus, MoreHorizontal, UserPlus, Mail, ShieldCheck, AlertTriangle, Users, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
    const { role } = useAuth();
    const { employees, documents, attendance, payroll, leaves, updateEmployeePermissions } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [empName, setEmpName] = useState("");
    const [empEmail, setEmpEmail] = useState("");
    const [empRole, setEmpRole] = useState("");
    const [empDept, setEmpDept] = useState("");
    const [empPassword, setEmpPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState<any>(null);
    const [detailsEmp, setDetailsEmp] = useState<any>(null);

    const togglePermission = (perm: string) => {
        if (!selectedEmp) return;
        const current = selectedEmp.permissions || [];
        const updated = current.includes(perm) ? current.filter((p: string) => p !== perm) : [...current, perm];
        setSelectedEmp({ ...selectedEmp, permissions: updated });
    };

    const handleSavePermissions = () => {
        if (selectedEmp) {
            updateEmployeePermissions(selectedEmp.id, selectedEmp.permissions || []);
            setPermissionsModalOpen(false);
            setSelectedEmp(null);
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
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    department: empDept || "General"
                }),
            });

            if (response.ok) {
                setShowForm(false);
                setEmpName("");
                setEmpEmail("");
                setEmpPassword("");
                setEmpRole("");
                setEmpDept("");
            } else {
                const data = await response.json();
                setError(data.error || "Failed to add employee");
            }
        } catch (err) {
            setError("A network error occurred.");
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
                <Button
                    className="rounded-lg shadow-sm"
                    variant={showForm ? "outline" : "corporate"}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <Plus className="w-4 h-4 mr-2 rotate-45 transition-transform" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {showForm ? "Close Form" : "Add Employee"}
                </Button>
            </div>

            {/* ── Add Form ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-slate-200 shadow-md rounded-xl">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg font-bold">Onboard New Employee</CardTitle>
                                <CardDescription>Register a new member to the organization.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                                        <Input required value={empName} onChange={e => setEmpName(e.target.value)} placeholder="e.g. John Doe" className="rounded-lg" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Work Email</Label>
                                        <Input required type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="name@company.com" className="rounded-lg" />
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

                                    {error && (
                                        <div className="md:col-span-2 lg:col-span-3 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2 text-rose-600 text-xs font-medium">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            {error}
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
                        <CardDescription>Total active personnel: {employees.length}</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search names, emails..."
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
                                <TableHead className="h-10">Role</TableHead>
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
                                                {emp.name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900">{emp.name}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {emp.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm font-medium text-slate-700">{emp.role}</TableCell>
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
                                            className="text-slate-400 rounded-lg hover:text-primary"
                                            onClick={() => {
                                                setDetailsEmp(emp);
                                                setDetailsModalOpen(true);
                                            }}
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
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
            {/* ── Employee Details Modal ── */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Employee Profile</DialogTitle>
                        <DialogDescription>Full work history and details for {detailsEmp?.name}</DialogDescription>
                    </DialogHeader>
                    {detailsEmp && (() => {
                        const empDocs = documents.filter(d => d.empEmail === detailsEmp.email);
                        const empLeaves = leaves.filter(l => l.empEmail === detailsEmp.email);
                        const approvedLeaves = empLeaves.filter(l => l.status === "Approved").length;
                        const empPayroll = payroll.filter(p => p.empEmail === detailsEmp.email);
                        const latestCTC = empPayroll.length > 0 ? empPayroll[empPayroll.length - 1].amount : "TBD";
                        const empAttendance = attendance.filter(a => a.empEmail === detailsEmp.email);

                        return (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-slate-500 font-medium text-[10px] uppercase">Date of Joining</p>
                                        <p className="font-bold text-slate-800">{detailsEmp.joinDate ? new Date(detailsEmp.joinDate).toLocaleDateString() : "Unknown"}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-slate-500 font-medium text-[10px] uppercase">Current CTC</p>
                                        <p className="font-bold text-emerald-600">{latestCTC}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-slate-500 font-medium text-[10px] uppercase">Assigned Leave Balance</p>
                                        <p className="font-bold text-slate-800">{detailsEmp.leaveBalance || 0} Days Total</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-slate-500 font-medium text-[10px] uppercase">Leaves Utilized</p>
                                        <p className="font-bold text-amber-600">{approvedLeaves} Days Off</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold border-b pb-2 mb-3">Submitted Documents</h4>
                                    {empDocs.length === 0 ? <p className="text-xs text-slate-500">No documents requested/submitted.</p> : (
                                        <ul className="space-y-2">
                                            {empDocs.map(d => (
                                                <li key={d.id} className="text-xs flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-md shadow-sm">
                                                    <span className="font-medium text-slate-700">{d.title}</span>
                                                    <Badge variant={d.status === "Uploaded" ? "success" : "warning"} className="text-[10px]">{d.status}</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
