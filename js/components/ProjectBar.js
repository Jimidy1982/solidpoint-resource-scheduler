/**
 * ProjectBar component for rendering project bars in the timeline
 */

const ProjectBar = {
    /**
     * Create a project bar element
     * @param {Object} project - Project data
     * @param {Object} options - Bar options
     * @returns {HTMLElement} Project bar element
     */
    create(project, options = {}) {
        const bar = DomUtils.createElement('div', {
            className: 'project-bar',
            style: {
                background: project.color || 'var(--sp-project)'
            }
        });

        // Calculate position and size
        const startIdx = Math.max(0, options.dates.findIndex(d => d.toISOString().slice(0, 10) >= project.start));
        const endIdx = Math.min(options.dates.length - 1, options.dates.findIndex(d => d.toISOString().slice(0, 10) > project.end) - 1);
        
        if (endIdx < 0) return bar;

        const trs = document.querySelectorAll('.timeline-table tbody tr:not(.group-divider-row):not(.group-header-row):not(.group-padding-row)');
        const tr = trs[options.rowY];
        const startCell = tr.children[startIdx + 1];
        const endCell = tr.children[endIdx + 1];

        bar.style.left = startCell.offsetLeft + 'px';
        bar.style.width = (endCell.offsetLeft - startCell.offsetLeft) + endCell.offsetWidth - 2 + 'px';
        bar.style.top = (tr.offsetTop + 3 + options.stackIndex * 26) + 'px';

        // Color dot
        const colorDot = DomUtils.createElement('span', {
            className: 'color-dot',
            style: { background: project.color || 'var(--sp-project)' },
            title: 'Edit project details',
            tabIndex: 0,
            'aria-label': 'Edit project details'
        });

        colorDot.onclick = e => {
            e.stopPropagation();
            options.onEdit?.();
        };

        colorDot.onkeydown = e => {
            if (e.key === 'Enter' || e.key === ' ') {
                options.onEdit?.();
            }
        };

        bar.appendChild(colorDot);

        // Project name
        const nameSpan = DomUtils.createElement('span', {
            className: 'project-name',
            textContent: project.name,
            title: project.name
        });
        bar.appendChild(nameSpan);

        // Actions
        const actions = DomUtils.createElement('span', {
            className: 'bar-actions',
            innerHTML: `
                <button title="Duplicate" aria-label="Duplicate project" onclick="event.stopPropagation(); options.onDuplicate?.()">&#128209;</button>
                <button title="Delete" aria-label="Delete project" onclick="event.stopPropagation(); options.onDelete?.()">&#10006;</button>
            `
        });
        bar.appendChild(actions);

        // Drag handling
        bar.onmousedown = e => {
            if (e.target.tagName === 'BUTTON') return;
            
            const timeline = document.querySelector('.timeline');
            if (!timeline) return;

            timeline.dragProject = project;
            timeline.dragStart = { x: e.clientX, y: e.clientY };
            timeline.dragBarEl = bar;
            
            bar.classList.add('selected');
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        };

        // Resize handles
        const leftHandle = DomUtils.createElement('div', {
            className: 'resize-handle left',
            title: 'Resize project start'
        });

        leftHandle.onmousedown = e => {
            const timeline = document.querySelector('.timeline');
            if (!timeline) return;

            timeline.resizeHandle = { proj: project, side: 'left' };
            e.stopPropagation();
        };

        const rightHandle = DomUtils.createElement('div', {
            className: 'resize-handle right',
            title: 'Resize project end'
        });

        rightHandle.onmousedown = e => {
            const timeline = document.querySelector('.timeline');
            if (!timeline) return;

            timeline.resizeHandle = { proj: project, side: 'right' };
            e.stopPropagation();
        };

        bar.appendChild(leftHandle);
        bar.appendChild(rightHandle);

        return bar;
    },

    /**
     * Update project bar position and size
     * @param {HTMLElement} bar - Project bar element
     * @param {Object} options - Update options
     */
    update(bar, options = {}) {
        if (options.left !== undefined) {
            bar.style.left = options.left + 'px';
        }
        if (options.width !== undefined) {
            bar.style.width = options.width + 'px';
        }
        if (options.top !== undefined) {
            bar.style.top = options.top + 'px';
        }
        if (options.background !== undefined) {
            bar.style.background = options.background;
            const colorDot = bar.querySelector('.color-dot');
            if (colorDot) {
                colorDot.style.background = options.background;
            }
        }
    },

    /**
     * Set selected state
     * @param {HTMLElement} bar - Project bar element
     * @param {boolean} selected - Selected state
     */
    setSelected(bar, selected) {
        bar.classList.toggle('selected', selected);
    }
}; 