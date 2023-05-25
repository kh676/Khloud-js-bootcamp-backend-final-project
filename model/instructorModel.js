const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const instructorModel = new Schema({
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
const instructor = mongoose.model("instructorModel", instructorModel);

module.exports = instructor;
