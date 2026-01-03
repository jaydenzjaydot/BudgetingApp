# 🏠 Home Bills Dashboard

A beautiful, full-stack expense tracking dashboard for managing your home finances.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Home+Bills+Dashboard)

## Features

- 📊 **Beautiful Dashboard** - Glassmorphism design with dark/light mode
- 💳 **Expense Tracking** - Add, edit, and delete expenses
- 🎯 **Budget Management** - Set monthly budgets per category
- 📈 **Visual Analytics** - Pie charts, trend lines, and progress bars
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌙 **Theme Toggle** - Switch between dark and light modes

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript + Chart.js
- **Backend**: Node.js + Express
- **Database**: SQLite (file-based, no setup required)

## Quick Start

### Prerequisites

You need Node.js installed. Download from: https://nodejs.org/

### Installation

1. **Open a terminal in the project folder**:
   ```powershell
   cd C:\Users\Huawei\.gemini\antigravity\scratch\home-dashboard\server
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Start the server**:
   ```powershell
   npm start
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
home-dashboard/
├── client/                 # Frontend
│   ├── index.html          # Main HTML
│   ├── css/
│   │   ├── variables.css   # Design tokens & themes
│   │   └── main.css        # All styles
│   └── js/
│       ├── api.js          # API client
│       ├── charts.js       # Chart.js config
│       └── app.js          # Main application
├── server/                 # Backend
│   ├── index.js            # Express server
│   ├── db/
│   │   └── database.js     # SQLite setup
│   ├── routes/
│   │   ├── categories.js   # Category API
│   │   ├── expenses.js     # Expense API
│   │   └── budgets.js      # Budget API
│   └── package.json
└── README.md
```

## API Endpoints

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Expenses
- `GET /api/expenses` - List expenses (with filters)
- `GET /api/expenses/summary` - Get monthly summary
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Budgets
- `GET /api/budgets` - List budgets
- `GET /api/budgets/status` - Get budget vs actual
- `POST /api/budgets` - Set/update budget
- `DELETE /api/budgets/:id` - Delete budget

## Default Categories

The app comes pre-loaded with these categories:
- 💡 Utilities
- 📺 Subscriptions
- 🛒 Groceries
- 🏠 Rent/Mortgage
- 🚗 Transport
- 🎮 Entertainment
- 🏥 Healthcare
- 📦 Other

## License

MIT
