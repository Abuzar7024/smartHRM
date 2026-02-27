"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { ShieldCheck, User as UserIcon, Save, Edit3, Lock, AlertCircle, Send, Mail, Phone, Linkedin, MapPin, Briefcase, Calendar, Globe, Camera, BadgeCheck, FileText, Landmark, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Trash2 as TrashIcon, XCircle } from "lucide-react";

export default function ProfilePage() {
    const { user, role, companyName } = useAuth();
    const { employees, updateEmployee, requestProfileUpdate, documents, uploadDocument, uploadProfileImage } = useApp();
    const searchParams = useSearchParams();
    const targetId = searchParams.get("id");

    const foundEmployee = targetId && role === "employer"
    const employeeRecord = useMemo(() => {
        return (foundEmployee || (role === "employer" && !targetId && user ? {
            id: "employer_profile",
            name: user.displayName || user.email?.split("@")[0] || "Employer",
            email: user.email || "",
            department: "Administration",
            position: "Administrator",
            joinDate: "N/A"
        } : null)) as any;
    }, [foundEmployee, role, targetId, user]);

    const [formData, setFormData] = useState<any>({
        firstName: "", lastName: "", department: "", position: "",
        phone: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
        linkedin: "", aboutMe: "", bankName: "", accountNumber: "",
        routingNumber: "", govIdNumber: "", panCard: "", fathersName: "",
        name: "", email: "", joinDate: ""
    });

    const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

    useEffect(() => {
        if (employeeRecord && employeeRecord.id !== lastLoadedId) {
            setFormData({
                name: employeeRecord.name || "",
                email: employeeRecord.email || "",
                department: employeeRecord.department || "",
                position: employeeRecord.position || "",
                joinDate: (employeeRecord.joinDate && employeeRecord.joinDate !== "N/A")
                    ? new Date(employeeRecord.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : "Registry Pending",
                phone: employeeRecord.phone || "",
                address: employeeRecord.address || "",
                emergencyContactName: employeeRecord.emergencyContactName || "",
                emergencyContactPhone: employeeRecord.emergencyContactPhone || "",
                linkedin: employeeRecord.linkedin || "",
                aboutMe: employeeRecord.aboutMe || "",
                bankName: employeeRecord.bankName || "",
                accountNumber: employeeRecord.accountNumber || "",
                routingNumber: employeeRecord.routingNumber || "",
                govIdNumber: employeeRecord.govIdNumber || "", // Aadhaar
                panCard: employeeRecord.panCard || "",
                fathersName: employeeRecord.fathersName || "",
                firstName: employeeRecord.name?.split(" ")[0] || "",
                lastName: employeeRecord.name?.split(" ").slice(1).join(" ") || "",
            });
            setLastLoadedId(employeeRecord.id);
        }
    }, [employeeRecord, lastLoadedId]);

    if (!employeeRecord) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50">
                <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <ShieldCheck className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">We couldn't verify the requested employee credentials in our secure directory.</p>
            </div>
        );
    }

    // Allow user to edit their own profile or if they are admin
    const canEdit = role === "employer" || !targetId || targetId === employeeRecord.id;
    const isAdmin = role === "employer";

    const handleSaveEditable = async () => {
        if (!employeeRecord.id) return;
        await updateEmployee(employeeRecord.id, {
            phone: formData.phone,
            address: formData.address,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            linkedin: formData.linkedin,
            aboutMe: formData.aboutMe,
            fathersName: formData.fathersName,
            department: formData.department,
            position: formData.position,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
        });
        toast.success("Profile Synchronized", {
            description: "Your personal information has been updated successfully.",
            className: "bg-white border-slate-200 text-slate-900 shadow-xl"
        });
    };

    const handleSaveApprovalBased = async () => {
        if (!employeeRecord.id) return;

        const financials = {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            routingNumber: formData.routingNumber,
            govIdNumber: formData.govIdNumber,
            panCard: formData.panCard,
        };

        if (role === "employer") {
            await updateEmployee(employeeRecord.id, financials);
            toast.success("Record Modified", { description: "Administrative changes applied directly." });
        } else {
            await requestProfileUpdate(
                employeeRecord.id,
                employeeRecord.name,
                employeeRecord.email,
                financials
            );
            toast.info("Update Pending", {
                description: "Tax and financial details are awaiting administrative review.",
                className: "bg-white border-slate-200 text-slate-900 shadow-xl"
            });
        }
    };

    const handleSaveSystem = async () => {
        if (!employeeRecord.id || !canEdit) return;
        await updateEmployee(employeeRecord.id, {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            department: formData.department,
            position: formData.position,
        });
        toast.success("Registry Updated", { description: "Core employee identity records have been modified." });
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/auth/delete-account', { method: 'DELETE' });
            if (res.ok) {
                toast.success("Account Purged", { description: "Your organization and all data have been permanently removed." });
                window.location.href = "/login";
            } else {
                throw new Error("Deletion failed");
            }
        } catch (e) {
            toast.error("Deletion Failed", { description: "Could not complete the request. Please try again." });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const mandatoryFields = ['phone', 'address', 'govIdNumber', 'panCard', 'bankName', 'accountNumber'];
    const filledMandatory = mandatoryFields.filter(f => !!formData[f]);
    const progress = Math.round((filledMandatory.length / mandatoryFields.length) * 100);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
            {/* --- Calm Header Area --- */}
            {/* --- Premium Header Area --- */}
            <div className="relative h-64 md:h-72 w-full bg-slate-900 border-b border-slate-800 overflow-hidden">
                {/* Abstract background pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:32px_32px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent" />

                <div className="max-w-7xl mx-auto h-full px-8 flex flex-col justify-center pt-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="outline" className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                            Secure Terminal
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">
                            Personnel <span className="text-indigo-400">Directory</span>
                        </h1>
                        <p className="text-slate-400 font-medium flex items-center gap-2 text-sm md:text-base max-w-xl">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Authorized Registry Access · Verifying credentials for {formData.name}...
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* --- Left Column: Identity --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-slate-200/60 shadow-2xl rounded-2xl overflow-hidden bg-white/90 backdrop-blur-xl sticky top-6">
                            <CardContent className="p-0">
                                <div className="p-10 flex flex-col items-center">
                                    <div className="relative mb-8 group">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="w-40 h-40 rounded-3xl bg-slate-50 border-4 border-white shadow-2xl p-1 relative overflow-hidden"
                                        >
                                            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-slate-200 overflow-hidden shadow-inner relative">
                                                {employeeRecord.photoURL ? (
                                                    <img src={employeeRecord.photoURL} alt={employeeRecord.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex flex-col items-center justify-center">
                                                        <UserIcon className="w-16 h-16 text-white opacity-40 mb-2" />
                                                    </div>
                                                )}
                                                {canEdit && (
                                                    <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2">
                                                        <Camera className="w-5 h-5" /> Edit Photo
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>

                                    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{formData.name}</h2>
                                    <Badge variant="outline" className="bg-slate-900 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.1em]">
                                        {formData.position || "Member"}
                                    </Badge>

                                    <div className="w-full space-y-5 pt-10 mt-6 border-t border-slate-100/60">
                                        <div className="flex items-center gap-4 text-slate-600 group">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Archive</span>
                                                <span className="text-sm font-bold truncate text-slate-700">{formData.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600 group">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Assignment</span>
                                                <span className="text-sm font-bold truncate text-slate-700">{formData.department || "General Administration"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-600 group">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Onboarding Date</span>
                                                <span className="text-sm font-bold truncate text-slate-700">{formData.joinDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/80 p-8 border-t border-slate-100 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Profile Integrity</span>
                                        <span className={cn("text-xs font-black", progress === 100 ? "text-emerald-600" : "text-slate-900")}>{progress}% Complete</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className={cn("h-full transition-all duration-1000", progress === 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-slate-800 to-indigo-600")}
                                        />
                                    </div>
                                    {progress < 100 && (
                                        <p className="text-[10px] text-slate-400 mt-3 font-bold flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 text-amber-500" /> Mandatory fields required for 100% compliance
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- Right Column: Forms --- */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. System Records */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> System Identity
                                </h3>
                                {canEdit && (
                                    <Button onClick={handleSaveSystem} size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900 font-bold text-xs h-8">
                                        <Save className="w-3 h-3 mr-2" /> Update Registry
                                    </Button>
                                )}
                            </div>
                            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Legal First Name *</Label>
                                        <Input
                                            value={formData.firstName || ""}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            readOnly={!canEdit}
                                            className={cn("h-10 rounded-md border-slate-200 bg-white", !canEdit && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Legal Last Name *</Label>
                                        <Input
                                            value={formData.lastName || ""}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            readOnly={!canEdit}
                                            className={cn("h-10 rounded-md border-slate-200 bg-white", !canEdit && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Official Designation</Label>
                                        <Input
                                            value={formData.position || ""}
                                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-10 rounded-md border-slate-200 bg-white", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Department</Label>
                                        <Input
                                            value={formData.department || ""}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-10 rounded-md border-slate-200 bg-white", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 2. Personal Information */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Edit3 className="w-3.5 h-3.5" /> Personal Records
                                </h3>
                                <Button onClick={handleSaveEditable} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold h-9 px-6 shadow-lg shadow-slate-200">
                                    <Save className="w-3.5 h-3.5 mr-2" /> Sync Profile
                                </Button>
                            </div>
                            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Father's Name (Optional)</Label>
                                            <Input value={formData.fathersName || ""} onChange={e => setFormData({ ...formData, fathersName: e.target.value })} placeholder="Your father's full name..." className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Contact Number *</Label>
                                            <Input value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Your primary mobile reach..." className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Residential Address *</Label>
                                            <Input value={formData.address || ""} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Your full residential address..." className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Emergency Contact Name</Label>
                                            <Input value={formData.emergencyContactName || ""} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} placeholder="Who should we call in an emergency?" className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Emergency Phone</Label>
                                            <Input value={formData.emergencyContactPhone || ""} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} placeholder="+91 XXXX XXX XXX" className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">LinkedIn Profile</Label>
                                            <Input value={formData.linkedin || ""} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="linkedin.com/in/username" className="h-10 rounded-md border-slate-200 focus:ring-2 focus:ring-slate-200 focus:ring-offset-1" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-6 border-t border-slate-50">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Professional Bio</Label>
                                        <Textarea
                                            value={formData.aboutMe || ""}
                                            onChange={e => setFormData({ ...formData, aboutMe: e.target.value })}
                                            placeholder="Introduce yourself professionally..."
                                            className="min-h-[120px] rounded-md border border-slate-200 text-sm leading-relaxed resize-none p-4"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 3. Compliance & Financials */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Landmark className="w-3.5 h-3.5 text-slate-400" /> Compliance & Financials
                                </h3>
                                <Button
                                    onClick={handleSaveApprovalBased}
                                    size="sm"
                                    className={cn(
                                        "rounded-xl font-bold h-9 px-6 transition-all",
                                        isAdmin ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {isAdmin ? <><Save className="w-3 h-3 mr-2" /> Commit Records</> : <><Send className="w-3 h-3 mr-2" /> Request Approval</>}
                                </Button>
                            </div>
                            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden relative">
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> Aadhaar Card Number *
                                        </Label>
                                        <Input value={formData.govIdNumber || ""} onChange={e => setFormData({ ...formData, govIdNumber: e.target.value })} placeholder="12-digit number" className="h-10 rounded-md border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> PAN Card Number *
                                        </Label>
                                        <Input value={formData.panCard || ""} onChange={e => setFormData({ ...formData, panCard: e.target.value })} placeholder="10-digit alphanumeric" className="h-10 rounded-md border-slate-200 uppercase" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Bank Name *</Label>
                                        <Input value={formData.bankName || ""} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g. HDFC, ICICI, SBI" className="h-10 rounded-md border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Account Number *</Label>
                                        <Input value={formData.accountNumber || ""} type="password" onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="Primary Bank Account" className="h-10 rounded-md border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">IFSC / Routing Code</Label>
                                        <Input value={formData.routingNumber || ""} onChange={e => setFormData({ ...formData, routingNumber: e.target.value })} placeholder="Bank location code" className="h-10 rounded-md border-slate-200 uppercase" />
                                    </div>
                                </CardContent>
                                {!isAdmin && (
                                    <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrative Review Required for changes</p>
                                    </div>
                                )}
                            </Card>
                        </section>

                        {/* 4. Personnel Documents */}
                        <section id="onboarding-docs" className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Personnel Documents
                                </h3>
                                <Badge variant="outline" className="text-[10px] font-bold border-slate-200 uppercase">Compliance Registry</Badge>
                            </div>
                            <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                                <CardContent className="p-0">
                                    {documents.filter(d => d.empEmail === (employees.find(e => e.id === (targetId || ""))?.email || user?.email || "")).length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-bold text-slate-600 tracking-tight">No documents currently requested.</p>
                                            <p className="text-xs mt-1">Pending compliance files will appear here for upload.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs whitespace-nowrap">
                                                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest text-[9px]">
                                                    <tr>
                                                        <th className="px-8 py-5">Required Document</th>
                                                        <th className="px-8 py-5">Verification Status</th>
                                                        <th className="px-8 py-5 text-right">Repository Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {documents.filter(d => d.empEmail === (employees.find(e => e.id === (targetId || ""))?.email || user?.email || "")).map(doc => (
                                                        <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shadow-sm">
                                                                        <FileText className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    <span className="font-bold text-slate-900">{doc.title}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                {doc.status === "Approved" ? (
                                                                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter">Verified</Badge>
                                                                ) : doc.status === "Uploaded" ? (
                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter">Under Review</Badge>
                                                                ) : (
                                                                    <Badge variant="warning" className="bg-amber-50 text-amber-700 border-none px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter">Awaiting</Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {doc.status !== "Approved" && (
                                                                        <Input
                                                                            type="file"
                                                                            className="hidden"
                                                                            id={`upload-${doc.id}`}
                                                                            accept="image/*,.pdf"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    if (file.size > 5 * 1024 * 1024) {
                                                                                        toast.error("File Too Large", { description: "Maximum file size is 5MB." });
                                                                                        return;
                                                                                    }
                                                                                    const reader = new FileReader();
                                                                                    reader.onloadend = () => {
                                                                                        const base64Url = reader.result as string;
                                                                                        uploadDocument(doc.id || "", base64Url);
                                                                                        toast.success("Document Uploaded", { description: "File saved and queued for review." });
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }}
                                                                        />
                                                                    )}
                                                                    {doc.status !== "Approved" ? (
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 text-[10px] font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
                                                                            onClick={() => document.getElementById(`upload-${doc.id}`)?.click()}
                                                                        >
                                                                            {doc.status === "Uploaded" ? "Replace File" : "Upload File"}
                                                                        </Button>
                                                                    ) : (
                                                                        <a
                                                                            href={doc.url || "#"}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all"
                                                                        >
                                                                            <Download className="w-3 h-3" /> View Archive
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                        {/* 5. Danger Zone (Employer Only) */}
                        {isAdmin && !targetId && (
                            <section className="space-y-4 pt-10">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Critical Protocol</h3>
                                </div>
                                <Card className="border-rose-100/60 shadow-xl rounded-2xl bg-gradient-to-br from-rose-50 to-white overflow-hidden border-2">
                                    <CardContent className="p-10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <AlertCircle className="w-32 h-32 text-rose-600" />
                                        </div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                                            <div className="max-w-md">
                                                <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">System Termination</h4>
                                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                    Execute organization-wide data purging. This process will permanently dissolve all registry records, financial assets, and personnel data within the SmartHR network.
                                                </p>
                                            </div>

                                            <Button
                                                variant="destructive"
                                                onClick={() => setIsDeleteDialogOpen(true)}
                                                className="font-black px-10 rounded-2xl h-14 shadow-2xl shadow-rose-200 uppercase tracking-widest text-xs transition-transform hover:scale-105 active:scale-95"
                                            >
                                                <TrashIcon className="w-5 h-5 mr-3" /> Terminate Account
                                            </Button>

                                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                                <DialogContent className="max-w-lg rounded-3xl border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-white p-0 overflow-hidden">
                                                    <div className="bg-rose-600 p-8 text-white flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                                                <TrashIcon className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-black tracking-tighter">Confirm Deletion</h2>
                                                                <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Protocol 04-X Termination</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-white hover:bg-white/10 rounded-full h-10 w-10 p-0">
                                                            <XCircle className="w-6 h-6" />
                                                        </Button>
                                                    </div>

                                                    <div className="p-8 pb-4">
                                                        <p className="text-slate-600 font-bold leading-relaxed">
                                                            This operation is irreversible. You are about to permanently purge the organization <span className="text-rose-600">"{companyName || "Your Company"}"</span> from the global registry. All active sessions will be terminated and data encrypted before deletion.
                                                        </p>

                                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 my-8 space-y-4">
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Purge Matrix
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {[
                                                                    "Personnel Records", "Financial Assets",
                                                                    "Cloud Documents", "System Identity",
                                                                    "Payroll History", "Task Architecture"
                                                                ].map(item => (
                                                                    <div key={item} className="flex items-center gap-2 text-[11px] font-black text-slate-700">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                        {item.toUpperCase()}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 pt-0 flex flex-col gap-3">
                                                        <Button
                                                            variant="destructive"
                                                            className="rounded-2xl font-black h-16 shadow-2xl shadow-rose-200 uppercase tracking-widest text-sm"
                                                            onClick={handleDeleteAccount}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? (
                                                                <motion.div className="flex items-center gap-2" animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                                                    <AlertCircle className="w-5 h-5 animate-pulse" /> Purging Organization...
                                                                </motion.div>
                                                            ) : "Authorize System Purge"}
                                                        </Button>
                                                        <Button variant="ghost" className="rounded-2xl font-black text-slate-400 uppercase tracking-widest text-xs h-12" onClick={() => setIsDeleteDialogOpen(false)}>
                                                            Abort Protocol
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
