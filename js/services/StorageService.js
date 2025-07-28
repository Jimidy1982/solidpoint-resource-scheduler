/**
 * Storage service for handling data persistence
 */

const StorageService = {
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Loaded data or default value
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },

    /**
     * Clear all data from localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get storage statistics
     * @returns {Object} Storage statistics
     */
    getStats() {
        const groups = this.load('sp_groups', []);
        const data = this.load('sp_resource_data', { projects: [], settings: {} });
        const projectGroups = this.load('sp_project_groups', []);
        
        let totalResources = 0;
        groups.forEach(group => {
            totalResources += group.resources ? group.resources.length : 0;
        });
        
        const size = new Blob([
            JSON.stringify(groups), 
            JSON.stringify(data),
            JSON.stringify(projectGroups)
        ]).size;
        
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        
        const oldProjects = data.projects ? data.projects.filter(project => {
            const endDate = new Date(project.end);
            return endDate < cutoffDate;
        }) : [];
        
        return {
            groups: groups.length,
            resources: totalResources,
            projects: data.projects ? data.projects.length : 0,
            projectGroups: projectGroups.length,
            oldProjects: oldProjects.length,
            storageSize: size,
            storageSizeKB: (size / 1024).toFixed(2)
        };
    },

    /**
     * Export all data
     * @returns {Object} Export data object
     */
    exportAll() {
        const groups = this.load('sp_groups', []);
        const data = this.load('sp_resource_data', { projects: [], settings: {} });
        const projectGroups = this.load('sp_project_groups', []);
        
        return {
            groups: groups,
            data: data,
            projectGroups: projectGroups,
            exportDate: new Date().toISOString()
        };
    },

    /**
     * Clear old projects (older than 6 months)
     * @returns {number} Number of projects cleared
     */
    clearOldProjects() {
        const data = this.load('sp_resource_data', { projects: [], settings: {} });
        const projects = data.projects || [];
        
        if (projects.length === 0) {
            return 0;
        }
        
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        
        const oldProjects = projects.filter(project => {
            const endDate = new Date(project.end);
            return endDate < cutoffDate;
        });
        
        if (oldProjects.length === 0) {
            return 0;
        }
        
        data.projects = projects.filter(project => {
            const endDate = new Date(project.end);
            return endDate >= cutoffDate;
        });
        
        this.save('sp_resource_data', data);
        return oldProjects.length;
    },

    /**
     * Clear all application data
     */
    clearAppData() {
        this.remove('sp_groups');
        this.remove('sp_resource_data');
        this.remove('sp_project_groups');
    }
}; 