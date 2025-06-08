const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const dbPath = path.join(__dirname, 'data', 'game-time-tracker.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    durationMinutes INTEGER,
    metadata TEXT
  )
`);

// Serve static files from the current directory
app.use(express.static(__dirname));

// Parse JSON requests
app.use(express.json());

// Configure multer for file uploads (keeping for backward compatibility)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        cb(null, dataDir);
    },
    filename: function (req, file, cb) {
        // Use the original filename
        cb(null, file.originalname.split('/').pop());
    }
});

const upload = multer({ storage: storage });

// Handle Excel file uploads (keeping for backward compatibility)
app.post('/save-excel', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    
    res.status(200).send('File uploaded successfully');
});

// API endpoint to save sessions to SQLite database
app.post('/api/sessions/save', (req, res) => {
    try {
        const { sessions } = req.body;
        
        if (!sessions || !Array.isArray(sessions)) {
            return res.status(400).json({ error: 'Invalid sessions data' });
        }
        
        // Begin transaction
        const transaction = db.transaction((sessions) => {
            // Clear existing sessions (optional - could also append)
            db.prepare('DELETE FROM game_sessions').run();
            
            // Insert statement
            const insert = db.prepare(`
                INSERT INTO game_sessions (game, date, startTime, endTime, durationMinutes, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            // Insert each session
            for (const session of sessions) {
                // Convert metadata object to JSON string if it exists
                const metadata = session.metadata ? JSON.stringify(session.metadata) : null;
                
                insert.run(
                    session.game,
                    session.date,
                    session.startTime,
                    session.endTime,
                    session.durationMinutes,
                    metadata
                );
            }
        });
        
        // Execute transaction
        transaction(sessions);
        
        res.status(200).json({ success: true, message: 'Sessions saved successfully' });
    } catch (error) {
        console.error('Error saving sessions:', error);
        res.status(500).json({ error: 'Failed to save sessions' });
    }
});

// API endpoint to load sessions from SQLite database
app.get('/api/sessions/load', (req, res) => {
    try {
        // Query all sessions
        const sessions = db.prepare('SELECT * FROM game_sessions').all();
        
        // Process sessions to ensure consistent format
        sessions.forEach(session => {
            // Parse metadata JSON strings back to objects
            if (session.metadata) {
                try {
                    session.metadata = JSON.parse(session.metadata);
                } catch (e) {
                    console.error('Error parsing metadata JSON:', e);
                    session.metadata = {};
                }
            } else {
                session.metadata = {};
            }
            
            // Ensure date is in YYYY-MM-DD format
            if (session.date) {
                // If it's not already in YYYY-MM-DD format, convert it
                if (!session.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const dateObj = new Date(session.date);
                    session.date = dateObj.toISOString().split('T')[0];
                }
            }
            
            // Log the session date for debugging
            console.log(`Session date: ${session.date}, game: ${session.game}, duration: ${session.durationMinutes}`);
        });
        
        res.status(200).json({ sessions });
    } catch (error) {
        console.error('Error loading sessions:', error);
        res.status(500).json({ error: 'Failed to load sessions' });
    }
});

// API endpoint to get statistics
app.get('/api/sessions/stats', (req, res) => {
    try {
        // Get total sessions
        const totalSessions = db.prepare('SELECT COUNT(*) as count FROM game_sessions').get().count;
        
        // Get total time
        const totalTimeMinutes = db.prepare('SELECT SUM(durationMinutes) as total FROM game_sessions').get().total || 0;
        
        // Get average session time
        const avgSessionMinutes = totalSessions > 0 ? totalTimeMinutes / totalSessions : 0;
        
        // Get game breakdown
        const valorantMinutes = db.prepare("SELECT SUM(durationMinutes) as total FROM game_sessions WHERE game = 'valorant'").get().total || 0;
        const kovaaksMinutes = db.prepare("SELECT SUM(durationMinutes) as total FROM game_sessions WHERE game = 'kovaaks'").get().total || 0;
        
        // Get all sessions with metadata for detailed stats
        const sessions = db.prepare('SELECT * FROM game_sessions').all();
        
        // Parse metadata JSON strings back to objects
        sessions.forEach(session => {
            if (session.metadata) {
                try {
                    session.metadata = JSON.parse(session.metadata);
                } catch (e) {
                    console.error('Error parsing metadata JSON:', e);
                    session.metadata = {};
                }
            } else {
                session.metadata = {};
            }
        });
        
        // Process metadata for Valorant match types
        const valorantMatchTypes = {};
        // Process metadata for Kovaaks aim training types
        const kovaaksAimTypes = {};
        
        sessions.forEach(session => {
            if (session.game === 'valorant' && session.metadata && session.metadata.matchTypes) {
                Object.entries(session.metadata.matchTypes).forEach(([type, count]) => {
                    valorantMatchTypes[type] = (valorantMatchTypes[type] || 0) + count;
                });
            }
            
            if (session.game === 'kovaaks' && session.metadata && session.metadata.aimType) {
                const aimType = session.metadata.aimType;
                kovaaksAimTypes[aimType] = (kovaaksAimTypes[aimType] || 0) + session.durationMinutes;
            }
        });
        
        const stats = {
            totalSessions,
            totalTimeMinutes,
            avgSessionMinutes,
            gameBreakdown: {
                valorant: valorantMinutes,
                kovaaks: kovaaksMinutes
            },
            valorantMatchTypes,
            kovaaksAimTypes
        };
        
        res.status(200).json({ stats });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Game Time Tracker available at http://localhost:${PORT}/index.html`);
    console.log(`SQLite database initialized at ${dbPath}`);
});

// Close database connection when the process exits
process.on('exit', () => {
    db.close();
});
