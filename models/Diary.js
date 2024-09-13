const mongoose = require("mongoose");

const DiarySchema = new mongoose.Schema({
  posters: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//MongoDB Collection named here - will give lowercase plural of name 
module.exports = mongoose.model("Diary", DiarySchema);