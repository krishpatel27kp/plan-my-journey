const app = require('./app');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { STUB_TEST_TOKEN } = require('./middleware/auth');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`============================================================`);
  console.log(`Plan My Journey API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`STUB TEST TOKEN: ${STUB_TEST_TOKEN}`);
  console.log(`============================================================`);
});
