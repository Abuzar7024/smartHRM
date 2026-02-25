"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Role } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, ArrowRight, Loader2, Shield, BarChart3, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("employee");
    const [companyName, setCompanyName] = useState("");
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePasswordReset = async () => {
        if (!email) {
            setError("Please enter your Work Email to receive a reset link.");
            return;
        }
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            setMsg("Password reset email sent. Please check your inbox.");
            setError("");
        } catch (err: any) {
            setError(err.message || "Failed to send reset email.");
            setMsg("");
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let user;
            if (isLogin) {
                // If it's a login check if the employee is registered but not active
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;
                // Check if the user's status is pending or rejected
                const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
                if (!userDoc.empty) {
                    const status = userDoc.docs[0].data().status;
                    if (status === "pending") {
                        await auth.signOut();
                        setError("Your account is pending employer approval. Please wait for your employer to approve your registration.");
                        setLoading(false);
                        return;
                    }
                    if (status === "rejected") {
                        await auth.signOut();
                        setError("Your registration was rejected. Please contact your employer.");
                        setLoading(false);
                        return;
                    }
                }
            } else {
                if (!companyName.trim()) {
                    throw new Error(role === "employer" ? "Company name is required for Employers." : "Please specify the company you are joining.");
                }

                if (role === "employee") {
                    // Prevent rogue registration for non-invited / unassigned users
                    const employeesQuery = query(collection(db, "employees"), where("email", "==", email));
                    const empSnapshot = await getDocs(employeesQuery);

                    if (empSnapshot.empty) {
                        throw new Error("You are not currently registered. Please contact your administrator to be added before creating an account.");
                    }
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;

                try {
                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: role,
                        companyName: companyName,
                        // Employees need employer approval; employers are active immediately
                        status: role === "employee" ? "pending" : "active",
                        createdAt: new Date(),
                    });
                } catch (firestoreError: any) {
                    throw new Error("Account created but profile setup failed. Please contact admin.");
                }

                // Employees: don't let them into the dashboard yet — show pending message
                if (role === "employee") {
                    await auth.signOut();
                    setMsg("Registration submitted! Your employer will review and approve your access. You will be able to log in once approved.");
                    setLoading(false);
                    return;
                }
            }

            const idToken = await user!.getIdToken();
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
                                        {isLogin && <button type="button" onClick={handlePasswordReset} className="text-xs font-semibold text-primary hover:underline">Forgot?</button>}
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
                                    <>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="companyName" className="text-xs font-bold text-slate-500 uppercase">
                                                {role === "employer" ? "Company Name" : "Company Joining"}
                                            </Label>
                                            <Input
                                                id="companyName"
                                                type="text"
                                                placeholder={role === "employer" ? "Acme Corp" : "The company who invited you"}
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                required={!isLogin}
                                                className="rounded-lg h-11 bg-white border-slate-200 text-sm focus:ring-primary/20"
                                            />
                                        </div>
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
                                    </>
                                )}

                                <AnimatePresence>
                                    {(error || msg) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className={cn("text-xs font-medium p-3 rounded-lg border flex items-center gap-2",
                                                error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}
                                        >
                                            {error ? <Shield className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            {error || msg}
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
