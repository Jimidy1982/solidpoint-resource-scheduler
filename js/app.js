/**
 * Main application file for SolidPoint Resource Organiser
 */

// Global state
let app = {
    groups: [],
    data: {
        projects: [],
        dayOffs: [], // Store day offs as date objects
        settings: {
            viewMode: 'week',
            timelineStart: null
        }
    }
};

// Flag to track if app is still initializing
let isInitializing = true;

// Navigation hold state
let navigationHoldInterval = null;
let navigationHoldDirection = 0;

// Make app globally accessible
window.app = app;
window.renderTimeline = renderTimeline;
window.GroupManager = GroupManager;
window.Timeline = Timeline;

window.isInitializing = isInitializing;

// Initialize the application
async function init() {
    console.log('[APP] App.js init function called!');
    // Wait for Firebase to initialize
    await new Promise(resolve => {
        const checkAuth = () => {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                resolve();
            } else {
                setTimeout(checkAuth, 100);
            }
        };
        checkAuth();
    });

    // Initialize authentication
    AuthService.init();
    
    // Set up user ready callback
    app.onUserReady = () => {
        console.log('[APP] User is ready, loading data...');
        loadData().then(() => {
            console.log('[APP] Data loaded, initializing GroupManager...');
            initGroupManager();
            renderTimeline();
        });
    };
    
    // Wait for auth state to be determined
    await new Promise(resolve => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in - AuthService will handle UI and call onUserReady
                console.log('[APP] User authenticated, waiting for role to load...');
            } else {
                // User is signed out - AuthService will handle UI
                console.log('[APP] User signed out');
            }
            unsubscribe();
            resolve();
        });
    });
    
    // Set up event listeners
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Set initial view mode
    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) {
        // Create the change handler function
        const changeHandler = (e) => {
            // Check if this is a programmatic update
            if (viewModeSelect.isProgrammaticUpdate) {
                console.log('[APP] Ignoring programmatic viewMode change to:', e.target.value);
                return;
            }
            
            // Check if we're in navigation mode
            if (app.isNavigating) {
                console.log('[APP] BLOCKED: ViewMode change during navigation - reverting to current mode');
                // Revert the select to the current mode
                viewModeSelect.value = app.data.settings.viewMode;
                return;
            }
            
            console.log('[APP] ViewMode select changed by user to:', e.target.value);
            console.log('[APP] Change handler stack trace:', new Error().stack);
            setViewMode(e.target.value);
        };
        
        viewModeSelect.value = app.data.settings.viewMode || 'week';
        viewModeSelect.addEventListener('change', changeHandler);
        
        // Store the handler and initialize the flag
        viewModeSelect.changeHandler = changeHandler;
        viewModeSelect.isProgrammaticUpdate = false;
    }
    
    // Set up button event listeners with click-and-hold functionality
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('mousedown', () => startNavigationHold(-1));
        prevBtn.addEventListener('mouseup', stopNavigationHold);
        prevBtn.addEventListener('mouseleave', stopNavigationHold);
        prevBtn.addEventListener('click', (e) => {
            // Prevent click if we were holding
            if (navigationHoldInterval) {
                e.preventDefault();
                return;
            }
            navigateTimeline(-1);
        });
    }
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('mousedown', () => startNavigationHold(1));
        nextBtn.addEventListener('mouseup', stopNavigationHold);
        nextBtn.addEventListener('mouseleave', stopNavigationHold);
        nextBtn.addEventListener('click', (e) => {
            // Prevent click if we were holding
            if (navigationHoldInterval) {
                e.preventDefault();
                return;
            }
            navigateTimeline(1);
        });
    }
    
    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
        todayBtn.addEventListener('click', jumpToToday);
    }
    

    
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', showGlobalAddProject);
    }
    
    const addDayOffBtn = document.getElementById('addDayOffBtn');
    if (addDayOffBtn) {
        addDayOffBtn.addEventListener('click', showAddDayOff);
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCSV);
    }
    
    const dataCleanupBtn = document.getElementById('dataCleanupBtn');
    if (dataCleanupBtn) {
        dataCleanupBtn.addEventListener('click', () => DataCleanup.show());
    }
    
    const groupProjectsBtn = document.getElementById('groupProjectsBtn');
    if (groupProjectsBtn) {
        groupProjectsBtn.addEventListener('click', () => {
            // Trigger group creation from Timeline component
            if (window.Timeline && window.Timeline.attemptCreateGroup) {
                window.Timeline.attemptCreateGroup();
            } else {
                // Fallback: try to access through the timeline instance
                const timelineArea = document.getElementById('timelineArea');
                if (timelineArea && timelineArea.timelineInstance) {
                    timelineArea.timelineInstance.attemptCreateGroup();
                }
            }
        });
    }
    

    
    // Add keyboard navigation with hold functionality
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Handle arrow key navigation with hold functionality
        if (e.key === 'ArrowLeft' && !e.repeat) {
            e.preventDefault();
            navigateTimeline(-1); // Immediate single step
            startNavigationHold(-1); // Start hold for continuous scrolling
        } else if (e.key === 'ArrowRight' && !e.repeat) {
            e.preventDefault();
            navigateTimeline(1); // Immediate single step
            startNavigationHold(1); // Start hold for continuous scrolling
        }
        
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'g') {
                e.preventDefault();
                // Trigger group creation from Timeline component
                if (window.Timeline && window.Timeline.attemptCreateGroup) {
                    window.Timeline.attemptCreateGroup();
                } else {
                    // Fallback: try to access through the timeline instance
                    const timelineArea = document.getElementById('timelineArea');
                    if (timelineArea && timelineArea.timelineInstance) {
                        timelineArea.timelineInstance.attemptCreateGroup();
                    }
                }
            }
        }
    });
    
    // Handle keyup to stop navigation hold
    document.addEventListener('keyup', function(e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            stopNavigationHold();
        }
    });
    
    // Mark initialization as complete after a short delay
    setTimeout(() => {
        isInitializing = false;
        window.isInitializing = false;
    }, 100);
}

