"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageSquare, Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Local hook to get all registered users from /users collection ──
function useAllUsers() {
    const [users, setUsers] = useState<{ uid: string; email: string; role: string; companyName?: string }[]>([]);
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "users"), snap => {
            setUsers(snap.docs.map(d => ({ uid: d.id, ...(d.data() as { email: string; role: string; companyName?: string }) })));
        });
        return () => unsub();
    }, []);
    return users;
}

export default function ChatPage() {
    const { user } = useAuth();
    const { employees, chatMessages, sendMessage } = useApp();
    const allUsers = useAllUsers();

    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [search, setSearch] = useState("");
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
            // Unread = messages received from this contact while this chat is NOT selected
            const unread = chatMessages.filter(
                m => m.sender === contact.email &&
                    m.receiver === user?.email &&
                    selectedUserEmail !== contact.email
            ).length;
            return { ...contact, lastMsg, unread, lastTs: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0 };
        })
        // Sort: unread first, then by most-recent message, then alphabetically
        .sort((a, b) => {
            if (b.unread !== a.unread) return b.unread - a.unread;
            if (b.lastTs !== a.lastTs) return b.lastTs - a.lastTs;
            return a.name.localeCompare(b.name);
        })
        .filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase())
        );

    // ── Real-time chat: already via onSnapshot in AppContext ──
    const activeChat = chatMessages
        .filter(msg =>
            (msg.sender === user?.email && msg.receiver === selectedUserEmail) ||
            (msg.receiver === user?.email && msg.sender === selectedUserEmail)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat.length, selectedUserEmail]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserEmail || !user?.email) return;
        await sendMessage({ sender: user.email, receiver: selectedUserEmail, text: newMessage.trim() });
        setNewMessage("");
    };

    const selectedContact = directory.find(d => d.email === selectedUserEmail);

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
            {/* ── Page Header ── */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
                <h1 className="text-xl font-bold text-slate-900">Direct Messaging</h1>
                <p className="text-xs text-slate-500">Real-time conversations — powered by Firestore live sync</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Sidebar: Contact Directory ── */}
                <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search people..."
                                className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
                            />
                        </div>
                    </div>
                    <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Directory ({filteredDirectory.length})</p>
                    <div className="flex-1 overflow-y-auto">
                        {filteredDirectory.length === 0 && (
                            <div className="p-6 text-center text-slate-400 text-sm">No contacts found.</div>
                        )}
                        {filteredDirectory.map(contact => {
                            const hasUnread = contact.unread > 0;
                            const isSelected = selectedUserEmail === contact.email;
                            return (
                                <button
                                    key={contact.email}
                                    onClick={() => setSelectedUserEmail(contact.email)}
                                    className={cn(
                                        "w-full text-left px-3 py-3 flex items-center gap-3 transition-all duration-150 border-b border-slate-100",
                                        isSelected
                                            ? "bg-indigo-50 border-l-[3px] border-l-indigo-600"
                                            : hasUnread
                                                ? "bg-blue-50/70 border-l-[3px] border-l-blue-500 hover:bg-blue-50"
                                                : "border-l-[3px] border-l-transparent hover:bg-slate-50"
                                    )}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm">
                                            {contact.name.charAt(0).toUpperCase()}
                                        </div>
                                        {hasUnread && !isSelected && (
                                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow">
                                                {contact.unread > 9 ? "9+" : contact.unread}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-sm truncate",
                                                hasUnread && !isSelected ? "font-bold text-slate-900" : "font-semibold text-slate-800"
                                            )}>
                                                {contact.name}
                                            </p>
                                            {contact.lastMsg && (
                                                <span className={cn(
                                                    "text-[10px] flex-shrink-0 ml-1",
                                                    hasUnread && !isSelected ? "text-blue-500 font-semibold" : "text-slate-400"
                                                )}>
                                                    {new Date(contact.lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-1 mt-0.5">
                                            {contact.lastMsg ? (
                                                <p className={cn(
                                                    "text-[11px] truncate flex-1",
                                                    hasUnread && !isSelected ? "text-slate-700 font-medium" : "text-slate-400"
                                                )}>
                                                    {contact.lastMsg.sender === user?.email ? "You: " : ""}{contact.lastMsg.text}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 truncate capitalize">{contact.role}</p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Right: Chat Area ── */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedUserEmail && selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center gap-3 shadow-sm flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-indigo-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                                    {selectedContact.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">{selectedContact.name}</h3>
                                    <p className="text-xs text-slate-400 capitalize">{selectedContact.role} · {selectedContact.email}</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[11px] text-emerald-600 font-semibold">Live</span>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/70">
                                {activeChat.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                        <MessageSquare className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No messages yet. Say hello! 👋</p>
                                    </div>
                                )}
                                {activeChat.map(msg => {
                                    const isMe = msg.sender === user?.email;
                                    return (
                                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                            {!isMe && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 self-end mb-1">
                                                    {selectedContact.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className={cn(
                                                "max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
                                                isMe
                                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                            )}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-indigo-200" : "text-slate-400")}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0">
                                <form onSubmit={handleSend} className="flex gap-2 items-center">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={`Message ${selectedContact.name}...`}
                                        className="flex-1 rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 h-10 text-sm"
                                        autoFocus
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="rounded-full w-10 h-10 p-0 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                <MessageSquare className="w-10 h-10 opacity-30" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
                                <p className="text-sm text-slate-400 mt-1">Choose someone from the directory to start chatting.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
