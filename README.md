# Game Time Tracker

A web-based application to track time spent playing Valorant and Kovaaks aim trainer. This application allows you to start and end timers for gaming sessions, visualize daily trends, and save/load your data in a SQLite database.

## Features

- Track time spent on Valorant and Kovaaks aim trainer
- Start and end timer functionality
- Daily trend visualization with charts
- Statistics summary (total time, average session, etc.)
- Save data to SQLite database
- Load data from SQLite database
- Automatic saving to database when timer ends
- Automatic loading of saved data on startup
- Cross-platform compatibility (Windows and Mac)
- Local storage for persistent data between sessions

## How to Use

### Setup

1. Download or clone this repository to your local machine
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

### Tracking Game Time

1. Select the game you want to track (Valorant or Kovaaks) from the dropdown menu
2. Click the "Start Timer" button when you begin playing
3. Click the "End Timer" button when you finish playing
4. Your session will be automatically saved and added to the statistics

### Saving and Loading Data

- Click the "Save to Database" button to save your data to the SQLite database
- Click the "Load from Database" button to load data from the SQLite database
  - Note: Loading data will replace your current data after confirmation

### Viewing Statistics

- The daily trends chart shows your gaming time by date
- The summary section displays:
  - Total number of sessions
  - Total time spent gaming
  - Average session duration
  - Time breakdown by game

## Data Storage

- Session data is automatically saved to your browser's local storage
- Data is also stored in a SQLite database for persistence
- The database file is located in the data directory

## Browser Compatibility

This application works best in modern browsers:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Dependencies

- [Chart.js](https://www.chartjs.org/) - For data visualization
- [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3) - For SQLite database handling
- [Express](https://expressjs.com/) - For the web server

## License

This project is open source and available for personal use.
