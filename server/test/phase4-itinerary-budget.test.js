const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const app = require('../app');
const db = require('../db');
const { generateToken } = require('../utils/auth');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const user = { id: crypto.randomUUID(), email: 'phase4-test@example.com' };
  const token = generateToken(user, '1h');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function request(path, method = 'GET', body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  }

  try {
    let result = await request('/api/trips', 'POST', {
      title: 'Phase 4 Test Trip', startDate: '2026-09-01', endDate: '2026-09-03', budget: 1000
    });
    assert.strictEqual(result.status, 201);
    const trip = result.body;
    const cities = (await request('/api/cities')).body;
    const city = cities[0];
    const activities = [];

    for (const [category, cost] of [['Transport', 100], ['Food', 200], ['Adventure', 300]]) {
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO activities (id, city_id, name, category, duration_minutes, estimated_cost) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, city.id, `Phase 4 ${category} ${id}`, category, 60, cost]
      );
      activities.push({ id, cost });
    }

    let stopResult = await request(`/api/trips/${trip.id}/stops`, 'POST', {
      cityId: city.id, startDate: '2026-09-01', endDate: '2026-09-01', stopOrder: 1
    });
    assert.strictEqual(stopResult.status, 201);
    const firstStop = stopResult.body;
    stopResult = await request(`/api/trips/${trip.id}/stops`, 'POST', {
      cityId: city.id, startDate: '2026-09-02', endDate: '2026-09-03', stopOrder: 2
    });
    assert.strictEqual(stopResult.status, 201);
    const secondStop = stopResult.body;

    for (const item of [
      { activity: activities[0], stop: firstStop, date: '2026-09-01', time: '14:00' },
      { activity: activities[1], stop: firstStop, date: '2026-09-01', time: '09:00' },
      { activity: activities[2], stop: secondStop, date: '2026-09-02', time: '11:00' }
    ]) {
      result = await request(`/api/stops/${item.stop.id}/activities`, 'POST', {
        activityId: item.activity.id, date: item.date, startTime: item.time, endTime: '15:00', cost: item.activity.cost
      });
      assert.strictEqual(result.status, 201, JSON.stringify({ stopId: item.stop.id, activityId: item.activity.id, response: result.body }));
    }

    await db.query(
      'INSERT INTO expenses (id, trip_id, category, description, amount, expense_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), trip.id, 'Accommodation', 'Hotel', 400, '2026-09-01']
    );
    await db.query(
      'INSERT INTO expenses (id, trip_id, category, description, amount, expense_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), trip.id, 'Other', 'Misc', 50, '2026-09-03']
    );

    let tripData = (await request(`/api/trips/${trip.id}`)).body;
    const originalIds = tripData.stops.map(stop => stop.id);
    const reversedIds = [...originalIds].reverse();
    result = await request(`/api/trips/${trip.id}/stops/reorder`, 'PUT', { stopIds: reversedIds });
    assert.strictEqual(result.status, 200);
    tripData = (await request(`/api/trips/${trip.id}`)).body;
    assert.deepStrictEqual(tripData.stops.map(stop => stop.id), reversedIds);
    assert.deepStrictEqual(tripData.stops.map(stop => stop.stopOrder), [1, 2]);

    result = await request(`/api/trips/${trip.id}/stops/reorder`, 'PUT', {
      stopIds: [reversedIds[0], crypto.randomUUID()]
    });
    assert.strictEqual(result.status, 400);
    assert.strictEqual(result.body.error.code, 'VALIDATION_ERROR');
    tripData = (await request(`/api/trips/${trip.id}`)).body;
    assert.deepStrictEqual(tripData.stops.map(stop => stop.id), reversedIds);

    const budget = (await request(`/api/trips/${trip.id}/budget`)).body;
    assert.strictEqual(Number(budget.totalSpent), 1050);
    assert.deepStrictEqual(Object.fromEntries(Object.entries(budget.byCategory).map(([key, value]) => [key, Number(value)])), {
      transport: 100, accommodation: 400, activities: 300, food: 200, other: 50
    });
    assert.strictEqual(Number(budget.remaining), -50);
    assert.deepStrictEqual(budget.overBudgetDays, ['2026-09-01']);
    assert.deepStrictEqual(tripData.stops[0].activities.map(activity => activity.startTime), ['11:00']);
    assert.deepStrictEqual(tripData.stops[1].activities.map(activity => activity.startTime), ['09:00', '14:00']);

    console.log('Phase 4 itinerary/budget: PASS');
    console.log('Reorder reverse + sequential orders: PASS');
    console.log('Invalid reorder standard 400 + unchanged order: PASS');
    console.log('Budget math 1050 total, -50 remaining, exact buckets: PASS');
    console.log('Over-budget day detection: PASS');
    console.log('Timeline ordering: PASS');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

if (require.main === module) runTests().catch(error => { console.error(error); process.exit(1); });
module.exports = { runTests };
