"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, User, Sparkles, MessageSquare, ChevronRight, PieChart, Calendar, Briefcase, Users, Clock, Trash2, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GEMINI_API_KEY = "AIzaSyBkPJzt5gMHtPDjbYVHGjsik7h3tjE6v0w";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type Message = {
    role: "user" | "assistant";
    content: string;
    data?: any;
    action?: string;
    type?: string;
};

export default function HRAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your HR Assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { employees, leaves, tasks, attendance, leaveBalances } = useApp();
    const { user, role } = useAuth();
    const [activeView, setActiveView] = useState<"suggestions" | "chat">("suggestions");

    // Dynamic Suggestion Engine
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
        const list = [];
        const now = new Date().toISOString().split('T')[0];

        // 1. Leave Suggestions
        const pending = (leaves || []).filter(l => l.status === "Pending").length;
        if (role === "employer" && pending > 0) {
            list.push({
                title: "Pending Approvals",
                desc: `You have ${pending} leave requests waiting.`,
                action: "get_pending_leave_requests",
                icon: <Briefcase className="w-4 h-4 text-amber-500" />,
                color: "amber"
            });
        }

        // 2. Task Suggestions
        const myTasks = (tasks || []).filter(t => (t.assigneeEmails || []).includes(user?.email || "") && t.status !== "Completed").length;
        if (myTasks > 0) {
            list.push({
                title: "Your Tasks",
                desc: `Complete ${myTasks} active assignments.`,
                action: "get_my_tasks",
                icon: <ChevronRight className="w-4 h-4 text-indigo-500" />,
                color: "indigo"
            });
        }

        // 3. General Insights
        const onLeave = (leaves || []).filter(l => l.status === "Approved" && now >= l.from && now <= l.to).length;
        list.push({
            title: "Daily Coverage",
            desc: onLeave > 0 ? `${onLeave} people away today.` : "Full team present today.",
            action: "get_today_leave_list",
            icon: <Users className="w-4 h-4 text-emerald-500" />,
            color: "emerald"
        });

        // 4. Attendance
        const late = (attendance || []).filter(a => a.timestamp.split('T')[0] === now && a.type === "Clock In" && new Date(a.timestamp).getHours() >= 10).length;
        if (role === "employer" && late > 0) {
            list.push({
                title: "Late Arrivals",
                desc: `${late} employees clocked in late today.`,
                action: "get_late_employees_today",
                icon: <Clock className="w-4 h-4 text-rose-500" />,
                color: "rose"
            });
        }

        setSuggestions(list);
    }, [leaves, tasks, attendance, role, user]);

    const handleSuggestionClick = (actionName: string) => {
        setActiveView("chat");
        handleSend({ action: actionName });
    };

    const clearChat = () => {
        setMessages([]);
        setActiveView("suggestions");
        toast.info("Hub reset");
    };

    const handleSend = async (inputVal?: any) => {
        // Handle both direct actions (from suggestions) and raw text (from chat)
        let query = "";
        let preDefinedAction = null;

        if (typeof inputVal === "object" && inputVal.action) {
            preDefinedAction = inputVal.action;
            query = `Showing ${preDefinedAction.replace(/_/g, " ")}`;
        } else {
            query = (typeof inputVal === "string" ? inputVal : input).trim();
        }

        if (!query && !preDefinedAction || isLoading) return;

        setInput("");
        if (!preDefinedAction) setMessages(prev => [...prev, { role: "user", content: query }]);
        setIsLoading(true);
        setActiveView("chat");

        try {
            let structuredAction;

            if (preDefinedAction) {
                structuredAction = { action: preDefinedAction };
            } else {
                // Get structured action from Gemini using strict rules
                const prompt = `
                You are an AI HR Assistant inside a SmartHR HRMS system.
                Your job is to convert user questions into structured JSON actions that the backend can execute.
                
                IMPORTANT RULES:
                1. Only respond with valid JSON.
                2. Do NOT explain anything.
                3. Do NOT say you are unsure.
                4. Return: { "action": "action_name" }

                Supported actions:
                - get_today_leave_list
                - get_today_leave_count
                - get_pending_leave_requests
                - get_leave_balance
                - get_late_employees_today
                - get_my_tasks
                - get_tasks_assigned_by_me
                - get_attendance_summary

                User Question: "${query}"
                `;

                const response = await fetch(GEMINI_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.1,
                            topP: 1,
                        }
                    })
                });

                const result = await response.json();
                const aiRawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
                const jsonMatch = aiRawText.match(/\{[\s\S]*\}/);
                structuredAction = JSON.parse(jsonMatch ? jsonMatch[0] : aiRawText);
            }

            const hrResponse = executeHRAction(structuredAction);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: hrResponse.message,
                data: hrResponse.data,
                action: structuredAction.action,
                type: hrResponse.type
            }]);

        } catch (error) {
            console.error("AI Assistant Error:", error);
            toast.error("I'm having trouble connecting to my brain right now.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const executeHRAction = (actionObj: any) => {
        const { action } = actionObj;
        const now = new Date().toISOString().split('T')[0];
        const normalizedAction = (action || "").toLowerCase().trim();

        switch (normalizedAction) {
            case "get_today_leave_list": {
                const onLeave = (leaves || []).filter(l => l.status === "Approved" && now >= l.from && now <= l.to);
                return {
                    message: onLeave.length > 0 ? `You have ${onLeave.length} employees on leave today.` : "No employees are on leave today.",
                    data: onLeave,
                    type: "leave_list"
                };
            }
            case "get_today_leave_count": {
                const count = (leaves || []).filter(l => l.status === "Approved" && now >= l.from && now <= l.to).length;
                return {
                    message: count > 0 ? `There are ${count} employees on leave today.` : "No employees are on leave today.",
                    data: count,
                    type: "stat"
                };
            }
            case "get_pending_leave_requests": {
                if (role !== "employer") return { message: "I'm sorry, only HR managers can view all pending requests.", data: null };
                const pending = (leaves || []).filter(l => l.status === "Pending");
                return {
                    message: pending.length > 0 ? `You have ${pending.length} pending leave requests.` : "There are no pending leave requests.",
                    data: pending,
                    type: "leave_list"
                };
            }
            case "get_leave_balance": {
                const balances = (leaveBalances || []).filter(b => b.empEmail === user?.email && b.year === new Date().getFullYear());
                const total = balances.reduce((acc, b) => acc + b.balance, 0);
                return {
                    message: `You have ${total} days of leave remaining in your balance.`,
                    data: balances,
                    type: "balance"
                };
            }
            case "get_late_employees_today": {
                const late = (attendance || []).filter(a => {
                    const isToday = a.timestamp.split('T')[0] === now;
                    return isToday && a.type === "Clock In" && new Date(a.timestamp).getHours() >= 10;
                });
                return {
                    message: late.length > 0 ? `I've found ${late.length} employees who clocked in late today.` : "Everyone clocked in on time today.",
                    data: late,
                    type: "attendance_list"
                };
            }
            case "get_my_tasks": {
                const myTasks = (tasks || []).filter(t => (t.assigneeEmails || []).includes(user?.email || ""));
                return {
                    message: myTasks.length > 0 ? `You have ${myTasks.length} assigned tasks.` : "You currently have no assigned tasks.",
                    data: myTasks,
                    type: "task_list"
                };
            }
            case "get_tasks_assigned_by_me": {
                const byMe = (tasks || []).filter(t => t.creatorEmail === user?.email);
                return {
                    message: byMe.length > 0 ? `You have assigned ${byMe.length} tasks to your team.` : "You haven't assigned any tasks recently.",
                    data: byMe,
                    type: "task_list"
                };
            }
            case "get_attendance_summary": {
                const myAttendance = (attendance || []).filter(a => a.empEmail === user?.email).slice(0, 5);
                return {
                    message: "Here is your recent attendance activity.",
                    data: myAttendance,
                    type: "attendance_list"
                };
            }
            case "unknown_request":
            default:
                return {
                    message: "I can help you with leave records, tasks, or your attendance summary. What would you like to check?",
                    data: null
                };
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full bg-slate-900 border-2 border-white/20 shadow-2xl flex items-center justify-center text-white"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        className="fixed bottom-24 right-8 z-[60] w-[420px] h-[650px] bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 bg-slate-900 text-white relative">
                            <div className="absolute top-0 right-0 p-8 flex gap-2">
                                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">AI Insights</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Intelligent Engine Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/30">
                            {activeView === "suggestions" ? (
                                <div className="p-8 space-y-8">
                                    {/* Welcome */}
                                    <div>
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">Personal Assistant</p>
                                        <h2 className="text-3xl font-black text-slate-900 leading-tight">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'},<br />{(user?.email || "User").split('@')[0]}</h2>
                                    </div>

                                    {/* Suggestions Grid */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Actions</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {suggestions.map((s, i) => (
                                                <motion.button
                                                    key={i}
                                                    whileHover={{ x: 8, scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleSuggestionClick(s.action)}
                                                    className={cn(
                                                        "group flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[28px] text-left shadow-sm hover:shadow-md hover:border-indigo-100 transition-all",
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner",
                                                        s.color === "amber" ? "bg-amber-50" : s.color === "indigo" ? "bg-indigo-50" : s.color === "rose" ? "bg-rose-50" : "bg-emerald-50"
                                                    )}>
                                                        {s.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 truncate">{s.title}</h4>
                                                        <p className="text-xs text-slate-500 truncate">{s.desc}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 space-y-6">
                                    <button
                                        onClick={() => setActiveView("suggestions")}
                                        className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Back to Suggestions
                                    </button>

                                    {messages.map((msg, i) => (
                                        <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                                            {msg.content && (
                                                <div className={cn(
                                                    "max-w-[85%] p-5 rounded-[30px] text-sm leading-relaxed font-medium",
                                                    msg.role === "user"
                                                        ? "bg-slate-900 text-white rounded-tr-none shadow-xl"
                                                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            )}

                                            {/* Action Data Rendering */}
                                            {msg.data !== undefined && msg.data !== null && msg.role === "assistant" && (
                                                <div className="mt-4 w-full animate-in zoom-in-95 duration-300">
                                                    {msg.type === "stat" && (
                                                        <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[30px] text-center shadow-lg shadow-indigo-200">
                                                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Live Result</p>
                                                            <p className="text-4xl font-black text-white">{msg.data}</p>
                                                        </div>
                                                    )}

                                                    {msg.type === "leave_list" && Array.isArray(msg.data) && (
                                                        <div className="space-y-3">
                                                            {msg.data.length === 0 ? (
                                                                <p className="text-center py-8 text-slate-400 font-medium italic">Empty list</p>
                                                            ) : msg.data.slice(0, 5).map((l: any, idx: number) => (
                                                                <div key={idx} className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm flex justify-between items-center group hover:scale-[1.02] transition-transform">
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-slate-900 truncate text-sm">{l.empName}</p>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{l.type}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-[9px]">{l.days}D</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.type === "task_list" && Array.isArray(msg.data) && (
                                                        <div className="space-y-3">
                                                            {msg.data.length === 0 ? (
                                                                <p className="text-center py-8 text-slate-400 font-medium italic">No active tasks</p>
                                                            ) : msg.data.slice(0, 5).map((t: any, idx: number) => (
                                                                <div key={idx} className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm flex items-center gap-4">
                                                                    <div className={cn("w-3 h-3 rounded-full border-2 border-white shadow-sm", t.status === "Completed" ? "bg-emerald-500" : "bg-indigo-500")} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-slate-800 truncate text-sm">{t.title}</p>
                                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Due {new Date(t.dueDate).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.type === "balance" && Array.isArray(msg.data) && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {msg.data.map((b: any, idx: number) => (
                                                                <div key={idx} className="p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm text-center">
                                                                    <p className="text-[9px] text-slate-400 font-black uppercase truncate mb-1">{b.type}</p>
                                                                    <p className="text-2xl font-black text-slate-900">{b.balance}</p>
                                                                    <p className="text-[8px] text-slate-400 font-bold">DAYS</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.type === "attendance_list" && Array.isArray(msg.data) && (
                                                        <div className="space-y-3">
                                                            {msg.data.map((a: any, idx: number) => (
                                                                <div key={idx} className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                                            <Clock className="w-4 h-4 text-indigo-400" />
                                                                        </div>
                                                                        <span className="font-bold text-slate-700 text-xs truncate max-w-[120px]">{a.empEmail?.split('@')[0]}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-black text-slate-900 text-sm">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{a.type}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-center gap-3 text-indigo-500 font-bold text-[10px] uppercase tracking-widest animate-pulse p-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <span>Processing Intelligence...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Search/Ask Bar */}
                        <div className="p-8 bg-white border-t border-slate-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSend()}
                                    placeholder="Search for data or ask anything..."
                                    className="w-full h-16 pl-6 pr-16 rounded-[28px] bg-slate-50 border border-slate-100 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all font-medium placeholder:text-slate-400"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-3 top-3 w-10 h-10 rounded-[20px] bg-slate-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-lg"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Minimal Button component if not available
function Button({ children, className, variant, size, ...props }: any) {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                variant === "ghost" ? "hover:bg-slate-100 text-slate-600" : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
                size === "icon-sm" ? "h-8 w-8" : "h-10 px-4 py-2",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
