const { error, success } = require("../utils/responseWrapper");
const courseCategoryModal = require("../models/courseCategoryModal");
const courseModal = require("../models/courseModal");
const ApiFeatures = require("../utils/apiFeature");
const UserModal = require("../models/UserModal");

exports.createCourse = async (req, res) => {
  try {
    const { courseName, category, courseInstructor } = req.body;

    if (!category || !courseName || !courseInstructor) {
      return res.send(error(404, "All Field Are required"));
    }

    // Checking If the Course Category Exists or Not
    let categoryChecker = await courseCategoryModal.findById({
      _id: category,
    });

    if (!categoryChecker) {
      return res
        .status(409)
        .send(error(409, "Provided Cocurse Category is Not Found"));
    }

    const newCourse = await courseModal.create({
      category,
      courseInstructor,
      courseName,
    });

    return res.status(201).send(success(201, newCourse));
  } catch (e) {
    return res.status(500).send(error(500, e.message));
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const resultPerPage = 3;

    const productsCount = await courseModal.countDocuments();

    //For Filtering Part we are using ternary operator because maybe user would not use pagination  at all so we have to handle that case also
    //Also Query of MongoDb can be used only 1 time that's why we are doing stuff on apiFeature not on the Model itslelf
    const apiFeature = req.query.page
      ? new ApiFeatures(courseModal.find(), req.query)
          .search()
          .filter()
          .pagination(resultPerPage)
      : new ApiFeatures(courseModal.find(), req.query).search().filter();

    let courses = await apiFeature.query;

    let filteredProductsCount = courses.length;

    res.status(200).send(
      success(200, {
        courses,
        filteredProductsCount,
        totalProducts: productsCount,
      })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.registerCourse = async (req, res) => {
  try {
    const { courseName } = req.body;
    const { user } = req;
    const course = await courseModal.findById({ _id: courseName });

    if (!course) {
      return res.send(error(404, "Course Not Found"));
    }

    if (course.totalSeats == 0) {
      return res.send(error(404, "Seats Full in this Course"));
    }

    const isAlreadyTaken = course.registeredStudents.find(
      (userId) => userId == user._id.toString()
    );

    if (isAlreadyTaken) {
      return res.send(
        error(400, "User is Already Registered  for This Course")
      );
    }

    course.registeredStudents.push(user._id);
    course.totalSeats -= 1;

    user.courses.push(course._id);

    await course.save();
    await user.save();

    return res
      .status(200)
      .send(
        success(201, "Registration For The Provided Course  Successfully Done!")
      );
  } catch (e) {
    return res.status(500).send(error(500, e.message));
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, categoryCode } = req.body;

    if (!categoryName || !categoryCode) {
      return res.send(error(400, "Provide All The Fields"));
    }

    let newCategory = await courseCategoryModal.findOne({ categoryCode });

    if (newCategory) {
      return res.send(error(400, "This Category Is Already Been Created"));
    }

    const category = await courseCategoryModal.create({
      categoryCode,
      categoryName,
    });

    return res.send(success(201, category));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await courseCategoryModal.find();
    return res.status(200).send(success(200, categories));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await courseModal.findById({ _id: courseId });

    if (!course) {
      return res.send(error(404, "Course not found"));
    }

    //For Deleting Particular Course First we should  remove it from userRef table then only delete the record in courses collec.
    //The Loop Will run at max 120 Time as maxSeats for particular course are 120
    course.registeredStudents.forEach(async (userID) => {
      const user = await UserModal.findById({ _id: userID });
      user.courses = user.courses.filter((course) => course != courseId);

      await user.save();
    });

    await courseModal.deleteOne({ _id: courseId });

    return res.send(success(200, "Couse Is Deleted Succesfully"));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { courseName, courseInstructor, courseId, totalSeats } = req.body;
    const course = await courseModal.findById(courseId);

    if (!course) {
      return res.send(error(404, "Course In Not Found"));
    }

    if (courseName) {
      course.courseName = courseName;
    }

    if (courseInstructor) {
      course.courseInstructor = courseInstructor;
    }

    if (totalSeats) {
      course.totalSeats = totalSeats;
    }

    await course.save();
    return res.send(
      success(200, {
        message: "Course Is Updated Succesfully",
        course,
      })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.getCourseDetail = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await courseModal.findById(courseId);

    if(!course){
      return res.send(error(404,"Course is not found"));
    }

    return res.send(success(200, course));
  } catch (e) {
    return res.send(error(500, e.message));
  }
};

exports.getUserRegisteredCourses = async (req, res) => {
  try {
    const user = await req.user.populate("courses");

    let userCourses = [];

    for (let course of user.courses) {
      userCourses.push({
        CourseName: course.courseName,
        CourseInstructor: course.courseInstructor,
        CourseId: course._id,
      });
    }
    return res.send(
      success(200, { totalRegisteredCourse: userCourses.length, userCourses })
    );
  } catch (e) {
    return res.send(error(500, e.message));
  }
};
