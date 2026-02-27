"use client";

import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { user, role } = useAuth();
    const { employees, updateEmployee, requestProfileUpdate, documents, uploadDocument, uploadProfileImage } = useApp();
    const searchParams = useSearchParams();
    const targetId = searchParams.get("id");

    const foundEmployee = targetId && role === "employer"
        ? employees.find(e => e.id === targetId)
        : employees.find(e => e.email === user?.email);

    const employeeRecord = (foundEmployee || (role === "employer" && !targetId && user ? {
        id: "employer_profile",
        name: user.displayName || user.email?.split("@")[0] || "Employer",
        email: user.email || "",
        department: "Administration",
        position: "Administrator",
        joinDate: new Date().toISOString()
    } : null)) as any;

    const [formData, setFormData] = useState<any>({
        firstName: "", lastName: "", department: "", position: "",
        phone: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
        linkedin: "", aboutMe: "", bankName: "", accountNumber: "",
        routingNumber: "", govIdNumber: "", panCard: "", fathersName: "",
        name: "", email: "", joinDate: ""
    });

    useEffect(() => {
        if (employeeRecord) {
            setFormData({
                name: employeeRecord.name || "",
                email: employeeRecord.email || "",
                department: employeeRecord.department || "",
                position: employeeRecord.position || "",
                joinDate: employeeRecord.joinDate ? new Date(employeeRecord.joinDate).toLocaleDateString('en-IN') : "N/A",
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
        }
    }, [employeeRecord]);

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

        if (isAdmin) {
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
        if (!employeeRecord.id || !isAdmin) return;
        await updateEmployee(employeeRecord.id, {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            department: formData.department,
            position: formData.position,
        });
        toast.success("Registry Updated", { description: "Core employee identity records have been modified." });
    };

    const mandatoryFields = ['phone', 'address', 'govIdNumber', 'panCard', 'bankName', 'accountNumber'];
    const filledMandatory = mandatoryFields.filter(f => !!formData[f]);
    const progress = Math.round((filledMandatory.length / mandatoryFields.length) * 100);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
            {/* --- Calm Header Area --- */}
            <div className="relative h-48 md:h-56 w-full bg-white border-b border-slate-200 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-slate-50 to-transparent" />

                <div className="max-w-7xl mx-auto h-full px-8 flex items-center pt-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Personnel File</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-indigo-500" /> Authorized Registry Profile
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* --- Left Column: Identity --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl sticky top-6">
                            <CardContent className="p-0">
                                <div className="p-8 flex flex-col items-center">
                                    <div className="relative mb-6">
                                        <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-slate-100 p-1 relative group overflow-hidden">
                                            <div className="w-full h-full rounded-[1.25rem] bg-white flex items-center justify-center text-slate-200 overflow-hidden">
                                                {employeeRecord.photoURL ? (
                                                    <img src={employeeRecord.photoURL} alt={employeeRecord.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-16 h-16" />
                                                )}
                                            </div>
                                            {!targetId && (
                                                <>
                                                    <input
                                                        type="file"
                                                        id="avatar-upload"
                                                        className="hidden"
                                                        accept="image/png, image/jpeg"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                if (file.size > 2 * 1024 * 1024) {
                                                                    toast.error("File Too Large", { description: "Biometric image must be under 2MB for registry ingestion." });
                                                                    return;
                                                                }
                                                                await uploadProfileImage(file);
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => document.getElementById("avatar-upload")?.click()}
                                                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                    >
                                                        <Camera className="w-6 h-6" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-1">{formData.name}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{formData.position || "Member"}</p>

                                    <div className="w-full space-y-4 pt-8 mt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-semibold truncate">{formData.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Briefcase className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-semibold">{formData.department || "General"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                <Calendar className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-semibold">Joined {formData.joinDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Registry Compliance</span>
                                        <span className={cn("text-xs font-bold", progress === 100 ? "text-emerald-600" : "text-slate-600")}>{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8 }}
                                            className={cn("h-full transition-colors", progress === 100 ? "bg-emerald-500" : "bg-slate-800")}
                                        />
                                    </div>
                                    {progress < 100 && (
                                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Complete mandatory fields marked with *</p>
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
                                {isAdmin && (
                                    <Button onClick={handleSaveSystem} size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900 font-bold text-xs h-8">
                                        <Save className="w-3 h-3 mr-2" /> Update Registry
                                    </Button>
                                )}
                            </div>
                            <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Legal First Name *</Label>
                                        <Input
                                            value={formData.firstName || ""}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-11 rounded-2xl bg-slate-50/30 border-slate-100", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Legal Last Name *</Label>
                                        <Input
                                            value={formData.lastName || ""}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-11 rounded-2xl bg-slate-50/30 border-slate-100", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Official Designation</Label>
                                        <Input
                                            value={formData.position || ""}
                                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-11 rounded-2xl bg-slate-50/30 border-slate-100", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Department</Label>
                                        <Input
                                            value={formData.department || ""}
                                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            readOnly={!isAdmin}
                                            className={cn("h-11 rounded-2xl bg-slate-50/30 border-slate-100", !isAdmin && "read-only:opacity-60 cursor-not-allowed")}
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
                            <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Father's Name (Optional)</Label>
                                            <Input value={formData.fathersName || ""} onChange={e => setFormData({ ...formData, fathersName: e.target.value })} placeholder="Your father's full name..." className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Contact Number *</Label>
                                            <Input value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Your primary mobile reach..." className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Residential Address *</Label>
                                            <Input value={formData.address || ""} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Your full residential address..." className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Emergency Contact Name</Label>
                                            <Input value={formData.emergencyContactName || ""} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} placeholder="Who should we call in an emergency?" className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">Emergency Phone</Label>
                                            <Input value={formData.emergencyContactPhone || ""} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} placeholder="+91 XXXX XXX XXX" className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                        <div className="space-y-1.5 md:col-span-2">
                                            <Label className="text-xs font-bold text-slate-400 ml-1">LinkedIn Profile</Label>
                                            <Input value={formData.linkedin || ""} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="linkedin.com/in/username" className="h-11 rounded-2xl border-slate-200 focus:ring-slate-900" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-6 border-t border-slate-50">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Professional Bio</Label>
                                        <Textarea
                                            value={formData.aboutMe || ""}
                                            onChange={e => setFormData({ ...formData, aboutMe: e.target.value })}
                                            placeholder="Introduce yourself professionally..."
                                            className="min-h-[120px] rounded-2xl border-slate-200 text-sm leading-relaxed resize-none p-4"
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
                            <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden relative">
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> Aadhaar Card Number *
                                        </Label>
                                        <Input value={formData.govIdNumber || ""} onChange={e => setFormData({ ...formData, govIdNumber: e.target.value })} placeholder="12-digit number" className="h-11 rounded-2xl border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> PAN Card Number *
                                        </Label>
                                        <Input value={formData.panCard || ""} onChange={e => setFormData({ ...formData, panCard: e.target.value })} placeholder="10-digit alphanumeric" className="h-11 rounded-2xl border-slate-200 uppercase" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Bank Name *</Label>
                                        <Input value={formData.bankName || ""} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g. HDFC, ICICI, SBI" className="h-11 rounded-2xl border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">Account Number *</Label>
                                        <Input value={formData.accountNumber || ""} type="password" onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="Primary Bank Account" className="h-11 rounded-2xl border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-400 ml-1">IFSC / Routing Code</Label>
                                        <Input value={formData.routingNumber || ""} onChange={e => setFormData({ ...formData, routingNumber: e.target.value })} placeholder="Bank location code" className="h-11 rounded-2xl border-slate-200 uppercase" />
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
                            <Card className="border-slate-200 shadow-sm rounded-3xl bg-white overflow-hidden">
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

                    </div>
                </div>
            </div>
        </div>
    );
}
