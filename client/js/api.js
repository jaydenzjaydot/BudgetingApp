/**
 * API Client for Home Dashboard
 * Handles all communication with the backend
 */

const API_BASE = '/api';

const api = {
    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },

    // ==================== Categories ====================
    categories: {
        async getAll() {
            return api.request('/categories');
        },

        async create(data) {
            return api.request('/categories', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return api.request(`/categories/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return api.request(`/categories/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ==================== Expenses ====================
    expenses: {
        async getAll(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return api.request(`/expenses${params ? '?' + params : ''}`);
        },

        async getSummary(month, year) {
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);
            return api.request(`/expenses/summary?${params.toString()}`);
        },

        getExportUrl(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return `${API_BASE}/expenses/export${params ? '?' + params : ''}`;
        },

        async create(data) {
            return api.request('/expenses', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return api.request(`/expenses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return api.request(`/expenses/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ==================== Budgets ====================
    budgets: {
        async getAll(month, year) {
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);
            return api.request(`/budgets?${params.toString()}`);
        },

        async getStatus(month, year) {
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);
            return api.request(`/budgets/status?${params.toString()}`);
        },

        async set(data) {
            return api.request('/budgets', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return api.request(`/budgets/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // ==================== Income ====================
    income: {
        async getAll(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return api.request(`/income${params ? '?' + params : ''}`);
        },

        async getSummary(month, year) {
            const params = new URLSearchParams();
            if (month) params.append('month', month);
            if (year) params.append('year', year);
            return api.request(`/income/summary?${params.toString()}`);
        },

        getExportUrl(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return `${API_BASE}/income/export${params ? '?' + params : ''}`;
        },

        async create(data) {
            return api.request('/income', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return api.request(`/income/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return api.request(`/income/${id}`, {
                method: 'DELETE'
            });
        }
    }
};

// Make api available globally
window.api = api;
