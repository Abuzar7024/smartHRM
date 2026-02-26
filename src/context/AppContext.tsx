"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy, where, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export type Employee = { id?: string; name: string; role: string; position?: string; department: string; status: string; email: string; leaveBalance?: number; permissions?: string[]; joinDate?: string; companyName?: string };
export type Leave = { id?: string; empName: string; empEmail: string; type: string; isHalfDay?: boolean; days?: number; from: string; to: string; status: "Approved" | "Pending" | "Denied"; description: string; companyName?: string };
export type Payroll = { id?: string; name: string; department: string; amount: string; status: string; date: string; empEmail: string; transactionId: string };
export type Attendance = { id?: string; empEmail: string; type: "Clock In" | "Clock Out" | "Break Start" | "Break End"; timestamp: string };
export type Task = { id?: string; title: string; description: string; assigneeId: string; assigneeEmail: string; status: "Pending" | "In Progress" | "Completed"; priority: "Low" | "Medium" | "High"; dueDate: string; createdAt: string };
export type EmployeeDocument = { id?: string; empEmail: string; title: string; status: "Pending" | "Uploaded" | "Approved" | "Rejected"; url?: string; requestedAt?: string };
export type NotificationItem = { id?: string; title: string; message: string; timestamp: string; isRead: boolean; targetEmail?: string; targetRole?: "employer" | "employee" };
export type DocTemplate = { id?: string; title: string; required: boolean };
export type Team = { id?: string; name: string; leaderEmail: string; memberEmails: string[]; teamType: "Permanent" | "Project-Based"; hierarchy: "Flat" | "Hierarchical" | "Matrix"; createdAt: string; };
export type ChatMessage = { id?: string; sender: string; receiver: string; text: string; timestamp: string; };
export type Job = { id?: string; title: string; department: string; applicants: number; type: string; postedAt: string; status: "Active" | "Closed" };

interface AppContextType {
    employees: Employee[];
    addEmployee: (emp: Employee) => Promise<void>;
    removeEmployee: (id: string) => Promise<void>;
    deleteEmployeeCascade: (empId: string, empEmail: string) => Promise<void>;
    updateLeaveBalance: (id: string, balance: number) => Promise<void>;
    updateEmployeePermissions: (id: string, permissions: string[]) => Promise<void>;
    approveRegistration: (uid: string, empId: string) => Promise<void>;
    rejectRegistration: (uid: string) => Promise<void>;
    pendingRegistrations: { uid: string; email: string; companyName?: string }[];

    leaves: Leave[];
    requestLeave: (leave: Leave) => Promise<void>;
    updateLeaveStatus: (id: string, status: "Approved" | "Denied") => Promise<void>;

    payroll: Payroll[];
    processPayroll: () => Promise<void>;
    requestPayslip: (email: string) => Promise<void>;

    attendance: Attendance[];
    clockIn: (email: string) => Promise<void>;
    clockOut: (email: string) => Promise<void>;
    takeBreak: (email: string) => Promise<void>;
    endBreak: (email: string) => Promise<void>;

    tasks: Task[];
    addTask: (task: Task) => Promise<void>;
    updateTaskStatus: (id: string, status: "Pending" | "In Progress" | "Completed") => Promise<void>;

    documents: EmployeeDocument[];
    requestDocument: (email: string, title: string) => Promise<void>;
    sendDocumentReminder: (email: string, title: string) => Promise<void>;
    uploadDocument: (id: string, url: string) => Promise<void>;
    updateDocumentStatus: (id: string, status: "Approved" | "Rejected") => Promise<void>;

    docTemplates: DocTemplate[];
    addDocTemplate: (title: string, required: boolean) => Promise<void>;
    updateDocTemplate: (id: string, title: string, required: boolean) => Promise<void>;
    deleteDocTemplate: (id: string) => Promise<void>;

    notifications: NotificationItem[];
    createNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead">) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;

