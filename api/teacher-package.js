import { get, list, put } from '@vercel/blob';

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

function blobOptions(extra = {}) {
  // 2026年以降のVercel Blobは、接続済みプロジェクトではOIDC認証が標準になっており、
  // BLOB_READ_WRITE_TOKEN が環境変数に表示されない場合があります。
  // token を明示しないことで、Vercel Functions 側の自動認証または従来の環境変数認証に任せます。
  const options = { ...extra };
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    options.token = process.env.BLOB_READ_WRITE_TOKEN;
  }
  return options;
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
  // Private Blob Storeの場合はURLを直接fetchできないため、まずSDKのget()で読む。
  // 既存のPublic保存データが残っている可能性もあるため、失敗時だけ旧方式にフォールバックする。
  try {
    const result = await get(PATHNAME, blobOptions({ access: 'private' }));
    if (result?.stream) {
      const response = new Response(result.stream);
      const text = await response.text();
      return normalizePackage(text ? JSON.parse(text) : {});
    }
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

  // 教師用の編集データなのでPrivate Blob Storeへ保存します。
  // Vercel Functions上ではOIDC認証、または従来のBLOB_READ_WRITE_TOKEN認証で読み書きします。
  await put(PATHNAME, JSON.stringify(normalized, null, 2), blobOptions({
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  }));
  return normalized;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
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
