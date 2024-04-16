const router = require("express").Router();
const {
  loginUser,
  registerUser,
  getUserDetails,
  logoutController,
  forgotPassword,
  resetPassword,
  updateDetail,
  updatePassword
} = require("../controllers/userController");

//Middleware To Authenticate User
const { isAutheticatedUser } = require("../middlewares/isAuthenticatedUser");

//To Handle Multi-part Data
const multer = require("multer")
const upload = multer({dest : "uploads/"});


//User Authentication Routes
router.route("/auth/login").post(loginUser);
router.route("/auth/register").post(upload.single('file'), registerUser) ;
router.route("/auth/logout").get(logoutController);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);



//User Route
router.route("/user/update").put(isAutheticatedUser,upload.single("file"), updateDetail)
router.route("/user/update/password").put(isAutheticatedUser, updatePassword)
router.route("/auth/me").get(isAutheticatedUser, getUserDetails);

module.exports = router;
