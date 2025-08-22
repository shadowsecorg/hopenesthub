require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Make pool available via app.locals
app.locals.pool = pool;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health
app.get('/', (req, res) => res.json({ message: 'HopeNest Hub API running' }));

// Start server after testing DB connection
(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error('Failed to connect to the database', err.message || err);
    process.exit(1);
  }
})();
