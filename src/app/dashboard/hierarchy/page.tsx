"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ShieldCheck, Users, GitMerge, Save, X, ChevronRight, ChevronDown, User, Building } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, getDocs, updateDoc, doc, writeBatch, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type HierarchyData = {
    empId: string;
    level: "Executive" | "Manager" | "Team Lead" | "Staff";
    reportsTo: string | null;
};

export default function HierarchyPage() {
    const { role } = useAuth();
    const { employees } = useApp();
    const [hierarchy, setHierarchy] = useState<Record<string, HierarchyData>>({});
    const [isModifyOpen, setIsModifyOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load hierarchy from Firestore
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "hierarchy"), snap => {
            const map: Record<string, HierarchyData> = {};
            snap.docs.forEach(d => {
                const data = d.data();
                map[data.empId] = {
                    empId: data.empId,
                    level: data.level || "Staff",
                    reportsTo: data.reportsTo || null
                };
            });
            setHierarchy(map);
        });
        return () => unsub();
    }, []);

    const [editMap, setEditMap] = useState<Record<string, HierarchyData>>({});

    const openModify = () => {
        setEditMap({ ...hierarchy });
        setIsModifyOpen(true);
    };

    const handleSaveHierarchy = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);
            employees.forEach(emp => {
                const data = editMap[emp.id!] || { empId: emp.id!, level: "Staff", reportsTo: null };
                const docRef = doc(db, "hierarchy", emp.id!);
                batch.set(docRef, data, { merge: true });
            });
            await batch.commit();
            toast.success("Hierarchy Updated", { description: "The organizational structure has been synchronized." });
            setIsModifyOpen(false);
        } catch (e) {
            toast.error("Failed to save hierarchy");
        } finally {
            setSaving(false);
        }
    };

    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
        return employees
            .filter(emp => {
                const h = hierarchy[emp.id!] || { reportsTo: null };
                return h.reportsTo === parentId;
            })
            .map(emp => ({
                ...emp,
                children: buildTree(emp.id!)
            }));
    };

    // Root nodes are those who report to nobody (or whose manager doesn't exist)
    const roots = employees.filter(emp => {
        const h = hierarchy[emp.id!] || { reportsTo: null };
        return !h.reportsTo || !employees.find(e => e.id === h.reportsTo);
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Map</h1>
                    <p className="text-sm text-slate-500">Visual reporting structure and command hierarchy.</p>
                </div>
                <Button variant="corporate" className="rounded-lg shadow-sm gap-2" onClick={openModify}>
                    <GitMerge className="w-4 h-4" /> Design Structure
                </Button>
            </div>

            {/* ── Visual Tree ── */}
            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-8 min-h-[600px] relative overflow-x-auto">
                <div className="flex flex-col items-center space-y-12">
                    {roots.length === 0 && employees.length > 0 && (
                        <p className="text-slate-400 italic">No root nodes defined. Use "Design Structure" to set reporting lines.</p>
                    )}
                    {roots.length === 0 && employees.length === 0 && (
                        <div className="text-center py-20 opacity-30">
                            <Users className="w-12 h-12 mx-auto mb-4" />
                            <p className="font-bold">No workforce data available</p>
                        </div>
                    )}
                    {roots.map(root => (
                        <TreeNode
                            key={root.id}
                            employee={root}
                            allEmployees={employees}
                            hierarchy={hierarchy}
                        />
                    ))}
                </div>
            </div>

            {/* ── Modify Dialog ── */}
            <Dialog open={isModifyOpen} onOpenChange={setIsModifyOpen}>
                <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Structure Designer</DialogTitle>
                        <DialogDescription>Assign reporting managers and hierarchy levels for your team.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {employees.map(emp => (
                            <div key={emp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                        {emp.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{emp.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{emp.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-400 font-bold">Level</Label>
                                        <select
                                            className="w-full h-8 rounded-md border text-xs bg-white px-2 outline-none focus:ring-2 focus:ring-primary/20"
                                            value={editMap[emp.id!]?.level || hierarchy[emp.id!]?.level || "Staff"}
                                            onChange={e => setEditMap(prev => ({
                                                ...prev,
                                                [emp.id!]: {
                                                    ...(prev[emp.id!] || hierarchy[emp.id!] || { empId: emp.id!, reportsTo: null }),
                                                    level: e.target.value as any
                                                }
                                            }))}
                                        >
                                            <option value="Executive">Executive</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Team Lead">Team Lead</option>
                                            <option value="Staff">Staff</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-400 font-bold">Reports To</Label>
                                        <select
                                            className="w-full h-8 rounded-md border text-xs bg-white px-2 outline-none focus:ring-2 focus:ring-primary/20"
                                            value={editMap[emp.id!]?.reportsTo || hierarchy[emp.id!]?.reportsTo || ""}
                                            onChange={e => setEditMap(prev => ({
                                                ...prev,
                                                [emp.id!]: {
                                                    ...(prev[emp.id!] || hierarchy[emp.id!] || { empId: emp.id!, level: "Staff" }),
                                                    reportsTo: e.target.value || null
                                                }
                                            }))}
                                        >
                                            <option value="">None / Board</option>
                                            {employees.filter(e => e.id !== emp.id).map(mgr => (
                                                <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModifyOpen(false)}>Cancel</Button>
                        <Button variant="corporate" onClick={handleSaveHierarchy} disabled={saving}>
                            {saving ? "Deploying..." : "Sync Hierarchy"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TreeNode({ employee, allEmployees, hierarchy }: { employee: Employee; allEmployees: Employee[]; hierarchy: Record<string, HierarchyData> }) {
    const data = hierarchy[employee.id!] || { level: "Staff" };
    const children = allEmployees.filter(emp => {
        const h = hierarchy[emp.id!] || { reportsTo: null };
        return h.reportsTo === employee.id;
    });

    return (
        <div className="flex flex-col items-center relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "relative z-10 p-4 rounded-xl border-2 shadow-sm bg-white min-w-[200px] text-center",
                    data.level === "Executive" ? "border-indigo-500 shadow-indigo-100" :
                        data.level === "Manager" ? "border-blue-400" :
                            data.level === "Team Lead" ? "border-emerald-400" : "border-slate-200"
                )}
            >
                <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white",
                    data.level === "Executive" ? "bg-indigo-500" :
                        data.level === "Manager" ? "bg-blue-500" :
                            data.level === "Team Lead" ? "bg-emerald-500" : "bg-slate-400"
                )}>
                    {data.level}
                </div>

                <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mt-2 flex items-center justify-center text-slate-800 font-bold border-2 border-white shadow-inner">
                    {employee.name[0]}
                </div>

                <h4 className="mt-3 font-bold text-slate-900 leading-tight">{employee.name}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{employee.role}</p>
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight mt-1">{employee.department}</p>
            </motion.div>

            {children.length > 0 && (
                <>
                    {/* Vertical line between parent and the horizontal connector */}
                    <div className="w-px h-12 bg-slate-200" />

                    <div className="flex gap-12 relative">
                        {/* Horizontal connector line */}
                        {children.length > 1 && (
                            <div className="absolute top-0 left-[100px] right-[100px] h-px bg-slate-200" />
                        )}

                        {children.map((child, i) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Small vertical connector for each child */}
                                <div className="w-px h-6 bg-slate-200" />
                                <TreeNode
                                    employee={child}
                                    allEmployees={allEmployees}
                                    hierarchy={hierarchy}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
