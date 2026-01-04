/**
 * Main Application Logic for Home Dashboard
 */

// ==================== State ====================
const state = {
    categories: [],
    expenses: [],
    income: [],
    incomeSummary: null,
    summary: null,
    budgetStatus: null,
    currentView: 'dashboard',
    editingExpenseId: null,
    editingIncomeId: null,
    filters: {
        expenses: {
            category_id: null,
            category_name: null
        },
        income: {
            source: null
        }
    }
};

// ==================== DOM Elements ====================
const elements = {
    // Views
    views: document.querySelectorAll('.view'),
    navItems: document.querySelectorAll('.nav-item'),

    // Theme
    themeToggle: document.getElementById('themeToggle'),

    // Modals
    expenseModal: document.getElementById('expenseModal'),
    budgetModal: document.getElementById('budgetModal'),
    categoryModal: document.getElementById('categoryModal'),

    // Forms
    expenseForm: document.getElementById('expenseForm'),
    budgetForm: document.getElementById('budgetForm'),
    categoryForm: document.getElementById('categoryForm'),
    incomeForm: document.getElementById('incomeForm'),

    // Stats
    totalSpent: document.getElementById('totalSpent'),
    totalIncome: document.getElementById('totalIncome'),
    remainingBalance: document.getElementById('remainingBalance'),
    topCategory: document.getElementById('topCategory'),
    spendingChange: document.getElementById('spendingChange'),
    incomeChange: document.getElementById('incomeChange'),
    balanceStatus: document.getElementById('balanceStatus'),

    // Lists
    recentExpenses: document.getElementById('recentExpenses'),
    allExpenses: document.getElementById('allExpenses'),
    budgetList: document.getElementById('budgetList'),
    categoryList: document.getElementById('categoryList'),
    incomeList: document.getElementById('incomeList'),

    // Budget stats
    totalBudget: document.getElementById('totalBudget'),
    totalSpentBudget: document.getElementById('totalSpentBudget'),
    remainingBudget: document.getElementById('remainingBudget'),

    // Income view stats
    totalIncomeView: document.getElementById('totalIncomeView'),
    totalExpensesView: document.getElementById('totalExpensesView'),
    netBalanceView: document.getElementById('netBalanceView'),

    // Modals
    expenseModal: document.getElementById('expenseModal'),
    budgetModal: document.getElementById('budgetModal'),
    categoryModal: document.getElementById('categoryModal'),
    incomeModal: document.getElementById('incomeModal'),

    // Mobile
    sidebar: document.getElementById('sidebar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),

    // Export & Filter
    exportExpensesBtn: document.getElementById('exportExpensesBtn'),
    exportIncomeBtn: document.getElementById('exportIncomeBtn'),
    activeExpenseFilter: document.getElementById('activeExpenseFilter'),
    expenseFilterLabel: document.getElementById('expenseFilterLabel'),
    clearExpenseFilter: document.getElementById('clearExpenseFilter'),
    activeIncomeFilter: document.getElementById('activeIncomeFilter'),
    incomeFilterLabel: document.getElementById('incomeFilterLabel'),
    clearIncomeFilter: document.getElementById('clearIncomeFilter')
};

// ==================== Utilities ====================
function formatCurrency(amount) {
    return `R${parseFloat(amount || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: String(now.getMonth() + 1).padStart(2, '0'),
        year: String(now.getFullYear())
    };
}

function showToast(message, type = 'success') {
    // Simple toast notification (could be enhanced)
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ==================== Theme Management ====================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    charts.refreshTheme();
}

// ==================== View Management ====================
function switchView(viewName, clearFilters = false) {
    if (clearFilters) {
        if (viewName === 'expenses') {
            state.filters.expenses.category_id = null;
            state.filters.expenses.category_name = null;
        } else if (viewName === 'income') {
            state.filters.income.source = null;
        }
    }

    state.currentView = viewName;

    // Update nav active state
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Show/hide views
    elements.views.forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}View`);
    });

    // Close mobile menu
    elements.sidebar.classList.remove('open');

    // Refresh view data
    switch (viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'expenses':
            loadExpenses();
            break;
        case 'income':
            loadIncome();
            break;
        case 'budgets':
            loadBudgets();
            break;
        case 'categories':
            loadCategories();
            break;
    }
}