// Initialize group manager
function initGroupManager() {
    console.log('[APP] initGroupManager() called with app.groups:', app.groups);
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    // Remove the existing add group button since GroupManager will handle it
    const existingAddBtn = sidebar.querySelector('.add-btn');
    if (existingAddBtn) {
        existingAddBtn.remove();
    }
    
    GroupManager.init(sidebar, {
        onGroupsChange: (groups, operation) => {
            console.log('[APP] GroupManager onGroupsChange called with:', groups, operation);
            app.groups = groups;
            saveGroups();
            renderTimeline();
        }
    });
    
    // Set initial groups from loaded data
    GroupManager.setGroups(app.groups);
    console.log('[APP] GroupManager initialized with groups:', app.groups);
}



// Data management
async function loadData() {
    console.log('[APP] loadData() called');
    try {
        console.log('[APP] Loading groups from cloud storage...');
        // Load groups
        const savedGroups = await CloudStorageService.load('sp_groups', []);
        console.log('[APP] Groups loaded:', savedGroups);
        if (savedGroups && savedGroups.length > 0) {
            app.groups = savedGroups;
            console.log('[APP] Using saved groups');
        } else {
            console.log('[APP] No saved groups, creating default group');
            // Add default group if none exists
            app.groups = [
                {
                    name: 'Development',
                    resources: [
                        { name: 'Developer 1' },
                        { name: 'Developer 2' }
                    ]
                }
            ];
            await saveGroups();
        }
        
        console.log('[APP] Loading project data from cloud storage...');
        // Load project data
        const savedData = await CloudStorageService.load('sp_resource_data', {
            projects: [],
            dayOffs: [],
            settings: {
                viewMode: 'week',
                timelineStart: DateUtils.todayStr()
            }
        });
        console.log('[APP] Project data loaded:', savedData);
        
        app.data = savedData;
        // Ensure dayOffs array exists for backward compatibility
        if (!app.data.dayOffs) {
            app.data.dayOffs = [];
        }
        
        console.log('[APP] Data loading completed successfully');
    } catch (error) {
        console.error('[APP] Error loading data from cloud storage:', error);
        // Fallback to localStorage if cloud storage fails
        console.log('[APP] Falling back to localStorage...');
        const savedGroups = localStorage.getItem('sp_groups');
        if (savedGroups) {
            app.groups = JSON.parse(savedGroups);
            console.log('[APP] Loaded groups from localStorage');
        } else {
            app.groups = [
                {
                    name: 'Development',
                    resources: [
                        { name: 'Developer 1' },
                        { name: 'Developer 2' }
                    ]
                }
            ];
            saveGroups();
            console.log('[APP] Created default groups');
        }
        
        const savedData = localStorage.getItem('sp_resource_data');
        if (savedData) {
            app.data = JSON.parse(savedData);
            if (!app.data.dayOffs) {
                app.data.dayOffs = [];
            }
            console.log('[APP] Loaded project data from localStorage');
        } else {
            app.data = {
                projects: [],
                dayOffs: [],
                settings: {
                    viewMode: 'week',
                    timelineStart: DateUtils.todayStr()
                }
            };
            saveData();
            console.log('[APP] Created default project data');
        }
    }
}

