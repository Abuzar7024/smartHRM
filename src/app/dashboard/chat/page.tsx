"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { MessageSquare, Send, Search, Trash2, Reply, SmilePlus, X, CheckCircle2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

// ── Local hook to get all registered users from /users collection ──
function useAllUsers(companyName?: string) {
    const [users, setUsers] = useState<{ uid: string; email: string; role: string; companyName?: string }[]>([]);
    useEffect(() => {
        if (!companyName) {
            setUsers([]);
            return;
        }
        const unsub = onSnapshot(query(collection(db, "users"), where("companyName", "==", companyName)), snap => {
            setUsers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as { email: string; role: string; companyName?: string }) })));
        });
        return () => unsub();
    }, [companyName]);
    return users;
}

export default function ChatPage() {
    const { user, companyName } = useAuth();
    const { employees, chatMessages, sendMessage, markChatRead, chatReadTimestamps, clearChat, reactToMessage, deleteMessage } = useApp();
    const allUsers = useAllUsers(companyName ?? undefined);
    const [isClearing, setIsClearing] = useState(false);

    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [search, setSearch] = useState("");
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Build a merged directory: employees collection + all registered users (so employer is always visible)
    const allKnownEmails = new Set<string>();
    const directory: { email: string; name: string; role: string }[] = [];

    employees.forEach(e => {
        if (e.email !== user?.email && !allKnownEmails.has(e.email)) {
            allKnownEmails.add(e.email);
            directory.push({ email: e.email, name: e.name, role: e.role });
        }
    });
    allUsers.forEach(u => {
        if (u.email !== user?.email && !allKnownEmails.has(u.email)) {
            allKnownEmails.add(u.email);
            directory.push({ email: u.email, name: u.email.split("@")[0], role: u.role });
        }
    });

    const filteredDirectory = directory
        .map(contact => {
            const msgs = chatMessages.filter(m =>
                (m.sender === user?.email && m.receiver === contact.email) ||
                (m.receiver === user?.email && m.sender === contact.email)
            );
            const lastMsg = msgs.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0];
            const lastRead = chatReadTimestamps[contact.email] || 0;
            const unread = chatMessages.filter(
                m => m.sender === contact.email &&
                    m.receiver === user?.email &&
                    new Date(m.timestamp).getTime() > lastRead
            ).length;
            return { ...contact, lastMsg, unread, lastTs: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0 };
        })
        .sort((a, b) => {
            if (b.unread !== a.unread) return b.unread - a.unread;
            if (b.lastTs !== a.lastTs) return b.lastTs - a.lastTs;
            return a.name.localeCompare(b.name);
        })
        .filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase())
        );

    const activeChat = chatMessages
        .filter(msg =>
            (msg.sender === user?.email && msg.receiver === selectedUserEmail) ||
            (msg.receiver === user?.email && msg.sender === selectedUserEmail)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        if (selectedUserEmail && user?.email && activeChat.some(m => m.sender === selectedUserEmail)) {
            markChatRead(user.email, selectedUserEmail);
        }
    }, [activeChat.length, selectedUserEmail]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserEmail || !user?.email) return;

        const msgPayload: Omit<ChatMessage, "id" | "timestamp"> = {
            sender: user.email,
            receiver: selectedUserEmail,
            text: newMessage.trim()
        };

        if (replyingTo?.id) {
            msgPayload.replyToId = replyingTo.id;
        }

        await sendMessage(msgPayload);
        setNewMessage("");
        setReplyingTo(null);
    };

    const selectedContact = directory.find(d => d.email === selectedUserEmail);

    const handleSelectContact = (email: string) => {
        setSelectedUserEmail(email);
        if (user?.email) markChatRead(user.email, email);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <div className="px-8 py-5 bg-white border-b border-slate-200 flex-shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Chat</h1>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Secure internal communications</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden z-10 p-2 md:p-4 gap-2 md:gap-4 max-w-7xl mx-auto w-full">
                {/* ── Sidebar / Directory ── */}
                <div className={cn("w-full md:w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex-col overflow-hidden", selectedUserEmail ? "hidden md:flex" : "flex")}>
                    <div className="p-5 border-b border-slate-100/50">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search directory..."
                                className="pl-11 h-10 text-sm bg-slate-50 border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full p-3 space-y-1 custom-scrollbar">
                        {filteredDirectory.map(contact => {
                            const hasUnread = contact.unread > 0;
                            const isSelected = selectedUserEmail === contact.email;
                            return (
                                <button
                                    key={contact.email}
                                    onClick={() => handleSelectContact(contact.email)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all duration-300 relative group",
                                        isSelected
                                            ? "bg-gradient-to-r from-indigo-50 to-white shadow-sm border border-indigo-100"
                                            : "hover:bg-slate-50 border border-transparent"
                                    )}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-indigo-600 rounded-r-full"
                                        />
                                    )}
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border",
                                        isSelected ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className={cn("text-sm font-semibold truncate transition-colors", isSelected ? "text-slate-900" : "text-slate-700")}>{contact.name}</p>
                                            <AnimatePresence>
                                                {hasUnread && (
                                                    <motion.span
                                                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                                        className="w-5 h-5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0"
                                                    >
                                                        {contact.unread}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <p className={cn(
                                            "text-xs truncate font-medium",
                                            hasUnread ? "text-indigo-600 font-bold" : "text-slate-400"
                                        )}>
                                            {contact.lastMsg?.text || contact.role}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredDirectory.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 opacity-30">
                                <Search className="w-8 h-8 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">No users found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Main Chat Area ── */}
                <div className={cn("flex-1 flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", !selectedUserEmail ? "hidden md:flex" : "flex")}>
                    {selectedUserEmail && selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex items-center gap-3 md:gap-4 bg-white shrink-0">
                                <button onClick={() => setSelectedUserEmail("")} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                    {selectedContact.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-lg text-slate-900 leading-tight">{selectedContact.name}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedContact.role} • Online</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="p-3 w-10 h-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold shadow-sm border border-transparent hover:border-rose-100 transition-all shrink-0"
                                    onClick={async () => {
                                        if (confirm("Clear all messages?")) {
                                            setIsClearing(true);
                                            setTimeout(async () => {
                                                await clearChat(user!.email!, selectedUserEmail);
                                                setIsClearing(false);
                                            }, 800);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 m-0 p-0" />
                                </Button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-6 relative scroll-smooth custom-scrollbar">
                                <AnimatePresence mode="popLayout">
                                    {activeChat.map((msg, idx) => {
                                        const isMe = msg.sender === user?.email;
                                        const replyTo = msg.replyToId ? activeChat.find(m => m.id === msg.replyToId) : null;
                                        const showAvatar = idx === activeChat.length - 1 || activeChat[idx + 1].sender !== msg.sender;

                                        return (
                                            <motion.div
                                                layout="position"
                                                key={msg.id || idx}
                                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={isClearing ? {
                                                    opacity: 0, y: 100, rotate: Math.random() * 20 - 10, scale: 0.8,
                                                    transition: { duration: 0.6, ease: "backIn", delay: idx * 0.02 }
                                                } : { opacity: 0, scale: 0.8 }}
                                                className={cn("flex group items-end gap-3", isMe ? "justify-end" : "justify-start")}
                                            >
                                                {!isMe && showAvatar && (
                                                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0 mb-1">
                                                        {selectedContact.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {!isMe && !showAvatar && <div className="w-8 shrink-0" />}

                                                <div className={cn("flex max-w-[75%] items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                                                    <div className={cn(
                                                        "px-4 py-3 shadow-sm relative transition-all duration-300",
                                                        isMe
                                                            ? "bg-slate-900 text-white rounded-xl rounded-br-sm border border-slate-800"
                                                            : "bg-slate-50 border border-slate-200 text-slate-800 rounded-xl rounded-bl-sm"
                                                    )}>
                                                        {replyTo && (
                                                            <div className={cn(
                                                                "text-[10px] mb-2 p-2 rounded-xl border-l-2 max-w-[200px] truncate transition-colors",
                                                                isMe ? "bg-white/10 border-white font-medium" : "bg-slate-50 border-indigo-400 font-medium text-slate-500"
                                                            )}>
                                                                <span className="opacity-60 font-black text-[9px] uppercase tracking-wider block mb-0.5">Replying to</span>
                                                                "{replyTo.text}"
                                                            </div>
                                                        )}
                                                        <p className="text-[15px] whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>

                                                        {/* Timestamp and Reactions */}
                                                        <div className="flex items-center justify-end mt-1.5 gap-2">
                                                            {msg.reaction && (
                                                                <motion.span
                                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                    className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md shadow-sm"
                                                                >
                                                                    {msg.reaction}
                                                                </motion.span>
                                                            )}
                                                            <span className={cn(
                                                                "text-[9px] font-bold uppercase tracking-wider",
                                                                isMe ? "text-indigo-100" : "text-slate-400"
                                                            )}>
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {isMe && <CheckCircle2 className="w-3 h-3 text-indigo-200" />}
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions (Hover) */}
                                                    {!isClearing && (
                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mt-2">
                                                            {!isMe && (
                                                                <button onClick={() => reactToMessage(msg.id!, msg.reaction ? null : "👍")} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all">
                                                                    <SmilePlus className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button onClick={() => setReplyingTo(msg)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-100 rounded-full shadow-sm text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all">
                                                                <Reply className="w-4 h-4" />
                                                            </button>
                                                            {isMe && (
                                                                <button onClick={() => deleteMessage(msg.id!)} className="w-8 h-8 flex items-center justify-center bg-white border border-rose-100 rounded-full shadow-sm text-rose-400 hover:text-rose-600 hover:scale-110 transition-all">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                {activeChat.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                                        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                                            <MessageSquare className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900">Start the conversation</h4>
                                        <p className="text-sm text-slate-500 mt-2">Send a message to {selectedContact.name} below.</p>
                                    </div>
                                )}
                                <div ref={bottomRef} className="h-4" />
                            </div>

                            {/* Reply Context Bar */}
                            <AnimatePresence>
                                {replyingTo && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: 10 }}
                                        className="px-6 py-3 bg-indigo-50/80 backdrop-blur-sm border-t border-indigo-100 flex items-center justify-between"
                                    >
                                        <div className="flex-1 truncate border-l-2 border-indigo-500 pl-3">
                                            <p className="text-[10px] font-black tracking-widest uppercase text-indigo-600 mb-0.5 flex items-center gap-1">
                                                <Reply className="w-3 h-3" /> Replying to message
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 truncate">{replyingTo.text}</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm ml-4 shrink-0 transition-transform hover:rotate-90">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input Area */}
                            <div className="px-6 py-4 bg-white border-t border-slate-200">
                                <form onSubmit={handleSend} className="flex gap-3 items-end">
                                    <div className="flex-1 relative group">
                                        <Textarea
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend(e);
                                                }
                                            }}
                                            placeholder="Type your message here..."
                                            className="min-h-[44px] max-h-[160px] py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm transition-all resize-none custom-scrollbar"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className={cn(
                                            "rounded-xl w-11 h-11 shrink-0 flex items-center justify-center transition-all active:scale-95 group border mb-0.5",
                                            newMessage.trim() ? "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white" : "bg-slate-100 text-slate-400 shadow-none border-slate-200"
                                        )}
                                    >
                                        <Send className={cn("w-6 h-6 transition-transform", newMessage.trim() ? "group-hover:translate-x-1 group-hover:-translate-y-1" : "")} />
                                    </Button>
                                </form>
                                <div className="text-center mt-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><kbd className="font-sans">Enter</kbd> to send • <kbd className="font-sans">Shift + Enter</kbd> for new line</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            {/* Decorative empty state */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                <MessageSquare className="w-[400px] h-[400px]" />
                            </div>
                            <div className="z-10 text-center">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <MessageSquare className="w-8 h-8 text-slate-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select a conversation</h2>
                                <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto text-sm">Choose a teammate from the directory to start collaborating.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