// ==================== Data Loading ====================
async function loadCategories() {
    try {
        state.categories = await api.categories.getAll();
        renderCategories();
        populateCategorySelects();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadExpenses() {
    try {
        const { month, year } = getCurrentMonthYear();
        const params = { month, year };

        if (state.filters.expenses.category_id) {
            params.category_id = state.filters.expenses.category_id;
        }

        state.expenses = await api.expenses.getAll(params);
        renderExpenses();
        updateFilterUI();
    } catch (error) {
        console.error('Failed to load expenses:', error);
    }
}

async function loadDashboard() {
    try {
        const { month, year } = getCurrentMonthYear();

        // Load expense summary
        state.summary = await api.expenses.getSummary(month, year);

        // Load income summary
        state.incomeSummary = await api.income.getSummary(month, year);

        // Load budget status
        state.budgetStatus = await api.budgets.getStatus(month, year);

        // Load recent expenses
        const recentExpenses = await api.expenses.getAll({ limit: 5 });

        // Update UI
        updateDashboardStats();
        renderRecentExpenses(recentExpenses);

        // Update charts
        charts.updateCategoryChart(state.summary.byCategory);
        charts.updateTrendChart(state.summary.monthlyTrend);

        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent =
            `${monthNames[parseInt(month) - 1]} ${year}`;
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

async function loadIncome() {
    try {
        const { month, year } = getCurrentMonthYear();
        const params = { month, year };

        if (state.filters.income.source) {
            params.source = state.filters.income.source;
        }

        state.income = await api.income.getAll(params);
        state.incomeSummary = await api.income.getSummary(month, year);
        renderIncome();
        updateFilterUI();

        // Update income view stats
        if (elements.totalIncomeView) {
            elements.totalIncomeView.textContent = formatCurrency(state.incomeSummary.totalIncome);
        }
        if (elements.totalExpensesView) {
            elements.totalExpensesView.textContent = formatCurrency(state.incomeSummary.totalExpenses);
        }
        if (elements.netBalanceView) {
            elements.netBalanceView.textContent = formatCurrency(state.incomeSummary.remaining);
        }
    } catch (error) {
        console.error('Failed to load income:', error);
    }
}

async function loadBudgets() {
    try {
        const { month, year } = getCurrentMonthYear();
        state.budgetStatus = await api.budgets.getStatus(month, year);
        renderBudgets();

        // Update budget stats
        elements.totalBudget.textContent = formatCurrency(state.budgetStatus.totalBudget);
        elements.totalSpentBudget.textContent = formatCurrency(state.budgetStatus.totalSpent);
        elements.remainingBudget.textContent = formatCurrency(state.budgetStatus.totalRemaining);
    } catch (error) {
        console.error('Failed to load budgets:', error);
    }
}

// ==================== Dashboard Stats ====================
function updateDashboardStats() {
    const { summary, incomeSummary } = state;

    // Total spent
    elements.totalSpent.textContent = formatCurrency(summary.totalThisMonth);

    // Total income
    if (elements.totalIncome && incomeSummary) {
        elements.totalIncome.textContent = formatCurrency(incomeSummary.totalIncome);
    }

    // Remaining balance (Income - Expenses)
    if (elements.remainingBalance && incomeSummary) {
        const remaining = incomeSummary.remaining;
        elements.remainingBalance.textContent = formatCurrency(remaining);

        // Update balance status
        if (elements.balanceStatus) {
            if (remaining >= 0) {
                elements.balanceStatus.className = 'stat-change positive';
                elements.balanceStatus.innerHTML = `<span>✓</span> Income - Expenses`;
            } else {
                elements.balanceStatus.className = 'stat-change negative';
                elements.balanceStatus.innerHTML = `<span>⚠️</span> Over budget!`;
            }
        }
    }

    // Savings rate
    if (elements.incomeChange && incomeSummary) {
        const savingsRate = parseFloat(incomeSummary.savingsRate) || 0;
        if (savingsRate >= 20) {
            elements.incomeChange.className = 'stat-change positive';
            elements.incomeChange.innerHTML = `<span>💰</span> <span>${savingsRate}%</span> savings rate`;
        } else if (savingsRate >= 0) {
            elements.incomeChange.className = 'stat-change';
            elements.incomeChange.innerHTML = `<span>💰</span> <span>${savingsRate}%</span> savings rate`;
        } else {
            elements.incomeChange.className = 'stat-change negative';
            elements.incomeChange.innerHTML = `<span>⚠️</span> <span>${Math.abs(savingsRate)}%</span> overspent`;
        }
    }

    // Top category
    const topCategory = summary.byCategory.find(c => c.total > 0);
    elements.topCategory.textContent = topCategory ? `${topCategory.icon} ${topCategory.name}` : '-';

    // Spending change
    const changeEl = elements.spendingChange;
    const change = summary.percentChange;
    if (change > 0) {
        changeEl.className = 'stat-change negative';
        changeEl.innerHTML = `<span>↗</span> <span>${change}%</span> vs last month`;
    } else if (change < 0) {
        changeEl.className = 'stat-change positive';
        changeEl.innerHTML = `<span>↘</span> <span>${Math.abs(change)}%</span> vs last month`;
    } else {
        changeEl.className = 'stat-change';
        changeEl.innerHTML = `<span>→</span> <span>No change</span> vs last month`;
    }
}

// ==================== Filtering & Export ====================
function updateFilterUI() {
    // Expense filter
    if (state.filters.expenses.category_id) {
        elements.activeExpenseFilter.style.display = 'flex';
        elements.expenseFilterLabel.textContent = state.filters.expenses.category_name;
    } else {
        elements.activeExpenseFilter.style.display = 'none';
    }

    // Income filter
    if (state.filters.income.source) {
        elements.activeIncomeFilter.style.display = 'flex';
        elements.incomeFilterLabel.textContent = state.filters.income.source;
    } else {
        elements.activeIncomeFilter.style.display = 'none';
    }
}

function applyExpenseFilter(categoryId, categoryName) {
    state.filters.expenses.category_id = categoryId;
    state.filters.expenses.category_name = categoryName;
    switchView('expenses');
}

function applyIncomeFilter(source) {
    state.filters.income.source = source;
    switchView('income');
}

function clearExpenseFilter() {
    state.filters.expenses.category_id = null;
    state.filters.expenses.category_name = null;
    loadExpenses();
}

function clearIncomeFilter() {
    state.filters.income.source = null;
    loadIncome();
}

function exportData(type) {
    const { month, year } = getCurrentMonthYear();
    let url = '';

    if (type === 'expenses') {
        const filters = { month, year };
        if (state.filters.expenses.category_id) filters.category_id = state.filters.expenses.category_id;
        url = api.expenses.getExportUrl(filters);
    } else {
        const filters = { month, year };
        if (state.filters.income.source) filters.source = state.filters.income.source;
        url = api.income.getExportUrl(filters);
    }

    window.location.href = url;
}
function renderRecentExpenses(expenses) {
    if (!expenses || expenses.length === 0) {
        elements.recentExpenses.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p class="empty-state-text">No expenses yet. Add your first expense!</p>
      </div>
    `;
        return;
    }

    elements.recentExpenses.innerHTML = expenses.map(expense => `
    <div class="expense-item" data-id="${expense.id}">
      <div class="expense-icon" style="background: ${expense.category_color}20;">
        ${expense.category_icon || '📁'}
      </div>
      <div class="expense-details">
        <div class="expense-name">${expense.description || 'No description'}</div>
        <div class="expense-category">${expense.category_name || 'Uncategorized'}</div>
      </div>
      <div>
        <div class="expense-amount">-${formatCurrency(expense.amount)}</div>
        <div class="expense-date">${formatDate(expense.date)}</div>
      </div>
    </div>
  `).join('');
}

function renderExpenses() {
    if (!state.expenses || state.expenses.length === 0) {
        elements.allExpenses.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p class="empty-state-text">No expenses this month. Add your first expense!</p>
      </div>
    `;
        return;
    }

    elements.allExpenses.innerHTML = state.expenses.map(expense => `
    <div class="expense-item" data-id="${expense.id}">
      <div class="expense-icon" style="background: ${expense.category_color}20;">
        ${expense.category_icon || '📁'}
      </div>
      <div class="expense-details">
        <div class="expense-name">${expense.description || 'No description'}</div>
        <div class="expense-category">${expense.category_name || 'Uncategorized'}</div>
      </div>
      <div>
        <div class="expense-amount">-${formatCurrency(expense.amount)}</div>
        <div class="expense-date">${formatDate(expense.date)}</div>
      </div>
      <div class="expense-actions">
        <button class="btn btn-icon btn-secondary edit-expense" data-id="${expense.id}">✏️</button>
        <button class="btn btn-icon btn-danger delete-expense" data-id="${expense.id}">🗑️</button>
      </div>
    </div>
  `).join('');

    // Add event listeners for edit/delete
    elements.allExpenses.querySelectorAll('.edit-expense').forEach(btn => {
        btn.addEventListener('click', () => editExpense(btn.dataset.id));
    });

    elements.allExpenses.querySelectorAll('.delete-expense').forEach(btn => {
        btn.addEventListener('click', () => deleteExpense(btn.dataset.id));
    });
}

function renderBudgets() {
    if (!state.budgetStatus || state.budgetStatus.categories.length === 0) {
        elements.budgetList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <p class="empty-state-text">No budgets set. Set your first budget!</p>
      </div>
    `;
        return;
    }

    elements.budgetList.innerHTML = state.budgetStatus.categories.map(budget => {
        const percent = budget.budget_amount > 0 ? budget.percent_used : 0;
        let progressClass = 'safe';
        if (percent > 100) progressClass = 'danger';
        else if (percent > 75) progressClass = 'warning';

        return `
      <div class="budget-item">
        <div class="budget-header">
          <span class="budget-label">
            <span>${budget.category_icon}</span>
            <span>${budget.category_name}</span>
          </span>
          <span class="budget-values">
            ${formatCurrency(budget.spent_amount)} / ${formatCurrency(budget.budget_amount)}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${progressClass}" style="width: ${Math.min(percent, 100)}%"></div>
        </div>
      </div>
    `;
    }).join('');
}

function renderCategories() {
    if (!state.categories || state.categories.length === 0) {
        elements.categoryList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <p class="empty-state-text">No categories yet.</p>
      </div>
    `;
        return;
    }

    elements.categoryList.innerHTML = state.categories.map(category => `
    <div class="expense-item" data-id="${category.id}">
      <div class="expense-icon" style="background: ${category.color}20;">
        ${category.icon}
      </div>
      <div class="expense-details">
        <div class="expense-name">${category.name}</div>
        <div class="expense-category">${category.expense_count || 0} expenses · ${formatCurrency(category.total_spent)}</div>
      </div>
      <div class="expense-actions" style="opacity: 1;">
        <button class="btn btn-icon btn-danger delete-category" data-id="${category.id}">🗑️</button>
      </div>
    </div>
  `).join('');

    // Add delete listeners
    elements.categoryList.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
    });

    // Update sidebar if we are in expenses/dashboard
    renderSidebarFilters();
}

function renderSidebarFilters() {
    const expenseNav = document.querySelector('.nav-item[data-view="expenses"]');
    const incomeNav = document.querySelector('.nav-item[data-view="income"]');

    if (expenseNav) {
        // Clear existing sub-items
        const existingSub = expenseNav.querySelector('.sub-menu');
        if (existingSub) existingSub.remove();

        const subMenu = document.createElement('ul');
        subMenu.className = 'sub-menu';

        state.categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'sub-nav-item';
            li.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                applyExpenseFilter(cat.id, cat.name);
            });
            subMenu.appendChild(li);
        });
        expenseNav.appendChild(subMenu);
    }

    if (incomeNav) {
        const existingSub = incomeNav.querySelector('.sub-menu');
        if (existingSub) existingSub.remove();

        const subMenu = document.createElement('ul');
        subMenu.className = 'sub-menu';

        const sources = ['Salary', 'Freelance', 'Investments', 'Rental', 'Business', 'Bonus', 'Other'];
        const sourceIcons = {
            'Salary': '💼', 'Freelance': '💻', 'Investments': '📈',
            'Rental': '🏠', 'Business': '🏢', 'Bonus': '🎁', 'Other': '📦'
        };

        sources.forEach(source => {
            const li = document.createElement('li');
            li.className = 'sub-nav-item';
            li.innerHTML = `<span>${sourceIcons[source]}</span> <span>${source}</span>`;
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                applyIncomeFilter(source);
            });
            subMenu.appendChild(li);
        });
        incomeNav.appendChild(subMenu);
    }
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('expenseCategory'),
        document.getElementById('budgetCategory')
    ];

    selects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a category</option>';
        state.categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
        select.value = currentValue;
    });
}

