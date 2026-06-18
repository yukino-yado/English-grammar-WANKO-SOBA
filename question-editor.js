"use strict";

const TEACHER_PACKAGE_KEY = "wankoSobaTeacherPackage:v1";
const STUDENT_PROGRESS_KEY = "wankoSobaGrammarProgress:v5";
const TEACHER_CLOUD_ENDPOINT = "/api/teacher-package";

const GRAMMAR_UNITS = {
  1: [
    "be動詞の文①", "一般動詞の文①", "be動詞の文②", "一般動詞の文②", "be動詞のまとめ", "一般動詞の文のまとめ",
    "名詞・代名詞の基本", "疑問詞を使った疑問文", "基本表現の広がり①", "存在構文", "方法をたずねる文", "現在進行形", "過去形の基本"
  ],
  2: [
    "過去・進行形の発展", "接続詞 when", "未来表現", "接続詞 if", "助動詞・必要を表す文", "不定詞・動名詞",
    "人にものを渡す・伝える文", "前置詞の基本", "接続詞と文をつなぐ表現", "It is 構文", "比較", "受け身"
  ],
  3: [
    "受け身の発展", "人やものを説明する文", "現在完了", "関係代名詞", "thatを使う文・間接疑問文", "名詞を後ろから説明する文",
    "不定詞の発展", "前置詞の発展", "仮定法"
  ]
};

const LEVEL_LABELS = {
  all: "すべて",
  small: "小盛り",
  medium: "中盛り",
  large: "大盛り",
  extra: "特盛り",
  generated: "生成済み"
};

