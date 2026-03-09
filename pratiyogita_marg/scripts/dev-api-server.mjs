/**
 * Local development API server for Pratiyogita Marg
 * Serves the Vercel serverless functions locally for testing.
 * 
 * Usage: node scripts/dev-api-server.mjs
 * Runs on port 3001. Vite dev server (port 8080) proxies /api/* here.
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

// Also load .env.local if it exists
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
const saveMindmapHandler = (await import('../api/save-mindmap.js')).default;
const mindmapsHandler = (await import('../api/mindmaps.js')).default;
const mindmapHandler = (await import('../api/mindmap.js')).default;
const deleteMindmapHandler = (await import('../api/delete-mindmap.js')).default;
const mindmapCatalogHandler = (await import('../api/mindmap-catalog.js')).default;

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    query: Object.fromEntries(url.searchParams.entries()),
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
    if (pathname === '/api/save-mindmap' && req.method === 'POST') {
      await saveMindmapHandler(mockReq, mockRes);
    } else if (pathname === '/api/mindmaps' && req.method === 'GET') {
      await mindmapsHandler(mockReq, mockRes);
    } else if (pathname === '/api/mindmap' && req.method === 'GET') {
      await mindmapHandler(mockReq, mockRes);
    } else if (pathname === '/api/mindmap-catalog' && req.method === 'GET') {
      await mindmapCatalogHandler(mockReq, mockRes);
    } else if (pathname === '/api/delete-mindmap' && req.method === 'DELETE') {
      await deleteMindmapHandler(mockReq, mockRes);
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
  console.log(`\n  Pratiyogita Marg API server running at http://localhost:${PORT}`);
  console.log('  Routes:');
  console.log('    POST   /api/save-mindmap');
  console.log('    GET    /api/mindmaps');
  console.log('    GET    /api/mindmap?name=X');
  console.log('    GET    /api/mindmap-catalog');
  console.log('    DELETE /api/delete-mindmap?name=X');
  console.log('');
});
