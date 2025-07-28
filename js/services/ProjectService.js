/**
 * Project service for managing project data
 */

const ProjectService = {
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Create a new project
     * @param {Object} data - Project data
     * @returns {Object} Created project
     */
    createProject(data) {
        const project = {
            id: this.generateId(),
            name: data.name || 'New Project',
            resourceId: data.resourceId,
            groupId: data.groupId,
            start: data.start,
            end: data.end,
            color: data.color || '#b39ddb',
            notes: data.notes || ''
        };

        const projects = this.getProjects();
        projects.push(project);
        this.saveProjects(projects);

        return project;
    },

    /**
     * Update a project
     * @param {string} id - Project ID
     * @param {Object} data - Updated project data
     * @returns {Object|null} Updated project or null if not found
     */
    updateProject(id, data) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index === -1) return null;

        const project = { ...projects[index], ...data };
        projects[index] = project;
        this.saveProjects(projects);

        return project;
    },

    /**
     * Delete a project
     * @param {string} id - Project ID
     * @returns {boolean} True if project was deleted
     */
    deleteProject(id) {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        
        if (filtered.length === projects.length) return false;

        this.saveProjects(filtered);
        return true;
    },

    /**
     * Duplicate a project
     * @param {string} id - Project ID
     * @returns {Object|null} Duplicated project or null if not found
     */
    duplicateProject(id) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === id);
        
        if (!project) return null;

        const duplicate = {
            ...project,
            id: this.generateId(),
            name: project.name + ' (Copy)'
        };

        projects.push(duplicate);
        this.saveProjects(projects);

        return duplicate;
    },

    /**
     * Get all projects
     * @returns {Array} Array of projects
     */
    getProjects() {
        return StorageService.load('sp_resource_data', { projects: [] }).projects;
    },

    /**
     * Save projects
     * @param {Array} projects - Array of projects
     */
    saveProjects(projects) {
        const data = StorageService.load('sp_resource_data', { projects: [] });
        data.projects = projects;
        StorageService.save('sp_resource_data', data);
    },

    /**
     * Get projects for a specific resource
     * @param {string} resourceId - Resource ID
     * @returns {Array} Array of projects for the resource
     */
    getProjectsForResource(resourceId) {
        return this.getProjects().filter(p => p.resourceId === resourceId);
    },

    /**
     * Check if two projects overlap
     * @param {Object} a - First project
     * @param {Object} b - Second project
     * @returns {boolean} True if projects overlap
     */
    doProjectsOverlap(a, b) {
        return !(new Date(a.end) < new Date(b.start) || new Date(a.start) > new Date(b.end));
    },

    /**
     * Export projects to CSV
     * @returns {string} CSV data
     */
    exportToCSV() {
        const projects = this.getProjects();
        const rows = [['Group', 'Resource', 'Project', 'Start', 'End', 'Color', 'Notes']];
        
        projects.forEach(p => {
            rows.push([
                p.groupId || '',
                p.resourceId || '',
                p.name,
                p.start,
                p.end,
                p.color || '',
                p.notes || ''
            ]);
        });

        return rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    }
}; 