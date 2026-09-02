const request = require('supertest');
const app = require('../server'); // Adjust the path to your server.js file


describe('Signup Endpoint', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/pricing');
  });

  it('should fail if passwords do not match', async () => {
    const res = await request(app)
      .post('/signup')
      .send({
        username: 'newuser',
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        confirmPassword: 'password321'
      });

    expect(res.statusCode).toEqual(302);
    expect(res.headers.location).toBe('/');
  });
});