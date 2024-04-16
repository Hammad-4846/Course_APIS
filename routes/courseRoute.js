const {
    createCategory,
    getAllCategories,
    createCourse,
    getAllCourses,
    registerCourse,
    updateCourse,
    deleteCourse,
    getCourseDetail,
    getUserRegisteredCourses,
  } = require("../controllers/courseController");
  const { isAutheticatedUser,isAdminUser } = require("../middlewares/isAuthenticatedUser");
  
  const router = require("express").Router();
  
  //Admin Route
  router.route("/course/createcourse").post(isAdminUser, createCourse);
  router.route("/course/createcategory").post(isAdminUser, createCategory);
  router.route("/course/update").put(isAdminUser,updateCourse);
  router.route("/course/delete/:courseId").delete(isAdminUser,deleteCourse);
  
  
  router.route("/course/detail").post(getCourseDetail);
  router.route("/course/courses").get(getAllCourses);
  router.route("/course/allcategory").get(isAutheticatedUser, getAllCategories);
  router.route("/course/register").post(isAutheticatedUser, registerCourse);
  router.route("/course/mycourse").get(isAutheticatedUser,getUserRegisteredCourses);
  
  module.exports = router;
  