/**
 * Shared MongoDB connection helper for Vercel Serverless Functions.
 * Caches the MongoClient across warm function invocations.
 */

import { MongoClient } from 'mongodb';

const DB_NAME = 'pratiyogita_yogya';
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

let cachedClient = null;
let cachedDb = null;

const stripTrailingDot = (value) => value.replace(/\.$/, '');

async function resolveDnsJson(name, type) {
  const url = new URL(DOH_ENDPOINT);
  url.searchParams.set('name', name);
  url.searchParams.set('type', type);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/dns-json',
    },
  });

  if (!response.ok) {
    throw new Error(`DNS-over-HTTPS request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.Answer) ? payload.Answer : [];
}

async function expandMongoSrvUri(uri) {
  const parsedUrl = new URL(uri);
  const srvName = `_mongodb._tcp.${parsedUrl.hostname}`;

  const srvRecords = await resolveDnsJson(srvName, 'SRV');
  if (!srvRecords.length) {
    throw new Error(`No SRV records found for ${parsedUrl.hostname}`);
  }

  const hosts = srvRecords
    .map((record) => {
      const parts = String(record.data || '').trim().split(/\s+/);
      if (parts.length < 4) return null;
      const port = parts[2];
      const host = stripTrailingDot(parts[3]);
      return `${host}:${port}`;
    })
    .filter(Boolean);

  if (!hosts.length) {
    throw new Error(`Unable to expand SRV records for ${parsedUrl.hostname}`);
  }

  const params = new URLSearchParams(parsedUrl.search);
  if (!params.has('tls')) {
    params.set('tls', 'true');
  }

  const txtRecords = await resolveDnsJson(parsedUrl.hostname, 'TXT').catch(() => []);
  for (const record of txtRecords) {
    const rawText = String(record.data || '').trim().replace(/^"|"$/g, '');
    if (!rawText) continue;
    const recordParams = new URLSearchParams(rawText);
    for (const [key, value] of recordParams.entries()) {
      if (!params.has(key)) {
        params.set(key, value);
      }
    }
  }

  const pathname = parsedUrl.pathname && parsedUrl.pathname !== '/' ? parsedUrl.pathname : '/';
  const username = parsedUrl.username ? encodeURIComponent(parsedUrl.username) : '';
  const password = parsedUrl.password ? `:${encodeURIComponent(parsedUrl.password)}` : '';
  const auth = username ? `${username}${password}@` : '';

  return `mongodb://${auth}${hosts.join(',')}${pathname}?${params.toString()}`;
}

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is not set in Vercel or environment');
  }

  let connectionUri = mongodbUri;
  if (connectionUri.startsWith('mongodb+srv://')) {
    try {
      connectionUri = await expandMongoSrvUri(connectionUri);
    } catch (err) {
      console.warn('DNS-over-HTTPS SRV expansion failed, falling back to direct URI:', err.message);
      connectionUri = mongodbUri;
    }
  }

  const client = new MongoClient(connectionUri);
  await client.connect();

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
