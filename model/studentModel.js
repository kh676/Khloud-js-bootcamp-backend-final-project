const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const studentModel = new Schema({
  name: { type: String, require },
  psaaword: {
    type: String,
    select: false,
  },
  course: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "courseModel",
    },
  ],
});
const student = mongoose.model("studentrModel", studentModel);

module.exports = student;
