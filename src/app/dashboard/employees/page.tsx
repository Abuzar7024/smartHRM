"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Search, Plus, UserPlus, Mail, ShieldCheck, AlertTriangle, Users, Calendar, Trash2, CheckCircle, XCircle, Lock, Settings, CreditCard, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AddEmployeeForm } from "@/components/employees/AddEmployeeForm";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

export default function EmployeesPage() {
    const { role, companyName, user } = useAuth();
    const router = useRouter();
    const { employees, documents, docTemplates, requestMultipleDocuments, addDocTemplate, deleteDocTemplate, attendance, payroll, leaves, updateEmployeePermissions, createNotification, deleteEmployeeCascade, approveRegistration, rejectRegistration, pendingRegistrations } = useApp();
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [deletingEmp, setDeletingEmp] = useState<{ id: string; name: string; email: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [employeeLimit, setEmployeeLimit] = useState(5);
    const [fetchingLimit, setFetchingLimit] = useState(true);

    // Dynamic Departments & Roles (SaaS requirement)
    const [companyConfig, setCompanyConfig] = useState<{ departments: { name: string; roles: string[] }[] }>({
        departments: [
            { name: "Engineering", roles: ["Software Engineer", "Frontend Developer", "Backend Developer"] },
            { name: "Human Resources", roles: ["HR Manager", "HR Executive"] },
            { name: "Finance", roles: ["Accountant"] },
            { name: "Sales", roles: ["Sales Executive"] },
            { name: "Marketing", roles: ["Marketing Manager"] },
            { name: "Operations", roles: [] },
            { name: "Customer Support", roles: [] },
            { name: "Product", roles: ["Product Manager", "UI/UX Designer"] },
            { name: "Administration", roles: [] }
        ]
    });

    useEffect(() => {
        if (!companyName) return;
        getDoc(doc(db, "companySettings", companyName)).then(snap => {
            if (snap.exists() && snap.data().departments) {
                setCompanyConfig(snap.data() as any);
            }
        });
    }, [companyName]);

    const saveCompanyConfig = async (newConfig: any) => {
        setCompanyConfig(newConfig);
        if (companyName) {
            await setDoc(doc(db, "companySettings", companyName), newConfig, { merge: true });
        }
    };

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

    const availableDepartments = useMemo(() => companyConfig.departments.map((d: any) => d.name), [companyConfig]);
    const availableRoles = useMemo(() => {
        const deptObj = companyConfig.departments.find((d: any) => d.name === "Engineering"); // Standard placeholder
        return deptObj ? deptObj.roles : [];
    }, [companyConfig]);

    const handleAddDepartment = (newDept: string) => {
        if (companyConfig.departments.some((d: any) => d.name.toLowerCase() === newDept.toLowerCase())) return;
        saveCompanyConfig({ departments: [...companyConfig.departments, { name: newDept, roles: [] }] });
        toast.success(`Department "${newDept}" added!`);
    };

    const handleAddRole = (newRole: string, deptName: string) => {
        if (!deptName) return;
        const mappedConfig = companyConfig.departments.map((d: any) => {
            if (d.name === deptName) {
                if (!d.roles.includes(newRole)) return { ...d, roles: [...d.roles, newRole] };
            }
            return d;
        });
        saveCompanyConfig({ departments: mappedConfig });
        toast.success(`Role "${newRole}" added to ${deptName}!`);
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

            {/* ── Onboarding Form ── */}
            <AnimatePresence>
                {showForm && !isLimitReached && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <AddEmployeeForm
                            onClose={() => setShowForm(false)}
                            employeeLimit={employeeLimit}
                            currentEmployeeCount={employees.length}
                            companyConfig={companyConfig}
                            onConfigUpdate={saveCompanyConfig}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Workforce Database ── */}
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
                <EmployeeTable
                    employees={filtered}
                    onManagePermissions={(emp) => {
                        setSelectedEmp(emp);
                        setPermissionsModalOpen(true);
                    }}
                    onDelete={setDeletingEmp}
                />
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
                                { id: "request_leave", label: "Request Own Leaves", desc: "Allows the employee to submit their own leave requests." },
                                { id: "assign_task", label: "Assign Tasks", desc: "Can create and assign tasks to other colleagues." },
                                { id: "allocate_leave", label: "Allocate Leaves (Admin)", desc: "Can grant leave days to other employees." },
                                { id: "approve_leave", label: "Approve Leaves (Admin)", desc: "Can approve or reject others' leave requests." },
                                { id: "view_payroll", label: "View Payroll", desc: "Can view payroll and salary records." },
                                { id: "manage_employees", label: "Employee Directory Admin", desc: "Can onboard new employees and manage permissions." },
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
