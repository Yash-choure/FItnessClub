const { memberSchema, memberUpdateSchema, planSchema, trainerSchema } = require('../utils/validators');

describe('OGMMS validation rules', () => {
  const validMember = {
    username: 'member123',
    email: 'member@example.com',
    password: 'password123',
    fullName: 'Test Member',
    phone: '9876543210',
    dob: '1995-01-01',
    gender: 'O',
    planId: '507f1f77bcf86cd799439011',
  };

  it('rejects future member date of birth and invalid phone numbers', () => {
    const result = memberSchema.validate({ ...validMember, dob: '2099-01-01', phone: '12345' });
    expect(result.error).toBeDefined();
    expect(result.error.details.map((detail) => detail.message).join(' ')).toMatch(/future|10 digits/);
  });

  it('allows free plans', () => {
    expect(planSchema.validate({ name: 'Trial', durationDays: 7, price: 0 }).error).toBeUndefined();
  });

  it('validates member updates and trainer phone numbers', () => {
    const update = memberUpdateSchema.validate({ fullName: 'Test Member', phone: '9876543210', gender: 'O', status: 'active' });
    const trainer = trainerSchema.validate({ username: 'trainer123', email: 'trainer@example.com', password: 'password123', fullName: 'Test Trainer', phone: '12345', shift: 'morning' });
    expect(update.error).toBeUndefined();
    expect(trainer.error).toBeDefined();
  });
});
