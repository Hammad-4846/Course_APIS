const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryCode: {
    type: String,
    require: true,
    unique: true,
  },
  categoryName: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("coursecategorie", categorySchema);
