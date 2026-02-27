"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import {
    ShieldCheck, Search, FileText, Download, Clock, CheckCircle, XCircle,
    Plus, Eye, ImageIcon, X, Send, Users, AlertTriangle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDocumentsPage() {
    const { role, user } = useAuth();
    const {
        documents, docTemplates, employees, tasks,
        requestDocument, requestMultipleDocuments,
        updateDocumentStatus, sendDocumentReminder
    } = useApp();
    const [search, setSearch] = useState("");
    const [selectedDocType, setSelectedDocType] = useState("all");

    // Request form state
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedDocTitles, setSelectedDocTitles] = useState<string[]>([]);
    const [customDocTitle, setCustomDocTitle] = useState("");
    const [requesting, setRequesting] = useState(false);

    // Preview
    const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; empEmail: string } | null>(null);

    const getEmployeeName = (email: string) => {
        return employees.find(e => e.email === email)?.name || email;
    };

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">This terminal is restricted to central administration.</p>
            </div>
        );
    }

    const toggleDocTitle = (title: string) => {
        setSelectedDocTitles(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );
    };

    const handleRequestDocuments = async () => {
        if (!selectedEmployee) { toast.error("Select an employee"); return; }
        const titles = [...selectedDocTitles];
        if (customDocTitle.trim()) titles.push(customDocTitle.trim());
        if (titles.length === 0) { toast.error("Select at least one document type"); return; }

        setRequesting(true);
        try {
            await requestMultipleDocuments(selectedEmployee, titles);
            toast.success("Documents Requested!", {
                description: `${titles.length} document(s) requested from ${getEmployeeName(selectedEmployee)}.`
            });
            setSelectedDocTitles([]);
            setCustomDocTitle("");
            setShowRequestForm(false);
        } catch {
            toast.error("Failed to send requests");
        } finally {
            setRequesting(false);
        }
    };

    const handleApprove = async (docId: string) => {
        await updateDocumentStatus(docId, "Approved");
        toast.success("Document Verified", { description: "Status set to Approved." });
    };

    const handleReject = async (docId: string) => {
        await updateDocumentStatus(docId, "Rejected");
        toast.error("Document Rejected", { description: "Employee will be notified to re-upload." });
    };

    const filteredDocs = documents.filter(doc => {
        const empName = (getEmployeeName(doc.empEmail) || "").toLowerCase();
        const matchesSearch = (doc.empEmail || "").toLowerCase().includes(search.toLowerCase()) ||
            empName.includes(search.toLowerCase()) ||
            (doc.title || "").toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedDocType === "all" || doc.title === selectedDocType;
        return matchesSearch && matchesType;
    });

    const isBase64Image = (url?: string) => url?.startsWith("data:image/");
    const isBase64PDF = (url?: string) => url?.startsWith("data:application/pdf");

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Employee Documents</h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Request, manage, and verify compliance documents from your workforce.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowRequestForm(!showRequestForm)}
                        className={cn(
                            "rounded-xl font-bold h-10 px-5 shadow-lg transition-all",
                            showRequestForm ? "bg-slate-200 text-slate-700 shadow-none" : "bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700"
                        )}
                    >
                        {showRequestForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {showRequestForm ? "Close" : "Request Documents"}
                    </Button>
                </div>
            </div>

            {/* Request Form */}
            <AnimatePresence>
                {showRequestForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-indigo-200 shadow-lg rounded-2xl overflow-hidden border-t-4 border-t-indigo-500">
                            <CardHeader className="bg-indigo-50/30 border-b p-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Send className="w-5 h-5 text-indigo-600" /> Request Documents from Employee
                                </CardTitle>
                                <CardDescription>Select an employee and choose which documents you need them to upload.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Employee Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Employee</Label>
                                    <select
                                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                                        value={selectedEmployee}
                                        onChange={e => setSelectedEmployee(e.target.value)}
                                    >
                                        <option value="">Choose an employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.email}>
                                                {emp.name} ({emp.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Document Type Checkboxes */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Documents to Request</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {docTemplates.map(tpl => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => toggleDocTitle(tpl.title)}
                                                className={cn(
                                                    "flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all text-left",
                                                    selectedDocTitles.includes(tpl.title)
                                                        ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200"
                                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all",
                                                    selectedDocTitles.includes(tpl.title) ? "bg-indigo-500" : "bg-slate-200"
                                                )}>
                                                    {selectedDocTitles.includes(tpl.title) ? "✓" : ""}
                                                </div>
                                                <span className="truncate">{tpl.title}</span>
                                                {tpl.required && <span className="text-[9px] text-rose-400 font-black">REQ</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Document Name */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Or Add Custom Document</Label>
                                    <Input
                                        placeholder="e.g. Offer Letter, Medical Certificate..."
                                        value={customDocTitle}
                                        onChange={e => setCustomDocTitle(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" onClick={() => setShowRequestForm(false)}>Cancel</Button>
                                    <Button
                                        onClick={handleRequestDocuments}
                                        disabled={requesting || !selectedEmployee}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-indigo-500/20"
                                    >
                                        {requesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                        Send Request ({selectedDocTitles.length + (customDocTitle.trim() ? 1 : 0)})
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Document Progress Summary --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => {
                    const empDocs = documents.filter(d => d.empEmail === emp.email);
                    if (empDocs.length === 0) return null;

                    const uploaded = empDocs.filter(d => d.status === "Uploaded" || d.status === "Approved").length;
                    const total = empDocs.length;
                    const progress = Math.round((uploaded / total) * 100);

                    return (
                        <Card key={emp.id} className="border-slate-200 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                            {(emp.name?.[0] || "?").toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm leading-tight">{emp.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{emp.position}</p>
                                        </div>
                                    </div>
                                    <Badge variant={progress === 100 ? "success" : "warning"} className="text-[10px] font-bold">
                                        {progress}%
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Onboarding Progress</span>
                                        <span>{uploaded} / {total} Files</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-500", progress === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={cn(
                                            "flex-1 text-[10px] font-bold h-8 rounded-lg transition-colors duration-200",
                                            progress === 100
                                                ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                                                : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                        )}
                                        disabled={progress === 100}
                                        onClick={() => {
                                            sendDocumentReminder(emp.email, "Pending Onboarding Documents");
                                            toast.info("Reminder Sent", { description: `Reminded ${emp.name} about their pending documents.` });
                                        }}
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                        {progress === 100 ? "Onboarding Complete" : "Send Reminder"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search / Filter Bar */}
            <div className="flex items-center gap-3 w-full bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search by employee name, email, or document title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-slate-50/50 border-transparent h-10 text-sm rounded-xl focus:bg-white"
                    />
                </div>
                <select
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                >
                    <option value="all">All Types</option>
                    {docTemplates.map(t => (
                        <option key={t.id} value={t.title}>{t.title}</option>
                    ))}
                </select>
            </div>

            {/* Documents Table */}
            <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden bg-white border-t-4 border-t-indigo-500">
                <CardHeader className="bg-slate-50/30 border-b p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                Document Repository
                            </CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500 mt-1">
                                {filteredDocs.length} records matching current filters.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredDocs.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                                <Search className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">No documents found.</p>
                            <p className="text-xs mt-1 font-medium">Use the "Request Documents" button above to request files from employees.</p>
                        </div>
                    ) : (
                        <div>
                            <table className="w-full text-left text-sm table-fixed">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.1em] font-black">
                                    <tr>
                                        <th className="px-3 py-3 w-[25%]">Personnel</th>
                                        <th className="px-3 py-3 w-[25%]">Document Title</th>
                                        <th className="px-3 py-3 w-[15%]">Status</th>
                                        <th className="px-3 py-3 w-[15%] text-center">Date</th>
                                        <th className="px-3 py-3 w-[20%] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredDocs.map(doc => (
                                        <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-3 py-4 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400 border border-slate-200 flex-shrink-0">
                                                        {(getEmployeeName(doc.empEmail)?.[0] || "?").toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-slate-900 leading-none truncate text-xs">{getEmployeeName(doc.empEmail)}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tight truncate">{doc.empEmail}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 font-bold text-slate-700">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm flex-shrink-0">
                                                        <FileText className="w-3 h-3" />
                                                    </div>
                                                    <span className="truncate text-xs">{doc.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={doc.status === "Approved" ? "success" : doc.status === "Rejected" ? "destructive" : doc.status === "Uploaded" ? "warning" : "secondary"}
                                                    className={cn(
                                                        "border-none px-2 py-0.5 font-bold text-[9px] whitespace-nowrap",
                                                        doc.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" :
                                                            doc.status === "Rejected" ? "bg-rose-500/10 text-rose-600" :
                                                                doc.status === "Uploaded" ? "bg-blue-500/10 text-blue-600" :
                                                                    "bg-amber-500/10 text-amber-600"
                                                    )}
                                                >
                                                    {doc.status === "Approved" ? "VERIFIED" : doc.status === "Rejected" ? "REJECTED" : doc.status === "Uploaded" ? "PENDING" : "AWAITING"}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap text-center">
                                                {doc.requestedAt ? new Date(doc.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "---"}
                                            </td>
                                            <td className="px-3 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1">
                                                    {doc.url && (
                                                        <Button
                                                            onClick={() => setPreviewDoc({ url: doc.url!, title: doc.title, empEmail: doc.empEmail })}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[9px] font-bold rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-2"
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" /> View
                                                        </Button>
                                                    )}
                                                    {doc.status === "Uploaded" && (
                                                        <>
                                                            <Button
                                                                onClick={() => handleApprove(doc.id!)}
                                                                size="sm"
                                                                className="h-7 text-[9px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 px-2"
                                                            >
                                                                <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleReject(doc.id!)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-[9px] font-bold rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 px-2"
                                                            >
                                                                <XCircle className="w-3 h-3 mr-1" /> Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {doc.status === "Pending" && (
                                                        <Button
                                                            onClick={() => {
                                                                sendDocumentReminder(doc.empEmail, doc.title);
                                                                toast.info("Reminder Sent", { description: `Reminded ${getEmployeeName(doc.empEmail)} about ${doc.title}` });
                                                            }}
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[9px] font-bold rounded-lg border-amber-200 text-amber-600 hover:bg-amber-50 px-2"
                                                        >
                                                            <AlertTriangle className="w-3 h-3 mr-1" /> Remind
                                                        </Button>
                                                    )}
                                                    {doc.status === "Approved" && doc.url && (
                                                        <a
                                                            href={doc.url}
                                                            download={`${doc.title}_${getEmployeeName(doc.empEmail)}`}
                                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all"
                                                        >
                                                            <Download className="w-2.5 h-2.5" /> Save
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

            {/* Document Preview Dialog */}
            <Dialog open={!!previewDoc} onOpenChange={v => { if (!v) setPreviewDoc(null); }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                            {previewDoc?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Uploaded by {previewDoc ? getEmployeeName(previewDoc.empEmail) : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        {previewDoc?.url && isBase64Image(previewDoc.url) ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={previewDoc.url}
                                    alt={previewDoc.title}
                                    className="w-full h-auto max-h-[500px] object-contain"
                                />
                            </div>
                        ) : previewDoc?.url && isBase64PDF(previewDoc.url) ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                <iframe
                                    src={previewDoc.url}
                                    className="w-full h-[500px]"
                                    title={previewDoc.title}
                                />
                            </div>
                        ) : previewDoc?.url ? (
                            <div className="text-center py-10 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p className="text-sm font-bold">Preview not available for this file type.</p>
                                <a
                                    href={previewDoc.url.startsWith("http") ? previewDoc.url : `https://${previewDoc.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 text-xs font-bold mt-2 inline-block hover:underline"
                                >
                                    Open in new tab →
                                </a>
                            </div>
                        ) : null}
                    </div>
                    <DialogFooter className="p-6 pt-4 border-t bg-slate-50/50 flex justify-between gap-3">
                        {previewDoc?.url && (
                            <a
                                href={previewDoc.url}
                                download={`${previewDoc.title}_${getEmployeeName(previewDoc.empEmail)}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"
                            >
                                <Download className="w-3.5 h-3.5" /> Download / Save
                            </a>
                        )}
                        <Button variant="ghost" onClick={() => setPreviewDoc(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
