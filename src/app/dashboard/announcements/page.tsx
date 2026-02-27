"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus, Bell, Clock, Calendar, X, Trash2, Info, AlertTriangle, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AnnouncementsPage() {
    const { role, user } = useAuth();
    const { announcements, addAnnouncement, deleteAnnouncement } = useApp();
    const [showForm, setShowForm] = useState(false);

    const [newAnn, setNewAnn] = useState<{
        title: string;
        message: string;
        type: "News" | "Update" | "Event" | "Urgent";
        startTime: string;
        endTime: string
    }>({
        title: "",
        message: "",
        type: "News",
        startTime: "",
        endTime: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnn.title || !newAnn.message) {
            toast.error("Please fill in all fields");
            return;
        }
        try {
            await addAnnouncement({
                title: newAnn.title,
                message: newAnn.message,
                type: newAnn.type,
                authorName: user?.email?.split('@')[0] || "Admin",
                startTime: newAnn.startTime || undefined,
                endTime: newAnn.endTime || undefined
            });
            setShowForm(false);
            setNewAnn({ title: "", message: "", type: "News", startTime: "", endTime: "" });
        } catch (error) {
            toast.error("Failed to post announcement");
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case "Urgent": return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", icon: AlertTriangle };
            case "Event": return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", icon: PartyPopper };
            case "Update": return { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", icon: Info };
            default: return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", icon: Megaphone };
        }
    };

    const getAnnouncementStatus = (ann: any) => {
        const now = Date.now();
        const start = ann.startTime ? new Date(ann.startTime).getTime() : 0;
        const end = ann.endTime ? new Date(ann.endTime).getTime() : Infinity;

        if (now < start) return { label: "Pending", color: "bg-amber-100 text-amber-600 border-amber-200" };
        if (now > end) return { label: "Completed", color: "bg-slate-100 text-slate-500 border-slate-200" };
        return { label: "Live", color: "bg-emerald-100 text-emerald-600 border-emerald-200" };
    };

    const [activeTab, setActiveTab] = useState<"All" | "Live" | "Pending" | "Completed">("All");

    const filteredAnnouncements = announcements.filter(ann => {
        if (activeTab === "All") return true;
        const status = getAnnouncementStatus(ann).label;
        return status === activeTab;
    });

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        News & Announcements Hub
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Official organization updates, scheduled notices, and event alerts.</p>
                </div>
                {role === "employer" && (
                    <Button
                        className="rounded-xl shadow-lg shadow-indigo-100 h-12 px-6 font-bold"
                        variant={showForm ? "outline" : "corporate"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {showForm ? "Dismiss Form" : "Dispatch New Update"}
                    </Button>
                )}
            </div>

            {/* ── Tabs Selector ── */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(["All", "Live", "Pending", "Completed"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all",
                            activeTab === tab
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {tab}
                        {tab === "All" && announcements.length > 0 && <span className="ml-2 opacity-50">{announcements.length}</span>}
                    </button>
                ))}
            </div>

            {/* ── Post Announcement Form (Employer Only) ── */}
            <AnimatePresence>
                {showForm && role === "employer" && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="border-indigo-100 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-white to-indigo-50/30">
                            <CardHeader className="border-b border-indigo-50 pb-6">
                                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-indigo-600" /> Draft New Announcement
                                </CardTitle>
                                <CardDescription>Schedule news to appear now or at a specific future checkout time.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Announcement Title</Label>
                                            <Input
                                                placeholder="e.g., Q3 Town Hall Meeting"
                                                value={newAnn.title}
                                                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                                                className="h-11 rounded-xl border-slate-200 focus:ring-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Tag</Label>
                                            <div className="flex gap-2">
                                                {(["News", "Update", "Event", "Urgent"] as const).map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setNewAnn({ ...newAnn, type: t })}
                                                        className={cn(
                                                            "flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                            newAnn.type === t
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                                : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                                                        )}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" /> Start Time (Display From)
                                            </Label>
                                            <Input
                                                type="datetime-local"
                                                value={newAnn.startTime}
                                                onChange={(e) => setNewAnn({ ...newAnn, startTime: e.target.value })}
                                                className="h-11 rounded-xl bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                                <AlertTriangle className="w-3.5 h-3.5" /> End Time (Auto-Hide After)
                                            </Label>
                                            <Input
                                                type="datetime-local"
                                                value={newAnn.endTime}
                                                onChange={(e) => setNewAnn({ ...newAnn, endTime: e.target.value })}
                                                className="h-11 rounded-xl bg-white"
                                            />
                                        </div>
                                        <p className="md:col-span-2 text-[10px] text-slate-400 font-medium italic">
                                            * If left blank, the announcement will be visible immediately and permanently.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Message</Label>
                                        <Textarea
                                            placeholder="Compose your organization-wide update here..."
                                            value={newAnn.message}
                                            onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
                                            className="min-h-[120px] rounded-xl resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">Discard</Button>
                                        <Button type="submit" variant="corporate" className="rounded-xl h-11 px-8">Dispatch Announcement</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Feed Section ── */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {activeTab} UPDATES
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                {filteredAnnouncements.length === 0 ? (
                    <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                        <Megaphone className="w-16 h-16 text-slate-200 mx-auto mb-4 opacity-50" />
                        <h3 className="text-slate-500 font-bold text-lg">No {activeTab !== "All" ? activeTab : ""} News Found</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-[280px] mx-auto">Try switching tabs or dispatch a new update to populate the feed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredAnnouncements.map((ann, idx) => {
                            const styles = getTypeStyles(ann.type);
                            const status = getAnnouncementStatus(ann);
                            return (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group border-l-[6px] border-l-indigo-600">
                                        <div className="flex flex-col md:flex-row">
                                            <div className="p-6 flex-1">
                                                <div className="flex items-center flex-wrap gap-3 mb-4">
                                                    <Badge className={cn("rounded-lg font-black text-[9px] uppercase tracking-wider h-6 px-2.5", styles.bg, styles.text, styles.border)}>
                                                        <styles.icon className="w-3 h-3 mr-1.5" /> {ann.type}
                                                    </Badge>
                                                    <Badge className={cn("rounded-lg font-black text-[9px] uppercase tracking-wider h-6 px-2.5 border outline-none", status.color)}>
                                                        {status.label}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" /> {new Date(ann.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 leading-snug">
                                                    {ann.title}
                                                </h3>
                                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {ann.message}
                                                </p>
                                                {(ann.startTime || ann.endTime) && (
                                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4">
                                                        {ann.startTime && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                                <Clock className="w-3 h-3 text-indigo-400" />
                                                                <span className="font-bold">Starts:</span> {new Date(ann.startTime).toLocaleString()}
                                                            </div>
                                                        )}
                                                        {ann.endTime && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                                                <span className="font-bold">Expires:</span> {new Date(ann.endTime).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {role === "employer" && (
                                                <div className="bg-slate-50 px-4 py-6 md:w-24 flex flex-row md:flex-col items-center justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100">
                                                    <button
                                                        onClick={() => deleteAnnouncement(ann.id!)}
                                                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Delete Announcement"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
