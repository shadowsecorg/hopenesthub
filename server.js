require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
let routes;
try { routes = require('./routes'); } catch (_) { routes = express.Router(); }
const db = require('./models');
const expressLayouts = require('express-ejs-layouts');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./config/openapi.json');

const app = express();
const port = process.env.PORT || 3000;

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Make pool available via app.locals
app.locals.pool = pool;

// View engine: EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layouts/admin_layout');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(__dirname + '/public'));
app.use('/frontend', express.static(__dirname + '/frontend'));

// API Routes
app.use('/api', routes);

// Swagger UI (OpenAPI docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  explorer: true,
  swaggerOptions: { persistAuthorization: true }
}));

// Pages Routes
app.use('/', require('./web/pages'));

// Health
app.get('/health', (req, res) => res.json({ message: 'HopeNest Hub API running' }));

// Start server after testing DB connection
(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await db.sequelize.authenticate();
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error('Failed to connect to the database', err.message || err);
    process.exit(1);
  }
})();
