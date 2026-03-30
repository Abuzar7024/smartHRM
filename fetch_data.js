require('dotenv').config({ path: '.env.local' });

const admin = require('./node_modules/firebase-admin');

const serviceAccount = {
    projectId: "smarthr-96738",
    clientEmail: "firebase-adminsdk-fbsvc@smarthr-96738.iam.gserviceaccount.com",
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function analyze() {
    const usersSnap = await db.collection('users').get();
    const employeesSnap = await db.collection('employees').get();
    const tasksSnap = await db.collection('tasks').get();
    const leavesSnap = await db.collection('leaves').get();
    const teamsSnap = await db.collection('teams').get();

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const employees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const leaves = leavesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(JSON.stringify({ users, employees, tasks, leaves, teams }, null, 2));
}

analyze().catch(console.error);
