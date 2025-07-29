const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://quantumbot:Master%401234@cluster0.w45bvhe.mongodb.net/quantumbotDB?retryWrites=true&w=majority')
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema with unique username
const userSchema = new mongoose.Schema({
  id: String,
  email: { type: String, unique: true },
  password: String,
  username: { type: String, unique: true }, // Added unique constraint
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

// Routes

// Register (updated to check for duplicate username)
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    // Check for existing email or username
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { username }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const userCount = await User.countDocuments();
    const newUser = new User({
      id: `user_${Date.now()}`,
      email,
      password,
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
    if (err.code === 11000) { // MongoDB duplicate key error
      if (err.keyPattern.email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      if (err.keyPattern.username) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user data by ID or email (existing route)
app.get('/api/user', async (req, res) => {
  const { userId, email } = req.query;

  try {
    const user = await User.findOne({ 
      $or: [
        { id: userId },
        { email }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id, username, email: userEmail, role, userData } = user;
    res.json({ id, username, email: userEmail, role, userData });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// New route: Get user data by username
app.get('/api/user/by-username/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { id, email, role, userData } = user;
    res.json({ 
      id,
      username,
      email,
      role,
      userData
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Home route with database connection test
app.get('/', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    
    res.status(200).json({ 
      status: 'success',
      message: 'Server is live and running',
      database: 'Connected to MongoDB Atlas',
      timestamp: new Date().toISOString(),
      apiEndpoints: {
        getUser: '/api/user?userId=<id>&email=<email>',
        getUserByUsername: '/api/user/by-username/<username>',
        register: '/api/register (POST)',
        login: '/api/login (POST)',
        saveData: '/api/save-data (POST)'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error',
      message: 'Server is running but database connection failed',
      database: 'Connection to MongoDB Atlas failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using MongoDB Atlas for data storage');
});
