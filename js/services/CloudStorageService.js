/**
 * Cloud storage service using Firebase Firestore
 */

const CloudStorageService = {
    /**
     * Save data to cloud storage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     */
    async save(key, data) {
        console.log('[CLOUD] CloudStorageService.save() called with key:', key, 'data:', data);
        
        if (!auth.currentUser) {
            console.error('[CLOUD] No authenticated user');
            return false;
        }

        try {
            const userId = auth.currentUser.uid;
            console.log('[CLOUD] Saving for user:', userId);
            
            await db.collection('users').doc(userId).collection('data').doc(key).set({
                data: data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('[CLOUD] Data saved successfully to cloud storage');
            return true;
        } catch (error) {
            console.error('[CLOUD] Error saving to cloud storage:', error);
            return false;
        }
    },

    /**
     * Load data from cloud storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Loaded data or default value
     */
    async load(key, defaultValue = null) {
        console.log('[CLOUD] CloudStorageService.load() called with key:', key, 'defaultValue:', defaultValue);
        
        if (!auth.currentUser) {
            console.error('[CLOUD] No authenticated user');
            return defaultValue;
        }

        try {
            const userId = auth.currentUser.uid;
            console.log('[CLOUD] Loading for user:', userId);
            
            const doc = await db.collection('users').doc(userId).collection('data').doc(key).get();
            
            if (doc.exists) {
                const data = doc.data().data;
                console.log('[CLOUD] Data loaded successfully from cloud storage:', data);
                return data;
            } else {
                console.log('[CLOUD] No data found in cloud storage, using default value');
                return defaultValue;
            }
        } catch (error) {
            console.error('[CLOUD] Error loading from cloud storage:', error);
            return defaultValue;
        }
    },

    /**
     * Remove data from cloud storage
     * @param {string} key - Storage key
     */
    async remove(key) {
        if (!auth.currentUser) {
            console.error('No authenticated user');
            return false;
        }

        try {
            const userId = auth.currentUser.uid;
            await db.collection('users').doc(userId).collection('data').doc(key).delete();
            return true;
        } catch (error) {
            console.error('Error removing from cloud storage:', error);
            return false;
        }
    },

    /**
     * Clear all data for current user
     */
    async clear() {
        if (!auth.currentUser) {
            console.error('No authenticated user');
            return false;
        }

        try {
            const userId = auth.currentUser.uid;
            const snapshot = await db.collection('users').doc(userId).collection('data').get();
            
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error clearing cloud storage:', error);
            return false;
        }
    },

    /**
     * Get storage statistics
     */
    async getStats() {
        if (!auth.currentUser) {
            return { error: 'No authenticated user' };
        }

        try {
            const userId = auth.currentUser.uid;
            const snapshot = await db.collection('users').doc(userId).collection('data').get();
            
            const groups = await this.load('sp_groups', []);
            const data = await this.load('sp_resource_data', { projects: [], settings: {} });
            const projectGroups = await this.load('sp_project_groups', []);
            
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
                storageSizeKB: Math.round(size / 1024),
                oldProjects: oldProjects.length,
                totalDocuments: snapshot.size
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { error: error.message };
        }
    },

    /**
     * Export all data
     */
    async exportAll() {
        if (!auth.currentUser) {
            return null;
        }

        try {
            const groups = await this.load('sp_groups', []);
            const data = await this.load('sp_resource_data', { projects: [], settings: {} });
            const projectGroups = await this.load('sp_project_groups', []);
            
            return {
                groups,
                data,
                projectGroups,
                exportDate: new Date().toISOString(),
                user: auth.currentUser.email
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    },

    /**
     * Clear old projects
     */
    async clearOldProjects() {
        if (!auth.currentUser) {
            return 0;
        }

        try {
            const data = await this.load('sp_resource_data', { projects: [] });
            if (!data.projects) return 0;

            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 6);
            
            const oldProjects = data.projects.filter(project => {
                const endDate = new Date(project.end);
                return endDate < cutoffDate;
            });
            
            if (oldProjects.length > 0) {
                data.projects = data.projects.filter(project => {
                    const endDate = new Date(project.end);
                    return endDate >= cutoffDate;
                });
                
                await this.save('sp_resource_data', data);
            }
            
            return oldProjects.length;
        } catch (error) {
            console.error('Error clearing old projects:', error);
            return 0;
        }
    },

    /**
     * Clear all app data
     */
    async clearAppData() {
        return await this.clear();
    },

    /**
     * Listen for real-time updates
     * @param {string} key - Storage key
     * @param {Function} callback - Callback function when data changes
     */
    listenToChanges(key, callback) {
        if (!auth.currentUser) {
            console.error('No authenticated user');
            return null;
        }

        const userId = auth.currentUser.uid;
        return db.collection('users').doc(userId).collection('data').doc(key)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback(doc.data().data);
                } else {
                    callback(null);
                }
            });
    }
}; 