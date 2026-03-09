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
    const { user, role, companyName, logout } = useAuth();
    const { employees, updateEmployee, requestProfileUpdate, documents, uploadDocument, uploadProfileImage, deleteCompanyCascade } = useApp();
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

    // If no record found yet, build a minimal placeholder from auth so the page always renders
    const fallbackRecord = !foundEmployee && user ? {
        id: null,
        name: user.displayName || user.email?.split("@")[0] || "",
        email: user.email || "",
        department: "",
        position: "",
        joinDate: "",
        _isFallback: true,
    } : null;

    const employeeRecord = (foundEmployee || fallbackRecord) as any;

    const [formData, setFormData] = useState<any>({
        firstName: "", lastName: "", department: "", position: "",
        phone: "", address: "", emergencyContactName: "", emergencyContactPhone: "",
        linkedin: "", aboutMe: "", bankName: "", accountNumber: "",
        routingNumber: "", govIdNumber: "", panCard: "", fathersName: "",
        name: "", email: "", joinDate: ""
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);
    // After 4s, if still no record found, stop showing shimmer and show "not found"
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);

    useEffect(() => {
        setLoadingTimedOut(false);
        const timer = setTimeout(() => setLoadingTimedOut(true), 4000);
        return () => clearTimeout(timer);
    }, [user?.email]);

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
        toast.success("Profile Updated", { description: "Your personal information has been saved." });
    };

    const hasExistingData = !!(
        employeeRecord?.bankName ||
        employeeRecord?.accountNumber ||
        employeeRecord?.govIdNumber ||
        employeeRecord?.panCard
    );

    // Admin has approved an update request — unlock fields for one edit session
    const isUnlocked = !!employeeRecord?.profileUpdateApproved;

    // ── Input Formatters ──────────────────────────────────────────
    const formatAadhaar = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, 12);
        return digits.replace(/(\d{4})(?=\d)/g, "$1-");
    };
    const formatPAN = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
    const formatIFSC = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
    const formatPhone = (raw: string) => {
        const digits = raw.replace(/\D/g, "").slice(0, 10);
        if (digits.length <= 5) return digits;
        return digits.slice(0, 5) + " " + digits.slice(5);
    };

    // ── Validators ────────────────────────────────────────────────
    const validateAadhaar = (v: string) => /^\d{4}-\d{4}-\d{4}$/.test(v);
    const validatePAN = (v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
    const validateIFSC = (v: string) => v === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);

    const handleSaveApprovalBased = async () => {
        if (!employeeRecord?.id) return;
        const financials = {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            routingNumber: formData.routingNumber,
            govIdNumber: formData.govIdNumber,
            panCard: formData.panCard,
        };

        // Validate IDs before saving
        if (financials.govIdNumber && !validateAadhaar(financials.govIdNumber)) {
            toast.error("Invalid Aadhaar", { description: "Aadhaar must be 12 digits in XXXX-XXXX-XXXX format." });
            return;
        }
        if (financials.panCard && !validatePAN(financials.panCard)) {
            toast.error("Invalid PAN", { description: "PAN must be in the format ABCDE1234F (5 letters, 4 digits, 1 letter)." });
            return;
        }
        if (financials.routingNumber && !validateIFSC(financials.routingNumber)) {
            toast.error("Invalid IFSC", { description: "IFSC must be in the format SBIN0001234 (4 letters, 0, 6 alphanumeric)." });
            return;
        }

        setIsSaving(true);
        try {
            if (isAdmin) {
                await updateEmployee(employeeRecord.id, financials);
                toast.success("Details Saved", { description: "Financial information updated successfully." });
            } else {
                if (!hasExistingData || isUnlocked) {
                    // First-time save OR admin has unlocked for re-edit — save directly then clear the flag
                    await updateEmployee(employeeRecord.id, { ...financials, profileUpdateApproved: false });
                    toast.success("Details Saved", { description: "Your financial details have been saved." });
                } else {
                    await requestProfileUpdate(employeeRecord.id, employeeRecord.name, employeeRecord.email, financials);
                    toast.info("Update Request Sent", { description: "Your request has been sent to the administrator for review." });
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSystem = async () => {
        if (!employeeRecord?.id || !isAdmin) return;
        await updateEmployee(employeeRecord.id, {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            department: formData.department,
            position: formData.position,
        });
        toast.success("Profile Updated", { description: "Employee details have been saved." });
    };

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const handleDeleteRecord = async () => {
        if (!isAdmin) return;
        try {
            await deleteCompanyCascade();
            setShowDeleteDialog(false);
            // Log out the user after company deletion
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (err) {
            console.error("Purge failed:", err);
        }
    };

    // Profile completion — includes ALL key fields so filling System Identity counts
    const mandatoryFields = ['firstName', 'lastName', 'department', 'position', 'phone', 'address', 'govIdNumber', 'panCard', 'bankName', 'accountNumber'];
    const filledMandatory = mandatoryFields.filter(f => !!(formData as any)[f]);
    const progress = Math.round((filledMandatory.length / mandatoryFields.length) * 100);


    const empDocs = documents.filter(d => d.empEmail === employeeRecord?.email);

    // If still loading (no timeout yet) show shimmer
    if (!employeeRecord && !loadingTimedOut) {
        return (
            <div className="min-h-screen bg-slate-50/50 pb-24 max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-pulse">
                {/* Header shimmer */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-3 w-24 bg-slate-200 rounded-full" />
                        <div className="h-7 w-48 bg-slate-200 rounded-full" />
                        <div className="h-3 w-36 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                </div>

                {/* Identity card shimmer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-slate-200 flex-shrink-0" />
                        <div className="space-y-3 flex-1">
                            <div className="h-5 w-48 bg-slate-200 rounded-full" />
                            <div className="h-3 w-32 bg-slate-200 rounded-full" />
                            <div className="h-3 w-40 bg-slate-200 rounded-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-1">
                                <div className="h-2 w-16 bg-slate-100 rounded-full" />
                                <div className="h-4 w-24 bg-slate-200 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form section shimmer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="h-5 w-40 bg-slate-200 rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                <div className="h-10 w-full bg-slate-100 rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial section shimmer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
                    <div className="h-5 w-48 bg-slate-200 rounded-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                <div className="h-10 w-full bg-slate-100 rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 max-w-7xl mx-auto p-4 md:p-8 space-y-10">
            <SectionHeader
                title="My Profile"
                subtitle="View and manage your personal, contact, and financial information."
                badge={
                    <StatusBadge
                        status={isAdmin ? "Admin" : "Employee"}
                        variant="corporate"
                        className="bg-slate-900 text-white border-none py-1 px-4"
                    />
                }
            />

            {/* Notice banner when no Firestore record exists */}
            {employeeRecord?._isFallback && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Your profile is not fully set up yet</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            Logged in as <span className="font-bold">{user?.email}</span>. Your employer needs to add your account to the system before you can save details.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Identity Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <CardContainer className="sticky top-10 overflow-hidden">
                        <div className="flex flex-col items-center">
                            <div className="p-8 w-full border-b border-slate-100 bg-slate-50/30 flex flex-col items-center">
                                <div className="relative group mb-6">
                                    <div className="w-44 h-44 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl p-1.5 overflow-hidden">
                                        <div className="w-full h-full rounded-[2.1rem] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                                            {(employeeRecord.photoURL || user?.photoURL) ? (
                                                <img
                                                    src={employeeRecord.photoURL || user?.photoURL || ""}
                                                    alt={formData.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`bg-gradient-to-br from-slate-800 to-indigo-900 w-full h-full flex flex-col items-center justify-center text-white absolute inset-0 ${(employeeRecord.photoURL || user?.photoURL) ? "hidden" : ""}`}>
                                                <span className="text-5xl font-black uppercase tracking-tight opacity-90">
                                                    {(formData.name || formData.firstName || user?.email || "?")[0].toUpperCase()}
                                                </span>
                                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Employee</span>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">{formData.name}</h2>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                    {formData.position || "Team Member"}
                                </p>
                            </div>

                            <div className="p-8 w-full space-y-6">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{formData.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{formData.department || "—"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Joined On</p>
                                        <p className="text-xs font-bold text-slate-700">{formData.joinDate}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 w-full border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile Complete</span>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                                {progress < 100 && (
                                    <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                                            Please fill in all required fields to complete your profile.
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
                            title="Basic Information"
                            subtitle="Your name, role, and department as set by your employer."
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
                            title="Contact & Personal Details"
                            subtitle="Your contact information and emergency contacts."
                            badge={canEdit && (
                                <PrimaryButton onClick={handleSaveEditable} size="sm" className="h-9 px-6 shadow-lg shadow-slate-200" icon={<Save className="w-3.5 h-3.5" />}>
                                    Save
                                </PrimaryButton>
                            )}
                        />
                        <CardContainer className="p-10 space-y-10 bg-white shadow-xl shadow-slate-200/50 border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="space-y-2 col-span-1">
                                    <InputField label="Father's Name" value={formData.fathersName} onChange={e => setFormData({ ...formData, fathersName: e.target.value })} readOnly={!canEdit} icon={<UserIcon className="w-4 h-4 text-slate-400" />} placeholder="Full legal name" />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <InputField label="Phone Number *" value={formData.phone} onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })} readOnly={!canEdit} icon={<Phone className="w-4 h-4 text-slate-400" />} placeholder="98765 43210" />
                                </div>
                                <div className="md:col-span-2 space-y-2 pt-2">
                                    <InputField label="Home Address *" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} readOnly={!canEdit} icon={<MapPin className="w-4 h-4 text-slate-400" />} placeholder="Street, City, State, PIN" />
                                </div>
                                <div className="space-y-2 col-span-1 pt-2">
                                    <InputField label="Emergency Contact Name" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} readOnly={!canEdit} icon={<UserIcon className="w-4 h-4 text-slate-400" />} placeholder="Full name" />
                                </div>
                                <div className="space-y-2 col-span-1 pt-2">
                                    <InputField label="Emergency Contact Phone" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: formatPhone(e.target.value) })} readOnly={!canEdit} icon={<Phone className="w-4 h-4 text-slate-400" />} placeholder="98765 43210" />
                                </div>
                            </div>
                            <div className="pt-8 border-t border-slate-50">
                                <TextAreaField label="Professional Bio" value={formData.aboutMe} onChange={e => setFormData({ ...formData, aboutMe: e.target.value })} readOnly={!canEdit} placeholder="Brief summary of professional experience..." className="min-h-[140px] bg-slate-50/30" />
                            </div>
                        </CardContainer>
                    </section>

                    {/* 3. Compliance & Financials */}
                    <section className="space-y-6">
                        <SectionHeader
                            title="Tax & Bank Details"
                            subtitle="Your government ID and bank account for payroll processing."
                            badge={canEdit && (
                                <PrimaryButton
                                    onClick={handleSaveApprovalBased}
                                    size="sm"
                                    loading={isSaving}
                                    className={cn(
                                        "h-9 px-6 transition-all duration-300 shadow-lg",
                                        !isAdmin && "bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-900/10 hover:shadow-indigo-500/20"
                                    )}
                                    icon={isAdmin || !hasExistingData ? <Save className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                                >
                                    {isAdmin ? "Commit Changes" : (!hasExistingData ? "Save Details" : "Request for Update")}
                                </PrimaryButton>
                            )}
                        />
                        <CardContainer className="p-10 bg-white shadow-xl shadow-slate-200/50 border-slate-100 overflow-hidden">
                            <div className="space-y-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                        Government ID
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                        <div className="space-y-1">
                                            <InputField
                                                label="Aadhaar Number *"
                                                value={formData.govIdNumber}
                                                onChange={e => setFormData({ ...formData, govIdNumber: formatAadhaar(e.target.value) })}
                                                readOnly={!isAdmin && hasExistingData && !isUnlocked}
                                                icon={<FileText className="w-4 h-4 text-slate-400" />}
                                                placeholder="XXXX-XXXX-XXXX"
                                            />
                                            {formData.govIdNumber && !validateAadhaar(formData.govIdNumber) && (
                                                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Must be 12 digits (XXXX-XXXX-XXXX)
                                                </p>
                                            )}
                                            {formData.govIdNumber && validateAadhaar(formData.govIdNumber) && (
                                                <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> Valid Aadhaar format
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <InputField
                                                label="PAN Number *"
                                                value={formData.panCard}
                                                onChange={e => setFormData({ ...formData, panCard: formatPAN(e.target.value) })}
                                                readOnly={!isAdmin && hasExistingData && !isUnlocked}
                                                icon={<FileText className="w-4 h-4 text-slate-400" />}
                                                placeholder="ABCDE1234F"
                                            />
                                            {formData.panCard && !validatePAN(formData.panCard) && (
                                                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Must be ABCDE1234F format
                                                </p>
                                            )}
                                            {formData.panCard && validatePAN(formData.panCard) && (
                                                <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> Valid PAN format
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                        Bank Account
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                        <div className="md:col-span-2">
                                            <InputField label="Bank Name *" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} readOnly={!isAdmin && hasExistingData && !isUnlocked} icon={<Landmark className="w-4 h-4 text-slate-400" />} placeholder="e.g. State Bank of India" />
                                        </div>
                                        <InputField label="Account Number *" type="password" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} readOnly={!isAdmin && hasExistingData && !isUnlocked} icon={<Lock className="w-4 h-4 text-slate-400" />} placeholder="••••••••••••" />
                                        <div className="space-y-1">
                                            <InputField
                                                label="IFSC Code"
                                                value={formData.routingNumber}
                                                onChange={e => setFormData({ ...formData, routingNumber: formatIFSC(e.target.value) })}
                                                readOnly={!isAdmin && hasExistingData && !isUnlocked}
                                                icon={<Globe className="w-4 h-4 text-slate-400" />}
                                                className="uppercase"
                                                placeholder="SBIN0001234"
                                            />
                                            {formData.routingNumber && !validateIFSC(formData.routingNumber) && (
                                                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Must be SBIN0001234 format
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isAdmin && (
                                <div className="px-10 py-4 bg-slate-50 -mx-10 -mb-10 border-t border-slate-100 mt-10 flex flex-col gap-3">
                                    {isUnlocked && (
                                        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
                                            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                                            <p className="text-xs font-semibold">
                                                Your update request was approved. Edit your details and click Save.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            {isUnlocked
                                                ? "Fields are unlocked. Save your changes to lock them again."
                                                : hasExistingData
                                                    ? "To update your financial details, submit a request for admin approval."
                                                    : "Enter your details below. Once saved, changes require admin approval."}
                                        </p>
                                    </div>
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