    jobs: Job[];
    addJob: (job: Omit<Job, "id" | "postedAt" | "applicants">) => Promise<void>;
    updateJobStatus: (id: string, status: "Active" | "Closed") => Promise<void>;

    teams: Team[];
    createTeam: (team: Omit<Team, "id" | "createdAt">) => Promise<void>;
    updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
    deleteTeam: (id: string) => Promise<void>;

    chatMessages: ChatMessage[];
    sendMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => Promise<void>;
    markChatRead: (myEmail: string, contactEmail: string) => Promise<void>;
    chatReadTimestamps: Record<string, number>; // key: contactEmail, value: ms timestamp
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const { companyName, role, status } = useAuth();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [payroll, setPayroll] = useState<Payroll[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [pendingRegistrations, setPendingRegistrations] = useState<{ uid: string; email: string; companyName?: string }[]>([]);
    const [chatReadTimestamps, setChatReadTimestamps] = useState<Record<string, number>>({});
    const [docTemplates, setDocTemplates] = useState<DocTemplate[]>([
        { id: "def_passport", title: "Passport", required: true },
        { id: "def_address", title: "Address Proof", required: true },
        { id: "def_bank", title: "Bank Details", required: false },
    ]);

    useEffect(() => {
        if (!companyName) {
            // Clear all data if there is no company context (logged out or unassigned)
            setEmployees([]);
            setLeaves([]);
            setPayroll([]);
            setAttendance([]);
            setTasks([]);
            setDocuments([]);
            setNotifications([]);
            setJobs([]);
            setTeams([]);
            setChatMessages([]);
            setPendingRegistrations([]);
            setChatReadTimestamps({});
            return;
        }

        try {
            const unsubEmployees = onSnapshot(query(collection(db, "employees"), where("companyName", "==", companyName)), (snapshot) => {
                setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
            }, (error) => console.log("Firebase Employees Error Setup:", error.message));

            const unsubLeaves = onSnapshot(query(collection(db, "leaves"), where("companyName", "==", companyName), orderBy("from", "desc")), (snapshot) => {
                setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leave)));
            }, (error) => console.log("Firebase Leaves Error Setup:", error.message));

            const unsubPayroll = onSnapshot(query(collection(db, "payroll"), where("companyName", "==", companyName)), (snapshot) => {
                setPayroll(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
            }, (error) => console.log("Firebase Payroll Error Setup:", error.message));

            const unsubAttendance = onSnapshot(query(collection(db, "attendance"), where("companyName", "==", companyName), orderBy("timestamp", "desc")), (snapshot) => {
                setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance)));
            }, (error) => console.log("Firebase Attendance Error Setup:", error.message));

            const unsubTasks = onSnapshot(query(collection(db, "tasks"), where("companyName", "==", companyName), orderBy("createdAt", "desc")), (snapshot) => {
                setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
            }, (error) => console.log("Firebase Tasks Error Setup:", error.message));

            const unsubDocuments = onSnapshot(query(collection(db, "documents"), where("companyName", "==", companyName)), (snapshot) => {
                setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeDocument)));
            }, (error) => console.log("Firebase Docs Error Setup:", error.message));

            const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where("companyName", "==", companyName), orderBy("timestamp", "desc")), (snapshot) => {
                setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem)));
            }, (error) => console.log("Firebase Notifications Error Setup:", error.message));

            const unsubJobs = onSnapshot(query(collection(db, "jobs"), where("companyName", "==", companyName), orderBy("postedAt", "desc")), (snapshot) => {
                setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
            }, (error) => console.log("Firebase Jobs Error Setup:", error.message));

            const unsubTeams = onSnapshot(query(collection(db, "teams"), where("companyName", "==", companyName), orderBy("createdAt", "desc")), (snapshot) => {
                setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
            }, (error) => console.log("Firebase Teams Error Setup:", error.message));

            const unsubChat = onSnapshot(query(collection(db, "chat_messages"), where("companyName", "==", companyName), orderBy("timestamp", "asc")), (snapshot) => {
                setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
            }, (error) => console.log("Firebase Chat Error Setup:", error.message));

            const unsubDocTemplates = onSnapshot(collection(db, "doc_templates"), (snapshot) => {
                if (!snapshot.empty) {
                    setDocTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocTemplate)));
                }
            }, (error) => console.log("Firebase DocTemplates Error Setup:", error.message));

            // Listen for pending employee registrations (users with status=pending)
            const unsubPending = onSnapshot(
                query(collection(db, "users"), where("companyName", "==", companyName), where("status", "==", "pending")),
                (snapshot) => {
                    setPendingRegistrations(snapshot.docs.map(d => ({
                        uid: d.id,
                        email: d.data().email as string,
                        companyName: d.data().companyName as string | undefined,
                    })));
                },
                (error) => console.log("Firebase Pending Error:", error.message)
            );

            // Load chat read timestamps for this session
            const unsubChatReads = onSnapshot(collection(db, "chat_reads"), (snapshot) => {
                const map: Record<string, number> = {};
                snapshot.docs.forEach(d => {
                    const data = d.data();
                    if (data.readAt) map[data.contactEmail] = data.readAt;
                });
                setChatReadTimestamps(map);
            }, (error) => console.log("Firebase ChatReads Error:", error.message));

            return () => {
                unsubEmployees();
                unsubLeaves();
                unsubPayroll();
                unsubAttendance();
                unsubTasks();
                unsubDocuments();
                unsubNotifications();
                unsubJobs();
                unsubTeams();
                unsubChat();
                unsubDocTemplates();
                unsubPending();
                unsubChatReads();
            };
        } catch (e) {
            console.error("Firebase config missing or invalid.", e);
        }
    }, [companyName]);

    const addEmployee = async (emp: Employee) => {
        try {
            await addDoc(collection(db, "employees"), {
                ...emp,
                companyName: companyName, // Inject company context
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

    // Full cascade delete: remove employee + all their data across collections
    const deleteEmployeeCascade = async (empId: string, empEmail: string) => {
        try {
            const batch = writeBatch(db);
            // Delete employee record
            batch.delete(doc(db, "employees", empId));

            // Collections that store empEmail
            const emailCollections = ["documents", "leaves", "payroll", "attendance", "notifications", "chat_messages"];
            for (const col of emailCollections) {
                const fieldName = col === "chat_messages" ? "sender" :
                    col === "leaves" ? "empEmail" :
                        col === "notifications" ? "targetEmail" : "empEmail";
                const q = query(collection(db, col), where(fieldName, "==", empEmail));
                const snap = await getDocs(q);
                snap.docs.forEach(d => batch.delete(d.ref));
                // Also delete chat messages where they are receiver
                if (col === "chat_messages") {
                    const q2 = query(collection(db, col), where("receiver", "==", empEmail));
                    const snap2 = await getDocs(q2);
                    snap2.docs.forEach(d => batch.delete(d.ref));
                }
            }

            // Tasks assigned to this employee
            const tasksQ = query(collection(db, "tasks"), where("assigneeEmail", "==", empEmail));
            const tasksSnap = await getDocs(tasksQ);
            tasksSnap.docs.forEach(d => batch.delete(d.ref));

            // Remove from teams.memberEmails
            const teamsQ = query(collection(db, "teams"), where("memberEmails", "array-contains", empEmail));
            const teamsSnap = await getDocs(teamsQ);
            teamsSnap.docs.forEach(d => {
                const current: string[] = d.data().memberEmails || [];
                batch.update(d.ref, { memberEmails: current.filter(e => e !== empEmail) });
            });

            await batch.commit();
        } catch (e) {
            console.error("Error deleting employee cascade:", e);
            throw e;
        }
    };

    const approveRegistration = async (uid: string, empId: string) => {
        try {
            await updateDoc(doc(db, "users", uid), { status: "active" });
            await updateDoc(doc(db, "employees", empId), { status: "Active" });
            await addDoc(collection(db, "notifications"), {
                title: "Registration Approved",
                message: "Your registration has been approved. Welcome aboard!",
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: (await getDocs(query(collection(db, "users"), where("__name__", "==", uid)))).docs[0]?.data().email,
                targetRole: "employee",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error approving registration:", e);
        }
    };

    const rejectRegistration = async (uid: string) => {
        try {
            await updateDoc(doc(db, "users", uid), { status: "rejected" });
        } catch (e) {
            console.error("Error rejecting registration:", e);
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
            await addDoc(collection(db, "leaves"), { ...leave, companyName });
            // Create notification for Medical leaves mostly, or all leaves for employers
            await addDoc(collection(db, "notifications"), {
                title: `${leave.type} Request`,
                message: `${leave.empName} has requested ${leave.type} from ${leave.from} to ${leave.to}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetRole: "employer",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error requesting leave: ", e);
        }
    };

    const updateLeaveStatus = async (id: string, status: "Approved" | "Denied") => {
        try {
            await updateDoc(doc(db, "leaves", id), { status });
            // Deduct from leave balance when approved
            if (status === "Approved") {
                const leaveDoc = leaves.find(l => l.id === id);
                if (leaveDoc) {
                    const emp = employees.find(e => e.email === leaveDoc.empEmail);
                    if (emp?.id) {
                        const deduction = leaveDoc.isHalfDay
                            ? 0.5
                            : leaveDoc.days ?? Math.max(1, Math.ceil(
                                (new Date(leaveDoc.to).getTime() - new Date(leaveDoc.from).getTime()) / 86400000 + 1
                            ));
                        const newBalance = Math.max(0, (emp.leaveBalance ?? 0) - deduction);
                        await updateDoc(doc(db, "employees", emp.id), { leaveBalance: newBalance });
                    }
                }
            }
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
                    date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }),
                    companyName: companyName
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
                targetRole: "employer",
                companyName: companyName
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
                timestamp: new Date().toISOString(),
                companyName: companyName
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
                timestamp: new Date().toISOString(),
                companyName: companyName
            });
        } catch (e) {
            console.error("Error clocking out: ", e);
        }
    };

    const takeBreak = async (email: string) => {
        try {
            await addDoc(collection(db, "attendance"), {
                empEmail: email,
                type: "Break Start",
                timestamp: new Date().toISOString(),
                companyName: companyName
            });
        } catch (e) {
            console.error("Error starting break: ", e);
        }
    };

    const endBreak = async (email: string) => {
        try {
            await addDoc(collection(db, "attendance"), {
                empEmail: email,
                type: "Break End",
                timestamp: new Date().toISOString(),
                companyName: companyName
            });
        } catch (e) {
            console.error("Error ending break: ", e);
        }
    };

    const addTask = async (task: Task) => {
        try {
            await addDoc(collection(db, "tasks"), {
                ...task,
                companyName: companyName,
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
            await addDoc(collection(db, "documents"), { empEmail: email, title, status: "Pending", requestedAt: new Date().toISOString(), companyName });
            // Persistent in-app notification for the employee
            await addDoc(collection(db, "notifications"), {
                title: "📄 Document Required",
                message: `Your employer has requested a document: "${title}". Please upload it as soon as possible.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: email,
                targetRole: "employee",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error requesting document:", e);
        }
    };

    const sendDocumentReminder = async (email: string, title: string) => {
        try {
            await addDoc(collection(db, "notifications"), {
                title: "⚠️ Document Reminder",
                message: `Reminder: You still have a pending document request for "${title}". Please upload it immediately.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: email,
                targetRole: "employee",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error sending reminder:", e);
        }
    };

    const uploadDocument = async (id: string, url: string) => {
        try {
            await updateDoc(doc(db, "documents", id), { status: "Uploaded", url });
        } catch (e) {
            console.error("Error uploading document:", e);
        }
    };

    const updateDocumentStatus = async (id: string, status: "Approved" | "Rejected") => {
        try {
            await updateDoc(doc(db, "documents", id), { status });
        } catch (e) {
            console.error("Error updating document status:", e);
        }
    };

    const createNotification = async (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead">) => {
        try {
            await addDoc(collection(db, "notifications"), {
                ...notif,
                companyName: companyName,
                timestamp: new Date().toISOString(),
                isRead: false
            });
        } catch (e) {
            console.error("Error creating notification:", e);
        }
    };

    const addDocTemplate = async (title: string, required: boolean) => {
        try {
            await addDoc(collection(db, "doc_templates"), { title, required });
        } catch (e) {
            console.error(e);
        }
    };

    const updateDocTemplate = async (id: string, title: string, required: boolean) => {
        if (id.startsWith("def_")) return; // Don't edit default local ones
        try {
            await updateDoc(doc(db, "doc_templates", id), { title, required });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteDocTemplate = async (id: string) => {
        if (id.startsWith("def_")) return;
        try {
            await deleteDoc(doc(db, "doc_templates", id));
        } catch (e) {
            console.error(e);
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
                companyName: companyName,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error creating team:", e);
        }
    };

    const updateTeam = async (id: string, updates: Partial<Team>) => {
        try {
            await updateDoc(doc(db, "teams", id), updates);
        } catch (e) {
            console.error("Error updating team:", e);
        }
    };

    const deleteTeam = async (id: string) => {
        try {
            await deleteDoc(doc(db, "teams", id));
        } catch (e) {
            console.error("Error deleting team:", e);
        }
    };

    const markChatRead = async (myEmail: string, contactEmail: string) => {
        try {
            const key = `${myEmail}__${contactEmail}`;
            const now = Date.now();
            await updateDoc(doc(db, "chat_reads", key), { readAt: now }).catch(async () => {
                // Document doesn't exist yet — create it
                await addDoc(collection(db, "chat_reads"), { key, myEmail, contactEmail, readAt: now });
            });
            setChatReadTimestamps(prev => ({ ...prev, [contactEmail]: now }));
        } catch (e) {
            console.error("Error marking chat read:", e);
        }
    };

    const addJob = async (job: Omit<Job, "id" | "postedAt" | "applicants">) => {
        try {
            await addDoc(collection(db, "jobs"), {
                ...job,
                applicants: 0,
                postedAt: new Date().toISOString(),
                status: "Active",
                companyName: companyName
            });
        } catch (e) {
            console.error(e);
        }
    };

    const updateJobStatus = async (id: string, status: "Active" | "Closed") => {
        try {
            await updateDoc(doc(db, "jobs", id), { status });
        } catch (e) {
            console.error(e);
        }
    };

    const sendMessage = async (msg: Omit<ChatMessage, "id" | "timestamp">) => {
        try {
            await addDoc(collection(db, "chat_messages"), {
                ...msg,
                companyName: companyName,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Error sending message:", e);
        }
    };

    return (
        <AppContext.Provider value={{
            employees, addEmployee, removeEmployee, deleteEmployeeCascade, updateLeaveBalance, updateEmployeePermissions,
            approveRegistration, rejectRegistration, pendingRegistrations,
            leaves, requestLeave, updateLeaveStatus,
            payroll, processPayroll, requestPayslip,
            attendance, clockIn, clockOut, takeBreak, endBreak,
            tasks, addTask, updateTaskStatus,
            documents, requestDocument, sendDocumentReminder, uploadDocument, updateDocumentStatus,
            docTemplates, addDocTemplate, updateDocTemplate, deleteDocTemplate,
            notifications, createNotification, markNotificationRead,
            jobs, addJob, updateJobStatus,
            teams, createTeam, updateTeam, deleteTeam,
            chatMessages, sendMessage, markChatRead, chatReadTimestamps
        }}>
            {children}
        </AppContext.Provider>
    );
};