const EDITOR_LEVELS = ["small", "medium", "large", "extra"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let teacherPackage = loadPackage();
let visibleRows = [];
let hasSearched = false;
let currentPage = 1;
const EDITOR_PAGE_SIZE = 50;
let totalFilteredRows = [];
let cloudSaveTimer = null;
let loadingSharedData = false;
let sharedStatusText = "共有データ確認中";
let sharedStatusError = false;

function init() {
  populateFilters();
  bindEvents();
  clearEditorResults();
  loadCloudPackage();
}

function loadPackage() {
  try {
    const raw = localStorage.getItem(TEACHER_PACKAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return normalizePackage(data);
  } catch (error) {
    console.warn("教師用データを読み込めませんでした。", error);
    return normalizePackage({});
  }
}

function normalizePackage(data) {
  return {
    version: 3,
    updatedAt: data?.updatedAt || null,
    menuOverrides: data?.menuOverrides && typeof data.menuOverrides === "object" ? data.menuOverrides : {},
    questions: Array.isArray(data?.questions) ? data.questions : [],
    editedQuestions: Array.isArray(data?.editedQuestions) ? data.editedQuestions.map(normalizeEdit).filter(Boolean) : []
  };
}

function normalizeEdit(item) {
  if (!item || typeof item !== "object") return null;
  const key = String(item.key || "").trim();
  const jp = sanitizeJapanese(String(item.jp || "").trim());
  const fullSentence = normalizeEnglish(String(item.fullSentence || "").trim());
  if (!key || !jp || !fullSentence) return null;
  const levelScope = item.levelScope || item.level || null;
  const blankSentence = item.blankSentence ? normalizeBlankSentence(String(item.blankSentence).trim()) : "";
  const blankAnswer = item.blankAnswer ? String(item.blankAnswer).replace(/。/g, "").replace(/\s+/g, " ").trim() : "";
  const choices = Array.isArray(item.choices) ? item.choices.map(String).filter(Boolean) : [];
  return {
    key,
    grade: Math.min(3, Math.max(1, Number(item.grade || 1))),
    unit: String(item.unit || ""),
    level: levelScope || null,
    levelScope,
    jp,
    fullSentence,
    blankSentence,
    blankAnswer,
    choices,
    originalJp: String(item.originalJp || ""),
    originalFullSentence: String(item.originalFullSentence || ""),
    originalBlankSentence: String(item.originalBlankSentence || ""),
    originalBlankAnswer: String(item.originalBlankAnswer || ""),
    updatedAt: item.updatedAt || new Date().toISOString(),
    teacherEdited: true,
    teacherBlankEdited: Boolean(blankSentence && blankAnswer)
  };
}

function savePackage(message = "保存しました。", options = {}) {
  teacherPackage.version = 3;
  teacherPackage.updatedAt = new Date().toISOString();
  localStorage.setItem(TEACHER_PACKAGE_KEY, JSON.stringify(teacherPackage));
  showMessage(message);
  if (!options.localOnly) queueCloudSave();
}

function getCloudPackagePayload(payload) {
  return normalizePackage(payload && payload.package ? payload.package : payload);
}

function packageTime(pkg) {
  const time = Date.parse(pkg?.updatedAt || "");
  return Number.isFinite(time) ? time : 0;
}

function packageHasContent(pkg) {
  return Boolean(
    Object.keys(pkg?.menuOverrides || {}).length ||
    (Array.isArray(pkg?.questions) && pkg.questions.length) ||
    (Array.isArray(pkg?.editedQuestions) && pkg.editedQuestions.length)
  );
}

function mergeTeacherPackages(localPkg, cloudPkg) {
  const local = normalizePackage(localPkg || {});
  const cloud = normalizePackage(cloudPkg || {});
  const localTime = packageTime(local);
  const cloudTime = packageTime(cloud);
  const preferCloud = cloudTime >= localTime;

  const questionMap = new Map();
  const putQuestion = (q) => {
    if (!q || typeof q !== "object") return;
    const key = String(q.id || q.key || q.fullSentence || JSON.stringify(q));
    questionMap.set(key, q);
  };
  (preferCloud ? local.questions : cloud.questions).forEach(putQuestion);
  (preferCloud ? cloud.questions : local.questions).forEach(putQuestion);

  const editMap = new Map();
  [...(local.editedQuestions || []), ...(cloud.editedQuestions || [])].forEach(item => {
    const normalized = normalizeEdit(item);
    if (!normalized) return;
    const current = editMap.get(normalized.key);
    if (!current || packageTime(normalized) >= packageTime(current)) editMap.set(normalized.key, normalized);
  });

  const latest = Math.max(localTime, cloudTime, 0);
  return normalizePackage({
    version: 3,
    updatedAt: latest ? new Date(latest).toISOString() : null,
    menuOverrides: preferCloud ? { ...local.menuOverrides, ...cloud.menuOverrides } : { ...cloud.menuOverrides, ...local.menuOverrides },
    questions: [...questionMap.values()],
    editedQuestions: [...editMap.values()]
  });
}

async function responseErrorMessage(response) {
  try {
    const data = await response.json();
    return [data.message, data.detail, data.code].filter(Boolean).join(" / ") || `HTTP ${response.status}`;
  } catch (_) {
    try {
      const text = await response.text();
      return text || `HTTP ${response.status}`;
    } catch (__) {
      return `HTTP ${response.status}`;
    }
  }
}

function setSharedStatus(message, isError = false) {
  sharedStatusText = message;
  sharedStatusError = isError;
  showMessage(message);
}

async function loadCloudPackage() {
  if (loadingSharedData) return;
  loadingSharedData = true;
  try {
    const localBeforeLoad = normalizePackage(teacherPackage);
    const response = await fetch(`${TEACHER_CLOUD_ENDPOINT}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(await responseErrorMessage(response));
    const data = await response.json();
    const cloudPackage = getCloudPackagePayload(data);
    const merged = mergeTeacherPackages(localBeforeLoad, cloudPackage);
    const shouldBackUpLocal = packageHasContent(localBeforeLoad) && packageTime(localBeforeLoad) > packageTime(cloudPackage);
    teacherPackage = merged;
    localStorage.setItem(TEACHER_PACKAGE_KEY, JSON.stringify(teacherPackage));
    const countText = `追加${teacherPackage.questions.length}件・編集${teacherPackage.editedQuestions.length}件`;
    const dateText = teacherPackage.updatedAt ? new Date(teacherPackage.updatedAt).toLocaleString("ja-JP") : "未保存";
    setSharedStatus(`共有データ読込OK：${countText} / 最終更新 ${dateText}`, false);
    if (hasSearched) renderList();
    else clearEditorResults();
    if (shouldBackUpLocal) queueCloudSave();
  } catch (error) {
    console.warn("共有データの読み込みに失敗しました。", error);
    setSharedStatus(`共有データ読込NG：${error.message || error}`, true);
  } finally {
    loadingSharedData = false;
  }
}

function queueCloudSave() {
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(saveCloudPackage, 500);
}

async function saveCloudPackage() {
  try {
    const response = await fetch(TEACHER_CLOUD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: teacherPackage })
    });
    if (!response.ok) throw new Error(await responseErrorMessage(response));
    const result = await response.json();
    if (result && result.package) {
      teacherPackage = normalizePackage(result.package);
      localStorage.setItem(TEACHER_PACKAGE_KEY, JSON.stringify(teacherPackage));
    }
    const countText = `追加${teacherPackage.questions.length}件・編集${teacherPackage.editedQuestions.length}件`;
    const dateText = teacherPackage.updatedAt ? new Date(teacherPackage.updatedAt).toLocaleString("ja-JP") : "未保存";
    setSharedStatus(`共有データ保存OK：${countText} / 最終更新 ${dateText}`, false);
  } catch (error) {
    console.warn("共有データの保存に失敗しました。", error);
    setSharedStatus(`共有データ保存NG：${error.message || error}`, true);
  }
}

function populateFilters() {
  $("#editorGrade").innerHTML = [1, 2, 3].map(grade => `<option value="${grade}">中${grade}</option>`).join("");
  updateUnitOptions();
}

function bindEvents() {
  $("#editorGrade").addEventListener("change", () => {
    updateUnitOptions();
    clearEditorResults();
  });
  $("#editorLevel").addEventListener("change", clearEditorResults);
  $("#editorUnit").addEventListener("change", clearEditorResults);
  $("#editorSearch").addEventListener("input", () => {
    showMessage("条件を変更しました。検索する場合は「検索する」を押してください。");
  });
  $("#editorSearchBtn").addEventListener("click", searchEditorQuestions);
  $("#editorSearch").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchEditorQuestions();
    }
  });
  $("#saveVisibleBtn").addEventListener("click", saveVisibleEdits);
  $("#openAllQuestionsBtn").addEventListener("click", openAllQuestionCards);
  $("#closeAllQuestionsBtn").addEventListener("click", closeAllQuestionCards);
  $("#resetVisibleBtn").addEventListener("click", resetVisibleEdits);
  $("#exportEditorBtn").addEventListener("click", exportPackage);
  if ($("#loadEditorCloudBtn")) $("#loadEditorCloudBtn").addEventListener("click", loadCloudPackage);
}

function updateUnitOptions() {
  const grade = Number($("#editorGrade").value || 1);
  const units = GRAMMAR_UNITS[grade] || [];
  $("#editorUnit").innerHTML = units.map(unit => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`).join("");
}

function getEditMap() {
  return new Map((teacherPackage.editedQuestions || []).map(item => [item.key, item]));
}

function getStudentProgress() {
  try {
    const raw = localStorage.getItem(STUDENT_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("生徒側の生成済み問題を読み込めませんでした。", error);
    return {};
  }
}

function getGeneratedQuestionRows() {
  const progress = getStudentProgress();
  const sources = [
    ...(Array.isArray(progress.preGeneratedBank) ? progress.preGeneratedBank : []),
    ...(Array.isArray(progress.history) ? progress.history : []),
    ...(Array.isArray(progress.solvedBank) ? progress.solvedBank : []),
    ...(Array.isArray(progress.wrongBank) ? progress.wrongBank : [])
  ];
  const map = new Map();
  sources.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const jp = sanitizeJapanese(String(item.jp || "").trim());
    const fullSentence = normalizeEnglish(String(item.fullSentence || "").trim());
    const unit = String(item.unit || "").trim();
    if (!jp || !fullSentence || !unit) return;
    const grade = Math.min(3, Math.max(1, Number(item.grade || findGradeByUnit(unit) || 1)));
    const key = String(item.key || item.sourceKey || `generated::${hashCode(`${unit}|${jp}|${fullSentence}`)}`);
    if (map.has(key)) return;
    map.set(key, {
      key,
      grade,
      unit,
      sourceIndex: index,
      levelScope: item.levelScope || item.level || "generated",
      jp,
      fullSentence,
      blankSentence: item.blankSentence || "生成済み問題のため、必要に応じて生徒側で自動調整されます。",
      blankAnswer: item.blankAnswer || "",
      explanation: item.explanation || "生成済み問題です。日本語文と英文の自然さを確認してください。",
      generatedStored: true,
      preGenerated: Boolean(item.preGenerated || item.generatedAtHome)
    });
  });
  return [...map.values()];
}

function findGradeByUnit(unit) {
  for (const [grade, units] of Object.entries(GRAMMAR_UNITS)) {
    if (units.includes(unit)) return Number(grade);
  }
  return null;
}

function buildStaticHomeGeneratedRows() {
  const base = Array.isArray(window.EDITOR_QUESTION_INDEX) ? window.EDITOR_QUESTION_INDEX : [];
  const rows = [];
  base.forEach(row => {
    if (!row || !row.unit || !row.jp || !row.fullSentence) return;
    EDITOR_LEVELS.forEach(level => {
      rows.push({
        ...row,
        key: `home-generated::${level}::${row.key || hashCode(`${row.unit}|${row.jp}|${row.fullSentence}`)}`,
        id: `home-generated::${level}::${row.key || hashCode(`${row.unit}|${row.jp}|${row.fullSentence}`)}`,
        level,
        levelScope: level,
        generatedStored: true,
        preGenerated: true,
        generatedAtHome: true,
        explanation: row.explanation || "ホーム画面で事前生成される問題です。日本語文と英文の自然さを確認してください。"
      });
    });
  });
  return rows;
}

function expandRowsForAllEditorLevels(rows) {
  const expanded = [];
  (rows || []).forEach((row, index) => {
    if (!row || !row.unit || !row.jp || !row.fullSentence) return;
    const scope = row.levelScope || row.level || "all";
    const scopes = Array.isArray(scope) ? scope : String(scope).split(/[ ,/|]+/).filter(Boolean);
    const shouldExpand = !scopes.length || scopes.includes("all");
    if (shouldExpand) {
      EDITOR_LEVELS.forEach(level => {
        const baseKey = row.key || `editor-row-${index}`;
        expanded.push({
          ...row,
          key: `${baseKey}::level::${level}`,
          id: `${baseKey}::level::${level}`,
          level,
          levelScope: level,
          editorLevelGenerated: true
        });
      });
    } else {
      scopes.forEach(level => {
        if (!EDITOR_LEVELS.includes(level)) return;
        const baseKey = row.key || `editor-row-${index}`;
        const alreadySpecific = String(baseKey).includes(`::level::${level}`);
        expanded.push({
          ...row,
          key: alreadySpecific ? baseKey : `${baseKey}::level::${level}`,
          id: alreadySpecific ? (row.id || baseKey) : `${baseKey}::level::${level}`,
          level,
          levelScope: level
        });
      });
    }
  });
  return expanded;
}

function getEditorQuestionRows() {
  const base = expandRowsForAllEditorLevels(Array.isArray(window.EDITOR_QUESTION_INDEX) ? window.EDITOR_QUESTION_INDEX : []);
  const generated = expandRowsForAllEditorLevels(getGeneratedQuestionRows());
  const staticGenerated = buildStaticHomeGeneratedRows();
  const merged = [...base, ...generated, ...staticGenerated];
  const map = new Map();
  merged.forEach(row => {
    if (!row || !row.key) return;
    if (map.has(row.key)) return;
    map.set(row.key, row);
  });
  return [...map.values()];
}

function clearEditorResults() {
  const grade = Number($("#editorGrade").value || 1);
  const unit = $("#editorUnit").value || "単元未選択";
  const level = $("#editorLevel").value || "all";
  hasSearched = false;
  visibleRows = [];
  totalFilteredRows = [];
  currentPage = 1;
  $("#editorListTitle").textContent = `中${grade}　${unit}`;
  $("#editorListSummary").textContent = `難易度：${LEVEL_LABELS[level] || level}。条件を選んで「検索する」を押してください。`;
  $("#editorQuestionList").innerHTML = `<div class="empty-suggestions">まだ検索していません。難易度・学年・単元を選び、必要なら検索語を入力してから「検索する」を押してください。</div>`;
}

function searchEditorQuestions() {
  hasSearched = true;
  currentPage = 1;
  renderList();
}

function matchesLevel(row, selectedLevel) {
  if (!selectedLevel || selectedLevel === "all") return true;
  const scope = row.levelScope || row.level || "all";
  if (scope === "all") return true;
  if (Array.isArray(scope)) return scope.includes(selectedLevel) || scope.includes("all");
  return String(scope).split(/[ ,/|]+/).filter(Boolean).includes(selectedLevel);
}

function renderList() {
  const grade = Number($("#editorGrade").value || 1);
  const unit = $("#editorUnit").value;
  const level = $("#editorLevel").value || "all";
  const query = normalizeText($("#editorSearch").value || "");
  const edits = getEditMap();

  totalFilteredRows = getEditorQuestionRows()
    .filter(row => Number(row.grade) === grade && row.unit === unit)
    .filter(row => matchesLevel(row, level))
    .filter(row => {
      if (!query) return true;
      const edit = edits.get(row.key);
      const jp = edit?.jp || row.jp;
      const en = edit?.fullSentence || row.fullSentence;
      return normalizeText(`${jp} ${en}`).includes(query);
    });

  const totalPages = Math.max(1, Math.ceil(totalFilteredRows.length / EDITOR_PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * EDITOR_PAGE_SIZE;
  const endIndex = Math.min(startIndex + EDITOR_PAGE_SIZE, totalFilteredRows.length);
  visibleRows = totalFilteredRows.slice(startIndex, endIndex);

  $("#editorListTitle").textContent = `中${grade}　${unit}`;
  const editedCount = totalFilteredRows.filter(row => edits.has(row.key)).length;
  const searchText = query ? ` / 検索：「${$("#editorSearch").value.trim()}」` : "";
  const rangeText = totalFilteredRows.length ? `${startIndex + 1}〜${endIndex}問目` : "0問";
  $("#editorListSummary").textContent = `難易度：${LEVEL_LABELS[level] || level}${searchText}。該当 ${totalFilteredRows.length}問中、${rangeText}を表示中。編集済み ${editedCount}問。`;

  const list = $("#editorQuestionList");
  if (!totalFilteredRows.length) {
    list.innerHTML = `<div class="empty-suggestions">該当する問題がありません。</div>`;
    return;
  }

  const paginationHtml = buildPaginationControls(totalFilteredRows.length, currentPage, totalPages);
  list.innerHTML = paginationHtml + visibleRows.map((row, index) => {
    const edit = edits.get(row.key);
    const currentJp = edit?.jp || row.jp;
    const currentEn = edit?.fullSentence || row.fullSentence;
    const currentBlank = edit?.blankSentence || row.blankSentence || "";
    const currentAnswer = edit?.blankAnswer || row.blankAnswer || "";
    const edited = Boolean(edit);
    const sourceLabel = row.generatedStored ? "生成済み問題" : "基準問題";
    return `
      <details class="editor-question-card ${edited ? "is-edited" : ""}" data-key="${escapeHtml(row.key)}">
        <summary class="editor-question-summary">
          <span class="editor-summary-left">
            <span class="shelf-mark">${sourceLabel} ${startIndex + index + 1}</span>
            <span class="shelf-mark level-mark">難易度：${escapeHtml(getLevelLabel(row.levelScope || row.level || "all"))}</span>
            ${edited ? `<span class="edit-badge">編集済み</span>` : `<span class="edit-badge muted-badge">未編集</span>`}
          </span>
          <span class="editor-summary-text">
            <strong>${escapeHtml(currentJp)}</strong>
            <small>${escapeHtml(currentEn)}</small>
            <small>穴埋め：${escapeHtml(currentBlank)} / 答え：${escapeHtml(currentAnswer)}</small>
          </span>
        </summary>
        <div class="editor-card-body">
          <div class="editor-original-box">
            <p><strong>${row.generatedStored ? "生成時の日本語" : "元の日本語"}：</strong>${escapeHtml(row.jp)}</p>
            <p><strong>${row.generatedStored ? "生成時の英文" : "元の英文"}：</strong>${escapeHtml(row.fullSentence)}</p>
            <p><strong>${row.generatedStored ? "生成時の穴埋め" : "元の穴埋め"}：</strong>${escapeHtml(row.blankSentence || "")}</p>
            <p><strong>${row.generatedStored ? "生成時の答え" : "元の答え"}：</strong>${escapeHtml(row.blankAnswer || "")}</p>
          </div>
          <div class="editor-input-grid">
            <label>日本語文
              <textarea rows="3" data-field="jp">${escapeHtml(currentJp)}</textarea>
            </label>
            <label>英文
              <textarea rows="3" data-field="fullSentence">${escapeHtml(currentEn)}</textarea>
            </label>
            <label>穴埋め文（選択式・穴埋め式）
              <textarea rows="3" data-field="blankSentence">${escapeHtml(currentBlank)}</textarea>
            </label>
            <label>穴埋めの答え
              <textarea rows="3" data-field="blankAnswer">${escapeHtml(currentAnswer)}</textarea>
            </label>
          </div>
          <p class="editor-help-text">空欄は <strong>___</strong> で入力します。空欄の数と答えの英単語数をそろえてください。例：<code>She is ___ ___ music now.</code> / 答え：<code>listening to</code></p>
          <details class="editor-reference">
            <summary>解説を確認</summary>
            <p><strong>解説：</strong>${escapeHtml(row.explanation)}</p>
          </details>
          <div class="teacher-question-actions">
            <button class="ghost-button" type="button" data-restore-key="${escapeHtml(row.key)}">この問題を元に戻す</button>
          </div>
        </div>
      </details>`;
  }).join("") + paginationHtml;

  bindPaginationButtons();

  $$('[data-restore-key]').forEach(button => {
    button.addEventListener("click", () => restoreOne(button.dataset.restoreKey));
  });
}

function buildPaginationControls(totalCount, page, totalPages) {
  if (totalPages <= 1) return "";
  const start = (page - 1) * EDITOR_PAGE_SIZE + 1;
  const end = Math.min(page * EDITOR_PAGE_SIZE, totalCount);
  return `
    <div class="editor-pagination" role="navigation" aria-label="問題一覧のページ送り">
      <button class="ghost-button" type="button" data-editor-page="prev" ${page <= 1 ? "disabled" : ""}>前の50題</button>
      <span class="editor-page-status">${escapeHtml(String(start))}〜${escapeHtml(String(end))} / ${escapeHtml(String(totalCount))}題（${escapeHtml(String(page))}/${escapeHtml(String(totalPages))}ページ）</span>
      <button class="ghost-button" type="button" data-editor-page="next" ${page >= totalPages ? "disabled" : ""}>次の50題</button>
    </div>`;
}

function bindPaginationButtons() {
  $$('[data-editor-page]').forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.dataset.editorPage;
      const totalPages = Math.max(1, Math.ceil(totalFilteredRows.length / EDITOR_PAGE_SIZE));
      if (direction === 'prev' && currentPage > 1) currentPage -= 1;
      if (direction === 'next' && currentPage < totalPages) currentPage += 1;
      renderList();
      const resultPanel = $('#editorQuestionList');
      if (resultPanel) resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function openAllQuestionCards() {
  $$(".editor-question-card").forEach(card => {
    card.open = true;
  });
}

function closeAllQuestionCards() {
  $$(".editor-question-card").forEach(card => {
    card.open = false;
  });
}

function saveVisibleEdits() {
  const editMap = getEditMap();
  let changed = 0;

  $$(".editor-question-card").forEach(card => {
    const key = card.dataset.key;
    const row = visibleRows.find(item => item.key === key);
    if (!row) return;
    const jp = sanitizeJapanese(card.querySelector('[data-field="jp"]').value.trim());
    const fullSentence = normalizeEnglish(card.querySelector('[data-field="fullSentence"]').value.trim());
    const blankSentence = normalizeBlankSentence(card.querySelector('[data-field="blankSentence"]').value.trim());
    const blankAnswer = String(card.querySelector('[data-field="blankAnswer"]').value || "").replace(/。/g, "").replace(/\s+/g, " ").trim();
    if (!jp || !fullSentence || !blankSentence || !blankAnswer) return;

    const sameAsOriginal = normalizeText(jp) === normalizeText(row.jp)
      && normalizeEnglish(fullSentence) === normalizeEnglish(row.fullSentence)
      && normalizeBlankComparable(blankSentence) === normalizeBlankComparable(row.blankSentence || "")
      && normalizeText(blankAnswer) === normalizeText(row.blankAnswer || "");
    if (sameAsOriginal) {
      if (editMap.delete(key)) changed++;
      return;
    }

    editMap.set(key, {
      key,
      grade: row.grade,
      unit: row.unit,
      level: row.levelScope || row.level || null,
      levelScope: row.levelScope || row.level || null,
      jp,
      fullSentence,
      blankSentence,
      blankAnswer,
      choices: uniqueTokens(blankAnswer),
      originalJp: row.jp,
      originalFullSentence: row.fullSentence,
      originalBlankSentence: row.blankSentence || "",
      originalBlankAnswer: row.blankAnswer || "",
      updatedAt: new Date().toISOString(),
      teacherEdited: true,
      teacherBlankEdited: true
    });
    changed++;
  });

  teacherPackage.editedQuestions = [...editMap.values()];
  savePackage(changed ? `${changed}件の編集を保存しました。` : "変更はありませんでした。");
  renderList();
}

function resetVisibleEdits() {
  if (!visibleRows.length) return;
  if (!confirm("表示中の単元について、編集済みの日本語文・英文を元に戻しますか。")) return;
  const keys = new Set(visibleRows.map(row => row.key));
  teacherPackage.editedQuestions = (teacherPackage.editedQuestions || []).filter(item => !keys.has(item.key));
  savePackage("表示中の単元の編集を元に戻しました。");
  renderList();
}

function restoreOne(key) {
  teacherPackage.editedQuestions = (teacherPackage.editedQuestions || []).filter(item => item.key !== key);
  savePackage("この問題を元に戻しました。");
  renderList();
}

function exportPackage() {
  saveVisibleEdits();
  const blob = new Blob([JSON.stringify(teacherPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wankosoba_haifuyou_data_v3_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getLevelLabel(scope) {
  if (Array.isArray(scope)) return scope.map(item => LEVEL_LABELS[item] || item).join("・");
  if (!scope || scope === "all") return "すべて";
  return String(scope).split(/[ ,/|]+/).map(item => LEVEL_LABELS[item] || item).join("・");
}

function normalizeEnglish(value) {
  const trimmed = String(value || "").replace(/。/g, "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return /[.?!]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeBlankSentence(value) {
  const trimmed = String(value || "").replace(/。/g, "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return /[.?!]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeBlankComparable(value) {
  return String(value || "").trim().toLowerCase().replace(/[.?!。！？]/g, "").replace(/\s+/g, " ");
}

function uniqueTokens(value) {
  return [...new Set(String(value || "").replace(/[.?!]/g, "").split(/\s+/).map(x => x.trim()).filter(Boolean))];
}

function sanitizeJapanese(value) {
  return String(value || "")
    .replace(/音楽を好きます/g, "音楽を聴きます")
    .replace(/音楽を好きません/g, "音楽を聴きません")
    .replace(/音楽を好きる/g, "音楽を聴く")
    .trim();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/[.?!。！？]/g, "").replace(/\s+/g, " ");
}

function showMessage(message) {
  $("#editorMessage").textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hashCode(value) {
  let hash = 0;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

document.addEventListener("DOMContentLoaded", init);
