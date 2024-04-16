const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "coursecategorie",
    required: true,
  },
  totalSeats: {
    type: Number,
    default: 120,
  },
  courseInstructor: {
    type: String,
    required: true,
  },

  registeredStudents: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: true,
    },
  ],
});

module.exports = mongoose.model("course", courseSchema);
