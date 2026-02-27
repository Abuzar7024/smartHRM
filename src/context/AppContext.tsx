"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy, where, getDocs, writeBatch, Timestamp, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export type Employee = {
    id?: string;
    name: string;
    role: string;
    position?: string;
    department: string;
    status: string;
    email: string;
    leaveBalance?: number;
    leaveBalances?: Record<string, number>;
    photoURL?: string;
    permissions?: string[];
    joinDate?: string;
    companyName?: string;
    phone?: string;
    dob?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    govIdNumber?: string;
    panCard?: string;
    fathersName?: string;
    aboutMe?: string;
    linkedin?: string;
    ctc?: string;
    pf?: string;
    tds?: string;
    insuranceOpted?: boolean;
    insuranceAmount?: string;
};
export type Leave = { id?: string; empName: string; empEmail: string; type: string; isHalfDay?: boolean; days?: number; from: string; to: string; status: "Approved" | "Pending" | "Denied"; description: string; companyName?: string };
export type Payroll = { id?: string; name: string; department: string; amount: string; status: string; date: string; empEmail: string; transactionId: string };
export type Attendance = { id?: string; empEmail: string; type: "Clock In" | "Clock Out" | "Break Start" | "Break End"; timestamp: string };
export type TaskActivity = { type: string; user: string; timestamp: string; detail?: string };
export type TaskComment = { user: string; text: string; timestamp: string };
export type TaskAttachment = { name: string; url: string };

export type Task = {
    id?: string;
    title: string;
    description: string;
    assigneeEmails: string[];
    status: "Pending" | "In Progress" | "Completed";
    priority: "Low" | "Medium" | "High";
    dueDate: string;
    createdAt: string;
    companyName?: string;
    attachments?: TaskAttachment[];
    history?: TaskActivity[];
    comments?: TaskComment[];
    assignmentType?: "Individual" | "Team" | "Delegate";
    teamId?: string;
    estimatedHours?: number;
    category?: string;
    tags?: string[];
    creatorEmail?: string;
};
export type EmployeeDocument = { id?: string; empEmail: string; title: string; status: "Pending" | "Uploaded" | "Approved" | "Rejected"; url?: string; requestedAt?: string };
export type NotificationItem = { id?: string; title: string; message: string; timestamp: string; isRead: boolean; targetEmail?: string; targetRole?: "employer" | "employee" };
export type DocTemplate = { id?: string; title: string; required: boolean };
export type Team = { id?: string; name: string; leaderEmail: string; memberEmails: string[]; teamType: "Permanent" | "Project-Based"; hierarchy: "Flat" | "Hierarchical" | "Matrix"; createdAt: string; };
export type ChatMessage = { id?: string; sender: string; receiver: string; text: string; timestamp: string; companyName?: string; replyToId?: string; reaction?: string; };
export type Job = { id?: string; title: string; department: string; applicants: number; type: string; postedAt: string; status: "Active" | "Closed" };
export type ProfileUpdateRequest = { id?: string; empId: string; empEmail: string; empName: string; fields: Partial<Employee>; status: "Pending" | "Approved" | "Rejected"; requestedAt: string; companyName?: string; };
export type LeaveBalance = { id?: string; empEmail: string; type: string; balance: number; companyName?: string };
export type PayslipRequest = { id?: string; empEmail: string; empName: string; month: string; status: "Pending" | "Fulfilled"; requestedAt: string; companyName?: string };
export type Announcement = { id?: string; title: string; message: string; createdAt: string; authorName: string; companyName?: string; type: "News" | "Update" | "Event" | "Urgent"; startTime?: string; endTime?: string };

interface AppContextType {
    employees: Employee[];
    addEmployee: (emp: Employee) => Promise<void>;
    removeEmployee: (id: string) => Promise<void>;
    deleteEmployeeCascade: (empId: string, empEmail: string) => Promise<void>;
    updateEmployeePermissions: (id: string, permissions: string[]) => Promise<void>;
    updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
    approveRegistration: (uid: string, empId: string) => Promise<void>;
    rejectRegistration: (uid: string) => Promise<void>;
    pendingRegistrations: { uid: string; email: string; companyName?: string }[];
    payslipRequests: PayslipRequest[];
    fulfillPayslipRequest: (id: string, email: string) => Promise<void>;
    announcements: Announcement[];
    addAnnouncement: (ann: Omit<Announcement, "id" | "createdAt" | "companyName">) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;

