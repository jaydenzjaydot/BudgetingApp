const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runQuery } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET all budgets for a month
router.get('/', (req, res) => {
    try {
        const currentDate = new Date();
        const { month = String(currentDate.getMonth() + 1).padStart(2, '0'),
            year = String(currentDate.getFullYear()) } = req.query;
        const monthKey = `${year}-${month}`;

        const budgets = queryAll(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.month = ?
      ORDER BY c.name
    `, [monthKey]);

        res.json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET budget status (budget vs actual)
router.get('/status', (req, res) => {
    try {
        const currentDate = new Date();
        const { month = String(currentDate.getMonth() + 1).padStart(2, '0'),
            year = String(currentDate.getFullYear()) } = req.query;
        const monthKey = `${year}-${month}`;

        const status = queryAll(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(b.amount, 0) as budget_amount,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        CASE 
          WHEN b.amount IS NULL OR b.amount = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(e.amount), 0) / b.amount) * 100, 1)
        END as percent_used
      FROM categories c
      LEFT JOIN budgets b ON c.id = b.category_id AND b.month = ?
      LEFT JOIN expenses e ON c.id = e.category_id 
        AND strftime('%m', e.date) = ? 
        AND strftime('%Y', e.date) = ?
      GROUP BY c.id
      ORDER BY percent_used DESC
    `, [monthKey, month, year]);

        // Calculate totals
        const totalBudget = status.reduce((sum, s) => sum + s.budget_amount, 0);
        const totalSpent = status.reduce((sum, s) => sum + s.spent_amount, 0);

        res.json({
            categories: status,
            totalBudget,
            totalSpent,
            totalRemaining: totalBudget - totalSpent,
            overallPercent: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0,
            month,
            year
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create or update budget
router.post('/', (req, res) => {
    try {
        const { category_id, amount, month, year } = req.body;

        if (!category_id) {
            return res.status(400).json({ error: 'Category ID is required' });
        }
        if (amount === undefined || amount < 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const currentDate = new Date();
        const targetMonth = month || String(currentDate.getMonth() + 1).padStart(2, '0');
        const targetYear = year || String(currentDate.getFullYear());
        const monthKey = `${targetYear}-${targetMonth}`;

        // Check if budget exists
        const existing = queryOne(
            'SELECT * FROM budgets WHERE category_id = ? AND month = ?',
            [category_id, monthKey]
        );

        if (existing) {
            // Update existing
            runQuery('UPDATE budgets SET amount = ? WHERE id = ?', [amount, existing.id]);
        } else {
            // Create new
            const id = uuidv4();
            runQuery(
                'INSERT INTO budgets (id, category_id, amount, month) VALUES (?, ?, ?, ?)',
                [id, category_id, amount, monthKey]
            );
        }

        const budget = queryOne(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.category_id = ? AND b.month = ?
    `, [category_id, monthKey]);

        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE budget
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM budgets WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
