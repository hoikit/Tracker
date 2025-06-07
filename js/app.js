/**
 * Game Time Tracker - Main Application
 * Handles timer functionality, session tracking, and data visualization
 */

class GameTimeTracker {
    constructor() {
        // DOM elements
        this.gameSelect = document.getElementById('game-select');
        this.hoursElement = document.getElementById('hours');
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.startButton = document.getElementById('start-timer');
        this.endButton = document.getElementById('end-timer');
        this.saveButton = document.getElementById('save-data');
        this.loadButton = document.getElementById('load-data');
        this.fileInput = document.getElementById('file-input');
        this.statsContent = document.getElementById('stats-content');
        
        // Timer variables
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        
        // Session data
        this.sessions = this.loadSessionsFromLocalStorage() || [];
        this.currentSession = null;
        
        // Chart
        this.chart = null;
        
        // Initialize
        this.initEventListeners();
        this.updateStatsDisplay();
        this.initChart();
    }
    
    /**
     * Initialize
     */
    initEventListeners() {
        // Timer controls
        this.startButton.addEventListener('click', () => this.startTimer());
        this.endButton.addEventListener('click', () => this.endTimer());
        
        // Data controls
        this.saveButton.addEventListener('click', () => this.saveData(true)); // Pass true to save to default location
        this.loadButton.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.loadData(e));
        
        // Game selection
        this.gameSelect.addEventListener('change', () => {
            if (this.isRunning) {
                // If timer is running, confirm before changing game
                if (confirm('Changing the game will end the current session. Continue?')) {
                    this.endTimer();
                } else {
                    // Reset selection to previous value
                    this.gameSelect.value = this.currentSession.game;
                }
            }
        });
    }
    
    /**
     * Start the timer
     */
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = Date.now() - this.elapsedTime;
        
        // Create new session
        this.currentSession = {
            game: this.gameSelect.value,
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            startTime: new Date().toISOString(),
            endTime: null,
            durationMinutes: 0
        };
        
        // Update UI
        this.startButton.disabled = true;
        this.endButton.disabled = false;
        this.gameSelect.disabled = true;
        
        // Start interval
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
    
    /**
     * End the timer
     */
    endTimer() {
        if (!this.isRunning) return;
        
        clearInterval(this.timerInterval);
        this.isRunning = false;
        
        // Complete current session
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.durationMinutes = Math.round(this.elapsedTime / 60000); // Convert ms to minutes
        
        // Add to sessions array
        this.sessions.push(this.currentSession);
        
        // Save to local storage
        this.saveSessionsToLocalStorage();
        
        // Update UI
        this.startButton.disabled = false;
        this.endButton.disabled = true;
        this.gameSelect.disabled = false;
        
        // Reset timer display
        this.elapsedTime = 0;
        this.updateTimerDisplay();
        
        // Update stats and chart
        this.updateStatsDisplay();
        this.updateChart();
    }
    
    /**
     * Update timer display
     */
    updateTimer() {
        this.elapsedTime = Date.now() - this.startTime;
        this.updateTimerDisplay();
    }
    
    /**
     * Update timer display elements
     */
    updateTimerDisplay() {
        // Calculate hours, minutes, seconds
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // Update display
        this.hoursElement.textContent = hours.toString().padStart(2, '0');
        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
    
    /**
     * Save sessions to Excel file
     * @param {boolean} saveToDefault - Whether to save to default location (IndexedDB)
     */
    saveData(saveToDefault = false) {
        if (this.sessions.length === 0) {
            alert('No data to save. Start tracking your game time first!');
            return;
        }
        
        // Use ExcelHandler to save data
        const success = excelHandler.saveToExcel(this.sessions, saveToDefault);
        
        if (success) {
            if (saveToDefault) {
                alert('Data saved successfully to Excel and default location!');
            } else {
                alert('Data saved successfully!');
            }
        } else {
            alert('Failed to save data. Please try again.');
        }
    }
    
    /**
     * Load sessions from Excel file
     */
    loadData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Use ExcelHandler to load data
        excelHandler.loadFromExcel(file)
            .then(sessions => {
                // Confirm before overwriting existing data
                if (this.sessions.length > 0) {
                    if (!confirm('This will replace your existing data. Continue?')) {
                        return;
                    }
                }
                
                this.sessions = sessions;
                this.saveSessionsToLocalStorage();
                this.updateStatsDisplay();
                this.updateChart();
                
                alert('Data loaded successfully!');
            })
            .catch(error => {
                alert('Failed to load data: ' + error.message);
            });
        
        // Reset file input
        event.target.value = '';
    }
    
    /**
     * Save sessions to local storage
     */
    saveSessionsToLocalStorage() {
        localStorage.setItem('gameSessions', JSON.stringify(this.sessions));
    }
    
    /**
     * Load sessions from local storage
     */
    loadSessionsFromLocalStorage() {
        const data = localStorage.getItem('gameSessions');
        return data ? JSON.parse(data) : null;
    }
    
    /**
     * Initialize chart
     */
    initChart() {
        const ctx = document.getElementById('daily-chart').getContext('2d');
        
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
                            text: 'Date'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Minutes'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Gaming Time'
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
        
        // Update chart with initial data
        this.updateChart();
    }
    
    /**
     * Update chart with current session data
     */
    updateChart() {
        if (this.sessions.length === 0) {
            // No data to display
            this.chart.data = {
                labels: [],
                datasets: []
            };
            this.chart.update();
            return;
        }
        
        // Prepare data for chart
        const chartData = excelHandler.prepareDailyTrendData(this.sessions);
        
        // Update chart
        this.chart.data = chartData;
        this.chart.update();
    }
    
    /**
     * Update stats display
     */
    updateStatsDisplay() {
        if (this.sessions.length === 0) {
            this.statsContent.innerHTML = '<p>No data available. Start tracking your game time!</p>';
            return;
        }
        
        // Generate stats
        const stats = excelHandler.generateSummaryStats(this.sessions);
        
        // Format time values
        const totalHours = Math.floor(stats.totalTimeMinutes / 60);
        const totalMinutes = stats.totalTimeMinutes % 60;
        
        const avgHours = Math.floor(stats.avgSessionMinutes / 60);
        const avgMinutes = Math.round(stats.avgSessionMinutes % 60);
        
        const valorantHours = Math.floor(stats.gameBreakdown.valorant / 60);
        const valorantMinutes = stats.gameBreakdown.valorant % 60;
        
        const kovaaksHours = Math.floor(stats.gameBreakdown.kovaaks / 60);
        const kovaaksMinutes = stats.gameBreakdown.kovaaks % 60;
        
        // Create HTML content
        const html = `
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
        
        this.statsContent.innerHTML = html;
    }
}

    /**
     * Load sessions from default location (IndexedDB)
     */
    loadFromDefaultLocation() {
        excelHandler.loadFromDefaultLocation()
            .then(sessions => {
                if (sessions && sessions.length > 0) {
                    // Confirm before overwriting existing data if there's any
                    if (this.sessions.length > 0) {
                        if (!confirm('This will replace your existing data. Continue?')) {
                            return;
                        }
                    }
                    
                    this.sessions = sessions;
                    this.saveSessionsToLocalStorage();
                    this.updateStatsDisplay();
                    this.updateChart();
                    
                    console.log('Data loaded from default location successfully!');
                }
            })
            .catch(error => {
                console.error('Failed to load data from default location:', error);
            });
    }

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameTracker = new GameTimeTracker();
    
    // Automatically load data from default location
    setTimeout(() => {
        window.gameTracker.loadFromDefaultLocation();
    }, 500); // Small delay to ensure IndexedDB is initialized
});
