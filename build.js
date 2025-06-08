const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Game Time Tracker executable...');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Ensure icon exists (placeholder)
const iconPath = path.join(assetsDir, 'icon.png');
if (!fs.existsSync(iconPath)) {
  console.log('Creating placeholder icon...');
  // Create a simple placeholder icon file
  fs.writeFileSync(iconPath, Buffer.from(''));
}

// Run electron-builder
try {
  console.log('Running electron-builder...');
  execSync('npx electron-builder', { stdio: 'inherit' });
  console.log('Build completed successfully!');
  console.log('Executable can be found in the dist/ directory');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
