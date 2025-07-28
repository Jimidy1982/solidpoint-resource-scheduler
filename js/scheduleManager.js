// Schedule Management System
class ScheduleManager {
    constructor() {
        this.currentSchedule = null;
        this.schedules = [];
        this.sharedSchedules = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSchedules();
        this.updateCurrentScheduleDisplay();
    }

    setupEventListeners() {
        // Schedule dropdown toggle
        const scheduleTrigger = document.getElementById('scheduleDropdownTrigger');
        if (scheduleTrigger) {
            scheduleTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleScheduleDropdown();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.schedule-selector')) {
                this.closeScheduleDropdown();
            }
        });

        // New schedule button
        const newScheduleBtn = document.getElementById('newScheduleBtn');
        if (newScheduleBtn) {
            newScheduleBtn.addEventListener('click', () => {
                this.openNewScheduleModal();
            });
        }

        // Duplicate schedule button
        const duplicateScheduleBtn = document.getElementById('duplicateScheduleBtn');
        if (duplicateScheduleBtn) {
            duplicateScheduleBtn.addEventListener('click', () => {
                this.openDuplicateScheduleModal();
            });
        }

        // Modal close buttons
        this.setupModalCloseButtons();
        
        // Form submissions
        this.setupFormSubmissions();
    }

    setupModalCloseButtons() {
        // New Schedule Modal
        const newScheduleModalClose = document.getElementById('newScheduleModalClose');
        const newScheduleCancelBtn = document.getElementById('newScheduleCancelBtn');
        if (newScheduleModalClose) {
            newScheduleModalClose.addEventListener('click', () => this.closeNewScheduleModal());
        }
        if (newScheduleCancelBtn) {
            newScheduleCancelBtn.addEventListener('click', () => this.closeNewScheduleModal());
        }

        // Edit Schedule Modal
        const editScheduleModalClose = document.getElementById('editScheduleModalClose');
        const editScheduleCancelBtn = document.getElementById('editScheduleCancelBtn');
        if (editScheduleModalClose) {
            editScheduleModalClose.addEventListener('click', () => this.closeEditScheduleModal());
        }
        if (editScheduleCancelBtn) {
            editScheduleCancelBtn.addEventListener('click', () => this.closeEditScheduleModal());
        }

        // Duplicate Schedule Modal
        const duplicateScheduleModalClose = document.getElementById('duplicateScheduleModalClose');
        const duplicateScheduleCancelBtn = document.getElementById('duplicateScheduleCancelBtn');
        if (duplicateScheduleModalClose) {
            duplicateScheduleModalClose.addEventListener('click', () => this.closeDuplicateScheduleModal());
        }
        if (duplicateScheduleCancelBtn) {
            duplicateScheduleCancelBtn.addEventListener('click', () => this.closeDuplicateScheduleModal());
        }

        // Share Schedule Modal
        const shareScheduleModalClose = document.getElementById('shareScheduleModalClose');
        const shareScheduleCancelBtn = document.getElementById('shareScheduleCancelBtn');
        if (shareScheduleModalClose) {
            shareScheduleModalClose.addEventListener('click', () => this.closeShareScheduleModal());
        }
        if (shareScheduleCancelBtn) {
            shareScheduleCancelBtn.addEventListener('click', () => this.closeShareScheduleModal());
        }
    }

    setupFormSubmissions() {
        // New Schedule Form
        const newScheduleForm = document.getElementById('newScheduleForm');
        if (newScheduleForm) {
            newScheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewSchedule();
            });
        }

        // Edit Schedule Form
        const editScheduleForm = document.getElementById('editScheduleForm');
        if (editScheduleForm) {
            editScheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveScheduleEdit();
            });
        }

        // Duplicate Schedule Form
        const duplicateScheduleForm = document.getElementById('duplicateScheduleForm');
        if (duplicateScheduleForm) {
            duplicateScheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.duplicateCurrentSchedule();
            });
        }
    }

    toggleScheduleDropdown() {
        const scheduleSelector = document.querySelector('.schedule-selector');
        if (scheduleSelector) {
            scheduleSelector.classList.toggle('open');
        }
    }

    closeScheduleDropdown() {
        const scheduleSelector = document.querySelector('.schedule-selector');
        if (scheduleSelector) {
            scheduleSelector.classList.remove('open');
        }
    }

    loadSchedules() {
        // Load from localStorage for now, in real implementation would load from Firestore
        const savedSchedules = localStorage.getItem('schedules');
        if (savedSchedules) {
            this.schedules = JSON.parse(savedSchedules);
        } else {
            // Create default schedule
            this.schedules = [{
                id: 'default',
                name: 'My Schedule',
                description: 'Default schedule',
                owner: auth.currentUser?.email || 'unknown',
                createdAt: new Date().toISOString(),
                isDefault: true
            }];
        }

        // Set current schedule to first one
        if (this.schedules.length > 0 && !this.currentSchedule) {
            this.currentSchedule = this.schedules[0];
        }

        // Migrate existing data to default schedule if it doesn't have schedule-specific data
        this.migrateExistingData();

        this.renderScheduleList();
    }

    migrateExistingData() {
        const defaultSchedule = this.schedules.find(s => s.isDefault);
        if (!defaultSchedule) return;
        
        // Check if default schedule already has data
        const existingGroups = localStorage.getItem(`schedule_${defaultSchedule.id}_groups`);
        if (existingGroups) {
            console.log('[SCHEDULE] Default schedule already has data, skipping migration');
            return;
        }
        
        // Check for existing data in original localStorage keys
        const existingGroupsData = localStorage.getItem('sp_groups');
        const existingProjectsData = localStorage.getItem('sp_resource_data');
        
        if (existingGroupsData || existingProjectsData) {
            console.log('[SCHEDULE] Migrating existing data to default schedule...');
            
            let groups = [];
            let projects = [];
            let dayOffs = [];
            let settings = {
                viewMode: 'week',
                timelineStart: new Date().toISOString().split('T')[0]
            };
            
            if (existingGroupsData) {
                try {
                    groups = JSON.parse(existingGroupsData);
                } catch (error) {
                    console.error('[SCHEDULE] Error parsing existing groups:', error);
                }
            }
            
            if (existingProjectsData) {
                try {
                    const projectData = JSON.parse(existingProjectsData);
                    projects = projectData.projects || [];
                    dayOffs = projectData.dayOffs || [];
                    settings = projectData.settings || settings;
                } catch (error) {
                    console.error('[SCHEDULE] Error parsing existing projects:', error);
                }
            }
            
            // Save migrated data to default schedule using folder-like structure
            const schedulePrefix = `schedule_${defaultSchedule.id}`;
            localStorage.setItem(`${schedulePrefix}_groups`, JSON.stringify(groups));
            localStorage.setItem(`${schedulePrefix}_projects`, JSON.stringify(projects));
            localStorage.setItem(`${schedulePrefix}_dayoffs`, JSON.stringify(dayOffs));
            localStorage.setItem(`${schedulePrefix}_settings`, JSON.stringify(settings));
            
            console.log('[SCHEDULE] Successfully migrated existing data to default schedule');
        }
    }

    renderScheduleList() {
        const scheduleList = document.getElementById('scheduleList');
        if (!scheduleList) return;

        scheduleList.innerHTML = this.schedules.map(schedule => `
            <div class="schedule-item ${schedule.id === this.currentSchedule?.id ? 'active' : ''}" 
                 data-schedule-id="${schedule.id}">
                <div class="schedule-item-info">
                    <div class="schedule-item-name">${schedule.name}</div>
                    <div class="schedule-item-description">${schedule.description || ''}</div>
                </div>
                <div class="schedule-item-actions">
                    <button class="schedule-action-btn" onclick="scheduleManager.editSchedule('${schedule.id}')" title="Edit">
                        &#9998;
                    </button>
                    <button class="schedule-action-btn" onclick="scheduleManager.shareSchedule('${schedule.id}')" title="Share">
                        &#128229;
                    </button>
                    <button class="schedule-action-btn" onclick="scheduleManager.deleteSchedule('${schedule.id}')" title="Delete">
                        &#128465;
                    </button>
                </div>
            </div>
        `).join('');

        // Add click listeners to schedule items
        scheduleList.querySelectorAll('.schedule-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.schedule-item-actions')) {
                    const scheduleId = item.dataset.scheduleId;
                    this.switchToSchedule(scheduleId);
                }
            });
        });
    }

    switchToSchedule(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (schedule) {
            // Save current schedule data before switching
            if (this.currentSchedule && typeof window.app !== 'undefined') {
                this.saveScheduleData(this.currentSchedule.id);
            }
            
            this.currentSchedule = schedule;
            this.updateCurrentScheduleDisplay();
            this.closeScheduleDropdown();
            
            // Load schedule-specific data
            this.loadScheduleData(scheduleId);
            console.log(`[SCHEDULE] Switched to: ${schedule.name}`);
        }
    }

    loadScheduleData(scheduleId) {
        console.log(`[SCHEDULE] Loading data for schedule: ${scheduleId}`);
        
        // Load schedule-specific data from localStorage using folder-like structure
        const schedulePrefix = `schedule_${scheduleId}`;
        
        // Load groups
        const groupsData = localStorage.getItem(`${schedulePrefix}_groups`);
        const groups = groupsData ? JSON.parse(groupsData) : [];
        
        // Load projects
        const projectsData = localStorage.getItem(`${schedulePrefix}_projects`);
        const projects = projectsData ? JSON.parse(projectsData) : [];
        
        // Load day-offs
        const dayoffsData = localStorage.getItem(`${schedulePrefix}_dayoffs`);
        const dayoffs = dayoffsData ? JSON.parse(dayoffsData) : [];
        
        // Load settings
        const settingsData = localStorage.getItem(`${schedulePrefix}_settings`);
        const settings = settingsData ? JSON.parse(settingsData) : {
            viewMode: 'week',
            timelineStart: new Date().toISOString().split('T')[0]
        };
        
        // Completely replace the global app data with schedule-specific data
        if (typeof window.app !== 'undefined') {
            // Clear current data completely
            window.app.groups = [];
            window.app.data = {
                projects: [],
                dayOffs: [],
                settings: {
                    viewMode: 'week',
                    timelineStart: new Date().toISOString().split('T')[0]
                }
            };
            
            // Now load the new schedule's data
            window.app.groups = groups;
            window.app.data = {
                projects: projects,
                dayOffs: dayoffs,
                settings: settings
            };
            
            console.log(`[SCHEDULE] Replaced app data - Groups: ${groups.length}, Projects: ${projects.length}`);
        }
        
        // Force a complete re-render of the timeline
        if (typeof renderTimeline === 'function') {
            console.log(`[SCHEDULE] Calling renderTimeline() to refresh display`);
            renderTimeline();
        }
        
        console.log(`[SCHEDULE] Loaded data for schedule: ${scheduleId} - Groups: ${groups.length}, Projects: ${projects.length}`);
    }

    saveScheduleData(scheduleId) {
        // Save current app data to schedule-specific storage using folder-like structure
        const schedulePrefix = `schedule_${scheduleId}`;
        
        // Save groups separately
        localStorage.setItem(`${schedulePrefix}_groups`, JSON.stringify(window.app?.groups || []));
        
        // Save projects separately  
        localStorage.setItem(`${schedulePrefix}_projects`, JSON.stringify(window.app?.data?.projects || []));
        
        // Save day-offs separately
        localStorage.setItem(`${schedulePrefix}_dayoffs`, JSON.stringify(window.app?.data?.dayOffs || []));
        
        // Save settings separately
        localStorage.setItem(`${schedulePrefix}_settings`, JSON.stringify(window.app?.data?.settings || {
            viewMode: 'week',
            timelineStart: new Date().toISOString().split('T')[0]
        }));
        
        console.log(`[SCHEDULE] Saved data for schedule: ${scheduleId}`);
    }

    updateCurrentScheduleDisplay() {
        const currentScheduleName = document.getElementById('currentScheduleName');
        if (currentScheduleName && this.currentSchedule) {
            currentScheduleName.textContent = this.currentSchedule.name;
        }
    }

    openNewScheduleModal() {
        const modal = document.getElementById('newScheduleModal');
        if (modal) {
            modal.style.display = 'flex';
            this.closeScheduleDropdown();
        }
    }

    closeNewScheduleModal() {
        const modal = document.getElementById('newScheduleModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('newScheduleForm').reset();
        }
    }

    openDuplicateScheduleModal() {
        const modal = document.getElementById('duplicateScheduleModal');
        if (modal) {
            // Pre-fill with current schedule name
            const nameInput = document.getElementById('duplicateScheduleName');
            if (nameInput && this.currentSchedule) {
                nameInput.value = `${this.currentSchedule.name} (Copy)`;
            }
            modal.style.display = 'flex';
            this.closeScheduleDropdown();
        }
    }

    closeDuplicateScheduleModal() {
        const modal = document.getElementById('duplicateScheduleModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('duplicateScheduleForm').reset();
        }
    }

    openEditScheduleModal(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const modal = document.getElementById('editScheduleModal');
        if (modal) {
            // Pre-fill with current schedule data
            const nameInput = document.getElementById('editScheduleName');
            const descriptionInput = document.getElementById('editScheduleDescription');
            
            if (nameInput) nameInput.value = schedule.name;
            if (descriptionInput) descriptionInput.value = schedule.description || '';
            
            modal.dataset.scheduleId = scheduleId;
            modal.style.display = 'flex';
        }
    }

    closeEditScheduleModal() {
        const modal = document.getElementById('editScheduleModal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('editScheduleForm').reset();
        }
    }

    saveScheduleEdit() {
        const modal = document.getElementById('editScheduleModal');
        const scheduleId = modal?.dataset.scheduleId;
        const schedule = this.schedules.find(s => s.id === scheduleId);
        
        if (!schedule) return;

        const name = document.getElementById('editScheduleName').value.trim();
        const description = document.getElementById('editScheduleDescription').value.trim();
        
        if (!name) {
            alert('Please enter a schedule name');
            return;
        }

        // Update schedule
        schedule.name = name;
        schedule.description = description;
        schedule.updatedAt = new Date().toISOString();

        this.saveSchedules();
        this.renderScheduleList();
        this.updateCurrentScheduleDisplay();
        this.closeEditScheduleModal();
        
        console.log(`[SCHEDULE] Updated schedule: ${name}`);
    }

    openShareScheduleModal(scheduleId) {
        const modal = document.getElementById('shareScheduleModal');
        if (modal) {
            modal.dataset.scheduleId = scheduleId;
            this.loadSharedUsers(scheduleId);
            modal.style.display = 'flex';
        }
    }

    closeShareScheduleModal() {
        const modal = document.getElementById('shareScheduleModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    createNewSchedule() {
        const name = document.getElementById('scheduleName').value.trim();
        const description = document.getElementById('scheduleDescription').value.trim();
        
        if (!name) {
            alert('Please enter a schedule name');
            return;
        }

        const newSchedule = {
            id: 'schedule_' + Date.now(),
            name: name,
            description: description,
            owner: auth.currentUser?.email || 'unknown',
            createdAt: new Date().toISOString(),
            isDefault: false
        };

        this.schedules.push(newSchedule);
        this.saveSchedules();
        this.renderScheduleList(); // Refresh the list
        
        // Initialize empty data for the new schedule
        this.initializeEmptyScheduleData(newSchedule.id);
        
        this.switchToSchedule(newSchedule.id);
        this.closeNewScheduleModal();
        
        console.log(`[SCHEDULE] Created new schedule: ${name}`);
    }

    initializeEmptyScheduleData(scheduleId) {
        const schedulePrefix = `schedule_${scheduleId}`;
        
        // Initialize with empty data
        localStorage.setItem(`${schedulePrefix}_groups`, JSON.stringify([]));
        localStorage.setItem(`${schedulePrefix}_projects`, JSON.stringify([]));
        localStorage.setItem(`${schedulePrefix}_dayoffs`, JSON.stringify([]));
        localStorage.setItem(`${schedulePrefix}_settings`, JSON.stringify({
            viewMode: 'week',
            timelineStart: new Date().toISOString().split('T')[0]
        }));
        
        console.log(`[SCHEDULE] Initialized empty data for schedule: ${scheduleId}`);
    }

    copyScheduleData(sourceScheduleId, targetScheduleId, copyGroups, copyProjects) {
        const sourcePrefix = `schedule_${sourceScheduleId}`;
        const targetPrefix = `schedule_${targetScheduleId}`;
        
        // Copy groups if requested
        if (copyGroups) {
            const groupsData = localStorage.getItem(`${sourcePrefix}_groups`);
            if (groupsData) {
                localStorage.setItem(`${targetPrefix}_groups`, groupsData);
            }
        } else {
            localStorage.setItem(`${targetPrefix}_groups`, JSON.stringify([]));
        }
        
        // Copy projects if requested
        if (copyProjects) {
            const projectsData = localStorage.getItem(`${sourcePrefix}_projects`);
            if (projectsData) {
                localStorage.setItem(`${targetPrefix}_projects`, projectsData);
            }
        } else {
            localStorage.setItem(`${targetPrefix}_projects`, JSON.stringify([]));
        }
        
        // Always copy day-offs and settings
        const dayoffsData = localStorage.getItem(`${sourcePrefix}_dayoffs`);
        if (dayoffsData) {
            localStorage.setItem(`${targetPrefix}_dayoffs`, dayoffsData);
        }
        
        const settingsData = localStorage.getItem(`${sourcePrefix}_settings`);
        if (settingsData) {
            localStorage.setItem(`${targetPrefix}_settings`, settingsData);
        }
        
        console.log(`[SCHEDULE] Copied data from ${sourceScheduleId} to ${targetScheduleId} - Groups: ${copyGroups}, Projects: ${copyProjects}`);
    }

    duplicateCurrentSchedule() {
        if (!this.currentSchedule) {
            alert('No schedule to duplicate');
            return;
        }

        const name = document.getElementById('duplicateScheduleName').value.trim();
        const description = document.getElementById('duplicateScheduleDescription').value.trim();
        const copyGroups = document.getElementById('copyGroups').checked;
        const copyProjects = document.getElementById('copyProjects').checked;
        
        if (!name) {
            alert('Please enter a schedule name');
            return;
        }

        const duplicatedSchedule = {
            id: 'schedule_' + Date.now(),
            name: name,
            description: description,
            owner: auth.currentUser?.email || 'unknown',
            createdAt: new Date().toISOString(),
            isDefault: false,
            copiedFrom: this.currentSchedule.id,
            copyOptions: {
                groups: copyGroups,
                projects: copyProjects
            }
        };

        this.schedules.push(duplicatedSchedule);
        this.saveSchedules();
        this.renderScheduleList(); // Refresh the list
        
        // Copy data based on options
        this.copyScheduleData(this.currentSchedule.id, duplicatedSchedule.id, copyGroups, copyProjects);
        
        this.switchToSchedule(duplicatedSchedule.id);
        this.closeDuplicateScheduleModal();
        
        // Log what was copied
        if (copyGroups && !copyProjects) {
            console.log(`[SCHEDULE] Duplicated schedule: ${name} - Groups only (projects cleared)`);
        } else if (copyGroups && copyProjects) {
            console.log(`[SCHEDULE] Duplicated schedule: ${name} - Groups and projects copied`);
        } else if (!copyGroups && copyProjects) {
            console.log(`[SCHEDULE] Duplicated schedule: ${name} - Projects only (groups cleared)`);
        } else {
            console.log(`[SCHEDULE] Duplicated schedule: ${name} - Empty schedule (no groups or projects)`);
        }
    }

    editSchedule(scheduleId) {
        this.openEditScheduleModal(scheduleId);
    }

    shareSchedule(scheduleId) {
        this.openShareScheduleModal(scheduleId);
    }

    deleteSchedule(scheduleId) {
        const schedule = this.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        if (schedule.isDefault) {
            alert('Cannot delete the default schedule');
            return;
        }

        if (confirm(`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`)) {
            this.schedules = this.schedules.filter(s => s.id !== scheduleId);
            
            // If we deleted the current schedule, switch to default
            if (this.currentSchedule?.id === scheduleId) {
                const defaultSchedule = this.schedules.find(s => s.isDefault) || this.schedules[0];
                if (defaultSchedule) {
                    this.switchToSchedule(defaultSchedule.id);
                }
            }
            
            this.saveSchedules();
            this.renderScheduleList(); // Refresh the list
            console.log(`[SCHEDULE] Deleted schedule: ${schedule.name}`);
        }
    }

    loadSharedUsers(scheduleId) {
        // In real implementation, would load from Firestore
        const sharedUsersList = document.getElementById('sharedUsersList');
        if (sharedUsersList) {
            sharedUsersList.innerHTML = `
                <div class="shared-user-item">
                    <div class="shared-user-info">
                        <div class="shared-user-email">john@solidpoint.com</div>
                        <div class="shared-user-permission">Can Edit</div>
                    </div>
                    <button class="remove-share-btn" onclick="scheduleManager.removeSharedUser('${scheduleId}', 'john@solidpoint.com')">
                        Remove
                    </button>
                </div>
            `;
        }
    }

    removeSharedUser(scheduleId, userEmail) {
        // In real implementation, would update Firestore
        console.log(`[SCHEDULE] Removed shared user: ${userEmail} from schedule: ${scheduleId}`);
        this.loadSharedUsers(scheduleId);
    }

    saveSchedules() {
        localStorage.setItem('schedules', JSON.stringify(this.schedules));
    }

    getCurrentSchedule() {
        return this.currentSchedule;
    }

    getScheduleById(scheduleId) {
        return this.schedules.find(s => s.id === scheduleId);
    }
}

// Global instance
let scheduleManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    scheduleManager = new ScheduleManager();
});

// Expose globally for HTML onclick handlers
window.scheduleManager = scheduleManager; 