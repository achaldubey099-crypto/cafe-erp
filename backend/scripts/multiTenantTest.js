require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const connectDB = require('../config/db');

const Restaurant = require('../models/Restaurant');
const Cafe = require('../models/Cafe');
const User = require('../models/User');
const Menu = require('../models/Menu');

const API_BASE = process.env.API_BASE || 'http://localhost:5001';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function run() {
  await connectDB();

  console.log('Connected to DB');

  // Clean previous test data with marker in email
  await Menu.deleteMany({ name: /TEST_MULTI_/ });
  await User.deleteMany({ email: /test_multi_/ });
  await Cafe.deleteMany({ ownerName: /TEST_MULTI_/ });
  await Restaurant.deleteMany({ brandName: /TEST_MULTI_/ });

  // Create Restaurant + Cafe 1
  const restaurant1 = await Restaurant.create({ brandName: 'TEST_MULTI_Restaurant1', slug: 'test-rest-1' });
  const cafe1 = await Cafe.create({ name: 'TEST_MULTI_Cafe1', ownerName: 'TEST_MULTI_AdminA', email: 'test_multi_a@example.com', restaurantRef: restaurant1._id });

  // Create Restaurant + Cafe 2
  const restaurant2 = await Restaurant.create({ brandName: 'TEST_MULTI_Restaurant2', slug: 'test-rest-2' });
  const cafe2 = await Cafe.create({ name: 'TEST_MULTI_Cafe2', ownerName: 'TEST_MULTI_AdminB', email: 'test_multi_b@example.com', restaurantRef: restaurant2._id });

  // Create Admin A (owner for cafe1)
  const passA = 'TestPassA123!';
  const hashedA = await bcrypt.hash(passA, 10);
  const adminA = await User.create({ name: 'TEST_MULTI_AdminA', email: 'test_multi_a@example.com', password: hashedA, role: 'owner', restaurantId: restaurant1._id, cafeId: cafe1._id });

  // Create Admin B (owner for cafe2)
  const passB = 'TestPassB123!';
  const hashedB = await bcrypt.hash(passB, 10);
  const adminB = await User.create({ name: 'TEST_MULTI_AdminB', email: 'test_multi_b@example.com', password: hashedB, role: 'owner', restaurantId: restaurant2._id, cafeId: cafe2._id });

  console.log('Created test cafes and users');

  // Generate tokens using same secret
  const tokenA = jwt.sign({ userId: String(adminA._id), role: adminA.role, cafeId: String(adminA.cafeId) }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const tokenB = jwt.sign({ userId: String(adminB._id), role: adminB.role, cafeId: String(adminB.cafeId) }, process.env.JWT_SECRET, { expiresIn: '7d' });

  console.log('Tokens generated');

  const clientA = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenA}` } });
  const clientB = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${tokenB}` } });

  // Admin A: create two menu items via API
  console.log('Admin A creating two menu items...');
  const item1 = (await clientA.post('/api/menu', { name: 'TEST_MULTI_Pizza', price: 199, category: 'Food' })).data;
  const item2 = (await clientA.post('/api/menu', { name: 'TEST_MULTI_Burger', price: 149, category: 'Food' })).data;

  console.log('Admin A created items:', item1.item?._id || item1._id, item2.item?._id || item2._id);

  // small delay
  await sleep(500);

  // Admin B: list menu via API
  console.log('Admin B fetching menu...');
  const listB = await clientB.get('/api/menu');
  console.log('Admin B menu response status:', listB.status);
  console.log('Admin B menu items count:', (listB.data || []).length);

  const idsB = (listB.data || []).map((i) => String(i._id || i.item?._id));
  console.log('Admin B item ids:', idsB);

  // Check that Admin B does not see Admin A items
  const aId1 = String(item1.item?._id || item1._id);
  const aId2 = String(item2.item?._id || item2._id);

  console.log('Expect Admin B NOT to see:', aId1, aId2);
  console.log('Admin B sees A items?', idsB.includes(aId1) || idsB.includes(aId2));

  // Admin B tries to GET specific item created by Admin A
  try {
    const getAitem = await clientB.get(`/api/menu/${aId1}`);
    console.log('GET by Admin B status:', getAitem.status, 'data:', getAitem.data);
  } catch (err) {
    console.log('GET by Admin B error (expected):', err.response?.status, err.response?.data);
  }

  // Admin B tries to update Admin A's item
  try {
    const upd = await clientB.put(`/api/menu/${aId1}`, { name: 'HACKED' });
    console.log('UPDATE by Admin B status (unexpected):', upd.status, upd.data);
  } catch (err) {
    console.log('UPDATE by Admin B error (expected):', err.response?.status, err.response?.data);
  }

  // Test without token
  try {
    const anon = await axios.get(`${API_BASE}/api/menu`);
    console.log('Anon GET /api/menu status:', anon.status);
  } catch (err) {
    console.log('Anon GET error:', err.response?.status, err.response?.data);
  }

  console.log('Test completed');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
