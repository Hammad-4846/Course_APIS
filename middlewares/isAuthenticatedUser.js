const jwt = require("jsonwebtoken");
const User = require("../models/UserModal");
const { error } = require("../utils/responseWrapper");

exports.isAutheticatedUser = async (req, res, next) => {
  try {
    const { courseToken } = req.cookies;

    if (!courseToken) {
      return res.send(error(404, "You Need To Login To access This Resource"));
    }

    const decodedData = jwt.verify(courseToken, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    next();
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.isAdminUser = async (req, res, next) => {
  try {
    const { courseToken } = req.cookies;

    if (!courseToken) {
      return res.send(error(404, "You Need To Login To access This Resource"));
    }

    const decodedData = jwt.verify(courseToken, process.env.JWT_SECRET);

    req.user = await User.findById(decodedData.id);

    if (req.user.isAdmin !== true) {
      return res
        .status(401)
        .send(error(401, "Permission  Denied! You are not admin user"));
    }

    next();
  } catch (e) {
    return res.send(error(500, e.message));
  }
};
