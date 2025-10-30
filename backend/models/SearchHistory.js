const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  term: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Índice para mejorar búsquedas por usuario
searchHistorySchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);