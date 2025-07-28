/**
 * Data cleanup component for managing localStorage data and performance
 */

const DataCleanup = {
    /**
     * Show the data cleanup dialog
     */
    async show() {
        this.close();
        
        const stats = await CloudStorageService.getStats();
        
        const closeArea = DomUtils.createElement('div', {
            className: 'close-area'
        });
        closeArea.onclick = () => this.close();
        document.body.appendChild(closeArea);

        const dialog = DomUtils.createElement('div', {
            className: 'data-cleanup-modal'
        });
        
        dialog.innerHTML = `
            <div class="data-cleanup-content">
            <h3>Data Cleanup & Performance</h3>
                
                <div class="stats-panel">
                    <div class="stat-item">
                        <span class="stat-label">Groups:</span>
                        <span class="stat-value">${stats.groups}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Resources:</span>
                        <span class="stat-value">${stats.resources}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Projects:</span>
                        <span class="stat-value">${stats.projects}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Project Groups:</span>
                        <span class="stat-value">${stats.projectGroups}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Storage Size:</span>
                        <span class="stat-value">${stats.storageSizeKB} KB</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Old Projects (>6 months):</span>
                        <span class="stat-value">${stats.oldProjects}</span>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button id="exportAllBtn" class="action-btn export-btn">
                        <span class="btn-icon">&#128229;</span>
                        <span class="btn-text">Export All Data</span>
                    </button>
                    <button id="clearOldBtn" class="action-btn warning-btn">
                        <span class="btn-icon">&#128465;</span>
                        <span class="btn-text">Clear Old Projects (${stats.oldProjects})</span>
                    </button>
                    <button id="clearGroupsBtn" class="action-btn purple-btn">
                        <span class="btn-icon">&#128230;</span>
                        <span class="btn-text">Clear Project Groups</span>
                    </button>
                    <button id="clearAllBtn" class="action-btn danger-btn">
                        <span class="btn-icon">&#9888;</span>
                        <span class="btn-text">Clear All Data</span>
                    </button>
            </div>
                
                <div class="modal-footer">
                    <button class="close-btn" onclick="DataCleanup.close()">Close</button>
            </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add event listeners
        document.getElementById('exportAllBtn').onclick = () => this.exportAll();
        document.getElementById('clearOldBtn').onclick = () => this.clearOldProjects();
        document.getElementById('clearGroupsBtn').onclick = () => this.clearProjectGroups();
        document.getElementById('clearAllBtn').onclick = () => this.clearAllData();
        
        this.dialog = dialog;
        this.closeArea = closeArea;
    },

    /**
     * Close the data cleanup dialog
     */
    close() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }
        if (this.closeArea) {
            this.closeArea.remove();
            this.closeArea = null;
        }
    },

    /**
     * Export all data
     */
    async exportAll() {
        const exportData = await CloudStorageService.exportAll();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solidpoint-backup-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Data exported successfully!');
    },

    /**
     * Clear old projects
     */
    async clearOldProjects() {
        const cleared = await CloudStorageService.clearOldProjects();
        if (cleared === 0) {
            alert('No old projects found!');
            return;
        }
        
        if (confirm(`Delete ${cleared} old projects (ending before 6 months ago)?`)) {
            await CloudStorageService.clearOldProjects();
            alert(`Cleared ${cleared} old projects!`);
            this.close();
            // Refresh the app
            if (typeof window !== 'undefined' && window.app) {
                window.app.data.projects = (await CloudStorageService.load('sp_resource_data', { projects: [] })).projects;
                window.renderTimeline();
            }
        }
    },

    /**
     * Clear project groups
     */
    clearProjectGroups() {
        const projectGroups = ProjectGroupService.getGroups();
        if (projectGroups.length === 0) {
            alert('No project groups found!');
            return;
        }
        
        if (confirm(`Delete all ${projectGroups.length} project groups? This will ungroup all projects.`)) {
            ProjectGroupService.clearAllGroups();
            alert(`Cleared ${projectGroups.length} project groups!`);
            this.close();
            // Refresh the app
            if (typeof window !== 'undefined' && window.app) {
                window.renderTimeline();
            }
        }
    },

    /**
     * Clear all data
     */
    async clearAllData() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            await CloudStorageService.clearAppData();
            alert('All data cleared!');
            this.close();
            // Refresh the app
            if (typeof window !== 'undefined' && window.app) {
                window.app.groups = [];
                window.app.data = { projects: [], settings: { viewMode: 'week', timelineStart: null } };
                window.GroupManager.setGroups([]);
                window.renderTimeline();
            }
        }
    }
}; 