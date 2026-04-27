const userService = require('../services/user.service');

async function registerUser(req, res, next) {
  try {
    const user = await userService.registerUser(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  registerUser
};