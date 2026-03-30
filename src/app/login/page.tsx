"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Role } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Shield, BarChart3, CheckCircle2, ArrowRight, ArrowLeft, Mail, Building, Globe, MapPin, Scale, Info } from "lucide-react";
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
    const [role] = useState<Role>("employer"); // Fixed to employer
    const [companyName, setCompanyName] = useState("");
    const [regNo, setRegNo] = useState("");
    const [website, setWebsite] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [regStep, setRegStep] = useState(1);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    const handlePasswordReset = async () => {
        if (!email) { setError("Enter your registered email to receive a reset link."); return; }
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            setMsg("Reset link sent! Please check your inbox.");
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset email.");
        } finally {
            setLoading(false);
        }
    };

    const validateRegStep = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

        if (regStep === 1) {
            if (!email || !password) { setError("Email and password are required."); return false; }
            if (!emailRegex.test(email)) { setError("Please enter a valid work email address."); return false; }
            if (password.length < 8) { setError("Security requirement: Password must be at least 8 characters."); return false; }
            setError("");
            return true;
        }
        if (regStep === 2) {
            const taxRegex = /^[a-zA-Z0-9]{15}$/;
            if (!companyName.trim() || companyName.length < 2) { setError("Please enter a valid organization name."); return false; }
            if (!taxRegex.test(regNo)) { setError("Valid 15-digit alphanumeric Tax ID / GST is required."); return false; }
            if (!address.trim() || address.length < 10) { setError("Please provide a complete registered office address."); return false; }
            if (!website.trim()) { setError("Company website is required."); return false; }
            if (!urlRegex.test(website)) { setError("Please enter a valid website URL (e.g., https://acme.org)."); return false; }
            if (!termsAccepted) { setError("Please accept the Terms of Service to proceed."); return false; }
            setError("");
            return true;
        }
        return true;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLogin && regStep === 1) {
            if (validateRegStep()) setRegStep(2);
            return;
        }

        if (!isLogin && regStep === 2) {
            if (!validateRegStep()) return;
        }

        setLoading(true);
        setError("");

        try {
            let user;
            if (isLogin) {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;

                if (!user.emailVerified) {
                    await auth.signOut();
                    setError("Identity not verified. Please check your email for the activation link.");
                    setLoading(false);
                    return;
                }

                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.status === "rejected") {
                        await auth.signOut();
                        setError("Your access has been denied by the administration.");
                        setLoading(false);
                        return;
                    }
                    if (data.status === "pending" && user.emailVerified) {
                        await updateDoc(userDocRef, {
                            status: "active",
                            emailVerified: true,
                            verificationStatus: "verified"
                        });
                    }
                }
            } else {
                // Register Employer
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                user = cred.user;

                await sendEmailVerification(user);

                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    role: "employer",
                    companyName,
                    status: "pending",
                    createdAt: new Date(),
                    emailVerified: false,
                    regNo,
                    website,
                    address,
                    verificationStatus: "pending"
                });

                await addDoc(collection(db, "companies"), {
                    name: companyName,
                    ownerEmail: user.email,
                    regNo,
                    website,
                    address,
                    createdAt: new Date().toISOString(),
                });

                // Automated Instant Login after registration
                const idToken = await user.getIdToken();
                const sessionRes = await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });

                if (sessionRes.ok) {
                    router.push("/dashboard");
                    return;
                }
            }

            // ... existing session logic for isLogin ...
            const idToken = await user!.getIdToken();
            const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                setError("Secure session could not be established.");
            }
        } catch (err: any) {
            let message = "Authentication failed.";
            if (err.code?.includes("user-not-found") || err.code?.includes("wrong-password") || err.code?.includes("invalid-credential")) {
                message = "The credentials provided are incorrect.";
            } else if (err.code?.includes("email-already-in-use")) {
                message = "This email is already associated with an account.";
            } else if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
            {/* Soft Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[460px] relative z-10"
            >
                {/* Brand Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-[0_20px_40px_rgba(79,70,229,0.2)] mb-4"
                    >
                        <BarChart3 className="w-7 h-7 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">SmartHR</h1>
                    <p className="text-slate-500 text-sm font-medium">Professional Enterprise HR Management</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] rounded-[32px] overflow-hidden">
                    <div className="p-10">
                        {/* Multi-step Indicator */}
                        {!isLogin && regStep < 3 && (
                            <div className="mb-10">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-1">Employer Onboarding</p>
                                        <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                            {regStep === 1 ? "Organization Setup" : "Business Information"}
                                        </h2>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400">{regStep} of 2</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(regStep / 2) * 100}%` }}
                                        className="h-full bg-indigo-600"
                                    />
                                </div>
                            </div>
                        )}

                        {isLogin && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">Access your secure professional portal.</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {isLogin ? (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    required
                                                    placeholder="name@company.com"
                                                    className="bg-slate-50 border-slate-100 h-12 pl-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Label>
                                                <button type="button" onClick={handlePasswordReset} className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 transition-colors">Forgot Password?</button>
                                            </div>
                                            <div className="relative group">
                                                <Shield className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    required
                                                    placeholder="••••••••"
                                                    className="bg-slate-50 border-slate-100 h-12 pl-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <>
                                        {regStep === 1 && (
                                            <motion.div
                                                key="reg1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Work Email</Label>
                                                    <div className="relative group">
                                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input
                                                            type="email"
                                                            value={email}
                                                            onChange={e => setEmail(e.target.value)}
                                                            required
                                                            placeholder="official@company.com"
                                                            className="bg-slate-50 border-slate-100 h-12 pl-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</Label>
                                                    <div className="relative group">
                                                        <Shield className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                        <Input
                                                            type="password"
                                                            value={password}
                                                            onChange={e => setPassword(e.target.value)}
                                                            required
                                                            placeholder="Minimum 6 characters"
                                                            className="bg-slate-50 border-slate-100 h-12 pl-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {regStep === 2 && (
                                            <motion.div
                                                key="reg2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-5"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Company Name</Label>
                                                        <Input
                                                            value={companyName}
                                                            onChange={e => setCompanyName(e.target.value)}
                                                            placeholder="Legal Name"
                                                            className="bg-slate-50 border-slate-100 h-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 transition-all text-sm font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tax ID / GST</Label>
                                                        <Input
                                                            value={regNo}
                                                            maxLength={15}
                                                            onChange={e => setRegNo(e.target.value.toUpperCase().slice(0, 15))}
                                                            placeholder="Number"
                                                            className="bg-slate-50 border-slate-100 h-11 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 transition-all text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Website</Label>
                                                    <div className="relative">
                                                        <Globe className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
                                                        <Input
                                                            value={website}
                                                            onChange={e => setWebsite(e.target.value)}
                                                            placeholder="https://company.com"
                                                            className="bg-slate-50 border-slate-100 h-11 pl-10 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600/30 transition-all text-sm font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Office Address</Label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
                                                        <textarea
                                                            value={address}
                                                            onChange={e => setAddress(e.target.value)}
                                                            placeholder="Registered Business Address"
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm p-3 pl-10 h-24 outline-none focus:bg-white focus:border-indigo-600/30 transition-all resize-none font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-2 flex items-start gap-3 px-1 cursor-pointer group" onClick={() => setTermsAccepted(!termsAccepted)}>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border-2 transition-all flex items-center justify-center shrink-0 mt-0.5",
                                                        termsAccepted ? "bg-indigo-600 border-indigo-600" : "border-slate-200 bg-white group-hover:border-indigo-300"
                                                    )}>
                                                        {termsAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-medium leading-tight">
                                                        I agree to the <Link href="/terms" target="_blank" className="text-indigo-600 font-bold hover:underline">Terms of Service</Link> and acknowledge the data sovereignty policies.
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {regStep === 3 && (
                                            <motion.div
                                                key="reg3"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="py-10 text-center"
                                            >
                                                <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-emerald-100 animate-pulse">
                                                    <Mail className="w-10 h-10 text-emerald-600" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-900 mb-3">Check your Inbox</h3>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-6 px-4 font-medium">
                                                    A verification link has been sent to <span className="text-slate-900 font-bold">{email}</span>. Please verify your email to activate your account.
                                                </p>

                                                <div className="mx-6 p-4 bg-amber-50 rounded-2xl border border-amber-100/50 mb-8 text-left">
                                                    <div className="flex items-start gap-3">
                                                        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="font-bold text-amber-900 text-[10px] uppercase tracking-wider mb-1">Important: Check Spam</p>
                                                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                                                If you don't see the email, please check your **spam or junk folder**. Gmail, Outlook, and other providers occasionally flag automated system messages to protect your security.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => { setIsLogin(true); setRegStep(1); setMsg(""); }}
                                                    className="w-full h-12 bg-slate-900 text-white font-bold hover:bg-slate-800 rounded-xl transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
                                                >
                                                    Back to Login
                                                </Button>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Flash Messages */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3"
                                >
                                    <Shield className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span className="text-xs font-bold text-rose-800 leading-tight">{error}</span>
                                </motion.div>
                            )}

                            {msg && !error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-bold text-emerald-800 leading-tight">{msg}</span>
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            {regStep < 3 && (
                                <div className="flex gap-4 pt-4">
                                    {!isLogin && regStep === 2 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setRegStep(1)}
                                            className="h-12 w-14 border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-900 transition-all flex items-center justify-center p-0"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={loading || (!isLogin && regStep === 2 && !termsAccepted)}
                                        className={cn(
                                            "flex-1 h-12 font-bold rounded-xl border-0 transition-all active:scale-[0.98]",
                                            (loading || (!isLogin && regStep === 2 && !termsAccepted))
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                                : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.25)]"
                                        )}
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <div className="flex items-center justify-center gap-2">
                                                {isLogin ? "Sign In" : (regStep === 1 ? "Organization Setup" : "Complete Registration")}
                                                {regStep === 1 && !loading && !isLogin && <ArrowRight className="w-4 h-4" />}
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Footer / Alt Actions */}
                    <div className="bg-slate-50/50 border-t border-slate-100 p-8 text-center">
                        <p className="text-sm text-slate-500 font-medium tracking-tight">
                            {isLogin ? "Looking to register as an Organization?" : "Employer already registered?"}{" "}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setRegStep(1);
                                    setError("");
                                    setMsg("");
                                }}
                                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors ml-1"
                            >
                                {isLogin ? "Register Here" : "Login Now"}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Visual Trust Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 flex justify-center items-center gap-6 text-slate-400"
                >
                    <div className="flex items-center gap-1.5 grayscale opacity-60">
                        <Building className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">Enterprise Ready</span>
                    </div>
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <div className="flex items-center gap-1.5 grayscale opacity-60">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">Secure Platform</span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
