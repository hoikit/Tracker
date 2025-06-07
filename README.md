# Game Time Tracker

A web-based application to track time spent playing Valorant and Kovaaks aim trainer. This application allows you to start and end timers for gaming sessions, visualize daily trends, and save/load your data in Excel format.

## Features

- Track time spent on Valorant and Kovaaks aim trainer
- Start and end timer functionality
- Daily trend visualization with charts
- Statistics summary (total time, average session, etc.)
- Save data to Excel files
- Load data from Excel files
- Cross-platform compatibility (Windows and Mac)
- Local storage for persistent data between sessions

## How to Use

### Setup

1. Download or clone this repository to your local machine
2. Open the `index.html` file in your web browser
   - On Windows: Double-click the `index.html` file
   - On Mac: Right-click the `index.html` file and select "Open With" > your preferred browser

### Tracking Game Time

1. Select the game you want to track (Valorant or Kovaaks) from the dropdown menu
2. Click the "Start Timer" button when you begin playing
3. Click the "End Timer" button when you finish playing
4. Your session will be automatically saved and added to the statistics

### Saving and Loading Data

- Click the "Save to Excel" button to download your data as an Excel file
- Click the "Load from Excel" button to upload a previously saved Excel file
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
- For backup or sharing purposes, you can save your data to an Excel file
- The Excel file format is compatible with Microsoft Excel, Google Sheets, and other spreadsheet applications

## Browser Compatibility

This application works best in modern browsers:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Dependencies

- [Chart.js](https://www.chartjs.org/) - For data visualization
- [SheetJS](https://sheetjs.com/) - For Excel file handling

## License

This project is open source and available for personal use.
