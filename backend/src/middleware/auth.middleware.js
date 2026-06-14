const crypto = require('crypto');
const { isMock } = require('../config/db');
const User = require('../models/user.model');
const mockDbService = require('../services/mockDb.service');

const JWT_SECRET = process.env.JWT_SECRET || 'finsight-default-secure-secret-key-1337';

const verifyToken = (tokenBase64) => {
  try {
    const token = Buffer.from(tokenBase64, 'base64').toString('utf-8');
    const [userId, expiry, signature] = token.split('.');
    if (!userId || !expiry || !signature) return null;
    if (Date.now() > Number(expiry)) return null;
    
    const payload = `${userId}.${expiry}`;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;
    
    return userId;
  } catch (error) {
    return null;
  }
};

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
  }

  try {
    let user;
    if (isMock()) {
      user = await mockDbService.findUserById(userId);
    } else {
      user = await User.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.userId = userId;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authorization error', error: error.message });
  }
};

module.exports = { protect, verifyToken };
