const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Branch = require('../models/branch');

const JWT_SECRET = process.env.JWT_SECRET;

const registerBranch = async (req, res) => {
  try {
    const { branchName, location, ownerName, ownerEmail, password, phoneNumber, parent_name } = req.body; // EXTRACT THEM HERE!

    const existingBranch = await Branch.findOne({ name: branchName, location });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch already exists' });
    }

    const newBranch = await Branch.create({
      name: branchName,
      location,
      phoneNumber, // USE THEM HERE!
      parent_name  // AND HERE!
    });

    let owner = await User.findOne({ email: ownerEmail });

    if (owner) {
      // Add new branch to existing owner
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


module.exports = {
  registerBranch,
  registerSalesman,
  login,
};
