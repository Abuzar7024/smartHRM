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
        c.name.toLowerCase().includes(companySearch.toLowerCase())
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
                setError("Invalid email or password.");
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
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-slate-200/40 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-[420px]"
                >
                    {/* Brand */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center shadow-lg mb-4">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SmartHR</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Enterprise Workforce Solutions</p>
                    </div>

                    <div className="border border-slate-200 shadow-xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
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
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Work Email</Label>
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
                                        <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase">Password</Label>
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
                                    <>
                                        {/* Company field */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">
                                                {role === "employer" ? "Company Name" : "Search & Select Company"}
                                            </Label>

                                            {role === "employer" ? (
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. Acme Corp"
                                                    value={companyName}
                                                    onChange={e => setCompanyName(e.target.value)}
                                                    required
                                                    className="rounded-lg h-11 bg-white border-slate-200 text-sm"
                                                />
                                            ) : (
                                                /* Searchable company dropdown for employees */
                                                <div ref={dropdownRef} className="relative">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder={loadingCompanies ? "Loading companies…" : "e.g. Acme Corporation..."}
                                                            value={companySearch}
                                                            onChange={e => {
                                                                setCompanySearch(e.target.value);
                                                                setCompanyName("");
                                                                setShowDropdown(true);
                                                            }}
                                                            onFocus={() => setShowDropdown(true)}
                                                            required={!companyName}
                                                            className="w-full pl-9 pr-3 h-11 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                        />
                                                        {/* Hidden required field to ensure companyName is set */}
                                                        <input type="hidden" value={companyName} required />
                                                    </div>

                                                    {/* Selected company pill */}
                                                    {companyName && (
                                                        <div className="mt-1.5 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                                                            <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                            <span className="text-sm font-semibold text-indigo-800 flex-1">{companyName}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setCompanyName(""); setCompanySearch(""); }}
                                                                className="text-indigo-400 hover:text-indigo-600 text-xs font-bold"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Dropdown */}
                                                    <AnimatePresence>
                                                        {showDropdown && !companyName && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -4 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -4 }}
                                                                className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto"
                                                            >
                                                                {filteredCompanies.length === 0 ? (
                                                                    <p className="text-xs text-slate-400 italic text-center py-6">
                                                                        {loadingCompanies ? "Loading…" : "No companies found. Ask your employer to register first."}
                                                                    </p>
                                                                ) : (
                                                                    filteredCompanies.map(c => (
                                                                        <button
                                                                            key={c.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setCompanyName(c.name);
                                                                                setCompanySearch(c.name);
                                                                                setShowDropdown(false);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                                        >
                                                                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs flex-shrink-0">
                                                                                {c.name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                                                                                {c.ownerEmail && (
                                                                                    <p className="text-[10px] text-slate-400">{c.ownerEmail}</p>
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>

                                        {/* Account type */}
                                        <div className="space-y-3 pt-1">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Account Type</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => { setRole("employee"); setCompanyName(""); setCompanySearch(""); }}
                                                    className={cn(
                                                        "flex items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all",
                                                        role === "employee" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                    )}
                                                >
                                                    <User className="w-4 h-4" /> Employee
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setRole("employer"); setCompanyName(""); setCompanySearch(""); }}
                                                    className={cn(
                                                        "flex items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all",
                                                        role === "employer" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                    )}
                                                >
                                                    <Briefcase className="w-4 h-4" /> Employer
                                                </button>
                                            </div>
                                        </div>
                                    </>
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
                                    disabled={loading || (!isLogin && role === "employee" && !companyName)}
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {isLogin ? "Sign In" : "Register Now"}
                                </Button>
                            </form>
                        </div>

                        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setError(""); setMsg(""); }}
                                    className="text-primary font-bold hover:underline"
                                >
                                    {isLogin ? "Request Access" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
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
