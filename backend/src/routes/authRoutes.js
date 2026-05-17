import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { readUsers, writeUsers } from '../utils/userStore.js';

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );

const toSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  location: user.location || '',
  nationality: user.nationality || '',
  dateOfBirth: user.dateOfBirth || '',
});

router.post('/signup', async (req, res) => {
  try {
    const { name = '', email = '', password = '' } = req.body || {};
    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password);

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const users = await readUsers();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const newUser = {
      id: randomUUID(),
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      location: 'Bangalore, India',
      nationality: 'Indian',
      dateOfBirth: '01 Jan 1998',
    };

    users.push(newUser);
    await writeUsers(users);

    const token = signToken(newUser);
    return res.status(201).json({ token, user: toSafeUser(newUser) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPassword = String(password);

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = await readUsers();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.status(200).json({ token, user: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find((entry) => entry.id === req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

export default router;
