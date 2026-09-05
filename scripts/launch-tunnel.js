const { spawn } = require('child_process');

console.log('🚀 Launching Instant Mobile Access Tunnel via untun / Cloudflare...');
console.log('Connecting port 3000 to public HTTPS edge...');

const tunnel = spawn('npx', ['--yes', 'untun@latest', 'tunnel', 'http://localhost:3000'], {
  stdio: 'inherit',
  shell: true,
});

tunnel.on('close', (code) => {
  console.log('Tunnel exited with code', code);
});
