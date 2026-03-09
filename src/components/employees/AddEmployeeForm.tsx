"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { AlertTriangle, CreditCard, Sparkles, UserPlus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AddEmployeeFormProps {
    onClose: () => void;
    employeeLimit: number;
    currentEmployeeCount: number;
    companyConfig: any;
    onConfigUpdate: (config: any) => void;
}

export function AddEmployeeForm({ onClose, employeeLimit, currentEmployeeCount, companyConfig, onConfigUpdate }: AddEmployeeFormProps) {
    const { user } = useAuth();
    const { employees, requestMultipleDocuments, createNotification } = useApp();

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
    const [errorField, setErrorField] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState("");
    const [emailConflict, setEmailConflict] = useState(false);
    const [selectedDocsToReq, setSelectedDocsToReq] = useState<string[]>([]);

    // Check for duplicate emails
    useEffect(() => {
        if (empEmail) {
            const exists = employees.some(e => e.email.toLowerCase() === empEmail.toLowerCase());
            setEmailConflict(exists);
        } else {
            setEmailConflict(false);
        }
    }, [empEmail, employees]);

    // Auto-suggest email based on name
    useEffect(() => {
        if (empName && user?.email) {
            const domain = user.email.split('@')[1];
            if (domain) {
                const formattedName = empName.toLowerCase().trim().replace(/\s+/g, '.');
                let suggestedEmail = `${formattedName}@${domain}`;

                if (employees.some(e => e.email.toLowerCase() === suggestedEmail.toLowerCase())) {
                    setSuggestion(`${formattedName}.staff@${domain}`);
                } else {
                    setSuggestion(suggestedEmail);
                }
            }
        } else {
            setSuggestion("");
        }
    }, [empName, user?.email, employees]);

    const availableDepartments = useMemo(() => companyConfig.departments.map((d: any) => d.name), [companyConfig]);
    const availableRoles = useMemo(() => {
        const deptObj = companyConfig.departments.find((d: any) => d.name === empDept);
        return deptObj ? deptObj.roles : [];
    }, [empDept, companyConfig]);

    const handleAddDepartment = (newDept: string) => {
        if (companyConfig.departments.some((d: any) => d.name.toLowerCase() === newDept.toLowerCase())) return;
        onConfigUpdate({ departments: [...companyConfig.departments, { name: newDept, roles: [] }] });
        toast.success(`Department "${newDept}" added!`);
    };

    const handleAddRole = (newRole: string) => {
        if (!empDept) return;
        const mappedConfig = companyConfig.departments.map((d: any) => {
            if (d.name === empDept) {
                if (!d.roles.includes(newRole)) return { ...d, roles: [...d.roles, newRole] };
            }
            return d;
        });
        onConfigUpdate({ departments: mappedConfig });
        toast.success(`Role "${newRole}" added to ${empDept}!`);
    };

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

                onClose();
            } else {
                const data = await response.json();
                const errorMessage = data.error || "Failed to add employee";
                setError(errorMessage);

                if (errorMessage.toLowerCase().includes("email")) {
                    setErrorField("email");
                    setEmailConflict(true);
                } else if (errorMessage.toLowerCase().includes("password")) {
                    setErrorField("password");
                } else if (errorMessage.toLowerCase().includes("name")) {
                    setErrorField("name");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Connection Error. Please check your network and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-md rounded-xl">
            <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg font-bold">Onboard New Employee</CardTitle>
                <CardDescription>Register a new member to the organization. Limit: {currentEmployeeCount}/{employeeLimit} used.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                        <Input required value={empName} onChange={e => { setEmpName(e.target.value); setErrorField(null); setError(""); }} placeholder="e.g. Jane Doe" className={cn("rounded-lg", errorField === "name" && "border-rose-500 bg-rose-50")} />
                        {errorField === "name" && <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 leading-none"><AlertTriangle className="w-2.5 h-2.5" /> {error}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Work Email</Label>
                        <div className="relative">
                            <Input required type="email" value={empEmail} onChange={e => { setEmpEmail(e.target.value); setErrorField(null); setError(""); }} placeholder="e.g. jane.doe@acmecorp.com" className={cn("rounded-lg", (emailConflict || errorField === "email") && "border-rose-500 bg-rose-50")} />
                            <AnimatePresence>
                                {(emailConflict || errorField === "email") && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] text-rose-600 font-bold mt-1 pl-1 flex items-center gap-1"
                                    >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        {errorField === "email" ? error : "This email already exists. Try using a surname or unique identifier."}
                                    </motion.p>
                                )}
                                {suggestion && empEmail !== suggestion && !empEmail.includes('@') && (
                                    <motion.button
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        type="button"
                                        onClick={() => setEmpEmail(suggestion)}
                                        className="absolute -bottom-6 left-0 text-[10px] text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100 transition-colors"
                                    >
                                        <Sparkles className="w-2.5 h-2.5" /> Use {suggestion}?
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Initial Password</Label>
                        <Input required type="password" value={empPassword} onChange={e => { setEmpPassword(e.target.value); setErrorField(null); setError(""); }} placeholder="••••••••" className={cn("rounded-lg", errorField === "password" && "border-rose-500 bg-rose-50")} />
                        {errorField === "password" && <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 leading-none"><AlertTriangle className="w-2.5 h-2.5" /> {error}</p>}
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Department</Label>
                        <SearchableDropdown
                            value={empDept}
                            onChange={(val) => { setEmpDept(val); setEmpRole(""); }}
                            options={availableDepartments}
                            placeholder="Select department..."
                            onAddTarget={handleAddDepartment}
                            onAddActionLabel="+ Create Department"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Job Role</Label>
                        <SearchableDropdown
                            value={empRole}
                            onChange={setEmpRole}
                            options={availableRoles}
                            placeholder={empDept ? "Select a role..." : "Please choose department first"}
                            disabled={!empDept}
                            onAddTarget={handleAddRole}
                            onAddActionLabel="+ Add Role to Department"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Position</Label>
                        <Input required value={empPosition} onChange={e => setEmpPosition(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="rounded-lg" />
                    </div>

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
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="corporate" disabled={loading} className="min-w-[140px]">
                            {loading ? "Registering..." : "Confirm & Onboard"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
