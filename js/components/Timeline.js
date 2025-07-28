/**
 * Timeline component for rendering the timeline view
 */

const Timeline = {
    /**
     * Initialize the timeline
     * @param {HTMLElement} container - Container element
     * @param {Object} options - Timeline options
     */
    init(container, options = {}) {
        this.container = container;
        this.options = options;
        this.dragProject = null;
        this.dragStart = null;
        this.resizeHandle = null;
        this.dragBarEl = null;
        this.dates = [];
        this.startDate = null;
        this.endDate = null;
        this.groups = options.groups || [];
        this.dragOccurred = false; // Track if drag operation occurred
        
        // Project grouping state
        this.selectedProjects = new Set();
        this.currentGroup = null;
        this.isGroupingMode = false;

        // Set up event listeners
        document.addEventListener('mousemove', this.handleDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    },

    /**
     * Get month display name with year
     * @param {Date} date - Date object
     * @returns {string} Formatted month and year (e.g., "January 2024")
     */
    getMonthDisplayName(date) {
        const now = new Date();
        const isCurrentYear = date.getFullYear() === now.getFullYear();
        
        if (isCurrentYear) {
            return date.toLocaleDateString('en-GB', { month: 'long' });
        } else {
            return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        }
    },

    /**
     * Format date header (day and weekday only)
     * @param {Date} date - Date object
     * @returns {string} Formatted date string (e.g., "Mon 15")
     */
    formatDateHeader(date) {
        const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
        const dayNum = date.toLocaleDateString('en-GB', { day: '2-digit' });
        return `<div style="line-height: 1.2;"><div>${day}</div><div>${dayNum}</div></div>`;
    },

    /**
     * Calculate dates for the timeline
     * @param {string} viewMode - View mode (week, 2week, month)
     * @param {string} startDate - Start date
     * @returns {Object} Timeline dates info
     */
    calculateDates(viewMode, startDate) {
        const today = new Date();
        let start, end;
        
        if (!startDate) {
            start = new Date(today);
            start.setDate(start.getDate() - 7);
        } else {
            start = new Date(startDate);
        }
        
        end = new Date(start);
        
        switch (viewMode) {
            case 'week':
                end.setDate(start.getDate() + 6);
                break;
            case '2week':
                end.setDate(start.getDate() + 13);
                break;
            case 'month':
                end.setDate(start.getDate() + 29);
                break;
        }

        const dates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }

        return { start, end, dates };
    },

    /**
     * Render the timeline
     * @param {Object} data - Timeline data
     * @param {Object} options - Timeline options
     */
    render(data, options = {}) {
        // Initialize if not already done
        if (!this.container) {
            this.init(document.getElementById('timelineArea'), options);
            // Store instance on container for external access
            this.container.timelineInstance = this;
        }
        
        // Update options
        this.options = { ...this.options, ...options };
        
        const { viewMode, timelineStart, groups, projects } = data;
        const { start, end, dates } = this.calculateDates(viewMode, timelineStart);
        
        this.dates = dates;
        this.startDate = start;
        this.endDate = end;
        this.groups = groups;
        this.projects = projects;

        // Clear container
        this.container.innerHTML = '';

        // Create table
        const table = document.createElement('table');
        table.className = 'timeline-table';

        // Create header
        const thead = this.createHeader(dates);
        table.appendChild(thead);

        // Create body
        const tbody = this.createBody(groups, dates, projects, start, end);
        table.appendChild(tbody);

        this.container.appendChild(table);

        // Render project bars
        this.renderProjects(table, dates, start, end);
    },

    /**
     * Create timeline header
     * @param {Array} dates - Array of dates
     * @returns {HTMLElement} Header element
     */
    createHeader(dates) {
        const thead = document.createElement('thead');
        
        // Month header row
        const monthRow = document.createElement('tr');
        monthRow.className = 'month-header-row';
        
        // Empty cell for resource names
        const monthHeaderTh = document.createElement('th');
        monthHeaderTh.className = 'month-header-cell';
        monthRow.appendChild(monthHeaderTh);
        
        // Group dates by month and create month headers
        let currentMonth = null;
        let monthStartCol = 1; // Start after the resource name column
        
        dates.forEach((date, index) => {
            const month = date.getMonth();
            const year = date.getFullYear();
            const monthKey = `${year}-${month}`;
            
            if (monthKey !== currentMonth) {
                // If we have a previous month, add its header
                if (currentMonth !== null) {
                    const monthSpan = index - monthStartCol;
                    if (monthSpan > 0) {
                        const monthTh = document.createElement('th');
                        monthTh.className = 'month-header';
                        monthTh.colSpan = monthSpan;
                        monthTh.textContent = this.getMonthDisplayName(dates[monthStartCol]);
                        monthRow.appendChild(monthTh);
                    }
                }
                
                currentMonth = monthKey;
                monthStartCol = index;
            }
        });
        
        // Add the last month header
        if (currentMonth !== null) {
            const monthSpan = dates.length - monthStartCol;
            if (monthSpan > 0) {
                const monthTh = document.createElement('th');
                monthTh.className = 'month-header';
                monthTh.colSpan = monthSpan;
                monthTh.textContent = this.getMonthDisplayName(dates[monthStartCol]);
                monthRow.appendChild(monthTh);
            }
        }
        
        thead.appendChild(monthRow);
        
        // Date headers row
        const dateRow = document.createElement('tr');
        dateRow.className = 'date-header-row';

        // Empty cell for resource names
        const dateHeaderTh = document.createElement('th');
        dateHeaderTh.className = 'date-header-cell';
        dateRow.appendChild(dateHeaderTh);

        // Date headers (just day and weekday, no month)
        dates.forEach(date => {
            const th = document.createElement('th');
            th.innerHTML = this.formatDateHeader(date);
            if (date.toDateString() === new Date().toDateString()) {
                th.className = 'today-col';
            }
                                if (date.getDay() === 0 || date.getDay() === 6) {
                        th.classList.add('weekend-col');
                    }
                    
                    // Check for day offs
                    const dayOff = this.getDayOffForDate(date.toISOString().slice(0, 10));
                    if (dayOff) {
                        th.classList.add('day-off-col');
                        th.style.setProperty('--day-off-color', dayOff.color);
                    }
            dateRow.appendChild(th);
        });

        thead.appendChild(dateRow);
        return thead;
    },

    /**
     * Create timeline body
     * @param {Array} groups - Array of groups
     * @param {Array} dates - Array of dates
     * @param {Array} projects - Array of projects
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {HTMLElement} Body element
     */
    createBody(groups, dates, projects, start, end) {
        const tbody = document.createElement('tbody');
        let rowIndex = 0;

        groups.forEach((group, gi) => {
            // Group header row
            const groupHeaderTr = document.createElement('tr');
            groupHeaderTr.className = 'group-header-row';
            const th = document.createElement('th');
            th.colSpan = dates.length + 1;
            th.textContent = group.name;
            groupHeaderTr.appendChild(th);
            tbody.appendChild(groupHeaderTr);

            // Group divider row (except first group)
            if (gi > 0) {
                const dividerTr = document.createElement('tr');
                dividerTr.className = 'group-divider-row';
                for (let i = 0; i < dates.length + 1; i++) {
                    const td = document.createElement('td');
                    dividerTr.appendChild(td);
                }
                tbody.appendChild(dividerTr);
            }

            // Resource rows
            group.resources.forEach(resource => {
                // Calculate max stack for this resource (matching monolithic version)
                const projs = projects.filter(p =>
                    p.resourceId === resource.name &&
                    !(new Date(p.end) < start || new Date(p.start) > end)
                );
                projs.sort((a, b) => new Date(a.start) - new Date(b.start));
                const stacks = [];
                projs.forEach(proj => {
                    let placed = false;
                    for (let s = 0; s < stacks.length; s++) {
                        if (!this.doProjectsOverlap(proj, stacks[s][stacks[s].length - 1])) {
                            stacks[s].push(proj);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) stacks.push([proj]);
                });
                const maxStack = Math.max(1, stacks.length);

                const tr = document.createElement('tr');
                tr.style.height = (28 * maxStack) + "px";
                
                // Resource name cell
                const tdName = document.createElement('td');
                tdName.textContent = resource.name;
                tdName.style.fontWeight = '600';
                tdName.style.background = '#f8f6fc';
                tdName.style.position = 'relative';
                tr.appendChild(tdName);

                // Date cells
                dates.forEach(date => {
                    const td = document.createElement('td');
                    td.dataset.date = date.toISOString().slice(0, 10);
                    td.dataset.resource = resource.name;

                    if (date.toDateString() === new Date().toDateString()) {
                        td.classList.add('today-col');
                    }
                    if (date.getDay() === 0 || date.getDay() === 6) {
                        td.classList.add('weekend-col');
                    }
                    
                    // Check for day offs
                    const dayOff = this.getDayOffForDate(date.toISOString().slice(0, 10));
                    if (dayOff) {
                        td.classList.add('day-off-col');
                        td.style.setProperty('--day-off-color', dayOff.color);
                    }

                    td.onclick = e => {
                        if (e.target === td) {
                            this.options.onCellClick?.(group, resource, date.toISOString().slice(0, 10));
                        }
                    };
                    
                    td.oncontextmenu = e => {
                        e.preventDefault();
                        const dayOff = this.getDayOffForDate(date.toISOString().slice(0, 10));
                        if (dayOff) {
                            this.showDayOffContextMenu(e, dayOff);
                        }
                    };

                    tr.appendChild(td);
                });

                tbody.appendChild(tr);
                rowIndex++;
            });

            // Group padding row
            const padTr = document.createElement('tr');
            padTr.className = 'group-padding-row';
            for (let i = 0; i < dates.length + 1; i++) {
                const td = document.createElement('td');
                padTr.appendChild(td);
            }
            tbody.appendChild(padTr);
        });

        return tbody;
    },

    /**
     * Calculate project stacks to avoid overlaps
     * @param {Array} projects - Array of projects
     * @returns {Array} Array of project stacks
     */
    calculateProjectStacks(projects) {
        const sortedProjects = [...projects].sort((a, b) => new Date(a.start) - new Date(b.start));
        const stacks = [];
        
        sortedProjects.forEach(project => {
            let placed = false;
            for (let stack of stacks) {
                if (!this.doProjectsOverlap(project, stack[stack.length - 1])) {
                    stack.push(project);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                stacks.push([project]);
            }
        });
        return stacks;
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
     * Render project bars
     * @param {HTMLElement} table - Timeline table
     * @param {Array} dates - Array of dates
     * @param {Date} start - Start date
     * @param {Date} end - End date
     */
    renderProjects(table, dates, start, end) {
        // Remove old bars
        const oldBars = this.container.querySelectorAll('.project-bar');
        oldBars.forEach(b => b.remove());
        
        const trs = table.querySelectorAll('tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
        let rowY = 0;
        
        // Collect all projects to render
        const projectsToRender = [];
        
        this.groups.forEach(group => {
            group.resources.forEach(resource => {
                const projs = this.projects.filter(p =>
                    p.resourceId === resource.name &&
                    !(new Date(p.end) < start || new Date(p.start) > end)
                );
                projs.sort((a, b) => new Date(a.start) - new Date(b.start));
                
                const stacks = [];
                projs.forEach(proj => {
                    let placed = false;
                    for (let s = 0; s < stacks.length; s++) {
                        if (!this.doProjectsOverlap(proj, stacks[s][stacks[s].length - 1])) {
                            stacks[s].push(proj);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) stacks.push([proj]);
                });
                
                stacks.forEach((stack, si) => {
                    stack.forEach(proj => {
                        projectsToRender.push({
                            project: proj,
                            options: {
                                row: trs[rowY],
                                stackIndex: si
                            }
                        });
                    });
                });
                rowY++;
            });
        });
        
        // Render projects after ensuring table is fully positioned
        const renderProjects = () => {
            projectsToRender.forEach(({ project, options }) => {
                const bar = this.createProjectBar(project, options);
                this.container.appendChild(bar);
            });
        };
        
        // Ensure table is fully rendered before positioning projects
        let retryCount = 0;
        const maxRetries = 20;
        
        const ensureTableReady = () => {
            retryCount++;
            
            // Force layout recalculation
            table.offsetHeight;
            
            // Check if table cells have proper dimensions
            const firstCell = table.querySelector('td');
            
            // Check if table is actually visible and has content
            if (firstCell && firstCell.offsetWidth > 0 && table.offsetWidth > 0) {
                renderProjects();
            } else if (retryCount >= maxRetries) {
                // Fallback: render projects anyway
                renderProjects();
            } else {
                // If cells aren't ready, try again with a longer delay
                setTimeout(() => requestAnimationFrame(ensureTableReady), 50);
            }
        };
        
        // Start the process
        requestAnimationFrame(ensureTableReady);
    },

    /**
     * Create a project bar element
     * @param {Object} project - Project object
     * @param {Object} options - Options for positioning
     * @returns {HTMLElement} Project bar element
     */
    createProjectBar(project, options) {
        const bar = document.createElement('div');
        bar.className = 'project-bar';
        
        // Check if project is in a group
        const projectGroup = ProjectGroupService.getGroupByProjectId(project.id);
        if (projectGroup) {
            bar.classList.add('grouped');
            bar.dataset.groupId = projectGroup.id;
        }
        
        // Use the project's own color, or default
        let projectColor = project.color || 'var(--sp-project)';
        
        bar.style.background = projectColor;
        bar.style.setProperty('--project-color', projectColor);
        
        // Check if project is selected for grouping
        if (this.selectedProjects.has(project.id)) {
            bar.classList.add('group-selected');
        }

        // Check if project is pinned
        if (project.pinned) {
            bar.classList.add('pinned');
        }
        
        // Calculate visible start/end for this view
        const projStartIdx = Math.max(0, this.dates.findIndex(d => d.toISOString().slice(0, 10) >= project.start));
        let projEndIdx = Math.min(this.dates.length - 1, this.dates.findIndex(d => d.toISOString().slice(0, 10) > project.end) - 1);
        if (projEndIdx < 0) projEndIdx = this.dates.length - 1;
        
        const startIdx = Math.max(0, projStartIdx);
        const endIdx = Math.max(startIdx, projEndIdx);
        
        const tr = options.row;
        const cell = tr.children[startIdx + 1];
        const cell2 = tr.children[endIdx + 1];
        
        if (!cell || !cell2) return bar; // Safety check
        
        // Force layout recalculation
        tr.offsetHeight;
        
        // Use getBoundingClientRect for more accurate positioning
        const cellRect = cell.getBoundingClientRect();
        const cell2Rect = cell2.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const left = cellRect.left - containerRect.left;
        const width = (cell2Rect.right - cellRect.left) - 2;
        
        bar.style.left = left + 'px';
        bar.style.width = width + 'px';
        
        // Special positioning for day off projects
        if (project.isDayOff && options.group) {
            // Position day off projects to span across all resources in the group
            const groupStartRow = this.getGroupStartRow(options.group);
            const groupEndRow = this.getGroupEndRow(options.group);
            const groupHeight = groupEndRow - groupStartRow;
            
            bar.style.top = (groupStartRow + 3) + 'px';
            bar.style.height = (groupHeight - 6) + 'px';
            bar.style.zIndex = '1'; // Place behind regular projects
        } else {
            bar.style.top = (tr.offsetTop + 3 + options.stackIndex * 26) + 'px';
        }
        
        // Color dot
        const colorDot = document.createElement('span');
        colorDot.className = 'color-dot';
        
        // SIMPLE: Use the project's own color, or default
        let dotColor = project.color || 'var(--sp-project)';
        
        colorDot.style.background = dotColor;
        colorDot.title = "Edit project details";
        colorDot.tabIndex = 0;
        colorDot.setAttribute('aria-label', 'Edit project details');
        colorDot.onclick = e => { 
            e.stopPropagation(); 
            this.options.onProjectEdit?.(project); 
        };
        colorDot.onkeydown = e => { 
            if (e.key === "Enter" || e.key === " ") { 
                this.options.onProjectEdit?.(project); 
            } 
        };
        bar.appendChild(colorDot);
        
        // Name (with group name if grouped)
        const nameSpan = document.createElement('span');
        nameSpan.className = 'project-name';
        
        let displayName = project.name;
        if (projectGroup) {
            // Use the group name from ProjectGroupService
            displayName = `${projectGroup.name} - ${project.name}`;
        }
        
        nameSpan.textContent = displayName;
        nameSpan.title = displayName;
        bar.appendChild(nameSpan);
        
        // Actions
        const barActions = document.createElement('span');
        barActions.className = 'bar-actions';
        
        // Group action button (only show for grouped projects)
        if (projectGroup) {
            const groupActionBtn = document.createElement('button');
            groupActionBtn.className = 'group-action-btn chain-link-icon';
            groupActionBtn.textContent = '';
            groupActionBtn.title = 'Ungroup project';
            groupActionBtn.onclick = e => {
                e.stopPropagation();
                this.ungroupProject(project.id);
            };
            barActions.appendChild(groupActionBtn);
        }
        
        bar.appendChild(barActions);
        
        // Click handling for project selection and grouping
        bar.onclick = e => {
            if (e.ctrlKey) {
                // Multi-selection mode
                this.handleProjectSelection(project.id, e.shiftKey);
            } else {
                // Single selection mode
                this.handleSingleProjectSelection(project.id);
            }
        };

        // Right-click context menu
        bar.oncontextmenu = e => {
            e.preventDefault();
            this.showContextMenu(e, project);
        };
        
        // Drag/resize
        bar.onmousedown = e => {
            if (e.ctrlKey) {
                // Handle multi-selection instead of drag
                this.handleProjectSelection(project.id, e.shiftKey);
                e.preventDefault();
                return;
            }
            
            // For single clicks, we want to select but not start dragging immediately
            // Only start drag if there's actual mouse movement
            this.dragProject = project;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.dragBarEl = bar;
            this.isDragging = false; // Track if actual dragging has started
            e.preventDefault();
        };
        
        // Resize handles
        const leftHandle = document.createElement('div');
        leftHandle.className = 'resize-handle left';
        leftHandle.title = "Resize project start";
        leftHandle.onmousedown = e => {
            this.resizeHandle = { proj: project, side: 'left' };
            e.stopPropagation();
        };
        
        const rightHandle = document.createElement('div');
        rightHandle.className = 'resize-handle right';
        rightHandle.title = "Resize project end";
        rightHandle.onmousedown = e => {
            this.resizeHandle = { proj: project, side: 'right' };
            e.stopPropagation();
        };
        
        bar.appendChild(leftHandle);
        bar.appendChild(rightHandle);
        
        return bar;
    },

    /**
     * Handle mouse drag events
     * @param {MouseEvent} e - Mouse event
     */
    handleDrag(e) {
        // --- DRAGGING ---
        if (this.dragProject && this.dragBarEl) {
            // Check if we've moved enough to start dragging (prevent accidental drags)
            if (!this.isDragging) {
                const moveThreshold = 5; // pixels
                const deltaX = Math.abs(e.clientX - this.dragStart.x);
                const deltaY = Math.abs(e.clientY - this.dragStart.y);
                
                if (deltaX < moveThreshold && deltaY < moveThreshold) {
                    return; // Not enough movement yet
                }
                
                // Start dragging
                this.isDragging = true;
                this.dragBarEl.classList.add('selected');
                document.body.style.cursor = "grabbing";
            }
            const table = document.querySelector('.timeline-table');
            const trs = table.querySelectorAll('tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
            let foundRow = null, foundCellIdx = null, foundRowIdx = null;
            
            for (let rowIdx = 0; rowIdx < trs.length; rowIdx++) {
                const tr = trs[rowIdx];
                const tds = Array.from(tr.children).slice(1);
                for (let i = 0; i < tds.length; i++) {
                    const rect = tds[i].getBoundingClientRect();
                    if (
                        e.clientX >= rect.left && e.clientX < rect.right &&
                        e.clientY >= rect.top && e.clientY < rect.bottom
                    ) {
                        foundRow = tr;
                        foundCellIdx = i;
                        foundRowIdx = rowIdx;
                        break;
                    }
                }
                if (foundRow) break;
            }
            
            if (foundRow && foundCellIdx !== null) {
                // Snap to this row and date
                const resourceName = foundRow.children[0].childNodes[0].nodeValue.trim();
                const newStartDate = this.dates[foundCellIdx].toISOString().slice(0, 10);
                
                // Check if this project is pinned and warn user
                if (this.dragProject.pinned) {
                    this.showPinWarning(() => {
                        this.executeDragMove(newStartDate, resourceName);
                    });
                    return;
                }
                
                this.executeDragMove(newStartDate, resourceName);
            }
        }
        
        // --- RESIZING ---
        if (this.resizeHandle) {
            const table = document.querySelector('.timeline-table');
            const cells = table.querySelectorAll('tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
            let rowIndex = -1, projRow = null;
            
            this.groups.forEach((group) => {
                group.resources.forEach((resource) => {
                    rowIndex++;
                    if (this.resizeHandle.proj.resourceId === resource.name) {
                        projRow = cells[rowIndex];
                    }
                });
            });
            
            if (!projRow) return;
            
            const tds = Array.from(projRow.children).slice(1);
            for (let i = 0; i < tds.length; i++) {
                const rect = tds[i].getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX < rect.right) {
                    const date = this.dates[i].toISOString().slice(0, 10);
                    if (this.resizeHandle.side === 'left') {
                        if (new Date(date) <= new Date(this.resizeHandle.proj.end)) {
                            this.resizeHandle.proj.start = date;
                        }
                    } else {
                        if (new Date(date) >= new Date(this.resizeHandle.proj.start)) {
                            this.resizeHandle.proj.end = date;
                        }
                    }
                    
                    this.dragOccurred = true; // Mark that resize occurred
                    
                    this.options.onProjectUpdate?.(this.resizeHandle.proj);
                    break;
                }
            }
        }
    },

    /**
     * Handle dragging of a group of projects
     * @param {string} groupId - Group ID
     * @param {string} newStartDate - New start date for the dragged project
     * @param {string} newResourceId - New resource ID
     */
    handleGroupDrag(groupId, newStartDate, newResourceId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
        
        if (groupProjects.length === 0) return;
        
        // Find the dragged project in the group
        const draggedProject = groupProjects.find(p => p.id === this.dragProject.id);
        if (!draggedProject) return;
        
        // Calculate the offset from the dragged project's original position
        const originalStart = new Date(draggedProject.start);
        const newStart = new Date(newStartDate);
        const daysOffset = Math.round((newStart - originalStart) / (1000 * 60 * 60 * 24));
        
        // Check if group can change resources
        const canChangeResource = ProjectGroupService.canGroupChangeResource(groupId, allProjects);
        
        // Update all projects in the group
        const updatedProjects = [...allProjects];
        
        groupProjects.forEach(project => {
            const projectIndex = updatedProjects.findIndex(p => p.id === project.id);
            if (projectIndex !== -1) {
                const newProjectStart = DateUtils.addDays(project.start, daysOffset);
                const newProjectEnd = DateUtils.addDays(project.end, daysOffset);
                
                updatedProjects[projectIndex] = {
                    ...project,
                    start: newProjectStart,
                    end: newProjectEnd,
                    resourceId: canChangeResource ? newResourceId : project.resourceId
                };
            }
        });
        
        this.dragOccurred = true;
        
        // Update all projects in the group
        updatedProjects.forEach(project => {
            if (groupProjects.some(gp => gp.id === project.id)) {
                this.options.onProjectUpdate?.(project);
            }
        });
    },

    /**
     * End drag operation
     */
    endDrag() {
        if (this.dragProject || this.resizeHandle) {
            this.dragOccurred = false; // Reset flag
        }
        
        if (this.dragProject) {
            this.dragProject = null;
            this.dragStart = null;
            this.dragBarEl = null;
            this.isDragging = false; // Reset drag state
            const bars = document.querySelectorAll('.project-bar');
            bars.forEach(bar => bar.classList.remove('selected'));
            document.body.style.cursor = "";
        }
        if (this.resizeHandle) {
            this.resizeHandle = null;
        }
    },

    /**
     * Handle key down events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (e.key === 'g' && e.ctrlKey) {
            e.preventDefault();
            this.isGroupingMode = true;
            this.currentGroup = null;
            // Don't clear selectedProjects here - we want to keep the selection for grouping
            this.attemptCreateGroup();
        } else if (e.key === 'Delete' && this.selectedProjects.size > 0) {
            e.preventDefault();
            this.handleDeleteSelection();
        } else if (e.key === 'Escape' && this.selectedProjects.size > 0) {
            e.preventDefault();
            this.clearSelection();
        }
    },

    /**
     * Handle key up events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        if (e.key === 'g' && e.ctrlKey) {
            this.isGroupingMode = false;
        }
    },

    /**
     * Handle single project selection (replaces previous selection)
     * @param {string} projectId - Project ID
     */
    handleSingleProjectSelection(projectId) {
        console.log('handleSingleProjectSelection called with:', { projectId });
        
        // Clear previous selection
        this.selectedProjects.clear();
        
        // Check if this project is part of a group
        const allProjects = this.options.getAllProjects?.() || [];
        const group = ProjectGroupService.getGroupByProjectId(projectId);
        
        if (group) {
            // Select all projects in the same group
            const groupProjects = ProjectGroupService.getProjectsInGroup(group.id, allProjects);
            groupProjects.forEach(project => {
                this.selectedProjects.add(project.id);
            });
            this.showGroupingIndicator(`${groupProjects.length} projects selected (entire group). Ctrl+Click to add more, or click "Group Projects" to create a new group.`);
        } else {
            // Select just this single project
            this.selectedProjects.add(projectId);
            this.showGroupingIndicator(`1 project selected. Ctrl+Click to add more, or click "Group Projects" to create a group.`);
        }
        
        console.log('Current selectedProjects:', Array.from(this.selectedProjects));
        
        // Update button state
        this.updateGroupButtonState();
        
        // Re-render to update visual indicators
        this.options.onRenderRequest?.();
    },
    
    /**
     * Handle project selection for grouping (multi-selection mode)
     * @param {string} projectId - Project ID
     * @param {boolean} isShiftClick - Whether this is a shift+click (remove from selection)
     */
    handleProjectSelection(projectId, isShiftClick) {
        console.log('handleProjectSelection called with:', { projectId, isShiftClick });
        
        const allProjects = this.options.getAllProjects?.() || [];
        const group = ProjectGroupService.getGroupByProjectId(projectId);
        
        if (isShiftClick) {
            // Remove from selection - if it's a group, remove all projects in the group
            if (group) {
                const groupProjects = ProjectGroupService.getProjectsInGroup(group.id, allProjects);
                groupProjects.forEach(project => {
                    this.selectedProjects.delete(project.id);
                });
                this.showGroupingIndicator(`${groupProjects.length} projects removed from selection (entire group)`);
            } else {
                this.selectedProjects.delete(projectId);
                this.showGroupingIndicator('Project removed from selection');
            }
        } else {
            // Add to selection - if it's a group, add all projects in the group
            if (group) {
                const groupProjects = ProjectGroupService.getProjectsInGroup(group.id, allProjects);
                groupProjects.forEach(project => {
                    this.selectedProjects.add(project.id);
                });
                this.showGroupingIndicator(`${this.selectedProjects.size} project(s) selected. Click "Group Projects" or press Ctrl+G to group.`);
            } else {
                this.selectedProjects.add(projectId);
                this.showGroupingIndicator(`${this.selectedProjects.size} project(s) selected. Click "Group Projects" or press Ctrl+G to group.`);
            }
        }
        
        console.log('Current selectedProjects:', Array.from(this.selectedProjects));
        
        // Update button state
        this.updateGroupButtonState();
        
        // Re-render to update visual indicators
        this.options.onRenderRequest?.();
    },
    
    /**
     * Update the Group Projects button state
     */
    updateGroupButtonState() {
        const groupBtn = document.getElementById('groupProjectsBtn');
        if (groupBtn) {
            const hasSelection = this.selectedProjects.size >= 2;
            groupBtn.disabled = !hasSelection;
            
            if (this.selectedProjects.size === 1) {
                groupBtn.title = '1 project selected. Select more projects to group.';
            } else if (hasSelection) {
                groupBtn.title = `${this.selectedProjects.size} project(s) selected. Click to group.`;
            } else {
                groupBtn.title = 'Select at least 2 projects to group';
            }
        }
    },

    /**
     * Attempt to create a group from selected projects
     */
    attemptCreateGroup() {
        const selectedProjectIds = Array.from(this.selectedProjects);
        const allProjects = this.options.getAllProjects?.() || [];
        
        console.log('Attempting to create group with:', selectedProjectIds);
        console.log('All projects:', allProjects);
        
        if (selectedProjectIds.length < 2) {
            this.showGroupingIndicator('Select at least 2 projects to create a group');
            return;
        }
        
        // Check if any selected projects are already in groups
        const existingGroups = new Set();
        const ungroupedProjects = [];
        
        selectedProjectIds.forEach(projectId => {
            const group = ProjectGroupService.getGroupByProjectId(projectId);
            if (group) {
                existingGroups.add(group.id);
            } else {
                ungroupedProjects.push(projectId);
            }
        });
        
        console.log('Existing groups found:', Array.from(existingGroups));
        console.log('Ungrouped projects:', ungroupedProjects);
        
        if (existingGroups.size === 0) {
            // No existing groups - create new group
            this.createNewGroup(selectedProjectIds);
        } else if (existingGroups.size === 1) {
            // One existing group - add ungrouped projects to it
            const groupId = Array.from(existingGroups)[0];
            this.addToExistingGroup(groupId, ungroupedProjects);
        } else {
            // Multiple existing groups - merge them
            this.mergeGroups(Array.from(existingGroups), ungroupedProjects);
        }
    },
    
    /**
     * Create a new group with the selected projects
     */
    createNewGroup(projectIds) {
        // Generate a group name based on the first project
        const allProjects = this.options.getAllProjects?.() || [];
        const firstProject = allProjects.find(p => p.id === projectIds[0]);
        const groupName = firstProject ? `${firstProject.name} Group` : 'New Group';
        
        const group = ProjectGroupService.createGroup(projectIds, groupName);
        this.currentGroup = group;
        this.selectedProjects.clear();
        this.showGroupingIndicator('Group created successfully!');
        this.options.onRenderRequest?.();
    },
    
    /**
     * Add projects to an existing group
     */
    addToExistingGroup(groupId, projectIds) {
        if (projectIds.length === 0) {
            this.showGroupingIndicator('All selected projects are already in the same group');
            this.selectedProjects.clear();
            return;
        }
        
        let addedCount = 0;
        projectIds.forEach(projectId => {
            if (ProjectGroupService.addProjectToGroup(groupId, projectId)) {
                addedCount++;
                // Update the project's color to match the group
                this.updateProjectColorToMatchGroup(projectId, groupId);
            }
        });
        
        this.selectedProjects.clear();
        this.showGroupingIndicator(`${addedCount} project(s) added to existing group!`);
        this.options.onRenderRequest?.();
    },
    
    /**
     * Merge multiple groups into one
     */
    mergeGroups(groupIds, additionalProjectIds) {
        if (groupIds.length < 2) {
            this.showGroupingIndicator('Need at least 2 groups to merge');
            return;
        }
        
        // Get all projects from all groups
        const allProjects = this.options.getAllProjects?.() || [];
        const allProjectIds = new Set();
        
        groupIds.forEach(groupId => {
            const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
            groupProjects.forEach(project => allProjectIds.add(project.id));
        });
        
        // Add any additional ungrouped projects
        additionalProjectIds.forEach(projectId => allProjectIds.add(projectId));
        
        // Create new merged group with a name based on the first project
        const firstProject = allProjects.find(p => p.id === Array.from(allProjectIds)[0]);
        const mergedGroupName = firstProject ? `${firstProject.name} Group` : 'Merged Group';
        
        const mergedGroup = ProjectGroupService.createGroup(Array.from(allProjectIds), mergedGroupName);
        
        // Delete the old groups
        groupIds.forEach(groupId => {
            ProjectGroupService.deleteGroup(groupId);
        });
        
        this.selectedProjects.clear();
        this.showGroupingIndicator(`Merged ${groupIds.length} groups into one!`);
        this.options.onRenderRequest?.();
    },

    /**
     * Ungroup a project
     * @param {string} projectId - Project ID to ungroup
     */
    ungroupProject(projectId) {
        if (ProjectGroupService.removeProjectFromGroup(projectId)) {
            this.showGroupingIndicator('Project ungrouped');
            this.options.onRenderRequest?.();
        }
    },

    /**
     * Show grouping indicator message
     * @param {string} message - Message to show
     */
    showGroupingIndicator(message) {
        // Remove existing indicator
        const existing = document.querySelector('.group-creation-indicator');
        if (existing) {
            existing.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'group-creation-indicator';
        indicator.textContent = message;
        document.body.appendChild(indicator);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    },

    /**
     * Get all projects in the same group as a given project
     * @param {string} projectId - Project ID
     * @param {Array} allProjects - All projects array
     * @returns {Array} Array of projects in the same group
     */
    getProjectsInSameGroup(projectId, allProjects) {
        const group = ProjectGroupService.getGroupByProjectId(projectId);
        if (!group) return [allProjects.find(p => p.id === projectId)].filter(Boolean);
        
        return ProjectGroupService.getProjectsInGroup(group.id, allProjects);
    },

    /**
     * Handle delete key press for selected projects/groups
     */
    handleDeleteSelection() {
        const selectedProjectIds = Array.from(this.selectedProjects);
        const allProjects = this.options.getAllProjects?.() || [];
        
        if (selectedProjectIds.length === 0) {
            return;
        }

        // Analyze what we're about to delete
        const groupsToDelete = new Set();
        const projectsToDelete = [];
        
        selectedProjectIds.forEach(projectId => {
            const group = ProjectGroupService.getGroupByProjectId(projectId);
            if (group) {
                groupsToDelete.add(group.id);
            } else {
                projectsToDelete.push(projectId);
            }
        });

        // Create warning message
        let warningMessage = '';
        let isGroupDeletion = false;
        
        if (groupsToDelete.size > 0) {
            isGroupDeletion = true;
            const groupNames = Array.from(groupsToDelete).map(groupId => {
                const group = ProjectGroupService.getGroupById(groupId);
                return group ? group.name : `Group ${groupId}`;
            });
            
            const totalProjectsInGroups = Array.from(groupsToDelete).reduce((total, groupId) => {
                const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
                return total + groupProjects.length;
            }, 0);
            
            warningMessage = `Are you sure you want to delete ${groupsToDelete.size} group(s) (${groupNames.join(', ')}) containing ${totalProjectsInGroups} project(s)?\n\nThis action cannot be undone.`;
        } else if (projectsToDelete.length > 0) {
            const projectNames = projectsToDelete.map(projectId => {
                const project = allProjects.find(p => p.id === projectId);
                return project ? project.name : `Project ${projectId}`;
            });
            
            warningMessage = `Are you sure you want to delete ${projectsToDelete.length} project(s) (${projectNames.join(', ')})?\n\nThis action cannot be undone.`;
        }

        if (warningMessage) {
            this.showDeleteWarning(warningMessage, () => {
                this.executeDelete(groupsToDelete, projectsToDelete);
            });
        }
    },

    /**
     * Show delete warning dialog
     * @param {string} message - Warning message
     * @param {Function} onConfirm - Callback when confirmed
     */
    showDeleteWarning(message, onConfirm) {
        // Check if warnings are suppressed
        const warningSuppressed = localStorage.getItem('deleteWarningSuppressed');
        if (warningSuppressed) {
            const suppressTime = parseInt(warningSuppressed);
            const now = Date.now();
            if (now - suppressTime < 5 * 60 * 1000) { // 5 minutes
                onConfirm();
                return;
            } else {
                localStorage.removeItem('deleteWarningSuppressed');
            }
        }

        // Create warning modal
        const modal = document.createElement('div');
        modal.className = 'delete-warning-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="delete-warning-content">
                <h3>&#9888; Delete Warning</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <div class="warning-options">
                    <label>
                        <input type="checkbox" id="suppressWarning"> Don't show this warning for 5 minutes
                    </label>
                </div>
                <div class="warning-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Force a reflow to ensure positioning is correct
        modal.offsetHeight;

        // Now make it visible with animation
        modal.style.opacity = '1';

        // Handle button clicks
        const cancelBtn = modal.querySelector('.cancel-btn');
        const deleteBtn = modal.querySelector('.delete-btn');
        const suppressCheckbox = modal.querySelector('#suppressWarning');

        cancelBtn.onclick = () => {
            modal.remove();
        };

        deleteBtn.onclick = () => {
            if (suppressCheckbox.checked) {
                localStorage.setItem('deleteWarningSuppressed', Date.now().toString());
            }
            modal.remove();
            onConfirm();
        };

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus delete button
        setTimeout(() => deleteBtn.focus(), 100);
    },

    /**
     * Execute the actual deletion
     * @param {Set} groupsToDelete - Set of group IDs to delete
     * @param {Array} projectsToDelete - Array of project IDs to delete
     */
    executeDelete(groupsToDelete, projectsToDelete) {
        let deletedCount = 0;

        // Delete groups (this will also delete all projects in those groups)
        groupsToDelete.forEach(groupId => {
            const group = ProjectGroupService.getGroupById(groupId);
            if (group) {
                const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, this.options.getAllProjects?.() || []);
                groupProjects.forEach(project => {
                    this.options.onProjectDelete?.(project.id);
                    deletedCount++;
                });
                ProjectGroupService.deleteGroup(groupId);
            }
        });

        // Delete individual projects
        projectsToDelete.forEach(projectId => {
            this.options.onProjectDelete?.(projectId);
            deletedCount++;
        });

        // Clean up any empty groups that might have been created
        const removedGroups = ProjectGroupService.cleanupEmptyGroups();
        if (removedGroups > 0) {
            console.log(`Cleaned up ${removedGroups} empty groups`);
        }

        // Clear selection and show feedback
        this.selectedProjects.clear();
        this.updateGroupButtonState();
        
        if (deletedCount > 0) {
            this.showGroupingIndicator(`Deleted ${deletedCount} project(s)`);
        }
        
        this.options.onRenderRequest?.();
    },

    /**
     * Clear all selected projects
     */
    clearSelection() {
        this.selectedProjects.clear();
        this.showGroupingIndicator('All projects deselected.');
        this.updateGroupButtonState();
        this.options.onRenderRequest?.();
    },

    /**
     * Show context menu for a project
     * @param {MouseEvent} e - Mouse event
     * @param {Object} project - Project object
     */
    showContextMenu(e, project) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        
        // Get project group info
        const projectGroup = ProjectGroupService.getGroupByProjectId(project.id);
        const allProjects = this.options.getAllProjects?.() || [];
        
        // Build menu items
        const menuItems = [
            { label: 'Edit', icon: '&#9998;', action: () => this.options.onProjectEdit?.(project) },
            { label: 'Duplicate', icon: '&#128203;', action: () => this.options.onProjectDuplicate?.(project.id) },
            { label: 'Delete', icon: '&#128465;', action: () => this.handleSingleDelete(project) },
            { type: 'separator' }
        ];

        // Add group management options for grouped projects
        if (projectGroup) {
            const groupProjects = ProjectGroupService.getProjectsInGroup(projectGroup.id, allProjects);
            menuItems.push({ label: `Duplicate entire group (${groupProjects.length} projects)`, icon: '&#128203;', action: () => this.duplicateEntireGroup(projectGroup.id) });
            menuItems.push({ label: `Delete entire group (${groupProjects.length} projects)`, icon: '&#128465;', action: () => this.deleteEntireGroup(projectGroup.id) });
            
            // Check if all projects in the group are pinned
            const allPinned = groupProjects.every(p => p.pinned);
            if (allPinned) {
                menuItems.push({ label: `Unpin entire group (${groupProjects.length} projects)`, icon: '&#128204;', action: () => this.togglePinEntireGroup(projectGroup.id) });
            } else {
                menuItems.push({ label: `Pin entire group (${groupProjects.length} projects)`, icon: '&#128204;', action: () => this.togglePinEntireGroup(projectGroup.id) });
            }
        }

        menuItems.push({ type: 'separator' });

        // Pin/Unpin option
        if (project.pinned) {
            menuItems.push({ label: 'Unpin project', icon: '&#128204;', action: () => this.togglePinProject(project) });
        } else {
            menuItems.push({ label: 'Pin project', icon: '&#128204;', action: () => this.togglePinProject(project) });
        }

        menuItems.push({ type: 'separator' });

        // Group-related options removed - ungroup button is available in project bar

        // Build menu HTML
        menu.innerHTML = menuItems.map(item => {
            if (item.type === 'separator') {
                return '<div class="context-menu-separator"></div>';
            }
            return `
                <div class="context-menu-item" data-action="${item.label.toLowerCase().replace(/\s+/g, '-')}">
                    <span class="context-menu-icon">${item.icon}</span>
                    <span class="context-menu-label">${item.label}</span>
                </div>
            `;
        }).join('');

        // Position menu
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        document.body.appendChild(menu);

        // Handle menu item clicks
        menu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (menuItem) {
                const action = menuItem.dataset.action;
                const menuItemData = menuItems.find(item => 
                    item.label && item.label.toLowerCase().replace(/\s+/g, '-') === action
                );
                
                if (menuItemData && menuItemData.action) {
                    menuItemData.action();
                }
                menu.remove();
            }
        });

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        document.addEventListener('click', closeMenu);
        document.addEventListener('keydown', handleEscape);

        // Prevent menu from going off-screen
        setTimeout(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (e.pageX - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (e.pageY - rect.height) + 'px';
            }
        }, 0);
    },

    /**
     * Handle single project deletion (for context menu)
     * @param {Object} project - Project to delete
     */
    handleSingleDelete(project) {
        this.showDeleteWarning(
            `Are you sure you want to delete the project "${project.name}"?\n\nThis action cannot be undone.`,
            () => {
                this.options.onProjectDelete?.(project.id);
                this.showGroupingIndicator(`Deleted project "${project.name}"`);
            }
        );
    },

    /**
     * Select entire group for a project
     * @param {string} projectId - Project ID
     */
    selectEntireGroup(projectId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const group = ProjectGroupService.getGroupByProjectId(projectId);
        
        if (group) {
            this.selectedProjects.clear();
            const groupProjects = ProjectGroupService.getProjectsInGroup(group.id, allProjects);
            groupProjects.forEach(project => {
                this.selectedProjects.add(project.id);
            });
            this.showGroupingIndicator(`${groupProjects.length} projects selected (entire group)`);
            this.updateGroupButtonState();
            this.options.onRenderRequest?.();
        }
    },

    /**
     * Add project to an existing group
     * @param {string} projectId - Project ID
     */
    addToGroup(projectId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const allGroups = ProjectGroupService.getAllGroups();
        const project = allProjects.find(p => p.id === projectId);
        
        if (!project) return;
        
        // Filter out groups that already contain this project
        const availableGroups = allGroups.filter(group => {
            const groupProjects = ProjectGroupService.getProjectsInGroup(group.id, allProjects);
            return !groupProjects.some(p => p.id === projectId);
        });
        
        if (availableGroups.length === 0) {
            this.showGroupingIndicator('No available groups to add this project to. Create a new group first.');
            return;
        }
        
        this.showGroupSelectionDialog(project, availableGroups);
    },

    /**
     * Show group selection dialog
     * @param {Object} project - Project to add
     * @param {Array} availableGroups - Available groups to choose from
     */
    showGroupSelectionDialog(project, availableGroups) {
        // Remove any existing dialog
        const existingDialog = document.querySelector('.group-selection-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'group-selection-dialog';
        dialog.style.opacity = '0';
        dialog.innerHTML = `
            <div class="group-selection-content">
                <h3>Add to Group</h3>
                <p>Select a group to add "${project.name}" to:</p>
                <div class="group-list">
                    ${availableGroups.map(group => `
                        <div class="group-option" data-group-id="${group.id}">
                            <span class="group-name">${group.name}</span>
                            <span class="group-count">${ProjectGroupService.getProjectsInGroup(group.id, this.options.getAllProjects?.() || []).length} projects</span>
                        </div>
                    `).join('')}
                </div>
                <div class="dialog-buttons">
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Force a reflow to ensure positioning is correct
        dialog.offsetHeight;

        // Now make it visible with animation
        dialog.style.opacity = '1';

        // Handle group selection
        const groupOptions = dialog.querySelectorAll('.group-option');
        groupOptions.forEach(option => {
            option.addEventListener('click', () => {
                const groupId = option.dataset.groupId;
                const group = availableGroups.find(g => g.id === groupId);
                
                if (group && ProjectGroupService.addProjectToGroup(groupId, project.id)) {
                    // Update the project's color to match the group
                    this.updateProjectColorToMatchGroup(project.id, groupId);
                    this.showGroupingIndicator(`Added "${project.name}" to group "${group.name}"`);
                    this.options.onRenderRequest?.();
                } else {
                    this.showGroupingIndicator('Failed to add project to group');
                }
                
                dialog.remove();
            });
        });

        // Handle cancel
        const cancelBtn = dialog.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            dialog.remove();
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Close when clicking outside
        const closeDialog = (e) => {
            if (!dialog.contains(e.target)) {
                dialog.remove();
                document.removeEventListener('click', closeDialog);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('click', closeDialog);
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showGroupingIndicator('Copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showGroupingIndicator('Copied to clipboard');
        });
    },

    /**
     * Copy project details to clipboard
     * @param {Object} project - Project object
     */
    copyProjectDetails(project) {
        const details = `Project: ${project.name}
Resource: ${project.resourceId}
Start: ${project.start}
End: ${project.end}
Duration: ${DateUtils.daysBetween(project.start, project.end)} days`;
        
        this.copyToClipboard(details);
    },

    /**
     * Toggle project pin status
     * @param {Object} project - Project object
     */
    togglePinProject(project) {
        const allProjects = this.options.getAllProjects?.() || [];
        const projectIndex = allProjects.findIndex(p => p.id === project.id);

        if (projectIndex !== -1) {
            const newProject = { ...allProjects[projectIndex], pinned: !project.pinned };
            this.options.onProjectUpdate?.(newProject);
            this.showGroupingIndicator(`Project "${project.name}" ${project.pinned ? 'unpinned' : 'pinned'}`);
        }
    },

    /**
     * Toggle pin status of an entire group
     * @param {string} groupId - Group ID to toggle pin status
     */
    togglePinEntireGroup(groupId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
        
        if (groupProjects.length === 0) return;
        
        // Check if all projects are currently pinned
        const allPinned = groupProjects.every(p => p.pinned);
        const newPinnedStatus = !allPinned;
        
        // Update all projects in the group
        let updatedCount = 0;
        groupProjects.forEach(groupProject => {
            const projectIndex = allProjects.findIndex(p => p.id === groupProject.id);
            if (projectIndex !== -1) {
                const updatedProject = { ...groupProject, pinned: newPinnedStatus };
                this.options.onProjectUpdate?.(updatedProject);
                updatedCount++;
            }
        });
        
        // Show notification
        const group = ProjectGroupService.getGroupById(groupId);
        const groupName = group ? group.name : 'Group';
        this.showGroupingIndicator(`${updatedCount} projects in "${groupName}" ${newPinnedStatus ? 'pinned' : 'unpinned'}`);
    },

    /**
     * Show color picker for a project
     * @param {MouseEvent} e - Mouse event
     * @param {Object} project - Project object
     */
    showColorPicker(e, project) {
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = project.color || '#007bff'; // Default color
        colorPicker.style.position = 'fixed';
        colorPicker.style.zIndex = '9999';
        colorPicker.style.top = `${e.pageY}px`;
        colorPicker.style.left = `${e.pageX}px`;
        colorPicker.style.opacity = '0'; // Hide it

        document.body.appendChild(colorPicker);

        colorPicker.onchange = () => {
            const newColor = colorPicker.value;
            const allProjects = this.options.getAllProjects?.() || [];
            const projectIndex = allProjects.findIndex(p => p.id === project.id);

            if (projectIndex !== -1) {
                // Check if this project is in a group
                const projectGroup = ProjectGroupService.getGroupByProjectId(project.id);
                
                if (projectGroup) {
                    // Update all projects in the same group
                    const groupProjects = ProjectGroupService.getProjectsInGroup(projectGroup.id, allProjects);
                    let updatedCount = 0;
                    
                    groupProjects.forEach(groupProject => {
                        const groupProjectIndex = allProjects.findIndex(p => p.id === groupProject.id);
                        if (groupProjectIndex !== -1) {
                            const updatedProject = { ...allProjects[groupProjectIndex], color: newColor };
                            this.options.onProjectUpdate?.(updatedProject);
                            updatedCount++;
                        }
                    });
                    
                    this.showGroupingIndicator(`Updated color for ${updatedCount} projects in group "${projectGroup.name}"`);
                } else {
                    // Update just this project
                    const newProject = { ...allProjects[projectIndex], color: newColor };
                    this.options.onProjectUpdate?.(newProject);
                    this.showGroupingIndicator(`Project "${project.name}" color changed to ${newColor}`);
                }
            }
            colorPicker.remove();
        };

        colorPicker.onblur = () => {
            colorPicker.remove();
        };

        colorPicker.focus();
    },

    /**
     * Show pin warning dialog
     * @param {Function} onConfirm - Callback when confirmed
     */
    showPinWarning(onConfirm) {
        // Remove any existing pin warning
        const existingWarning = document.querySelector('.pin-warning-modal');
        if (existingWarning) {
            existingWarning.remove();
        }

        // Create pin warning modal
        const modal = document.createElement('div');
        modal.className = 'pin-warning-modal';
        modal.style.opacity = '0';
        modal.innerHTML = `
            <div class="pin-warning-content">
                <h3>&#9888; Pin Warning</h3>
                <p>You are trying to move a pinned project. Pinned projects cannot be moved. Please unpin it first.</p>
                <div class="warning-buttons">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Force a reflow to ensure positioning is correct
        modal.offsetHeight;

        // Now make it visible with animation
        modal.style.opacity = '1';

        // Handle button clicks
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');

        cancelBtn.onclick = () => {
            modal.remove();
        };

        confirmBtn.onclick = () => {
            modal.remove();
            onConfirm();
        };

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus confirm button
        setTimeout(() => confirmBtn.focus(), 100);
    },

    /**
     * Execute the drag move operation
     * @param {string} newStartDate - New start date for the dragged project
     * @param {string} newResourceId - New resource ID
     */
    executeDragMove(newStartDate, newResourceId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const group = ProjectGroupService.getGroupByProjectId(this.dragProject.id);
        
        if (group) {
            this.handleGroupDrag(group.id, newStartDate, newResourceId);
        } else {
            const duration = DateUtils.daysBetween(this.dragProject.start, this.dragProject.end);
            const newEndDate = DateUtils.addDays(newStartDate, duration);
            
            this.dragProject.resourceId = newResourceId;
            this.dragProject.start = newStartDate;
            this.dragProject.end = newEndDate;
            
            this.dragOccurred = true;
            this.options.onProjectUpdate?.(this.dragProject);
        }
    },

    /**
     * Duplicate an entire group
     * @param {string} groupId - Group ID to duplicate
     */
    duplicateEntireGroup(groupId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);

        if (groupProjects.length === 0) {
            this.showGroupingIndicator('No projects to duplicate in this group.');
            return;
        }

        // Create new projects with unique IDs
        const newGroupProjects = groupProjects.map(project => ({
            ...project,
            id: `duplicate-${project.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure unique ID
            name: `${project.name} (Copy)`,
            color: project.color || 'var(--sp-project)', // Keep original color or default
            pinned: false // New duplicates are not pinned
        }));

        // Add new projects to the project list
        let addedCount = 0;
        newGroupProjects.forEach(newProject => {
            if (this.options.onProjectCreate) {
                this.options.onProjectCreate(newProject);
                addedCount++;
            }
        });

        // Create a new group for the duplicated projects
        if (addedCount > 0) {
            const newGroupId = ProjectGroupService.createGroup(newGroupProjects.map(p => p.id));
            this.showGroupingIndicator(`Duplicated ${addedCount} projects to a new group!`);
            this.options.onRenderRequest?.();
        } else {
            this.showGroupingIndicator('Failed to duplicate projects. Please try again.');
        }
    },

    /**
     * Delete an entire group
     * @param {string} groupId - Group ID to delete
     */
    deleteEntireGroup(groupId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
        
        if (groupProjects.length === 0) {
            this.showGroupingIndicator('No projects to delete in this group.');
            return;
        }
        
        // Show confirmation dialog
        this.showDeleteWarning(
            `Delete entire group with ${groupProjects.length} projects?`,
            () => {
                // Delete all projects in the group
                let deletedCount = 0;
                groupProjects.forEach(project => {
                    if (this.options.onProjectDelete) {
                        this.options.onProjectDelete(project.id);
                        deletedCount++;
                    }
                });
                
                // Show confirmation
                this.showGroupingIndicator(`Deleted group with ${deletedCount} projects`);
                this.options.onRenderRequest?.();
            }
        );
    },

    /**
     * Get the starting row position for a group
     * @param {Object} group - Group object
     * @returns {number} Row position
     */
    getGroupStartRow(group) {
        const table = this.container.querySelector('table');
        if (!table) return 0;
        
        const trs = table.querySelectorAll('tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
        let rowIndex = 0;
        
        for (let i = 0; i < this.groups.length; i++) {
            if (this.groups[i].name === group.name) {
                return trs[rowIndex]?.offsetTop || 0;
            }
            rowIndex += this.groups[i].resources.length;
        }
        return 0;
    },

    /**
     * Get the ending row position for a group
     * @param {Object} group - Group object
     * @returns {number} Row position
     */
    getGroupEndRow(group) {
        const table = this.container.querySelector('table');
        if (!table) return 0;
        
        const trs = table.querySelectorAll('tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
        let rowIndex = 0;
        
        for (let i = 0; i < this.groups.length; i++) {
            if (this.groups[i].name === group.name) {
                rowIndex += this.groups[i].resources.length;
                return trs[rowIndex - 1]?.offsetTop + trs[rowIndex - 1]?.offsetHeight || 0;
            }
            rowIndex += this.groups[i].resources.length;
        }
        return 0;
    },

    /**
     * Update a project's color to match the group's color
     * @param {string} projectId - Project ID to update
     * @param {string} groupId - Group ID
     */
    updateProjectColorToMatchGroup(projectId, groupId) {
        const allProjects = this.options.getAllProjects?.() || [];
        const groupProjects = ProjectGroupService.getProjectsInGroup(groupId, allProjects);
        
        if (groupProjects.length > 0) {
            // Find the project being added to the group
            const projectToAdd = allProjects.find(p => p.id === projectId);
            if (projectToAdd) {
                // Get the color from the first project in the group (if it has a color)
                const firstGroupProject = groupProjects[0];
                const groupColor = firstGroupProject.color || projectToAdd.color || 'var(--sp-project)';
                
                // Update the project being added with the group color
                const projectIndex = allProjects.findIndex(p => p.id === projectId);
                if (projectIndex !== -1) {
                    const updatedProject = { ...allProjects[projectIndex], color: groupColor };
                    this.options.onProjectUpdate?.(updatedProject);
                }
            }
        }
    },

    /**
     * Get day off for a specific date
     * @param {string} dateStr - Date string (YYYY-MM-DD)
     * @returns {Object|null} Day off object or null
     */
    getDayOffForDate(dateStr) {
        const dayOffs = this.options.getDayOffs?.() || [];
        return dayOffs.find(dayOff => dayOff.date === dateStr) || null;
    },

    /**
     * Show context menu for day off
     * @param {MouseEvent} e - Mouse event
     * @param {Object} dayOff - Day off object
     */
    showDayOffContextMenu(e, dayOff) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Format the date for display
        const date = new Date(dayOff.date);
        const formattedDate = date.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.style.zIndex = '1000';
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.95)';
        menu.style.transition = 'all 0.15s ease';

        menu.innerHTML = `
            <div class="context-menu-item day-off-info">
                <div style="font-weight: bold; color: #6c3fc5; margin-bottom: 4px;">${dayOff.type.charAt(0).toUpperCase() + dayOff.type.slice(1)}</div>
                <div style="font-size: 0.9em; color: #666;">${formattedDate}</div>
                ${dayOff.notes ? `<div style="font-size: 0.85em; color: #888; margin-top: 2px;">${dayOff.notes}</div>` : ''}
            </div>
            <div class="context-menu-separator"></div>
            <div class="context-menu-item" onclick="this.removeDayOff('${dayOff.id}')">
                                        <span class="context-menu-icon">&#128465;</span>
                <span class="context-menu-label">Remove Day Off</span>
            </div>
        `;

        document.body.appendChild(menu);

        // Animate in
        requestAnimationFrame(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1)';
        });

        // Add click handler for remove action
        const removeItem = menu.querySelector('.context-menu-item:last-child');
        removeItem.onclick = () => {
            this.removeDayOff(dayOff.id);
            menu.remove();
        };

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                menu.remove();
                document.removeEventListener('click', closeMenu);
                document.removeEventListener('keydown', handleEscape);
            }
        };

        document.addEventListener('click', closeMenu);
        document.addEventListener('keydown', handleEscape);
    },

    /**
     * Remove a day off
     * @param {string} dayOffId - Day off ID to remove
     */
    removeDayOff(dayOffId) {
        const dayOffs = this.options.getDayOffs?.() || [];
        const dayOffIndex = dayOffs.findIndex(d => d.id === dayOffId);
        
        if (dayOffIndex !== -1) {
            const dayOff = dayOffs[dayOffIndex];
            dayOffs.splice(dayOffIndex, 1);
            
            // Update the data
            this.options.onDayOffRemove?.(dayOffs);
            
            // Show confirmation
            this.showGroupingIndicator(`Removed day off: ${dayOff.type} on ${new Date(dayOff.date).toLocaleDateString()}`);
        }
    }
}; 