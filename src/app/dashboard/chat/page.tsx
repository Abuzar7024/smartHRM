"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MessageSquare, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
    const { role, user } = useAuth();
    const { employees, chatMessages, sendMessage } = useApp();
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // If employer, can chat with any employee.
    // If employee, defaults to HR/Employer. Since there isn't a single 'employer', let's say they can chat with anyone or specifically look for employers.
    // For simplicity, employees list is available. For employee role, let's filter out themselves.
    const availableUsers = employees.filter(e => e.email !== user?.email);

    const activeChat = chatMessages.filter(msg =>
        (msg.sender === user?.email && msg.receiver === selectedUserEmail) ||
        (msg.receiver === user?.email && msg.sender === selectedUserEmail)
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserEmail || !user?.email) return;

        await sendMessage({
            sender: user.email,
            receiver: selectedUserEmail,
            text: newMessage.trim(),
        });
        setNewMessage("");
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900">Direct Messaging</h1>
                <p className="text-sm text-slate-500">Secure real-time communication.</p>
            </div>

            <Card className="flex-1 flex overflow-hidden border-slate-200 shadow-sm rounded-xl">
                {/* User List Sidebar */}
                <div className="w-1/3 max-w-[300px] border-r border-slate-200 bg-slate-50 flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Directory</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full">
                        {availableUsers.map(emp => {
                            // Find unread count or last message logic? Simple implementation for now.
                            return (
                                <button
                                    key={emp.id}
                                    onClick={() => setSelectedUserEmail(emp.email)}
                                    className={cn(
                                        "w-full text-left p-4 border-b border-slate-100 flex items-center gap-3 transition-colors",
                                        selectedUserEmail === emp.email ? "bg-indigo-50 border-l-4 border-l-indigo-600" : "hover:bg-slate-100"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {emp.name[0].toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{emp.role}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedUserEmail ? (
                        <>
                            <div className="p-4 border-b border-slate-200 shadow-sm flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{employees.find(e => e.email === selectedUserEmail)?.name || selectedUserEmail}</h3>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                {activeChat.map(msg => {
                                    const isMe = msg.sender === user?.email;
                                    return (
                                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[70%] rounded-2xl p-3 shadow-sm",
                                                isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                            )}>
                                                <p className="text-sm">{msg.text}</p>
                                                <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-indigo-200" : "text-slate-400")}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            <div className="p-4 border-t border-slate-200 bg-white">
                                <form onSubmit={handleSend} className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 rounded-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    />
                                    <Button type="submit" variant="corporate" className="rounded-full w-10 h-10 p-0 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700">
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
                            <p className="text-sm">Choose a colleague from the directory to start messaging.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
