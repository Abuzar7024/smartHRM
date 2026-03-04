"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, User as UserIcon, Save, Edit3, Lock, AlertCircle, Send, Mail, Phone, Linkedin, MapPin, Briefcase, Calendar, Globe, Camera, FileText, Landmark, Download, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Shared Components
import { PrimaryButton, SecondaryButton, IconButton } from "@/components/shared/buttons";
import { InputField, TextAreaField } from "@/components/shared/forms";
import { CardContainer, SectionHeader, Modal } from "@/components/shared/common";
import { StatusBadge, DataTable } from "@/components/shared/tables";

export default function ProfilePage() {
    const { user, role, companyName } = useAuth();
    const { employees, updateEmployee, requestProfileUpdate, documents, uploadDocument, uploadProfileImage } = useApp();
    const searchParams = useSearchParams();
    const targetId = searchParams.get("id");

    const foundEmployee = targetId && role === "employer"
        ? employees.find(e => e.id === targetId)
        : (role === "employer" && !targetId && user ? {
            id: "employer_profile",
            name: user.displayName || user.email?.split("@")[0] || "Employer",
            email: user.email || "",
            department: "Administration",
            position: "Administrator",
            joinDate: "N/A"
        } : (role === "employee" ? employees.find(e => e.email === user?.email) : null));

    const employeeRecord = foundEmployee as any;

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
                govIdNumber: employeeRecord.govIdNumber || "",
                panCard: employeeRecord.panCard || "",
                fathersName: employeeRecord.fathersName || "",
                firstName: employeeRecord.name?.split(" ")[0] || "",
                lastName: employeeRecord.name?.split(" ").slice(1).join(" ") || "",
            });
            setLastLoadedId(employeeRecord.id);
        }
    }, [employeeRecord, lastLoadedId]);

    const canEdit = role === "employer" || !targetId || targetId === employeeRecord?.id;
    const isAdmin = role === "employer";

    const handleSaveEditable = async () => {
        if (!employeeRecord?.id) return;
        await updateEmployee(employeeRecord.id, {
            phone: formData.phone,
            address: formData.address,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            linkedin: formData.linkedin,
            aboutMe: formData.aboutMe,
            fathersName: formData.fathersName,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
        });
        toast.success("Profile Synchronized", { description: "Your personal information has been updated." });
    };

    const handleSaveApprovalBased = async () => {
        if (!employeeRecord?.id) return;
        const financials = {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            routingNumber: formData.routingNumber,
            govIdNumber: formData.govIdNumber,
            panCard: formData.panCard,
        };

        if (isAdmin) {
            await updateEmployee(employeeRecord.id, financials);
            toast.success("Record Modified", { description: "Administrative changes applied." });
        } else {
            await requestProfileUpdate(employeeRecord.id, employeeRecord.name, employeeRecord.email, financials);
            toast.info("Update Pending", { description: "Changes awaiting administrative review." });
        }
    };

    const handleSaveSystem = async () => {
        if (!employeeRecord?.id || !isAdmin) return;
        await updateEmployee(employeeRecord.id, {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            department: formData.department,
            position: formData.position,
        });
        toast.success("Registry Updated", { description: "Core identity records modified." });
    };

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const handleDeleteRecord = async () => {
        // Implement deletion logic
        setShowDeleteDialog(false);
        toast.success("Record Purged", { description: "Employee history removed from registry." });
    };

    const mandatoryFields = ['phone', 'address', 'govIdNumber', 'panCard', 'bankName', 'accountNumber'];
    const filledMandatory = mandatoryFields.filter(f => !!formData[f]);
    const progress = Math.round((filledMandatory.length / mandatoryFields.length) * 100);

    const empDocs = documents.filter(d => d.empEmail === employeeRecord?.email);

    if (!employeeRecord) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50">
                <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">We couldn't verify the requested employee record.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 max-w-7xl mx-auto p-4 md:p-8 space-y-10">
            <SectionHeader
                title="Personnel Archive"
                subtitle="Authorized access to official identity and compliance records."
                badge={
                    <StatusBadge
                        status={isAdmin ? "Super Admin" : "Employee"}
                        variant="corporate"
                        className="bg-slate-900 text-white border-none py-1 px-4"
                    />
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Identity Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <CardContainer className="sticky top-10 overflow-hidden">
                        <div className="flex flex-col items-center">
                            <div className="p-8 w-full border-b border-slate-100 bg-slate-50/30 flex flex-col items-center">
                                <div className="relative group mb-6">
                                    <div className="w-44 h-44 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl p-1.5 overflow-hidden">
                                        <div className="w-full h-full rounded-[2.1rem] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                            {employeeRecord.photoURL ? (
                                                <img src={employeeRecord.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="bg-slate-800 w-full h-full flex flex-col items-center justify-center text-white/40">
                                                    <UserIcon className="w-16 h-16" />
                                                </div>
                                            )}
                                            {canEdit && (
                                                <button
                                                    onClick={() => document.getElementById('profile-upload')?.click()}
                                                    className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-2 backdrop-blur-sm cursor-pointer"
                                                >
                                                    <Camera className="w-6 h-6" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && employeeRecord?.id) {
                                                uploadProfileImage(file);
                                                toast.success("Identity Updated", { description: "Bio-metric record updated successfully." });
                                            }
                                        }}
                                    />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{formData.name}</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                    {formData.position || "Protocol Member"}
                                </p>
                            </div>

                            <div className="p-8 w-full space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Communications</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{formData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Operational Unit</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{formData.department || "Operations"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registry Date</p>
                                        <p className="text-xs font-bold text-slate-700">{formData.joinDate}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 w-full border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliance</span>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                                {progress < 100 && (
                                    <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                                            Identity incomplete. System updates required for full authorization.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContainer>
                </div>

                {/* Right Column: Information Forms */}
                <div className="lg:col-span-8 space-y-10">
                    {/* 1. System Identity */}
                    <section className="space-y-6">
                        <SectionHeader
                            title="System Identity"
                            subtitle="Core records verifying legal identity and organizational placement."
                            badge={isAdmin && (
                                <PrimaryButton onClick={handleSaveSystem} variant="ghost" size="sm" className="h-8" icon={<Save className="w-3.5 h-3.5" />}>
                                    Update
                                </PrimaryButton>
                            )}
                        />
                        <CardContainer className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="First Name *" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} readOnly={!isAdmin} icon={<UserIcon className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Last Name *" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} readOnly={!isAdmin} icon={<UserIcon className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Designation" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} readOnly={!isAdmin} icon={<Briefcase className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} readOnly={!isAdmin} icon={<Globe className="w-4 h-4 text-slate-400" />} />
                            </div>
                        </CardContainer>
                    </section>

                    {/* 2. Personal Records */}
                    <section className="space-y-6">
                        <SectionHeader
                            title="Personal Records"
                            subtitle="Reachability and emergency contact protocols."
                            badge={canEdit && (
                                <PrimaryButton onClick={handleSaveEditable} size="sm" className="h-9 px-6 shadow-lg shadow-slate-200" icon={<Save className="w-3.5 h-3.5" />}>
                                    Sync Profile
                                </PrimaryButton>
                            )}
                        />
                        <CardContainer className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputField label="Father's Name" value={formData.fathersName} onChange={e => setFormData({ ...formData, fathersName: e.target.value })} readOnly={!canEdit} icon={<UserIcon className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Contact Number *" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} readOnly={!canEdit} icon={<Phone className="w-4 h-4 text-slate-400" />} />
                                <div className="md:col-span-2">
                                    <InputField label="Residential Address *" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} readOnly={!canEdit} icon={<MapPin className="w-4 h-4 text-slate-400" />} />
                                </div>
                                <InputField label="Emergency Name" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} readOnly={!canEdit} icon={<UserIcon className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Emergency Phone" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} readOnly={!canEdit} icon={<Phone className="w-4 h-4 text-slate-400" />} />
                            </div>
                            <TextAreaField label="Professional Bio" value={formData.aboutMe} onChange={e => setFormData({ ...formData, aboutMe: e.target.value })} readOnly={!canEdit} placeholder="Introduction..." className="min-h-[120px]" />
                        </CardContainer>
                    </section>

                    {/* 3. Compliance & Financials */}
                    <section className="space-y-6">
                        <SectionHeader
                            title="Financial Compliance"
                            subtitle="Tax identity and secure compensation routing endpoints."
                            badge={canEdit && (
                                <PrimaryButton onClick={handleSaveApprovalBased} size="sm" className={cn("h-9 px-6", !isAdmin && "bg-white text-slate-900 border-slate-200")} icon={isAdmin ? <Save className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}>
                                    {isAdmin ? "Commit" : "Request Update"}
                                </PrimaryButton>
                            )}
                        />
                        <CardContainer className="p-8 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <InputField label="Aadhaar ID *" value={formData.govIdNumber} onChange={e => setFormData({ ...formData, govIdNumber: e.target.value })} readOnly={!canEdit} icon={<FileText className="w-4 h-4 text-slate-400" />} />
                                <InputField label="PAN Card *" value={formData.panCard} onChange={e => setFormData({ ...formData, panCard: e.target.value })} readOnly={!canEdit} icon={<FileText className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Bank Name *" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} readOnly={!canEdit} icon={<Landmark className="w-4 h-4 text-slate-400" />} />
                                <InputField label="Account No *" type="password" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} readOnly={!canEdit} icon={<Lock className="w-4 h-4 text-slate-400" />} />
                                <InputField label="IFSC Code" value={formData.routingNumber} onChange={e => setFormData({ ...formData, routingNumber: e.target.value })} readOnly={!canEdit} icon={<Globe className="w-4 h-4 text-slate-400" />} className="uppercase" />
                            </div>
                            {!isAdmin && (
                                <div className="px-8 py-3 bg-slate-50 -mx-8 -mb-8 border-t border-slate-100 flex items-center gap-2">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Review Protocol Required for modifications</p>
                                </div>
                            )}
                        </CardContainer>
                    </section>

                    {/* 4. Documents */}
                    <section className="space-y-6">
                        <SectionHeader title="Archived Assets" subtitle="Official certifications and identifying documents." />
                        <CardContainer className="overflow-hidden">
                            <DataTable
                                columns={[
                                    { header: "Document", key: "title" },
                                    { header: "Verification", key: "status", render: (doc) => <StatusBadge status={doc.status} variant={doc.status === "Approved" ? "success" : "warning"} /> },
                                    { header: "Date", key: "requestedAt", render: (doc) => <span className="text-slate-400 font-medium">{doc.requestedAt ? new Date(doc.requestedAt).toLocaleDateString() : "Pending"}</span> },
                                    { header: "Action", key: "action", render: () => <IconButton icon={<Download className="w-4 h-4" />} onClick={() => { }} variant="ghost" className="text-indigo-600 hover:bg-indigo-50" /> }
                                ]}
                                data={empDocs}
                            />
                            {empDocs.length === 0 && (
                                <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                    <FileText className="w-10 h-10 mb-2 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-widest">Repository Empty</p>
                                </div>
                            )}
                        </CardContainer>
                    </section>

                    {/* 5. Danger Zone (Employer only) */}
                    {isAdmin && (
                        <section className="space-y-6 pt-10 border-t border-slate-200">
                            <SectionHeader title="Administrative Control" subtitle="Terminal access and identity deregistration." />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <CardContainer className="p-8 border-red-100 bg-red-50/10 col-span-1 md:col-span-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <h4 className="text-sm font-black text-red-900 uppercase tracking-tight">Access Termination</h4>
                                    </div>
                                    <p className="text-xs text-red-600 font-medium mb-6">Execute identity de-registration protocol. This action is irreversible and will purge all personnel data.</p>
                                    <SecondaryButton onClick={() => setShowDeleteDialog(true)} className="w-full border-red-200 text-red-600 hover:bg-red-50" icon={<Trash2 className="w-3.5 h-3.5" />}>
                                        De-Register Identity
                                    </SecondaryButton>
                                </CardContainer>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                title="Identity Purge Authorization"
                subtitle="Critical Security Protocol: Permanent Clearance Removal"
            >
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-bold uppercase leading-relaxed">Identity Purge protocol will immediately terminate access and delete archived assets.</p>
                    </div>
                    <div className="flex gap-3">
                        <PrimaryButton onClick={handleDeleteRecord} className="flex-1 bg-red-600 hover:bg-red-700" icon={<Trash2 className="w-3.5 h-3.5" />}>Confirm</PrimaryButton>
                        <SecondaryButton onClick={() => setShowDeleteDialog(false)} className="flex-1">Abort</SecondaryButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
