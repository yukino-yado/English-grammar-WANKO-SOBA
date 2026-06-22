import { get, list, put } from '@vercel/blob';

const API_VERSION = 'v3.18-edit-persistence-fix';
const PATHNAME = 'wankosoba/teacher-package.json';
const WRITE_ACCESS = 'public';

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

function apiMeta() {
  return {
    ok: true,
    apiVersion: API_VERSION,
    blobPathname: PATHNAME,
    writeAccess: WRITE_ACCESS,
    readAccess: WRITE_ACCESS,
    hasBlobReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
    hasBlobWebhookPublicKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY)
  };
}

function blobOptions(extra = {}) {
  const options = { ...extra };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  return options;
}

function readBlobOptions(extra = {}) {
  // @vercel/blob の新しいSDKでは get() に access 指定が必要になることがある。
  // このBlob StoreはPublicなので、読み込み時も public を明示する。
  return blobOptions({ access: WRITE_ACCESS, ...extra });
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function textFromBlobResult(result) {
  if (!result) return '';
  if (result.stream) {
    const response = new Response(result.stream);
    return response.text();
  }
  const url = result.downloadUrl || result.url;
  if (!url) return '';
  const readUrl = `${url}${String(url).includes('?') ? '&' : '?'}t=${Date.now()}`;
  const response = await fetch(readUrl, { cache: 'no-store' });
  if (!response.ok) return '';
  return response.text();
}

async function readStoredPackage() {
  try {
    const result = await get(PATHNAME, readBlobOptions());
    const text = await textFromBlobResult(result);
    if (text) return normalizePackage(JSON.parse(text));
  } catch (error) {
    const message = String(error?.message || error || '');
    if (!/not found|404|NoSuch|does not exist/i.test(message)) {
      throw error;
    }
  }

  try {
    const result = await list(blobOptions({ prefix: PATHNAME, limit: 100 }));
    const blobs = Array.isArray(result?.blobs) ? result.blobs : [];
    const target = blobs.find(blob => blob.pathname === PATHNAME) || blobs.find(blob => String(blob.pathname || '').endsWith('/teacher-package.json'));
    if (!target) return emptyPackage();

    const url = target.downloadUrl || target.url;
    if (!url) return emptyPackage();

    const readUrl = `${url}${String(url).includes('?') ? '&' : '?'}t=${Date.now()}`;
    const response = await fetch(readUrl, { cache: 'no-store' });
    if (!response.ok) return emptyPackage();
    const text = await response.text();
    return normalizePackage(text ? JSON.parse(text) : {});
  } catch (error) {
    const message = String(error?.message || error || '');
    if (/not found|404|NoSuch|does not exist/i.test(message)) return emptyPackage();
    throw error;
  }
}

async function writeStoredPackage(data) {
  const normalized = normalizePackage(data);
  normalized.updatedAt = new Date().toISOString();

  // このプロジェクトで作成済みのBlob StoreはPublic設定なので、必ずPublicとして保存する。
  // ここで private を指定すると「Cannot use private access on a public store」が発生する。
  const options = blobOptions({
    access: WRITE_ACCESS,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });

  await put(PATHNAME, JSON.stringify(normalized, null, 2), options);
  return normalized;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Wanko-Shared-API-Version', API_VERSION);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      if (req.query?.debug === '1') {
        res.status(200).json(apiMeta());
        return;
      }
      const data = await readStoredPackage();
      res.status(200).json({ ...data, _api: apiMeta() });
    } catch (error) {
      res.status(500).json({
        ok: false,
        code: 'BLOB_READ_FAILED',
        apiVersion: API_VERSION,
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
      res.status(200).json({ ok: true, apiVersion: API_VERSION, writeAccess: WRITE_ACCESS,
    readAccess: WRITE_ACCESS, package: data });
    } catch (error) {
      const detail = String(error?.message || error);
      res.status(500).json({
        ok: false,
        code: 'BLOB_WRITE_FAILED',
        apiVersion: API_VERSION,
        writeAccess: WRITE_ACCESS,
    readAccess: WRITE_ACCESS,
        message: '共有データの保存に失敗しました。',
        detail
      });
    }
    return;
  }

  res.status(405).json({ ok: false, apiVersion: API_VERSION, message: 'Method Not Allowed' });
}
