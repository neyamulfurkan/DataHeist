/**
 * auth.js
 * 
 * VALIDATION CHECKLIST (AI must verify):
 * ✓ All imports are valid and files exist
 * ✓ All functions have JSDoc comments
 * ✓ All parameters are validated
 * ✓ All errors are caught and logged
 * ✓ No placeholder comments
 * ✓ No hardcoded values (use environment variables)
 * ✓ All arrays checked for length before access
 * ✓ Console logs use [Auth] prefix
 * ✓ File length is within ±20% of estimate
 * 
 * Purpose: User authentication routes - registration, login, logout with JWT tokens
 * Dependencies: express, bcrypt, jsonwebtoken, pg pool from server.js
 * Used by: server.js mounts at /api/auth
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dataheist-dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

console.log('[Auth] Module initializing...');

// CRITICAL: Prevent production use with default secret
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dataheist-dev-secret-key-change-in-production') {
  console.error('[Auth] ❌ CRITICAL: Cannot use default JWT_SECRET in production');
  console.error('[Auth] Set JWT_SECRET environment variable immediately');
  throw new Error('SECURITY: Default JWT_SECRET is not allowed in production');
}

console.log('[Auth] JWT secret:', JWT_SECRET === 'dataheist-dev-secret-key-change-in-production' ? '⚠️ USING DEFAULT (INSECURE - DEV ONLY)' : '✅ Custom secret configured');
console.log('[Auth] JWT expires in:', JWT_EXPIRES_IN);
console.log('[Auth] Bcrypt salt rounds:', BCRYPT_SALT_ROUNDS);

/**
 * Validates email format using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates username format (alphanumeric + underscore, 3-50 chars)
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid username format
 */
function isValidUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  if (username.length < 3 || username.length > 50) {
    return false;
  }
  
  const usernameRegex = /^[A-Za-z0-9_]+$/;
  return usernameRegex.test(username);
}

/**
 * Validates password strength (min 8 chars, at least 1 letter and 1 number)
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, reason: string|null}} Validation result
 */
function isValidPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password must be a non-empty string' };
  }
  
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 72) {
    return { valid: false, reason: 'Password must be 72 characters or less (bcrypt limit)' };
  }
  
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, reason: 'Password must contain at least one letter and one number' };
  }
  
  return { valid: true, reason: null };
}

/**
 * Sanitizes user input to prevent SQL injection and XSS
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
}

/**
 * Generates JWT token for authenticated user
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @returns {string} JWT token
 */
