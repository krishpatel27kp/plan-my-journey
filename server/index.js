const app = require('./app');
const path = require('path');
const fs = require('fs');

// Safe dotenv loading
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}
loadEnv();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`============================================================`);
  console.log(`Plan My Journey API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`Auth System: Real JWT Authentication Active`);
  console.log(`============================================================`);
});
