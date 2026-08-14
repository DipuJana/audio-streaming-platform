const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  trackId: { type: Number, required: true },
  trackName: { type: String, required: true },
  artistName: { type: String, required: true },
  previewUrl: { type: String, required: true },
  artworkUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);