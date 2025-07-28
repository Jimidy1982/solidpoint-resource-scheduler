/**
 * ProjectDetails component for displaying project details in a modal
 */

const ProjectDetails = {
    /**
     * Show project details modal
     * @param {Object} project - Project data
     * @param {Object} options - Modal options
     */
    show(project, options = {}) {
        this.close();

        // Create close area
        const closeArea = DomUtils.createElement('div', {
            className: 'close-area',
            tabIndex: 0
        });
        closeArea.addEventListener('click', () => this.close());
        document.body.appendChild(closeArea);

        // Create modal content
        const content = this.createContent(project, options);
        document.body.appendChild(content);

        // Add keyboard listener for ESC
        setTimeout(() => {
            document.addEventListener('keydown', this.escCloseListener);
        }, 10);
    },

    /**
     * Create modal content
     * @param {Object} project - Project data
     * @param {Object} options - Modal options
     * @returns {HTMLElement} Modal content
     */
    createContent(project, options) {
        const modal = DomUtils.createElement('div', {
            className: 'project-details'
        });

        // Title
        const title = DomUtils.createElement('h3', {}, 'Project Details');
        modal.appendChild(title);

        // Check if project is in a group (do this once at the beginning)
        const isGrouped = ProjectGroupService && ProjectGroupService.getGroupByProjectId(project.id);
        let projectGroup = null;
        
        if (isGrouped) {
            projectGroup = ProjectGroupService.getGroupByProjectId(project.id);
        }

        // Name input
        const nameLabel = DomUtils.createElement('label', {}, 'Name:');
        const nameInput = DomUtils.createElement('input', {
            type: 'text',
            id: 'projectName',
            value: project.name,
            style: { width: '100%' }
        });
        modal.appendChild(nameLabel);
        modal.appendChild(nameInput);

        // Group name input (only show if project is in a group)
        if (isGrouped && projectGroup) {
            const groupNameLabel = DomUtils.createElement('label', {}, 'Group Name:');
            const groupNameInput = DomUtils.createElement('input', {
                type: 'text',
                id: 'groupName',
                value: projectGroup.name,
                style: { width: '100%' }
            });
            modal.appendChild(groupNameLabel);
            modal.appendChild(groupNameInput);
        }

        // Start date input
        const startLabel = DomUtils.createElement('label', {}, 'Start Date:');
        const startInput = DomUtils.createElement('input', {
            type: 'date',
            id: 'projectStart',
            value: project.start
        });
        modal.appendChild(startLabel);
        modal.appendChild(startInput);

        // End date input
        const endLabel = DomUtils.createElement('label', {}, 'End Date:');
        const endInput = DomUtils.createElement('input', {
            type: 'date',
            id: 'projectEnd',
            value: project.end
        });
        modal.appendChild(endLabel);
        modal.appendChild(endInput);

        // Color selection
        
        let colorLabelText = 'Color:';
        let colorLabelTitle = '';
        let colorSectionClass = '';
        if (isGrouped) {
            colorLabelText = 'Group Color:';
            colorLabelTitle = 'Changing this color will update all projects in the group';
            colorSectionClass = 'group-color-section';
        }
        
        // Create color section container
        const colorSection = DomUtils.createElement('div', {
            className: colorSectionClass
        });
        
        const colorLabel = DomUtils.createElement('label', {
            title: colorLabelTitle
        }, colorLabelText);
        colorSection.appendChild(colorLabel);

        // Color picker container
        const colorPickerContainer = DomUtils.createElement('div', {
            className: 'color-picker-container'
        });
        
        // Color input
        const colorInput = DomUtils.createElement('input', {
            type: 'color',
            id: 'projectColor',
            value: project.color || '#b39ddb',
            title: colorLabelTitle
        });
        colorPickerContainer.appendChild(colorInput);

        // Color swatches
        const swatches = this.createColorSwatches(project.color, project);
        colorPickerContainer.appendChild(swatches);
        
        colorSection.appendChild(colorPickerContainer);
        
        modal.appendChild(colorSection);

        // Notes textarea
        const notesLabel = DomUtils.createElement('label', {}, 'Notes:');
        const notesTextarea = DomUtils.createElement('textarea', {
            id: 'projectNotes'
        }, project.notes || '');
        modal.appendChild(notesLabel);
        modal.appendChild(notesTextarea);

        // Buttons
        const buttons = DomUtils.createElement('div', {
            className: 'buttons'
        });

        const cancelBtn = DomUtils.createElement('button', {
            className: 'cancel'
        }, 'Cancel');
        cancelBtn.addEventListener('click', () => this.close());
        buttons.appendChild(cancelBtn);

        const deleteBtn = DomUtils.createElement('button', {
            className: 'delete'
        }, 'Delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this project?')) {
                options.onDelete?.(project.id);
                this.close();
            }
        });
        buttons.appendChild(deleteBtn);

        const saveBtn = DomUtils.createElement('button', {
            className: 'save'
        }, 'Save');
        saveBtn.addEventListener('click', () => {
            const updatedProject = {
                ...project,
                name: nameInput.value,
                start: startInput.value,
                end: endInput.value,
                color: colorInput.value,
                notes: notesTextarea.value
            };
            
            // Update group name if project is in a group
            if (isGrouped && projectGroup) {
                const groupNameInput = document.getElementById('groupName');
                if (groupNameInput && groupNameInput.value !== projectGroup.name) {
                    ProjectGroupService.updateGroupName(projectGroup.id, groupNameInput.value);
                    // Trigger re-render to update project bar names
                    options.onGroupNameChange?.(projectGroup.id, groupNameInput.value);
                }
            }
            
            options.onSave?.(updatedProject);
            this.close();
        });
        buttons.appendChild(saveBtn);

        modal.appendChild(buttons);

        // Live color update
        colorInput.addEventListener('input', e => {
            const newColor = e.target.value;
            const updatedProject = { ...project, color: newColor };
            options.onColorChange?.(updatedProject);
            this.updateColorSwatches(newColor);
        });

        return modal;
    },

    /**
     * Create color swatches
     * @param {string} selectedColor - Currently selected color
     * @param {Object} project - Project object for debugging
     * @returns {HTMLElement} Color swatches container
     */
    createColorSwatches(selectedColor, project = null) {
        const swatches = DomUtils.createElement('div', {
            className: 'color-swatches'
        });

        const colors = [
            '#b39ddb', '#6c3fc5', '#e57373', '#81c784',
            '#ffd54f', '#64b5f6', '#f06292', '#a1887f'
        ];

        colors.forEach(color => {
            const swatch = DomUtils.createElement('div', {
                className: `color-swatch${color === selectedColor ? ' selected' : ''}`,
                style: { background: color }
            });

            swatch.addEventListener('click', () => {
                const colorInput = document.getElementById('projectColor');
                colorInput.value = color;
                colorInput.dispatchEvent(new Event('input'));
            });

            swatches.appendChild(swatch);
        });

        return swatches;
    },

    /**
     * Update color swatches selection
     * @param {string} color - Selected color
     */
    updateColorSwatches(color) {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.style.backgroundColor === color);
        });
    },

    /**
     * Close the modal
     */
    close() {
        const modal = document.querySelector('.project-details');
        if (modal) {
            modal.remove();
        }

        const closeArea = document.querySelector('.close-area');
        if (closeArea) {
            closeArea.remove();
        }

        document.removeEventListener('keydown', this.escCloseListener);
    },

    /**
     * ESC key listener
     * @param {KeyboardEvent} e - Keyboard event
     */
    escCloseListener(e) {
        if (e.key === 'Escape') {
            ProjectDetails.close();
        }
    }
}; 