/**
 * Local development API server
 * Serves the Vercel serverless functions locally for testing.
 * 
 * Usage: node scripts/dev-api-server.mjs
 * Runs on port 3000. Vite dev server proxies /api/* requests here.
 */

import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// Also load .env.local if it exists (Vercel pulls env vars here)
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// Import API handlers
const catalogHandler = (await import('../api/exams/catalog.js')).default;
const examIdHandler = (await import('../api/exams/[examId].js')).default;
const saveExamHandler = (await import('../api/admin/save-exam.js')).default;
const saveCatalogHandler = (await import('../api/admin/save-catalog.js')).default;
const deleteExamHandler = (await import('../api/admin/delete-exam.js')).default;
const countHandler = (await import('../api/exams/count.js')).default;

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Parse JSON body for POST requests
  let body = null;
  if (req.method === 'POST') {
    body = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
  }

  // Mock Vercel's req/res API
  const mockReq = {
    method: req.method,
    headers: req.headers,
    query: {},
    body,
  };

  const mockRes = {
    statusCode: 200,
    _headers: {},
    setHeader(key, value) { this._headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) {
      res.writeHead(this.statusCode, {
        'Content-Type': 'application/json',
        ...this._headers,
      });
      res.end(JSON.stringify(data));
    },
  };

  try {
    // Route matching
    if (pathname === '/api/exams/catalog') {
      await catalogHandler(mockReq, mockRes);
    } else if (pathname === '/api/exams/count') {
      await countHandler(mockReq, mockRes);
    } else if (pathname.startsWith('/api/exams/') && pathname !== '/api/exams/') {
      const examId = decodeURIComponent(pathname.replace('/api/exams/', ''));
      mockReq.query = { examId };
      await examIdHandler(mockReq, mockRes);
    } else if (pathname === '/api/admin/save-exam') {
      await saveExamHandler(mockReq, mockRes);
    } else if (pathname === '/api/admin/save-catalog') {
      await saveCatalogHandler(mockReq, mockRes);
    } else if (pathname === '/api/admin/delete-exam') {
      await deleteExamHandler(mockReq, mockRes);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (err) {
    console.error('API Error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 API dev server running at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET  /api/exams/catalog`);
  console.log(`  GET  /api/exams/count`);
  console.log(`  GET  /api/exams/:examId`);
  console.log(`  POST /api/admin/save-exam`);
  console.log(`  POST /api/admin/save-catalog`);
  console.log(`  POST /api/admin/delete-exam`);
  console.log(`\nVite proxy will forward /api/* requests here.\n`);
});
