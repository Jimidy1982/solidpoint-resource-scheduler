/**
 * Project Group Service for managing project groupings and dependencies
 */

const ProjectGroupService = {
    /**
     * Generate a unique group ID
     * @returns {string} Unique group ID
     */
    generateGroupId() {
        return 'group_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Create a new project group
     * @param {Array} projectIds - Array of project IDs to group
     * @param {string} groupName - Name for the group (optional)
     * @returns {Object} Created group object
     */
    createGroup(projectIds, groupName = null) {
        const group = {
            id: this.generateGroupId(),
            name: groupName || 'New Group',
            projectIds: [...projectIds],
            createdAt: new Date().toISOString()
        };

        const groups = this.getGroups();
        groups.push(group);
        this.saveGroups(groups);

        return group;
    },

    /**
     * Get all project groups
     * @returns {Array} Array of group objects
     */
    getGroups() {
        return StorageService.load('sp_project_groups', []);
    },

    /**
     * Get all project groups (with cleanup of empty groups)
     * @returns {Array} Array of group objects (only groups with 2+ projects)
     */
    getAllGroups() {
        // Clean up empty groups first
        this.cleanupEmptyGroups();
        return this.getGroups();
    },

    /**
     * Save project groups
     * @param {Array} groups - Array of group objects
     */
    saveGroups(groups) {
        StorageService.save('sp_project_groups', groups);
    },

    /**
     * Get group by ID
     * @param {string} groupId - Group ID
     * @returns {Object|null} Group object or null if not found
     */
    getGroupById(groupId) {
        const groups = this.getGroups();
        return groups.find(g => g.id === groupId) || null;
    },

    /**
     * Get group that contains a specific project
     * @param {string} projectId - Project ID
     * @returns {Object|null} Group object or null if project is not in any group
     */
    getGroupByProjectId(projectId) {
        const groups = this.getGroups();
        return groups.find(g => g.projectIds.includes(projectId)) || null;
    },

    /**
     * Update group name
     * @param {string} groupId - Group ID
     * @param {string} newName - New group name
     * @returns {boolean} True if group was updated successfully
     */
    updateGroupName(groupId, newName) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        
        if (groupIndex === -1) return false;
        
        groups[groupIndex].name = newName;
        this.saveGroups(groups);
        return true;
    },

    /**
     * Add project to existing group
     * @param {string} groupId - Group ID
     * @param {string} projectId - Project ID to add
     * @returns {boolean} True if project was added successfully
     */
    addProjectToGroup(groupId, projectId) {
        const groups = this.getGroups();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        
        if (groupIndex === -1) return false;
        
        // Don't add if already in group
        if (groups[groupIndex].projectIds.includes(projectId)) return false;
        
        groups[groupIndex].projectIds.push(projectId);
        this.saveGroups(groups);
        return true;
    },

    /**
     * Remove project from group
     * @param {string} projectId - Project ID to remove
     * @returns {boolean} True if project was removed successfully
     */
    removeProjectFromGroup(projectId) {
        const groups = this.getGroups();
        let modified = false;
        
        groups.forEach(group => {
            const index = group.projectIds.indexOf(projectId);
            if (index !== -1) {
                group.projectIds.splice(index, 1);
                modified = true;
            }
        });
        
        // Remove empty groups (groups with 0 or 1 project)
        const nonEmptyGroups = groups.filter(g => g.projectIds.length > 1);
        
        if (modified) {
            this.saveGroups(nonEmptyGroups);
        }
        
        return modified;
    },

    /**
     * Clean up empty groups (groups with 0 or 1 project)
     * @returns {number} Number of groups removed
     */
    cleanupEmptyGroups() {
        const groups = this.getGroups();
        const nonEmptyGroups = groups.filter(g => g.projectIds.length > 1);
        const removedCount = groups.length - nonEmptyGroups.length;
        
        if (removedCount > 0) {
            this.saveGroups(nonEmptyGroups);
        }
        
        return removedCount;
    },

    /**
     * Delete a group
     * @param {string} groupId - Group ID to delete
     * @returns {boolean} True if group was deleted
     */
    deleteGroup(groupId) {
        const groups = this.getGroups();
        const filtered = groups.filter(g => g.id !== groupId);
        
        if (filtered.length === groups.length) return false;
        
        this.saveGroups(filtered);
        return true;
    },

    /**
     * Get all projects in a group
     * @param {string} groupId - Group ID
     * @param {Array} allProjects - Array of all projects
     * @returns {Array} Array of project objects in the group
     */
    getProjectsInGroup(groupId, allProjects) {
        const group = this.getGroupById(groupId);
        if (!group) return [];
        
        return allProjects.filter(p => group.projectIds.includes(p.id));
    },

    /**
     * Check if projects can be grouped (any projects can be grouped)
     * @param {Array} projectIds - Array of project IDs to check
     * @param {Array} allProjects - Array of all projects
     * @returns {boolean} True if projects can be grouped
     */
    canGroupProjects(projectIds, allProjects) {
        const projects = allProjects.filter(p => projectIds.includes(p.id));
        console.log('canGroupProjects called with:', { projectIds, projects });
        // Allow grouping any 2 or more projects, regardless of resource
        const canGroup = projects.length >= 2;
        console.log('canGroupProjects result:', canGroup);
        return canGroup;
    },

    /**
     * Check if a group can move to a different resource
     * @param {string} groupId - Group ID
     * @param {Array} allProjects - Array of all projects
     * @returns {boolean} True if group can change resources
     */
    canGroupChangeResource(groupId, allProjects) {
        const projects = this.getProjectsInGroup(groupId, allProjects);
        if (projects.length === 0) return false;
        
        // Can only change resource if all projects are on the same resource
        // Mixed-resource groups cannot be moved to a different resource
        const firstResource = projects[0].resourceId;
        return projects.every(p => p.resourceId === firstResource);
    },

    /**
     * Move all projects in a group by the same offset
     * @param {string} groupId - Group ID
     * @param {number} daysOffset - Number of days to move (positive or negative)
     * @param {Array} allProjects - Array of all projects
     * @returns {Array} Updated projects array
     */
    moveGroup(groupId, daysOffset, allProjects) {
        const group = this.getGroupById(groupId);
        if (!group) return allProjects;
        
        const updatedProjects = [...allProjects];
        
        group.projectIds.forEach(projectId => {
            const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
                const project = updatedProjects[projectIndex];
                const newStart = DateUtils.addDays(project.start, daysOffset);
                const newEnd = DateUtils.addDays(project.end, daysOffset);
                
                updatedProjects[projectIndex] = {
                    ...project,
                    start: newStart,
                    end: newEnd
                };
            }
        });
        
        return updatedProjects;
    },

    /**
     * Move a group to a different resource
     * @param {string} groupId - Group ID
     * @param {string} newResourceId - New resource ID
     * @param {Array} allProjects - Array of all projects
     * @returns {Array} Updated projects array
     */
    moveGroupToResource(groupId, newResourceId, allProjects) {
        const group = this.getGroupById(groupId);
        if (!group || !this.canGroupChangeResource(groupId, allProjects)) {
            return allProjects;
        }
        
        const updatedProjects = [...allProjects];
        
        group.projectIds.forEach(projectId => {
            const projectIndex = updatedProjects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
                updatedProjects[projectIndex] = {
                    ...updatedProjects[projectIndex],
                    resourceId: newResourceId
                };
            }
        });
        
        return updatedProjects;
    },

    /**
     * Get all project IDs that are currently grouped
     * @returns {Array} Array of project IDs that are in groups
     */
    getAllGroupedProjectIds() {
        const groups = this.getGroups();
        const groupedIds = [];
        
        groups.forEach(group => {
            groupedIds.push(...group.projectIds);
        });
        
        return groupedIds;
    },

    /**
     * Clear all groups (useful for data cleanup)
     */
    clearAllGroups() {
        this.saveGroups([]);
    }
};

// Make ProjectGroupService available globally
window.ProjectGroupService = ProjectGroupService; 