async function saveData() {
    console.log('[APP] saveData() called with data:', app.data);
    try {
        await CloudStorageService.save('sp_resource_data', app.data);
        console.log('[APP] Data saved to cloud storage successfully');
    } catch (error) {
        console.error('[APP] Error saving data to cloud storage:', error);
        // Fallback to localStorage
        localStorage.setItem('sp_resource_data', JSON.stringify(app.data));
        console.log('[APP] Data saved to localStorage as fallback');
    }
}

async function saveGroups() {
    console.log('[APP] saveGroups() called with groups:', app.groups);
    try {
        await CloudStorageService.save('sp_groups', app.groups);
        console.log('[APP] Groups saved to cloud storage successfully');
    } catch (error) {
        console.error('[APP] Error saving groups to cloud storage:', error);
        // Fallback to localStorage
        localStorage.setItem('sp_groups', JSON.stringify(app.groups));
        console.log('[APP] Groups saved to localStorage as fallback');
    }
}

// Timeline rendering
function renderTimeline(skipViewModeSync = false) {
    console.log('[APP] renderTimeline() called');
    console.log('[APP] Groups:', app.groups);
    console.log('[APP] Projects:', app.data.projects);
    
    // Check if we're in navigation mode
    if (app.isNavigating) {
        console.log('[APP] Skipping viewMode sync during navigation');
        skipViewModeSync = true;
    }
    
    // Ensure viewMode select is synchronized with app state (unless skipped during navigation)
    if (!skipViewModeSync) {
        const viewModeSelect = document.getElementById('viewMode');
        if (viewModeSelect && viewModeSelect.value !== app.data.settings.viewMode) {
            console.log('[APP] Syncing viewMode select from', viewModeSelect.value, 'to', app.data.settings.viewMode);
            
            // Set flag to prevent change event from firing
            viewModeSelect.isProgrammaticUpdate = true;
            
            // Update the value
            viewModeSelect.value = app.data.settings.viewMode || 'week';
            
            // Reset flag after a short delay to ensure the change event is ignored
            setTimeout(() => {
                viewModeSelect.isProgrammaticUpdate = false;
            }, 10);
        }
    }
    
    // Render groups in sidebar
    const groupsContainer = document.getElementById('groups');
    if (!groupsContainer) {
        console.error('[APP] Groups container not found!');
        return;
    }
    
    console.log('[APP] Rendering groups in sidebar...');
    groupsContainer.innerHTML = '';
    
    app.groups.forEach((group, groupIndex) => {
        const groupElement = document.createElement('li');
        groupElement.className = 'group';
        groupElement.innerHTML = `
            <div class="group-header">
                <input type="text" class="group-name-input" value="${group.name}" onchange="updateGroupName(${groupIndex}, this.value)" style="background: transparent; border: none; color: #6c3fc5; font-size: 1em; font-weight: 600; width: 70%; outline: none;">
                <span class="group-actions">
                    ${groupIndex > 0 ? `<button class="move-up-btn" onclick="moveGroupUp(${groupIndex})" title="Move group up">&uarr;</button>` : ''}
                    ${groupIndex < app.groups.length - 1 ? `<button class="move-down-btn" onclick="moveGroupDown(${groupIndex})" title="Move group down">&darr;</button>` : ''}
                    <button class="delete-btn" onclick="deleteGroup(${groupIndex})" title="Delete group">&times;</button>
                </span>
            </div>
            <ul class="resources">
                ${group.resources.map((resource, resourceIndex) => `
                    <li class="resource">
                        <input type="text" class="resource-name-input" value="${resource.name}" onchange="updateResourceName(${groupIndex}, ${resourceIndex}, this.value)" style="background: transparent; border: none; color: #6c3fc5; font-size: 0.9em; width: 70%; outline: none;">
                        <button class="delete-btn" onclick="deleteResource(${groupIndex}, ${resourceIndex})" title="Delete resource">&times;</button>
                    </li>
                `).join('')}
            </ul>
            <button class="add-resource-btn" onclick="addResource(${group})">+ Add Resource</button>
        `;
        groupsContainer.appendChild(groupElement);
    });
    
    const timelineArea = document.getElementById('timelineArea');
    if (!timelineArea) {
        console.error('[APP] Timeline area not found!');
        return;
    }
    
    console.log('[APP] Rendering timeline...');
    Timeline.render({
        viewMode: app.data.settings.viewMode,
        timelineStart: app.data.settings.timelineStart,
        groups: app.groups,
        projects: app.data.projects,
        dayOffs: app.data.dayOffs
    }, {
        onCellClick: addProjectAtCell,
        onProjectEdit: showProjectDetails,
        onProjectDuplicate: duplicateProject,
        onProjectCreate: createProject,
        onProjectDelete: deleteProject,
        onProjectUpdate: updateProject,
        onRenderRequest: () => renderTimeline(),
        getAllProjects: () => app.data.projects,
        getDayOffs: () => app.data.dayOffs,
        onDayOffRemove: (dayOffs) => {
            app.data.dayOffs = dayOffs;
            saveData();
            renderTimeline();
        }
    });
    
    // Update date range display
    updateDateRangeDisplay();
    console.log('[APP] Timeline rendering completed');
}

