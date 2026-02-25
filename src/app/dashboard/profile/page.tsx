"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion } from "framer-motion";
import { LucideIcon, Mail as MailIcon, Phone as PhoneIcon, MapPin as MapPinIcon, Building as BuildingIcon, Briefcase as BriefcaseIcon, ShieldCheck as ShieldIcon, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, role } = useAuth();

    if (role !== "employee") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <ShieldIcon className="w-12 h-12 text-slate-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
                <p className="text-slate-500 text-sm mt-1">This terminal is restricted to employee profile management.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Personnel Profile</h1>
                    <p className="text-sm text-slate-500">Official registry record and professional credentials.</p>
                </div>
                <Button variant="outline" className="rounded-lg h-9 text-xs font-bold border-slate-200">
                    Request Credentials Reset
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Summary Card ── */}
                <Card className="lg:col-span-1 border-slate-200 shadow-sm rounded-xl overflow-hidden h-fit">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center text-slate-400 mb-4 ring-1 ring-slate-100">
                            <UserIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{user?.email?.split('@')[0]} Officer</h3>
                        <p className="text-xs font-medium text-slate-500 mb-6">{user?.email}</p>

                        <div className="w-full space-y-3 pt-6 border-t border-slate-100">
                            {[
                                { label: "Designation", value: "Senior Personnel", icon: BriefcaseIcon },
                                { label: "Department", value: "Resource Node", icon: BuildingIcon },
                                { label: "Assignment", value: "Primary Cluster", icon: MapPinIcon },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <item.icon className="w-3 h-3" /> {item.label}
                                    </span>
                                    <span className="font-bold text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Detailed Records ── */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b p-5">
                            <CardTitle className="text-base font-bold text-slate-900 font-sans">Official Registry Details</CardTitle>
                            <CardDescription className="text-xs">Immutable personal identification records.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legal First Name</Label>
                                    <Input value="Test" readOnly className="bg-slate-50 border-slate-100 text-sm font-semibold text-slate-900 h-10 rounded-lg cursor-not-allowed" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Legal Last Name</Label>
                                    <Input value="Officer" readOnly className="bg-slate-50 border-slate-100 text-sm font-semibold text-slate-900 h-10 rounded-lg cursor-not-allowed" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Work Email</Label>
                                <Input value={user?.email || "pending@hrm.com"} readOnly className="bg-slate-50 border-slate-100 text-sm font-semibold text-slate-900 h-10 rounded-lg cursor-not-allowed" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Priority Line</Label>
                                <Input value="+91 000 000 0000" readOnly className="bg-slate-50 border-slate-100 text-sm font-semibold text-slate-900 h-10 rounded-lg cursor-not-allowed" />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/30 border-t border-slate-100 p-4">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-tight">
                                <ShieldIcon className="w-3 h-3" /> To modify registry data, please contact Central Administration.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
