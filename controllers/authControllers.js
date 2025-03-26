const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Branch = require('../models/branch');

const JWT_SECRET = process.env.JWT_SECRET;

const registerBranch = async (req, res) => {
  try {
    const { branchName, location, ownerName, ownerEmail, password, phoneNumber, parent_name } = req.body;
    console.log("branchName", branchName);

    const existingBranch = await Branch.findOne({ name: branchName, location });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch already exists' });
    }

    const newBranch = await Branch.create({
      name: branchName,
      location,
      phoneNumber,
      parent_name
    });

    console.log("newBranch", newBranch);

    let owner = await User.findOne({ email: ownerEmail });

    if (owner) {
      if (!owner.branchIds.includes(newBranch._id)) {
        owner.branchIds.push(newBranch._id);
        await owner.save();
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      owner = await User.create({
        name: ownerName,
        email: ownerEmail,
        passwordHash: hashedPassword,
        role: 'owner',
        branchIds: [newBranch._id],
      });
    }

    res.status(201).json({
      message: 'Branch registered successfully',
      branch: newBranch,
      owner,
    });
  } catch (error) {
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

    const user = await User.findOne({ email }).populate('branchIds');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        branchIds: user.branchIds.map(b => b._id),
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, user });
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