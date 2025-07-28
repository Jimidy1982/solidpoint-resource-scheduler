/**
 * GroupManager component for managing groups and resources
 */

const GroupManager = {
    /**
     * Initialize group manager
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Manager options
     */
    init(container, options = {}) {
        this.container = container;
        this.options = options;
        this.groups = [];
        this.isSettingGroups = false; // Flag to prevent state saving during programmatic updates

        this.render();
    },

    /**
     * Set groups data
     * @param {Array} groups - Groups data
     */
    setGroups(groups) {
        this.isSettingGroups = true; // Prevent state saving
        this.groups = groups;
        this.render();
        this.isSettingGroups = false; // Re-enable state saving
        // Call onGroupsChange with null operation to indicate programmatic update
        this.options.onGroupsChange?.(this.groups, null);
    },

    /**
     * Get groups data
     * @returns {Array} Groups data
     */
    getGroups() {
        return this.groups;
    },

    /**
     * Add a new group
     */
    addGroup() {
        this.groups.push({
            name: 'New Group',
            resources: []
        });
        this.options.onGroupsChange?.(this.groups, 'add-group');
        this.render();
    },

    /**
     * Delete a group
     * @param {number} index - Group index
     */
    deleteGroup(index) {
        if (confirm('Delete this group and all its resources?')) {
            this.groups.splice(index, 1);
            this.options.onGroupsChange?.(this.groups, 'delete-group');
            this.render();
        }
    },

    /**
     * Move a group up
     * @param {number} index - Group index
     */
    moveGroupUp(index) {
        console.log('Moving group up from index:', index);
        if (index > 0) {
            // Add animation class to the group being moved
            const groupElements = this.container.querySelectorAll('.group');
            const currentGroup = groupElements[index];
            const targetGroup = groupElements[index - 1];
            
            if (currentGroup && targetGroup) {
                currentGroup.classList.add('moving-up');
                targetGroup.classList.add('moving-down');
                
                // Perform the move after the animation completes
                setTimeout(() => {
                    const group = this.groups.splice(index, 1)[0];
                    this.groups.splice(index - 1, 0, group);
                    this.options.onGroupsChange?.(this.groups, 'reorder-group');
                    this.render();
                    console.log('Group moved up successfully');
                }, 600);
            } else {
                // Fallback if animation elements not found
                const group = this.groups.splice(index, 1)[0];
                this.groups.splice(index - 1, 0, group);
                this.options.onGroupsChange?.(this.groups, 'reorder-group');
                this.render();
                console.log('Group moved up successfully');
            }
        } else {
            console.log('Cannot move up - already at top');
        }
    },

    /**
     * Move a group down
     * @param {number} index - Group index
     */
    moveGroupDown(index) {
        console.log('Moving group down from index:', index);
        if (index < this.groups.length - 1) {
            // Add animation class to the group being moved
            const groupElements = this.container.querySelectorAll('.group');
            const currentGroup = groupElements[index];
            const targetGroup = groupElements[index + 1];
            
            if (currentGroup && targetGroup) {
                currentGroup.classList.add('moving-down');
                targetGroup.classList.add('moving-up');
                
                // Perform the move after the animation completes
                setTimeout(() => {
                    const group = this.groups.splice(index, 1)[0];
                    this.groups.splice(index + 1, 0, group);
                    this.options.onGroupsChange?.(this.groups, 'reorder-group');
                    this.render();
                    console.log('Group moved down successfully');
                }, 600);
            } else {
                // Fallback if animation elements not found
                const group = this.groups.splice(index, 1)[0];
                this.groups.splice(index + 1, 0, group);
                this.options.onGroupsChange?.(this.groups, 'reorder-group');
                this.render();
                console.log('Group moved down successfully');
            }
        } else {
            console.log('Cannot move down - already at bottom');
        }
    },

    /**
     * Add a resource to a group
     * @param {number} groupIndex - Group index
     */
    addResource(groupIndex) {
        this.groups[groupIndex].resources.push({
            name: 'New Resource'
        });
        this.options.onGroupsChange?.(this.groups, 'add-resource');
        this.render();
    },

    /**
     * Delete a resource from a group
     * @param {number} groupIndex - Group index
     * @param {number} resourceIndex - Resource index
     */
    deleteResource(groupIndex, resourceIndex) {
        if (confirm('Delete this resource?')) {
            this.groups[groupIndex].resources.splice(resourceIndex, 1);
            this.options.onGroupsChange?.(this.groups, 'delete-resource');
            this.render();
        }
    },

    /**
     * Update group name
     * @param {number} index - Group index
     * @param {string} name - New group name
     */
    updateGroupName(index, name) {
        this.groups[index].name = name;
        this.options.onGroupsChange?.(this.groups, 'edit-group');
    },

    /**
     * Update resource name
     * @param {number} groupIndex - Group index
     * @param {number} resourceIndex - Resource index
     * @param {string} name - New resource name
     */
    updateResourceName(groupIndex, resourceIndex, name) {
        this.groups[groupIndex].resources[resourceIndex].name = name;
        this.options.onGroupsChange?.(this.groups, 'edit-resource');
    },

    /**
     * Render group manager
     */
    render() {
        DomUtils.clearElement(this.container);

        // Add group button
        const addBtn = DomUtils.createElement('button', {
            className: 'add-btn',
            title: 'Add a new group',
            'aria-label': 'Add Group'
        }, '+ Add Group');
        addBtn.addEventListener('click', () => this.addGroup());
        this.container.appendChild(addBtn);

        // Groups list
        const groupsList = DomUtils.createElement('ul', {
            id: 'groups'
        });

        this.groups.forEach((group, gi) => {
            const groupLi = this.createGroupElement(group, gi);
            groupsList.appendChild(groupLi);
        });

        this.container.appendChild(groupsList);
    },

    /**
     * Create group element
     * @param {Object} group - Group data
     * @param {number} groupIndex - Group index
     * @returns {HTMLElement} Group list item
     */
    createGroupElement(group, groupIndex) {
        const groupLi = DomUtils.createElement('li', {
            className: 'group'
        });

        // Group name input
        const groupName = DomUtils.createElement('input', {
            value: group.name
        });
        groupName.addEventListener('change', e => {
            this.updateGroupName(groupIndex, e.target.value);
        });
        groupLi.appendChild(groupName);

        // Delete group button
        const delGroupBtn = DomUtils.createElement('button', {
            className: 'delete-group',
            title: 'Delete Group'
        }, '×');
        delGroupBtn.addEventListener('click', () => {
            this.deleteGroup(groupIndex);
        });
        groupLi.appendChild(delGroupBtn);

        // Move up button (only show if not the first group)
        if (groupIndex > 0) {
            const upBtn = DomUtils.createElement('button', {
                className: 'reorder-btn up-btn',
                title: 'Move group up'
            }, '▲');
            upBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Up button clicked for group index:', groupIndex);
                this.moveGroupUp(groupIndex);
            });
            groupLi.appendChild(upBtn);
        }

        // Move down button (only show if not the last group)
        if (groupIndex < this.groups.length - 1) {
            const downBtn = DomUtils.createElement('button', {
                className: 'reorder-btn down-btn',
                title: 'Move group down'
            }, '▼');
            downBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Down button clicked for group index:', groupIndex);
                this.moveGroupDown(groupIndex);
            });
            groupLi.appendChild(downBtn);
        }

        // Resources list
        const resUl = DomUtils.createElement('ul', {
            className: 'resources'
        });

        group.resources.forEach((resource, ri) => {
            const resLi = this.createResourceElement(group, groupIndex, resource, ri);
            resUl.appendChild(resLi);
        });

        groupLi.appendChild(resUl);

        // Add resource button
        const addResBtn = DomUtils.createElement('button', {
            className: 'add-resource-btn'
        }, '+ Add Resource');
        addResBtn.addEventListener('click', () => {
            this.addResource(groupIndex);
        });
        groupLi.appendChild(addResBtn);

        return groupLi;
    },

    /**
     * Create resource element
     * @param {Object} group - Group data
     * @param {number} groupIndex - Group index
     * @param {Object} resource - Resource data
     * @param {number} resourceIndex - Resource index
     * @returns {HTMLElement} Resource list item
     */
    createResourceElement(group, groupIndex, resource, resourceIndex) {
        const resLi = DomUtils.createElement('li', {
            className: 'resource'
        });

        // Resource name input
        const resName = DomUtils.createElement('input', {
            value: resource.name
        });
        resName.addEventListener('change', e => {
            this.updateResourceName(groupIndex, resourceIndex, e.target.value);
        });
        resLi.appendChild(resName);

        // Delete resource button
        const delResBtn = DomUtils.createElement('button', {
            className: 'delete-resource',
            title: 'Delete Resource'
        }, '×');
        delResBtn.addEventListener('click', () => {
            this.deleteResource(groupIndex, resourceIndex);
        });
        resLi.appendChild(delResBtn);

        return resLi;
    }
}; 