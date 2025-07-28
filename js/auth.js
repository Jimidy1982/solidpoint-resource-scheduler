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
 * Setup password toggle functionality for login forms
 */
function setupPasswordToggles() {
    // Sign in password toggle
    const toggleSigninBtn = document.getElementById('toggleSigninPassword');
    const signinPasswordInput = document.getElementById('signinPassword');
    
    if (toggleSigninBtn && signinPasswordInput) {
        toggleSigninBtn.addEventListener('click', () => {
            togglePasswordVisibility(signinPasswordInput, toggleSigninBtn);
        });
    }
    
    // Sign up password toggle
    const toggleSignupBtn = document.getElementById('toggleSignupPassword');
    const signupPasswordInput = document.getElementById('signupPassword');
    
    if (toggleSignupBtn && signupPasswordInput) {
        toggleSignupBtn.addEventListener('click', () => {
            togglePasswordVisibility(signupPasswordInput, toggleSignupBtn);
        });
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(passwordInput, toggleBtn) {
    const passwordIcon = toggleBtn.querySelector('.password-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        passwordIcon.textContent = 'Show';
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
        // For demo purposes, check if email contains specific keywords to determine user role
        // In a real implementation, you'd check user roles from Firestore
        let userRole = 'viewer'; // Default role
        if (user.email) {
            const email = user.email.toLowerCase();
            if (email.includes('admin') || email.includes('solidpoint.co.uk') || email.includes('j.pegg')) {
                userRole = 'admin';
            } else if (email.includes('editor') || email.includes('edit')) {
                userRole = 'editor';
            } else if (email.includes('viewer') || email.includes('view')) {
                userRole = 'viewer';
            }
        }
        const isAdmin = userRole === 'admin';
        
        userDisplayName.textContent = user.displayName || user.email;
        userRole.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1); // Capitalize first letter
        
        // Show/hide admin-only features
        const userManagementBtn = document.getElementById('userManagementBtn');
        if (userManagementBtn) {
            userManagementBtn.style.display = isAdmin ? 'block' : 'none';
        }
        
        // Update user menu details
        const userFullName = document.getElementById('userFullName');
        const userEmail = document.getElementById('userEmail');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const userInitials = document.getElementById('userInitials');
        
        if (userFullName) {
            userFullName.textContent = user.displayName || user.email.split('@')[0];
        }
        if (userEmail) {
            userEmail.textContent = user.email;
        }
        if (userRoleDisplay) {
            userRoleDisplay.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        }
        if (userInitials) {
            const name = user.displayName || user.email.split('@')[0];
            userInitials.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
    } else {
        userDisplayName.textContent = '';
        userRole.textContent = '';
        
        // Hide admin features when logged out
        const userManagementBtn = document.getElementById('userManagementBtn');
        if (userManagementBtn) {
            userManagementBtn.style.display = 'none';
        }
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
    
    // Add password toggle functionality
    setupPasswordToggles();
    
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
        
        // Setup User Management modal close buttons
        setupUserManagementModal();
    }
}

function setupUserManagementModal() {
    // Close button
    const closeBtn = document.getElementById('userManagementModalClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeUserManagement();
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('userManagementCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeUserManagement();
        });
    }
    
    // Close on outside click
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeUserManagement();
            }
        });
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
    
    // User Management (Admin only)
    const userManagementBtn = document.getElementById('userManagementBtn');
    if (userManagementBtn) {
        userManagementBtn.addEventListener('click', () => {
            showUserManagement();
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
    // Open the profile settings modal
    if (typeof openProfileSettings === 'function') {
        openProfileSettings();
    } else {
        console.error('[AUTH] openProfileSettings function not found');
        alert('Profile Settings - Coming Soon!\n\nThis will allow you to:\n• Update your display name\n• Change your email\n• Update your password\n• Manage account preferences');
    }
}

function showThemeSettings() {
    // Open the theme settings modal
    if (typeof openThemeSettings === 'function') {
        openThemeSettings();
    } else {
        console.error('[AUTH] openThemeSettings function not found');
        alert('Theme Settings - Coming Soon!\n\nThis will allow you to:\n• Choose from preset themes\n• Customize colors\n• Save your preferences');
    }
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

// User Management Functions
function showUserManagement() {
    // Check if user is admin
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to access user management.');
        return;
    }
    
    // For now, we'll show a basic user management interface
    // In a real implementation, you'd check user roles from Firestore
    console.log('[USER MANAGEMENT] Opening user management...');
    
    // Show the user management modal
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.style.display = 'flex';
        loadUsers();
    } else {
        console.error('[USER MANAGEMENT] Modal not found');
    }
}

function loadUsers() {
    // For demo purposes, we'll show some sample users
    // In a real implementation, you'd fetch users from Firestore
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    const sampleUsers = [
        { id: '1', name: 'Admin User', email: 'admin@solidpoint.com', role: 'admin' },
        { id: '2', name: 'John Smith', email: 'john@solidpoint.com', role: 'editor' },
        { id: '3', name: 'Jane Doe', email: 'jane@solidpoint.com', role: 'editor' },
        { id: '4', name: 'Bob Wilson', email: 'bob@solidpoint.com', role: 'viewer' },
        { id: '5', name: 'Alice Johnson', email: 'alice@solidpoint.com', role: 'viewer' }
    ];
    
    userList.innerHTML = sampleUsers.map(user => `
        <div class="user-item" data-user-id="${user.id}">
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-role ${user.role}">${user.role}</div>
            </div>
            <div class="user-actions">
                <select class="role-selector" onchange="changeUserRole('${user.id}', this.value)">
                    <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                    <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>Editor</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <button class="user-action-btn danger" onclick="deleteUser('${user.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function changeUserRole(userId, newRole) {
    console.log(`[USER MANAGEMENT] Changing user ${userId} role to ${newRole}`);
    // In a real implementation, you'd update the user role in Firestore
    alert(`User role changed to ${newRole}. In a real implementation, this would be saved to the database.`);
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        console.log(`[USER MANAGEMENT] Deleting user ${userId}`);
        // In a real implementation, you'd delete the user from Firestore
        alert('User deleted. In a real implementation, this would be removed from the database.');
        
        // Remove from UI
        const userItem = document.querySelector(`[data-user-id="${userId}"]`);
        if (userItem) {
            userItem.remove();
        }
    }
}

function closeUserManagement() {
    const modal = document.getElementById('userManagementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Expose functions globally for HTML onclick handlers
window.showUserManagement = showUserManagement;
window.changeUserRole = changeUserRole;
window.deleteUser = deleteUser;
window.closeUserManagement = closeUserManagement; 