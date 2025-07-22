const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const DATA_FILE = path.join(__dirname, 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }));
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
const getUsers = () => {
  return JSON.parse(fs.readFileSync(DATA_FILE)).users;
};

const saveUsers = (users) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users }, null, 2));
};

// Routes

// Register
app.post('/api/register', (req, res) => {
  const { email, password, username } = req.body;
  const users = getUsers();

  // Basic validation
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  // Check if user exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Create new user (password stored in plaintext - for learning only!)
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password, // Storing plaintext password - NOT secure for production!
    username,
    role: users.length === 0 ? 'admin' : 'user',
    userData: {
      id: `user_${Date.now()}`,
      firstName: "Trader",
      lastName: Math.floor(1000 + Math.random() * 9000).toString(),
      username,
      email,
      role: users.length === 0 ? 'admin' : 'user',
      balance: 0,
      totalProfit: 0,
      winCount: 0,
      totalTrades: 0,
      transactions: [],
      tradingHistory: []
    }
  };

  users.push(newUser);
  saveUsers(users);

  res.json({ 
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      userData: newUser.userData
    }
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();

  // Find user by email
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  // Compare plaintext passwords (NOT secure - for learning only!)
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
});

// Save user data
app.post('/api/save-data', (req, res) => {
  const { userId, userData } = req.body;
  const users = getUsers();

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(400).json({ error: 'User not found' });
  }

  users[userIndex].userData = userData;
  saveUsers(users);

  res.json({ success: true });
});

// Get user data by ID
app.get('/api/user', (req, res) => {
  const { userId, email } = req.query;
  const users = getUsers();

  const user = users.find(u => u.id === userId && u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return only necessary data (excluding password)
  const { id, username, email: userEmail, role, userData } = user;
  res.json({ id, username, email: userEmail, role, userData });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`User data stored in: ${DATA_FILE}`);
});