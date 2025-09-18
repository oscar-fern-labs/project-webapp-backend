# Project Webapp Backend

This repository contains the backend for the full‑stack web application. It provides a Node.js/Express API with optional PostgreSQL support and an in‑memory fallback.

## Features
- **Health endpoint** (`GET /api/health`) returns `{ "status": "ok" }`.
- **Item CRUD** (`/api/items`) for creating, reading, updating, and deleting items.
- **Database support**: Uses PostgreSQL when `DATABASE_URL` is set, otherwise falls back to an in‑memory store.
- **Process management** with PM2.

## Running locally
```bash
npm install
node index.js
```

## Environment variables
- `PORT` – Port to listen on (default `3000`).
- `DATABASE_URL` – PostgreSQL connection string (optional).

## License
MIT License (see LICENSE file).

