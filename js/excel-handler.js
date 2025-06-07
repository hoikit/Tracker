/**
 * Excel Handler for Game Time Tracker
 * Handles saving and loading game session data to/from Excel files
 */

class ExcelHandler {
    constructor() {
        this.fileName = 'game-time-tracker-data.xlsx';
        this.sheetName = 'GameSessions';
        this.dbName = 'gameTimeTrackerDB';
        this.storeName = 'excelData';
        this.dbVersion = 1;
        
        // Initialize IndexedDB
        this.initIndexedDB();
    }
    
    /**
     * Initialize IndexedDB for storing Excel data
     */
    initIndexedDB() {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(this.storeName)) {
                db.createObjectStore(this.storeName, { keyPath: 'id' });
                console.log('Created IndexedDB object store');
            }
        };
        
        request.onsuccess = (event) => {
            console.log('IndexedDB initialized successfully');
        };
    }

    /**
     * Save game session data to Excel file
     * @param {Array} sessions - Array of game session objects
     * @param {boolean} saveToDefault - Whether to save to default location (IndexedDB)
     */
    saveToExcel(sessions, saveToDefault = false) {
        try {
            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Convert sessions data to worksheet
            const ws = XLSX.utils.json_to_sheet(sessions);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, this.sheetName);
            
            // Write workbook to file and trigger download
            XLSX.writeFile(wb, this.fileName);
            
            // If saveToDefault is true, also save to IndexedDB
            if (saveToDefault) {
                this.saveToDefaultLocation(wb);
            }
            
            console.log('Data saved to Excel successfully');
            return true;
        } catch (error) {
            console.error('Error saving data to Excel:', error);
            return false;
        }
    }

    /**
     * Save workbook to default location (IndexedDB)
     * @param {Object} wb - XLSX workbook object
     */
    saveToDefaultLocation(wb) {
        try {
            // Convert workbook to binary string
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            
            // Convert binary string to ArrayBuffer
            const buf = new ArrayBuffer(wbout.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < wbout.length; i++) {
                view[i] = wbout.charCodeAt(i) & 0xFF;
            }
            
            // Save to IndexedDB
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                // Store the Excel data
                store.put({
                    id: 'defaultExcel',
                    data: buf,
                    timestamp: new Date().getTime()
                });
                
                transaction.oncomplete = () => {
                    console.log('Excel data saved to default location (IndexedDB)');
                };
                
                transaction.onerror = (event) => {
                    console.error('Error saving to IndexedDB:', event.target.error);
                };
            };
            
            request.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
            };
        } catch (error) {
            console.error('Error saving to default location:', error);
        }
    }
    
    /**
     * Load game session data from Excel file
     * @param {File} file - Excel file to load
     * @returns {Promise} - Promise resolving to array of session objects
     */
    loadFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    // Read the file data
                    const data = new Uint8Array(e.target.result);
                    const wb = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    
                    // Convert worksheet to JSON
                    const sessions = XLSX.utils.sheet_to_json(ws);
                    
                    // Parse date strings to Date objects
                    sessions.forEach(session => {
                        if (session.date) {
                            session.date = new Date(session.date);
                        }
                        if (session.startTime) {
                            session.startTime = new Date(session.startTime);
                        }
                        if (session.endTime) {
                            session.endTime = new Date(session.endTime);
                        }
                    });
                    
                    console.log('Data loaded from Excel successfully');
                    resolve(sessions);
                } catch (error) {
                    console.error('Error loading data from Excel:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
                reject(error);
            };
            
            // Read the file as array buffer
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Load game session data from default location (IndexedDB)
     * @returns {Promise} - Promise resolving to array of session objects
     */
    loadFromDefaultLocation() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('Error opening IndexedDB:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const getRequest = store.get('defaultExcel');
                
                getRequest.onerror = (event) => {
                    console.error('Error reading from IndexedDB:', event.target.error);
                    reject(event.target.error);
                };
                
                getRequest.onsuccess = (event) => {
                    if (!getRequest.result) {
                        console.log('No Excel data found in default location');
                        resolve([]);
                        return;
                    }
                    
                    try {
                        // Get the ArrayBuffer from IndexedDB
                        const data = getRequest.result.data;
                        
                        // Read the workbook from the ArrayBuffer
                        const wb = XLSX.read(data, { type: 'array' });
                        
                        // Get the first worksheet
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        
                        // Convert worksheet to JSON
                        const sessions = XLSX.utils.sheet_to_json(ws);
                        
                        // Parse date strings to Date objects
                        sessions.forEach(session => {
                            if (session.date) {
                                session.date = new Date(session.date);
                            }
                            if (session.startTime) {
                                session.startTime = new Date(session.startTime);
                            }
                            if (session.endTime) {
                                session.endTime = new Date(session.endTime);
                            }
                        });
                        
                        console.log('Data loaded from default location successfully');
                        resolve(sessions);
                    } catch (error) {
                        console.error('Error processing Excel data from IndexedDB:', error);
                        reject(error);
                    }
                };
            };
        });
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
                }
            };
        }
        
        // Calculate total time and game breakdown
        let totalTimeMinutes = 0;
        const gameBreakdown = {
            valorant: 0,
            kovaaks: 0
        };
        
        sessions.forEach(session => {
            const durationMinutes = session.durationMinutes || 0;
            totalTimeMinutes += durationMinutes;
            gameBreakdown[session.game] += durationMinutes;
        });
        
        // Calculate average session time
        const avgSessionMinutes = totalTimeMinutes / sessions.length;
        
        return {
            totalSessions: sessions.length,
            totalTimeMinutes,
            avgSessionMinutes,
            gameBreakdown
        };
    }
}

// Create global instance
const excelHandler = new ExcelHandler();
