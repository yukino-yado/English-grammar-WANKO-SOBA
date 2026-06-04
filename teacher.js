"use strict";

const TEACHER_PACKAGE_KEY = "wankoSobaTeacherPackage:v1";

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

const LEVELS = {
  small: "小盛り",
  medium: "中盛り",
  large: "大盛り",
  extra: "特盛り"
};

const DEFAULT_MENU = {
  "be動詞の文①": {
    normal: "I には am、you には are を使います。be動詞の文では、主語がどの語かを見て am / are を選びます。疑問文は be動詞を前に出し、否定文は be動詞の後ろに not を置きます。",
    examples: ["I am a student.", "Are you busy?", "I am not tired."],
    secret: "be動詞は主語と説明語をつなぐ役割を持ちます。疑問詞を使う場合も、be動詞の位置を意識します。"
  },
  "一般動詞の文①": {
    normal: "I / you を主語にした一般動詞の文では、肯定文は主語の後ろに動詞を置きます。疑問文は Do を文のはじめに置き、否定文は don't を動詞の前に置きます。",
    examples: ["I study English.", "Do you like music?", "I don't play tennis."],
    secret: "do は一般動詞の疑問文・否定文を作るための助動詞です。意味の中心は後ろの一般動詞にあります。"
  },
  "一般動詞の文②": {
    normal: "he / she を主語にした現在の一般動詞の文では、肯定文で動詞の形が変わります。疑問文・否定文では does / doesn't を使い、その後ろの動詞は原形に戻します。",
    examples: ["She listens to music.", "Does he read books?", "He doesn't play soccer."],
    secret: "does が主語と時制の情報を受け持つので、後ろの動詞には s を付けません。"
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let teacherPackage = loadPackage();
let suggestions = [];

function loadPackage() {
  try {
    const raw = localStorage.getItem(TEACHER_PACKAGE_KEY);
    if (!raw) return createEmptyPackage();
    const parsed = JSON.parse(raw);
    return normalizePackage(parsed);
  } catch (error) {
    console.warn("教師用データの読み込みに失敗しました。", error);
    return createEmptyPackage();
  }
}

function createEmptyPackage() {
  return {
    version: 1,
    updatedAt: null,
    menuOverrides: {},
    questions: []
  };
}

function normalizePackage(data) {
  const empty = createEmptyPackage();
  const next = { ...empty, ...(data || {}) };
  next.menuOverrides = next.menuOverrides && typeof next.menuOverrides === "object" ? next.menuOverrides : {};
  next.questions = Array.isArray(next.questions) ? next.questions.map(normalizeQuestion).filter(Boolean) : [];
  return next;
}

function savePackage(message = "保存しました。") {
  teacherPackage.updatedAt = new Date().toISOString();
  localStorage.setItem(TEACHER_PACKAGE_KEY, JSON.stringify(teacherPackage));
  renderAll();
  showMessage(message);
}

function init() {
  populateStaticSelects();
  bindEvents();
  loadMenuEditor();
  renderAll();
}

function populateStaticSelects() {
  ["menuGradeSelect", "qGrade", "similarGrade"].forEach(id => {
    const select = $("#" + id);
    select.innerHTML = [1, 2, 3].map(g => `<option value="${g}">中${g}</option>`).join("");
  });

  ["qLevel", "similarLevel"].forEach(id => {
    const select = $("#" + id);
    select.innerHTML = Object.entries(LEVELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
    select.value = "medium";
  });

  updateUnitSelect("menuGradeSelect", "menuUnitSelect");
  updateUnitSelect("qGrade", "qUnit");
  updateUnitSelect("similarGrade", "similarUnit");
}

function bindEvents() {
  ["menuGradeSelect", "qGrade", "similarGrade"].forEach(id => {
    $("#" + id).addEventListener("change", () => {
      const unitId = id === "menuGradeSelect" ? "menuUnitSelect" : id === "qGrade" ? "qUnit" : "similarUnit";
      updateUnitSelect(id, unitId);
      if (id === "menuGradeSelect") loadMenuEditor();
    });
  });
  $("#menuUnitSelect").addEventListener("change", loadMenuEditor);
  $("#saveMenuBtn").addEventListener("click", saveMenuOverride);
  $("#resetMenuBtn").addEventListener("click", resetMenuEditor);
  $("#addQuestionBtn").addEventListener("click", addManualQuestion);
  $("#syncBtn").addEventListener("click", () => savePackage("生徒版へ反映しました。生徒用の index.html を開き直すと反映されます。"));
  $("#exportBtn").addEventListener("click", exportPackage);
  $("#importBtn").addEventListener("click", () => $("#importPackageInput").click());
  $("#importPackageInput").addEventListener("change", importPackageFile);
  $("#clearBtn").addEventListener("click", clearAllData);
  $("#clearQuestionsBtn").addEventListener("click", clearQuestions);
  $("#sourceFileBtn").addEventListener("click", () => $("#sourceFileInput").click());
  $("#sourceFileInput").addEventListener("change", readSourceFile);
  $("#makeSimilarBtn").addEventListener("click", makeSuggestions);
  $("#sampleTextBtn").addEventListener("click", insertSampleText);
}

function updateUnitSelect(gradeSelectId, unitSelectId) {
  const grade = Number($("#" + gradeSelectId).value || 1);
  const units = GRAMMAR_UNITS[grade] || [];
  const select = $("#" + unitSelectId);
  select.innerHTML = units.map(unit => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`).join("");
}

function renderAll() {
  renderStatus();
  renderQuestionList();
}

function renderStatus() {
  const menuCount = Object.keys(teacherPackage.menuOverrides || {}).length;
  const secretCount = Object.values(teacherPackage.menuOverrides || {}).filter(item => item && item.secretEnabled !== false && String(item.secret || "").trim()).length;
  const questionCount = teacherPackage.questions.length;
  const date = teacherPackage.updatedAt ? new Date(teacherPackage.updatedAt).toLocaleString("ja-JP") : "未反映";
  $("#packageStatus").innerHTML = `
    <div class="teacher-status-card"><span>追加問題</span><strong>${questionCount}</strong></div>
    <div class="teacher-status-card"><span>お品書き編集</span><strong>${menuCount}</strong></div>
    <div class="teacher-status-card"><span>裏お品書き</span><strong>${secretCount}</strong></div>
    <div class="teacher-status-card"><span>最終反映</span><strong style="font-size:1rem;">${escapeHtml(date)}</strong></div>
    <div class="teacher-status-card"><span>連携先</span><strong style="font-size:1rem;">index.html</strong></div>
  `;
}

function loadMenuEditor() {
  const unit = $("#menuUnitSelect").value;
  const data = teacherPackage.menuOverrides[unit] || DEFAULT_MENU[unit] || { normal: "", examples: [], secret: "" };
  $("#menuNormalInput").value = data.normal || "";
  $("#menuExamplesInput").value = Array.isArray(data.examples) ? data.examples.join("\n") : "";
  $("#menuSecretInput").value = data.secret || "";
}

function saveMenuOverride() {
  const unit = $("#menuUnitSelect").value;
  teacherPackage.menuOverrides[unit] = {
    normal: $("#menuNormalInput").value.trim(),
    examples: $("#menuExamplesInput").value.split(/\n+/).map(v => v.trim()).filter(Boolean),
    secret: $("#menuSecretInput").value.trim()
  };
  savePackage(`${unit} のお品書きを保存しました。`);
}

function resetMenuEditor() {
  const unit = $("#menuUnitSelect").value;
  delete teacherPackage.menuOverrides[unit];
  savePackage(`${unit} の上書きを解除しました。`);
  loadMenuEditor();
}

function addManualQuestion() {
  const question = normalizeQuestion({
    grade: Number($("#qGrade").value),
    unit: $("#qUnit").value,
    level: $("#qLevel").value,
    jp: $("#qJp").value,
    fullSentence: $("#qFull").value,
    blankSentence: $("#qBlank").value,
    blankAnswer: $("#qAnswer").value,
    choices: splitChoices($("#qChoices").value),
    explanation: $("#qExplanation").value
  });

  if (!question) {
    showMessage("日本語・全文英文・穴埋め英文・答えを入力してください。", true);
    return;
  }
  addQuestion(question, "追加問題に入れました。");
  ["qJp", "qFull", "qBlank", "qAnswer", "qChoices", "qExplanation"].forEach(id => $("#" + id).value = "");
}

function addQuestion(question, message) {
  const map = new Map(teacherPackage.questions.map(q => [normalizeText(q.fullSentence), q]));
  map.set(normalizeText(question.fullSentence), question);
  teacherPackage.questions = [...map.values()].slice(-800);
  savePackage(message);
}

function normalizeQuestion(item) {
  if (!item || typeof item !== "object") return null;
  const jp = stripBadJapanese(String(item.jp || item.japanese || "").trim());
  const fullSentence = normalizeEnglish(String(item.fullSentence || item.en || item.english || "").trim());
  const blankSentence = normalizeEnglish(String(item.blankSentence || item.blank || "").trim());
  const blankAnswer = String(item.blankAnswer || item.answer || "").trim();
  if (!jp || !fullSentence || !blankSentence || !blankAnswer) return null;
  const grade = Math.min(3, Math.max(1, Number(item.grade || 1)));
  const unit = item.unit || (GRAMMAR_UNITS[grade] || ["先生からの一杯"])[0];
  const level = LEVELS[item.level] ? item.level : "medium";
  const choices = Array.isArray(item.choices) ? item.choices.map(String).filter(Boolean) : splitChoices(String(item.choices || ""));
  const finalChoices = choices.length ? unique([blankAnswer, ...choices]) : unique([blankAnswer, ...blankAnswer.split(/\s+/), "do", "does", "is", "are", "to"]);
  return {
    id: item.id || `teacher-${hashCode(`${jp}|${fullSentence}`)}`,
    grade,
    unit,
    level,
    jp,
    fullSentence,
    blankSentence,
    blankAnswer,
    choices: finalChoices.slice(0, 8),
    explanation: String(item.explanation || "先生が追加した問題です。文の形と空欄の前後を確認しましょう。").trim(),
    teacherMade: true
  };
}

function renderQuestionList() {
  const list = $("#teacherQuestionList");
  if (!teacherPackage.questions.length) {
    list.innerHTML = `<div class="empty-suggestions">まだ追加問題はありません。</div>`;
    return;
  }

  const groups = new Map();
  teacherPackage.questions.forEach((q, index) => {
    const key = `中${q.grade}｜${q.unit}`;
    if (!groups.has(key)) groups.set(key, { grade: q.grade, unit: q.unit, items: [] });
    groups.get(key).items.push({ q, index });
  });

  list.innerHTML = [...groups.values()].sort((a, b) => (a.grade - b.grade) || a.unit.localeCompare(b.unit, "ja")).map(group => `
    <section class="teacher-shelf">
      <div class="teacher-shelf-head">
        <span class="shelf-mark">仕込み棚</span>
        <h4>中${group.grade}　${escapeHtml(group.unit)}</h4>
        <small>${group.items.length}杯</small>
      </div>
      <div class="teacher-shelf-items">
        ${group.items.map(({ q, index }) => `
          <article class="teacher-question-card shelf-card">
            <h5>${escapeHtml(q.jp)}</h5>
            <div class="card-meta"><span>${escapeHtml(LEVELS[q.level] || q.level)}</span><span>先生からの一杯</span></div>
            <p><strong>英文：</strong>${escapeHtml(q.fullSentence)}</p>
            <p><strong>穴埋め：</strong>${escapeHtml(q.blankSentence)} / <strong>答え：</strong>${escapeHtml(q.blankAnswer)}</p>
            <p><strong>解説：</strong>${escapeHtml(q.explanation)}</p>
            <div class="teacher-question-actions">
              <button class="ghost-button" type="button" data-edit-index="${index}">編集欄へ送る</button>
              <button class="ghost-button danger-ghost" type="button" data-delete-index="${index}">削除</button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");

  $$('[data-delete-index]').forEach(btn => btn.addEventListener("click", () => deleteQuestion(Number(btn.dataset.deleteIndex))));
  $$('[data-edit-index]').forEach(btn => btn.addEventListener("click", () => fillManualForm(teacherPackage.questions[Number(btn.dataset.editIndex)])));
}

function fillManualForm(q) {
  $("#qGrade").value = q.grade;
  updateUnitSelect("qGrade", "qUnit");
  $("#qUnit").value = q.unit;
  $("#qLevel").value = q.level;
  $("#qJp").value = q.jp;
  $("#qFull").value = q.fullSentence;
  $("#qBlank").value = q.blankSentence;
  $("#qAnswer").value = q.blankAnswer;
  $("#qChoices").value = q.choices.join(" / ");
  $("#qExplanation").value = q.explanation;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteQuestion(index) {
  teacherPackage.questions.splice(index, 1);
  savePackage("追加問題を削除しました。");
}

function clearQuestions() {
  if (!confirm("追加問題だけをすべて削除しますか。")) return;
  teacherPackage.questions = [];
  savePackage("追加問題を削除しました。");
}

function clearAllData() {
  if (!confirm("教師用のお品書き編集と追加問題をすべて初期化しますか。")) return;
  teacherPackage = createEmptyPackage();
  localStorage.removeItem(TEACHER_PACKAGE_KEY);
  renderAll();
  loadMenuEditor();
  showMessage("教師用データを初期化しました。");
}

function readSourceFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    $("#sourceText").value = String(reader.result || "");
    showMessage(`${file.name} を読み込みました。`);
    event.target.value = "";
  };
  reader.readAsText(file);
}

function importPackageFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      teacherPackage = normalizePackage(parsed);
      savePackage("配布用データを取り込みました。");
      loadMenuEditor();
    } catch (error) {
      showMessage("配布用データを取り込めませんでした。", true);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function exportPackage() {
  const blob = new Blob([JSON.stringify(teacherPackage, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wankosoba_haifuyou_data_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showMessage("配布用データを作りました。");
}

function insertSampleText() {
  $("#sourceText").value = `日本語：彼女は毎日音楽を聴きますか。\n英文：Does she listen to music every day?\n穴埋め：___ she ___ to music every day?\n答え：Does listen\n解説：Does を使ったあとは、動詞は原形 listen に戻します。`;
}

function makeSuggestions() {
  const text = $("#sourceText").value.trim();
  const grade = Number($("#similarGrade").value);
  const unit = $("#similarUnit").value;
  const level = $("#similarLevel").value;
  suggestions = [];

  const parsed = parseQuestionsFromText(text, grade, unit, level);
  if (parsed.length) suggestions.push(...parsed);
  suggestions.push(...makeTemplateSuggestions(text, grade, unit, level));

  const seen = new Set();
  suggestions = suggestions.map(normalizeQuestion).filter(Boolean).filter(q => {
    const key = normalizeText(q.fullSentence);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
  renderSuggestions();
}

function parseQuestionsFromText(text, grade, unit, level) {
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    const source = Array.isArray(parsed) ? parsed : parsed.questions;
    if (Array.isArray(source)) return source.map(q => ({ grade, unit, level, ...q }));
  } catch (_) {}

  const jp = matchLine(text, /(?:日本語|和文|訳)\s*[:：]\s*(.+)/);
  const en = matchLine(text, /(?:英文|全文|英語)\s*[:：]\s*(.+)/);
  const blank = matchLine(text, /(?:穴埋め|空欄)\s*[:：]\s*(.+)/);
  const answer = matchLine(text, /(?:答え|解答|正解)\s*[:：]\s*(.+)/);
  const explanation = matchLine(text, /(?:解説|説明)\s*[:：]\s*(.+)/);
  if (jp && en && blank && answer) return [{ grade, unit, level, jp, fullSentence: en, blankSentence: blank, blankAnswer: answer, explanation }];
  return [];
}

function makeTemplateSuggestions(text, grade, unit, level) {
  const lower = text.toLowerCase();
  if (unit.includes("be動詞")) return makeBeSuggestions(grade, unit, level);
  if (unit.includes("一般動詞")) return makeGeneralVerbSuggestions(grade, unit, level);
  if (unit.includes("疑問詞") || /what|where|when|who|how/.test(lower)) return makeWhSuggestions(grade, unit, level);
  if (unit.includes("未来") || /will|going to/.test(lower)) return makeFutureSuggestions(grade, unit, level);
  if (unit.includes("不定詞") || unit.includes("動名詞") || /to \w+|ing/.test(lower)) return makeInfinitiveSuggestions(grade, unit, level);
  if (unit.includes("比較") || /than|as.+as|most/.test(lower)) return makeCompareSuggestions(grade, unit, level);
  if (unit.includes("受け身") || /was|were|is|are/.test(lower) && /by/.test(lower)) return makePassiveSuggestions(grade, unit, level);
  return makeGeneralVerbSuggestions(grade, unit, level);
}

function makeBeSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "私は中学生です。", "I am a junior high school student.", "I ___ a junior high school student.", "am", "主語が I なので am を使います。"),
    q(grade, unit, level, "あなたは忙しいですか。", "Are you busy?", "___ you busy?", "Are", "be動詞の疑問文では be動詞を主語の前に出します。"),
    q(grade, unit, level, "彼女は私の友達ではありません。", "She is not my friend.", "She ___ ___ my friend.", "is not", "be動詞の否定文は be動詞 + not で作ります。")
  ];
}

function makeGeneralVerbSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "私は毎日英語を勉強します。", "I study English every day.", "I ___ English every day.", "study", "I が主語なので、動詞は原形の study を使います。"),
    q(grade, unit, level, "あなたは朝に音楽を聴きますか。", "Do you listen to music in the morning?", "___ you ___ to music in the morning?", "Do listen", "I / you の一般動詞の疑問文では Do を使います。"),
    q(grade, unit, level, "私の兄は毎日音楽を聴きますか。", "Does my brother listen to music every day?", "___ my brother ___ to music every day?", "Does listen", "主語が my brother なので Does を使い、動詞は原形 listen にします。"),
    q(grade, unit, level, "彼女は放課後にテニスをしません。", "She doesn't play tennis after school.", "She ___ ___ tennis after school.", "doesn't play", "doesn't の後ろは動詞の原形です。")
  ];
}

function makeWhSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "あなたは何を勉強しますか。", "What do you study?", "___ do you ___?", "What study", "what は『何』をたずねる疑問詞です。"),
    q(grade, unit, level, "彼女はどこに住んでいますか。", "Where does she live?", "___ does she ___?", "Where live", "where は場所をたずねます。does の後ろは動詞の原形です。"),
    q(grade, unit, level, "箱の中に本は何冊ありますか。", "How many books are there in the box?", "___ ___ books are there in the box?", "How many", "数をたずねるときは How many を使います。")
  ];
}

function makeFutureSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "私は明日、英語を勉強するつもりです。", "I am going to study English tomorrow.", "I ___ ___ ___ study English tomorrow.", "am going to", "be going to + 動詞の原形で予定を表します。"),
    q(grade, unit, level, "彼は明日、図書館へ行くでしょう。", "He will go to the library tomorrow.", "He ___ ___ to the library tomorrow.", "will go", "will の後ろは動詞の原形です。"),
    q(grade, unit, level, "あなたは明日テニスをしますか。", "Will you play tennis tomorrow?", "___ you ___ tennis tomorrow?", "Will play", "will の疑問文では Will を文のはじめに置きます。")
  ];
}

function makeInfinitiveSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "私は本を読みたいです。", "I want to read books.", "I want ___ ___ books.", "to read", "want の後ろに to + 動詞の原形を置きます。"),
    q(grade, unit, level, "彼女は音楽を聴くことが好きです。", "She likes listening to music.", "She likes ___ to music.", "listening", "動名詞は動詞のing形で『〜すること』を表します。"),
    q(grade, unit, level, "私にとって英語を勉強することは大切です。", "It is important for me to study English.", "It is important ___ ___ ___ study English.", "for me to", "It is + 形容詞 + for 人 + to の形です。")
  ];
}

function makeCompareSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "この本はあの本よりおもしろいです。", "This book is more interesting than that one.", "This book is ___ ___ than that one.", "more interesting", "長めの形容詞では more + 形容詞 + than を使います。"),
    q(grade, unit, level, "彼は私より背が高いです。", "He is taller than I.", "He is ___ than I.", "taller", "比較級 + than で『〜より…』を表します。"),
    q(grade, unit, level, "この本はあの本と同じくらい新しいです。", "This book is as new as that one.", "This book is ___ ___ ___ that one.", "as new as", "as + 原級 + as で『同じくらい…』を表します。")
  ];
}

function makePassiveSuggestions(grade, unit, level) {
  return [
    q(grade, unit, level, "この本は多くの人に読まれています。", "This book is read by many people.", "This book ___ ___ by many people.", "is read", "受け身は be動詞 + 過去分詞で作ります。"),
    q(grade, unit, level, "その窓は昨日割られました。", "The window was broken yesterday.", "The window ___ ___ yesterday.", "was broken", "過去の受け身では was / were + 過去分詞を使います。"),
    q(grade, unit, level, "その机は日本で作られました。", "The desk was made in Japan.", "The desk ___ ___ in Japan.", "was made", "by を使わない受け身表現もあります。")
  ];
}

function q(grade, unit, level, jp, fullSentence, blankSentence, blankAnswer, explanation) {
  return normalizeQuestion({
    grade, unit, level, jp, fullSentence, blankSentence, blankAnswer,
    choices: buildChoices(blankAnswer), explanation
  });
}

function renderSuggestions() {
  const container = $("#suggestionList");
  if (!suggestions.length) {
    container.classList.add("empty-suggestions");
    container.innerHTML = "候補を作れませんでした。単元を指定して、教材文や例題をもう少し具体的に入れてください。";
    return;
  }
  container.classList.remove("empty-suggestions");
  container.innerHTML = suggestions.map((item, index) => `
    <article class="suggestion-card">
      <h4>候補 ${index + 1}</h4>
      <div class="editable-grid">
        <input data-sug="jp" data-index="${index}" value="${escapeHtml(item.jp)}">
        <input data-sug="fullSentence" data-index="${index}" value="${escapeHtml(item.fullSentence)}">
        <input data-sug="blankSentence" data-index="${index}" value="${escapeHtml(item.blankSentence)}">
        <input data-sug="blankAnswer" data-index="${index}" value="${escapeHtml(item.blankAnswer)}">
        <input data-sug="choices" data-index="${index}" value="${escapeHtml(item.choices.join(" / "))}">
        <textarea data-sug="explanation" data-index="${index}" rows="3">${escapeHtml(item.explanation)}</textarea>
      </div>
      <div class="teacher-action-row compact">
        <button class="primary-button" type="button" data-add-suggestion="${index}">この候補を追加</button>
      </div>
    </article>
  `).join("");

  $$('[data-sug]').forEach(input => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.index);
      const key = input.dataset.sug;
      if (key === "choices") suggestions[index].choices = splitChoices(input.value);
      else suggestions[index][key] = input.value;
    });
  });
  $$('[data-add-suggestion]').forEach(btn => btn.addEventListener("click", () => {
    const index = Number(btn.dataset.addSuggestion);
    const normalized = normalizeQuestion(suggestions[index]);
    if (!normalized) return showMessage("候補の形式が不十分です。", true);
    addQuestion(normalized, "類題候補を追加しました。");
  }));
}

function splitChoices(value) {
  return String(value || "").split(/[\/、,，\n]+/).map(v => v.trim()).filter(Boolean);
}

function buildChoices(answer) {
  const base = answer.split(/\s+/).filter(Boolean);
  return unique([...base, answer, "do", "does", "is", "are", "was", "were", "to", "ing", "not"]);
}

function unique(list) {
  return [...new Set(list.map(v => String(v).trim()).filter(Boolean))];
}

function normalizeEnglish(value) {
  return String(value || "").replace(/。/g, "").replace(/\s+/g, " ").trim();
}

function stripBadJapanese(value) {
  return String(value || "")
    .replace(/音楽を好きます/g, "音楽を聴きます")
    .replace(/音楽を好きません/g, "音楽を聴きません")
    .replace(/音楽を好きる/g, "音楽を聴く")
    .trim();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/[.?!。！？]/g, "").replace(/\s+/g, " ");
}

function matchLine(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function showMessage(message, isError = false) {
  const target = $("#syncMessage");
  target.textContent = message;
  target.style.color = isError ? "#982d22" : "#65513e";
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
  const str = String(value);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

document.addEventListener("DOMContentLoaded", init);
