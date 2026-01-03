const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runQuery } = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET all categories
router.get('/', (req, res) => {
    try {
        const categories = queryAll(`
      SELECT c.*, 
             COALESCE(SUM(e.amount), 0) as total_spent,
             COUNT(e.id) as expense_count
      FROM categories c
      LEFT JOIN expenses e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create category
router.post('/', (req, res) => {
    try {
        const { name, icon, color } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const id = uuidv4();
        runQuery(
            'INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)',
            [id, name, icon || '📁', color || '#6366f1']
        );

        const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
        res.status(201).json(category);
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT update category
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, color } = req.body;

        const existing = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Category not found' });
        }

        runQuery(
            'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
            [name || existing.name, icon || existing.icon, color || existing.color, id]
        );

        const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE category
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM categories WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
