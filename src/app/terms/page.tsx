"use client";

import { motion } from "framer-motion";
import { Scale, ShieldCheck, Lock, FileText, ArrowLeft, Building2, UserCheck, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function TermsPage() {
    const lastUpdated = "March 09, 2026";

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Scale className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tight">SmartHR <span className="text-slate-400 font-medium">Legal</span></span>
                    </div>
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-12">
                        <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-4">Terms of Service</h1>
                        <p className="text-slate-500 font-medium italic">Last Updated: {lastUpdated}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <ShieldCheck className="w-8 h-8 text-indigo-600 mb-4" />
                            <h3 className="font-bold mb-2">Data Privacy</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Enterprise-grade encryption for all employee records and organizational data.</p>
                        </div>
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <Lock className="w-8 h-8 text-emerald-600 mb-4" />
                            <h3 className="font-bold mb-2">Secure Access</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Strict identity verification and multi-layered access control protocols.</p>
                        </div>
                        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <Building2 className="w-8 h-8 text-blue-600 mb-4" />
                            <h3 className="font-bold mb-2">Sovereignty</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Your organization retains 100% ownership of all uploaded personnel data.</p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <section className="scroll-mt-24" id="agreement">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-600" /> 1. Agreement to Terms
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                                <p>By accessing or using the SmartHR platform ("Service"), provided by SmartHR Inc. ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity to these terms.</p>
                                <p>SmartHR provides human resource management, payroll processing, and employee engagement tools. These services are intended for professional organizational use only.</p>
                            </div>
                        </section>

                        <section className="scroll-mt-24" id="accounts">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <UserCheck className="w-6 h-6 text-indigo-600" /> 2. Account Responsibility
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security.</p>
                                <p>Employers are responsible for the accuracy of employee data uploaded to the platform, ensuring compliance with local labor laws and data protection regulations (such as GDPR or CCPA where applicable).</p>
                            </div>
                        </section>

                        <section className="scroll-mt-24" id="service-limits">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-indigo-600" /> 3. Subscriptions & Billing
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                                <p>SmartHR operates on a subscription-based model. Fees are based on the selected tier and the number of active employee "seats" within your organization. We reserve the right to modify our fees upon thirty (30) days' notice.</p>
                                <p>Failure to maintain an active subscription may result in limited access to features or temporary suspension of the organizational node.</p>
                            </div>
                        </section>

                        <section className="scroll-mt-24" id="conduct">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-indigo-600" /> 4. Prohibited Conduct
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                                <p>You agree not to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Attempt to reverse engineer, decompile, or extract the source code of the platform.</li>
                                    <li>Use the service to process or store any data that violates third-party rights or applicable laws.</li>
                                    <li>Interfere with or disrupt the integrity or performance of the Service or the data contained therein.</li>
                                    <li>Perform unauthorized security testing or "stress testing" on our infrastructure.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="scroll-mt-24" id="liability">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Scale className="w-6 h-6 text-indigo-600" /> 5. Limitation of Liability
                            </h2>
                            <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed space-y-4">
                                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMARTHR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.</p>
                                <p>Our total liability for any claim arising under these terms shall not exceed the amount paid by you to SmartHR in the twelve (12) months preceding the claim.</p>
                            </div>
                        </section>
                    </div>

                    <div className="mt-20 p-10 bg-indigo-600 rounded-[40px] text-white overflow-hidden relative shadow-2xl shadow-indigo-200">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-4">Ready to secure your workforce?</h2>
                            <p className="text-indigo-100 font-medium mb-8 max-w-md">Join thousands of organizations transforming their HR management with SmartHR's secure platform.</p>
                            <Link href="/login">
                                <Button className="bg-white text-indigo-600 font-black px-8 py-6 rounded-2xl hover:bg-slate-50 transition-all border-0 shadow-lg">
                                    Get Started Now
                                </Button>
                            </Link>
                        </div>
                        <Scale className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/5 rotate-12" />
                    </div>
                </motion.div>
            </main>

            <footer className="mt-20 pt-10 border-t border-slate-200">
                <div className="max-w-4xl mx-auto px-6 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    © 2026 SmartHR Inc. Protocol Secure. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
}
