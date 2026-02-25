"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";

export type Employee = { id?: string; name: string; role: string; department: string; status: string; email: string; leaveBalance?: number; permissions?: string[]; joinDate?: string };
export type Leave = { id?: string; empName: string; empEmail: string; type: string; from: string; to: string; status: "Approved" | "Pending" | "Denied"; description: string };
export type Payroll = { id?: string; name: string; department: string; amount: string; status: string; date: string; empEmail: string; transactionId: string };
export type Attendance = { id?: string; empEmail: string; type: "Clock In" | "Clock Out"; timestamp: string };
export type Task = { id?: string; title: string; description: string; assigneeId: string; assigneeEmail: string; status: "Pending" | "In Progress" | "Completed"; priority: "Low" | "Medium" | "High"; dueDate: string; createdAt: string };
export type EmployeeDocument = { id?: string; empEmail: string; title: string; status: "Pending" | "Uploaded"; url?: string };
export type NotificationItem = { id?: string; title: string; message: string; timestamp: string; isRead: boolean; targetEmail?: string; targetRole?: "employer" | "employee" };
export type Team = { id?: string; name: string; leaderEmail: string; memberEmails: string[]; createdAt: string; type: "Permanent" | "Project-Based"; hierarchy: "Flat" | "Top-Down" | "Matrix" };
export type ChatMessage = { id?: string; sender: string; receiver: string; text: string; timestamp: string; };

interface AppContextType {
    employees: Employee[];
    addEmployee: (emp: Employee) => Promise<void>;
    removeEmployee: (id: string) => Promise<void>;
    updateLeaveBalance: (id: string, balance: number) => Promise<void>;
    updateEmployeePermissions: (id: string, permissions: string[]) => Promise<void>;

    leaves: Leave[];
    requestLeave: (leave: Leave) => Promise<void>;
    updateLeaveStatus: (id: string, status: "Approved" | "Denied") => Promise<void>;

    payroll: Payroll[];
    processPayroll: () => Promise<void>;
    requestPayslip: (email: string) => Promise<void>;

    attendance: Attendance[];
    clockIn: (email: string) => Promise<void>;
    clockOut: (email: string) => Promise<void>;

    tasks: Task[];
    addTask: (task: Task) => Promise<void>;
    updateTaskStatus: (id: string, status: "Pending" | "In Progress" | "Completed") => Promise<void>;

    documents: EmployeeDocument[];
    requestDocument: (email: string, title: string) => Promise<void>;
    uploadDocument: (id: string, url: string) => Promise<void>;

    notifications: NotificationItem[];
    createNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead">) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;

    teams: Team[];
    createTeam: (team: Omit<Team, "id" | "createdAt">) => Promise<void>;

    chatMessages: ChatMessage[];
    sendMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [payroll, setPayroll] = useState<Payroll[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        try {
            const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
                setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
            }, (error) => console.log("Firebase Employees Error Setup:", error.message));

