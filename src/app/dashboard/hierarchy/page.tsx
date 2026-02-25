"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Users, ChevronDown, ChevronRight, GitMerge, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, getDocs, query, where, updateDoc, doc, writeBatch } from "firebase/firestore";
import { useEffect } from "react";

type HierarchyEntry = { empId: string; level: "Executive" | "Manager" | "Team Lead" | "Staff" };

export default function HierarchyPage() {
    const { role } = useAuth();
    const { employees } = useApp();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [isModifyOpen, setIsModifyOpen] = useState(false);
    const [hierarchy, setHierarchy] = useState<Record<string, "Executive" | "Manager" | "Team Lead" | "Staff">>({});
    const [saving, setSaving] = useState(false);

    // Load hierarchy levels from Firestore
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "hierarchy"), snap => {
            const map: Record<string, "Executive" | "Manager" | "Team Lead" | "Staff"> = {};
            snap.docs.forEach(d => { map[d.data().empId] = d.data().level; });
            setHierarchy(map);
        });
        return () => unsub();
    }, []);

    const levels: ("Executive" | "Manager" | "Team Lead" | "Staff")[] = ["Executive", "Manager", "Team Lead", "Staff"];
    const levelColors: Record<string, string> = {
        Executive: "border-purple-200 bg-purple-50 text-purple-700",
        Manager: "border-blue-200 bg-blue-50 text-blue-700",
        "Team Lead": "border-emerald-200 bg-emerald-50 text-emerald-700",
        Staff: "border-slate-200 bg-slate-50 text-slate-600",
    };
    const levelDot: Record<string, string> = {
        Executive: "bg-purple-500",
        Manager: "bg-blue-500",
        "Team Lead": "bg-emerald-500",
        Staff: "bg-slate-400",
    };

    const [editMap, setEditMap] = useState<Record<string, "Executive" | "Manager" | "Team Lead" | "Staff">>({});

    const openModify = () => {
        setEditMap({ ...hierarchy });
        setIsModifyOpen(true);
    };

    const handleSaveHierarchy = async () => {
        setSaving(true);
        try {
            // For each employee, upsert their level in the hierarchy collection
            const existingSnap = await getDocs(collection(db, "hierarchy"));
            const existingMap: Record<string, string> = {};
            existingSnap.docs.forEach(d => { existingMap[d.data().empId] = d.id; });

            const batch = writeBatch(db);
            for (const [empId, level] of Object.entries(editMap)) {
                if (existingMap[empId]) {
                    batch.update(doc(db, "hierarchy", existingMap[empId]), { level });
                } else {
                    batch.set(doc(db, "hierarchy", `${empId}_lvl`), { empId, level });
                }
            }
            await batch.commit();
            toast.success("Hierarchy Saved", { description: "Reporting levels have been updated across the organization." });
            setIsModifyOpen(false);
        } catch {
            toast.error("Save Failed", { description: "Could not update hierarchy. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const toggleNode = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    // Group employees by their assigned level
    const grouped: Record<string, typeof employees> = { Executive: [], Manager: [], "Team Lead": [], Staff: [] };
    employees.forEach(emp => {
        const lvl = hierarchy[emp.id!] || "Staff";
        grouped[lvl].push(emp);
    });

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Hierarchy structures are managed by administration.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Organization Hierarchy</h1>
                    <p className="text-sm text-slate-500">Manage reporting levels and company structure.</p>
                </div>
                <Button variant="corporate" className="rounded-lg shadow-sm gap-2" onClick={openModify}>
                    <GitMerge className="w-4 h-4" /> Modify Routes
                </Button>
            </div>

            {/* ── Level Legend ── */}
            <div className="flex flex-wrap gap-3">
                {levels.map(l => (
                    <div key={l} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${levelDot[l]}`} />
                        {l}
                        <span className="ml-1 text-slate-400">({grouped[l].length})</span>
                    </div>
                ))}
            </div>

            {/* ── Hierarchy Tree ── */}
            <div className="space-y-4">
                {levels.map(level => {
                    const emps = grouped[level];
                    if (emps.length === 0) return null;
                    const isOpen = expanded[level] ?? true;
                    return (
                        <div key={level} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                            <button
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                onClick={() => toggleNode(level)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${levelDot[level]}`} />
                                    <span className="font-bold text-slate-900">{level}</span>
                                    <Badge variant="outline" className={`text-[10px] font-bold uppercase px-2 ${levelColors[level]}`}>
                                        {emps.length} {emps.length === 1 ? "person" : "people"}
                                    </Badge>
                                </div>
                                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            </button>
                            {isOpen && (
                                <div className="border-t border-slate-100 divide-y divide-slate-50">
                                    {emps.map(emp => (
                                        <div key={emp.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{emp.department} · {emp.email}</p>
                                            </div>
                                            <Badge variant="outline" className={`text-[10px] font-bold uppercase px-2 hidden sm:flex ${levelColors[level]}`}>
                                                {emp.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {employees.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No employees added yet.</p>
                    </div>
                )}
            </div>

            {/* ── Modify Routes Dialog ── */}
            <Dialog open={isModifyOpen} onOpenChange={v => { setIsModifyOpen(v); }}>
                <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4 mb-4">
                        <DialogTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5" /> Modify Reporting Routes</DialogTitle>
                        <DialogDescription>Assign each employee a hierarchy level to define their reporting structure.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {employees.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No employees to assign levels to.</p>}
                        {employees.map(emp => (
                            <div key={emp.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {emp.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{emp.department}</p>
                                </div>
                                <select
                                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 flex-shrink-0"
                                    value={editMap[emp.id!] || hierarchy[emp.id!] || "Staff"}
                                    onChange={e => setEditMap(prev => ({ ...prev, [emp.id!]: e.target.value as any }))}
                                >
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-6 pt-4 border-t gap-2">
                        <Button variant="ghost" onClick={() => setIsModifyOpen(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                        <Button variant="corporate" onClick={handleSaveHierarchy} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Hierarchy"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
