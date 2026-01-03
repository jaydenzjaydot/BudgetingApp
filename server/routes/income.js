const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runQuery } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET all income entries with optional filters
router.get('/', (req, res) => {
    try {
        const { month, year, limit } = req.query;

        let query = `SELECT * FROM income WHERE 1=1`;
        const params = [];

        if (month && year) {
            query += ` AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`;
            params.push(month.padStart(2, '0'), year);
        } else if (year) {
            query += ` AND strftime('%Y', date) = ?`;
            params.push(year);
        }

        query += ` ORDER BY date DESC, created_at DESC`;

        if (limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(limit));
        }

        const income = queryAll(query, params);
        res.json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET income summary
router.get('/summary', (req, res) => {
    try {
        const { month, year } = req.query;
        const currentDate = new Date();
        const targetMonth = month || String(currentDate.getMonth() + 1).padStart(2, '0');
        const targetYear = year || String(currentDate.getFullYear());

        // Total income this month
        const totalThisMonth = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM income
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `, [targetMonth, targetYear]);

        // Total expenses this month
        const totalExpenses = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `, [targetMonth, targetYear]);

        // Income by source
        const bySource = queryAll(`
      SELECT 
        source,
        SUM(amount) as total,
        COUNT(*) as count
      FROM income
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
      GROUP BY source
      ORDER BY total DESC
    `, [targetMonth, targetYear]);

        // Last 6 months income trend
        const monthlyTrend = queryAll(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total
      FROM income
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

        const remaining = totalThisMonth.total - totalExpenses.total;

        res.json({
            totalIncome: totalThisMonth.total,
            totalExpenses: totalExpenses.total,
            remaining: remaining,
            savingsRate: totalThisMonth.total > 0
                ? ((remaining / totalThisMonth.total) * 100).toFixed(1)
                : 0,
            bySource,
            monthlyTrend,
            month: targetMonth,
            year: targetYear
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create income
router.post('/', (req, res) => {
    try {
        const { amount, source, description, date, is_recurring } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        if (!source) {
            return res.status(400).json({ error: 'Source is required' });
        }
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        const id = uuidv4();
        runQuery(
            'INSERT INTO income (id, amount, source, description, date, is_recurring) VALUES (?, ?, ?, ?, ?, ?)',
            [id, amount, source, description || '', date, is_recurring ? 1 : 0]
        );

        const income = queryOne('SELECT * FROM income WHERE id = ?', [id]);
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update income
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { amount, source, description, date, is_recurring } = req.body;

        const existing = queryOne('SELECT * FROM income WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Income not found' });
        }

        runQuery(
            'UPDATE income SET amount = ?, source = ?, description = ?, date = ?, is_recurring = ? WHERE id = ?',
            [
                amount ?? existing.amount,
                source ?? existing.source,
                description ?? existing.description,
                date || existing.date,
                is_recurring !== undefined ? (is_recurring ? 1 : 0) : existing.is_recurring,
                id
            ]
        );

        const income = queryOne('SELECT * FROM income WHERE id = ?', [id]);
        res.json(income);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE income
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM income WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Income not found' });
        }

        res.json({ message: 'Income deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
