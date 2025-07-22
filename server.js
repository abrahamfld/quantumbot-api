const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// MongoDB Atlas connection
// MongoDB Atlas connection (corrected)
mongoose.connect('mongodb+srv://quantumbot:Master%401234@cluster0.w45bvhe.mongodb.net/quantumbotDB?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema (matches your existing JSON structure)
const userSchema = new mongoose.Schema({
  id: String,
  email: { type: String, unique: true },
  password: String, // Still plaintext to match your current behavior
  username: String,
  role: String,
  userData: {
    id: String,
    firstName: String,
    lastName: String,
    username: String,
    email: String,
    role: String,
    balance: Number,
    totalProfit: Number,
    winCount: Number,
    totalTrades: Number,
    transactions: Array,
    tradingHistory: Array
  }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Maintained identical response structure

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userCount = await User.countDocuments();
    const newUser = new User({
      id: `user_${Date.now()}`,
      email,
      password, // Still plaintext
      username,
      role: userCount === 0 ? 'admin' : 'user',
      userData: {
        id: `user_${Date.now()}`,
        firstName: "Trader",
        lastName: Math.floor(1000 + Math.random() * 9000).toString(),
        username,
        email,
        role: userCount === 0 ? 'admin' : 'user',
        balance: 0,
        totalProfit: 0,
        winCount: 0,
        totalTrades: 0,
        transactions: [],
        tradingHistory: []
      }
    });

    await newUser.save();

    res.json({ 
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        userData: newUser.userData
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Still plaintext comparison
    if (user.password !== password) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        userData: user.userData
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save user data
app.post('/api/save-data', async (req, res) => {
  const { userId, userData } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { id: userId },
      { userData },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user data by ID
app.get('/api/user', async (req, res) => {
  const { userId, email } = req.query;

  try {
    const user = await User.findOne({ id: userId, email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id, username, email: userEmail, role, userData } = user;
    res.json({ id, username, email: userEmail, role, userData });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Home route
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Server is live and running',
    timestamp: new Date().toISOString(),
    apiEndpoints: {
      getUser: '/api/user?userId=<id>&email=<email>',
      // Add other available endpoints here
    }
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using MongoDB Atlas for data storage');
});
