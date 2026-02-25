Firebase setup instructions. Please log into Firebase yourself per user prompt.
1) Login via browser to: console.firebase.google.com
2) Create brand new project for 'SmartHR'
3) Configure a Web App inside Firebase config dashboard.
4) Get the credentials and update your project's .env.local respectively:
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
5) Enable 'Firestore Database' with test mode (or strictly locked rules as preferred) in the portal.
Because the web console interactions require google account multi-auth that automation scripts cannot bypass currently, this part must be driven by the developer themselves.