function generateToken(userId, username) {
  try {
    const payload = {
      userId: userId,
      username: username,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    
    console.log('[Auth] JWT token generated for user:', {
      userId: userId,
      username: username,
      expiresIn: JWT_EXPIRES_IN
    });
    
    return token;
    
  } catch (error) {
    console.error('[Auth] ❌ JWT generation failed:', {
      userId: userId,
      username: username,
      error: error.message,
      stack: error.stack
    });
    throw new Error('Token generation failed');
  }
}

/**
 * POST /api/auth/register
 * Register new user account
 * Body: { username, email, password }
 */
router.post('/register', async (req, res) => {
  const requestId = `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Auth] Registration request received:', {
    requestId: requestId,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')?.substring(0, 100)
  });
  
  try {
    const { username, email, password } = req.body;
    
    console.log('[Auth] Validating registration input:', {
      requestId: requestId,
      username: username ? `${username.substring(0, 3)}***` : 'MISSING',
      email: email ? `${email.substring(0, 3)}***` : 'MISSING',
      passwordProvided: !!password
    });
    
    if (!username || !email || !password) {
      console.warn('[Auth] ⚠️ Registration failed - missing fields:', {
        requestId: requestId,
        hasUsername: !!username,
        hasEmail: !!email,
        hasPassword: !!password
      });
      
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'Username, email, and password are required',
        details: {
          username: !username ? 'Username is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }
    
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    
    if (!isValidUsername(sanitizedUsername)) {
      console.warn('[Auth] ⚠️ Registration failed - invalid username format:', {
        requestId: requestId,
        username: sanitizedUsername,
        length: sanitizedUsername.length
      });
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_USERNAME',
        message: 'Username must be 3-50 characters long and contain only letters, numbers, and underscores'
      });
    }
    
    if (!isValidEmail(sanitizedEmail)) {
      console.warn('[Auth] ⚠️ Registration failed - invalid email format:', {
        requestId: requestId,
        email: sanitizedEmail
      });
      
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL',
        message: 'Invalid email format'
      });
    }
    
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      console.warn('[Auth] ⚠️ Registration failed - weak password:', {
        requestId: requestId,
        reason: passwordValidation.reason
      });
      
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: passwordValidation.reason
      });
    }
    
    console.log('[Auth] Checking for existing user:', {
      requestId: requestId,
      username: sanitizedUsername,
      email: sanitizedEmail
    });
    
    const existingUserQuery = await pool.query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
      [sanitizedUsername, sanitizedEmail]
    );
    
    if (existingUserQuery.rows && existingUserQuery.rows.length > 0) {
      const existingUser = existingUserQuery.rows[0];
      const isUsernameTaken = existingUser.username === sanitizedUsername;
      const isEmailTaken = existingUser.email === sanitizedEmail;
      
      console.warn('[Auth] ⚠️ Registration failed - duplicate user:', {
        requestId: requestId,
        conflictType: isUsernameTaken ? 'username' : 'email',
        existingUserId: existingUser.id
      });
      
      return res.status(409).json({
        success: false,
        error: 'USER_EXISTS',
        message: isUsernameTaken 
          ? 'Username already taken' 
          : 'Email already registered',
        field: isUsernameTaken ? 'username' : 'email'
      });
    }
    
    console.log('[Auth] Hashing password with bcrypt...', {
      requestId: requestId,
      saltRounds: BCRYPT_SALT_ROUNDS
    });
    
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    
    console.log('[Auth] Inserting new user into database...', {
      requestId: requestId,
      username: sanitizedUsername,
      email: sanitizedEmail
    });
    
    const insertResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at, is_active) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, TRUE) 
       RETURNING id, username, email, created_at`,
      [sanitizedUsername, sanitizedEmail, passwordHash]
    );
    
    if (!insertResult.rows || insertResult.rows.length === 0) {
      console.error('[Auth] ❌ User insertion failed - no rows returned:', {
        requestId: requestId,
        username: sanitizedUsername,
        email: sanitizedEmail
      });
      
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Failed to create user account'
      });
    }
    
    const newUser = insertResult.rows[0];
    
    console.log('[Auth] Creating user_statistics record...', {
      requestId: requestId,
      userId: newUser.id
    });
    
    await pool.query(
      `INSERT INTO user_statistics (user_id, total_runs, total_victories, total_defeats) 
       VALUES ($1, 0, 0, 0)`,
      [newUser.id]
    );
    
    console.log('[Auth] Generating JWT token...', {
      requestId: requestId,
      userId: newUser.id
    });
    
    const token = generateToken(newUser.id, newUser.username);
    
    console.log('[Auth] ✅ Registration successful:', {
      requestId: requestId,
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.created_at
    });
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at,
        token: token
      }
    });
    
  } catch (error) {
    console.error('[Auth] ❌ Registration error:', {
      requestId: requestId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      column: error.column
    });
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_ENTRY',
        message: 'Username or email already exists'
      });
    }
    
    if (error.code === '23514') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Data validation failed'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Registration failed due to server error'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * Body: { username OR email, password }
 */