// ==================== Income Rendering ====================
function renderIncome() {
    const incomeList = elements.incomeList;
    if (!incomeList) return;

    if (!state.income || state.income.length === 0) {
        incomeList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💵</div>
        <p class="empty-state-text">No income recorded yet. Add your first income!</p>
      </div>
    `;
        return;
    }

    const sourceIcons = {
        'Salary': '💼',
        'Freelance': '💻',
        'Investments': '📈',
        'Rental': '🏠',
        'Business': '🏢',
        'Bonus': '🎁',
        'Other': '📦'
    };

    incomeList.innerHTML = state.income.map(income => `
    <div class="expense-item" data-id="${income.id}">
      <div class="expense-icon" style="background: rgba(16, 185, 129, 0.15);">
        ${sourceIcons[income.source] || '💵'}
      </div>
      <div class="expense-details">
        <div class="expense-name">${income.description || income.source}</div>
        <div class="expense-category">${income.source}${income.is_recurring ? ' • Recurring' : ''}</div>
      </div>
      <div>
        <div class="expense-amount" style="color: var(--success);">+${formatCurrency(income.amount)}</div>
        <div class="expense-date">${formatDate(income.date)}</div>
      </div>
      <div class="expense-actions">
        <button class="btn btn-icon btn-secondary edit-income" data-id="${income.id}">✏️</button>
        <button class="btn btn-icon btn-danger delete-income" data-id="${income.id}">🗑️</button>
      </div>
    </div>
  `).join('');

    // Add event listeners for edit/delete
    incomeList.querySelectorAll('.edit-income').forEach(btn => {
        btn.addEventListener('click', () => editIncome(btn.dataset.id));
    });

    incomeList.querySelectorAll('.delete-income').forEach(btn => {
        btn.addEventListener('click', () => deleteIncome(btn.dataset.id));
    });
}

// ==================== Modal Management ====================
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openExpenseModal(expense = null) {
    const modal = elements.expenseModal;
    const titleEl = document.getElementById('expenseModalTitle');
    const form = elements.expenseForm;

    if (expense) {
        titleEl.textContent = 'Edit Expense';
        document.getElementById('expenseId').value = expense.id;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseCategory').value = expense.category_id || '';
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseDate').value = expense.date;
        state.editingExpenseId = expense.id;
    } else {
        titleEl.textContent = 'Add Expense';
        form.reset();
        document.getElementById('expenseId').value = '';
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        state.editingExpenseId = null;
    }

    openModal(modal);
}

function openIncomeModal(income = null) {
    const modal = elements.incomeModal;
    if (!modal) return;

    const titleEl = document.getElementById('incomeModalTitle');
    const form = elements.incomeForm;

    if (income) {
        titleEl.textContent = 'Edit Income';
        document.getElementById('incomeId').value = income.id;
        document.getElementById('incomeAmount').value = income.amount;
        document.getElementById('incomeSource').value = income.source || '';
        document.getElementById('incomeDescription').value = income.description || '';
        document.getElementById('incomeDate').value = income.date;
        document.getElementById('incomeRecurring').checked = income.is_recurring === 1;
        state.editingIncomeId = income.id;
    } else {
        titleEl.textContent = 'Add Income';
        form.reset();
        document.getElementById('incomeId').value = '';
        document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
        state.editingIncomeId = null;
    }

    openModal(modal);
}

// ==================== CRUD Operations ====================
async function saveExpense(e) {
    e.preventDefault();

    const data = {
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category_id: document.getElementById('expenseCategory').value || null,
        description: document.getElementById('expenseDescription').value,
        date: document.getElementById('expenseDate').value
    };

    try {
        if (state.editingExpenseId) {
            await api.expenses.update(state.editingExpenseId, data);
            showToast('Expense updated successfully');
        } else {
            await api.expenses.create(data);
            showToast('Expense added successfully');
        }

        closeModal(elements.expenseModal);
        elements.expenseForm.reset();

        // Refresh data
        if (state.currentView === 'dashboard') {
            loadDashboard();
        } else {
            loadExpenses();
        }
    } catch (error) {
        showToast('Failed to save expense', 'error');
    }
}

function editExpense(id) {
    const expense = state.expenses.find(e => e.id === id);
    if (expense) {
        openExpenseModal(expense);
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        await api.expenses.delete(id);
        showToast('Expense deleted');
        loadExpenses();
    } catch (error) {
        showToast('Failed to delete expense', 'error');
    }
}

async function saveBudget(e) {
    e.preventDefault();

    const data = {
        category_id: document.getElementById('budgetCategory').value,
        amount: parseFloat(document.getElementById('budgetAmount').value)
    };

    try {
        await api.budgets.set(data);
        showToast('Budget set successfully');
        closeModal(elements.budgetModal);
        elements.budgetForm.reset();
        loadBudgets();
    } catch (error) {
        showToast('Failed to set budget', 'error');
    }
}

async function saveCategory(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value || '📁',
        color: document.getElementById('categoryColor').value
    };

    try {
        await api.categories.create(data);
        showToast('Category added successfully');
        closeModal(elements.categoryModal);
        elements.categoryForm.reset();
        loadCategories();
    } catch (error) {
        showToast('Failed to add category', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category? Expenses will become uncategorized.')) return;

    try {
        await api.categories.delete(id);
        showToast('Category deleted');
        loadCategories();
    } catch (error) {
        showToast('Failed to delete category', 'error');
    }
}

// ==================== Income CRUD Operations ====================
async function saveIncome(e) {
    e.preventDefault();

    const data = {
        amount: parseFloat(document.getElementById('incomeAmount').value),
        source: document.getElementById('incomeSource').value,
        description: document.getElementById('incomeDescription').value,
        date: document.getElementById('incomeDate').value,
        is_recurring: document.getElementById('incomeRecurring').checked
    };

    try {
        if (state.editingIncomeId) {
            await api.income.update(state.editingIncomeId, data);
            showToast('Income updated successfully');
        } else {
            await api.income.create(data);
            showToast('Income added successfully');
        }

        closeModal(elements.incomeModal);
        elements.incomeForm.reset();

        // Refresh data
        if (state.currentView === 'dashboard') {
            loadDashboard();
        } else if (state.currentView === 'income') {
            loadIncome();
        }
    } catch (error) {
        showToast('Failed to save income', 'error');
    }
}

function editIncome(id) {
    const income = state.income.find(i => i.id === id);
    if (income) {
        openIncomeModal(income);
    }
}

async function deleteIncome(id) {
    if (!confirm('Are you sure you want to delete this income entry?')) return;

    try {
        await api.income.delete(id);
        showToast('Income deleted');
        loadIncome();
    } catch (error) {
        showToast('Failed to delete income', 'error');
    }
}

// ==================== Event Listeners ====================
function initEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Navigation
    elements.navItems.forEach(item => {
        const header = item.querySelector('.nav-item-header');
        if (header) {
            header.addEventListener('click', () => switchView(item.dataset.view, true));
        } else {
            item.addEventListener('click', () => switchView(item.dataset.view, true));
        }
    });

    // View all button
    document.querySelectorAll('[data-view="expenses"]').forEach(btn => {
        btn.addEventListener('click', () => switchView('expenses'));
    });

    // Add expense buttons
    document.getElementById('addExpenseBtn').addEventListener('click', () => openExpenseModal());
    document.getElementById('addExpenseBtn2').addEventListener('click', () => openExpenseModal());

    // Add income buttons
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addIncomeBtn2 = document.getElementById('addIncomeBtn2');
    if (addIncomeBtn) addIncomeBtn.addEventListener('click', () => openIncomeModal());
    if (addIncomeBtn2) addIncomeBtn2.addEventListener('click', () => openIncomeModal());

    // Set budget button
    document.getElementById('setBudgetBtn').addEventListener('click', () => openModal(elements.budgetModal));

    // Add category button
    document.getElementById('addCategoryBtn').addEventListener('click', () => openModal(elements.categoryModal));

    // Close modal buttons
    document.getElementById('closeExpenseModal').addEventListener('click', () => closeModal(elements.expenseModal));
    document.getElementById('closeBudgetModal').addEventListener('click', () => closeModal(elements.budgetModal));
    document.getElementById('closeCategoryModal').addEventListener('click', () => closeModal(elements.categoryModal));
    const closeIncomeModal = document.getElementById('closeIncomeModal');
    if (closeIncomeModal) closeIncomeModal.addEventListener('click', () => closeModal(elements.incomeModal));

    // Export buttons
    if (elements.exportExpensesBtn) {
        elements.exportExpensesBtn.addEventListener('click', () => exportData('expenses'));
    }
    if (elements.exportIncomeBtn) {
        elements.exportIncomeBtn.addEventListener('click', () => exportData('income'));
    }

    // Clear filter buttons
    if (elements.clearExpenseFilter) {
        elements.clearExpenseFilter.addEventListener('click', clearExpenseFilter);
    }
    if (elements.clearIncomeFilter) {
        elements.clearIncomeFilter.addEventListener('click', clearIncomeFilter);
    }

    // Close modal on overlay click
    [elements.expenseModal, elements.budgetModal, elements.categoryModal, elements.incomeModal].filter(Boolean).forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Form submissions
    elements.expenseForm.addEventListener('submit', saveExpense);
    elements.budgetForm.addEventListener('submit', saveBudget);
    elements.categoryForm.addEventListener('submit', saveCategory);
    if (elements.incomeForm) elements.incomeForm.addEventListener('submit', saveIncome);

    // Mobile menu
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.sidebar.classList.toggle('open');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(elements.expenseModal);
            closeModal(elements.budgetModal);
            closeModal(elements.categoryModal);
            if (elements.incomeModal) closeModal(elements.incomeModal);
        }
    });
}

// ==================== Initialize App ====================
async function init() {
    console.log('🏠 Home Dashboard initializing...');

    // Set theme
    initTheme();

    // Set up event listeners
    initEventListeners();

    // Load initial data
    await loadCategories();
    await loadDashboard();

    console.log('✅ Home Dashboard ready!');
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
