const express = require('express');
const cors = require('cors');
const path = require('path');

// Import database initialization
const { initDatabase } = require('./db/database');

// Import routes
const categoriesRouter = require('./routes/categories');
const expensesRouter = require('./routes/expenses');
const budgetsRouter = require('./routes/budgets');
const incomeRouter = require('./routes/income');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/income', incomeRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Initialize database and start server
async function start() {
    try {
        await initDatabase();

        app.listen(PORT, () => {
            console.log(`
  🏠 Home Dashboard Server Running!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 Local:   http://localhost:${PORT}
  📊 API:     http://localhost:${PORT}/api
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