    profileUpdates: ProfileUpdateRequest[];
    requestProfileUpdate: (empId: string, empName: string, empEmail: string, fields: Partial<Employee>) => Promise<void>;
    approveProfileUpdate: (requestId: string) => Promise<void>;
    rejectProfileUpdate: (requestId: string) => Promise<void>;

    leaves: Leave[];
    requestLeave: (leave: Leave) => Promise<void>;
    approveLeaveRequest: (leaveId: string) => Promise<void>;
    rejectLeaveRequest: (leaveId: string) => Promise<void>;
    updateLeaveStatus: (id: string, status: "Approved" | "Denied") => Promise<void>;

    leaveBalances: LeaveBalance[];
    addLeaveBalance: (balance: Omit<LeaveBalance, "id" | "companyName">) => Promise<void>;
    bulkAddLeaveBalances: (balances: Omit<LeaveBalance, "id" | "companyName">[]) => Promise<void>;
    updateLeaveBalance: (id: string, amount: number) => Promise<void>;
    deleteLeaveBalance: (id: string) => Promise<void>;

    payroll: Payroll[];
    processPayroll: () => Promise<void>;
    requestPayslip: (email: string) => Promise<void>;

    attendance: Attendance[];
    clockIn: (email: string) => Promise<void>;
    clockOut: (email: string) => Promise<void>;
    takeBreak: (email: string) => Promise<void>;
    endBreak: (email: string) => Promise<void>;

    tasks: Task[];
    addTask: (task: Omit<Task, "id" | "createdAt" | "companyName" | "status" | "history" | "comments" | "attachments">) => Promise<void>;
    updateTaskStatus: (id: string, status: "Pending" | "In Progress" | "Completed") => Promise<void>;
    manageTaskTeam: (taskId: string, memberEmails: string[]) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    addTaskComment: (taskId: string, comment: string) => Promise<void>;
    addTaskAttachment: (taskId: string, fileName: string, fileUrl: string) => Promise<void>;

