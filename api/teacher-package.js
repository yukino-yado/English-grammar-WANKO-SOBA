import { get, put } from '@vercel/blob';

const PATHNAME = 'wankosoba/teacher-package.json';

function emptyPackage() {
  return {
    version: 3,
    updatedAt: null,
    menuOverrides: {},
    questions: [],
    editedQuestions: []
  };
}

function normalizePackage(data) {
  const empty = emptyPackage();
  const next = { ...empty, ...(data && typeof data === 'object' ? data : {}) };
  next.menuOverrides = next.menuOverrides && typeof next.menuOverrides === 'object' ? next.menuOverrides : {};
  next.questions = Array.isArray(next.questions) ? next.questions : [];
  next.editedQuestions = Array.isArray(next.editedQuestions) ? next.editedQuestions : [];
  next.version = 3;
  return next;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({
      ok: false,
      message: 'Vercel Blob が未設定です。Vercel の Storage で Blob を作成し、BLOB_READ_WRITE_TOKEN を有効にしてください。'
    });
    return;
  }

  if (req.method === 'GET') {
    try {
      const blob = await get(PATHNAME, { token: process.env.BLOB_READ_WRITE_TOKEN });
      const text = await new Response(blob.body).text();
      res.status(200).json(normalizePackage(JSON.parse(text || '{}')));
    } catch (error) {
      const status = error?.status || error?.statusCode;
      if (status === 404 || String(error?.message || '').includes('not found')) {
        res.status(200).json(emptyPackage());
        return;
      }
      res.status(500).json({ ok: false, message: '共有データの読み込みに失敗しました。', detail: String(error?.message || error) });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const data = normalizePackage(body);
      data.updatedAt = new Date().toISOString();
      await put(PATHNAME, JSON.stringify(data, null, 2), {
        access: 'private',
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 60,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      res.status(200).json({ ok: true, package: data });
    } catch (error) {
      res.status(500).json({ ok: false, message: '共有データの保存に失敗しました。', detail: String(error?.message || error) });
    }
    return;
  }

  res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}
