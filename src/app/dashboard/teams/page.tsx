"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Users, Plus, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";

export default function TeamsPage() {
    const { role, user } = useAuth();
    const { employees, teams, createTeam } = useApp();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [teamName, setTeamName] = useState("");
    const [leaderEmail, setLeaderEmail] = useState("");
    const [teamType, setTeamType] = useState<"Permanent" | "Project-Based">("Permanent");
    const [hierarchy, setHierarchy] = useState<"Flat" | "Top-Down" | "Matrix">("Flat");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const toggleMember = (email: string) => {
        if (selectedMembers.includes(email)) {
            setSelectedMembers(selectedMembers.filter(e => e !== email));
        } else {
            setSelectedMembers([...selectedMembers, email]);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName || !leaderEmail) return;

        await createTeam({
            name: teamName,
            leaderEmail,
            memberEmails: selectedMembers,
            type: teamType,
            hierarchy
        });
        toast.success("Team Defined", { description: "The team has been securely allocated." });
        setIsAddOpen(false);
        setTeamName("");
        setLeaderEmail("");
        setTeamType("Permanent");
        setHierarchy("Flat");
        setSelectedMembers([]);
    };

    const myTeams = role === "employer" ? teams : teams.filter(t => t.leaderEmail === user?.email);

    if (role !== "employer" && myTeams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">You are not currently assigned to manage any teams.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Teams</h1>
                    <p className="text-sm text-slate-500">Bold structure. Define operational units and leads.</p>
                </div>
                {role === "employer" && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="corporate" className="rounded-lg shadow-sm">
                                <Plus className="w-4 h-4 mr-2" /> Assign Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleCreateTeam}>
                                <DialogHeader className="border-b pb-4 mb-4">
                                    <DialogTitle>Forge New Team</DialogTitle>
                                    <DialogDescription>Assign a team to a strategic leader.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Team Moniker</Label>
                                        <Input
                                            className="rounded-lg"
                                            value={teamName}
                                            onChange={e => setTeamName(e.target.value)}
                                            placeholder="e.g. Strike Force Alpha"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Assign Team Leader</Label>
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            value={leaderEmail}
                                            onChange={e => setLeaderEmail(e.target.value)}
                                            required
                                        >
                                            <option value="">Select an employee...</option>
                                            {employees.map(e => <option key={e.id} value={e.email}>{e.name} ({e.email})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Team Duration Type</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={teamType}
                                                onChange={e => setTeamType(e.target.value as any)}
                                            >
                                                <option value="Permanent">Permanent</option>
                                                <option value="Project-Based">Project-Based</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">Hierarchy Workflow</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={hierarchy}
                                                onChange={e => setHierarchy(e.target.value as any)}
                                            >
                                                <option value="Flat">Flat Structure</option>
                                                <option value="Top-Down">Top-Down Management</option>
                                                <option value="Matrix">Matrix</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-semibold block mb-2">Select Operatives (Members)</Label>
                                        <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 p-2 rounded-lg bg-slate-50">
                                            {employees.filter(e => e.email !== leaderEmail).map(e => (
                                                <div key={e.id} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => toggleMember(e.email)}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMembers.includes(e.email)}
                                                        readOnly
                                                        className="w-4 h-4 text-primary rounded border-slate-300"
                                                    />
                                                    <span className="text-sm font-medium text-slate-800">{e.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="mt-8 pt-4 border-t">
                                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="corporate">Deploy Team</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeams.map(team => {
                    const leader = employees.find(e => e.email === team.leaderEmail);
                    return (
                        <Card key={team.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200 group">
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                            <CardContent className="p-6">
                                <h3 className="text-xl font-black text-slate-900 mb-1 uppercase tracking-tight">{team.name}</h3>
                                <div className="flex items-center gap-2 mb-6 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                        {team.leaderEmail.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none">Team Lead</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">{leader?.name || team.leaderEmail}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Type</p>
                                        <p className="text-xs font-semibold text-slate-800">{team.type || "Permanent"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Workflow Hierarchy</p>
                                        <p className="text-xs font-semibold text-slate-800">{team.hierarchy || "Flat"}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users className="w-3 h-3" /> Active Roster ({team.memberEmails.length})</p>
                                    <div className="space-y-2">
                                        {team.memberEmails.map((email, idx) => {
                                            const member = employees.find(e => e.email === email);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-2 rounded text-sm bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                                                    <span className="font-semibold text-slate-700">{member?.name || email}</span>
                                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                            );
                                        })}
                                        {team.memberEmails.length === 0 && <p className="text-xs text-slate-400 italic">No assigned members.</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {myTeams.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">No Teams Assigned</h3>
                        <p className="text-slate-500">Wait for administration to assign active operations.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
