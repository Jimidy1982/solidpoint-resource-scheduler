# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Create a project"
3. Enter project name: `solidpoint-scheduler`
4. Click "Continue"
5. Disable Google Analytics (optional)
6. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Click "Email/Password" under "Sign-in method"
4. Enable "Email/Password"
5. Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Choose a location close to your users (e.g., europe-west1)
5. Click "Done"

## Step 4: Get Firebase Config

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Enter app nickname: `solidpoint-scheduler-web`
6. Click "Register app"
7. Copy the firebaseConfig object

## Step 5: Update firebase-config.js

Replace the placeholder config in `firebase-config.js` with your actual Firebase config.

## Step 6: Create Admin User

1. In Firebase Console, go to "Authentication" → "Users"
2. Click "Add user"
3. Enter your email: `j.pegg@solidpoint.co.uk`
4. Enter password: `L@nnibob123`
5. Click "Add user"

## Step 7: Set Up Security Rules

In Firestore Database → Rules, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User data subcollection
      match /data/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Step 8: Test the Setup

1. Open your app at: https://Jimidy1982.github.io/solidpoint-resource-scheduler
2. Try signing in with your credentials
3. Check that data is being saved to Firestore

## Next Steps

After completing this setup, I'll help you:
1. Update the app to use cloud storage
2. Add user role management
3. Implement real-time collaboration
4. Add sharing features 