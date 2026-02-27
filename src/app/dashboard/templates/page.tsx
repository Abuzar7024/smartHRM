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
import { ShieldCheck, Plus, Trash2, Send, FileCog, FileText, Loader2, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingTemplatesPage() {
    const { role } = useAuth();
    const { employees, docTemplates, addDocTemplate, deleteDocTemplate, requestMultipleDocuments } = useApp();

    // Template state
    const [docTitle, setDocTitle] = useState("");
    const [docRequired, setDocRequired] = useState(true);

    // Request form state
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedDocTitles, setSelectedDocTitles] = useState<string[]>([]);
    const [customDocTitle, setCustomDocTitle] = useState("");
    const [requesting, setRequesting] = useState(false);

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">This module is restricted to administrators.</p>
            </div>
        );
    }

    const handleAddTemplate = async () => {
        if (!docTitle.trim()) {
            toast.error("Template name is required");
            return;
        }
        await addDocTemplate(docTitle.trim(), docRequired);
        setDocTitle("");
        setDocRequired(true);
        toast.success("Document template saved successfully", {
            description: `Template: ${docTitle}`
        });
    };

    const toggleDocTitle = (title: string) => {
        setSelectedDocTitles(prev =>
            prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
        );
    };

    const handleRequestDocuments = async () => {
        if (!selectedEmployee) { toast.error("Please select an employee first"); return; }
        const titles = [...selectedDocTitles];
        if (customDocTitle.trim()) titles.push(customDocTitle.trim());
        if (titles.length === 0) { toast.error("Please select at least one document to request"); return; }

        setRequesting(true);
        try {
            await requestMultipleDocuments(selectedEmployee, titles);
            toast.success("Requests Deployed", {
                description: `Successfully requested ${titles.length} documents.`
            });
            setSelectedDocTitles([]);
            setCustomDocTitle("");
            setShowRequestForm(false);
        } catch {
            toast.error("Failed to transmit requests");
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header & Main Call to Action */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <FileCog className="w-8 h-8 text-indigo-600" /> Onboarding Checklist
                    </h1>
                    <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">
                        Build your hiring checklist and instantly request documents from new employees.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setShowRequestForm(!showRequestForm);
                            if (!showRequestForm) setSelectedDocTitles(docTemplates.filter(d => d.required).map(d => d.title)); // Preselect mandatory
                        }}
                        className={cn(
                            "rounded-xl font-bold h-11 px-6 shadow-xl transition-all",
                            showRequestForm ? "bg-slate-200 text-slate-700 shadow-none border border-slate-300" : "bg-indigo-600 text-white shadow-indigo-500/30 hover:bg-indigo-700"
                        )}
                    >
                        {showRequestForm ? <Plus className="w-5 h-5 mr-2 rotate-45 transition-transform" /> : <Send className="w-5 h-5 mr-2" />}
                        {showRequestForm ? "Cancel Request" : "Request from Personnel"}
                    </Button>
                </div>
            </div>

            {/* Top Collapsible Request Form */}
            <AnimatePresence>
                {showRequestForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-indigo-200 shadow-2xl rounded-3xl overflow-hidden bg-white mt-2 ring-4 ring-indigo-50">
                            <CardHeader className="bg-indigo-50/50 border-b p-6 pb-5">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900">
                                    <Send className="w-5 h-5 text-indigo-600" /> Dispatch Required Documents
                                </CardTitle>
                                <CardDescription className="text-indigo-800/60 font-medium">Quickly request specific files required for HR compliance from an employee.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-8">

                                {/* Target Personnel */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" /> Target Employee
                                    </Label>
                                    <select
                                        className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all outline-none"
                                        value={selectedEmployee}
                                        onChange={e => setSelectedEmployee(e.target.value)}
                                    >
                                        <option value="" disabled>-- Select an employee to notify --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.email}>
                                                {emp.name} — {emp.role.toUpperCase()} ({emp.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Experience Level Auto-Select */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                        ⚡ Auto-Select by Experience Level Profile
                                    </Label>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full text-xs font-bold"
                                            onClick={() => {
                                                const juniorDocs = docTemplates.filter(d => ["Passport", "National ID / Aadhaar", "Address Proof", "Educational Certificates"].includes(d.title) || d.required).map(d => d.title);
                                                setSelectedDocTitles(juniorDocs);
                                            }}
                                        >
                                            Junior Level
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full text-xs font-bold"
                                            onClick={() => {
                                                const midDocs = docTemplates.filter(d => ["Passport", "National ID / Aadhaar", "Address Proof", "Experience Letters", "Bank Details"].includes(d.title) || d.required).map(d => d.title);
                                                setSelectedDocTitles(midDocs);
                                            }}
                                        >
                                            Mid Level
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full text-xs font-bold"
                                            onClick={() => {
                                                setSelectedDocTitles(docTemplates.map(d => d.title)); // Seniors get everything including Visa, Experience, etc.
                                            }}
                                        >
                                            Senior Level
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full text-xs font-bold text-slate-400"
                                            onClick={() => setSelectedDocTitles([])}
                                        >
                                            Clear Selection
                                        </Button>
                                    </div>
                                </div>

                                {/* Pre-defined Templates Multi-Select */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" /> Select Documents to Request
                                    </Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        {docTemplates.length === 0 && (
                                            <p className="text-xs text-slate-400 italic col-span-full py-2">
                                                No standard templates created yet. Please create some below first.
                                            </p>
                                        )}
                                        {docTemplates.map(tpl => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => toggleDocTitle(tpl.title)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold transition-all text-left group",
                                                    selectedDocTitles.includes(tpl.title)
                                                        ? "border-indigo-500 bg-white text-indigo-900 shadow-md shadow-indigo-100 ring-1 ring-indigo-500"
                                                        : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-slate-800"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold shrink-0 transition-all",
                                                    selectedDocTitles.includes(tpl.title) ? "bg-indigo-600" : "bg-slate-200 group-hover:bg-slate-300"
                                                )}>
                                                    ✓
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate leading-tight">{tpl.title}</span>
                                                    {tpl.required && <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-0.5">Mandatory</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom One-off Document */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em]">
                                        Custom Document Query (Optional)
                                    </Label>
                                    <Input
                                        placeholder="e.g. Relocation Expense Receipt"
                                        value={customDocTitle}
                                        onChange={e => setCustomDocTitle(e.target.value)}
                                        className="h-12 rounded-xl border-slate-300 shadow-sm focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
                                    />
                                    <p className="text-xs text-slate-400 font-medium">Use this to request a specific document outside your standard templates.</p>
                                </div>

                                {/* Final Submit */}
                                <div className="pt-6 border-t border-slate-100 flex justify-end">
                                    <Button
                                        onClick={handleRequestDocuments}
                                        disabled={requesting || !selectedEmployee}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all"
                                    >
                                        {requesting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-3" />}
                                        Dispatch Official Request ({selectedDocTitles.length + (customDocTitle.trim() ? 1 : 0)})
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Lower Section: Manage Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">

                {/* Visual Readout Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Your Checklist Items</CardTitle>
                                <CardDescription className="text-xs font-medium mt-1">
                                    Currently enforcing {docTemplates.filter(d => d.required).length} mandatory & {docTemplates.filter(d => !d.required).length} optional items.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {docTemplates.length === 0 ? (
                                <div className="p-16 text-center text-slate-500">
                                    <FileCog className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-sm font-bold">No documents added to checklist.</p>
                                    <p className="text-xs mt-1">Add items to the right to build your list.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {docTemplates.map(tpl => (
                                        <div key={tpl.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                                    tpl.required ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                                                )}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-none mb-1 text-sm md:text-base">{tpl.title}</p>
                                                    <Badge variant={tpl.required ? "destructive" : "secondary"} className="text-[9px] px-2 py-0 font-black uppercase tracking-widest leading-4 h-4 mt-1">
                                                        {tpl.required ? "Mandatory" : "Optional"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteDocTemplate(tpl.id!)}
                                                className="h-9 px-3 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-0 md:mr-2" />
                                                <span className="hidden md:inline font-bold text-xs uppercase tracking-widest">Delete</span>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Engine Configurator */}
                <div className="lg:col-span-1">
                    <Card className="border-indigo-100 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white sticky top-28">
                        <CardHeader className="p-6 border-b border-indigo-100/50">
                            <CardTitle className="text-base font-bold text-indigo-900">Add to Checklist</CardTitle>
                            <CardDescription className="text-xs text-indigo-700/70 font-medium">Add a new document type that you can select later.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Document Name</Label>
                                <Input
                                    placeholder="e.g. W2 Tax Declaration"
                                    value={docTitle}
                                    onChange={e => setDocTitle(e.target.value)}
                                    className="h-11 rounded-xl text-sm font-semibold border-slate-300 focus:ring-2 focus:ring-indigo-600"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTemplate()
                                    }}
                                />
                            </div>

                            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer hover:border-indigo-300 transition-colors group">
                                <div className="mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={docRequired}
                                        onChange={() => setDocRequired(!docRequired)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">Is this Mandatory?</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight">If checked, it will be marked universally as required by default.</p>
                                </div>
                            </label>

                            <Button
                                onClick={handleAddTemplate}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
                            >
                                Add Document
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
