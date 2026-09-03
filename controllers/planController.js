const Plan = require('../models/Plan');
const Member = require('../models/Member');
const { planSchema, planUpdateSchema } = require('../utils/validators');
const { logAudit } = require('../utils/auditLog');

module.exports.list_get = async (req, res) => {
  const plans = await Plan.find().lean();
  res.render('admin/plans', { title: 'Membership Plans', plans });
};

module.exports.new_get = (req, res) => {
  res.render('admin/planForm', { title: 'New Plan', plan: null });
};

module.exports.create_post = async (req, res) => {
  const { error, value } = planSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    req.flash('error_msg', error.details.map((d) => d.message).join(', '));
    return res.redirect('/admin/plans/new');
  }
  try {
    const features = Array.isArray(value.features)
      ? value.features
      : String(value.features || '')
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean);
    const plan = await Plan.create({
      name: value.name,
      durationDays: value.durationDays,
      price: value.price,
      features,
    });
    await logAudit(req, { action: 'create', entity: 'Plan', entityId: plan._id, details: plan.name });
    req.flash('success_msg', 'Plan created.');
    res.redirect('/admin/plans');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/plans/new');
  }
};

module.exports.edit_get = async (req, res) => {
  const plan = await Plan.findById(req.params.id).lean();
  if (!plan) {
    req.flash('error_msg', 'Plan not found.');
    return res.redirect('/admin/plans');
  }
  res.render('admin/planForm', { title: 'Edit Plan', plan });
};

module.exports.update_put = async (req, res) => {
  try {
    const { error, value } = planUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) throw new Error(error.details.map((d) => d.message).join(', '));
    const { name, durationDays, price, features } = value;
    const featureList = String(features || '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    await Plan.findByIdAndUpdate(req.params.id, {
      name,
      durationDays,
      price,
      features: featureList,
    });
    await logAudit(req, { action: 'update', entity: 'Plan', entityId: req.params.id, details: name });
    req.flash('success_msg', 'Plan updated.');
    res.redirect('/admin/plans');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/plans');
  }
};

module.exports.delete_delete = async (req, res) => {
  try {
    const inUse = await Member.findOne({ planId: req.params.id });
    if (inUse) {
      await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
      await logAudit(req, { action: 'soft-delete', entity: 'Plan', entityId: req.params.id });
      req.flash('success_msg', 'Plan is in use and was deactivated (soft-delete).');
    } else {
      await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
      await logAudit(req, { action: 'soft-delete', entity: 'Plan', entityId: req.params.id });
      req.flash('success_msg', 'Plan deactivated.');
    }
    res.redirect('/admin/plans');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/plans');
  }
};