// Special render function for navigation hold that skips viewMode synchronization
function renderTimelineDuringNavigation() {
    console.log('[APP] renderTimelineDuringNavigation() called');
    console.log('[APP] Groups:', app.groups);
    console.log('[APP] Projects:', app.data.projects);
    
    // Skip viewMode synchronization during navigation hold
    
    // Render groups in sidebar
    const groupsContainer = document.getElementById('groups');
    if (!groupsContainer) {
        console.error('[APP] Groups container not found!');
        return;
    }
    
    console.log('[APP] Rendering groups in sidebar...');
    groupsContainer.innerHTML = '';
    
    app.groups.forEach((group, groupIndex) => {
        const groupElement = document.createElement('li');
        groupElement.className = 'group';
        groupElement.innerHTML = `
            <div class="group-header">
                <input type="text" class="group-name-input" value="${group.name}" onchange="updateGroupName(${groupIndex}, this.value)" style="background: transparent; border: none; color: #6c3fc5; font-size: 1em; font-weight: 600; width: 70%; outline: none;">
                <span class="group-actions">
                    ${groupIndex > 0 ? `<button class="move-up-btn" onclick="moveGroupUp(${groupIndex})" title="Move group up">&uarr;</button>` : ''}
                    ${groupIndex < app.groups.length - 1 ? `<button class="move-down-btn" onclick="moveGroupDown(${groupIndex})" title="Move group down">&darr;</button>` : ''}
                    <button class="delete-btn" onclick="deleteGroup(${groupIndex})" title="Delete group">&times;</button>
                </span>
            </div>
            <ul class="resources">
                ${group.resources.map((resource, resourceIndex) => `
                    <li class="resource">
                        <input type="text" class="resource-name-input" value="${resource.name}" onchange="updateResourceName(${groupIndex}, ${resourceIndex}, this.value)" style="background: transparent; border: none; color: #6c3fc5; font-size: 0.9em; width: 70%; outline: none;">
                        <button class="delete-btn" onclick="deleteResource(${groupIndex}, ${resourceIndex})" title="Delete resource">&times;</button>
                    </li>
                `).join('')}
            </ul>
            <button class="add-resource-btn" onclick="addResource(${group})">+ Add Resource</button>
        `;
        groupsContainer.appendChild(groupElement);
    });
    
    const timelineArea = document.getElementById('timelineArea');
    if (!timelineArea) {
        console.error('[APP] Timeline area not found!');
        return;
    }
    
    console.log('[APP] Rendering timeline...');
    Timeline.render({
        viewMode: app.data.settings.viewMode,
        timelineStart: app.data.settings.timelineStart,
        groups: app.groups,
        projects: app.data.projects,
        dayOffs: app.data.dayOffs
    }, {
        onCellClick: addProjectAtCell,
        onProjectEdit: showProjectDetails,
        onProjectDuplicate: duplicateProject,
        onProjectCreate: createProject,
        onProjectDelete: deleteProject,
        onProjectUpdate: updateProject,
        onRenderRequest: () => renderTimeline(),
        getAllProjects: () => app.data.projects,
        getDayOffs: () => app.data.dayOffs,
        onDayOffRemove: (dayOffs) => {
            app.data.dayOffs = dayOffs;
            saveData();
            renderTimeline();
        }
    });
    
    // Update date range display
    updateDateRangeDisplay();
    console.log('[APP] Timeline rendering completed (navigation mode)');
}

