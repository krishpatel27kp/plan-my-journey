/**
 * User Service / Repository
 * Handles user persistence with PostgreSQL and in-memory test fallback.
 */

const crypto = require('crypto');
const pool = require('../db');
const { hashPassword, comparePassword } = require('../utils/auth');

// In-memory fallback map for offline/testing environments
const memoryUsers = new Map();

async function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date();

  // Try PostgreSQL first if pool is available and healthy
  try {
    const query = `
      INSERT INTO users (id, name, email, password_hash, profile_image, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, profile_image, created_at, updated_at;
    `;
    const values = [id, name.trim(), normalizedEmail, passwordHash, null, now, now];
    const res = await pool.query(query, values);
    const row = res.rows[0];
    
    // Also mirror to memoryUsers for quick lookup
    memoryUsers.set(normalizedEmail, {
      id: row.id,
      name: row.name,
      email: row.email,
      password_hash: passwordHash,
      profile_image: row.profile_image,
      created_at: row.created_at,
      updated_at: row.updated_at
    });

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      profileImage: row.profile_image || null
    };
  } catch (err) {
    // If unique constraint violation on PG (code 23505)
    if (err.code === '23505') {
      const error = new Error('Email already registered');
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    // Fallback to memory store if database is offline/unreachable
    if (memoryUsers.has(normalizedEmail)) {
      const error = new Error('Email already registered');
      error.code = 'EMAIL_EXISTS';
      throw error;
    }

    const user = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      profile_image: null,
      created_at: now,
      updated_at: now
    };
    memoryUsers.set(normalizedEmail, user);
    memoryUsers.set(id, user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: null
    };
  }
}

async function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (res.rows && res.rows.length > 0) {
      return res.rows[0];
    }
  } catch (err) {
    // Fall back to memory
  }

  const user = memoryUsers.get(normalizedEmail);
  return user || null;
}

async function findUserById(id) {
  try {
    const res = await pool.query('SELECT id, name, email, profile_image, created_at, updated_at FROM users WHERE id = $1 LIMIT 1', [id]);
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        profileImage: row.profile_image || null
      };
    }
  } catch (err) {
    // Fall back to memory
  }

  // Check memory store
  for (const user of memoryUsers.values()) {
    if (user.id === id) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image || null
      };
    }
  }

  return null;
}

async function updateUser(id, { name, profileImage, profile_image }) {
  const newProfileImage = profileImage !== undefined ? profileImage : (profile_image !== undefined ? profile_image : undefined);
  const now = new Date();

  try {
    let query, values;
    if (name !== undefined && newProfileImage !== undefined) {
      query = 'UPDATE users SET name = $1, profile_image = $2, updated_at = $3 WHERE id = $4 RETURNING id, name, email, profile_image';
      values = [name.trim(), newProfileImage, now, id];
    } else if (name !== undefined) {
      query = 'UPDATE users SET name = $1, updated_at = $2 WHERE id = $3 RETURNING id, name, email, profile_image';
      values = [name.trim(), now, id];
    } else if (newProfileImage !== undefined) {
      query = 'UPDATE users SET profile_image = $1, updated_at = $2 WHERE id = $3 RETURNING id, name, email, profile_image';
      values = [newProfileImage, now, id];
    } else {
      return await findUserById(id);
    }

    const res = await pool.query(query, values);
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        profileImage: row.profile_image || null
      };
    }
  } catch (err) {
    // Fall back to memory
  }

  // Memory fallback
  for (const user of memoryUsers.values()) {
    if (user.id === id) {
      if (name !== undefined) user.name = name.trim();
      if (newProfileImage !== undefined) user.profile_image = newProfileImage;
      user.updated_at = now;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image || null
      };
    }
  }

  return null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  memoryUsers
};
