const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Make sure the path is correct

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from header
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admin role required' });
    }

    req.user = user; // Attach user object to the request
    next(); // Proceed to the next middleware/route handler

  } catch (error) {
    console.error("Error in isAdmin middleware:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    return res.status(500).json({ message: 'Failed to authenticate', error: error.message });
  }
};

module.exports = isAdmin;