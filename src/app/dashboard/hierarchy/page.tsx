"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { ShieldCheck, Users, ChevronDown, ChevronRight, GitMerge, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDocs, writeBatch, doc } from "firebase/firestore";

type HierarchyLevel = "Executive" | "Manager" | "Team Lead" | "Staff";

export default function HierarchyPage() {
    const { role } = useAuth();
    const { employees } = useApp();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        Executive: true,
        Manager: true,
        "Team Lead": true,
        Staff: true
    });
    const [isModifyOpen, setIsModifyOpen] = useState(false);
    const [hierarchy, setHierarchy] = useState<Record<string, HierarchyLevel>>({});
    const [saving, setSaving] = useState(false);
    const [editMap, setEditMap] = useState<Record<string, HierarchyLevel>>({});

    // Load hierarchy levels from Firestore
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "hierarchy"), snap => {
            const map: Record<string, HierarchyLevel> = {};
            snap.docs.forEach(d => {
                const data = d.data();
                if (data.level) map[data.empId] = data.level;
            });
            setHierarchy(map);
        });
        return () => unsub();
    }, []);

    const levels: HierarchyLevel[] = ["Executive", "Manager", "Team Lead", "Staff"];
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

    const openModify = () => {
        setEditMap({ ...hierarchy });
        setIsModifyOpen(true);
    };

    const handleSaveHierarchy = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);
            employees.forEach(emp => {
                const lvl = editMap[emp.id!] || hierarchy[emp.id!] || "Staff";
                batch.set(doc(db, "hierarchy", emp.id!), { empId: emp.id!, level: lvl }, { merge: true });
            });
            await batch.commit();
            toast.success("Hierarchy Saved", { description: "Reporting levels have been updated across the organization." });
            setIsModifyOpen(false);
        } catch {
            toast.error("Save Failed", { description: "Could not update hierarchy." });
        } finally {
            setSaving(false);
        }
    };

    const toggleNode = (level: string) => setExpanded(prev => ({ ...prev, [level]: !prev[level] }));

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
                    <GitMerge className="w-4 h-4" /> Modify Levels
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

            {/* ── Hierarchy List ── */}
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
                                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
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

            {/* ── Modify Levels Dialog ── */}
            <Dialog open={isModifyOpen} onOpenChange={setIsModifyOpen}>
                <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4 mb-4">
                        <DialogTitle>Modify Reporting Levels</DialogTitle>
                        <DialogDescription>Assign each employee a hierarchy level.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {employees.map(emp => (
                            <div key={emp.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {emp.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                                    <p className="text-xs text-slate-400 truncate">{emp.department}</p>
                                </div>
                                <select
                                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 flex-shrink-0"
                                    value={editMap[emp.id!] || hierarchy[emp.id!] || "Staff"}
                                    onChange={e => setEditMap(prev => ({ ...prev, [emp.id!]: e.target.value as HierarchyLevel }))}
                                >
                                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-6 pt-4 border-t gap-2">
                        <Button variant="ghost" onClick={() => setIsModifyOpen(false)}>Cancel</Button>
                        <Button variant="corporate" onClick={handleSaveHierarchy} disabled={saving}>
                            {saving ? "Saving..." : "Save Hierarchy"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
