const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Favorite = require('./models/Favorite');

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`📩 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Connect to Dockerized MongoDB on Port 27018
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/audio_db_b';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to Docker MongoDB on Port 27018!'))
  .catch((err) => console.error('❌ Connection Error:', err));

// GET Saved Songs
app.get('/api/favorites', async (req, res) => {
  const favorites = await Favorite.find().sort({ createdAt: -1 });
  res.json(favorites);
});

// SAVE Song
app.post('/api/favorites', async (req, res) => {
  try {
    const { trackId, trackName, artistName, previewUrl, artworkUrl } = req.body;
    const newFav = new Favorite({ trackId, trackName, artistName, previewUrl, artworkUrl });
    await newFav.save();
    res.status(201).json(newFav);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save song' });
  }
});

// DELETE Song
app.delete('/api/favorites/:id', async (req, res) => {
  await Favorite.findByIdAndDelete(req.params.id);
  res.json({ message: 'Removed from favorites' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});