// Group management - Now handled by GroupManager component
// The following functions are kept for backward compatibility but delegate to GroupManager

function addGroup() {
    GroupManager.addGroup();
}

function deleteGroup(idx) {
    GroupManager.deleteGroup(idx);
}

function addResource(group) {
    const groupIndex = app.groups.findIndex(g => g.name === group.name);
    if (groupIndex !== -1) {
        GroupManager.addResource(groupIndex);
    }
}

function deleteResource(group, idx) {
    const groupIndex = app.groups.findIndex(g => g.name === group.name);
    if (groupIndex !== -1) {
        GroupManager.deleteResource(groupIndex, idx);
    }
}

/**
 * Move a group up in the list
 */
function moveGroupUp(groupIndex) {
    if (groupIndex <= 0) return; // Can't move first group up
    
    // Swap with previous group
    const temp = app.groups[groupIndex];
    app.groups[groupIndex] = app.groups[groupIndex - 1];
    app.groups[groupIndex - 1] = temp;
    
    // Save and re-render
    saveGroups();
    renderTimeline();
}

/**
 * Move a group down in the list
 */
function moveGroupDown(groupIndex) {
    if (groupIndex >= app.groups.length - 1) return; // Can't move last group down
    
    // Swap with next group
    const temp = app.groups[groupIndex];
    app.groups[groupIndex] = app.groups[groupIndex + 1];
    app.groups[groupIndex + 1] = temp;
    
    // Save and re-render
    saveGroups();
    renderTimeline();
}

/**
 * Update a group name
 */
function updateGroupName(groupIndex, newName) {
    if (newName.trim() === '') {
        alert('Group name cannot be empty.');
        return;
    }
    app.groups[groupIndex].name = newName;
    saveGroups();
    renderTimeline();
}

/**
 * Update a resource name
 */
function updateResourceName(groupIndex, resourceIndex, newName) {
    if (newName.trim() === '') {
        alert('Resource name cannot be empty.');
        return;
    }
    app.groups[groupIndex].resources[resourceIndex].name = newName;
    saveGroups();
    renderTimeline();
}

// Project actions
function addProjectAtCell(group, resource, date) {
    
    const newProj = {
        id: generateId(),
        name: 'New Project',
        resourceId: resource.name,
        groupId: group.name,
        start: date,
        end: date,
        color: '#b39ddb',
        notes: ''
    };
    
    app.data.projects.push(newProj);
    saveData();
    renderTimeline();
    setTimeout(() => showProjectDetails(newProj), 100);
}