            const unsubLeaves = onSnapshot(query(collection(db, "leaves"), orderBy("from", "desc")), (snapshot) => {
                setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leave)));
            }, (error) => console.log("Firebase Leaves Error Setup:", error.message));

            const unsubPayroll = onSnapshot(collection(db, "payroll"), (snapshot) => {
                setPayroll(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
            }, (error) => console.log("Firebase Payroll Error Setup:", error.message));

            const unsubAttendance = onSnapshot(query(collection(db, "attendance"), orderBy("timestamp", "desc")), (snapshot) => {
                setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
            }, (error) => console.log("Firebase Attendance Error Setup:", error.message));

            const unsubTasks = onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snapshot) => {
                setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
            }, (error) => console.log("Firebase Tasks Error Setup:", error.message));

            const unsubDocuments = onSnapshot(collection(db, "documents"), (snapshot) => {
                setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeDocument)));
            }, (error) => console.log("Firebase Docs Error Setup:", error.message));

            const unsubNotifications = onSnapshot(query(collection(db, "notifications"), orderBy("timestamp", "desc")), (snapshot) => {
                setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem)));
            }, (error) => console.log("Firebase Notifications Error Setup:", error.message));

            const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("createdAt", "desc")), (snapshot) => {
                setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
            }, (error) => console.log("Firebase Teams Error Setup:", error.message));

            const unsubChat = onSnapshot(query(collection(db, "chat_messages"), orderBy("timestamp", "asc")), (snapshot) => {
                setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
            }, (error) => console.log("Firebase Chat Error Setup:", error.message));

            return () => {
                unsubEmployees();
                unsubLeaves();
                unsubPayroll();
                unsubAttendance();
                unsubTasks();
                unsubDocuments();
                unsubNotifications();
                unsubTeams();
                unsubChat();
            };
        } catch (e) {
            console.error("Firebase config missing or invalid.", e);
        }
    }, []);

    const addEmployee = async (emp: Employee) => {
        try {
            await addDoc(collection(db, "employees"), {
                ...emp,
                joinDate: emp.joinDate || new Date().toISOString(),
                permissions: emp.permissions || []
            });
        } catch (e) {
            console.error("Error adding employee: ", e);
        }
    };

    const removeEmployee = async (id: string) => {
        try {
            await deleteDoc(doc(db, "employees", id));
        } catch (e) {
            console.error("Error removing employee: ", e);
        }
    };

    const updateLeaveBalance = async (id: string, balance: number) => {
        try {
            await updateDoc(doc(db, "employees", id), { leaveBalance: balance });
        } catch (e) {
            console.error("Error updating leave balance:", e);
        }
    };

    const updateEmployeePermissions = async (id: string, permissions: string[]) => {
        try {
            await updateDoc(doc(db, "employees", id), { permissions });
        } catch (e) {
            console.error("Error updating permissions:", e);
        }
    };

    const requestLeave = async (leave: Leave) => {
        try {
            await addDoc(collection(db, "leaves"), leave);
            // Create notification for Medical leaves mostly, or all leaves for employers
            await addDoc(collection(db, "notifications"), {
                title: `${leave.type} Request`,
                message: `${leave.empName} has requested ${leave.type} from ${leave.from} to ${leave.to}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetRole: "employer"
            });
        } catch (e) {
            console.error("Error requesting leave: ", e);
        }
    };

    const updateLeaveStatus = async (id: string, status: "Approved" | "Denied") => {
        try {
            await updateDoc(doc(db, "leaves", id), { status });
        } catch (e) {
            console.error("Error updating leave: ", e);
        }
    };

    const processPayroll = async () => {
        if (employees.length === 0) return;
        try {
            const activeEmployees = employees.filter(e => e.status === "Active");
            const payrollPromises = activeEmployees.map(emp => {
                return addDoc(collection(db, "payroll"), {
                    transactionId: `PR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
                    name: emp.name,
                    empEmail: emp.email,
                    department: emp.department,
                    amount: `₹${(Math.random() * 40000 + 30000).toFixed(0)}`, // Base 30,000 to 70,000 INR
                    status: "Paid",
                    date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })
                });
            });
            await Promise.all(payrollPromises);
        } catch (e) {
            console.error("Error processing payroll: ", e);
        }
    };

    const requestPayslip = async (email: string) => {
        try {
            await addDoc(collection(db, "notifications"), {
                title: "Payslip Requested",
                message: `Employee ${email} has requested their recent payslip.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetRole: "employer"
            });
        } catch (e) {
            console.error("Error requesting payslip: ", e);
        }
    };

    const clockIn = async (email: string) => {
        try {
            await addDoc(collection(db, "attendance"), {
                empEmail: email,
                type: "Clock In",
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error clocking in: ", e);
        }
    };

    const clockOut = async (email: string) => {
        try {
            await addDoc(collection(db, "attendance"), {
                empEmail: email,
                type: "Clock Out",
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error clocking out: ", e);
        }
    };

    const addTask = async (task: Task) => {
        try {
            await addDoc(collection(db, "tasks"), {
                ...task,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error adding task: ", e);
        }
    };

    const updateTaskStatus = async (id: string, status: "Pending" | "In Progress" | "Completed") => {
        try {
            await updateDoc(doc(db, "tasks", id), { status });
        } catch (e) {
            console.error("Error updating task status: ", e);
        }
    };

    const requestDocument = async (email: string, title: string) => {
        try {
            await addDoc(collection(db, "documents"), { empEmail: email, title, status: "Pending" });
            await addDoc(collection(db, "notifications"), {
                title: "Document Requested",
                message: `HR has requested a document: ${title}`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: email,
                targetRole: "employee"
            });
        } catch (e) {
            console.error("Error requesting document:", e);
        }
    };

    const uploadDocument = async (id: string, url: string) => {
        try {
            await updateDoc(doc(db, "documents", id), { status: "Uploaded", url });
        } catch (e) {
            console.error("Error uploading document:", e);
        }
    };

    const createNotification = async (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead">) => {
        try {
            await addDoc(collection(db, "notifications"), {
                ...notif,
                timestamp: new Date().toISOString(),
                isRead: false
            });
        } catch (e) {
            console.error("Error creating notification:", e);
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), { isRead: true });
        } catch (e) {
            console.error("Error marking notification as read:", e);
        }
    };

    const createTeam = async (team: Omit<Team, "id" | "createdAt">) => {
        try {
            await addDoc(collection(db, "teams"), {
                ...team,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error creating team:", e);
        }
    };

    const sendMessage = async (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        try {
            await addDoc(collection(db, "chat_messages"), {
                ...msg,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error sending message:", e);
        }
    };

    return (
        <AppContext.Provider value={{
            employees, addEmployee, removeEmployee, updateLeaveBalance, updateEmployeePermissions,
            leaves, requestLeave, updateLeaveStatus,
            payroll, processPayroll, requestPayslip,
            attendance, clockIn, clockOut,
            tasks, addTask, updateTaskStatus,
            documents, requestDocument, uploadDocument,
            notifications, createNotification, markNotificationRead,
            teams, createTeam,
            chatMessages, sendMessage
        }}>
            {children}
        </AppContext.Provider>
    );
};
