# 🏠 Home Bills Dashboard

A beautiful, functional, and privacy-focused dashboard for tracking household expenses and income. Built with Vanilla JS, CSS, and Node.js.

![Dashboard Preview](client/assets/preview.png) *(Placeholder for preview)*

## ✨ Features

- **📊 Comprehensive Dashboard**: View total spent, total income, and remaining balance at a glance.
- **💳 Expense Tracking**: Easy manual entry of daily expenses with categories.
- **💵 Income Management**: Track salary, freelance, and other income sources.
- **🎯 Budgeting**: Set monthly budgets per category and track progress.
- **📁 Custom Categories**: Add your own categories with unique icons and colors.
- **🎨 Modern Design**: Sleek glassmorphism aesthetic with Dark & Light mode support.
- **📱 Fully Responsive**: Works perfectly on Desktop, Tablet, and Mobile.
- **🔒 Privacy First**: All data is stored locally in a SQLite database.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Chart.js
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `sql.js`)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd home-dashboard
   ```

2. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open the app**:
   Navigate to `http://localhost:3000` in your browser.

## 📁 Project Structure

```text
home-dashboard/
├── client/             # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # Application logic & API client
│   └── index.html      # Main UI
├── server/             # Backend files
│   ├── db/             # Database initialization
│   ├── routes/         # API endpoints
│   └── index.js        # Server entry point
└── .gitignore          # Git exclusion rules
```

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