function updateProject(project) {
    const index = app.data.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
        // Check if this project is in a group and if the color is being changed
        const projectGroup = ProjectGroupService.getGroupByProjectId(project.id);
        const originalProject = app.data.projects[index];
        
        // Compare the incoming color with the original color
        const isColorChange = project.color !== originalProject.color;
        
        if (projectGroup && isColorChange) {
            // Update all projects in the group with the new color
            const groupProjects = ProjectGroupService.getProjectsInGroup(projectGroup.id, app.data.projects);
            
            groupProjects.forEach(groupProject => {
                const groupProjectIndex = app.data.projects.findIndex(p => p.id === groupProject.id);
                if (groupProjectIndex !== -1) {
                    app.data.projects[groupProjectIndex] = { ...app.data.projects[groupProjectIndex], color: project.color };
                }
            });
            
            // Show notification
            if (window.Timeline && window.Timeline.showGroupingIndicator) {
                window.Timeline.showGroupingIndicator(`Updated color for ${groupProjects.length} projects in group`);
            }
        } else {
            // Update just this project
            app.data.projects[index] = project;
        }
        
        saveData();
        renderTimeline();
    }
}

function duplicateProject(pid) {
    const p = app.data.projects.find(p => p.id === pid);
    if (!p) return;
    
    const copy = { ...p, id: generateId(), name: p.name + ' (Copy)' };
    app.data.projects.push(copy);
    saveData();
    renderTimeline();
}

function createProject(project) {
    // Ensure the project has a unique ID
    if (!project.id || app.data.projects.find(p => p.id === project.id)) {
        project.id = generateId();
    }
    
    app.data.projects.push(project);
    saveData();
    renderTimeline();
}

function deleteProject(pid) {
    app.data.projects = app.data.projects.filter(p => p.id !== pid);
    saveData();
    renderTimeline();
}

// Project details
function showProjectDetails(project) {
    ProjectDetails.show(project, {
        onSave: (updatedProject) => {
            updateProject(updatedProject);
        },
        onDelete: (projectId) => {
            deleteProject(projectId);
        },
        onColorChange: (project) => {
            updateProject(project);
        },
        onGroupNameChange: (groupId, newName) => {
            // Re-render timeline to update project bar names
            renderTimeline();
        }
    });
}

// Utility functions
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Drag and drop handling
function handleDrag(e) {
    // This will be handled by the Timeline component
}

function endDrag() {
    // This will be handled by the Timeline component
}

// Navigation functions
function navigateTimeline(direction) {
    // Move by 1 day regardless of view mode for more precise navigation
    const days = direction;
    
    let start = new Date(app.data.settings.timelineStart || DateUtils.todayStr());
    start.setDate(start.getDate() + days);
    app.data.settings.timelineStart = start.toISOString().slice(0, 10);
    
    saveData();
    renderTimeline();
}

function startNavigationHold(direction) {
    // Clear any existing interval
    if (navigationHoldInterval) {
        clearInterval(navigationHoldInterval);
    }
    
    navigationHoldDirection = direction;
    
    // Set navigation flag
    app.isNavigating = true;
    
    // Add visual indicator to viewMode select
    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) {
        viewModeSelect.style.opacity = '0.6';
        viewModeSelect.title = 'View mode locked during navigation';
    }
    
    // Start continuous navigation after a short delay
    navigationHoldInterval = setInterval(() => {
        // Move by 1 day at a time, at a rate of 7 days per second
        const days = navigationHoldDirection;
        
        let start = new Date(app.data.settings.timelineStart || DateUtils.todayStr());
        start.setDate(start.getDate() + days);
        app.data.settings.timelineStart = start.toISOString().slice(0, 10);
        
        saveData();
        // During navigation hold, skip viewMode synchronization to prevent loops
        renderTimelineDuringNavigation();
    }, 1000 / 7); // 1/7th of a second (approximately 143ms)
}

function stopNavigationHold() {
    if (navigationHoldInterval) {
        clearInterval(navigationHoldInterval);
        navigationHoldInterval = null;
        navigationHoldDirection = 0;
    }
    
    // Clear navigation flag
    app.isNavigating = false;
    
    // Remove visual indicator from viewMode select
    const viewModeSelect = document.getElementById('viewMode');
    if (viewModeSelect) {
        viewModeSelect.style.opacity = '1';
        viewModeSelect.title = '';
    }
}

