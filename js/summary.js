/**
 * Game Time Tracker - Summary Page
 * Handles data visualization and statistics for the summary page
 */

class SummaryPage {
    constructor() {
        // DOM elements
        this.statsContent = document.getElementById('stats-content');
        
        // Chart
        this.chart = null;
        
        // Initialize
        this.initChart();
        this.loadData();
    }
    
    /**
     * Initialize chart
     */
    initChart() {
        const ctx = document.getElementById('daily-chart').getContext('2d');
        
        // Dark theme chart colors
        Chart.defaults.color = '#e0e0e0';
        Chart.defaults.borderColor = '#333';
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#b0b0b0'
                        },
                        grid: {
                            color: 'rgba(70, 70, 70, 0.3)'
                        },
                        ticks: {
                            color: '#b0b0b0'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Minutes',
                            color: '#b0b0b0'
                        },
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(70, 70, 70, 0.3)'
                        },
                        ticks: {
                            color: '#b0b0b0'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Gaming Time',
                        color: '#e0e0e0',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#e0e0e0',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 30, 0.9)',
                        titleColor: '#7289da',
                        bodyColor: '#e0e0e0',
                        borderColor: '#444',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true
                    }
                }
            }
        });
    }
    
    /**
     * Load data from database
     */
    loadData() {
        sqliteHandler.loadFromDatabase()
            .then(sessions => {
                if (sessions && sessions.length > 0) {
                    // Update the display with the loaded sessions
                    this.updateStatsDisplay(sessions);
                    this.updateChart(sessions);
                    
                    // Save to localStorage so it's available when returning to the main page
                    localStorage.setItem('gameSessions', JSON.stringify(sessions));
                    console.log('Sessions saved to localStorage for persistence across pages');
                }
            })
            .catch(error => {
                console.error('Failed to load data:', error);
                this.statsContent.innerHTML = '<p>Error loading data. Please try again later.</p>';
                
                // Try to use localStorage data if available
                const localSessions = JSON.parse(localStorage.getItem('gameSessions'));
                if (localSessions && localSessions.length > 0) {
                    this.updateStatsDisplay(localSessions);
                    this.updateChart(localSessions);
                    console.log('Using localStorage data as fallback');
                }
            });
    }
    
    /**
     * Update chart with session data
     * @param {Array} sessions - Array of game session objects
     */
    updateChart(sessions) {
        if (sessions.length === 0) {
            // No data to display
            this.chart.data = {
                labels: [],
                datasets: []
            };
            this.chart.update();
            return;
        }
        
        // Prepare data for chart
        const chartData = sqliteHandler.prepareDailyTrendData(sessions);
        
        // Apply dark theme colors to datasets
        const darkThemeColors = [
            'rgba(114, 137, 218, 0.8)',  // accent color (purple-blue)
            'rgba(67, 181, 129, 0.8)',   // success color (green)
            'rgba(240, 71, 71, 0.8)',    // danger color (red)
            'rgba(250, 166, 26, 0.8)',   // warning color (orange)
            'rgba(114, 224, 235, 0.8)',  // light blue
            'rgba(190, 130, 255, 0.8)'   // light purple
        ];
        
        const darkThemeBorders = [
            'rgb(114, 137, 218)',
            'rgb(67, 181, 129)',
            'rgb(240, 71, 71)',
            'rgb(250, 166, 26)',
            'rgb(114, 224, 235)',
            'rgb(190, 130, 255)'
        ];
        
        // Apply colors to datasets
        chartData.datasets.forEach((dataset, index) => {
            const colorIndex = index % darkThemeColors.length;
            dataset.backgroundColor = darkThemeColors[colorIndex];
            dataset.borderColor = darkThemeBorders[colorIndex];
            dataset.borderWidth = 2;
            dataset.borderRadius = 6;
            dataset.hoverBackgroundColor = darkThemeBorders[colorIndex];
        });
        
        // Update chart
        this.chart.data = chartData;
        this.chart.update();
    }
    
    /**
     * Update stats display
     * @param {Array} sessions - Array of game session objects
     */
    updateStatsDisplay(sessions) {
        if (sessions.length === 0) {
            this.statsContent.innerHTML = '<p>No data available. Start tracking your game time!</p>';
            return;
        }
        
        // Generate stats
        const stats = sqliteHandler.generateSummaryStats(sessions);
        
        // Format time values
        const totalHours = Math.floor(stats.totalTimeMinutes / 60);
        const totalMinutes = stats.totalTimeMinutes % 60;
        
        const avgHours = Math.floor(stats.avgSessionMinutes / 60);
        const avgMinutes = Math.round(stats.avgSessionMinutes % 60);
        
        const valorantHours = Math.floor(stats.gameBreakdown.valorant / 60);
        const valorantMinutes = stats.gameBreakdown.valorant % 60;
        
        const kovaaksHours = Math.floor(stats.gameBreakdown.kovaaks / 60);
        const kovaaksMinutes = stats.gameBreakdown.kovaaks % 60;
        
        // Create HTML content for basic stats
        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>Total Sessions</h4>
                    <p>${stats.totalSessions}</p>
                </div>
                <div class="stat-item">
                    <h4>Total Time</h4>
                    <p>${totalHours}h ${totalMinutes}m</p>
                </div>
                <div class="stat-item">
                    <h4>Average Session</h4>
                    <p>${avgHours}h ${avgMinutes}m</p>
                </div>
                <div class="stat-item">
                    <h4>Valorant</h4>
                    <p>${valorantHours}h ${valorantMinutes}m</p>
                </div>
                <div class="stat-item">
                    <h4>Kovaaks</h4>
                    <p>${kovaaksHours}h ${kovaaksMinutes}m</p>
                </div>
            </div>
        `;
        
        // Add Valorant match type stats if available
        if (stats.valorantMatchTypes && Object.keys(stats.valorantMatchTypes).length > 0) {
            html += `
                <h3>Valorant Match Types</h3>
                <div class="stats-grid">
            `;
            
            for (const [type, count] of Object.entries(stats.valorantMatchTypes)) {
                if (count > 0) {
                    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
                    html += `
                        <div class="stat-item">
                            <h4>${formattedType}</h4>
                            <p>${count} matches</p>
                        </div>
                    `;
                }
            }
            
            html += `</div>`;
        }
        
        // Add Kovaaks aim type stats if available
        if (stats.kovaaksAimTypes && Object.keys(stats.kovaaksAimTypes).length > 0) {
            html += `
                <h3>Kovaaks Aim Training</h3>
                <div class="stats-grid">
            `;
            
            for (const [type, minutes] of Object.entries(stats.kovaaksAimTypes)) {
                if (minutes > 0) {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    const formattedType = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    
                    html += `
                        <div class="stat-item">
                            <h4>${formattedType}</h4>
                            <p>${hours}h ${mins}m</p>
                        </div>
                    `;
                }
            }
            
            html += `</div>`;
        }
        
        this.statsContent.innerHTML = html;
    }
}

// Initialize the summary page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.summaryPage = new SummaryPage();
});
