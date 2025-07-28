// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAnK8VTA4ISlCwOWmODG6yuzNHP3VK6TaI",
    authDomain: "solidpoint-scheduler.firebaseapp.com",
    projectId: "solidpoint-scheduler",
    storageBucket: "solidpoint-scheduler.firebasestorage.app",
    messagingSenderId: "75920906122",
    appId: "1:75920906122:web:441bbe4e5228d2c107da73"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other files
window.auth = auth;
window.db = db; 