    documents: EmployeeDocument[];
    requestDocument: (email: string, title: string) => Promise<void>;
    requestMultipleDocuments: (email: string, titles: string[]) => Promise<void>;
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
    deleteMessage: (msgId: string) => Promise<void>;
    clearChat: (myEmail: string, contactEmail: string) => Promise<void>;
    reactToMessage: (msgId: string, reaction: string | null) => Promise<void>;
    markChatRead: (myEmail: string, contactEmail: string) => Promise<void>;
    chatReadTimestamps: Record<string, number>; // key: contactEmail, value: ms timestamp
    uploadProfileImage: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, companyName, role, status } = useAuth();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [payroll, setPayroll] = useState<Payroll[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [payslipRequests, setPayslipRequests] = useState<PayslipRequest[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [pendingRegistrations, setPendingRegistrations] = useState<{ uid: string; email: string; companyName?: string }[]>([]);
    const [chatReadTimestamps, setChatReadTimestamps] = useState<Record<string, number>>({});
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [profileUpdates, setProfileUpdates] = useState<ProfileUpdateRequest[]>([]);
    const [docTemplates, setDocTemplates] = useState<DocTemplate[]>([
        { id: "def_passport", title: "Passport", required: true },
        { id: "def_address", title: "Address Proof", required: true },
        { id: "def_bank", title: "Bank Details", required: false },
        { id: "def_id", title: "National ID / Aadhaar", required: true },
        { id: "def_photo", title: "Profile Photograph", required: true },
        { id: "def_degree", title: "Educational Certificates", required: false },
        { id: "def_exp", title: "Experience Letters", required: false },
        { id: "def_visa", title: "Work Visa / Permit", required: false },
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
            setLeaveBalances([]);
            setProfileUpdates([]);
            return;
        }

        try {
            const unsubEmployees = onSnapshot(query(collection(db, "employees"), where("companyName", "==", companyName)), (snapshot) => {
                setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
            }, (error) => console.log("Firebase Employees Error Setup:", error.message));

            const unsubLeaves = onSnapshot(
                role === "employer"
                    ? query(collection(db, "leaves"), where("companyName", "==", companyName))
                    : query(collection(db, "leaves"), where("companyName", "==", companyName), where("empEmail", "==", user?.email)),
                (snapshot) => {
                    const leavesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leave));
                    setLeaves(leavesData.sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()));
                }, (error) => console.log("Firebase Leaves Error Setup:", error.message));

            const unsubPayroll = onSnapshot(query(collection(db, "payroll"), where("companyName", "==", companyName)), (snapshot) => {
                setPayroll(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payroll)));
            }, (error) => console.log("Firebase Payroll Error Setup:", error.message));

            const unsubAttendance = onSnapshot(query(collection(db, "attendance"), where("companyName", "==", companyName)), (snapshot) => {
                const attData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
                setAttendance(attData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }, (error) => console.log("Firebase Attendance Error Setup:", error.message));

            const unsubTasks = onSnapshot(
                role === "employer"
                    ? query(collection(db, "tasks"), where("companyName", "==", companyName))
                    : query(collection(db, "tasks"), where("companyName", "==", companyName), where("assigneeEmails", "array-contains", user?.email)),
                (snapshot) => {
                    const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                    setTasks(tData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }, (error) => console.log("Firebase Tasks Error Setup:", error.message));

            const unsubDocuments = onSnapshot(
                role === "employer"
                    ? query(collection(db, "documents"), where("companyName", "==", companyName))
                    : query(collection(db, "documents"), where("companyName", "==", companyName), where("empEmail", "==", user?.email)),
                (snapshot) => {
                    setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeDocument)));
                }, (error) => console.log("Firebase Docs Error Setup:", error.message));

            const unsubNotifications = onSnapshot(query(collection(db, "notifications"), where("companyName", "==", companyName)), (snapshot) => {
                const nData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationItem));
                setNotifications(nData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }, (error) => console.log("Firebase Notifications Error Setup:", error.message));


            const unsubLeaveBalances = onSnapshot(
                role === "employer"
                    ? query(collection(db, "leave_balances"), where("companyName", "==", companyName))
                    : query(collection(db, "leave_balances"), where("companyName", "==", companyName), where("empEmail", "==", user?.email || "")),
                (snapshot) => {
                    setLeaveBalances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveBalance)));
                }, (error) => console.log("Firebase Balances Error Setup:", error.message));

            const unsubJobs = onSnapshot(query(collection(db, "jobs"), where("companyName", "==", companyName)), (snapshot) => {
                const jData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
                setJobs(jData.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));
            }, (error) => console.log("Firebase Jobs Error Setup:", error.message));

            const unsubTeams = onSnapshot(query(collection(db, "teams"), where("companyName", "==", companyName)), (snapshot) => {
                const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
                setTeams(tData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }, (error) => console.log("Firebase Teams Error Setup:", error.message));

            const unsubChat = onSnapshot(query(collection(db, "chat_messages"), where("companyName", "==", companyName)), (snapshot) => {
                const cData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
                setChatMessages(cData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
            }, (error) => console.log("Firebase Chat Error Setup:", error.message));

            const unsubDocTemplates = onSnapshot(query(collection(db, "doc_templates"), where("companyName", "==", companyName)), (snapshot) => {
                if (!snapshot.empty) {
                    setDocTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocTemplate)));
                } else {
                    setDocTemplates([]);
                }
            }, (error) => console.log("Firebase Templates Error Setup:", error.message));

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

            // Load chat read timestamps ONLY for this user
            const unsubChatReads = onSnapshot(
                query(collection(db, "chat_reads"), where("myEmail", "==", user?.email || "")),
                (snapshot) => {
                    const map: Record<string, number> = {};
                    snapshot.docs.forEach(d => {
                        const data = d.data();
                        if (data.readAt && data.contactEmail) {
                            map[data.contactEmail] = data.readAt;
                        }
                    });
                    setChatReadTimestamps(map);
                },
                (error) => console.log("Firebase ChatReads Error:", error.message)
            );

            const unsubscribeProfileUpdates = onSnapshot(query(collection(db, "profile_updates"), where("companyName", "==", companyName)), (snapshot) => {
                const pData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfileUpdateRequest));
                setProfileUpdates(pData.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
            }, (error) => console.log("Firebase ProfileUpdates Setup Error:", error.message));

            // Payslip Requests
            const unsubscribePayslip = onSnapshot(query(collection(db, "payslip_requests"), where("companyName", "==", companyName)), (snapshot) => {
                setPayslipRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PayslipRequest));
            }, (error) => console.log("Firebase Payslip Requests Error Setup:", error.message));

            // Announcement subscription
            const q = query(collection(db, "announcements"), where("companyName", "==", companyName));
            const unsubscribeAnnouncements = onSnapshot(q, (snapshot) => {
                console.log("Announcement snapshot received. Size:", snapshot.size, "Company:", companyName);
                const sorted = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }) as Announcement)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setAnnouncements(sorted);
            }, (error) => console.log("Firebase Announcements Error Setup:", error.message));

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
                unsubscribeProfileUpdates();
                unsubLeaveBalances();
                unsubscribePayslip();
                unsubscribeAnnouncements();
            };
        } catch (e) {
            console.error("Firebase config missing or invalid.", e);
        }
    }, [companyName, user?.email]);

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
            const emailCollections = ["documents", "leaves", "payroll", "attendance", "notifications", "chat_messages", "leave_balances"];
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

    const requestProfileUpdate = async (empId: string, empName: string, empEmail: string, fields: Partial<Employee>) => {
        try {
            await addDoc(collection(db, "profile_updates"), {
                empId,
                empName,
                empEmail,
                fields,
                status: "Pending",
                requestedAt: new Date().toISOString(),
                companyName
            });
            await addDoc(collection(db, "notifications"), {
                title: "Profile Update Request",
                message: `${empName} has requested to update their profile.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetRole: "employer",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error requesting profile update:", e);
        }
    };

    const approveProfileUpdate = async (requestId: string) => {
        try {
            const req = profileUpdates.find(r => r.id === requestId);
            if (!req) return;
            await updateDoc(doc(db, "employees", req.empId), req.fields);
            await updateDoc(doc(db, "profile_updates", requestId), { status: "Approved" });
            await addDoc(collection(db, "notifications"), {
                title: "Profile Update Approved",
                message: "Your profile update request has been approved and applied.",
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: req.empEmail,
                targetRole: "employee",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error approving profile update:", e);
        }
    };

    const rejectProfileUpdate = async (requestId: string) => {
        try {
            const req = profileUpdates.find(r => r.id === requestId);
            if (!req) return;
            await updateDoc(doc(db, "profile_updates", requestId), { status: "Rejected" });
            await addDoc(collection(db, "notifications"), {
                title: "Profile Update Rejected",
                message: "Your profile update request was rejected. Contact administration.",
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: req.empEmail,
                targetRole: "employee",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error rejecting profile update:", e);
        }
    };

    const rejectRegistration = async (uid: string) => {
        try {
            await updateDoc(doc(db, "users", uid), { status: "rejected" });
        } catch (e) {
            console.error("Error rejecting registration:", e);
        }
    };

    const updateLeaveBalance = async (id: string, amount: number) => {
        try {
            await updateDoc(doc(db, "leave_balances", id), { balance: amount });
        } catch (e) {
            console.error("Error updating leave balance: ", e);
        }
    };

    const updateEmployeePermissions = async (id: string, permissions: string[]) => {
        try {
            await updateDoc(doc(db, "employees", id), { permissions });
        } catch (e) {
            console.error("Error updating permissions:", e);
        }
    };

    const updateEmployee = async (id: string, updates: Partial<Employee>) => {
        try {
            if (id === "employer_profile") {
                await setDoc(doc(db, "employees", user!.uid), { ...updates, companyName, role: "employer", email: user!.email }, { merge: true });
            } else {
                await updateDoc(doc(db, "employees", id), updates);
            }
        } catch (e) {
            console.error("Error updating employee details:", e);
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
        } catch (e) {
            console.error("Error updating leave: ", e);
        }
    };

    const processPayroll = async () => {
        if (employees.length === 0) return;
        try {
            const activeEmployees = employees.filter(e => e.status === "Active");
            const payrollPromises = activeEmployees.map(emp => {
                // Calculate Net Salary: (CTC/12) - PF - TDS - Insurance
                let amountStr = "";
                if (emp.ctc) {
                    const monthlyGross = Number(emp.ctc) / 12;
                    const pf = Number(emp.pf || 0);
                    const tds = Number(emp.tds || 0);
                    const insurance = emp.insuranceOpted ? Number(emp.insuranceAmount || 0) : 0;
                    const net = Math.max(0, monthlyGross - pf - tds - insurance);
                    amountStr = `₹${Math.round(net).toLocaleString('en-IN')}`;
                } else {
                    // Fallback to old behavior for demo/existing data
                    amountStr = `₹${Math.round(Math.random() * 40000 + 30000).toLocaleString('en-IN')}`;
                }

                return addDoc(collection(db, "payroll"), {
                    transactionId: `PR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
                    name: emp.name,
                    empEmail: emp.email,
                    department: emp.department,
                    amount: amountStr,
                    status: "Paid",
                    date: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }),
                    companyName: companyName
                });
            });
            await Promise.all(payrollPromises);
            toast.success(`Payroll processed for ${activeEmployees.length} employees`);
        } catch (e) {
            console.error("Error processing payroll: ", e);
            toast.error("Failed to process payroll");
        }
    };

    const requestPayslip = async (email: string) => {
        try {
            const emp = employees.find(e => e.email === email);
            await addDoc(collection(db, "payslip_requests"), {
                empEmail: email,
                empName: emp?.name || email,
                month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
                status: "Pending",
                requestedAt: new Date().toISOString(),
                companyName: companyName
            });
            await addDoc(collection(db, "notifications"), {
                title: "Payslip Requested",
                message: `Employee ${emp?.name || email} has requested their recent payslip.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetRole: "employer",
                companyName: companyName
            });
        } catch (e) {
            console.error("Error requesting payslip: ", e);
        }
    };

    const fulfillPayslipRequest = async (id: string, email: string) => {
        try {
            await updateDoc(doc(db, "payslip_requests", id), { status: "Fulfilled" });
            await addDoc(collection(db, "notifications"), {
                title: "📄 Payslip Available",
                message: `Your payroll for ${new Date().toLocaleDateString('en-IN', { month: 'long' })} has been processed and is now available.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: email,
                targetRole: "employee",
                companyName: companyName
            });
            toast.success("Payslip Request Fulfilled");
        } catch (e) {
            console.error(e);
        }
    };

    const addAnnouncement = async (ann: Omit<Announcement, "id" | "createdAt" | "companyName">) => {
        try {
            console.log("Adding announcement:", ann);
            const response = await fetch('/api/announcements/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ann),
            });
            const data = await response.json();
            console.log("Add announcement response:", data);
            if (!response.ok) throw new Error(data.error || "Failed to post");
            toast.success("Announcement Posted Successfully!");
        } catch (e: any) {
            console.error("Add Announcement Error:", e);
            toast.error(e.message || "Failed to post announcement");
        }
    };

    const deleteAnnouncement = async (id: string) => {
        try {
            const response = await fetch(`/api/announcements/delete?id=${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Failed to delete");
            toast.success("Announcement Removed");
        } catch (e) {
            console.error(e);
            toast.error("Cleanup Failed");
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

    const addTask = async (task: Omit<Task, "id" | "createdAt" | "companyName" | "status" | "history" | "comments" | "attachments">) => {
        try {
            // If it's a team assignment, we should automatically include all team members
            let finalAssigneeEmails = [...task.assigneeEmails];
            if (task.assignmentType === "Team" && task.teamId) {
                const team = teams.find(t => t.id === task.teamId);
                if (team) {
                    finalAssigneeEmails = Array.from(new Set([...finalAssigneeEmails, ...team.memberEmails, team.leaderEmail]));
                }
            }

            const newTaskData = {
                ...task,
                assigneeEmails: finalAssigneeEmails,
                status: "Pending" as const,
                companyName: companyName,
                createdAt: new Date().toISOString(),
                creatorEmail: user?.email || "System",
                history: [{
                    type: "Created",
                    user: user?.email || "System",
                    timestamp: new Date().toISOString()
                }]
            };
            const docRef = await addDoc(collection(db, "tasks"), newTaskData);

            // Send notifications to all assignees
            for (const email of task.assigneeEmails) {
                await addDoc(collection(db, "notifications"), {
                    title: "New Task Assigned",
                    message: `You have been assigned to: ${task.title}`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    targetEmail: email,
                    targetRole: "employee",
                    companyName: companyName
                });
            }
        } catch (e) {
            console.error("Error adding task: ", e);
        }
    };

    const updateTaskStatus = async (id: string, status: "Pending" | "In Progress" | "Completed") => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const isAssignee = task.assigneeEmails.includes(user?.email || "");
            if (!isAssignee) {
                console.error("Access Denied: You can only update tasks assigned to you.");
                return;
            }

            const updateData: any = { status };
            const historyItem: TaskActivity = {
                type: "Status Change",
                user: user?.email || "System",
                timestamp: new Date().toISOString(),
                detail: `Changed status to ${status}`
            };
            updateData.history = [...(task.history || []), historyItem];

            await updateDoc(doc(db, "tasks", id), updateData);

            // Notify employer/manager when completed
            if (status === "Completed") {
                await addDoc(collection(db, "notifications"), {
                    title: "Task Completed",
                    message: `${user?.email}'s task "${task.title}" has been marked as Completed.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    targetRole: "employer",
                    companyName: companyName
                });
            }
        } catch (e) {
            console.error("Error updating task status: ", e);
        }
    };

    const manageTaskTeam = async (taskId: string, memberEmails: string[]) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            await updateDoc(doc(db, "tasks", taskId), {
                assigneeEmails: memberEmails,
                history: [
                    ...(task.history || []),
                    {
                        type: "Team Updated",
                        user: user?.email || "System",
                        timestamp: new Date().toISOString(),
                        detail: `Updated task team members`
                    }
                ]
            });
            toast.success("Task team updated");
        } catch (error: any) {
            toast.error("Error updating team: " + error.message);
        }
    };
    const deleteTask = async (id: string) => {
        try {
            await deleteDoc(doc(db, "tasks", id));
        } catch (e) {
            console.error("Error deleting task: ", e);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const historyItem: TaskActivity = {
                type: "Update",
                user: user?.email || "System",
                timestamp: new Date().toISOString(),
                detail: Object.keys(updates).join(", ")
            };
            const updatedHistory = [...(task.history || []), historyItem];

            await updateDoc(doc(db, "tasks", id), { ...updates, history: updatedHistory });
        } catch (e) {
            console.error("Error updating task: ", e);
        }
    };

    const addTaskComment = async (taskId: string, commentText: string) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const comment: TaskComment = {
                user: user?.email || "System",
                text: commentText,
                timestamp: new Date().toISOString()
            };
            const activity: TaskActivity = {
                type: "Comment",
                user: user?.email || "System",
                timestamp: new Date().toISOString(),
                detail: commentText.slice(0, 30) + (commentText.length > 30 ? "..." : "")
            };

            await updateDoc(doc(db, "tasks", taskId), {
                comments: [...(task.comments || []), comment],
                history: [...(task.history || []), activity]
            });
        } catch (e) {
            console.error("Error adding comment: ", e);
        }
    };

    const addTaskAttachment = async (taskId: string, fileName: string, fileUrl: string) => {
        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            const attachment: TaskAttachment = { name: fileName, url: fileUrl };
            const activity: TaskActivity = {
                type: "Attachment",
                user: user?.email || "System",
                timestamp: new Date().toISOString(),
                detail: `Added ${fileName}`
            };

            await updateDoc(doc(db, "tasks", taskId), {
                attachments: [...(task.attachments || []), attachment],
                history: [...(task.history || []), activity]
            });
        } catch (e) {
            console.error("Error adding attachment: ", e);
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

    const requestMultipleDocuments = async (email: string, titles: string[]) => {
        try {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            for (const title of titles) {
                const docRef = doc(collection(db, "documents"));
                batch.set(docRef, { empEmail: email, title, status: "Pending", requestedAt: now, companyName });

                const notifRef = doc(collection(db, "notifications"));
                batch.set(notifRef, {
                    title: "📄 Document Required",
                    message: `Your employer has requested a document: "${title}". Please upload it as soon as possible.`,
                    timestamp: now,
                    isRead: false,
                    targetEmail: email,
                    targetRole: "employee",
                    companyName: companyName
                });
            }

            await batch.commit();
        } catch (e) {
            console.error("Error requesting multiple documents:", e);
            throw e;
        }
    };

    const addLeaveBalance = async (balance: Omit<LeaveBalance, "id" | "companyName">) => {
        try {
            await addDoc(collection(db, "leave_balances"), { ...balance, companyName });
            await addDoc(collection(db, "notifications"), {
                title: "💰 Leave Balance Created",
                message: `A new leave balance of ${balance.balance} days has been added for ${balance.type}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: balance.empEmail,
                targetRole: "employee",
                companyName
            });
        } catch (e) {
            console.error(e);
        }
    };

    const bulkAddLeaveBalances = async (balances: Omit<LeaveBalance, "id" | "companyName">[]) => {
        try {
            const batch = writeBatch(db);
            balances.forEach(bal => {
                const newDocRef = doc(collection(db, "leave_balances"));
                batch.set(newDocRef, { ...bal, companyName });
            });
            await batch.commit();

            // Send one notification for the total
            const total = balances.reduce((acc, b) => acc + b.balance, 0);
            await addDoc(collection(db, "notifications"), {
                title: "📅 Leave Balances Allocated",
                message: `Total ${total} days of annual leave have been allocated across ${balances.length} categories.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: balances[0].empEmail,
                targetRole: "employee",
                companyName
            });
        } catch (e) {
            console.error(e);
            toast.error("Failed to allocate leaves");
        }
    };

    const deleteLeaveBalance = async (id: string) => {
        try {
            await deleteDoc(doc(db, "leave_balances", id));
        } catch (e) {
            console.error(e);
        }
    };

    const approveLeaveRequest = async (leaveId: string) => {
        const leave = leaves.find(l => l.id === leaveId);
        if (!leave) return;

        const deduction = leave.days || 1;
        const balanceRecord = leaveBalances.find(b => b.empEmail === leave.empEmail && b.type === leave.type);

        if (!balanceRecord || balanceRecord.balance < deduction) {
            toast.error("Insufficient Balance", { description: `Employee only has ${balanceRecord?.balance || 0} days remaining for ${leave.type}.` });
            return;
        }

        try {
            const batch = writeBatch(db);

            // 1. Update Leave Status
            batch.update(doc(db, "leaves", leaveId), { status: "Approved" });

            // 2. Deduct Balance
            batch.update(doc(db, "leave_balances", balanceRecord.id!), {
                balance: Number((balanceRecord.balance - deduction).toFixed(2))
            });

            // 3. Notify Employee
            const notifRef = doc(collection(db, "notifications"));
            batch.set(notifRef, {
                title: "✅ Leave Approved",
                message: `Your request for ${leave.type} (${deduction} days) has been approved.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: leave.empEmail,
                targetRole: "employee",
                companyName
            });

            await batch.commit();
            toast.success("Leave Request Approved");
        } catch (e) {
            console.error("Error approving leave:", e);
        }
    };

    const rejectLeaveRequest = async (leaveId: string) => {
        const leave = leaves.find(l => l.id === leaveId);
        if (!leave) return;

        try {
            await updateDoc(doc(db, "leaves", leaveId), { status: "Denied" });
            await addDoc(collection(db, "notifications"), {
                title: "❌ Leave Rejected",
                message: `Your request for ${leave.type} has been rejected.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                targetEmail: leave.empEmail,
                targetRole: "employee",
                companyName
            });
            toast.info("Leave Request Rejected");
        } catch (e) {
            console.error(e);
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
            const chatReadDocRef = doc(db, "chat_reads", key);
            await updateDoc(chatReadDocRef, { readAt: now, myEmail, contactEmail }).catch(async (error) => {
                if (error.code === "not-found") {
                    // Document doesn't exist yet — create it
                    await setDoc(chatReadDocRef, { myEmail, contactEmail, readAt: now });
                } else {
                    throw error;
                }
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

    const deleteMessage = async (msgId: string) => {
        try {
            await deleteDoc(doc(db, "chat_messages", msgId));
        } catch (e) {
            console.error("Error deleting message:", e);
        }
    };

    const clearChat = async (myEmail: string, contactEmail: string) => {
        try {
            const batch = writeBatch(db);
            const messagesToDelete = chatMessages.filter(m =>
                (m.sender === myEmail && m.receiver === contactEmail) ||
                (m.receiver === myEmail && m.sender === contactEmail)
            );

            messagesToDelete.forEach(m => {
                if (m.id) batch.delete(doc(db, "chat_messages", m.id));
            });

            await batch.commit();
        } catch (e) {
            console.error("Error clearing chat:", e);
        }
    };

    const reactToMessage = async (msgId: string, reaction: string | null) => {
        try {
            await updateDoc(doc(db, "chat_messages", msgId), { reaction });
        } catch (e) {
            console.error("Error reacting to message:", e);
        }
    };

    const uploadProfileImage = async (file: File) => {
        if (!user?.uid) {
            toast.error("Upload Failed", { description: "User session not found." });
            return;
        }
        try {
            const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
            const { storage } = await import("@/lib/firebase");

            const safeCompanyName = companyName || "standalone_users";
            const storageRef = ref(storage, `profiles/${safeCompanyName}/${user.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update employee record
            const emp = employees.find(e => e.email === user.email);
            if (emp?.id) {
                await updateDoc(doc(db, "employees", emp.id), { photoURL: downloadURL });
            } else if (role === "employer") {
                await setDoc(doc(db, "employees", user.uid), { photoURL: downloadURL, companyName: companyName || "", role: "employer", email: user.email }, { merge: true });
            }

            // Also update the users collection if it exists for auth metadata
            const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
            if (!usersSnap.empty) {
                await updateDoc(doc(db, "users", usersSnap.docs[0].id), { photoURL: downloadURL });
            }

            toast.success("Profile Picture Updated", { description: "Your profile picture has been updated successfully." });
        } catch (e) {
            console.error("Error uploading profile image:", e);
            toast.error("Upload Failed", { description: "Failed to upload your profile picture. Please try again." });
        }
    };

    return (
        <AppContext.Provider value={{
            employees, addEmployee, removeEmployee, deleteEmployeeCascade, updateEmployeePermissions, updateEmployee,
            approveRegistration, rejectRegistration, pendingRegistrations,
            profileUpdates, requestProfileUpdate, approveProfileUpdate, rejectProfileUpdate,
            leaves, requestLeave, updateLeaveStatus, approveLeaveRequest, rejectLeaveRequest,
            leaveBalances, addLeaveBalance, bulkAddLeaveBalances, updateLeaveBalance, deleteLeaveBalance,
            payroll, processPayroll, requestPayslip, payslipRequests, fulfillPayslipRequest,
            announcements, addAnnouncement, deleteAnnouncement,
            attendance, clockIn, clockOut, takeBreak, endBreak,
            tasks, addTask, updateTaskStatus, manageTaskTeam, deleteTask, updateTask, addTaskComment, addTaskAttachment,
            documents, requestDocument, requestMultipleDocuments, sendDocumentReminder, uploadDocument, updateDocumentStatus,
            docTemplates, addDocTemplate, updateDocTemplate, deleteDocTemplate,
            notifications, createNotification, markNotificationRead,
            jobs, addJob, updateJobStatus,
            teams, createTeam, updateTeam, deleteTeam,
            chatMessages, sendMessage, deleteMessage, clearChat, reactToMessage, markChatRead, chatReadTimestamps,
            uploadProfileImage
        }}>
            {children}
        </AppContext.Provider>
    );
};
