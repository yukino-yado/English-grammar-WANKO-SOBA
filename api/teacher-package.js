import { list, put } from '@vercel/blob';

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

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobOptions(extra = {}) {
  return {
    token: process.env.BLOB_READ_WRITE_TOKEN,
    ...extra
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function readStoredPackage() {
  const result = await list(blobOptions({ prefix: PATHNAME, limit: 100 }));
  const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
  const target = blobs.find(blob => blob.pathname === PATHNAME) || blobs.find(blob => String(blob.pathname || '').endsWith('/teacher-package.json'));
  if (!target) return emptyPackage();

  const url = target.downloadUrl || target.url;
  if (!url) throw new Error('共有データのURLを取得できませんでした。');

  const readUrl = `${url}${String(url).includes('?') ? '&' : '?'}t=${Date.now()}`;
  const response = await fetch(readUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`共有データの取得に失敗しました。HTTP ${response.status}`);
  }
  const text = await response.text();
  return normalizePackage(text ? JSON.parse(text) : {});
}

async function writeStoredPackage(data) {
  const normalized = normalizePackage(data);
  normalized.updatedAt = new Date().toISOString();

  // public にしておくと、別端末からの読み込み時も署名URLまわりで詰まりにくいです。
  // URLはアプリ内API経由で扱うため、画面には直接表示しません。
  await put(PATHNAME, JSON.stringify(normalized, null, 2), blobOptions({
    access: 'public',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  }));
  return normalized;
}

function sendMissingToken(res) {
  res.status(500).json({
    ok: false,
    code: 'BLOB_TOKEN_MISSING',
    message: '共有保存が未設定です。Vercel の Storage で Blob を作成し、BLOB_READ_WRITE_TOKEN を Environment Variables に設定してください。'
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!hasBlobToken()) {
    sendMissingToken(res);
    return;
  }

  if (req.method === 'GET') {
    try {
      const data = await readStoredPackage();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        ok: false,
        code: 'BLOB_READ_FAILED',
        message: '共有データの読み込みに失敗しました。',
        detail: String(error?.message || error)
      });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      const data = await writeStoredPackage(body?.package || body);
      res.status(200).json({ ok: true, package: data });
    } catch (error) {
      res.status(500).json({
        ok: false,
        code: 'BLOB_WRITE_FAILED',
        message: '共有データの保存に失敗しました。',
        detail: String(error?.message || error)
      });
    }
    return;
  }

  res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}
