"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X, Clock, AlertTriangle, PartyPopper, Info } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

export function AnnouncementPopup() {
    const { announcements } = useApp();
    const { user } = useAuth();
    const [activeAnnouncement, setActiveAnnouncement] = useState<any>(null);

    useEffect(() => {
        if (!user || announcements.length === 0) return;

        const now = Date.now();
        const threeHoursAgo = now - (3 * 60 * 60 * 1000);

        const recentAnnouncements = [...announcements]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .filter(ann => {
                const createdAt = new Date(ann.createdAt).getTime();
                const startTime = ann.startTime ? new Date(ann.startTime).getTime() : createdAt;
                const endTime = ann.endTime ? new Date(ann.endTime).getTime() : Infinity;

                // Show if currently Live OR if created within 3 hours
                const isUrgent = ann.type === "Urgent";
                const isNew = (now - createdAt) < (3 * 60 * 60 * 1000);
                const isLive = now >= startTime && now <= endTime;

                return (isNew || isUrgent) && isLive;
            });

        if (recentAnnouncements.length > 0) {
            // Check if user has already dismissed these specific announcements
            const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_announcements_${user.email}`) || "[]");
            const nonDismissed = recentAnnouncements.find(ann => !dismissedIds.includes(ann.id));

            if (nonDismissed) {
                setActiveAnnouncement(nonDismissed);
            }
        }
    }, [announcements, user]);

    const handleDismiss = () => {
        if (!activeAnnouncement || !user) return;

        const dismissedIds = JSON.parse(localStorage.getItem(`dismissed_announcements_${user.email}`) || "[]");
        localStorage.setItem(`dismissed_announcements_${user.email}`, JSON.stringify([...dismissedIds, activeAnnouncement.id]));
        setActiveAnnouncement(null);
    };

    if (!activeAnnouncement) return null;

    const getTypeStyles = (type: string) => {
        switch (type) {
            case "Urgent": return { bg: "bg-rose-600", text: "text-white", icon: AlertTriangle };
            case "Event": return { bg: "bg-amber-500", text: "text-white", icon: PartyPopper };
            case "Update": return { bg: "bg-indigo-600", text: "text-white", icon: Info };
            default: return { bg: "bg-emerald-600", text: "text-white", icon: Megaphone };
        }
    };

    const styles = getTypeStyles(activeAnnouncement.type);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
            >
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden">
                    <div className={cn("p-4 flex items-center justify-between", styles.bg)}>
                        <div className="flex items-center gap-2">
                            <styles.icon className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">New {activeAnnouncement.type} Notification</span>
                        </div>
                        <button onClick={handleDismiss} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6">
                        <h4 className="text-base font-bold text-slate-900 mb-2 leading-tight">
                            {activeAnnouncement.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                            {activeAnnouncement.message}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                                <Clock className="w-3 h-3" /> 3h window active
                            </div>
                            <Button
                                size="sm"
                                className="h-8 rounded-xl text-[10px] px-4 font-bold uppercase tracking-wider"
                                onClick={() => {
                                    window.location.href = "/dashboard/announcements";
                                    handleDismiss();
                                }}
                            >
                                Read Full Story
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
