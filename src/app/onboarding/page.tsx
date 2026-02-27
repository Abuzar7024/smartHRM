"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ShieldCheck, ArrowRight, ArrowLeft, Building2, Users,
    CreditCard, CheckCircle2, Lock, Sparkles, Building,
    Globe, Mail, BadgeIndianRupee, MapPin, Search, Plus
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: 0, title: 'Welcome' },
    { id: 1, title: 'Company Setup', benefit: 'Proper setup allows us to automate compliance & tax settings for your region.' },
    { id: 2, title: 'Add First Employee', benefit: 'Start managing your team instantly. We will send them a secure invite link.' },
    { id: 3, title: 'Payroll Preferences', benefit: 'Automated payroll saves an average of 20 hours per month.' },
    { id: 4, title: 'Billing Setup', benefit: 'First 5 employees are completely free. Secure and encrypted payments.' },
    { id: 5, title: 'Completion' }
];

export default function OnboardingFlow() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);

    // Context states
    const [company, setCompany] = useState({ name: '', industry: 'Technology', size: '1-10', timezone: 'Asia/Kolkata' });
    const [employee, setEmployee] = useState({ name: '', email: '', role: '', salary: '', invite: true });
    const [payroll, setPayroll] = useState({ cycle: 'Monthly', currency: 'INR', tax: true });
    const [billing, setBilling] = useState({ method: 'UPI' });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const nextStep = () => {
        // Validation before proceeding
        if (step === 1) {
            if (!company.name.trim()) {
                setErrors({ company: "Company name is required." });
                return;
            }
        }
        if (step === 2) {
            if (!employee.name.trim() && employee.email.trim()) {
                setErrors({ employee: "Name is required if email is provided." });
                return;
            }
        }

        setErrors({});
        setDirection(1);
        setStep(p => Math.min(p + 1, 5));
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(p => Math.max(p - 1, 0));
    };

    const skipStep = () => {
        setErrors({});
        setDirection(1);
        setStep(p => Math.min(p + 1, 5));
    };

    // Animation Config for smooth micro-interactions (150-250ms feel)
    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0, scale: 0.98 }),
        center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
        exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 30 : -30, opacity: 0, scale: 0.98 })
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col">

            {/* Top Navigation - Minimal Stripe-like Header */}
            <div className="h-16 border-b border-slate-200 bg-white flex items-center px-6 lg:px-10">
                <div className="flex items-center gap-2 cursor-pointer font-bold tracking-tight text-lg relative" onClick={() => router.push('/')}>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    SmartHR
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 md:p-8 relative">

                {/* Progress Bar Display */}
                {step > 0 && step < 5 && (
                    <div className="w-full max-w-xl mb-8 flex flex-col gap-3">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest relative px-1">
                            <span>Step {step} of 4</span>
                            <span className="text-indigo-600">{STEPS[step].title}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(step / 4) * 100}%` }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Springy ease
                                className="absolute top-0 left-0 h-full bg-indigo-600 rounded-full"
                            />
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <Card className="w-full max-w-xl border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-xl relative z-10">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-full"
                        >

                            {/* Step 0: Welcome */}
                            {step === 0 && (
                                <div className="p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
                                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                                        Let's set up your workspace
                                    </h1>
                                    <p className="text-slate-500 font-medium mb-10 max-w-sm">
                                        Join thousands of fast-growing companies automating their HR processes with SmartHR. Setup takes less than 3 minutes.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={nextStep}
                                        className="w-full max-w-xs rounded-xl h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/10 group transition-all"
                                    >
                                        Get Started
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                    <p className="text-xs text-slate-400 font-medium mt-6 flex items-center gap-1.5 justify-center">
                                        <Lock className="w-3.5 h-3.5" /> Secure & Encrypted Setup
                                    </p>
                                </div>
                            )}

                            {/* Step 1: Company Setup */}
                            {step === 1 && (
                                <div className="p-8 md:p-10">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                                            <Building2 className="w-6 h-6 text-indigo-500" /> Company Details
                                        </h2>
                                        <p className="text-slate-500 text-sm font-medium">{STEPS[1].benefit}</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Name</Label>
                                            <Input
                                                autoFocus
                                                placeholder="e.g. Acme Corporation"
                                                value={company.name}
                                                onChange={e => {
                                                    setCompany({ ...company, name: e.target.value });
                                                    setErrors({});
                                                }}
                                                className={cn("h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-500", errors.company && "border-rose-300 focus:ring-rose-500")}
                                            />
                                            {errors.company && <p className="text-xs text-rose-500 font-bold mt-1">{errors.company}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Industry</Label>
                                                <select
                                                    value={company.industry}
                                                    onChange={e => setCompany({ ...company, industry: e.target.value })}
                                                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                >
                                                    <option>Technology</option>
                                                    <option>Healthcare</option>
                                                    <option>Education</option>
                                                    <option>Retail / E-Commerce</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Size</Label>
                                                <select
                                                    value={company.size}
                                                    onChange={e => setCompany({ ...company, size: e.target.value })}
                                                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                >
                                                    <option>1-10</option>
                                                    <option>11-50</option>
                                                    <option>51-200</option>
                                                    <option>201-500</option>
                                                    <option>500+</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Timezone</Label>
                                            <select
                                                value={company.timezone}
                                                onChange={e => setCompany({ ...company, timezone: e.target.value })}
                                                className="w-full h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            >
                                                <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                                <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                                                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                                                <option value="America/New_York">Eastern Standard Time (EST)</option>
                                                <option value="America/Los_Angeles">Pacific Standard Time (PST)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
                                        <Button variant="ghost" onClick={prevStep} className="font-bold text-slate-500 hover:text-slate-900 rounded-lg h-11 px-6">
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                        </Button>
                                        <Button onClick={nextStep} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 h-11 px-8 transition-transform active:scale-95">
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Add First Employee */}
                            {step === 2 && (
                                <div className="p-8 md:p-10">
                                    <div className="mb-8 flex justify-between items-start gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                                                <Users className="w-6 h-6 text-indigo-500" /> Add First Employee
                                            </h2>
                                            <p className="text-slate-500 text-sm font-medium">{STEPS[2].benefit}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</Label>
                                                <Input
                                                    autoFocus
                                                    placeholder="Jane Doe"
                                                    value={employee.name}
                                                    onChange={e => {
                                                        setEmployee({ ...employee, name: e.target.value });
                                                        setErrors({});
                                                    }}
                                                    className={cn("h-11 rounded-xl border-slate-200", errors.employee && "border-rose-300")}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="jane@acme.com"
                                                    value={employee.email}
                                                    onChange={e => setEmployee({ ...employee, email: e.target.value })}
                                                    className="h-11 rounded-xl border-slate-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Job Role</Label>
                                                <Input
                                                    placeholder="e.g. Lead Designer"
                                                    value={employee.role}
                                                    onChange={e => setEmployee({ ...employee, role: e.target.value })}
                                                    className="h-11 rounded-xl border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Salary</Label>
                                                <div className="relative">
                                                    <BadgeIndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <Input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={employee.salary}
                                                        onChange={e => setEmployee({ ...employee, salary: e.target.value })}
                                                        className="h-11 rounded-xl border-slate-200 pl-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {errors.employee && <p className="text-xs text-rose-500 font-bold mt-1">{errors.employee}</p>}

                                        {/* Toggle */}
                                        <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 mt-6 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <div className={cn(
                                                "w-10 h-6 rounded-full flex items-center px-1 transition-colors relative",
                                                employee.invite ? "bg-indigo-600" : "bg-slate-300"
                                            )}>
                                                <motion.div
                                                    layout
                                                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                                                    style={{ marginLeft: employee.invite ? "auto" : "0" }}
                                                />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={employee.invite}
                                                onChange={() => setEmployee({ ...employee, invite: !employee.invite })}
                                            />
                                            <div className="text-sm">
                                                <p className="font-bold text-slate-900">Send invite email now</p>
                                                <p className="text-[11px] text-slate-500 font-medium">They will receive a secure portal link immediately.</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                                        <Button variant="ghost" onClick={skipStep} className="font-bold text-slate-400 hover:text-slate-600">
                                            Skip for now
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={prevStep} className="font-bold text-slate-500 hover:text-slate-900 rounded-lg h-11 px-4">
                                                Back
                                            </Button>
                                            <Button onClick={nextStep} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 h-11 px-8 transition-transform active:scale-95">
                                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Payroll Preferences */}
                            {step === 3 && (
                                <div className="p-8 md:p-10">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                                            <CreditCard className="w-6 h-6 text-indigo-500" /> Payroll Settings
                                        </h2>
                                        <p className="text-slate-500 text-sm font-medium">{STEPS[3].benefit}</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Base Currency</Label>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                {['INR', 'USD', 'EUR'].map(cur => (
                                                    <div
                                                        key={cur}
                                                        onClick={() => setPayroll({ ...payroll, currency: cur })}
                                                        className={cn(
                                                            "border rounded-xl p-3 text-center cursor-pointer transition-all font-bold text-sm",
                                                            payroll.currency === cur
                                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-600"
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {cur}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Salary Cycle</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'Monthly', desc: 'Once a month' },
                                                    { id: 'Biweekly', desc: 'Every 2 weeks' }
                                                ].map(cycle => (
                                                    <div
                                                        key={cycle.id}
                                                        onClick={() => setPayroll({ ...payroll, cycle: cycle.id })}
                                                        className={cn(
                                                            "border rounded-xl p-4 cursor-pointer transition-all",
                                                            payroll.cycle === cycle.id
                                                                ? "border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600"
                                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={cn("font-bold text-sm", payroll.cycle === cycle.id ? "text-indigo-900" : "text-slate-800")}>{cycle.id}</span>
                                                            {payroll.cycle === cycle.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                                        </div>
                                                        <span className="text-xs text-slate-500 font-medium">{cycle.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 mt-6 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <div className={cn(
                                                "w-10 h-6 rounded-full flex items-center px-1 transition-colors relative",
                                                payroll.tax ? "bg-indigo-600" : "bg-slate-300"
                                            )}>
                                                <motion.div
                                                    layout
                                                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                                                    style={{ marginLeft: payroll.tax ? "auto" : "0" }}
                                                />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={payroll.tax}
                                                onChange={() => setPayroll({ ...payroll, tax: !payroll.tax })}
                                            />
                                            <div className="text-sm">
                                                <p className="font-bold text-slate-900">Enable automated tax calculations</p>
                                                <p className="text-[11px] text-slate-500 font-medium">Calculations follow {company.timezone.includes('Kolkata') ? 'Indian TDS rules' : 'standard localized rules'}.</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                                        <Button variant="ghost" onClick={skipStep} className="font-bold text-slate-400 hover:text-slate-600">
                                            Skip for now
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={prevStep} className="font-bold text-slate-500 hover:text-slate-900 rounded-lg h-11 px-4">
                                                Back
                                            </Button>
                                            <Button onClick={nextStep} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 h-11 px-8 transition-transform active:scale-95">
                                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Billing Setup */}
                            {step === 4 && (
                                <div className="p-8 md:p-10">
                                    <div className="mb-8 text-center sm:text-left">
                                        <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center justify-center sm:justify-start gap-2">
                                            <ShieldCheck className="w-6 h-6 text-indigo-500" /> Secure Billing
                                        </h2>
                                        <p className="text-slate-500 text-sm font-medium">{STEPS[4].benefit}</p>
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl shadow-indigo-900/20 mb-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Building className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="bg-indigo-800 text-indigo-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block">Pro Plan</span>
                                                    <h3 className="text-lg font-bold">First 5 Employees Free</h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-black">₹0<span className="text-slate-400 text-base font-medium">/mo</span></div>
                                                    <p className="text-indigo-300 text-xs font-semibold mt-1">₹99/mo per additional seat</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-indigo-200 font-medium">
                                                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full HRMS features access</div>
                                                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 Priority support</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Payment Method</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: 'UPI', icon: Sparkles, label: 'UPI / Netbanking' },
                                                { id: 'Card', icon: CreditCard, label: 'Credit / Debit Card' }
                                            ].map(method => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setBilling({ ...billing, method: method.id })}
                                                    className={cn(
                                                        "border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all",
                                                        billing.method === method.id
                                                            ? "border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600"
                                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", billing.method === method.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                                                        <method.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className={cn("font-bold text-sm", billing.method === method.id ? "text-indigo-900" : "text-slate-700")}>{method.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                                        <Lock className="w-3.5 h-3.5" /> Payments are 256-bit AES encrypted.
                                    </div>

                                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-slate-100">
                                        <Button variant="ghost" onClick={prevStep} className="font-bold text-slate-500 hover:text-slate-900 rounded-lg h-11 px-6">
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                        </Button>
                                        <Button onClick={nextStep} className="w-full sm:w-auto font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xl shadow-slate-900/10 h-11 px-8 transition-transform active:scale-95">
                                            Complete Setup
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Success Completion */}
                            {step === 5 && (
                                <div className="p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[400px]">
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-emerald-50 border-[6px] border-emerald-100 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </motion.div>
                                    <motion.h1
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                                        className="text-3xl font-black text-slate-900 tracking-tight mb-2"
                                    >
                                        Your workspace is ready!
                                    </motion.h1>
                                    <motion.p
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                                        className="text-slate-500 font-medium mb-10 max-w-sm"
                                    >
                                        {company.name || "Your company"} has been successfully configured. We've set up everything you need to start managing your team.
                                    </motion.p>
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="w-full">
                                        <Button
                                            size="lg"
                                            onClick={() => router.push('/dashboard')}
                                            className="w-full max-w-xs rounded-xl h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 group transition-all"
                                        >
                                            Go to Dashboard
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </motion.div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </Card>

                {/* Visual decorations for the background */}
                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none z-0" />
                <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/5 blur-[120px] pointer-events-none z-0" />

            </div>
        </div>
    );
}
