const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Favorite = require('./models/Favorite');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/audio_db_b';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ Connection Error:', err));

// Auth Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 2. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. GET USER FAVORITES (Protected)
app.get('/api/favorites', authenticateToken, async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json(favorites);
});

// 4. SAVE USER FAVORITE (Protected)
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { trackId, trackName, artistName, previewUrl, artworkUrl } = req.body;
    const newFav = new Favorite({
      userId: req.user.userId,
      trackId,
      trackName,
      artistName,
      previewUrl,
      artworkUrl
    });
    await newFav.save();
    res.status(201).json(newFav);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save song' });
  }
});

// 5. DELETE USER FAVORITE (Protected)
app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  await Favorite.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  res.json({ message: 'Removed from favorites' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});