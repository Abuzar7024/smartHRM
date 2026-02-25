"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp, Employee } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, User, Users, ChevronDown, ChevronRight, GitMerge } from "lucide-react";
import { toast } from "sonner";

type OrgNode = {
    id: string; // Employee ID
    managerId: string | null;
};

// Simplified recursive rendering for a basic hierarchy
export default function HierarchyPage() {
    const { role } = useAuth();
    const { employees } = useApp();

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    if (role !== "employer") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">Hierarchy structures are managed by administration.</p>
            </div>
        );
    }

    const toggleNode = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Since we don't have a managerId strictly defined on the employee in this simple MVP, 
    // let's assume a basic grouping by department for demonstration or just default everyone under an "Admin" node.

    // In a real application, employees would have `managerId` property. For now, let's group by Role manually.
    const admins = employees.filter(e => e.role === "Admin" || e.role === "Employer");
    const managers = employees.filter(e => e.role === "Manager" || e.role === "Team Lead");
    const members = employees.filter(e => e.role !== "Admin" && e.role !== "Employer" && e.role !== "Manager" && e.role !== "Team Lead");

    const renderLevel = (title: string, emps: Employee[], icon: any, color: string, defaultOpen: boolean = true) => {
        const isOpen = expanded[title] ?? defaultOpen;

        return (
            <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div
                    className="flex justify-between items-center bg-slate-50 p-3 cursor-pointer select-none"
                    onClick={() => toggleNode(title)}
                >
                    <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <div className={`p-1.5 rounded-md ${color} bg-white border`}>
                            {icon}
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight text-sm uppercase">{title}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">{emps.length}</Badge>
                </div>
                {isOpen && (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/30">
                        {emps.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No operatives in this hierarchy tier.</p>
                        ) : (
                            emps.map(emp => (
                                <div key={emp.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-md bg-white hover:border-slate-300 transition-colors">
                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm leading-tight">{emp.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{emp.department} • {emp.role}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Organization Hierarchy</h1>
                    <p className="text-sm text-slate-500">Manage reporting lines and company structure.</p>
                </div>
                <Button
                    className="rounded-lg shadow-sm"
                    variant="corporate"
                    onClick={() => toast.info("Feature Pending", { description: "Advanced drag-and-drop routing modification is scheduled for the next major release update." })}
                >
                    <GitMerge className="w-4 h-4 mr-2" /> Modify Routes
                </Button>
            </div>

            <Card className="shadow-none border border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base">Structural Tree</CardTitle>
                    <CardDescription>Default view groups employees by authorization tier.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="relative border-l-2 border-indigo-100 ml-6 space-y-6">
                        <div className="relative pl-6">
                            <div className="absolute w-6 border-b-2 border-indigo-100 left-0 top-6 -ml-[2px]" />
                            {renderLevel("Level 1: Executive / Directors", admins, <ShieldCheck className="w-4 h-4 text-indigo-600" />, "border-indigo-100", true)}
                        </div>

                        <div className="relative pl-6">
                            <div className="absolute w-6 border-b-2 border-indigo-100 left-0 top-6 -ml-[2px]" />
                            {renderLevel("Level 2: Team Leads / Area Managers", managers, <Users className="w-4 h-4 text-emerald-600" />, "border-emerald-100", true)}
                        </div>

                        <div className="relative pl-6">
                            <div className="absolute w-6 border-b-2 border-indigo-100 left-0 top-6 -ml-[2px]" />
                            {renderLevel("Level 3: General Workforce", members, <User className="w-4 h-4 text-slate-600" />, "border-slate-200", true)}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
