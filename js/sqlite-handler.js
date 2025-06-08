/**
 * SQLite Handler for Game Time Tracker
 * Handles saving and loading game session data to/from SQLite database
 */

class SQLiteHandler {
    constructor() {
        this.dbName = 'gameTimeTracker';
        this.apiEndpoints = {
            save: '/api/sessions/save',
            load: '/api/sessions/load',
            stats: '/api/sessions/stats'
        };
    }
    
    /**
     * Save game session data to SQLite database
     * @param {Array} sessions - Array of game session objects
     * @param {boolean} saveToDefault - Whether to save to default location (not used in SQLite implementation)
     */
    saveToDatabase(sessions, saveToDefault = false) {
        return new Promise((resolve, reject) => {
            // Use fetch API to save the sessions to the server
            fetch(this.apiEndpoints.save, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessions })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save data to database');
                }
                return response.json();
            })
            .then(data => {
                console.log('Data saved to SQLite database successfully');
                resolve(true);
            })
            .catch(error => {
                console.error('Error saving data to database:', error);
                reject(error);
            });
        });
    }
    
    /**
     * Load game session data from SQLite database
     * @returns {Promise} - Promise resolving to array of session objects
     */
    loadFromDatabase() {
        return new Promise((resolve, reject) => {
            // Use fetch API to load the sessions from the server
            fetch(this.apiEndpoints.load)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load data from database');
                    }
                    return response.json();
                })
                .then(data => {
                    // Process sessions to ensure consistent date formats
                    const sessions = data.sessions;
                    sessions.forEach(session => {
                        // Ensure date is in YYYY-MM-DD format for consistency
                        if (session.date) {
                            // If it's already a string in YYYY-MM-DD format, keep it
                            if (typeof session.date === 'string' && session.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                // Keep as is
                            } else {
                                // Convert to YYYY-MM-DD string format
                                const dateObj = new Date(session.date);
                                session.date = dateObj.toISOString().split('T')[0];
                            }
                        }
                        
                        // Keep startTime and endTime as ISO strings for consistency
                        if (session.startTime && typeof session.startTime !== 'string') {
                            session.startTime = new Date(session.startTime).toISOString();
                        }
                        
                        if (session.endTime && typeof session.endTime !== 'string') {
                            session.endTime = new Date(session.endTime).toISOString();
                        }
                        
                        // Ensure metadata is parsed if it's a string
                        if (session.metadata && typeof session.metadata === 'string') {
                            try {
                                session.metadata = JSON.parse(session.metadata);
                            } catch (e) {
                                console.error('Error parsing metadata JSON:', e);
                                session.metadata = {};
                            }
                        }
                    });
                    
                    console.log('Data loaded from SQLite database successfully');
                    console.log('Loaded sessions:', sessions);
                    resolve(sessions);
                })
                .catch(error => {
                    console.error('Error loading data from database:', error);
                    reject(error);
                });
        });
    }
    
    /**
     * Load game session data from default location (SQLite database)
     * @returns {Promise} - Promise resolving to array of session objects
     */
    loadFromDefaultLocation() {
        return this.loadFromDatabase();
    }
    
    /**
     * Prepare daily trend data for chart visualization
     * @param {Array} sessions - Array of game session objects
     * @returns {Object} - Object with labels and datasets for Chart.js
     */
    prepareDailyTrendData(sessions) {
        // Group sessions by date and game
        const dailyData = {};
        
        sessions.forEach(session => {
            // Format date as YYYY-MM-DD
            const dateStr = new Date(session.date).toISOString().split('T')[0];
            
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {
                    valorant: 0,
                    kovaaks: 0
                };
            }
            
            // Add duration in minutes
            const durationMinutes = session.durationMinutes || 0;
            dailyData[dateStr][session.game] += durationMinutes;
        });
        
        // Sort dates
        const sortedDates = Object.keys(dailyData).sort();
        
        // Prepare data for Chart.js
        const chartData = {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Valorant',
                    data: sortedDates.map(date => dailyData[date].valorant),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: 'Kovaaks Aim Trainer',
                    data: sortedDates.map(date => dailyData[date].kovaaks),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        };
        
        return chartData;
    }

    /**
     * Generate summary statistics from session data
     * @param {Array} sessions - Array of game session objects
     * @returns {Object} - Object with summary statistics
     */
    generateSummaryStats(sessions) {
        if (!sessions || sessions.length === 0) {
            return {
                totalSessions: 0,
                totalTimeMinutes: 0,
                avgSessionMinutes: 0,
                gameBreakdown: {
                    valorant: 0,
                    kovaaks: 0
                },
                valorantMatchTypes: {},
                kovaaksAimTypes: {}
            };
        }
        
        // Calculate total time and game breakdown
        let totalTimeMinutes = 0;
        const gameBreakdown = {
            valorant: 0,
            kovaaks: 0
        };
        
        // Initialize metadata stats
        const valorantMatchTypes = {};
        const kovaaksAimTypes = {};
        
        sessions.forEach(session => {
            const durationMinutes = session.durationMinutes || 0;
            totalTimeMinutes += durationMinutes;
            gameBreakdown[session.game] += durationMinutes;
            
            // Process Valorant match types
            if (session.game === 'valorant' && session.metadata && session.metadata.matchTypes) {
                Object.entries(session.metadata.matchTypes).forEach(([type, count]) => {
                    valorantMatchTypes[type] = (valorantMatchTypes[type] || 0) + count;
                });
            }
            
            // Process Kovaaks aim types
            if (session.game === 'kovaaks' && session.metadata && session.metadata.aimType) {
                const aimType = session.metadata.aimType;
                kovaaksAimTypes[aimType] = (kovaaksAimTypes[aimType] || 0) + durationMinutes;
            }
        });
        
        // Calculate average session time
        const avgSessionMinutes = totalTimeMinutes / sessions.length;
        
        return {
            totalSessions: sessions.length,
            totalTimeMinutes,
            avgSessionMinutes,
            gameBreakdown,
            valorantMatchTypes,
            kovaaksAimTypes
        };
    }
}

// Create global instance
const sqliteHandler = new SQLiteHandler();
