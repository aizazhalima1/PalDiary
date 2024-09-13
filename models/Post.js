const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  diaryId:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Diary",
  },
  poster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  text: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
});

//MongoDB Collection named here - will give lowercase plural of name 
module.exports = mongoose.model("Post", PostSchema);