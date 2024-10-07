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

module.exports = mongoose.model("Diary", DiarySchema);