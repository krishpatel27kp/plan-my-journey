const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import Route Files
const citiesRouter = require('./routes/cities');
const shareRouter = require('./routes/share');
const publicRouter = require('./routes/public');

// Mount Routes under /api
app.use('/api/cities', citiesRouter);
app.use('/api/trips', shareRouter);
app.use('/api/public', publicRouter);

// Fallback Route / 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
});

module.exports = app;