function jumpToToday() {
    app.data.settings.timelineStart = DateUtils.todayStr();
    saveData();
    renderTimeline();
}

function setViewMode(mode) {
    console.log('[APP] setViewMode called with mode:', mode, 'Current mode:', app.data.settings.viewMode);
    console.log('[APP] setViewMode stack trace:', new Error().stack);
    
    // Check if viewMode is locked during navigation
    if (app.isNavigating && app.data.settings.viewMode !== mode) {
        console.log('[APP] BLOCKED: ViewMode change during navigation from', app.data.settings.viewMode, 'to', mode);
        return; // Block the change during navigation
    }
    
    if (app.data.settings.viewMode !== mode) {
        console.log('[APP] ViewMode changing from', app.data.settings.viewMode, 'to', mode);
        app.data.settings.viewMode = mode;
        saveData();
        renderTimeline();
    } else {
        console.log('[APP] ViewMode unchanged, skipping update');
    }
}

// Export function
function exportCSV() {
    const rows = [['Group', 'Resource', 'Project', 'Start', 'End', 'Color', 'Notes']];
    
    app.data.projects.forEach(p => {
        const group = app.groups.find(g => g.name === p.groupId);
        rows.push([
            group ? group.name : '',
            p.resourceId,
            p.name,
            p.start,
            p.end,
            p.color || '',
            p.notes || ''
        ]);
    });
    
    const csv = rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'solidpoint_resource_export.csv';
    a.click();
}

// Global add project - Fixed to match monolithic version
function showGlobalAddProject() {
    ProjectDetails.close();
    
    const closeArea = document.createElement('div');
    closeArea.className = 'close-area';
    closeArea.onclick = ProjectDetails.close;
    closeArea.tabIndex = 0;
    document.body.appendChild(closeArea);

    const groupOptions = app.groups.map((g, i) => `<option value="${i}">${g.name}</option>`).join('');
    const resourceOptions = app.groups.length > 0 && app.groups[0].resources.length > 0
        ? app.groups[0].resources.map((r, i) => `<option value="${i}">${r.name}</option>`).join('')
        : '';
    const today = DateUtils.todayStr();

    const projectDetails = document.createElement('div');
    projectDetails.className = 'project-details';
    projectDetails.innerHTML = `
        <h3>Add Project</h3>
        <label>Group:</label>
        <select id="globalAddGroup">${groupOptions}</select>
        <label>Resource:</label>
        <select id="globalAddResource">${resourceOptions}</select>
        <label>Date:</label>
        <input type="date" id="globalAddDate" value="${today}">
        <div class="buttons">
            <button class="cancel" onclick="ProjectDetails.close()">Cancel</button>
            <button class="save" onclick="addProjectFromGlobal()">Add</button>
        </div>
    `;
    document.body.appendChild(projectDetails);

    document.getElementById('globalAddGroup').onchange = function() {
        const gi = parseInt(this.value);
        const resSel = document.getElementById('globalAddResource');
        resSel.innerHTML = app.groups[gi].resources.map((r, i) => `<option value="${i}">${r.name}</option>`).join('');
    };
}

function addProjectFromGlobal() {
    const gi = parseInt(document.getElementById('globalAddGroup').value);
    const ri = parseInt(document.getElementById('globalAddResource').value);
    const date = document.getElementById('globalAddDate').value;
    if (isNaN(gi) || isNaN(ri) || !date) return;
    
    const group = app.groups[gi];
    const resource = group.resources[ri];
    addProjectAtCell(group, resource, date);
    ProjectDetails.close();
}

