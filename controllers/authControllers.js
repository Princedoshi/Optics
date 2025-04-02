const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Branch = require('../models/branch');

const JWT_SECRET = process.env.JWT_SECRET;

const registerBranch = async (req, res) => {
  try {
    // 1. Destructure googlePlaceId from the request body
    const {
      branchName,
      location,
      ownerName,
      ownerEmail,
      password,
      phoneNumber,
      parent_name,
      googlePlaceId // <-- Add this
    } = req.body;

    console.log("Received data:", req.body); // Log received data for debugging

    // Optional but recommended: Add validation check for googlePlaceId early
    if (!googlePlaceId || typeof googlePlaceId !== 'string' || googlePlaceId.trim() === '') {
        return res.status(400).json({ message: 'A valid Google Place ID is required.' });
    }
     if (!branchName || !location || !ownerName || !ownerEmail || !password || !phoneNumber || !parent_name) {
       return res.status(400).json({ message: 'Missing one or more required fields.' });
     }


    const existingBranch = await Branch.findOne({ name: branchName, location });
    if (existingBranch) {
      // Maybe add googlePlaceId check here too if it should be unique per name/location
      return res.status(400).json({ message: 'Branch with this name and location already exists' });
    }

    // 2. Include googlePlaceId when creating the new branch
    const newBranch = await Branch.create({
      name: branchName,
      location,
      phoneNumber,
      parent_name,
      googlePlaceId: googlePlaceId.trim() // <-- Pass it here (trimming is good practice)
    });

    console.log("New branch created:", newBranch);

    // --- Owner creation/update logic (remains the same) ---
    let owner = await User.findOne({ email: ownerEmail });

    if (owner) {
       // Check if branch ID is already associated (important for idempotency)
      if (!owner.branchIds.some(id => id.equals(newBranch._id))) {
        owner.branchIds.push(newBranch._id);
        await owner.save();
         console.log(`Branch ${newBranch._id} added to existing owner ${ownerEmail}`);
      } else {
           console.log(`Branch ${newBranch._id} already associated with owner ${ownerEmail}`);
      }
    } else {
      // Hash password only if creating a new user
      const hashedPassword = await bcrypt.hash(password, 10);
      owner = await User.create({
        name: ownerName,
        email: ownerEmail,
        passwordHash: hashedPassword,
        role: 'owner',
        branchIds: [newBranch._id], // Associate the new branch
      });
       console.log(`New owner ${ownerEmail} created with branch ${newBranch._id}`);
    }
    // --- End Owner logic ---


    // Return success response
    res.status(201).json({
      message: 'Branch registered successfully',
      branch: newBranch,
      // Avoid sending sensitive owner info like passwordHash back unless necessary
       owner: { _id: owner._id, name: owner.name, email: owner.email, role: owner.role, branchIds: owner.branchIds },
    });

  } catch (error) {
    // Log the detailed error for server-side debugging
    console.error("Error registering branch:", error);

     // Handle potential validation errors more specifically
     if (error.name === 'ValidationError') {
        // Extract meaningful messages from Mongoose validation error
        const messages = Object.values(error.errors).map(el => el.message);
        return res.status(400).json({ message: "Validation failed", errors: messages });
    }

    // Generic server error for other issues
    res.status(500).json({ message: 'Error registering branch', error: error.message });
  }
};

const registerSalesman = async (req, res) => {
  try {
    const { name, email, password, branchId } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const salesman = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'salesman',
      branchIds: [branchId],
    });

    res.status(201).json({ message: 'Salesman registered successfully', salesman });
  } catch (error) {
    res.status(500).json({ message: 'Error registering salesman', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and populate branch details
    const user = await User.findOne({ email }).populate('branchIds');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Extract branch IDs
    const branchIds = user.branchIds.map(b => b._id);

    // Extract Google Place IDs separately
    const googlePlaceIds = user.branchIds.map(b => ({
      branchId: b._id,
      googlePlaceId: b.googlePlaceId,
    }));

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        branchIds,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ message: 'Login successful', token, user, googlePlaceIds });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};


const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'An admin user already exists.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'admin',
    });

    res.status(201).json({ message: 'Admin user created successfully', adminUser });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
};

const changePassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password
        user.passwordHash = hashedPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

module.exports = {
  registerBranch,
  registerSalesman,
  login,
  registerAdmin,
  changePassword, // Export the new function
};