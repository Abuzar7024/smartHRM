"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Users, Plus, Mail, Save, Clock, Target, Edit, Trash2, X, Check, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";

export default function TeamsPage() {
    const { role, user } = useAuth();
    const { employees, teams, createTeam, updateTeam, deleteTeam } = useApp();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

    const [teamName, setTeamName] = useState("");
    const [leaderEmail, setLeaderEmail] = useState("");
    const [teamType, setTeamType] = useState<"Permanent" | "Project-Based">("Permanent");
    const [hierarchy, setHierarchy] = useState<"Flat" | "Hierarchical" | "Matrix">("Flat");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const myTeams = role === "employer" ? teams : teams.filter(t =>
        t.leaderEmail === user?.email || (t.memberEmails || []).includes(user?.email || "")
    );

    const resetForm = () => {
        setTeamName("");
        setLeaderEmail("");
        setTeamType("Permanent");
        setHierarchy("Flat");
        setSelectedMembers([]);
        setEditingTeamId(null);
    };

    const toggleMember = (email: string) => {
        setSelectedMembers(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName || !leaderEmail) {
            toast.error("Missing fields", { description: "Please provide a team name and assign a leader." });
            return;
        }
        await createTeam({ name: teamName, leaderEmail, teamType, hierarchy, memberEmails: selectedMembers });
        toast.success("Team Created!", { description: `${teamName} has been successfully deployed.` });
        setIsAddOpen(false);
        resetForm();
    };

    const handleUpdateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTeamId) return;
        await updateTeam(editingTeamId, { memberEmails: selectedMembers, name: teamName, leaderEmail });
        toast.success("Team Updated", { description: "The team roster has been modified." });
        setIsEditOpen(false);
        resetForm();
    };

    const handleDeleteTeam = async (id: string) => {
        await deleteTeam(id);
        toast.success("Team Dissolved", { description: "The team has been removed from the system." });
        setDeletingTeamId(null);
    };

    const openEditForm = (team: typeof teams[0]) => {
        setEditingTeamId(team.id!);
        setTeamName(team.name);
        setLeaderEmail(team.leaderEmail);
        setSelectedMembers(team.memberEmails || []);
        setIsEditOpen(true);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Teams</h1>
                    <p className="text-sm text-slate-500">Define operational units and assign team leaders.</p>
                </div>

                {role === "employer" && (
                    <Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); if (!v) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button variant="corporate" className="rounded-lg shadow-sm gap-2 h-10">
                                <Plus className="w-4 h-4" /> Create New Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleCreateTeam}>
                                <DialogHeader className="border-b pb-4 mb-6">
                                    <DialogTitle className="text-xl">Create New Team</DialogTitle>
                                    <DialogDescription>Configure a new operational unit and assign leadership.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 uppercase">Team Name</Label>
                                        <Input
                                            className="rounded-lg"
                                            value={teamName}
                                            onChange={e => setTeamName(e.target.value)}
                                            placeholder="e.g. Engineering Alpha, Sales North"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 uppercase">Team Leader</Label>
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            value={leaderEmail}
                                            onChange={e => setLeaderEmail(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a team leader...</option>
                                            {employees.map(e => <option key={e.id} value={e.email}>{e.name} — {e.email}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Team Type</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={teamType}
                                                onChange={e => setTeamType(e.target.value as "Permanent" | "Project-Based")}
                                            >
                                                <option value="Permanent">Permanent</option>
                                                <option value="Project-Based">Project-Based</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-600 uppercase">Hierarchy Model</Label>
                                            <select
                                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                value={hierarchy}
                                                onChange={e => setHierarchy(e.target.value as "Flat" | "Hierarchical" | "Matrix")}
                                            >
                                                <option value="Flat">Flat</option>
                                                <option value="Hierarchical">Hierarchical</option>
                                                <option value="Matrix">Matrix</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 uppercase">
                                            Add Members ({selectedMembers.length} selected)
                                        </Label>
                                        <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-lg bg-slate-50">
                                            {employees.filter(e => e.email !== leaderEmail).map(e => (
                                                <div
                                                    key={e.id}
                                                    className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${selectedMembers.includes(e.email) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                                                    onClick={() => toggleMember(e.email)}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selectedMembers.includes(e.email) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}>
                                                        {selectedMembers.includes(e.email) && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                                                        {(e.name || "?").charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                                                        <p className="text-[11px] text-slate-500">{e.department} · {e.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {employees.filter(e => e.email !== leaderEmail).length === 0 &&
                                                <p className="text-xs text-slate-400 p-2 italic">No other employees available.</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="mt-8 pt-4 border-t gap-2">
                                    <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
                                    <Button type="submit" variant="corporate">
                                        <UsersRound className="w-4 h-4 mr-2" /> Deploy Team
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* ── Edit Team Dialog ── */}
            <Dialog open={isEditOpen} onOpenChange={(v) => { setIsEditOpen(v); if (!v) resetForm(); }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleUpdateTeam}>
                        <DialogHeader className="border-b pb-4 mb-6">
                            <DialogTitle>Edit Team: {teamName}</DialogTitle>
                            <DialogDescription>Modify team name, leader, or member roster.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5">
                            {role === "employer" && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 uppercase">Team Name</Label>
                                        <Input value={teamName} onChange={e => setTeamName(e.target.value)} className="rounded-lg" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-600 uppercase">Team Leader</Label>
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            value={leaderEmail}
                                            onChange={e => setLeaderEmail(e.target.value)}
                                        >
                                            <option value="">Select a team leader...</option>
                                            {employees.map(e => <option key={e.id} value={e.email}>{e.name} — {e.email}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase">
                                    Team Members ({selectedMembers.length} selected)
                                </Label>
                                <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 p-2 rounded-lg bg-slate-50">
                                    {employees.filter(e => e.email !== leaderEmail).map(e => (
                                        <div
                                            key={e.id}
                                            className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${selectedMembers.includes(e.email) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                                            onClick={() => toggleMember(e.email)}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selectedMembers.includes(e.email) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}>
                                                {selectedMembers.includes(e.email) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs flex-shrink-0">
                                                {(e.name || "?").charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                                                <p className="text-[11px] text-slate-500">{e.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-8 pt-4 border-t gap-2">
                            <Button type="button" variant="ghost" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
                            <Button type="submit" variant="corporate">
                                <Save className="w-4 h-4 mr-2" /> Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={!!deletingTeamId} onOpenChange={(v) => { if (!v) setDeletingTeamId(null); }}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Dissolve Team</DialogTitle>
                        <DialogDescription>This action is permanent and cannot be undone. The team and all its configurations will be deleted.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setDeletingTeamId(null)}>Cancel</Button>
                        <Button
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                            onClick={() => deletingTeamId && handleDeleteTeam(deletingTeamId)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Yes, Dissolve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Teams Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myTeams.map(team => {
                    const leader = employees.find(e => e.email === team.leaderEmail);
                    const canEdit = role === "employer" || team.leaderEmail === user?.email;

                    return (
                        <Card key={team.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 group">
                            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            <CardContent className="p-5">
                                {/* Team Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-900 truncate">{team.name}</h3>
                                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                            <Badge variant="outline" className="text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50 uppercase px-1.5 gap-1">
                                                {team.teamType === "Permanent" ? <Target className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                                {team.teamType || "Permanent"}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600 uppercase px-1.5">
                                                {team.hierarchy || "Flat"}
                                            </Badge>
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <div className="flex gap-1 ml-2 flex-shrink-0">
                                            <Button
                                                variant="ghost" size="icon-sm"
                                                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => openEditForm(team)}
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            {role === "employer" && (
                                                <Button
                                                    variant="ghost" size="icon-sm"
                                                    className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => setDeletingTeamId(team.id!)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Leader */}
                                <div className="flex items-center gap-2.5 mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                                        {String(leader?.name || team.leaderEmail || "?").charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Team Leader</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{leader?.name || team.leaderEmail}</p>
                                    </div>
                                </div>

                                {/* Members */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Users className="w-3 h-3" /> Members ({team.memberEmails?.length || 0})
                                    </p>
                                    <div className="space-y-1.5">
                                        {(team.memberEmails || []).slice(0, 4).map((email, idx) => {
                                            const member = employees.find(e => e.email === email);
                                            return (
                                                <div key={idx} className="flex items-center justify-between px-2.5 py-2 rounded-md bg-slate-50 border border-slate-100 hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
                                                            {String(member?.name || email || "?").charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{member?.name || email}</span>
                                                    </div>
                                                    <Mail className="w-3 h-3 text-slate-300" />
                                                </div>
                                            );
                                        })}
                                        {(team.memberEmails || []).length > 4 && (
                                            <p className="text-xs text-slate-400 italic text-center py-1">+{(team.memberEmails || []).length - 4} more members</p>
                                        )}
                                        {(team.memberEmails || []).length === 0 &&
                                            <p className="text-xs text-slate-400 italic py-1">No members assigned yet.</p>
                                        }
                                    </div>
                                </div>

                                {/* Footer */}
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-4 h-8 text-xs border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 gap-1.5"
                                        onClick={() => openEditForm(team)}
                                    >
                                        <Edit className="w-3 h-3" /> Manage Members
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {myTeams.length === 0 && (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                        <UsersRound className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">No Teams Found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                            {role === "employer"
                                ? "Click 'Create New Team' above to build your first operational unit."
                                : "You are not currently assigned to any team."}
                        </p>
                        {role === "employer" && (
                            <Button variant="corporate" className="mt-6 gap-2" onClick={() => setIsAddOpen(true)}>
                                <Plus className="w-4 h-4" /> Create Your First Team
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
