"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Mail, Calendar, Trash2, ShieldCheck, Users } from "lucide-react";
import { Employee } from "@/context/AppContext";

interface EmployeeTableProps {
    employees: Employee[];
    onManagePermissions: (emp: Employee) => void;
    onDelete: (emp: { id: string, name: string, email: string }) => void;
}

export function EmployeeTable({ employees, onManagePermissions, onDelete }: EmployeeTableProps) {
    return (
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow className="bg-white hover:bg-white text-xs text-slate-500 uppercase font-semibold">
                        <TableHead className="h-10">Name & Contact</TableHead>
                        <TableHead className="h-10">Role & Position</TableHead>
                        <TableHead className="h-10">Department</TableHead>
                        <TableHead className="h-10">DOJ / Status</TableHead>
                        <TableHead className="h-10 text-right">Permissions & Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((emp) => (
                        <TableRow key={emp.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                                        {((emp.name || emp.email || "U")?.[0] || "U").toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 truncate max-w-[150px]">{emp.name || "Unnamed"}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                                            <Mail className="w-3 h-3" /> {emp.email}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-700">
                                <div className="font-medium">{emp.role}</div>
                                {emp.position && <div className="text-xs text-slate-500 mt-0.5">{emp.position}</div>}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-500">{emp.department}</TableCell>
                            <TableCell className="py-4">
                                <div className="flex flex-col items-start gap-1">
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                        <Calendar className="w-3 h-3" />
                                        {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : "Unknown"}
                                    </div>
                                    <Badge variant={
                                        emp.status === "Active" ? "success" :
                                            emp.status === "On Leave" ? "warning" : "destructive"
                                    } className="rounded-md font-bold text-[10px] h-5 px-2">
                                        {emp.status}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-7 px-2 rounded-md mr-2"
                                    onClick={() => onManagePermissions(emp)}
                                >
                                    <ShieldCheck className="w-3 h-3 mr-1" /> Perms
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-slate-400 rounded-lg hover:text-rose-600 hover:bg-rose-50"
                                    onClick={() => onDelete({ id: emp.id!, name: emp.name, email: emp.email })}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {employees.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-24 text-slate-400">
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                    <Users className="w-8 h-8" />
                                    <p className="text-sm font-medium">No matching records found</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
