"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

export function TermsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (val: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-8 bg-white rounded-3xl border-0 shadow-2xl">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">Please review our enterprise agreement before proceeding.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-4 space-y-6 text-sm text-slate-600 leading-relaxed custom-scrollbar">
                    <section>
                        <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-2">1. Acceptable Use</h4>
                        <p>SmartHR provides human resource management solutions for organizations. By using our services, you agree to provide accurate registration information and maintain the security of your account credentials. You are responsible for all data processed through your organizational node.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-2">2. Data Sovereignty</h4>
                        <p>All employee data uploaded remains the property of the employer. SmartHR employs enterprise-grade encryption and secure infrastructure to protect this data. We do not sell or share organizational data with third parties except as required for service delivery (e.g., identity verification or email services).</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-2">3. Subscription & Billing</h4>
                        <p>Service limits (e.g., employee count) are determined by your selected subscription tier. Upgrades or downgrades will be processed as per the billing cycle. Active seats are counted towards your maximum utility limit.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-2">4. Security Compliance</h4>
                        <p>Users must not attempt to breach security, perform unauthorized penetration testing, or utilize the platform for malicious intent. Any identified vulnerabilities should be reported to the SmartHR security unit.</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-900 uppercase tracking-widest text-[10px] mb-2">5. Service Termination</h4>
                        <p>We reserve the right to suspend accounts that violate these terms or the integrity of the platform. Data retrieval post-termination is subject to our data retention policy.</p>
                    </section>
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm"
                    >
                        Got it, I understand
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
