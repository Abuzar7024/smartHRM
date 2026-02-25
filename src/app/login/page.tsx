"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Role } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, ArrowRight, Loader2, Shield, BarChart3, Users, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("employee");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let user;
            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;

                try {
                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: role,
                        createdAt: new Date(),
                    });
                } catch (firestoreError: any) {
                    throw new Error("Account created but profile setup failed. Please contact admin.");
                }
            }

            const idToken = await user.getIdToken();
            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError("Failed to create secure session. Please try again.");
            }
        } catch (err: any) {
            const code = err.code || "";
            if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
                setError("Invalid email or password.");
            } else if (code.includes("email-already-in-use")) {
                setError("An account with this email already exists.");
            } else if (code.includes("weak-password")) {
                setError("Password must be at least 6 characters.");
            } else {
                setError(err.message || "Authentication failed.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50 relative overflow-hidden font-sans">
            {/* ── Background Elements ── */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-slate-200/40 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />

            {/* ── Login Container ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[420px]"
                >
                    {/* Brand Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-lg mb-4">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SmartHR</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Enterprise Workforce Solutions</p>
                    </div>

                    <Card className="border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl border">
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {isLogin ? "Welcome back" : "Create Account"}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {isLogin ? "Please enter your credentials to access the portal." : "Register your account to join the organization."}
                                </p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Work Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="rounded-lg h-11 bg-white border-slate-200 text-sm focus:ring-primary/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase">Password</Label>
                                        {isLogin && <button type="button" className="text-xs font-semibold text-primary hover:underline">Forgot?</button>}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="rounded-lg h-11 bg-white border-slate-200 text-sm focus:ring-primary/20"
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="space-y-3 pt-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Account Type</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setRole("employee")}
                                                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all ${role === "employee" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                            >
                                                <User className="w-4 h-4" /> Employee
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRole("employer")}
                                                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all ${role === "employer" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                                            >
                                                <Briefcase className="w-4 h-4" /> Employer
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="bg-rose-50 text-rose-600 text-xs font-medium p-3 rounded-lg border border-rose-100 flex items-center gap-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    variant="corporate"
                                    className="w-full h-11 rounded-lg font-bold text-sm mt-4 shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    {isLogin ? "Sign In" : "Register Now"}
                                </Button>
                            </form>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                    className="text-primary font-bold hover:underline"
                                >
                                    {isLogin ? "Request Access" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </Card>

                    {/* Footer Info */}
                    <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Secure SSO</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Encrypted</div>
                        <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Global Node</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// Simple Card placeholder if ui/Card isn't used
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>;
}
