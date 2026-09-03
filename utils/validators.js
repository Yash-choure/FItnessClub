const Joi = require('joi');

const phoneSchema = Joi.string().pattern(/^\d{10}$/).messages({ 'string.pattern.base': 'Phone must contain exactly 10 digits.' });

const dobSchema = Joi.date().max('now').required().messages({ 'date.max': 'Date of birth cannot be in the future.' });

const memberSchema = Joi.object({
  username: Joi.string().min(4).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: phoneSchema.required(),
  dob: dobSchema,
  gender: Joi.string().valid('M', 'F', 'O').required(),
  address: Joi.string().allow('', null),
  emergencyContactName: Joi.string().allow('', null),
  emergencyContactPhone: phoneSchema.allow('', null),
  fitnessGoals: Joi.string().allow('', null),
  planId: Joi.string().required(),
});

const planSchema = Joi.object({
  name: Joi.string().required(),
  durationDays: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  features: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
});

const memberUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).required(),
  phone: phoneSchema.required(),
  address: Joi.string().allow('', null),
  gender: Joi.string().valid('M', 'F', 'O').required(),
  status: Joi.string().valid('active', 'expired', 'frozen').required(),
  planId: Joi.string().allow('', null),
  trainerId: Joi.string().allow('', null),
  emergencyContactName: Joi.string().allow('', null),
  emergencyContactPhone: phoneSchema.allow('', null),
  fitnessGoals: Joi.string().allow('', null),
});

const planUpdateSchema = planSchema;

const trainerSchema = Joi.object({
  username: Joi.string().min(4).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().required(),
  phone: phoneSchema.required(),
  speciality: Joi.string().allow('', null),
  shift: Joi.string().valid('morning', 'evening', 'both').required(),
  certification: Joi.string().allow('', null),
});

const trainerUpdateSchema = Joi.object({
  fullName: Joi.string().required(),
  phone: phoneSchema.required(),
  speciality: Joi.string().allow('', null),
  shift: Joi.string().valid('morning', 'evening', 'both').required(),
  certification: Joi.string().allow('', null),
});

module.exports = { memberSchema, memberUpdateSchema, planSchema, planUpdateSchema, trainerSchema, trainerUpdateSchema };
