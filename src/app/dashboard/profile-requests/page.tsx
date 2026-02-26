"use client";

import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, Clock, ShieldCheck, FileText, ArrowRight } from "lucide-react";

export default function ProfileRequestsPage() {
    const { role } = useAuth();
    const { profileUpdates, approveProfileUpdate, rejectProfileUpdate } = useApp();

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">This terminal is restricted to central administration.</p>
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
        };
        return labels[key] || key;
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Profile Update Requests</h1>
                    <p className="text-sm text-slate-500">Review and approve employee financial and identity record changes.</p>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-5">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Pending Approvals ({pendingRequests.length})
                    </CardTitle>
                    <CardDescription className="text-xs">Requests that require your attention to be applied to the employee's official record.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {pendingRequests.length === 0 ? (
                        <div className="p-8 text-center bg-white flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle className="w-8 h-8 mb-3 opacity-20" />
                            <p className="text-sm">No pending profile updates.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">{req.empName}</h3>
                                            <p className="text-xs text-slate-500">{req.empEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => approveProfileUpdate(req.id!)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-8 text-xs font-semibold shadow-sm">
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => rejectProfileUpdate(req.id!)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md h-8 text-xs font-semibold shadow-sm">
                                                Reject
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Requested Changes Display */}
                                    <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Proposed Data Modifiers</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {Object.entries(req.fields).map(([key, value]) => (
                                                <div key={key} className="space-y-1">
                                                    <p className="text-xs font-semibold text-slate-600">{getFieldLabel(key)}</p>
                                                    <p className="text-sm font-medium text-slate-900 bg-white p-2 rounded border border-slate-200 shadow-sm">{value as string || <span className="text-slate-300 italic">Cleared</span>}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Requested on {new Date(req.requestedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden mt-6">
                <CardHeader className="bg-slate-50/50 border-b p-5">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-slate-400" />
                        Archived Requests
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {pastRequests.map(req => (
                            <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{req.empName}</p>
                                    <p className="text-xs text-slate-500">Requested: {new Date(req.requestedAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    {req.status === "Approved" ? (
                                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                        {pastRequests.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400">No archived history visible.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
