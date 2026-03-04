"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, query, collection, where, getDocs, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Role } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, Loader2, Shield, BarChart3, Users, CheckCircle2, Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
    id: string;
    name: string;
    ownerEmail?: string;
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("employee");
    const [companyName, setCompanyName] = useState("");
    const [companySearch, setCompanySearch] = useState("");
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Load companies from Firestore when switching to register as employee
    useEffect(() => {
        if (!isLogin && role === "employee") {
            setLoadingCompanies(true);
            getDocs(collection(db, "companies"))
                .then(snap => {
                    setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
                })
                .catch(() => setCompanies([]))
                .finally(() => setLoadingCompanies(false));
        }
    }, [isLogin, role]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredCompanies = companies.filter(c =>
        c.name?.toLowerCase().includes(companySearch.toLowerCase())
    );

    const handlePasswordReset = async () => {
        if (!email) { setError("Please enter your Work Email to receive a reset link."); return; }
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            setMsg("Password reset email sent. Please check your inbox.");
            setError("");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to send reset email.";
            setError(message);
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
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;
                // Check pending / rejected status
                const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
                if (!userSnap.empty) {
                    const status = userSnap.docs[0].data().status;
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
                // Registration
                if (!companyName.trim()) {
                    throw new Error(role === "employer"
                        ? "Company name is required."
                        : "Please select the company you are joining.");
                }

                if (role === "employee") {
                    // Verify employee exists in the system
                    const empSnap = await getDocs(query(collection(db, "employees"), where("email", "==", email)));
                    if (empSnap.empty) {
                        throw new Error("You are not currently registered. Please contact your administrator to be added before creating an account.");
                    }
                }

                const cred = await createUserWithEmailAndPassword(auth, email, password);
                user = cred.user;

                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role,
                    companyName,
                    status: role === "employee" ? "pending" : "active",
                    createdAt: new Date(),
                });

                // Employer: also save to companies collection for searchability
                if (role === "employer") {
                    await addDoc(collection(db, "companies"), {
                        name: companyName,
                        ownerEmail: user.email,
                        createdAt: new Date().toISOString(),
                    });
                }

                if (role === "employee") {
                    await addDoc(collection(db, "notifications"), {
                        title: "New Registration",
                        message: `${email} has registered and is waiting for your approval to join ${companyName}.`,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                        targetRole: "employer",
                        companyName: companyName
                    });
                }
            }

            const idToken = await user!.getIdToken();
            const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError("Failed to create secure session. Please try again.");
            }
        } catch (err) {
            let message = "Authentication failed.";
            let code = "";

            if (err && typeof err === 'object' && 'code' in err) {
                code = String(err.code);
            }
            if (err instanceof Error) {
                message = err.message;
            }

            if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
                setError("Login failed. Check your password. If you are an employee, make sure your employer has registered your email or ask them to add/approve your ID.");
            } else if (code.includes("email-already-in-use")) {
                setError("An account with this email already exists.");
            } else if (code.includes("weak-password")) {
                setError("Password must be at least 6 characters.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-50 relative overflow-hidden font-sans">

            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[420px]"
                >
                    {/* Brand */}
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md mb-3">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SmartHR</h1>
                    </div>

                    <div className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
                        <div className="p-8">
                            <div className="mb-6 text-center">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {isLogin ? "Sign in to your account" : "Register your company"}
                                </h2>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-5">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="e.g. jane.doe@acmecorp.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="rounded-lg h-11 bg-white border-slate-200 text-sm"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                        {isLogin && (
                                            <button type="button" onClick={handlePasswordReset} className="text-xs font-semibold text-primary hover:underline">
                                                Forgot?
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="rounded-lg h-11 bg-white border-slate-200 text-sm"
                                    />
                                </div>
                                {/* Register-only fields */}
                                {!isLogin && (
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700">
                                            Company Name
                                        </Label>
                                        <Input
                                            type="text"
                                            placeholder="e.g. Acme Corporation"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            required
                                            className="rounded-lg h-11 bg-white border-slate-200 text-sm"
                                        />
                                        {/* Hidden required field to ensure companyName is set */}
                                        <input type="hidden" value={companyName} required />
                                    </div>
                                )}

                                {/* Error / success */}
                                <AnimatePresence>
                                    {(error || msg) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className={cn(
                                                "text-xs font-medium p-3 rounded-lg border flex items-center gap-2",
                                                error ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                            )}
                                        >
                                            {error ? <Shield className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                            {error || msg}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Button
                                    type="submit"
                                    variant="corporate"
                                    className="w-full h-11 rounded-lg font-bold text-sm mt-2 shadow-sm"
                                    disabled={loading || (!isLogin && !companyName)}
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {isLogin ? "Sign In" : "Register Company"}
                                </Button>
                            </form>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                {isLogin ? "Want to register your organization?" : "Already registered?"}{" "}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setRole(isLogin ? "employer" : "employee"); setError(""); setMsg(""); }}
                                    className="text-primary font-bold hover:underline"
                                >
                                    {isLogin ? "Register your company" : "Sign In to your account"}
                                </button>
                            </p>
                        </div>
                    </div>

                </motion.div>
            </div>
        </div>
    );
}
