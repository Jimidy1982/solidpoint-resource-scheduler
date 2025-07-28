/**
 * DOM utility functions for the Resource Scheduler
 */

const DomUtils = {
    /**
     * Create an element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {Object} attrs - Element attributes
     * @param {Array|string} children - Child elements or text content
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attrs = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        // Add children
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (child instanceof HTMLElement) {
                    element.appendChild(child);
                } else if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                }
            });
        }

        return element;
    },

    /**
     * Remove all children from an element
     * @param {HTMLElement} element - Element to clear
     */
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Add event listener with automatic cleanup
     * @param {HTMLElement} element - Element to add listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    },

    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {Object} attrs - Button attributes
     * @returns {HTMLButtonElement} Created button
     */
    createButton(text, attrs = {}) {
        return this.createElement('button', {
            type: 'button',
            ...attrs
        }, text);
    },

    /**
     * Create an input element
     * @param {string} type - Input type
     * @param {Object} attrs - Input attributes
     * @returns {HTMLInputElement} Created input
     */
    createInput(type, attrs = {}) {
        return this.createElement('input', {
            type,
            ...attrs
        });
    },

    /**
     * Create a select element with options
     * @param {Array} options - Array of option objects {value, text}
     * @param {Object} attrs - Select attributes
     * @returns {HTMLSelectElement} Created select
     */
    createSelect(options, attrs = {}) {
        const select = this.createElement('select', attrs);
        options.forEach(opt => {
            select.appendChild(this.createElement('option', {
                value: opt.value
            }, opt.text));
        });
        return select;
    },

    /**
     * Show a modal dialog
     * @param {HTMLElement} content - Modal content
     * @param {Function} onClose - Close handler
     * @returns {HTMLElement} Modal element
     */
    showModal(content, onClose) {
        const overlay = this.createElement('div', {
            className: 'close-area'
        });
        
        const modal = this.createElement('div', {
            className: 'project-details'
        }, content);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const cleanup = () => {
            overlay.remove();
            modal.remove();
            if (onClose) onClose();
        };

        overlay.addEventListener('click', cleanup);
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') cleanup();
        });

        return modal;
    }
}; 