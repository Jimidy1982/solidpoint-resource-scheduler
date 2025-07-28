/**
 * Authentication UI and form handling
 */

// Global variables
let currentTab = 'signin';

/**
 * Switch between sign in and sign up tabs
 */
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide forms
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    
    if (tab === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
    
    // Clear error messages
    document.getElementById('signinError').textContent = '';
    document.getElementById('signupError').textContent = '';
}

/**
 * Handle sign in form submission
 */
async function handleSignIn(event) {
    event.preventDefault();
    
    console.log('Sign in button clicked!');
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const errorElement = document.getElementById('signinError');
    
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    try {
        console.log('Calling AuthService.signIn...');
        const result = await AuthService.signIn(email, password);
        console.log('AuthService result:', result);
        
        if (result.success) {
            errorElement.textContent = '';
            console.log('Sign in successful!');
            // AuthService will handle showing the main app
        } else {
            errorElement.textContent = result.error;
            console.log('Sign in failed:', result.error);
        }
    } catch (error) {
        errorElement.textContent = 'An unexpected error occurred. Please try again.';
        console.error('Sign in error:', error);
    }
}

/**
 * Handle sign up form submission
 */
async function handleSignUp(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorElement = document.getElementById('signupError');
    
    try {
        const result = await AuthService.signUp(email, password, name);
        if (result.success) {
            errorElement.textContent = '';
            // AuthService will handle showing the main app
        } else {
            errorElement.textContent = result.error;
        }
    } catch (error) {
        errorElement.textContent = 'An unexpected error occurred. Please try again.';
        console.error('Sign up error:', error);
    }
}

/**
 * Handle sign out
 */
async function handleSignOut() {
    try {
        await AuthService.signOut();
        // AuthService will handle showing the login form
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * Update user info display
 */
function updateUserInfo() {
    const user = AuthService.currentUser;
    const userDisplayName = document.getElementById('userDisplayName');
    const userRole = document.getElementById('userRole');
    
    if (user) {
        userDisplayName.textContent = user.displayName || user.email;
        userRole.textContent = AuthService.userRole || 'viewer';
    } else {
        userDisplayName.textContent = '';
        userRole.textContent = '';
    }
}

/**
 * Initialize authentication UI
 */
function initAuthUI() {
    // Add event listeners
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
    
    // Initialize AuthService
    AuthService.init();
    
    // Update user info when auth state changes
    auth.onAuthStateChanged(() => {
        updateUserInfo();
    });
}

// User Menu Functionality
function initUserMenu() {
    const userMenuTrigger = document.getElementById('userMenuTrigger');
    const userMenu = document.getElementById('userMenu');
    const userMenuContainer = document.querySelector('.user-menu-container');
    
    if (userMenuTrigger && userMenu) {
        // Toggle menu on click
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuContainer.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuContainer.contains(e.target)) {
                userMenuContainer.classList.remove('open');
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userMenuContainer.classList.remove('open');
            }
        });
        
        // Menu action handlers
        setupMenuActions();
    }
}

function setupMenuActions() {
    // Profile Settings
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showProfileSettings();
        });
    }
    
    // Theme Settings
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            showThemeSettings();
        });
    }
    
    // Help & Support
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showHelpSupport();
        });
    }
    
    // About
    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            showAbout();
        });
    }
}

function showProfileSettings() {
    alert('Profile Settings - Coming Soon!\n\nThis will allow you to:\n• Update your display name\n• Change your email\n• Update your password\n• Manage account preferences');
}

function showThemeSettings() {
    const themes = [
        { name: 'Default Purple', class: 'theme-default' },
        { name: 'Dark Mode', class: 'theme-dark' },
        { name: 'Light Mode', class: 'theme-light' },
        { name: 'High Contrast', class: 'theme-high-contrast' }
    ];
    
    const themeNames = themes.map(t => t.name).join('\n• ');
    alert(`Theme Settings - Coming Soon!\n\nAvailable themes:\n• ${themeNames}\n\nThis will allow you to customize the app's appearance.`);
}

function showHelpSupport() {
    const helpContent = `
Help & Support

📖 User Guide:
• Click and drag projects to move them
• Right-click projects for more options
• Use Ctrl+Click to select multiple projects
• Hold navigation arrows for fast scrolling

🛠️ Common Tasks:
• Add Groups: Click "+ Add Group" in sidebar
• Add Resources: Click "+ Add Resource" in groups
• Add Projects: Click "+ Add Project" or drag to timeline
• Group Projects: Select projects and use "Group Projects" button

📧 Contact Support:
Email: support@solidpoint.co.uk
Phone: +44 (0) 1234 567890

🔄 Keyboard Shortcuts:
• Ctrl+S: Save (auto-save is enabled)
• Ctrl+Z: Undo (coming soon)
• Ctrl+Y: Redo (coming soon)
• Escape: Close dialogs
    `;
    
    alert(helpContent);
}

function showAbout() {
    const aboutContent = `
SolidPoint Resource Organiser
Version 1.0.0

A powerful resource scheduling and project management tool designed for teams.

Features:
✅ Real-time collaboration
✅ Cloud storage with Firebase
✅ User role management
✅ Project grouping
✅ Timeline visualization
✅ Export capabilities

Built with:
• HTML5, CSS3, JavaScript
• Firebase Authentication & Firestore
• Modern web technologies

© 2024 SolidPoint. All rights reserved.
    `;
    
    alert(aboutContent);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initUserMenu();
});

// Simple test to see if this file loads
console.log('[AUTH] Auth.js file loaded successfully!');
console.log('[AUTH] Firebase auth object:', typeof auth !== 'undefined' ? 'Available' : 'NOT AVAILABLE');
console.log('[AUTH] AuthService object:', typeof AuthService !== 'undefined' ? 'Available' : 'NOT AVAILABLE'); 