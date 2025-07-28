# Firebase setup script
Write-Host "Setting up Firebase project for SolidPoint Resource Scheduler..." -ForegroundColor Green

# Check if Firebase CLI is installed
try {
    firebase --version
    Write-Host "Firebase CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "Firebase CLI not found. Please install it first:" -ForegroundColor Yellow
    Write-Host "npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host "Then run: firebase login" -ForegroundColor Yellow
    exit 1
}

# Initialize Firebase project
Write-Host "Initializing Firebase project..." -ForegroundColor Green
firebase init firestore --project solidpoint-scheduler

Write-Host "Firebase setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Firebase Console: https://console.firebase.google.com/" -ForegroundColor Yellow
Write-Host "2. Select your project: solidpoint-scheduler" -ForegroundColor Yellow
Write-Host "3. Enable Authentication (Email/Password)" -ForegroundColor Yellow
Write-Host "4. Get your web app config" -ForegroundColor Yellow 