// Add day off functionality
function showAddDayOff() {
    ProjectDetails.close();
    
    const closeArea = document.createElement('div');
    closeArea.className = 'close-area';
    closeArea.onclick = ProjectDetails.close;
    closeArea.tabIndex = 0;
    document.body.appendChild(closeArea);

    const today = DateUtils.todayStr();

    const dayOffModal = document.createElement('div');
    dayOffModal.className = 'project-details';
    dayOffModal.innerHTML = `
        <h3>Add Day Off</h3>
        <label>Date:</label>
        <input type="date" id="dayOffDate" value="${today}">
        <label>Type:</label>
        <select id="dayOffType">
            <option value="holiday">Holiday</option>
            <option value="weekend">Weekend</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Day</option>
            <option value="other">Other</option>
        </select>
        <label>Color:</label>
        <div class="color-picker-container">
            <input type="color" id="dayOffColor" value="#ff6b6b">
            <div id="dayOffColorSwatches" class="color-swatches"></div>
        </div>
        <label>Notes (optional):</label>
        <textarea id="dayOffNotes" placeholder="e.g., Christmas Day, Company Holiday"></textarea>
        <div class="buttons">
            <button class="cancel" onclick="ProjectDetails.close()">Cancel</button>
            <button class="save" onclick="addDayOffFromModal()">Add Day Off</button>
        </div>
    `;
    document.body.appendChild(dayOffModal);
    
    // Add color swatches
    createDayOffColorSwatches('#ff6b6b');
    
    // Add color input event listener
    const colorInput = document.getElementById('dayOffColor');
    colorInput.addEventListener('input', (e) => {
        updateDayOffColorSwatches(e.target.value);
    });
}

function addDayOffFromModal() {
    const date = document.getElementById('dayOffDate').value;
    const type = document.getElementById('dayOffType').value;
    const notes = document.getElementById('dayOffNotes').value;
    const color = document.getElementById('dayOffColor').value;
    
    if (!date) return;
    
    // Create a day off entry (not a project)
    const dayOff = {
        id: generateId(),
        date: date,
        type: type,
        notes: notes,
        color: color
    };
    
    app.data.dayOffs.push(dayOff);
    saveData();
    renderTimeline();
    ProjectDetails.close();
}

function getDayOffColor(type) {
    const colors = {
        holiday: '#ff6b6b',     // Red
        weekend: '#4ecdc4',     // Teal
        sick: '#ffa726',        // Orange
        personal: '#ab47bc',    // Purple
        other: '#95a5a6'        // Gray
    };
    return colors[type] || colors.other;
}

function createDayOffColorSwatches(selectedColor) {
    const swatchesContainer = document.getElementById('dayOffColorSwatches');
    if (!swatchesContainer) return;
    
    const colors = [
        '#ff6b6b', '#4ecdc4', '#ffa726', '#ab47bc',
        '#95a5a6', '#6c3fc5', '#81c784', '#64b5f6'
    ];
    
    swatchesContainer.innerHTML = '';
    
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = `color-swatch${color === selectedColor ? ' selected' : ''}`;
        swatch.style.background = color;
        
        swatch.addEventListener('click', () => {
            const colorInput = document.getElementById('dayOffColor');
            colorInput.value = color;
            colorInput.dispatchEvent(new Event('input'));
        });
        
        swatchesContainer.appendChild(swatch);
    });
}

function updateDayOffColorSwatches(color) {
    document.querySelectorAll('#dayOffColorSwatches .color-swatch').forEach(swatch => {
        swatch.classList.toggle('selected', swatch.style.backgroundColor === color);
    });
}

// Date range display functions
function updateDateRangeDisplay() {
    const dateRangeText = document.getElementById('dateRangeText');
    if (!dateRangeText) return;
    
    const startDate = new Date(app.data.settings.timelineStart || DateUtils.todayStr());
    const viewMode = app.data.settings.viewMode || 'week';
    
    let endDate = new Date(startDate);
    switch (viewMode) {
        case 'week':
            endDate.setDate(startDate.getDate() + 6);
            break;
        case '2week':
            endDate.setDate(startDate.getDate() + 13);
            break;
        case 'month':
            endDate.setDate(startDate.getDate() + 29);
            break;
    }
    
    const startStr = startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    dateRangeText.textContent = `${startStr} - ${endStr}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Test to see if app.js loads
    console.log('[APP] App.js file loaded successfully!'); 