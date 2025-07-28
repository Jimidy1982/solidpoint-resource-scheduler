/**
 * Date utility functions for the Resource Scheduler
 */

const DateUtils = {
    /**
     * Get today's date in YYYY-MM-DD format
     * @returns {string} Today's date in YYYY-MM-DD format
     */
    todayStr() {
        return new Date().toISOString().slice(0, 10);
    },

    /**
     * Add days to a date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {number} days - Number of days to add
     * @returns {string} New date in YYYY-MM-DD format
     */
    addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    },

    /**
     * Calculate days between two dates
     * @param {string} a - Start date in YYYY-MM-DD format
     * @param {string} b - End date in YYYY-MM-DD format
     * @returns {number} Number of days between dates
     */
    daysBetween(a, b) {
        return Math.round((new Date(b) - new Date(a)) / 86400000);
    },

    /**
     * Format a date for display
     * @param {Date|string} date - Date object or date string
     * @returns {string} Formatted date string (e.g., "Mon 15 Jan")
     */
    formatDate(date) {
        const dt = (date instanceof Date) ? date : new Date(date);
        return dt.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short' 
        });
    },

    /**
     * Check if a date is a weekend
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {boolean} True if the date is a weekend
     */
    isWeekend(date) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    /**
     * Check if a date is today
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {boolean} True if the date is today
     */
    isToday(date) {
        return date === this.todayStr();
    }
}; 