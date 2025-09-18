require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database pool
let pool;
let usingDb = true;
try {
  if (!process.env.DATABASE_URL) throw new Error('No DATABASE_URL');
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
// In-memory store fallback (defined globally)

} catch (e) {
  console.warn('Database connection not configured, falling back to in‑memory store');
  usingDb = false;
  pool = null;
}

// Ensure items table exists if using DB
if (usingDb) {
  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Ensured items table exists');
    } catch (err) {
      console.error('Error creating items table', err);
    }
  })();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all items
app.get('/api/items', async (req, res) => {
  if (usingDb) {
    try {
      const result = await pool.query('SELECT id, name, description, created_at AS "createdAt", updated_at AS "updatedAt" FROM items ORDER BY id');
      return res.json(result.rows);
    } catch (err) {
      console.error('Error fetching items', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  // In‑memory fallback
  return res.json(items);
});

// Create a new item
app.post('/api/items', async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (usingDb) {
    try {
      const result = await pool.query(
        'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at AS "createdAt", updated_at AS "updatedAt"',
        [name, description]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating item', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  // In‑memory fallback
  const item = { id: nextId++, name, description: description || '' };
  items.push(item);
  return res.status(201).json(item);
});

// Update an item
app.put('/api/items/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  if (usingDb) {
    try {
      const result = await pool.query(
        'UPDATE items SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW() WHERE id = $3 RETURNING id, name, description, created_at AS "createdAt", updated_at AS "updatedAt"',
        [name, description, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating item', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  // In‑memory fallback
  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  return res.json(item);
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting item', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log('Backend listening on port', PORT);
});


