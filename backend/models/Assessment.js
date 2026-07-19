const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  age: {
    type: Number,
    required: true,
  },

  gender: {
    type: String,
    required: true,
  },

  tinnitus_type: {
    type: String,
    required: true,
  },

  affected_ear: {
    type: String,
    required: true,
  },

  frequency_hz: {
    type: Number,
    required: true,
  },

  loudness_db: {
    type: Number,
    required: true,
  },

  hearing_loss: {
    type: String,
    required: true,
  },

  thi_score: {
    type: Number,
    required: true,
  },

  tfi_score: {
    type: Number,
    required: true,
  },

  hads_anxiety: {
    type: Number,
    required: true,
  },

  hads_depression: {
    type: Number,
    required: true,
  },

  sleep_score: {
    type: Number,
    required: true,
  },

  treatment: {
    type: String,
    required: true,
  },

  outcome: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assessment", assessmentSchema);