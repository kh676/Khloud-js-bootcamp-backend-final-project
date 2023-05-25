const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const courseModel = new Schema({
  name: String,
  description: String,
  code: String,
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "instructorModel",
  },

  student: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "studentrModel",
    },
  ],
});
const course = mongoose.model("courseModel", courseModel);

module.exports = course;
