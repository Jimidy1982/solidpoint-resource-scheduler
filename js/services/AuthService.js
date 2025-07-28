/**
 * Authentication service for user management
 */

const AuthService = {
    currentUser: null,
    userRole: null,

    /**
     * Initialize authentication
     */
    init() {
        console.log('[AUTH] AuthService.init() called');
        
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            console.log('[AUTH] Auth state changed:', user ? 'User logged in' : 'No user');
            console.log('[AUTH] User details:', user);
            
            this.currentUser = user;
            if (user) {
                console.log('[AUTH] User is authenticated, loading role...');
                this.loadUserRole();
            } else {
                console.log('[AUTH] No user, showing login form...');
                this.userRole = null;
                this.showLoginForm();
            }
        });
    },

    /**
     * Sign up new user
     */
    async signUp(email, password, displayName) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({
                displayName: displayName
            });

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                email: email,
                displayName: displayName,
                role: 'viewer', // Default role
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: 'j.pegg@solidpoint.co.uk' // You as admin
            });

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in user
     */
    async signIn(email, password) {
        try {
            console.log('AuthService.signIn called with email:', email);
            console.log('Firebase auth object:', auth);
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('Sign in successful, user:', userCredential.user);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign out user
     */
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Load user role from Firestore
     */
    async loadUserRole() {
        console.log('[AUTH] loadUserRole() called');
        if (!this.currentUser) {
            console.log('[AUTH] No current user, returning');
            return;
        }

        try {
            console.log('[AUTH] Loading user role for:', this.currentUser.uid);
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                this.userRole = userDoc.data().role || 'viewer';
                console.log('[AUTH] User role loaded:', this.userRole);
            } else {
                console.log('[AUTH] User document does not exist, creating new user');
                // Create new user with default role
                await db.collection('users').doc(this.currentUser.uid).set({
                    email: this.currentUser.email,
                    role: 'viewer',
                    createdAt: new Date()
                });
                this.userRole = 'viewer';
                console.log('[AUTH] New user created with role:', this.userRole);
            }
            
            // Always hide login form and update user info after role is loaded
            this.hideLoginForm();
            this.updateUserInfo();
            
            // Notify app that user is ready
            if (window.app && window.app.onUserReady) {
                window.app.onUserReady();
            }
        } catch (error) {
            console.error('[AUTH] Error loading user role:', error);
            this.userRole = 'viewer';
            this.hideLoginForm();
            this.updateUserInfo();
            
            // Notify app that user is ready even on error
            if (window.app && window.app.onUserReady) {
                window.app.onUserReady();
            }
        }
    },

    /**
     * Check if user has permission to edit
     */
    canEdit() {
        return this.userRole === 'editor' || this.userRole === 'admin';
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.userRole === 'admin';
    },

    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, newRole) {
        if (!this.isAdmin()) {
            throw new Error('Only admins can update user roles');
        }

        try {
            await db.collection('users').doc(userId).update({
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.currentUser.uid
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user role:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Show login form
     */
    showLoginForm() {
        console.log('[AUTH] showLoginForm() called');
        
        // Hide main app content
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'none';
            console.log('[AUTH] Hidden main app');
        } else {
            console.log('[AUTH] Main app not found');
        }

        // Show login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.style.display = 'block';
            console.log('[AUTH] Showed login form');
        } else {
            console.log('[AUTH] Login form not found');
        }
    },

    /**
     * Update user info display
     */
    updateUserInfo() {
        console.log('[AUTH] updateUserInfo() called');
        if (this.currentUser) {
            // Update main display
            const userDisplayName = document.getElementById('userDisplayName');
            const userRole = document.getElementById('userRole');
            
            if (userDisplayName) {
                userDisplayName.textContent = this.currentUser.email;
            }
            
            if (userRole) {
                userRole.textContent = this.userRole || 'viewer';
                userRole.className = `role-badge ${this.userRole || 'viewer'}`;
            }
            
            // Update menu details
            const userInitials = document.getElementById('userInitials');
            const userFullName = document.getElementById('userFullName');
            const userEmail = document.getElementById('userEmail');
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            
            if (userInitials) {
                const email = this.currentUser.email || '';
                const name = this.currentUser.displayName || email.split('@')[0];
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                userInitials.textContent = initials;
            }
            
            if (userFullName) {
                userFullName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            }
            
            if (userEmail) {
                userEmail.textContent = this.currentUser.email;
            }
            
            if (userRoleDisplay) {
                userRoleDisplay.textContent = this.userRole || 'viewer';
            }
            
            console.log('[AUTH] User info updated:', this.currentUser.email, this.userRole);
        }
    },

    /**
     * Hide login form and show app
     */
    hideLoginForm() {
        console.log('[AUTH] hideLoginForm() called');
        
        // Show main app content
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
            console.log('[AUTH] Showed main app');
        } else {
            console.log('[AUTH] Main app not found');
        }

        // Hide login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.style.display = 'none';
            console.log('[AUTH] Hidden login form');
        } else {
            console.log('[AUTH] Login form not found');
        }
    }
}; 