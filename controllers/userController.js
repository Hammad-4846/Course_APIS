const { Resend } = require("resend");
const UserModal = require("../models/UserModal");
const { error, success } = require("../utils/responseWrapper");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const fs = require("@cyclic.sh/s3fs")(process.env.CYCLIC_BUCKET_NAME)

//TO Send Emails
const resend = new Resend(process.env.RESEND_KEY);

exports.registerUser = async (req, res) => {
  try {
    let { name, email, password, isAdmin } = req.body;
    let file = req.file;
    if (!name || !email || !password || !file) {
      return res.send(error(400, "Please provide all the details. NAME | EMAIL | PASS | AVATAR"));
    }

    if (!isAdmin) {
      isAdmin = false;
    } else {
      isAdmin = true;
    }

    const isAlreadyExist = await UserModal.findOne({ email });
    if (isAlreadyExist) {
      return res.send(error(400, "User Is Already Exist."));
    } 

    //Upload the img to cloudinary
    imageUrl = await cloudinary.uploader.upload(file.path, {
      folder: "user",
    });

    // Delete the file from local filesystem
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });

    const user = await UserModal.create({
      name,
      email,
      password,
      isAdmin,
      avatar: {
        public_id: imageUrl.public_id,
        url: imageUrl.secure_url,
      },
    });

    const token = user.getJWTToken();

    //options for cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    res.cookie("courseToken", token, options);
    res.send(success(201, "User Created Succesfully"));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.send(error(401, "Please Enter Valid Email And Password"));
    }

    const user = await UserModal.findOne({ email }).select("+password");

    if (!user) {
      return res.send(error(401, "Invalid Email And Password"));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.send(error(401, "Invalid Email And Password"));
    }

    const token = user.getJWTToken();

    //options for cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    res.cookie("courseToken", token, options);
    res.send(success(201, user));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

exports.logoutController = (req, res) => {
  try {
    res.clearCookie("courseToken", {
      httpOnly: true,
      secure: true,
    });

    return res.send(success(200, "Logged out successfully"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

//Get user Detail
exports.getUserDetails = async (req, res) => {
  res.send(success(200, req.user));
};

//Update user Details
exports.updateDetail = async (req, res) => {
  try {
    const { name, email } = req.body;
    const file = req.file;

    const user = await UserModal.findById(req.user._id);

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email;
    }

    if (file) {
      //First Delete the Old Picture from cloud;
      await cloudinary.uploader.destroy(user.avatar.public_id);
      const newImg = await cloudinary.uploader.upload(file.path, {
        folder: "user",
      });

      // Delete the file from local filesystem
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });

      user.avatar = {
        public_id: newImg.public_id,
        url: newImg.secure_url,
      };
    }

    await user.save();

    res.status(200).send(success(200, "User Data is Succesfully Updated"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};
//Update update Password
exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.send(error(400, "Please Provide All the Fields"));
    }

    const user = await UserModal.findById(req.user._id).select("+password");

    const isPasswordMatched = await user.comparePassword(oldPassword);

    if (!isPasswordMatched) {
      return res.send(error(401, "Invalid Old Password"));
    }

    user.password = newPassword;

    await user.save();

    res.status(200).send(success(200, "Passwrod is  Updated"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await UserModal.findOne({ email: req.body.email });

    if (!user) {
      return res.send(error(404, "User not found"));
    }

    // Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/password/reset/${resetToken}`;

    const message = `${resetPasswordUrl}`;

    try {
      const { data, error } = await resend.emails.send({
        from: "authentication@resend.dev",
        to: user.email,
        text: message,
        subject: "Password Reset Email FROM IRegistration",
      });

      if (data) {
        res.status(200).json({
          success: true,
          message: `Email sent to ${user.email} successfully`,
        });
      } else {
        console.log(error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        return res.status(500).json({ message: e.message });
      }
    } catch (e) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.send(error(500, e.message));
    }
  } catch (e) {
    res.send(error(500, e.message));
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await UserModal.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.send(
        error(400, "Reset Password Token is invalid or has been expired")
      );
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.send(error(400, "Password does not password"));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.send(success(200, "Password Changed"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
  // creating token hash
};
