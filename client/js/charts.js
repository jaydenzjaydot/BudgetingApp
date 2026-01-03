/**
 * Chart Management for Home Dashboard
 * Handles Chart.js visualizations
 */

const charts = {
    categoryChart: null,
    trendChart: null,

    /**
     * Get chart colors based on current theme
     */
    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            text: isDark ? '#cbd5e0' : '#4a5568',
            grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            background: isDark ? '#1a1a2e' : '#ffffff'
        };
    },

    /**
     * Initialize or update category pie chart
     */
    updateCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const themeColors = this.getThemeColors();

        // Filter categories with spending
        const categoriesWithSpending = data.filter(c => c.total > 0);

        if (categoriesWithSpending.length === 0) {
            // Show empty state
            if (this.categoryChart) {
                this.categoryChart.destroy();
                this.categoryChart = null;
            }
            return;
        }

        const chartData = {
            labels: categoriesWithSpending.map(c => `${c.icon} ${c.name}`),
            datasets: [{
                data: categoriesWithSpending.map(c => c.total),
                backgroundColor: categoriesWithSpending.map(c => c.color),
                borderColor: themeColors.background,
                borderWidth: 3,
                hoverOffset: 10
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: themeColors.text,
                        padding: 15,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background,
                    titleColor: themeColors.text,
                    bodyColor: themeColors.text,
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return ` R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateRotate: true,
                animateScale: true
            }
        };

        if (this.categoryChart) {
            this.categoryChart.data = chartData;
            this.categoryChart.options = options;
            this.categoryChart.update('active');
        } else {
            this.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: options
            });
        }
    },

    /**
     * Initialize or update trend line chart
     */
    updateTrendChart(data) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        const themeColors = this.getThemeColors();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Format month labels
        const labels = data.map(d => {
            const [year, month] = d.month.split('-');
            const date = new Date(year, parseInt(month) - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        });

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data.map(d => d.total),
                borderColor: '#6366f1',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(99, 102, 241, 0.1)';

                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: themeColors.background,
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: themeColors.background,
                    titleColor: themeColors.text,
                    bodyColor: themeColors.text,
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: (context) => {
                            return ` R${context.raw.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: themeColors.text,
                        font: {
                            family: "'Inter', sans-serif"
                        }
                    }
                },
                y: {
                    grid: {
                        color: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text,
                        font: {
                            family: "'Inter', sans-serif"
                        },
                        callback: (value) => `R${value.toLocaleString()}`
                    },
                    beginAtZero: true
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        };

        if (this.trendChart) {
            this.trendChart.data = chartData;
            this.trendChart.options = options;
            this.trendChart.update('active');
        } else {
            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: options
            });
        }
    },

    /**
     * Update all charts with theme colors
     */
    refreshTheme() {
        if (this.categoryChart) {
            const themeColors = this.getThemeColors();
            this.categoryChart.options.plugins.legend.labels.color = themeColors.text;
            this.categoryChart.data.datasets[0].borderColor = themeColors.background;
            this.categoryChart.update('none');
        }
        if (this.trendChart) {
            const themeColors = this.getThemeColors();
            this.trendChart.options.scales.x.ticks.color = themeColors.text;
            this.trendChart.options.scales.y.ticks.color = themeColors.text;
            this.trendChart.options.scales.y.grid.color = themeColors.grid;
            this.trendChart.data.datasets[0].pointBorderColor = themeColors.background;
            this.trendChart.update('none');
        }
    },

    /**
     * Destroy all charts
     */
    destroy() {
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
    }
};

// Make charts available globally
window.charts = charts;
