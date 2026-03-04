"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { CheckCircle, XCircle, Clock, ShieldCheck, FileText, ArrowRight, User as UserIcon, AlertCircle, Database } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Shared Components
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { CardContainer, SectionHeader } from "@/components/shared/common";
import { StatusBadge } from "@/components/shared/tables";

export default function ProfileRequestsPage() {
    const { role } = useAuth();
    const { profileUpdates, approveProfileUpdate, rejectProfileUpdate } = useApp();

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-slate-50">
                <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 tracking-tight text-center uppercase leading-none mb-1.5 ">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-xs uppercase font-black text-[10px] tracking-widest ">This terminal is restricted to central administration.</p>
            </div>
        );
    }

    const pendingRequests = profileUpdates?.filter(r => r.status === "Pending") || [];
    const pastRequests = profileUpdates?.filter(r => r.status !== "Pending") || [];

    const getFieldLabel = (key: string) => {
        const labels: Record<string, string> = {
            bankName: "Bank Name",
            accountNumber: "Account Number",
            routingNumber: "Routing Number",
            govIdNumber: "Gov/Tax ID",
            address: "Permanent Address",
            panCard: "PAN Card",
            fathersName: "Father's Name"
        };
        return labels[key] || key;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24 max-w-6xl mx-auto p-4 md:p-12 space-y-12">
            <SectionHeader
                title="Protocol Override Registry"
                subtitle="Review and authorize employee requests for profile data modifications."
                badge={
                    <StatusBadge
                        status="Administration Control"
                        variant="corporate"
                        className="bg-slate-900 text-white border-none py-1 px-4"
                    />
                }
            />

            {/* Pending Requests Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Pending Queue
                    </h3>
                    <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm animate-pulse">
                        {pendingRequests.length} Active Requests
                    </div>
                </div>

                {pendingRequests.length === 0 ? (
                    <CardContainer className="p-16 flex flex-col items-center justify-center text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100"
                        >
                            <CheckCircle className="w-8 h-8 text-slate-200" />
                        </motion.div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Queue Synchronized</h4>
                        <p className="text-xs text-slate-500 font-medium">No pending profile updates currently require authorization.</p>
                    </CardContainer>
                ) : (
                    <div className="space-y-6">
                        {pendingRequests.map(req => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <CardContainer className="overflow-hidden">
                                    <div className="p-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm">
                                                    <UserIcon className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{req.empName}</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{req.empEmail}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <PrimaryButton
                                                    onClick={() => approveProfileUpdate(req.id!)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-10 px-6 shadow-emerald-100"
                                                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                                                >
                                                    Authorize
                                                </PrimaryButton>
                                                <SecondaryButton
                                                    onClick={() => rejectProfileUpdate(req.id!)}
                                                    className="border-red-100 text-red-600 hover:bg-red-50 h-10 px-6"
                                                    icon={<XCircle className="w-3.5 h-3.5" />}
                                                >
                                                    Reject
                                                </SecondaryButton>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Proposed Record Modifiers</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    Targeted: {new Date(req.requestedAt).toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {Object.entries(req.fields).map(([key, value]) => (
                                                    <div key={key} className="space-y-1.5 group">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{getFieldLabel(key)}</label>
                                                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-800 group-hover:border-indigo-200 transition-colors">
                                                            {value as string || <span className="text-slate-300 italic font-medium">Cleared</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContainer>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Past History Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <CheckCircle className="w-3.5 h-3.5" /> Archive Registry
                    </h3>
                </div>

                <CardContainer className="overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {pastRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 uppercase font-black text-[10px] tracking-widest">
                                No archived protocol overrides visible.
                            </div>
                        ) : (
                            pastRequests.map(req => (
                                <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                                            req.status === "Approved" ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                                        )}>
                                            {req.status === "Approved" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 tracking-tight">{req.empName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Archive Ref: {req.id?.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div className="hidden sm:block">
                                            <p className="text-xs font-black text-slate-700">{new Date(req.requestedAt).toLocaleDateString()}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Processing Term</p>
                                        </div>
                                        <StatusBadge
                                            status={req.status || "Unknown"}
                                            variant={req.status === "Approved" ? "success" : "error"}
                                            className="min-w-[100px]"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContainer>
            </section>
        </div>
    );
}
