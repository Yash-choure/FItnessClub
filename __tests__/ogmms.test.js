const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server');
const User = require('../models/user');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Plan = require('../models/Plan');

async function createUser(role, username) {
  return User.create({
    username,
    email: `${username}@test.local`,
    password: await bcrypt.hash('password123', 10),
    firstName: role,
    lastName: 'User',
    role,
  });
}

async function login(username) {
  return request(app)
    .post('/auth/login')
    .send({ username, password: 'password123' });
}

describe('OGMMS portals and RBAC', () => {
  jest.setTimeout(60000);
  let admin;
  let trainerUser;
  let memberUser;

  beforeAll(async () => {
    admin = await createUser('admin', 'ogmmsadmin');
    trainerUser = await createUser('trainer', 'ogmmstrainer');
    memberUser = await createUser('member', 'ogmmsmember');
    await Trainer.create({
      userId: trainerUser._id,
      fullName: 'Test Trainer',
      phone: '9999999999',
      speciality: 'strength',
      shift: 'morning',
    });
    const plan = await Plan.create({
      name: 'Test Plan',
      durationDays: 30,
      price: 500,
      features: ['Gym'],
      isActive: true,
    });
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + 20);
    await Member.create({
      userId: memberUser._id,
      fullName: 'Test Member',
      phone: '8888888888',
      planId: plan._id,
      trainerId: (await Trainer.findOne({ userId: trainerUser._id }))._id,
      validTill,
      status: 'active',
    });
  });

  it('rejects admin routes without a JWT', async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  it('logs admin in and opens the admin dashboard', async () => {
    const loginRes = await login('ogmmsadmin');
    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body.redirect).toBe('/admin/dashboard');
    const cookie = loginRes.headers['set-cookie'];
    const dash = await request(app).get('/admin/dashboard').set('Cookie', cookie);
    expect(dash.statusCode).toEqual(200);
    expect(dash.text).toContain('Admin Dashboard');
  });

  it('sends trainers to their roster, not admin', async () => {
    const loginRes = await login('ogmmstrainer');
    expect(loginRes.body.redirect).toBe('/trainers/dashboard');
    const cookie = loginRes.headers['set-cookie'];
    const roster = await request(app).get('/trainers/dashboard').set('Cookie', cookie);
    expect(roster.statusCode).toEqual(200);
    expect(roster.text).toContain('Assigned member roster');
    expect(roster.text).toContain('Test Member');
    const blocked = await request(app).get('/admin/dashboard').set('Cookie', cookie);
    expect(blocked.statusCode).toEqual(403);
  });

  it('shows member dashboard and payment history', async () => {
    const loginRes = await login('ogmmsmember');
    expect(loginRes.body.redirect).toBe('/members/dashboard');
    const cookie = loginRes.headers['set-cookie'];
    const dash = await request(app).get('/members/dashboard').set('Cookie', cookie);
    expect(dash.statusCode).toEqual(200);
    expect(dash.text).toContain('My gym dashboard');
    expect(dash.text).toContain('Payment history');
  });

  it('exports the active members report as CSV for admin', async () => {
    const loginRes = await login('ogmmsadmin');
    const cookie = loginRes.headers['set-cookie'];
    const csv = await request(app).get('/admin/reports/active?export=csv').set('Cookie', cookie);
    expect(csv.statusCode).toEqual(200);
    expect(csv.headers['content-type']).toMatch(/csv/);
    expect(csv.text).toContain('Name');
  });
});
