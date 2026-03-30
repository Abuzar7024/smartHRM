"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, applyActionCode } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "employer" | "employee" | null;

interface AuthContextType {
    user: User | null;
    role: Role;
    status: string | null;
    companyName: string | null;
    lastSeen?: number;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    status: null,
    companyName: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Handle email verification action codes
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');

        if (mode === 'verifyEmail' && oobCode) {
            applyActionCode(auth, oobCode)
                .then(() => {
                    // Email verified successfully
                    // Remove the query params from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('mode');
                    url.searchParams.delete('oobCode');
                    window.history.replaceState({}, '', url.toString());
                    // Optionally show a success message or redirect
                    alert('Email verified successfully! You can now log in.');
                })
                .catch((error) => {
                    console.error('Error verifying email:', error);
                    alert('Error verifying email. Please try again or contact support.');
                });
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Real-time listener for user profile
                const profileUnsub = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setRole(data.role as Role);
                        setStatus(data.status || "active");
                        setCompanyName(data.companyName || null);
                    } else {
                        // Default to employee if profile missing
                        setRole("employee");
                        setStatus("active");
                        setCompanyName(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user details", error);
                    setRole("employee");
                    setStatus("active");
                    setLoading(false);
                });

                return () => profileUnsub();
            } else {
                setRole(null);
                setStatus(null);
                setCompanyName(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Presence system: update "lastSeen" every 2 minutes while active
    useEffect(() => {
        if (!user) return;

        const updatePresence = async () => {
            try {
                const { setDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                await setDoc(doc(db, "users", user.uid), { lastSeen: Date.now() }, { merge: true });
            } catch (e) {
                console.error("Presence update failed:", e);
            }
        };

        updatePresence();
        const interval = setInterval(updatePresence, 120000); // 2 minutes
        return () => clearInterval(interval);
    }, [user]);

    const logout = async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        await auth.signOut();
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, role, status, companyName, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
