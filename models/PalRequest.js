const mongoose = require('mongoose');

const PalRequestSchema = new mongoose.Schema({
    diaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Diary' },
    receiverUserName:{type: String},
    requesterUserName:{type: String},
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PalRequest", PalRequestSchema);