// 1. Import Firebase tools directly from Google's servers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyAJVQSEk0OyhPsH-GBbchHQv0jbPujV9c4",
  authDomain: "salah-tracker-jc.firebaseapp.com",
  projectId: "salah-tracker-jc",
  storageBucket: "salah-tracker-jc.firebasestorage.app",
  messagingSenderId: "539730158357",
  appId: "1:539730158357:web:6cd1a1851dfc5d21073f1c"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app)

// 4. HTML Elements
const authSection = document.getElementById('auth-section');
const trackerSection = document.getElementById('tracker-section');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('auth-error');

// ------DATABASE HELPER FUNCTIONS-----

// Gets today's date in YYYY-MM-DD format
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
}

// NEW: Calculates and updates the visual progress bar
function updateProgress() {
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let completedCount = 0;
    
    prayers.forEach(prayer => {
        if (document.getElementById(prayer).checked) {
            completedCount++;
        }
    });
    
    const percentage = (completedCount / 5) * 100;
    document.getElementById('progress-text').innerText = `${completedCount} of 5 completed`;
    document.getElementById('progress-fill').style.width = `${percentage}%`;
}

// Load today's data from Firebase when logged in
async function loadTodaySalah(userId){
    const dateStr = getTodayDateString();
    // Point to the specific document for today
    const docRef = doc(db, "users", userId, "salah", dateStr);

    try{
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};

        // Loop through salah and check boxes if they are true in the database
        ['fajr','dhuhr','asr','maghrib', 'isha'].forEach(salah => {
            document.getElementById(salah).checked = data[salah] || false;
        })

        // Update the progress bar after loading the database data
        updateProgress();
    } catch (error){
        console.error("Error loading salah:", error);
    }
}

// Listen for checkbox clicks and save them instantly
['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(salah => {
    document.getElementById(salah).addEventListener('change', async (e) => {
        // Instantly update visual progress
        updateProgress();

        const user = auth.currentUser;
        if (!user) return; // Stop if not logged in

        const dateStr = getTodayDateString();
        const docRef = doc(db, "users", user.uid, "salah", dateStr);

        try {
            // setDoc with {merge: true} updates just this one prayer without deleting the others
            await setDoc(docRef, {
                [salah]: e.target.checked
            }, {merge: true});
        } catch (error){
            console.error("Error saving prayer", error);
        }
    })
})

// 5. Authentication Logic: Sign Up
document.getElementById('signup-btn').addEventListener('click',() => {
    const email = emailInput.value;
    const password = passwordInput.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {errorMsg.innerText = "Account created successfully!"})
        .catch((error) => {errorMsg.innerText = error.message});
})

// 6. Authentication Logic: Log In
document.getElementById('login-btn').addEventListener('click', () =>{
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {errorMsg.innerText = error.message});
})

// 7. Authentication Logic: Log out
document.getElementById('logout-btn').addEventListener('click',() => {
    signOut(auth);
})

// 8. Listen for Login/Logout state changes
onAuthStateChanged(auth,(user) => {
    if(user){
        // User is loggen in
        authSection.classList.add('hidden');
        trackerSection.classList.remove('hidden');

        // Show today's date
        const today = new Date().toLocaleDateString();
        document.getElementById('current-date').innerText = `Date: ${today}`;

        // Fetch today's checkboxes from the database
        loadTodaySalah(user.uid);
    }else {
        // User is logged out
        authSection.classList.remove('hidden');
        trackerSection.classList.add('hidden');
        emailInput.value = "";
        passwordInput.value = "";

        // Clear checkboxes visually when logging out
        ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer =>{
            document.getElementById(prayer).checked = false;
        })
        // Reset the progress bar visually on logout
        updateProgress();
    }
})