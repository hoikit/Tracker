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
        this.todayStatsContent = document.getElementById('today-stats-content');
        
        // Metadata elements
        this.metadataContainer = document.getElementById('metadata-container');
        this.valorantMetadata = document.getElementById('valorant-metadata');
        this.kovaaksMetadata = document.getElementById('kovaaks-metadata');
        this.saveMetadataButton = document.getElementById('save-metadata');
        this.saveKovaaksMetadataButton = document.getElementById('save-kovaaks-metadata');
        this.cancelMetadataButton = document.getElementById('cancel-metadata');
        this.cancelKovaaksMetadataButton = document.getElementById('cancel-kovaaks-metadata');
        
        // Valorant match count inputs
        this.deathmatchCount = document.getElementById('deathmatch-count');
        this.competitiveCount = document.getElementById('competitive-count');
        this.unratedCount = document.getElementById('unrated-count');
        this.spikeRushCount = document.getElementById('spike-rush-count');
        
        // Kovaaks aim type selector
        this.aimTypeSelect = document.getElementById('aim-type-select');
        
        // Timer variables
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        
        // Session data
        this.sessions = this.loadSessionsFromLocalStorage() || [];
        this.currentSession = null;
        
        
        // Alarm elements and variables
        this.alarmSound = document.getElementById('alarm-sound');
        this.alarmNotification = document.getElementById('alarm-notification');
        this.dismissAlarmButton = document.getElementById('dismiss-alarm');
        this.alarmTriggered = false;
        this.hourlyAlarmThreshold = 60; // 60 minutes = 1 hour
        
        // Initialize
        this.initEventListeners();
        this.updateTodayStats();
    }
    
    /**
     * Initialize
     */
    initEventListeners() {
        this.loadFromDatabase();
        // Timer controls
        this.startButton.addEventListener('click', () => this.startTimer());
        this.endButton.addEventListener('click', () => this.showMetadataForm());
        
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
        
        // Metadata form controls
        if (this.saveMetadataButton) {
            this.saveMetadataButton.addEventListener('click', () => this.saveValorantMetadata());
        }
        
        if (this.saveKovaaksMetadataButton) {
            this.saveKovaaksMetadataButton.addEventListener('click', () => this.saveKovaaksMetadata());
        }
        
        if (this.cancelMetadataButton) {
            this.cancelMetadataButton.addEventListener('click', () => this.cancelMetadata());
        }
        
        if (this.cancelKovaaksMetadataButton) {
            this.cancelKovaaksMetadataButton.addEventListener('click', () => this.cancelMetadata());
        }
        
        // Alarm controls
        if (this.dismissAlarmButton) {
            this.dismissAlarmButton.addEventListener('click', () => this.dismissAlarm());
        }
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
            durationMinutes: 0,
            metadata: {}
        };
        
        // Update UI
        this.startButton.disabled = true;
        this.endButton.disabled = false;
        this.gameSelect.disabled = true;
        
        // Reset alarm trigger state
        this.alarmTriggered = false;
        
        // Start interval
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
    
    /**
     * Show metadata form based on game type
     */
    showMetadataForm() {
        if (!this.isRunning) return;
        
        clearInterval(this.timerInterval);
        
        // Complete current session timing
        this.currentSession.endTime = new Date().toISOString();
        this.currentSession.durationMinutes = Math.round(this.elapsedTime / 60000); // Convert ms to minutes
        
        // Show appropriate metadata form
        if (this.metadataContainer) {
            this.metadataContainer.style.display = 'block';
            
            if (this.currentSession.game === 'valorant') {
                this.valorantMetadata.style.display = 'block';
                this.kovaaksMetadata.style.display = 'none';
                
                // Reset form values
                this.deathmatchCount.value = '0';
                this.competitiveCount.value = '0';
                this.unratedCount.value = '0';
                this.spikeRushCount.value = '0';
            } else if (this.currentSession.game === 'kovaaks') {
                this.valorantMetadata.style.display = 'none';
                this.kovaaksMetadata.style.display = 'block';
                
                // Reset form values
                this.aimTypeSelect.value = 'static-clicking';
            }
        } else {
            // If metadata container doesn't exist, just end the timer
            this.endTimer();
        }
    }
    
    /**
     * Save Valorant metadata and complete session
     */
    saveValorantMetadata() {
        // Get match counts
        const matchTypes = {
            deathmatch: parseInt(this.deathmatchCount.value) || 0,
            competitive: parseInt(this.competitiveCount.value) || 0,
            unrated: parseInt(this.unratedCount.value) || 0,
            spikeRush: parseInt(this.spikeRushCount.value) || 0
        };
        
        // Add metadata to current session
        this.currentSession.metadata = {
            matchTypes: matchTypes
        };
        
        // Hide metadata form
        this.metadataContainer.style.display = 'none';
        
        // Complete the session
        this.completeSession();
    }
    
    /**
     * Save Kovaaks metadata and complete session
     */
    saveKovaaksMetadata() {
        // Get aim training type
        const aimType = this.aimTypeSelect.value;
        
        // Add metadata to current session
        this.currentSession.metadata = {
            aimType: aimType
        };
        
        // Hide metadata form
        this.metadataContainer.style.display = 'none';
        
        // Complete the session
        this.completeSession();
    }
    
    /**
     * Cancel metadata entry and complete session without metadata
     */
    cancelMetadata() {
        // Hide metadata form
        this.metadataContainer.style.display = 'none';
        
        // Complete the session without metadata
        this.completeSession();
    }
    
    /**
     * Complete the session after metadata entry
     */
    completeSession() {
        // Add to sessions array
        this.sessions.push(this.currentSession);
        
        // Save to local storage
        this.saveSessionsToLocalStorage();
        
        // Save to SQLite database
        this.saveData(true);
        
        // Update UI
        this.startButton.disabled = false;
        this.endButton.disabled = true;
        this.gameSelect.disabled = false;
        
        // Reset timer display
        this.elapsedTime = 0;
        this.updateTimerDisplay();
        this.isRunning = false;
        
        // Update today's stats
        this.updateTodayStats();
    }
    
    /**
     * End the timer (legacy method, now just shows metadata form)
     */
    endTimer() {
        this.showMetadataForm();
    }
    
    /**
     * Update timer display
     */
    updateTimer() {
        this.elapsedTime = Date.now() - this.startTime;
        this.updateTimerDisplay();
        
        // Check if we need to trigger the alarm for kovaaks aim trainer
        if (this.currentSession && this.currentSession.game === 'kovaaks' && !this.alarmTriggered) {
            this.checkKovaaksTimeThreshold();
        }
    }
    
    /**
     * Check if kovaaks time has reached the hourly threshold
     */
    checkKovaaksTimeThreshold() {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate total kovaaks time for today including current session
        let todayKovaaksMinutes = 0;
        
        // Add time from completed sessions today
        this.sessions.forEach(session => {
            if (session.game === 'kovaaks' && session.date === today) {
                todayKovaaksMinutes += session.durationMinutes || 0;
            }
        });
        
        // Add time from current session (convert ms to minutes)
        const currentSessionMinutes = Math.floor(this.elapsedTime / 60000);
        todayKovaaksMinutes += currentSessionMinutes;
        
        // Check if threshold is reached
        if (todayKovaaksMinutes >= this.hourlyAlarmThreshold) {
            this.triggerAlarm();
        }
    }
    
    /**
     * Trigger the alarm
     */
    triggerAlarm() {
        if (this.alarmTriggered) return; // Prevent multiple alarms
        
        this.alarmTriggered = true;
        
        // Play sound
        if (this.alarmSound) {
            this.alarmSound.currentTime = 0;
            this.alarmSound.play().catch(error => {
                console.error('Error playing alarm sound:', error);
            });
        }
        
        // Show notification
        if (this.alarmNotification) {
            this.alarmNotification.style.display = 'flex';
        }
    }
    
    /**
     * Dismiss the alarm
     */
    dismissAlarm() {
        // Stop sound
        if (this.alarmSound) {
            this.alarmSound.pause();
            this.alarmSound.currentTime = 0;
        }
        
        // Hide notification
        if (this.alarmNotification) {
            this.alarmNotification.style.display = 'none';
        }
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
     * Save sessions to SQLite database
     * @param {boolean} saveToDefault - Whether to save to default location
     */
    saveData(saveToDefault = false) {
        if (this.sessions.length === 0) {
            alert('No data to save. Start tracking your game time first!');
            return;
        }
        
        // Use SQLiteHandler to save data
        sqliteHandler.saveToDatabase(this.sessions)
            .then(() => {
                return;
            })
            .catch(error => {
                alert('Failed to save data: ' + error.message);
            });
    }
    
    /**
     * Load sessions from SQLite database
     */
    loadFromDatabase() {
        // Use SQLiteHandler to load data
        sqliteHandler.loadFromDatabase()
            .then(sessions => {
                this.sessions = sessions;
                this.saveSessionsToLocalStorage();
                this.updateTodayStats();
                
                alert('Data loaded successfully from database!');
            })
            .catch(error => {
                alert('Failed to load data: ' + error.message);
            });
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
        const chartData = sqliteHandler.prepareDailyTrendData(this.sessions);
        
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
     */
    updateStatsDisplay() {
        if (this.sessions.length === 0) {
            this.statsContent.innerHTML = '<p>No data available. Start tracking your game time!</p>';
            return;
        }
        
        // Generate stats
        const stats = sqliteHandler.generateSummaryStats(this.sessions);
        
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
    
    /**
     * Update today's stats display
     */
    updateTodayStats() {
        if (!this.todayStatsContent) return;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Filter sessions for today - handle both string and Date objects
        const todaySessions = this.sessions.filter(session => {
            // Handle different date formats
            let sessionDate;
            if (session.date instanceof Date) {
                sessionDate = session.date.toISOString().split('T')[0];
            } else if (typeof session.date === 'string') {
                // If it's already in YYYY-MM-DD format
                if (session.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    sessionDate = session.date;
                } else {
                    // Try to parse other date string formats
                    sessionDate = new Date(session.date).toISOString().split('T')[0];
                }
            }
            
            console.log(`Comparing session date: ${sessionDate} with today: ${today}`);
            return sessionDate === today;
        });
        
        console.log(`Found ${todaySessions.length} sessions for today`);
        
        if (todaySessions.length === 0) {
            this.todayStatsContent.innerHTML = '<p>No data available for today yet.</p>';
            return;
        }
        
        // Calculate total time for each game today
        const todayStats = {
            valorant: 0,
            kovaaks: 0,
            valorantMatches: {
                deathmatch: 0,
                competitive: 0,
                unrated: 0,
                spikeRush: 0
            },
            kovaaksTypes: {}
        };
        
        // Process today's sessions
        todaySessions.forEach(session => {
            // Add time
            todayStats[session.game] += session.durationMinutes || 0;
            
            // Process metadata
            if (session.game === 'valorant' && session.metadata && session.metadata.matchTypes) {
                Object.entries(session.metadata.matchTypes).forEach(([type, count]) => {
                    todayStats.valorantMatches[type] = (todayStats.valorantMatches[type] || 0) + count;
                });
            }
            
            if (session.game === 'kovaaks' && session.metadata && session.metadata.aimType) {
                const aimType = session.metadata.aimType;
                todayStats.kovaaksTypes[aimType] = (todayStats.kovaaksTypes[aimType] || 0) + session.durationMinutes;
            }
        });
        
        // Format time values
        const valorantHours = Math.floor(todayStats.valorant / 60);
        const valorantMinutes = todayStats.valorant % 60;
        
        const kovaaksHours = Math.floor(todayStats.kovaaks / 60);
        const kovaaksMinutes = todayStats.kovaaks % 60;
        
        // Create HTML content
        let html = `
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>Today's Sessions</h4>
                    <p>${todaySessions.length}</p>
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
        const hasValorantMatches = Object.values(todayStats.valorantMatches).some(count => count > 0);
        if (hasValorantMatches) {
            html += `
                <h3>Today's Valorant Matches</h3>
                <div class="stats-grid">
            `;
            
            for (const [type, count] of Object.entries(todayStats.valorantMatches)) {
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
        if (Object.keys(todayStats.kovaaksTypes).length > 0) {
            html += `
                <h3>Today's Kovaaks Training</h3>
                <div class="stats-grid">
            `;
            
            for (const [type, minutes] of Object.entries(todayStats.kovaaksTypes)) {
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
        
        this.todayStatsContent.innerHTML = html;
    }
    
    /**
     * Load sessions from default location (SQLite database)
     */
    loadFromDefaultLocation() {
        sqliteHandler.loadFromDefaultLocation()
            .then(sessions => {
                if (sessions && sessions.length > 0) {
                    this.sessions = sessions;
                    this.saveSessionsToLocalStorage();
                    this.updateTodayStats(); // Update today's stats with the loaded data
                    
                    console.log('Data loaded from database successfully!');
                } else {
                    // Even if no sessions were loaded, try to update today's stats
                    // from any data that might be in localStorage
                    const localSessions = this.loadSessionsFromLocalStorage();
                    if (localSessions && localSessions.length > 0) {
                        this.sessions = localSessions;
                        this.updateTodayStats();
                    }
                }
            })
            .catch(error => {
                console.error('Failed to load data from database:', error);
                // On error, try to use localStorage data
                const localSessions = this.loadSessionsFromLocalStorage();
                if (localSessions && localSessions.length > 0) {
                    this.sessions = localSessions;
                    this.updateTodayStats();
                }
            });
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameTracker = new GameTimeTracker();
    
    // Automatically load data from default location
    setTimeout(() => {
        window.gameTracker.loadFromDefaultLocation();
    }, 500); // Small delay to ensure database connection is initialized
});
