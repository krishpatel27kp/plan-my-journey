// server/routes/cities.js
// Pillar C — Discovery: City & Activity endpoints
// Phase 1 implementation — GET /api/cities and GET /api/cities/:cityId/activities

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/cities — Search/List cities (public, no auth)
router.get('/', async (req, res) => {
  try {
    const { search, region } = req.query;
    let query = 'SELECT id, name, country, cost_index as "costIndex", popularity, image_url as "imageUrl", region FROM cities';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (region) {
      params.push(region.toLowerCase().trim());
      conditions.push(`region = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY popularity DESC';

    const result = await db.query(query, params);

    const formattedCities = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      costIndex: row.costIndex,
      popularity: row.popularity,
      imageUrl: row.imageUrl
    }));

    res.json(formattedCities);
  } catch (err) {
    console.error('Error fetching cities:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching cities'
      }
    });
  }
});

// GET /api/cities/:cityId/activities — Get activities for a city (public, no auth)
router.get('/:cityId/activities', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { category } = req.query;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cityId)) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'City not found'
        }
      });
    }

    // Verify city exists
    const cityCheck = await db.query('SELECT id FROM cities WHERE id = $1', [cityId]);
    if (cityCheck.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'City not found'
        }
      });
    }

    let query = 'SELECT id, name, category, duration_minutes as "durationMinutes", estimated_cost as "estimatedCost" FROM activities WHERE city_id = $1';
    const params = [cityId];

    if (category) {
      params.push(category.trim());
      query += ` AND category ILIKE $${params.length}`;
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);

    const formattedActivities = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      durationMinutes: row.durationMinutes,
      estimatedCost: row.estimatedCost !== null ? parseFloat(row.estimatedCost) : null
    }));

    res.json(formattedActivities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while fetching activities'
      }
    });
  }
});

module.exports = router;
