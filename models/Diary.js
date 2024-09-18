const mongoose = require("mongoose");

const DiarySchema = new mongoose.Schema({
  posters: { 
    type: [String], 
    required: true 
  },
  postersId: { 
    type: [mongoose.Schema.Types.ObjectId], 
    ref: 'User', 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//MongoDB Collection named here - will give lowercase plural of name 
module.exports = mongoose.model("Diary", DiarySchema);