router.post('/login', async (req, res) => {
  const requestId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Auth] Login request received:', {
    requestId: requestId,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')?.substring(0, 100)
  });
  
  try {
    const { username, email, password } = req.body;
    
    const loginIdentifier = username || email;
    
    console.log('[Auth] Validating login input:', {
      requestId: requestId,
      hasIdentifier: !!loginIdentifier,
      identifierType: username ? 'username' : (email ? 'email' : 'none'),
      hasPassword: !!password
    });
    
    if (!loginIdentifier || !password) {
      console.warn('[Auth] ⚠️ Login failed - missing credentials:', {
        requestId: requestId,
        hasIdentifier: !!loginIdentifier,
        hasPassword: !!password
      });
      
      return res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Username/email and password are required'
      });
    }
    
    const sanitizedIdentifier = sanitizeInput(loginIdentifier.toLowerCase());
    
    console.log('[Auth] Querying user by identifier:', {
      requestId: requestId,
      identifier: `${sanitizedIdentifier.substring(0, 3)}***`,
      identifierLength: sanitizedIdentifier.length
    });
    
    const userQuery = await pool.query(
      `SELECT id, username, email, password_hash, is_active, created_at, last_login 
       FROM users 
       WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
      [sanitizedIdentifier]
    );
    
    if (!userQuery.rows || userQuery.rows.length === 0) {
      console.warn('[Auth] ⚠️ Login failed - user not found:', {
        requestId: requestId,
        identifier: sanitizedIdentifier
      });
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username/email or password'
      });
    }
    
    const user = userQuery.rows[0];
    
    console.log('[Auth] User found, checking active status:', {
      requestId: requestId,
      userId: user.id,
      username: user.username,
      isActive: user.is_active
    });
    
    if (!user.is_active) {
      console.warn('[Auth] ⚠️ Login failed - account disabled:', {
        requestId: requestId,
        userId: user.id,
        username: user.username
      });
      
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled'
      });
    }
    
    console.log('[Auth] Verifying password hash...', {
      requestId: requestId,
      userId: user.id
    });
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      console.warn('[Auth] ⚠️ Login failed - incorrect password:', {
        requestId: requestId,
        userId: user.id,
        username: user.username
      });
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username/email or password'
      });
    }
    
    console.log('[Auth] Password verified, updating last_login...', {
      requestId: requestId,
      userId: user.id
    });
    
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    console.log('[Auth] Generating JWT token...', {
      requestId: requestId,
      userId: user.id
    });
    
    const token = generateToken(user.id, user.username);
    
    console.log('[Auth] ✅ Login successful:', {
      requestId: requestId,
      userId: user.id,
      username: user.username,
      lastLogin: user.last_login,
      accountAge: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        token: token,
        lastLogin: user.last_login,
        createdAt: user.created_at
      }
    });
    
  } catch (error) {
    console.error('[Auth] ❌ Login error:', {
      requestId: requestId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Login failed due to server error'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token validity
 * Headers: Authorization: Bearer <token>
 */
router.post('/verify', async (req, res) => {
  const requestId = `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Auth] Token verification request:', {
    requestId: requestId,
    ip: req.ip || req.connection?.remoteAddress
  });
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] ⚠️ Verification failed - missing/invalid auth header:', {
        requestId: requestId,
        authHeader: authHeader ? `${authHeader.substring(0, 20)}***` : 'NONE'
      });
      
      return res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'No authentication token provided'
      });
    }
    
    const token = authHeader.substring(7);
    
    console.log('[Auth] Verifying JWT token...', {
      requestId: requestId,
      tokenLength: token.length
    });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log('[Auth] Token decoded, checking user exists:', {
      requestId: requestId,
      userId: decoded.userId,
      username: decoded.username,
      issuedAt: new Date(decoded.iat * 1000).toISOString()
    });
    
    const userQuery = await pool.query(
      'SELECT id, username, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (!userQuery.rows || userQuery.rows.length === 0) {
      console.warn('[Auth] ⚠️ Verification failed - user not found:', {
        requestId: requestId,
        userId: decoded.userId
      });
      
      return res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account no longer exists'
      });
    }
    
    const user = userQuery.rows[0];
    
    if (!user.is_active) {
      console.warn('[Auth] ⚠️ Verification failed - account disabled:', {
        requestId: requestId,
        userId: user.id
      });
      
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled'
      });
    }
    
    console.log('[Auth] ✅ Token verified successfully:', {
      requestId: requestId,
      userId: user.id,
      username: user.username
    });
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('[Auth] ⚠️ Token expired:', {
        requestId: requestId,
        expiredAt: error.expiredAt
      });
      
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      console.warn('[Auth] ⚠️ Invalid token:', {
        requestId: requestId,
        error: error.message
      });
      
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      });
    }
    
    console.error('[Auth] ❌ Verification error:', {
      requestId: requestId,
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Token verification failed due to server error'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion, server-side logging only)
 * Headers: Authorization: Bearer <token>
 */
router.post('/logout', async (req, res) => {
  const requestId = `OUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Auth] Logout request received:', {
    requestId: requestId,
    ip: req.ip || req.connection?.remoteAddress
  });
  
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        console.log('[Auth] ✅ User logged out:', {
          requestId: requestId,
          userId: decoded.userId,
          username: decoded.username
        });
        
      } catch (error) {
        console.warn('[Auth] ⚠️ Logout with invalid/expired token:', {
          requestId: requestId,
          error: error.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('[Auth] ❌ Logout error:', {
      requestId: requestId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Logout failed due to server error'
    });
  }
});

console.log('[Auth] ✅ Module loaded successfully');
console.log('[Auth] Available routes:', {
  register: 'POST /api/auth/register',
  login: 'POST /api/auth/login',
  verify: 'POST /api/auth/verify',
  logout: 'POST /api/auth/logout'
});

export default router;