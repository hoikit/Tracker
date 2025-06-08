# Game Time Tracker

A web application to track time spent on games, now packaged as a desktop application.

## Features

- Track time spent on different games
- View statistics and summaries
- Store data in SQLite database
- Easy to use interface

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Application

#### Web Version

To run the web version of the application:

```bash
npm start
```

Then open your browser and navigate to http://localhost:3000

#### Desktop Version (Development)

To run the desktop version in development mode:

```bash
npm run start-app
```

This will start both the server and the Electron application.

### Building the Desktop Application

To build the desktop application as an executable:

```bash
npm run build
```

This will create executables in the `dist` directory:

- Windows: `.exe` installer
- macOS: `.dmg` file
- Linux: `.AppImage` file

## Usage

1. Launch the application
2. Add your game sessions
3. View statistics and summaries

## License

MIT
