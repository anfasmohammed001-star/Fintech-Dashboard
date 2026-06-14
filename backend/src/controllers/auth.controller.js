const crypto = require('crypto');
const { isMock } = require('../config/db');
const User = require('../models/user.model');
const mockDbService = require('../services/mockDb.service');

const JWT_SECRET = process.env.JWT_SECRET || 'finsight-default-secure-secret-key-1337';

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const matchPassword = (enteredPassword, storedPassword) => {
  try {
    const [salt, hash] = storedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(enteredPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch (error) {
    return false;
  }
};

const generateToken = (userId) => {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `${userId}.${expiry}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64');
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let userExists;
    if (isMock()) {
      userExists = await mockDbService.findUserByEmail(email);
    } else {
      userExists = await User.findOne({ email });
    }

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const hashedPassword = hashPassword(password);
    let user;

    if (isMock()) {
      user = await mockDbService.createUser({ email, password: hashedPassword, name });
    } else {
      user = await User.create({ email, password: hashedPassword, name });
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let user;
    if (isMock()) {
      user = await mockDbService.findUserByEmail(email);
    } else {
      user = await User.findOne({ email });
    }

    if (!user || !matchPassword(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let user;
    if (isMock()) {
      user = await mockDbService.findUserById(req.userId);
    } else {
      user = await User.findById(req.userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: error.message });
  }
};
