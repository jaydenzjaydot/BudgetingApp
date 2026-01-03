const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runQuery } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET all expenses with optional filters
router.get('/', (req, res) => {
    try {
        const { month, year, category_id, limit } = req.query;

        let query = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
        const params = [];

        if (month && year) {
            query += ` AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?`;
            params.push(month.padStart(2, '0'), year);
        } else if (year) {
            query += ` AND strftime('%Y', e.date) = ?`;
            params.push(year);
        }

        if (category_id) {
            query += ` AND e.category_id = ?`;
            params.push(category_id);
        }

        query += ` ORDER BY e.date DESC, e.created_at DESC`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));
        }

        const expenses = queryAll(query, params);
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET expense summary/stats
router.get('/summary', (req, res) => {
    try {
        const { month, year } = req.query;
        const currentDate = new Date();
        const targetMonth = month || String(currentDate.getMonth() + 1).padStart(2, '0');
        const targetYear = year || String(currentDate.getFullYear());

        // Total spent this month
        const totalThisMonth = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `, [targetMonth, targetYear]);

        // By category breakdown
        const byCategory = queryAll(`
      SELECT 
        c.id, c.name, c.icon, c.color,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id 
        AND strftime('%m', e.date) = ? 
        AND strftime('%Y', e.date) = ?
      GROUP BY c.id
      ORDER BY total DESC
    `, [targetMonth, targetYear]);

        // Last 6 months trend
        const monthlyTrend = queryAll(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM expenses
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

        // Previous month comparison
        const prevMonth = new Date(targetYear, parseInt(targetMonth) - 2, 1);
        const prevMonthStr = String(prevMonth.getMonth() + 1).padStart(2, '0');
        const prevYearStr = String(prevMonth.getFullYear());

        const totalLastMonth = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `, [prevMonthStr, prevYearStr]);

        const percentChange = totalLastMonth.total > 0
            ? ((totalThisMonth.total - totalLastMonth.total) / totalLastMonth.total * 100).toFixed(1)
            : 0;

        res.json({
            totalThisMonth: totalThisMonth.total,
            totalLastMonth: totalLastMonth.total,
            percentChange: parseFloat(percentChange),
            byCategory,
            monthlyTrend,
            month: targetMonth,
            year: targetYear
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create expense
router.post('/', (req, res) => {
    try {
        const { amount, category_id, description, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const id = uuidv4();
        runQuery(
            'INSERT INTO expenses (id, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?)',
            [id, amount, category_id || null, description || '', date]
        );

        const expense = queryOne(`
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `, [id]);

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update expense
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category_id, description, date } = req.body;

        const existing = queryOne('SELECT * FROM expenses WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        runQuery(
            'UPDATE expenses SET amount = ?, category_id = ?, description = ?, date = ? WHERE id = ?',
            [
                amount ?? existing.amount,
                category_id !== undefined ? category_id : existing.category_id,
                description ?? existing.description,
                date || existing.date,
                id
            ]
        );

        const expense = queryOne(`
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
    `, [id]);

        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE expense
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM expenses WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
