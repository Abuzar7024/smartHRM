"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "employer" | "employee" | null;

interface AuthContextType {
    user: User | null;
    role: Role;
    status: string | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    status: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<Role>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setRole(data.role as Role);
                        setStatus(data.status || "active");
                    } else {
                        setRole("employee");
                        setStatus("active");
                    }
                } catch (error) {
                    console.error("Error fetching user role", error);
                    setRole("employee");
                    setStatus("active");
                }
            } else {
                setRole(null);
                setStatus(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        await auth.signOut();
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, role, status, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
