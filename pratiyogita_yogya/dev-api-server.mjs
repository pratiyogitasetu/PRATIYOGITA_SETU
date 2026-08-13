/**
 * Local development API server
 * Serves Vercel-style serverless handlers on http://localhost:3000
 */

import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnvFile = (filename) => {
  const envPath = path.resolve(__dirname, filename);
  if (!fs.existsSync(envPath)) return;

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
};

loadEnvFile('.env');
loadEnvFile('.env.local');

const catalogHandler = (await import('./api/exams/catalog.js')).default;
const examIdHandler = (await import('./api/exams/[examId].js')).default;

const PORT = 3000;

const parseBody = async (req) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
    return null;
  }

  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const body = await parseBody(req);

  const mockReq = {
    method: req.method,
    headers: req.headers,
    query: {},
    body,
  };

  const mockRes = {
    statusCode: 200,
    _headers: {},
    setHeader(key, value) {
      this._headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      res.writeHead(this.statusCode, {
        'Content-Type': 'application/json',
        ...this._headers,
      });
      res.end(JSON.stringify(payload));
    },
  };

  try {
    if (pathname === '/api/exams/catalog') {
      await catalogHandler(mockReq, mockRes);
      return;
    }

    if (pathname.startsWith('/api/exams/') && pathname !== '/api/exams/') {
      const examId = decodeURIComponent(pathname.replace('/api/exams/', ''));
      mockReq.query = { examId };
      await examIdHandler(mockReq, mockRes);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('API Error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET  /api/exams/catalog');
  console.log('  GET  /api/exams/:examId');
});
