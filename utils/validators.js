const Joi = require('joi');

const memberSchema = Joi.object({
  username: Joi.string().min(4).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^\d{10}$/).required(),
  dob: Joi.date().required(),
  gender: Joi.string().valid('M', 'F', 'O').required(),
  address: Joi.string().allow('', null),
  emergencyContactName: Joi.string().allow('', null),
  emergencyContactPhone: Joi.string().allow('', null),
  fitnessGoals: Joi.string().allow('', null),
  planId: Joi.string().required(),
});

const planSchema = Joi.object({
  name: Joi.string().required(),
  durationDays: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
  features: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
});

const trainerSchema = Joi.object({
  username: Joi.string().min(4).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().required(),
  phone: Joi.string().required(),
  speciality: Joi.string().allow('', null),
  shift: Joi.string().valid('morning', 'evening', 'both').required(),
  certification: Joi.string().allow('', null),
});

const trainerUpdateSchema = Joi.object({
  fullName: Joi.string().required(),
  phone: Joi.string().required(),
  speciality: Joi.string().allow('', null),
  shift: Joi.string().valid('morning', 'evening', 'both').required(),
  certification: Joi.string().allow('', null),
});

module.exports = { memberSchema, planSchema, trainerSchema, trainerUpdateSchema };
