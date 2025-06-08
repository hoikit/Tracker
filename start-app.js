const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Default port
const PORT = process.env.PORT || 3000;

console.log('Starting server...');
const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT }
});

// Function to check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/`, (res) => {
      console.log(`Server is running on port ${PORT}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('Server not ready yet, retrying...');
      resolve(false);
    });
    
    req.end();
  });
}

// Wait for server to be ready
async function waitForServer() {
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isReady && attempts < maxAttempts) {
    isReady = await checkServer();
    if (!isReady) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
  }
  
  if (!isReady) {
    console.error('Server failed to start after multiple attempts');
    process.exit(1);
  }
  
  return isReady;
}

// Start Electron after server is ready
waitForServer().then(() => {
  console.log('Starting Electron app...');
  const electronProcess = spawn('electron', ['.'], {
    stdio: 'inherit'
  });
  
  electronProcess.on('close', (code) => {
    console.log(`Electron app exited with code ${code}`);
    serverProcess.kill();
    process.exit(code);
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill();
  process.exit(0);
});
