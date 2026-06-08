"use strict";

const STORAGE_KEY = "wankoSobaGrammarProgress:v5";
const TEACHER_PACKAGE_KEY = "wankoSobaTeacherPackage:v1";
const TEACHER_CLOUD_ENDPOINT = "/api/teacher-package";

const MODES = {
  erande: {
    label: "えらんで一杯",
    short: "四択",
    description: "選択肢から正しい文法パーツを選ぶ"
  },
  narabete: {
    label: "ならべて一杯",
    short: "並べ替え",
    description: "単語カードをタップした順に並べる"
  },
  umete: {
    label: "うめて一杯",
    short: "穴埋め",
    description: "空欄に自分で答えを入力する"
  },
  kakikiri: {
    label: "書ききり一杯",
    short: "全文入力",
    description: "過去に解いた文を全文で書く"
  }
};

const LEVELS = {
  small: {
    label: "小盛り",
    description: "文法の核を確認。肯定文・否定文・疑問文を重視。",
    order: 1
  },
  medium: {
    label: "中盛り",
    description: "標準練習。語彙・熟語・自然な表現も少し入る。",
    order: 2
  },
  large: {
    label: "大盛り",
    description: "難関挑戦。文構造や語順判断を重視。",
    order: 3
  },
  extra: {
    label: "特盛り",
    description: "EX。複数文法と発展的な読み取り。",
    order: 4
  }
};

const GRADES = [
  { value: 1, label: "1名様", sub: "中1レベル" },
  { value: 2, label: "2名様", sub: "中2レベル" },
  { value: 3, label: "3名様", sub: "中3レベル" }
];

const CUP_OPTIONS = [10, 15, 20, 25, 30];
const TIME_OPTIONS = [5, 10, 15, 20, 25, 30];
const TEACHER_UNIT_NAME = "先生からの一杯";
const TEACHER_UNIT_PREFIX = "teacher-unit::";
const IS_TEACHER_PREVIEW = new URLSearchParams(location.search).has("teacherPreview") || location.hash.includes("teacherPreview");
const REVIEW_STYLE_UNITS = new Set(["be動詞のまとめ", "一般動詞の文のまとめ"]);
const PREGENERATED_BANK_VERSION = "v3.5-selection-rule-bank";
const PREGENERATED_PER_UNIT_LEVEL = 14;
const PREGENERATED_LEVELS = ["small", "medium", "large", "extra"];

const GRAMMAR_UNITS = {
  1: [
    "be動詞の文①",
    "一般動詞の文①",
    "be動詞の文②",
    "一般動詞の文②",
    "be動詞のまとめ",
    "一般動詞の文のまとめ",
    "名詞・代名詞の基本",
    "疑問詞を使った疑問文",
    "基本表現の広がり①",
    "存在構文",
    "方法をたずねる文",
    "現在進行形",
    "過去形の基本"
  ],
  2: [
    "過去・進行形の発展",
    "接続詞 when",
    "未来表現",
    "接続詞 if",
    "助動詞・必要を表す文",
    "不定詞・動名詞",
    "人にものを渡す・伝える文",
    "前置詞の基本",
    "接続詞と文をつなぐ表現",
    "It is 構文",
    "比較",
    "受け身"
  ],
  3: [
    "受け身の発展",
    "人やものを説明する文",
    "現在完了",
    "関係代名詞",
    "thatを使う文・間接疑問文",
    "名詞を後ろから説明する文",
    "不定詞の発展",
    "前置詞の発展",
    "仮定法"
  ]
};

const MENU_EXPLANATIONS = {
  "I am / You are": {
    normal: "主語が I のときは am、you のときは are を使います。be動詞は『です』『います』『あります』のような意味を作ります。",
    examples: ["I am a student.", "You are kind."],
    secret: "be動詞は主語と補語を結びつける働きを持ちます。I am happy. では happy が主語 I の状態を説明しています。"
  },
  "He is / She is": {
    normal: "he や she のように1人の人を表す主語には is を使います。",
    examples: ["He is busy.", "She is my friend."],
    secret: "三人称単数の主語では、be動詞は is になります。一般動詞の三単現と合わせて主語を見る癖を作ります。"
  },
  "This is / That is": {
    normal: "近くのものは this、遠くのものは that を使います。どちらも is とセットでよく使います。",
    examples: ["This is my bag.", "That is a library."],
    secret: "this / that は指示代名詞として主語にも目的語にもなります。文中の役割で訳し方が変わります。"
  },
  "be動詞の使い分け": {
    normal: "I は am、you と複数は are、he / she / it は is を使います。",
    examples: ["I am tired.", "They are students."],
    secret: "be動詞は時制と主語によって形が変化します。現在は am / are / is、過去は was / were です。"
  },
  "be動詞の否定文": {
    normal: "be動詞の後ろに not を置くと否定文になります。",
    examples: ["I am not busy.", "She is not a teacher."],
    secret: "be動詞は助動詞的に否定や疑問を作れます。そのため do を使わず、be の後ろに not を置きます。"
  },
  "be動詞の疑問文": {
    normal: "be動詞を主語の前に出すと疑問文になります。",
    examples: ["Are you busy?", "Is he a student?"],
    secret: "疑問文では主語とbe動詞が倒置します。文型自体は SVC のままです。"
  },
  "一般動詞とは": {
    normal: "一般動詞は、study, play, read のように動作や状態を表す動詞です。",
    examples: ["I study English.", "She plays tennis."],
    secret: "一般動詞の文では、否定・疑問を作るときに do / does / did などの助動詞が必要になります。"
  },
  "一般動詞の否定文": {
    normal: "一般動詞の前に don't / doesn't / didn't を置くと否定文になります。その後ろの動詞は原形です。",
    examples: ["I don't play tennis.", "He doesn't study math."],
    secret: "doesn't や didn't は時制・三単現の情報をすでに持つため、後ろの動詞は原形に戻ります。"
  },
  "一般動詞の疑問文": {
    normal: "Do / Does / Did を文のはじめに置いて疑問文を作ります。その後ろの動詞は原形です。",
    examples: ["Do you like music?", "Does she play tennis?"],
    secret: "疑問文の先頭に出る do は、文法情報を運ぶ助動詞です。動詞本体は原形に戻ります。"
  },
  "疑問詞what": {
    normal: "what は『何』をたずねる疑問詞です。",
    examples: ["What do you study?", "What is this?"],
    secret: "疑問詞は文頭に出ますが、後ろの語順は疑問文の形になります。間接疑問文では語順が変わります。"
  },
  "疑問詞who": {
    normal: "who は『だれ』をたずねる疑問詞です。",
    examples: ["Who is he?", "Who plays the guitar?"],
    secret: "who が主語になる場合は、Do you...? の形にせず、そのまま Who plays...? になります。"
  },
  "疑問詞when": {
    normal: "when は『いつ』をたずねる疑問詞です。",
    examples: ["When do you study?", "When is your birthday?"],
    secret: "when は時を表す副詞句をたずねます。文の骨組みを残して、時の部分だけを疑問詞に置き換えます。"
  },
  "疑問詞where": {
    normal: "where は『どこで』『どこへ』をたずねる疑問詞です。",
    examples: ["Where do you live?", "Where is my bag?"],
    secret: "where は場所を表す副詞句をたずねます。go なら『どこへ』、live なら『どこに』と日本語が変わります。"
  },
  "名詞の複数形s": {
    normal: "2つ以上のものを表すとき、名詞に s / es をつけます。",
    examples: ["two books", "three boxes"],
    secret: "複数形には規則変化と不規則変化があります。child → children のような形もあります。"
  },
  "命令文": {
    normal: "命令文は主語 you を省略し、動詞の原形から始めます。",
    examples: ["Open the window.", "Don't run here."],
    secret: "命令文の主語は意味上 you です。否定命令は Don't + 動詞の原形 で作ります。"
  },
  "代名詞の変化表": {
    normal: "I / my / me / mine のように、代名詞は文の中での役割によって形が変わります。",
    examples: ["I like her.", "This is my book."],
    secret: "主格・所有格・目的格・所有代名詞を、文中の役割で判断します。日本語訳だけで決めないことが大切です。"
  },
  "現在進行形": {
    normal: "be動詞 + 動詞のing形で『今〜している』を表します。",
    examples: ["I am studying English.", "She is reading a book."],
    secret: "進行形は一時的な動作を表します。現在の習慣を表す一般現在と区別します。"
  },
  "助動詞can": {
    normal: "can + 動詞の原形で『〜できる』を表します。否定文は cannot、疑問文は Can を前に出します。",
    examples: ["I can swim.", "Can you play tennis?"],
    secret: "助動詞の後ろは必ず動詞の原形です。助動詞が文法情報を持つため、三単現の s はつきません。"
  },
  "一般動詞の過去形": {
    normal: "過去のことを表すとき、動詞を過去形にします。yesterday などが目印になります。",
    examples: ["I played tennis yesterday.", "She studied English."],
    secret: "過去形には規則変化と不規則変化があります。did を使う否定・疑問では動詞は原形に戻ります。"
  },
  "be動詞の過去形": {
    normal: "am / is の過去形は was、are の過去形は were です。",
    examples: ["I was busy.", "They were happy."],
    secret: "過去の状態を表すとき、be動詞を was / were に変えます。動作ではなく状態の過去です。"
  },
  "過去進行形": {
    normal: "was / were + 動詞のing形で『〜していました』を表します。",
    examples: ["I was studying then.", "They were playing soccer."],
    secret: "過去のある時点で進行中だった動作を表します。when節と組み合わせると入試でよく出ます。"
  },
  "look / sound / become / get": {
    normal: "look, sound, become, get などは後ろに形容詞を置いて状態を表せます。",
    examples: ["You look happy.", "It sounds good."],
    secret: "SVC型の動詞です。後ろの形容詞が主語の状態を説明します。副詞と混同しないようにします。"
  },
  "be going to": {
    normal: "be going to + 動詞の原形で『〜するつもり』『〜しそうだ』を表します。",
    examples: ["I am going to study.", "It is going to rain."],
    secret: "未来表現ですが、予定・意図・兆候を表すことが多く、will とはニュアンスが違います。"
  },
  "give / show / tell / buy": {
    normal: "give 人 物 のように、人と物を続けて置ける動詞があります。",
    examples: ["I gave him a book.", "She showed me a picture."],
    secret: "第4文型 SVOO です。give a book to him のように前置詞を使って言い換えられます。"
  },
  "不定詞の3用法": {
    normal: "to + 動詞の原形で、『〜すること』『〜するために』『〜するための』を表します。",
    examples: ["I want to read books.", "I went there to study."],
    secret: "不定詞は名詞的・副詞的・形容詞的に働きます。意味上の主語や完了不定詞にも発展します。"
  },
  "未来形will": {
    normal: "will + 動詞の原形で未来のことを表します。",
    examples: ["I will study tomorrow.", "She will come here."],
    secret: "will は未来だけでなく、意志・推量にも使われます。文脈で意味を判断します。"
  },
  "willの疑問文": {
    normal: "Will を文のはじめに置いて疑問文を作ります。後ろの動詞は原形です。",
    examples: ["Will you come tomorrow?"],
    secret: "助動詞 will が文頭に出ます。助動詞の後ろは常に動詞の原形です。"
  },
  "willの否定文": {
    normal: "will not + 動詞の原形で『〜しないでしょう』『〜するつもりはない』を表します。",
    examples: ["I will not go there."],
    secret: "won't は will not の短縮形です。未来の否定・意志の否定の両方で使います。"
  },
  "have to": {
    normal: "have to + 動詞の原形で『〜しなければならない』を表します。",
    examples: ["I have to study."],
    secret: "must と近い意味ですが、外からの必要性を表すことが多いです。"
  },
  "have toの疑問文": {
    normal: "Do / Does + 主語 + have to + 動詞の原形? で疑問文を作ります。",
    examples: ["Do you have to study?"],
    secret: "have to は一般動詞 have を含む表現なので、疑問文では do / does を使います。"
  },
  "have toの否定文": {
    normal: "don't / doesn't have to + 動詞の原形で『〜する必要はない』を表します。",
    examples: ["You don't have to go."],
    secret: "must not は禁止、don't have to は不要です。意味が大きく違います。"
  },
  "must": {
    normal: "must + 動詞の原形で『〜しなければならない』を表します。",
    examples: ["You must study hard."],
    secret: "must は話し手の強い判断・義務を表します。推量の must にも発展します。"
  },
  "mustの疑問文": {
    normal: "Must を文のはじめに置いて疑問文を作ります。",
    examples: ["Must I go now?"],
    secret: "Must I...? への答えは No, you don't have to. となることがあります。"
  },
  "mustの否定文": {
    normal: "must not + 動詞の原形で『〜してはいけない』を表します。",
    examples: ["You must not run here."],
    secret: "must not は禁止です。don't have to と混同しないことが重要です。"
  },
  "may": {
    normal: "may + 動詞の原形で『〜してもよい』『〜かもしれない』を表します。",
    examples: ["You may use this pen.", "It may rain."],
    secret: "may は許可と推量を表します。文脈で意味を判断します。"
  },
  "shall": {
    normal: "Shall I...? で『私が〜しましょうか』、Shall we...? で『〜しましょうか』を表します。",
    examples: ["Shall we dance?", "Shall I open the window?"],
    secret: "shall は提案や申し出で使われます。現代英語では使用場面が限られます。"
  },
  "動名詞": {
    normal: "動詞のing形を名詞のように使い、『〜すること』を表します。",
    examples: ["I like reading books.", "Playing tennis is fun."],
    secret: "動名詞は名詞として働くため、主語・目的語・補語になります。不定詞との使い分けが重要です。"
  },
  "There is": {
    normal: "There is / are で『〜があります』『〜がいます』を表します。",
    examples: ["There is a book on the desk.", "There are many students."],
    secret: "There is 構文の主語は後ろの名詞です。単数・複数で is / are が決まります。"
  },
  "接続詞": {
    normal: "and, but, because, when, if などは文と文をつなぐ働きをします。",
    examples: ["I stayed home because it rained.", "When I got home, she was cooking."],
    secret: "接続詞は節を作ります。従属節と主節の関係を読み取ることが長文理解につながります。"
  },
  "比較級": {
    normal: "比較級 + than で『〜より…』を表します。",
    examples: ["This book is newer than that one."],
    secret: "比較は形容詞・副詞の程度差を表します。more を使う語と er をつける語の判断が必要です。"
  },
  "最上級": {
    normal: "the + 最上級で『一番〜』を表します。",
    examples: ["This is the tallest building in this city."],
    secret: "範囲を表す of / in の使い分けや、one of the 最上級 + 複数名詞 に発展します。"
  },
  "as ... as": {
    normal: "as + 原級 + as で『〜と同じくらい…』を表します。",
    examples: ["This book is as interesting as that one."],
    secret: "not as ... as は『〜ほど…ではない』です。比較級への書き換えにもつながります。"
  },
  "前置詞の種類": {
    normal: "in, on, at, to, for などは名詞の前に置き、場所・時・方向などを表します。",
    examples: ["in the morning", "at school", "on Sunday"],
    secret: "前置詞は後ろに名詞句を取り、形容詞句・副詞句を作ります。文中での働きを見ることが重要です。"
  },
  "受動態": {
    normal: "be動詞 + 過去分詞で『〜される』を表します。",
    examples: ["This book is read by many people."],
    secret: "受動態は目的語を主語にする構造です。能動態との対応関係を理解します。"
  },
  "受動態の疑問文・否定文": {
    normal: "疑問文はbe動詞を前に出し、否定文はbe動詞の後ろに not を置きます。",
    examples: ["Is this book read by many people?", "This book is not read."],
    secret: "受動態でも中心はbe動詞です。疑問・否定の作り方はbe動詞の文と同じです。"
  },
  "受動態でbyを使わないパターン": {
    normal: "行為者が一般の人・不明・重要でないとき、byを使わないことがあります。",
    examples: ["English is spoken in many countries."],
    secret: "by句は必要なときだけ置きます。受動態は情報の焦点を変える表現です。"
  },
  "call / make / name": {
    normal: "call A B で『AをBと呼ぶ』、make A B で『AをBにする』のような文を作ります。",
    examples: ["We call him Ken.", "The news made me happy."],
    secret: "SVOC型です。目的語の後ろの補語が目的語の状態や名前を説明します。"
  },
  "現在完了形の継続": {
    normal: "have / has + 過去分詞で、過去から今まで続くことを表します。for や since とよく使います。",
    examples: ["I have lived here for three years."],
    secret: "現在完了は過去と現在のつながりを表します。単なる過去形とは視点が違います。"
  },
  "現在完了形の経験": {
    normal: "have / has + 過去分詞で『〜したことがある』を表します。ever や never とよく使います。",
    examples: ["I have been to Tokyo twice."],
    secret: "経験用法では、回数・ever・never などが目印になります。when と一緒には使いにくいです。"
  },
  "現在完了形の完了": {
    normal: "have / has + 過去分詞で『ちょうど〜したところ』『もう〜した』を表します。just / already / yet と使います。",
    examples: ["I have just finished my homework."],
    secret: "完了用法は過去の動作が現在に影響していることを表します。"
  },
  "疑問詞 + to 動詞の原形": {
    normal: "what to do, where to go のように『何を〜すべきか』を表します。",
    examples: ["I don't know what to do."],
    secret: "疑問詞 + to不定詞は名詞句として働きます。間接疑問文との書き換えが重要です。"
  },
  "It is + 形容詞 + for 人 + to": {
    normal: "It is 形容詞 for 人 to 動詞で『人にとって〜することは…だ』を表します。",
    examples: ["It is important for me to study English."],
    secret: "形式主語 it を使い、真主語である to不定詞句を後ろに置きます。"
  },
  "want 人 to": {
    normal: "want 人 to 動詞の原形で『人に〜してほしい』を表します。",
    examples: ["I want you to help me."],
    secret: "目的語 + to不定詞の構造です。ask / tell などにも発展します。"
  },
  "間接疑問文": {
    normal: "疑問詞 + 主語 + 動詞 の語順で、文の中に疑問の内容を入れます。",
    examples: ["I know where he lives."],
    secret: "間接疑問文では疑問文の語順にしません。do / does / did が消える場合があります。"
  },
  "現在分詞・過去分詞による後置修飾": {
    normal: "名詞の後ろに分詞を置いて、その名詞を説明できます。",
    examples: ["the boy playing soccer", "the book written in English"],
    secret: "現在分詞は能動・進行、過去分詞は受動・完了の意味を持つことが多いです。"
  },
  "主語＋動詞による後置修飾": {
    normal: "名詞の後ろに主語＋動詞を続けて、その名詞を説明することがあります。",
    examples: ["the book I bought yesterday"],
    secret: "関係代名詞が省略された形として考えると理解しやすいです。"
  },
  "関係代名詞": {
    normal: "who, which, that などを使って、名詞を後ろから詳しく説明します。",
    examples: ["I know a boy who can speak English."],
    secret: "関係代名詞節は形容詞節です。先行詞が人か物か、主格か目的格かで形を選びます。"
  },
  "前置詞の使い方": {
    normal: "前置詞は意味だけでなく、動詞や形容詞との組み合わせで覚えることも大切です。",
    examples: ["listen to music", "be good at English"],
    secret: "前置詞は句を作り、文中で副詞・形容詞の働きをします。熟語としてのまとまりも重要です。"
  }
};

Object.assign(MENU_EXPLANATIONS, {
  "be動詞の文①": {
    normal: "I と you を主語にした be動詞の文を扱います。肯定文は『主語 + be動詞 + 説明』、否定文は be動詞の後ろに not、疑問文は be動詞を文のはじめに出します。疑問詞を使う問いも、be動詞の位置を意識して作ります。",
    examples: ["I am a student.", "Are you busy?", "What are you?"],
    secret: "be動詞は主語と補語をつなぐ働きを持ちます。疑問詞がついても、文の骨組みは be動詞の文です。"
  },
  "一般動詞の文①": {
    normal: "I / you を主語にした一般動詞の文を扱います。肯定文では動詞をそのまま使い、否定文では don't、疑問文では Do を使います。疑問詞を使う問いでも、do の後ろの動詞は原形です。",
    examples: ["I study English.", "You don't play tennis.", "What do you study?"],
    secret: "do は文法情報を運ぶ助動詞です。疑問・否定では動詞本体を原形に保つことが重要です。"
  },
  "be動詞の文②": {
    normal: "he / she / this / that を主語にした be動詞の文を扱います。1人・1つのものを表す主語では is を使います。否定文は is not、疑問文は Is を文頭に出します。",
    examples: ["He is busy.", "This is my bag.", "Is she your friend?"],
    secret: "三人称単数の主語と is の対応を、一般動詞の形の変化とつなげて理解します。"
  },
  "一般動詞の文②": {
    normal: "he / she を主語にした一般動詞の文を扱います。肯定文では動詞の形が変わり、疑問文・否定文では does / doesn't を使います。does を使ったあとの動詞は原形に戻します。",
    examples: ["She studies English.", "He doesn't play soccer.", "Does she read books?"],
    secret: "三単現を独立暗記にせず、主語・現在・一般動詞という条件がそろったときの形として扱います。"
  },
  "be動詞のまとめ": {
    normal: "I / you / he / she / this / that を主語にした be動詞の文をまとめます。be動詞は主語によって am / are / is を使い分け、否定文では not を後ろに置き、疑問文では be動詞を文のはじめに出します。",
    examples: ["I am a student.", "You are busy.", "She is kind.", "Is this your bag?"],
    secret: "be動詞は、主語とその説明をつなぐ文の中心です。主語を見て be動詞を決める流れを反射で出せるようにします。"
  },
  "一般動詞の文のまとめ": {
    normal: "I / you / he / she を主語にした一般動詞の文をまとめます。肯定文では主語によって動詞の形を決め、否定文・疑問文では do / does を使います。do / does の後ろは動詞の原形です。",
    examples: ["I play tennis.", "You don't like math.", "She studies English.", "Does he read books?"],
    secret: "一般動詞の文では、主語・現在の文かどうか・肯定文か疑問文か否定文かを順番に見ることが大切です。"
  },
  "名詞・代名詞の基本": {
    normal: "名詞の複数形と代名詞の変化を扱います。2つ以上なら基本は名詞に s をつけます。代名詞は、主語・所有・目的語など文の中の役割によって形が変わります。",
    examples: ["two books", "I like her.", "This is my book."],
    secret: "名詞句の形を整える力は、長い文を読むときの土台になります。"
  },
  "疑問詞を使った疑問文": {
    normal: "what / who / where / when / why / how などを使う疑問文を扱います。疑問詞は文のはじめに置き、その後ろは be動詞の疑問文、または do / does を使う疑問文の形にします。How many、What time、Whose、Which、or疑問文、感嘆文もここで扱います。",
    examples: ["What do you like?", "Where is your bag?", "How many books do you have?"],
    secret: "疑問詞が何をたずねているかによって、文に残る語と消える語が変わります。"
  },
  "基本表現の広がり①": {
    normal: "命令文と can を扱います。命令文は動詞の原形から始め、can の後ろも動詞の原形を使います。どちらも、英語の文を短く正確に作るための基本表現です。",
    examples: ["Open the window.", "Don't run.", "Can you swim?"],
    secret: "命令文の主語は意味上 you です。can は助動詞なので、後ろの動詞に s や過去形をつけません。"
  },
  "存在構文": {
    normal: "There is / There are を使って『〜があります・います』を表します。後ろに来る名詞が単数なら is、複数なら are を使います。否定文、疑問文、How many ... are there? もここで扱います。",
    examples: ["There is a book on the desk.", "There are three pens.", "How many students are there?"],
    secret: "there は形式的な主語で、実際に数を決める中心は後ろの名詞です。"
  },
  "方法をたずねる文": {
    normal: "How do you ...?、How can I / we ...?、Can you ...? のように、方法や手段をたずねる文を扱います。do / can の後ろは動詞の原形です。",
    examples: ["How do you study English?", "How can I get there?", "Can you help me?"],
    secret: "how は『どのように』だけでなく、手段・状態・程度をたずねる疑問詞です。"
  },
  "過去形の基本": {
    normal: "一般動詞の過去形と be動詞の過去形を扱います。一般動詞は played / studied のような過去形、be動詞は was / were を使います。",
    examples: ["I played tennis yesterday.", "She was busy."],
    secret: "過去の否定・疑問では did を使い、動詞は原形に戻ります。"
  },
  "過去・進行形の発展": {
    normal: "be動詞の過去形と過去進行形を扱います。過去進行形は was / were + 動詞のing形で、過去のある時点でしていた途中の動作を表します。",
    examples: ["I was busy yesterday.", "She was reading a book then."],
    secret: "過去の時点を表す語句と組み合わせると、過去進行形の意味がはっきりします。"
  },
  "未来表現": {
    normal: "be going to と will を扱います。どちらも未来を表しますが、be going to は予定・意図、will はその場の意志や未来の見通しを表すことが多いです。疑問文・否定文もセットで練習します。",
    examples: ["I am going to study.", "She will come tomorrow.", "Will you help me?"],
    secret: "未来表現では、主語に合わせた be動詞と、助動詞 will の後ろの原形を区別します。"
  },
  "助動詞・必要を表す文": {
    normal: "can / may / shall / must / have to を扱います。助動詞の後ろは動詞の原形です。have to は意味は助動詞に近いですが、疑問文・否定文では do / does を使います。",
    examples: ["You must study.", "May I come in?", "Do you have to go?"],
    secret: "must not と don't have to は意味が違います。must not は禁止、don't have to は不要です。"
  },
  "不定詞・動名詞": {
    normal: "不定詞は to + 動詞の原形、動名詞は 動詞のing形 です。どちらも『〜すること』を表せますが、使える場所や動詞との相性が違います。不定詞は3用法を整理します。",
    examples: ["I want to read books.", "I enjoy reading books.", "I went there to study."],
    secret: "不定詞は名詞・形容詞・副詞の働きを持ち、動名詞は名詞として働きます。"
  },
  "人にものを渡す・伝える文": {
    normal: "give / show / tell / buy などを使って『人にものを〜する』文を扱います。give 人 物 の形と、give 物 to 人 / buy 物 for 人 の形を整理します。",
    examples: ["I gave him a book.", "She bought me a pen."],
    secret: "第4文型 SVOO と、第3文型への書き換えを対応させます。"
  },
  "前置詞の基本": {
    normal: "場所・時・動詞とセットで使う前置詞を扱います。in / on / at / to / for などは、日本語の助詞と完全には対応しないため、まとまりで覚えることが大切です。",
    examples: ["at school", "on Sunday", "listen to music"],
    secret: "前置詞句は文の中で、場所・時・説明を加える部品として働きます。"
  },
  "接続詞と文をつなぐ表現": {
    normal: "because、that節、I think that ...、I’m sure that ... などを扱います。文と文をつなぐときは、接続詞の後ろにも主語と動詞の組が来ます。",
    examples: ["I think that he is kind.", "I am sure that she is kind."],
    secret: "that節は名詞節として、動詞や形容詞の後ろに置けます。"
  },
  "It is 構文": {
    normal: "It is + 形容詞 + for 人 + to ... を扱います。『人にとって〜することは…だ』という意味です。不定詞を主語にした文との書き換えも練習します。",
    examples: ["It is important for me to study English.", "To study English is important for me."],
    secret: "it は形式主語で、本当の主語は後ろの to不定詞です。"
  },
  "比較": {
    normal: "比較級、最上級、as ... as をまとめて扱います。何と何を比べているのか、同じくらいなのか、一番なのかを見分けます。",
    examples: ["This book is newer than that one.", "This is the most interesting book.", "He is as tall as I."],
    secret: "比較表現では、than / the / as の有無が文の型を決めます。"
  },
  "受け身": {
    normal: "be動詞 + 過去分詞で『〜される』を表します。中2では will be + 過去分詞 は扱わず、現在・過去の受け身、否定文、疑問文、byを使う/使わない受け身を扱います。",
    examples: ["This book is read by many students.", "English is spoken in many countries."],
    secret: "受け身は、動作を受ける側を主語にする表現です。"
  },
  "受け身の発展": {
    normal: "受け身の発展では、will be + 過去分詞、byを使わない受け身の発展を扱います。時制や助動詞が入っても、中心は be + 過去分詞です。",
    examples: ["This room will be cleaned tomorrow.", "French is spoken in Canada."],
    secret: "助動詞・完了・進行と組み合わせた受動態へ発展します。"
  },
  "人やものを説明する文": {
    normal: "call / make / name、make 人 形容詞、make / let / help + 人 + 動詞の原形を扱います。目的語の後ろに説明や動作を続ける形です。",
    examples: ["We call him Ken.", "The news made me happy.", "Let me help you."],
    secret: "SVOCや原形不定詞の考え方につながります。"
  },
  "現在完了": {
    normal: "have / has + 過去分詞で、過去と現在のつながりを表します。継続・経験・完了・現在完了進行形を扱います。",
    examples: ["I have lived here for three years.", "I have been to Tokyo.", "I have just finished my homework."],
    secret: "現在完了は『過去の一点』ではなく、現在との関係を表す表現です。"
  },
  "thatを使う文・間接疑問文": {
    normal: "be glad that ... / be happy that ... / be surprised that ... と間接疑問文を扱います。間接疑問文では『疑問詞 + 主語 + 動詞』の語順になります。",
    examples: ["I am glad that you are fine.", "I know where he lives."],
    secret: "that節も間接疑問文も、文の中で名詞のかたまりとして働くことがあります。"
  },
  "名詞を後ろから説明する文": {
    normal: "現在分詞・過去分詞による後置修飾、名詞の後ろに主語＋動詞が続く文を扱います。英語では、名詞の後ろに説明を足していくことがあります。",
    examples: ["the boy playing soccer", "the book written in English", "the book I bought yesterday"],
    secret: "名詞の後ろから説明を足す考え方は、長い英文を読む土台になります。"
  },
  "不定詞の発展": {
    normal: "疑問詞 + to 動詞、want 人 to、tell / ask 人 to を扱います。to不定詞の前後にどんな語が来るかで意味が変わります。",
    examples: ["I don't know what to do.", "I want you to help me.", "She asked me to wait."],
    secret: "疑問詞 + to不定詞や、人 + to不定詞のかたまりを文中で正しく置くことが大切です。"
  },
  "前置詞の発展": {
    normal: "動詞や形容詞とセットで使う前置詞、前置詞句による説明を扱います。熟語として覚える部分と、文中での働きを見る部分の両方が大切です。",
    examples: ["be interested in music", "be good at English", "the book on the desk"],
    secret: "前置詞句は名詞を説明したり、動作の場所・時・方向を補ったりします。"
  },
  "仮定法": {
    normal: "If I were ..., I would ...、If I could ..., I would ...、I wish I could ... を扱います。現実とは違うことや、実現が難しい願いを表します。",
    examples: ["If I were you, I would study.", "If I could fly, I would go there.", "I wish I could speak English."],
    secret: "仮定法では、現在のことでも過去形を使って距離感を表します。"
  }
});


const VOCAB = {
  subjects: [
    { jp: "私は", en: "I", be: "am", pastBe: "was", type: "first", pronounObj: "me", poss: "my" },
    { jp: "あなたは", en: "you", be: "are", pastBe: "were", type: "second", pronounObj: "you", poss: "your" },
    { jp: "彼は", en: "he", be: "is", pastBe: "was", type: "thirdSingle", pronounObj: "him", poss: "his" },
    { jp: "彼女は", en: "she", be: "is", pastBe: "was", type: "thirdSingle", pronounObj: "her", poss: "her" },
    { jp: "私の兄は", en: "my brother", be: "is", pastBe: "was", type: "thirdSingle", pronounObj: "him", poss: "his" },
    { jp: "私の友達は", en: "my friend", be: "is", pastBe: "was", type: "thirdSingle", pronounObj: "him", poss: "his" },
    { jp: "トムとケンは", en: "Tom and Ken", be: "are", pastBe: "were", type: "plural", pronounObj: "them", poss: "their" },
    { jp: "彼らは", en: "they", be: "are", pastBe: "were", type: "plural", pronounObj: "them", poss: "their" }
  ],
  nouns: [
    { jp: "本", en: "book", plural: "books", counter: "冊" },
    { jp: "箱", en: "box", plural: "boxes", counter: "個" },
    { jp: "ペン", en: "pen", plural: "pens", counter: "本" },
    { jp: "辞書", en: "dictionary", plural: "dictionaries", counter: "冊" },
    { jp: "リンゴ", en: "apple", plural: "apples", counter: "個" },
    { jp: "ノート", en: "notebook", plural: "notebooks", counter: "冊" }
  ],
  objects: [
    { jp: "英語", en: "English" },
    { jp: "数学", en: "math" },
    { jp: "ピアノ", en: "the piano" },
    { jp: "テニス", en: "tennis" },
    { jp: "本", en: "books" },
    { jp: "テレビ", en: "TV" },
    { jp: "音楽", en: "music" },
    { jp: "夕食", en: "dinner" }
  ],
  verbs: [
    { jpMasu: "勉強します", jpNegative: "勉強しません", jpDict: "勉強する", jpTai: "勉強したい", jpPast: "勉強しました", jpTe: "勉強しています", jpTePlain: "勉強して", jpNai: "勉強しない", jpNaiStem: "勉強し", base: "study", s: "studies", ing: "studying", past: "studied", pp: "studied", object: { jp: "英語", en: "English" } },
    { jpMasu: "弾きます", jpNegative: "弾きません", jpDict: "弾く", jpTai: "弾きたい", jpPast: "弾きました", jpTe: "弾いています", jpTePlain: "弾いて", jpNai: "弾かない", jpNaiStem: "弾か", base: "play", s: "plays", ing: "playing", past: "played", pp: "played", object: { jp: "ピアノ", en: "the piano" } },
    { jpMasu: "読みます", jpNegative: "読みません", jpDict: "読む", jpTai: "読みたい", jpPast: "読みました", jpTe: "読んでいます", jpTePlain: "読んで", jpNai: "読まない", jpNaiStem: "読ま", base: "read", s: "reads", ing: "reading", past: "read", pp: "read", object: { jp: "本", en: "books" } },
    { jpMasu: "見ます", jpNegative: "見ません", jpDict: "見る", jpTai: "見たい", jpPast: "見ました", jpTe: "見ています", jpTePlain: "見て", jpNai: "見ない", jpNaiStem: "見", base: "watch", s: "watches", ing: "watching", past: "watched", pp: "watched", object: { jp: "テレビ", en: "TV" } },
    { jpMasu: "聴きます", jpNegative: "聴きません", jpDict: "聴く", jpTai: "聴きたい", jpPast: "聴きました", jpTe: "聴いています", jpTePlain: "聴いて", jpNai: "聴かない", jpNaiStem: "聴か", base: "listen to", s: "listens to", ing: "listening to", past: "listened to", pp: "listened to", object: { jp: "音楽", en: "music" } },
    { jpMasu: "手伝います", jpNegative: "手伝いません", jpDict: "手伝う", jpTai: "手伝いたい", jpPast: "手伝いました", jpTe: "手伝っています", jpTePlain: "手伝って", jpNai: "手伝わない", jpNaiStem: "手伝わ", base: "help", s: "helps", ing: "helping", past: "helped", pp: "helped", object: { jp: "母", en: "my mother" } },
    { jpMasu: "訪れます", jpNegative: "訪れません", jpDict: "訪れる", jpTai: "訪れたい", jpPast: "訪れました", jpTe: "訪れています", jpTePlain: "訪れて", jpNai: "訪れない", jpNaiStem: "訪れ", base: "visit", s: "visits", ing: "visiting", past: "visited", pp: "visited", object: { jp: "京都", en: "Kyoto" } },
    { jpMasu: "使います", jpNegative: "使いません", jpDict: "使う", jpTai: "使いたい", jpPast: "使いました", jpTe: "使っています", jpTePlain: "使って", jpNai: "使わない", jpNaiStem: "使わ", base: "use", s: "uses", ing: "using", past: "used", pp: "used", object: { jp: "このペン", en: "this pen" } }
  ],
  adjectives: [
    { jp: "忙しい", jpNeg: "忙しくありません", jpPast: "忙しかったです", en: "busy" },
    { jp: "元気", jpNeg: "元気ではありません", jpPast: "元気でした", en: "fine" },
    { jp: "親切", jpNeg: "親切ではありません", jpPast: "親切でした", en: "kind" },
    { jp: "有名", jpNeg: "有名ではありません", jpPast: "有名でした", en: "famous" },
    { jp: "幸せ", jpNeg: "幸せではありません", jpPast: "幸せでした", en: "happy" },
    { jp: "新しい", jpNeg: "新しくありません", jpPast: "新しかったです", en: "new" },
    { jp: "大きい", jpNeg: "大きくありません", jpPast: "大きかったです", en: "large" }
  ],
  places: [
    { jp: "学校", en: "school", prep: "at school" },
    { jp: "図書館", en: "the library", prep: "at the library" },
    { jp: "公園", en: "the park", prep: "in the park" },
    { jp: "家", en: "home", prep: "at home" },
    { jp: "駅", en: "the station", prep: "at the station" }
  ],
  times: [
    { jp: "毎日、", en: "every day" },
    { jp: "放課後、", en: "after school" },
    { jp: "日曜日に、", en: "on Sundays" },
    { jp: "朝、", en: "in the morning" },
    { jp: "昨日", en: "yesterday" },
    { jp: "明日", en: "tomorrow" }
  ],
  advancedPhrases: [
    { jp: "歯をみがき", en: "brush my teeth", answer: "brush", object: "my teeth" },
    { jp: "面倒を見", en: "take care of my dog", answer: "take care of", object: "my dog" },
    { jp: "得意", en: "be good at English", answer: "good at", object: "English" },
    { jp: "楽しみにし", en: "look forward to the festival", answer: "look forward to", object: "the festival" }
  ]
};

const state = {
  selectedGrade: 1,
  selectedMode: "erande",
  selectedLevel: "small",
  selectedCups: 10,
  selectedTime: 15,
  selectedUnits: new Set(),
  questions: [],
  currentIndex: 0,
  correctCount: 0,
  streak: 0,
  maxStreak: 0,
  wrongQuestions: [],
  selectedWords: [],
  currentWordPool: [],
  answered: false,
  timerId: null,
  remainingSeconds: 15,
  questionStartTime: 0,
  reviewMode: false,
  pendingResult: null
};

let progress = loadProgress();

const menuBookState = {
  units: [],
  index: 0,
  secret: false,
  title: "お品書き"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadProgress() {
  const defaultProgress = {
    history: [],
    solvedBank: [],
    wrongBank: [],
    teacherBank: [],
    editedQuestions: [],
    blankClearCount: 0,
    fullClearCount: 0,
    exUnlocked: false,
    bestStreak: 0,
    titles: ["見習いそば客"],
    unitStats: {},
    modeClears: {},
    preGeneratedBank: [],
    preGeneratedBankVersion: null
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    return cleanupProgress({ ...defaultProgress, ...JSON.parse(raw) });
  } catch (error) {
    console.warn("進捗データの読み込みに失敗しました。", error);
    return defaultProgress;
  }
}


function cleanupProgress(data) {
  const isNaturalStoredQuestion = (q) => q && q.fullSentence && q.jp && !/好きます|好きません|好きる/.test(q.jp);
  data.history = Array.isArray(data.history) ? data.history : [];
  data.solvedBank = Array.isArray(data.solvedBank) ? data.solvedBank.filter(isNaturalStoredQuestion) : [];
  data.wrongBank = Array.isArray(data.wrongBank) ? data.wrongBank.filter(isNaturalStoredQuestion) : [];
  data.teacherBank = Array.isArray(data.teacherBank) ? data.teacherBank.map(normalizeTeacherQuestion).filter(Boolean) : [];
  data.editedQuestions = Array.isArray(data.editedQuestions) ? data.editedQuestions.map(normalizeEditedQuestion).filter(Boolean) : [];
  data.titles = Array.isArray(data.titles) && data.titles.length ? data.titles : ["見習いそば客"];
  data.unitStats = data.unitStats || {};
  data.modeClears = data.modeClears || {};
  data.preGeneratedBank = Array.isArray(data.preGeneratedBank) ? data.preGeneratedBank.map(normalizeGeneratedQuestionRecord).filter(Boolean) : [];
  data.preGeneratedBankVersion = typeof data.preGeneratedBankVersion === "string" ? data.preGeneratedBankVersion : null;
  return data;
}

function normalizeGeneratedQuestionRecord(item) {
  if (!item || typeof item !== "object") return null;
  const unit = String(item.unit || "").trim();
  const jp = sanitizeJapanese(String(item.jp || "").trim());
  const fullSentence = ensurePunctuation(String(item.fullSentence || "").replace(/。/g, "").replace(/\s+/g, " ").trim());
  if (!unit || !jp || !fullSentence) return null;
  return {
    ...item,
    id: item.id || `pregenerated-${hashCode(`${unit}|${jp}|${fullSentence}`)}`,
    key: item.key || `pregenerated::${hashCode(`${unit}|${jp}|${fullSentence}`)}`,
    grade: Math.min(3, Math.max(1, Number(item.grade || findGradeByUnit(unit) || 1))),
    unit,
    level: item.level || item.levelScope || "small",
    levelScope: item.levelScope || item.level || "small",
    jp,
    fullSentence,
    blankSentence: item.blankSentence || "",
    blankAnswer: item.blankAnswer || "",
    choices: Array.isArray(item.choices) ? item.choices : [],
    explanation: item.explanation || "ホーム画面で事前生成された問題です。",
    preGenerated: true
  };
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function init() {
  syncTeacherPackage();
  ensurePreGeneratedQuestionBank();
  syncTeacherPackageFromCloud();
  resetSelectedUnitsForGrade();
  renderSetup();
  bindEvents();
  updateStartHint();
}

function bindEvents() {
  $("#startBtn")?.addEventListener("click", startGame);
  $("#quickStartBtn")?.addEventListener("click", startGame);
  $("#openSettingsBtn")?.addEventListener("click", openOrderSettings);
  $("#openSettingsInlineBtn")?.addEventListener("click", openOrderSettings);
  $("#quitBtn").addEventListener("click", () => showScreen("setupScreen"));
  $("#retryBtn").addEventListener("click", () => {
    showScreen("setupScreen");
    renderSetup();
  });
  $("#openMenuBtn").addEventListener("click", openMenu);
  $("#openSecretMenuBtn").addEventListener("click", openSecretMenu);
  $("#openStatsBtn").addEventListener("click", openStats);
  $("#statsFromResultBtn").addEventListener("click", openStats);
  $("#showResultBtn")?.addEventListener("click", () => {
    const pending = state.pendingResult || { cleared: false, newlyUnlockedEx: false };
    showScreen("resultScreen");
    renderResult(pending.cleared, pending.newlyUnlockedEx);
  });
  $("#closeModalBtn").addEventListener("click", () => $("#modal").close());
  $("#modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") $("#modal").close();
  });
}

function openOrderSettings() {
  const details = $("#orderDetails");
  if (details) {
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getOrderSummaryText() {
  const grade = GRADES.find(item => item.value === state.selectedGrade)?.label || `中${state.selectedGrade}`;
  const mode = MODES[state.selectedMode]?.label || "えらんで一杯";
  const level = LEVELS[state.selectedLevel]?.label || "小盛り";
  const unitCount = state.selectedUnits?.size || 0;
  return `${grade}・${mode}・${level}・${state.selectedCups}杯・1問${state.selectedTime}秒・${unitCount}単元`;
}

function renderSetup() {
  renderGradeButtons();
  renderModeButtons();
  renderLevelButtons();
  renderCupButtons();
  renderTimeButtons();
  renderTeacherSlot();
  renderUnitGroups();
  renderExNotice();
  updateStartHint();
}

function renderGradeButtons() {
  const container = $("#gradeButtons");
  container.innerHTML = GRADES.map(grade => `
    <button class="option-card ${state.selectedGrade === grade.value ? "selected" : ""}" data-grade="${grade.value}" type="button">
      <strong>${grade.label}</strong>
      <span>${grade.sub}</span>
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedGrade = Number(button.dataset.grade);
      resetSelectedUnitsForGrade();
      renderSetup();
    });
  });
}

function renderModeButtons() {
  const container = $("#modeButtons");
  container.innerHTML = Object.entries(MODES).map(([key, mode]) => `
    <button class="option-card ${state.selectedMode === key ? "selected" : ""}" data-mode="${key}" type="button">
      <strong>${mode.label}</strong>
      <span>${mode.description}</span>
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedMode = button.dataset.mode;
      renderModeButtons();
      updateStartHint();
    });
  });
}

function isExAvailable() {
  return IS_TEACHER_PREVIEW || !!progress.exUnlocked;
}

function hasSecretMenu(unit) {
  const data = MENU_EXPLANATIONS[unit];
  return !!(data && typeof data.secret === "string" && data.secret.trim());
}

function getSecretMenuUnits(units) {
  return normalizeMenuUnits(units).filter(hasSecretMenu);
}


function renderLevelButtons() {
  const container = $("#levelButtons");
  container.innerHTML = Object.entries(LEVELS).map(([key, level]) => {
    const locked = key === "extra" && !isExAvailable();
    const sub = locked ? "EX開放後に選べます" : level.description;
    return `
      <button class="option-card ${state.selectedLevel === key ? "selected" : ""} ${locked ? "locked" : ""}" data-level="${key}" type="button" ${locked ? "aria-disabled='true'" : ""}>
        <strong>${locked ? "🔒 " : ""}${level.label}</strong>
        <span>${sub}</span>
      </button>
    `;
  }).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const level = button.dataset.level;
      if (level === "extra" && !isExAvailable()) {
        showToastInHint("特盛りはEX開放後に選べます。");
        return;
      }
      state.selectedLevel = level;
      renderLevelButtons();
    });
  });
}

function renderCupButtons() {
  const container = $("#cupButtons");
  container.innerHTML = CUP_OPTIONS.map(cups => `
    <button class="option-card ${state.selectedCups === cups ? "selected" : ""}" data-cups="${cups}" type="button">
      <strong>${cups}杯</strong>
      <span>${cups}問チャレンジ</span>
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedCups = Number(button.dataset.cups);
      renderCupButtons();
      updateStartHint();
    });
  });
}

function renderTimeButtons() {
  const container = $("#timeButtons");
  if (!container) return;
  container.innerHTML = TIME_OPTIONS.map(seconds => `
    <button class="option-card ${state.selectedTime === seconds ? "selected" : ""}" data-time="${seconds}" type="button">
      <strong>${seconds}秒</strong>
      <span>1問${seconds}秒</span>
    </button>
  `).join("");

  container.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.selectedTime = Number(button.dataset.time);
      renderTimeButtons();
      updateStartHint();
    });
  });
}

function resetSelectedUnitsForGrade() {
  state.selectedUnits = new Set(GRAMMAR_UNITS[state.selectedGrade]);
}

function renderUnitGroups() {
  const container = $("#unitGroups");
  const gradeGroups = Object.entries(GRAMMAR_UNITS).map(([grade, units]) => `
    <div class="unit-group">
      <div class="unit-group-head">
        <h3>中${grade}単元表</h3>
        <div class="unit-actions">
          <button class="mini-button" type="button" data-select-grade="${grade}">全部選ぶ</button>
          <button class="mini-button mini-button-light" type="button" data-clear-grade="${grade}">全部外す</button>
        </div>
      </div>
      <div class="unit-list">
        ${units.map(unit => `
          <label class="unit-check ${REVIEW_STYLE_UNITS.has(unit) ? "unit-check-review" : ""}">
            <input type="checkbox" data-unit="${escapeHtml(unit)}" ${state.selectedUnits.has(unit) ? "checked" : ""}>
            <span>${unit}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");

  const teacherGroups = buildTeacherUnitSummary();
  const teacherGroup = teacherGroups.length ? `
    <div class="unit-group teacher-unit-group">
      <div class="unit-group-head">
        <div>
          <h3>先生の仕込み棚</h3>
          <p class="shelf-note">教師用で反映された追加問題だけを選べます。</p>
        </div>
        <div class="unit-actions">
          <button class="mini-button" type="button" data-select-teacher="all">全部選ぶ</button>
          <button class="mini-button mini-button-light" type="button" data-clear-teacher="all">全部外す</button>
        </div>
      </div>
      <div class="unit-list">
        ${teacherGroups.map(group => {
          const key = teacherSelectionKey(group.unit);
          return `
          <label class="unit-check teacher-unit-check">
            <input type="checkbox" data-unit="${escapeHtml(key)}" ${state.selectedUnits.has(key) ? "checked" : ""}>
            <span>${escapeHtml(group.unit)}<small>${group.count}杯</small></span>
          </label>`;
        }).join("")}
      </div>
    </div>
  ` : "";

  container.innerHTML = gradeGroups + teacherGroup;

  container.querySelectorAll("input[type='checkbox']").forEach(input => {
    input.addEventListener("change", () => {
      const unit = input.dataset.unit;
      if (input.checked) state.selectedUnits.add(unit);
      else state.selectedUnits.delete(unit);
      updateStartHint();
      renderTeacherSlot();
    });
  });

  container.querySelectorAll("[data-select-grade]").forEach(button => {
    button.addEventListener("click", () => {
      const grade = button.dataset.selectGrade;
      (GRAMMAR_UNITS[grade] || []).forEach(unit => state.selectedUnits.add(unit));
      renderUnitGroups();
      renderTeacherSlot();
      updateStartHint();
    });
  });

  container.querySelectorAll("[data-clear-grade]").forEach(button => {
    button.addEventListener("click", () => {
      const grade = button.dataset.clearGrade;
      (GRAMMAR_UNITS[grade] || []).forEach(unit => state.selectedUnits.delete(unit));
      renderUnitGroups();
      renderTeacherSlot();
      updateStartHint();
    });
  });

  container.querySelector("[data-select-teacher]")?.addEventListener("click", () => {
    buildTeacherUnitSummary().forEach(group => state.selectedUnits.add(teacherSelectionKey(group.unit)));
    renderUnitGroups();
    renderTeacherSlot();
    updateStartHint();
  });

  container.querySelector("[data-clear-teacher]")?.addEventListener("click", () => {
    buildTeacherUnitSummary().forEach(group => state.selectedUnits.delete(teacherSelectionKey(group.unit)));
    renderUnitGroups();
    renderTeacherSlot();
    updateStartHint();
  });
}

function buildTeacherUnitSummary() {
  const map = new Map();
  (progress.teacherBank || []).forEach(q => {
    const unit = q.unit || TEACHER_UNIT_NAME;
    const current = map.get(unit) || { unit, grade: q.grade || findGradeByUnit(unit) || state.selectedGrade, count: 0 };
    current.count += 1;
    current.grade = Math.min(current.grade || 99, q.grade || current.grade || 99);
    map.set(unit, current);
  });
  return [...map.values()].sort((a, b) => (a.grade - b.grade) || a.unit.localeCompare(b.unit, "ja"));
}

function renderTeacherSlot() {
  const slot = $("#teacherStudentSlot");
  if (!slot) return;
  const count = progress.teacherBank?.length || 0;
  const groups = buildTeacherUnitSummary();

  if (!count) {
    slot.innerHTML = `
      <div class="teacher-empty">
        <strong>まだ先生メニューは届いていません。</strong>
      </div>
    `;
  } else {
    const selectedCount = groups.filter(group => state.selectedUnits.has(teacherSelectionKey(group.unit))).length;
    const newest = progress.teacherBank.at(-1);
    slot.innerHTML = `
      <div class="teacher-filled">
        <strong>${count}杯 仕込み済み</strong>
        <p>単元別に「先生の仕込み棚」へ並べています。</p>
        <p class="muted">最新：${escapeHtml(newest?.unit || "追加問題")} / ${escapeHtml(newest?.jp || "")}</p>
      </div>
      <div class="teacher-actions">
        <button class="primary-button" id="selectTeacherUnitBtn" type="button">先生メニューをまとめて選ぶ</button>
        <span class="teacher-selected-pill">${selectedCount}棚 選択中</span>
      </div>
    `;
  }

  $("#selectTeacherUnitBtn")?.addEventListener("click", () => {
    buildTeacherUnitSummary().forEach(group => state.selectedUnits.add(teacherSelectionKey(group.unit)));
    renderUnitGroups();
    renderTeacherSlot();
    updateStartHint();
  });
}

function normalizeTeacherQuestion(item, index = 0) {
  if (!item || typeof item !== "object") return null;
  const jp = sanitizeJapanese(item.jp || item.japanese || "").trim();
  const fullSentence = ensurePunctuation(item.fullSentence || item.en || item.english || "");
  const blankAnswer = item.blankAnswer || item.answer || "";
  const rawBlankSentence = item.blankSentence || item.blank || "";
  const blankSentence = expandBlankSlotsForAnswer(rawBlankSentence, blankAnswer);
  if (!jp || !fullSentence || !blankSentence || !blankAnswer) return null;
  const grade = Number(item.grade || state.selectedGrade || 1);
  const level = item.level && LEVELS[item.level] ? item.level : "medium";
  return {
    id: item.id || `teacher-${hashCode(`${jp}|${fullSentence}|${index}`)}`,
    jp,
    fullSentence,
    blankSentence,
    blankAnswer,
    choices: Array.isArray(item.choices) ? item.choices : tokenize(blankAnswer),
    unit: item.unit || TEACHER_UNIT_NAME,
    grade: Math.min(3, Math.max(1, grade)),
    level,
    explanation: item.explanation || "先生が追加した問題です。文の形と空欄の前後を確認しましょう。",
    teacherMade: true
  };
}


function normalizeEditedQuestion(item) {
  if (!item || typeof item !== "object") return null;
  const key = String(item.key || "").trim();
  const jp = sanitizeJapanese(String(item.jp || "").trim());
  const fullSentence = ensurePunctuation(String(item.fullSentence || "").replace(/。/g, "").replace(/\s+/g, " ").trim());
  if (!key || !jp || !fullSentence) return null;
  return {
    key,
    grade: Math.min(3, Math.max(1, Number(item.grade || 1))),
    unit: String(item.unit || ""),
    jp,
    fullSentence,
    originalJp: String(item.originalJp || ""),
    originalFullSentence: String(item.originalFullSentence || ""),
    updatedAt: item.updatedAt || null,
    teacherEdited: true
  };
}

function buildBankQuestionKey(unit, index) {
  return `bank::${unit}::${index}`;
}

function applyEditedQuestionOverride(question) {
  const edits = Array.isArray(progress.editedQuestions) ? progress.editedQuestions : [];
  if (!edits.length || !question) return question;
  const sourceKey = question.sourceKey || "";
  const byKey = sourceKey ? edits.find(item => item.key === sourceKey) : null;
  const byOriginal = edits.find(item => item.originalFullSentence && normalize(item.originalFullSentence) === normalize(question.fullSentence));
  const edit = byKey || byOriginal;
  if (!edit) return question;
  return {
    ...question,
    jp: edit.jp || question.jp,
    fullSentence: ensurePunctuation(edit.fullSentence || question.fullSentence),
    teacherEdited: true
  };
}


async function syncTeacherPackageFromCloud() {
  try {
    const response = await fetch(TEACHER_CLOUD_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return;
    const packageData = await response.json();
    localStorage.setItem(TEACHER_PACKAGE_KEY, JSON.stringify(packageData));
    const changed = applyTeacherPackage(packageData, { persistProgress: false });
    if (changed) {
      ensurePreGeneratedQuestionBank({ force: true, silent: true });
      saveProgress();
      renderSetup();
      updateStartHint();
    }
  } catch (error) {
    console.warn("共有教師データの読み込みに失敗しました。", error);
  }
}

function syncTeacherPackage() {
  try {
    const raw = localStorage.getItem(TEACHER_PACKAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const changed = applyTeacherPackage(parsed, { persistProgress: false });
    if (changed) saveProgress();
  } catch (error) {
    console.warn("教師用データの同期に失敗しました。", error);
  }
}

function applyTeacherPackage(packageData, options = {}) {
  if (!packageData || typeof packageData !== "object") return false;
  let changed = false;

  if (packageData.menuOverrides && typeof packageData.menuOverrides === "object") {
    applyMenuOverrides(packageData.menuOverrides);
    changed = true;
  }

  const source = Array.isArray(packageData) ? packageData : packageData.questions;
  if (Array.isArray(source)) {
    const normalized = source.map(normalizeTeacherQuestion).filter(Boolean);
    if (normalized.length) {
      const map = new Map((progress.teacherBank || []).map(q => [normalize(q.fullSentence), q]));
      normalized.forEach(q => map.set(normalize(q.fullSentence), q));
      progress.teacherBank = [...map.values()].slice(-800);
      changed = true;
    }
  }

  if (Array.isArray(packageData.editedQuestions)) {
    progress.editedQuestions = packageData.editedQuestions.map(normalizeEditedQuestion).filter(Boolean).slice(-3000);
    changed = true;
  }

  if (packageData.updatedAt) progress.teacherPackageUpdatedAt = packageData.updatedAt;
  if (options.persistProgress && changed) saveProgress();
  return changed;
}

function applyMenuOverrides(menuOverrides) {
  Object.entries(menuOverrides).forEach(([unit, override]) => {
    if (!unit || !override || typeof override !== "object") return;
    const current = MENU_EXPLANATIONS[unit] || { normal: "", examples: [], secret: "" };
    const next = { ...current };
    if (typeof override.normal === "string") next.normal = override.normal.trim();
    if (Array.isArray(override.examples)) next.examples = override.examples.map(String).filter(Boolean);
    if (override.secretEnabled === false) {
      next.secret = "";
    } else if (typeof override.secret === "string") {
      next.secret = override.secret.trim();
    }
    MENU_EXPLANATIONS[unit] = next;
  });
}

function renderExNotice() {
  const notice = $("#exNotice");
  const neededBlank = Math.max(0, 30 - progress.blankClearCount);
  const neededFull = Math.max(0, 10 - progress.fullClearCount);

  if (IS_TEACHER_PREVIEW) {
    notice.className = "notice-card show teacher-preview-notice";
    notice.innerHTML = "<strong>教師確認モード。</strong> 特盛り・裏お品書きまで確認できます。称号は通常通りです。";
    return;
  }

  if (progress.exUnlocked) {
    notice.className = "notice-card show";
    notice.innerHTML = "<strong>EX開放済み。</strong> 特盛り・裏お品書きが使えます。";
    return;
  }

  notice.className = "notice-card show";
  notice.innerHTML = `
    <strong>EX開放条件</strong><br>
    うめて一杯をあと <strong>${neededBlank}</strong> 回、書ききり一杯をあと <strong>${neededFull}</strong> 回クリアすると特盛り・裏お品書きが開放されます。
  `;
}

function updateStartHint() {
  const hint = $("#startHint");
  const quickSummary = $("#quickOrderSummary");
  const startButtons = [$("#startBtn"), $("#quickStartBtn")].filter(Boolean);
  const unitCount = state.selectedUnits.size;
  const summaryText = getOrderSummaryText();
  if (quickSummary) quickSummary.textContent = summaryText;

  if (state.selectedMode === "kakikiri" && progress.solvedBank.length === 0) {
    if (hint) hint.textContent = "書ききり一杯は、先に他の食べ方で問題を解くと使えるようになります。";
    startButtons.forEach(button => button.disabled = true);
    return;
  }
  if (unitCount === 0 && state.selectedMode !== "kakikiri") {
    if (hint) hint.textContent = "単元表から少なくとも1つ単元を選んでください。";
    startButtons.forEach(button => button.disabled = true);
    return;
  }
  startButtons.forEach(button => button.disabled = false);
  if (hint) hint.textContent = "詳しく変えるときは「注文を変える」から設定できます。";
}

function showToastInHint(message) {
  const hint = $("#startHint");
  if (hint) hint.textContent = message;
}

function ensurePreGeneratedQuestionBank(options = {}) {
  const force = Boolean(options.force);
  const silent = Boolean(options.silent);
  const existing = Array.isArray(progress.preGeneratedBank) ? progress.preGeneratedBank : [];
  if (!force && progress.preGeneratedBankVersion === PREGENERATED_BANK_VERSION && existing.length > 0) return existing;

  const rows = [];
  const seen = new Set();
  Object.entries(GRAMMAR_UNITS).forEach(([gradeText, units]) => {
    const grade = Number(gradeText);
    units.forEach(unit => {
      PREGENERATED_LEVELS.forEach(level => {
        let attempts = 0;
        let madeForLevel = 0;
        while (madeForLevel < PREGENERATED_PER_UNIT_LEVEL && attempts < PREGENERATED_PER_UNIT_LEVEL * 40) {
          attempts++;
          const q = generateQuestion(unit, grade, level);
          if (!q || !q.jp || !q.fullSentence) continue;
          const naturalKey = `${grade}|${unit}|${level}|${normalize(q.jp)}|${normalize(q.fullSentence)}|${normalize(q.blankSentence)}|${normalize(q.blankAnswer)}`;
          if (seen.has(naturalKey)) continue;
          seen.add(naturalKey);
          const key = q.sourceKey || `pregenerated::${hashCode(naturalKey)}`;
          rows.push({
            ...q,
            key,
            id: q.id || key,
            grade,
            unit,
            level,
            levelScope: level,
            preGenerated: true,
            generatedAtHome: true
          });
          madeForLevel++;
        }
      });
    });
  });

  progress.preGeneratedBank = rows.map(normalizeGeneratedQuestionRecord).filter(Boolean);
  progress.preGeneratedBankVersion = PREGENERATED_BANK_VERSION;
  saveProgress();
  if (!silent) console.info(`英文法わんこそば: ホーム表示用に${progress.preGeneratedBank.length}問を事前生成しました。`);
  return progress.preGeneratedBank;
}

function startGame() {
  state.reviewMode = false;
  resetGameState();

  if (state.selectedMode === "kakikiri") {
    state.questions = getFullWritingQuestions(state.selectedCups);
    if (state.questions.length === 0) {
      showToastInHint("書ききり一杯に使える過去問題がありません。先に別のモードで解いてください。");
      return;
    }
  } else {
    state.questions = createQuestionSet(state.selectedCups, [...state.selectedUnits], state.selectedLevel);
  }

  showScreen("gameScreen");
  renderQuestion();
}

function resetGameState() {
  stopTimer();
  state.questions = [];
  state.currentIndex = 0;
  state.correctCount = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.wrongQuestions = [];
  state.selectedWords = [];
  state.currentWordPool = [];
  state.answered = false;
  state.remainingSeconds = state.selectedTime;
  state.questionStartTime = 0;
  state.pendingResult = null;
}

function createQuestionSet(count, units, level) {
  const unitPool = units.length ? units : GRAMMAR_UNITS[state.selectedGrade];
  const result = [];
  const usedKeys = new Set();
  let safeGuard = 0;

  while (result.length < count && safeGuard < count * 80) {
    safeGuard++;
    const unit = pick(unitPool);
    const grade = findGradeByUnit(unit) || state.selectedGrade;
    const question = generateQuestion(unit, grade, level);
    const key = `${question.fullSentence}|${question.blankSentence}|${question.blankAnswer}`;
    if (usedKeys.has(key) && safeGuard < count * 50) continue;
    usedKeys.add(key);
    result.push(question);
  }

  return shuffle(result).slice(0, count);
}

function getFullWritingQuestions(count) {
  const bank = progress.solvedBank.filter(q => {
    const unitOk = state.selectedUnits.size === 0 || isUnitSelected(q.unit);
    const gradeOk = q.grade <= state.selectedGrade || isUnitSelected(q.unit);
    return unitOk && gradeOk;
  });

  const pool = bank.length ? bank : progress.solvedBank;
  return shuffle(pool).slice(0, count).map(q => {
    const edited = applyEditedQuestionOverride(q);
    return {
      ...edited,
      id: `full-${edited.id || hashCode(edited.fullSentence)}-${Date.now()}-${Math.random()}`,
      modeSource: edited.modeSource || "past"
    };
  });
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  state.selectedWords = [];
  state.answered = false;
  state.currentWordPool = [];

  $("#feedback").className = "feedback-card hidden";
  $("#feedback").innerHTML = "";
  $("#answerArea").innerHTML = "";
  $("#controlArea").innerHTML = "";

  const progressNow = state.currentIndex + 1;
  $("#progressText").textContent = `${progressNow} / ${state.questions.length}杯`;
  $("#progressBar").style.width = `${(state.currentIndex / state.questions.length) * 100}%`;
  $("#remainingCups").textContent = Math.max(0, state.questions.length - state.currentIndex);
  $("#streakText").textContent = `${state.streak}連杯`;
  $("#questionMeta").textContent = `中${question.grade}｜${question.unit}｜${LEVELS[question.level]?.label || "小盛り"}｜${MODES[state.selectedMode].label}`;
  $("#jpQuestion").textContent = question.jp;

  renderBowls();
  startQuestionTimer();

  if (state.selectedMode === "kakikiri") {
    $("#englishPrompt").className = "english-prompt blankless";
    $("#englishPrompt").textContent = "日本語を見て、英文をすべて打ち込んでください。";
    renderTextInput("full");
    return;
  }

  if (state.selectedMode === "umete") {
    $("#englishPrompt").className = "english-prompt";
    $("#englishPrompt").textContent = question.blankSentence;
    renderTextInput("blank");
    return;
  }

  if (state.selectedMode === "erande") {
    $("#englishPrompt").className = "english-prompt";
    $("#englishPrompt").textContent = question.blankSentence;
    renderChoiceMode(question);
    return;
  }

  if (state.selectedMode === "narabete") {
    $("#englishPrompt").className = "english-prompt blankless";
    $("#englishPrompt").textContent = "単語カードを正しい順にタップしてください。";
    renderSortMode(question);
  }
}

function renderTextInput(type) {
  const placeholder = type === "full" ? "例：I like reading books." : "空欄に入る語句を入力";
  $("#answerArea").innerHTML = `<input id="textAnswer" class="text-answer" type="text" autocomplete="off" placeholder="${placeholder}">`;
  $("#controlArea").innerHTML = `<button class="primary-button" id="checkBtn" type="button">答える</button>`;
  $("#checkBtn").addEventListener("click", checkCurrentAnswer);
  $("#textAnswer").addEventListener("keydown", event => {
    if (event.key === "Enter") checkCurrentAnswer();
  });
  setTimeout(() => $("#textAnswer")?.focus(), 40);
}

function renderChoiceMode(question) {
  const answerTokens = tokenize(question.blankAnswer);
  const choices = buildChoices(question, answerTokens);
  state.currentWordPool = choices.map((word, index) => ({ id: `c-${index}`, word, used: false }));

  $("#answerArea").innerHTML = `
    <div class="selected-line" id="selectedLine"><span class="muted">選んだ語句がここに入ります</span></div>
    <div class="word-grid" id="wordGrid"></div>
  `;
  $("#controlArea").innerHTML = `
    <button class="ghost-button" id="undoBtn" type="button">取り消す</button>
    <button class="ghost-button" id="clearBtn" type="button">全部戻す</button>
    <button class="primary-button" id="checkBtn" type="button">答える</button>
  `;

  renderWordGrid();
  bindWordControls();
}

function renderSortMode(question) {
  const words = tokenize(question.fullSentence.replace(/[.?!]/g, ""));
  const distractors = state.selectedLevel === "small" ? [] : getSortDistractors(question);
  state.currentWordPool = shuffle([...words, ...distractors]).map((word, index) => ({ id: `w-${index}`, word, used: false }));

  $("#answerArea").innerHTML = `
    <div class="selected-line" id="selectedLine"><span class="muted">タップした順に英文が並びます</span></div>
    <div class="word-grid" id="wordGrid"></div>
  `;
  $("#controlArea").innerHTML = `
    <button class="ghost-button" id="undoBtn" type="button">取り消す</button>
    <button class="ghost-button" id="clearBtn" type="button">全部戻す</button>
    <button class="primary-button" id="checkBtn" type="button">答える</button>
  `;

  renderWordGrid();
  bindWordControls();
}

function renderWordGrid() {
  const grid = $("#wordGrid");
  grid.innerHTML = state.currentWordPool.map(item => `
    <button class="word-card ${item.used ? "used" : ""}" data-id="${item.id}" type="button">${escapeHtml(item.word)}</button>
  `).join("");

  grid.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => selectWord(button.dataset.id));
  });

  renderSelectedLine();
}

function renderSelectedLine() {
  const line = $("#selectedLine");
  if (!state.selectedWords.length) {
    line.innerHTML = `<span class="muted">${state.selectedMode === "narabete" ? "タップした順に英文が並びます" : "選んだ語句がここに入ります"}</span>`;
    return;
  }
  line.innerHTML = state.selectedWords.map(item => `<span class="selected-chip">${escapeHtml(item.word)}</span>`).join("");
}

function selectWord(id) {
  if (state.answered) return;
  const item = state.currentWordPool.find(entry => entry.id === id);
  if (!item || item.used) return;
  item.used = true;
  state.selectedWords.push(item);
  renderWordGrid();
}

function bindWordControls() {
  $("#undoBtn").addEventListener("click", () => {
    const last = state.selectedWords.pop();
    if (last) {
      const item = state.currentWordPool.find(entry => entry.id === last.id);
      if (item) item.used = false;
    }
    renderWordGrid();
  });
  $("#clearBtn").addEventListener("click", () => {
    state.selectedWords = [];
    state.currentWordPool.forEach(item => { item.used = false; });
    renderWordGrid();
  });
  $("#checkBtn").addEventListener("click", checkCurrentAnswer);
}

function checkCurrentAnswer() {
  if (state.answered) return;
  stopTimer();

  const question = state.questions[state.currentIndex];
  let userAnswer = "";
  let correctAnswer = "";

  if (state.selectedMode === "kakikiri") {
    userAnswer = $("#textAnswer").value;
    correctAnswer = question.fullSentence;
  } else if (state.selectedMode === "umete") {
    userAnswer = $("#textAnswer").value;
    correctAnswer = question.blankAnswer;
  } else if (state.selectedMode === "erande") {
    userAnswer = state.selectedWords.map(item => item.word).join(" ");
    correctAnswer = question.blankAnswer;
  } else if (state.selectedMode === "narabete") {
    userAnswer = state.selectedWords.map(item => item.word).join(" ");
    correctAnswer = question.fullSentence.replace(/[.?!]/g, "");
  }

  const isCorrect = normalize(userAnswer) === normalize(correctAnswer);
  state.answered = true;

  if (isCorrect) {
    state.correctCount++;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    showBonus(getSpeedBonusLabel());
  } else {
    state.streak = 0;
    state.wrongQuestions.push(question);
    $("#answerArea").classList.add("shake");
    setTimeout(() => $("#answerArea").classList.remove("shake"), 400);
  }

  saveAnswerLog(question, isCorrect, userAnswer);
  renderFeedback(question, isCorrect, correctAnswer);
  renderBowls();
  $("#streakText").textContent = `${state.streak}連杯`;
}

function renderFeedback(question, isCorrect, correctAnswer, timedOut = false) {
  const feedback = $("#feedback");
  feedback.className = `feedback-card ${isCorrect ? "correct" : "wrong"}`;
  feedback.innerHTML = `
    <h3>${isCorrect ? "正解。一杯！" : (timedOut ? "時間切れ。ここで確認。" : "惜しい。ここで確認。")}</h3>
    <p><strong>正解：</strong>${escapeHtml(correctAnswer)}</p>
    <p>${escapeHtml(question.explanation)}</p>
    <button class="primary-button" id="nextBtn" type="button">${state.currentIndex + 1 >= state.questions.length ? "そこまで！" : "次の一杯へ"}</button>
  `;
  $("#nextBtn").addEventListener("click", nextQuestion);
}

function nextQuestion() {
  stopTimer();
  if (state.currentIndex + 1 >= state.questions.length) {
    finishGame();
    return;
  }
  state.currentIndex++;
  renderQuestion();
}

function finishGame() {
  $("#progressBar").style.width = "100%";
  const rate = state.correctCount / state.questions.length;
  const cleared = rate >= 0.8;
  const beforeEx = progress.exUnlocked;

  if (cleared && !state.reviewMode) {
    const key = `${state.selectedMode}:${state.selectedLevel}`;
    progress.modeClears[key] = (progress.modeClears[key] || 0) + 1;
    if (state.selectedMode === "umete") progress.blankClearCount += 1;
    if (state.selectedMode === "kakikiri") progress.fullClearCount += 1;
  }

  progress.bestStreak = Math.max(progress.bestStreak || 0, state.maxStreak);
  awardTitles();
  checkExUnlock();
  saveProgress();

  showEndScreen(cleared, !beforeEx && progress.exUnlocked);
}

function showEndScreen(cleared, newlyUnlockedEx) {
  state.pendingResult = { cleared, newlyUnlockedEx };
  $("#stopSummary").textContent = `${state.correctCount} / ${state.questions.length} 杯を確認中。結果へ進みます。`;
  showScreen("endScreen");
}

function renderResult(cleared, newlyUnlockedEx) {
  const total = state.questions.length;
  const rate = Math.round((state.correctCount / total) * 100);
  $("#resultTitle").textContent = state.reviewMode ? (cleared ? "おかわり完食！" : "復習完了") : (cleared ? "完食！" : "あと一歩！");
  $("#resultSummary").textContent = `${state.correctCount} / ${total} 正解（正答率 ${rate}%）`;

  const weakUnits = getWeakUnits(3);
  const unitProgress = getUnitProgress(3);

  const overallStats = getOverallStats();
  $("#resultDetails").innerHTML = `
    <div class="result-understanding">
      ${renderDonutChart(rate, "今回", `${state.correctCount}/${total}問 正解`)}
      ${renderDonutChart(overallStats.rate, "全体", `${overallStats.correct}/${overallStats.total || 0}問 正解`)}
    </div>
    <div class="result-card"><span>最高連杯</span><strong>${state.maxStreak}</strong></div>
    <div class="result-card"><span>うめて一杯クリア</span><strong>${progress.blankClearCount}/30</strong></div>
    <div class="result-card"><span>書ききり一杯クリア</span><strong>${progress.fullClearCount}/10</strong></div>
    <div class="result-card"><span>苦手そうな単元</span><strong>${weakUnits.length ? weakUnits.join(" / ") : "なし"}</strong></div>
    <div class="result-card"><span>達成率上位</span><strong>${unitProgress.length ? unitProgress.map(x => `${x.unit} ${x.rate}%`).join(" / ") : "これから"}</strong></div>
    <div class="result-card"><span>称号</span><strong>${progress.titles.at(-1) || "見習いそば客"}</strong></div>
  `;

  const unlock = $("#unlockMessage");
  if (newlyUnlockedEx) {
    unlock.innerHTML = `
      <div class="unlock-card">
        <h3>特盛り・裏お品書き 解放！</h3>
        <p>十分な杯数を重ねました。EXメニューに挑戦できます。</p>
      </div>
    `;
  } else if (cleared && state.maxStreak >= 10) {
    unlock.innerHTML = `
      <div class="unlock-card">
        <h3>${state.maxStreak}連杯達成！</h3>
        <p>テンポよく文法の型が出せています。</p>
      </div>
    `;
  } else {
    unlock.innerHTML = "";
  }
}

function saveAnswerLog(question, isCorrect, userAnswer) {
  const log = {
    questionId: question.id,
    jp: question.jp,
    fullSentence: question.fullSentence,
    blankSentence: question.blankSentence,
    blankAnswer: question.blankAnswer,
    unit: question.unit,
    grade: question.grade,
    level: question.level,
    mode: state.selectedMode,
    isCorrect,
    userAnswer,
    timeLimit: state.selectedTime,
    answeredAt: new Date().toISOString()
  };

  progress.history.push(log);
  if (progress.history.length > 1200) progress.history = progress.history.slice(-1200);

  const unitStats = progress.unitStats[question.unit] || { correct: 0, total: 0 };
  unitStats.total += 1;
  if (isCorrect) unitStats.correct += 1;
  progress.unitStats[question.unit] = unitStats;

  if (state.selectedMode !== "kakikiri") {
    saveSolvedQuestion(question);
  }

  if (isCorrect) {
    removeWrongQuestion(question);
  } else {
    saveWrongQuestion(question, userAnswer);
  }

  saveProgress();
}

function saveSolvedQuestion(question) {
  const exists = progress.solvedBank.some(q => normalize(q.fullSentence) === normalize(question.fullSentence));
  if (exists) return;
  progress.solvedBank.push({
    id: question.id,
    jp: question.jp,
    fullSentence: question.fullSentence,
    blankSentence: question.blankSentence,
    blankAnswer: question.blankAnswer,
    unit: question.unit,
    grade: question.grade,
    level: question.level,
    explanation: question.explanation
  });
  if (progress.solvedBank.length > 900) progress.solvedBank = progress.solvedBank.slice(-900);
}


function removeWrongQuestion(question) {
  progress.wrongBank = progress.wrongBank || [];
  const target = normalize(question.fullSentence);
  progress.wrongBank = progress.wrongBank.filter(q => normalize(q.fullSentence) !== target);
}

function saveWrongQuestion(question, userAnswer) {
  const wrongItem = {
    id: question.id,
    jp: question.jp,
    fullSentence: question.fullSentence,
    blankSentence: question.blankSentence,
    blankAnswer: question.blankAnswer,
    unit: question.unit,
    grade: question.grade,
    level: question.level,
    explanation: question.explanation,
    lastUserAnswer: userAnswer,
    missedAt: new Date().toISOString()
  };
  progress.wrongBank = progress.wrongBank || [];
  progress.wrongBank = progress.wrongBank.filter(q => normalize(q.fullSentence) !== normalize(question.fullSentence));
  progress.wrongBank.push(wrongItem);
  if (progress.wrongBank.length > 300) progress.wrongBank = progress.wrongBank.slice(-300);
}

function checkExUnlock() {
  if (progress.exUnlocked) return;
  if (progress.blankClearCount >= 30 && progress.fullClearCount >= 10) {
    progress.exUnlocked = true;
    addTitle("裏お品書きの常連");
  }
}

function awardTitles() {
  const answered = progress.history.length;
  if (answered >= 50) addTitle("そば屋の常連");
  if (answered >= 200) addTitle("文法そば職人");
  if (progress.bestStreak >= 10 || state.maxStreak >= 10) addTitle("十連杯の達人");
  if (state.selectedMode === "kakikiri" && state.correctCount === state.questions.length) addTitle("書ききり完食者");
  if (state.selectedLevel === "large" && state.correctCount / state.questions.length >= 0.8) addTitle("大盛り完食者");
  if (state.selectedLevel === "extra" && state.correctCount / state.questions.length >= 0.8) addTitle("特盛り完食者");
}

function addTitle(title) {
  if (!progress.titles.includes(title)) progress.titles.push(title);
}

function getWeakUnits(limit = 3) {
  return Object.entries(progress.unitStats)
    .map(([unit, stat]) => ({ unit, rate: stat.total ? stat.correct / stat.total : 0, total: stat.total }))
    .filter(item => item.total >= 2 && item.rate < 0.75)
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
    .slice(0, limit)
    .map(item => item.unit);
}

function getUnitProgress(limit = 5) {
  return Object.entries(progress.unitStats)
    .map(([unit, stat]) => ({ unit, rate: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0, total: stat.total }))
    .filter(item => item.total >= 1)
    .sort((a, b) => b.rate - a.rate || b.total - a.total)
    .slice(0, limit);
}


function getOverallStats() {
  const total = progress.history.length;
  const correct = progress.history.filter(item => item.isCorrect).length;
  const wrong = Math.max(0, total - correct);
  const rate = total ? Math.round((correct / total) * 100) : 0;
  return { total, correct, wrong, rate };
}

function renderDonutChart(rate, label, subText) {
  const safeRate = Math.max(0, Math.min(100, Number(rate) || 0));
  return `
    <div class="donut-card">
      <div class="donut-ring" style="--rate:${safeRate};" aria-label="${escapeHtml(label)} ${safeRate}%">
        <div class="donut-hole"><strong>${safeRate}%</strong><span>${escapeHtml(label)}</span></div>
      </div>
      <p>${escapeHtml(subText)}</p>
    </div>
  `;
}

function renderUnitUnderstandingList(unitProgress) {
  if (!unitProgress.length) {
    return `<p class="muted unit-understanding-empty">単元別の理解度は、解答記録が増えると表示されます。</p>`;
  }
  return `
    <div class="unit-understanding-list">
      ${unitProgress.map(item => `
        <div class="unit-understanding-row">
          <div class="unit-understanding-label">
            <strong>${escapeHtml(item.unit)}</strong>
            <span>${item.total}問</span>
          </div>
          <div class="unit-understanding-track" aria-label="${escapeHtml(item.unit)} ${item.rate}%">
            <span style="--rate:${item.rate};"></span>
          </div>
          <b>${item.rate}%</b>
        </div>
      `).join("")}
    </div>
  `;
}

function renderUnderstandingPanel(unitProgress) {
  const overall = getOverallStats();
  return `
    <article class="menu-item understanding-panel">
      <h3>理解度</h3>
      <div class="donut-grid overall-only">
        ${renderDonutChart(overall.rate, "全体", `${overall.correct}/${overall.total || 0}問 正解`)}
      </div>
      <div class="unit-understanding-box">
        <h4>単元別理解度</h4>
        ${renderUnitUnderstandingList(unitProgress)}
      </div>
    </article>
  `;
}

function renderBowls() {
  const stack = $("#bowlStack");
  const bowls = Array.from({ length: state.correctCount }, (_, index) => `<div class="bowl ${index === state.correctCount - 1 ? "correct-bump" : ""}"></div>`).join("");
  stack.innerHTML = bowls || `<p class="muted">正解するとお椀が積まれます。</p>`;
}

function getSpeedBonusLabel() {
  if (!state.questionStartTime || !state.selectedTime) return "";
  const elapsed = (Date.now() - state.questionStartTime) / 1000;
  const ratio = elapsed / state.selectedTime;
  if (ratio <= 0.25) return "電光石火！";
  if (ratio <= 0.5) return "やるなあ！";
  return "";
}

function showBonus(speedLabel = "") {
  const pop = $("#bonusPop");
  const streakLabel = state.streak >= 3
    ? (state.streak % 5 === 0 ? `${state.streak}連杯！` : "いい調子！")
    : "";
  const label = speedLabel || streakLabel || "一杯！";
  pop.textContent = label;
  pop.classList.remove("show", "speedy");
  if (speedLabel) pop.classList.add("speedy");
  void pop.offsetWidth;
  pop.classList.add("show");
}

function showScreen(screenId) {
  $$(".screen").forEach(screen => screen.classList.remove("active"));
  $(`#${screenId}`).classList.add("active");
  if (screenId === "setupScreen") renderSetup();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openMenu() {
  const units = [...state.selectedUnits].length ? normalizeMenuUnits([...state.selectedUnits]) : GRAMMAR_UNITS[state.selectedGrade];
  openMenuBook("お品書き", units, false);
}

function openSecretMenu() {
  if (!isExAvailable()) {
    $("#modalTitle").textContent = "裏・お品書き";
    $("#modalBody").innerHTML = `
      <div class="unlock-card book-lock">
        <h3>まだ暖簾の奥には入れません。</h3>
        <p>裏・お品書きは、EX開放後に読める発展メニューです。</p>
        <p>条件：うめて一杯30回クリア → 書ききり一杯10回クリア</p>
        <p class="muted">教師用から確認している場合は、開放前でも確認できます。</p>
      </div>
    `;
    $("#modal").showModal();
    return;
  }

  const selected = getSecretMenuUnits([...state.selectedUnits]);
  const allUnits = getSecretMenuUnits([...GRAMMAR_UNITS[1], ...GRAMMAR_UNITS[2], ...GRAMMAR_UNITS[3]]);
  const displayUnits = selected.length ? selected : allUnits;
  if (!displayUnits.length) {
    $("#modalTitle").textContent = "裏・お品書き";
    $("#modalBody").innerHTML = `
      <div class="unlock-card book-lock">
        <h3>今読める裏・お品書きはありません。</h3>
        <p>教師用で、単元ごとに裏・お品書きを作成できます。</p>
      </div>
    `;
    $("#modal").showModal();
    return;
  }
  openMenuBook("裏・お品書き", displayUnits, true);
}

function openMenuBook(title, units, secret) {
  menuBookState.title = title;
  menuBookState.units = units;
  menuBookState.index = 0;
  menuBookState.secret = secret;
  $("#modalTitle").textContent = title;
  renderMenuBook();
  $("#modal").showModal();
}

function renderMenuBook() {
  const units = menuBookState.units;
  const total = units.length;
  const index = Math.min(Math.max(menuBookState.index, 0), Math.max(total - 1, 0));
  menuBookState.index = index;
  const unit = units[index];

  if (!unit) {
    $("#modalBody").innerHTML = `
      <div class="unlock-card">
        <h3>表示できるお品書きがありません。</h3>
        <p>単元を選び直してください。</p>
      </div>
    `;
    return;
  }

  $("#modalBody").innerHTML = `
    <div class="book-shell ${menuBookState.secret ? "secret-book" : ""}">
      <div class="book-toolbar">
        <button class="ghost-button" id="bookPrevBtn" type="button" ${index === 0 ? "disabled" : ""}>← 前のお品書き</button>
        <div class="book-page-count">
          <span>${index + 1}</span> / ${total}
        </div>
        <button class="ghost-button" id="bookNextBtn" type="button" ${index === total - 1 ? "disabled" : ""}>次のお品書き →</button>
      </div>

      <article class="book-page">
        <div class="book-corner">${menuBookState.secret ? "裏" : "表"}</div>
        ${renderMenuItem(unit, menuBookState.secret)}
      </article>

      <div class="book-index" aria-label="お品書き一覧">
        ${units.map((item, i) => `
          <button class="book-index-chip ${i === index ? "active" : ""}" type="button" data-menu-index="${i}">
            ${escapeHtml(item)}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  $("#bookPrevBtn")?.addEventListener("click", () => turnMenuPage(-1));
  $("#bookNextBtn")?.addEventListener("click", () => turnMenuPage(1));
  $$("[data-menu-index]").forEach(button => {
    button.addEventListener("click", () => {
      menuBookState.index = Number(button.dataset.menuIndex);
      renderMenuBook();
    });
  });
}

function turnMenuPage(delta) {
  const nextIndex = menuBookState.index + delta;
  if (nextIndex < 0 || nextIndex >= menuBookState.units.length) return;
  menuBookState.index = nextIndex;
  renderMenuBook();
}

function renderMenuItem(unit, secret) {
  const data = MENU_EXPLANATIONS[unit] || {
    normal: "この単元は、文の形・語順・使う場面を確認するメニューです。",
    examples: [],
    secret: ""
  };
  if (secret && !hasSecretMenu(unit)) {
    return `
      <div class="menu-item book-menu-item">
        <p class="mini-label">裏・お品書き</p>
        <h3>${escapeHtml(unit)}</h3>
        <section class="menu-explain-section">
          <h4>準備中</h4>
          <p>この単元の裏・お品書きは、まだ作成されていません。</p>
        </section>
      </div>
    `;
  }
  const sections = buildMenuSections(unit, data, secret);
  const exampleList = data.examples?.length
    ? `<div class="menu-example-box"><h4>例文で確認</h4>${data.examples.map(ex => `<p><code>${escapeHtml(ex)}</code></p>`).join("")}</div>`
    : "";

  return `
    <div class="menu-item book-menu-item">
      <p class="mini-label">${secret ? "裏・お品書き" : "お品書き"}</p>
      <h3>${escapeHtml(unit)}</h3>
      ${sections.map(section => `
        <section class="menu-explain-section">
          <h4>${escapeHtml(section.title)}</h4>
          <p>${escapeHtml(section.body)}</p>
          ${section.points?.length ? `<ul>${section.points.map(point => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : ""}
        </section>
      `).join("")}
      ${exampleList}
    </div>
  `;
}

function buildMenuSections(unit, data, secret) {
  const baseText = secret ? data.secret : data.normal;
  const form = getUnitForm(unit, secret);
  const mistakes = getUnitMistakes(unit, secret);

  return [
    {
      title: secret ? "発展で押さえること" : "まず押さえること",
      body: baseText,
      points: secret
        ? ["訳だけでなく、文の中で何の働きをしているかを見る。", "同じ日本語でも、英語では語順や品詞が変わることがある。"]
        : ["最初に主語を見て、次に動詞の形を決める。", "肯定文・否定文・疑問文をセットで確認する。"]
    },
    {
      title: "基本の形",
      body: form.body,
      points: form.points
    },
    {
      title: "まちがえやすいところ",
      body: mistakes.body,
      points: mistakes.points
    }
  ];
}

function getUnitForm(unit, secret) {
  const fallback = {
    body: "この単元では、今までに出てきた形を使って英文の骨組みを作ります。まだ後ろの単元で習う形には頼らず、今の文法だけで判断します。",
    points: ["主語を確認する。", "動詞の種類を確認する。", "肯定文・否定文・疑問文の形を分ける。"]
  };

  if (unit === "be動詞の文①") {
    return {
      body: "I am / You are を中心に、be動詞の現在の文を作ります。be動詞は、主語の説明を後ろにつなぐ働きをします。",
      points: ["I なら am、you なら are。", "否定文は am not / are not。", "疑問文は Am I...? / Are you...? の形。"]
    };
  }
  if (unit === "be動詞のまとめ") {
    return {
      body: "be動詞の文では、主語に合わない be動詞を選んだり、疑問文で語順を変え忘れたりしやすいです。",
      points: ["I are ではなく I am。", "You is ではなく You are。", "You are busy? ではなく Are you busy?"]
    };
  }
  if (unit === "一般動詞の文のまとめ") {
    return {
      body: "一般動詞の文では、do / does を使ったあとに動詞を原形に戻すことが大切です。",
      points: ["Does he plays...? ではなく Does he play...?", "She doesn't studies. ではなく She doesn't study.", "Do you likes...? ではなく Do you like...?"]
    };
  }
  if (unit === "一般動詞の文①") {
    return {
      body: "I / You を主語にして、動作を表す一般動詞の文を作ります。否定文や疑問文では do を使います。",
      points: ["肯定文は I play tennis. のように主語 + 動詞。", "否定文は don't + 動詞の原形。", "疑問文は Do you + 動詞の原形...?"]
    };
  }
  if (unit === "be動詞の文②") {
    return {
      body: "He / She / This / That を主語にする be動詞の文です。1人の人や1つのものを説明するときは is を使います。",
      points: ["He is / She is / This is / That is の形。", "否定文は is not。", "疑問文は Is he...? / Is this...? の形。"]
    };
  }
  if (unit === "一般動詞の文②") {
    return {
      body: "He / She を主語にする一般動詞の文です。現在の肯定文では動詞の形が変わり、疑問文・否定文では does を使います。",
      points: ["肯定文では plays / studies のように動詞の形に注意。", "否定文は doesn't + 動詞の原形。", "疑問文は Does he / she + 動詞の原形...?"]
    };
  }
  if (unit === "be動詞のまとめ") {
    return {
      body: "ここまでの be動詞の文をまとめます。am / are / is の使い分け、肯定文・否定文・疑問文の形を一度に確認します。",
      points: ["I am / You are / He is / She is / This is / That is を整理する。", "否定文は be動詞 + not。", "疑問文は be動詞を文のはじめに出す。"]
    };
  }
  if (unit === "一般動詞の文のまとめ") {
    return {
      body: "ここまでの一般動詞の文をまとめます。I / you と he / she で、肯定文・否定文・疑問文の作り方がどう変わるかを確認します。",
      points: ["I / you の疑問文は Do を使う。", "he / she の疑問文は Does を使う。", "don't / doesn't / do / does の後ろは動詞の原形にする。"]
    };
  }
  if (unit === "名詞・代名詞の基本") {
    return {
      body: "名詞が2つ以上あるときは複数形にします。また、代名詞は文の中での役割によって形が変わります。",
      points: ["book → books、box → boxes。", "I / my / me / mine のように形を分ける。", "名詞の前に置く形と、動詞の後ろに置く形を区別する。"]
    };
  }
  if (unit === "疑問詞を使った疑問文") {
    return {
      body: "what / who / where / when / why / how などを文の先頭に置いて、たずねたい内容をはっきりさせます。",
      points: ["疑問詞の後ろは、be動詞の疑問文または do / does を使う疑問文。", "How many は数、What time は時刻、Whose はだれのものかをたずねる。", "or疑問文や感嘆文も、語順とかたまりを意識する。"]
    };
  }
  if (unit === "基本表現の広がり①") {
    return {
      body: "命令文と can を使う文を扱います。命令文は動詞の原形から始め、can の後ろも動詞の原形にします。",
      points: ["命令文：Open the door.", "否定命令：Don't run.", "can：I can swim. / Can you swim?"]
    };
  }
  if (unit === "存在構文") {
    return {
      body: "There is / There are は『〜があります・います』を表します。後ろに来る名詞が単数か複数かで is / are を選びます。",
      points: ["単数：There is a book.", "複数：There are two books.", "疑問文は Is there...? / Are there...?"]
    };
  }
  if (unit === "方法をたずねる文") {
    return {
      body: "How を使って、やり方や方法をたずねます。How do you...? は『どうやって〜しますか』、How can I...? は『どうすれば〜できますか』を表します。",
      points: ["How do you use this?", "How can I open this?", "Can you help me? のような依頼表現も扱う。"]
    };
  }
  if (unit === "現在進行形") {
    return {
      body: "現在進行形は be動詞 + 動詞のing形で、『今〜しているところ』を表します。be動詞は主語に合わせます。",
      points: ["I am studying.", "She is playing tennis.", "否定文は be動詞 + not、疑問文は be動詞を前へ出す。"]
    };
  }
  if (unit === "過去形の基本") {
    return {
      body: "過去のことを表すときは、一般動詞の過去形や be動詞の過去形を使います。",
      points: ["一般動詞は play → played のように変える。", "be動詞：am / is → was、are → were。", "過去を表す語句と一緒に判断する。"]
    };
  }

  if (unit === "過去・進行形の発展") {
    return {
      body: "過去の状態や、過去のある時点でしていた途中の動作を表します。be動詞の過去形と過去進行形を区別します。",
      points: ["I was busy yesterday.", "I was studying then.", "過去進行形は was / were + 動詞のing形。"]
    };
  }
  if (unit === "接続詞 when") {
    return {
      body: "when は『〜するとき』を表し、2つの文をつなぐことができます。when の後ろにも主語と動詞を置きます。",
      points: ["When I got home, I was tired.", "I was happy when I saw her.", "when の節と主文を分けて考える。"]
    };
  }
  if (unit === "未来表現") {
    return {
      body: "未来の予定や意志を表すとき、be going to や will を使います。どちらも後ろは動詞の原形です。",
      points: ["I am going to study.", "I will study.", "will の否定文は will not、疑問文は Will you...?"]
    };
  }
  if (unit === "接続詞 if") {
    return {
      body: "if は『もし〜なら』を表し、条件を表す文を作ります。if の後ろにも主語と動詞を置きます。",
      points: ["If it is sunny, I will play tennis.", "I will help you if I have time.", "条件を表す部分と、結果を表す部分を分ける。"]
    };
  }
  if (unit === "助動詞・必要を表す文") {
    return {
      body: "can / may / shall / must / have to を使い、可能・許可・提案・義務・必要を表します。助動詞の後ろは動詞の原形です。",
      points: ["may は『〜してもよい』。", "must / have to は『〜しなければならない』。", "have to の疑問文・否定文では do / does を使う。"]
    };
  }
  if (unit === "不定詞・動名詞") {
    return {
      body: "不定詞は to + 動詞の原形、動名詞は 動詞のing形 です。どちらも『〜すること』を表すことがあります。",
      points: ["不定詞は to read の形。", "動名詞は reading の形。", "不定詞は『〜するために』『〜するための』の意味でも使う。"]
    };
  }
  if (unit === "人にものを渡す・伝える文") {
    return {
      body: "give / show / tell / buy などは、人とものを続けて置くことができます。だれに、何を、の順番に注意します。",
      points: ["give 人 もの：I gave him a book.", "show 人 もの：She showed me a picture.", "buy 人 もの：I bought her a bag."]
    };
  }
  if (unit === "前置詞の基本") {
    return {
      body: "前置詞は名詞の前に置き、場所・時・動詞とセットの意味を作ります。日本語の助詞と完全には対応しません。",
      points: ["場所は at school / in the park のように表す。", "時は on Sunday / in the morning のように表す。", "listen to / look at のように動詞とセットで覚える。"]
    };
  }
  if (unit === "接続詞と文をつなぐ表現") {
    return {
      body: "because や that を使って文と文をつなぎます。I think that... や I'm sure that... の形も扱います。",
      points: ["because は理由を表す。", "that の後ろには主語と動詞を置く。", "I think that... は『私は〜だと思う』。"]
    };
  }
  if (unit === "It is 構文") {
    return {
      body: "It is + 形容詞 + for 人 + to 動詞の原形で、『人にとって〜することは…だ』を表します。",
      points: ["It is important for me to study English.", "To study English is important. との書き換えも扱う。", "出題では書き換え問題も混ぜる。"]
    };
  }
  if (unit === "比較") {
    return {
      body: "比較級・最上級・as ... as を使って、ものや人の程度を比べます。何と何を比べているかを確認します。",
      points: ["比較級 + than：〜より…。", "the + 最上級：一番…。", "as + 原級 + as：〜と同じくらい…。"]
    };
  }
  if (unit === "受け身") {
    return {
      body: "受け身は be動詞 + 過去分詞で『〜される』を表します。中2では現在・過去の受け身を中心に扱います。",
      points: ["This book is read by many people.", "否定文・疑問文は be動詞の文と同じように作る。", "by を使う場合と使わない場合を分ける。"]
    };
  }

  if (unit === "受け身の発展") {
    return {
      body: "中3では受け身を発展させ、未来の受け身や by を使わない受け身の考え方も扱います。",
      points: ["will be + 過去分詞。", "made in Japan のように by を使わない表現。", "だれがしたかより、何がされたかを中心に見る。"]
    };
  }
  if (unit === "人やものを説明する文") {
    return {
      body: "call / make / name などを使い、人やものをどのように呼ぶか、どのような状態にするかを表します。",
      points: ["call him Ken", "make me happy", "make / let / help + 人 + 動詞の原形。"]
    };
  }
  if (unit === "現在完了") {
    return {
      body: "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。継続・経験・完了を区別します。",
      points: ["継続では for / since をよく使う。", "経験では ever / never / once / twice をよく使う。", "完了では just / already / yet をよく使う。"]
    };
  }
  if (unit === "関係代名詞") {
    return {
      body: "関係代名詞は、名詞の後ろに説明をつけるために使います。who / which / that を先行詞に合わせて選びます。",
      points: ["人なら who / that を使う。", "ものなら which / that を使う。", "目的格の関係代名詞は省略されることがある。"]
    };
  }
  if (unit === "thatを使う文・間接疑問文") {
    return {
      body: "that を使って気持ちや判断の内容を続けたり、間接疑問文で『何を〜か』『なぜ〜か』を文の一部に入れたりします。",
      points: ["I am glad that you are here.", "I don't know what he likes.", "間接疑問文では 疑問詞 + 主語 + 動詞 の語順。"]
    };
  }
  if (unit === "名詞を後ろから説明する文") {
    return {
      body: "現在分詞・過去分詞・主語＋動詞のかたまりを使い、名詞を後ろから説明します。",
      points: ["the boy playing soccer", "the book written by him", "the book I bought yesterday。"]
    };
  }
  if (unit === "不定詞の発展") {
    return {
      body: "疑問詞 + to 動詞の原形、want 人 to、tell / ask 人 to など、不定詞を使った発展表現を扱います。",
      points: ["what to do", "I want you to help me.", "She asked me to open the door."]
    };
  }
  if (unit === "前置詞の発展") {
    return {
      body: "動詞や形容詞とセットで使う前置詞、前置詞句による説明を扱います。かたまりで意味を取ることが大切です。",
      points: ["be good at", "be interested in", "the book on the desk のように名詞を説明する。"]
    };
  }
  if (unit === "仮定法") {
    return {
      body: "仮定法は、今の事実とは違うことや実現しにくい願いを表します。If I were... / I wish I could... の形を扱います。",
      points: ["If I were you, I would study.", "If I could fly, I would go there.", "I wish I could speak English."]
    };
  }

  return fallback;
}

function getUnitMistakes(unit, secret) {
  if (unit === "be動詞のまとめ") {
    return {
      body: "be動詞の文では、主語に合わない be動詞を選んだり、疑問文で語順を変え忘れたりしやすいです。",
      points: ["I are ではなく I am。", "You is ではなく You are。", "You are busy? ではなく Are you busy?"]
    };
  }
  if (unit === "一般動詞の文のまとめ") {
    return {
      body: "一般動詞の文では、do / does を使ったあとに動詞を原形に戻すことが大切です。",
      points: ["Does he plays...? ではなく Does he play...?", "She doesn't studies. ではなく She doesn't study.", "Do you likes...? ではなく Do you like...?"]
    };
  }
  if (unit === "一般動詞の文①") {
    return {
      body: "do を使ったあとに、動詞を原形にすることを忘れないようにします。I / You の文では、まず do / don't の形を固めます。",
      points: ["Do you likes...? ではなく Do you like...?", "I don't plays. ではなく I don't play."]
    };
  }
  if (unit === "一般動詞の文②") {
    return {
      body: "does / doesn't を使ったあとに、動詞を原形へ戻し忘れるミスが多いです。動詞の形の変化は does が受け持ちます。",
      points: ["Does he plays...? ではなく Does he play...?", "She doesn't studies. ではなく She doesn't study."]
    };
  }
  if (unit.includes("一般動詞") || unit.includes("have to")) {
    return {
      body: "do / does を使ったあとに、動詞を原形へ戻し忘れるミスが多いです。文法の印がどこにあるかを確認します。",
      points: ["Do / Does の後ろは動詞の原形。", "have to の疑問文・否定文でも do / does を使う。"]
    };
  }
  if (unit.includes("be動詞")) {
    return {
      body: "be動詞を入れ忘れる、または一般動詞の文と混ぜるミスが多いです。be動詞の文なのか、一般動詞の文なのかを最初に分けます。",
      points: ["She happy. ではなく She is happy.", "Is she...? / She is not... の語順に注意する。"]
    };
  }
  if (unit.includes("進行形")) {
    return {
      body: "進行形では be動詞を入れ忘れるミスが多いです。ing形だけでは進行形の文になりません。",
      points: ["She playing tennis. ではなく She is playing tennis.", "疑問文・否定文はbe動詞を動かす。"]
    };
  }
  if (unit.includes("助動詞") || unit.includes("can") || unit.includes("will") || unit.includes("must") || unit.includes("may")) {
    return {
      body: "助動詞の後ろに三単現の s や過去形を置いてしまうミスがあります。助動詞の後ろは必ず動詞の原形です。",
      points: ["He can plays. ではなく He can play.", "She will went. ではなく She will go."]
    };
  }
  if (unit.includes("不定詞") || unit.includes("動名詞")) {
    return {
      body: "to の後ろに ing を置いたり、動名詞と現在進行形を混同したりしやすいです。『形』と『働き』を分けて見ます。",
      points: ["to read は to + 原形。", "reading は名詞の働きにも、進行形の一部にもなる。", "like to read / like reading はどちらも使えるが、練習単元に合わせて答える。"]
    };
  }
  if (unit.includes("比較") || unit.includes("最上級") || unit.includes("as ... as")) {
    return {
      body: "more と -er、most と -est を混ぜるミスが多いです。また、比較級には than、最上級には the が必要になることが多いです。",
      points: ["more newer とはしない。", "the most interesting の the を忘れない。", "as interesting as の2つ目の as を忘れない。"]
    };
  }
  return {
    body: "日本語をそのまま英語の順番に置き換えると、語順が崩れやすいです。英語の型に合わせて、必要な語を入れる意識を持ちます。",
    points: ["空欄の前後だけで判断しない。", "主語と動詞の関係を見る。", "時を表す語句や否定語を見落とさない。"]
  };
}

function openStats() {
  $("#modalTitle").textContent = "食べ歩き帳";
  const weakUnits = getWeakUnits(5);
  const unitProgress = getUnitProgress(8);
  const wrongCount = (progress.wrongBank || []).length;
  const teacherCount = progress.teacherBank?.length || 0;
  const exText = IS_TEACHER_PREVIEW ? "教師確認モード" : (progress.exUnlocked ? "開放済み" : `うめて一杯 ${progress.blankClearCount}/30・書ききり一杯 ${progress.fullClearCount}/10`);
  const totalAnswers = progress.history.length;
  const correctAnswers = progress.history.filter(item => item.isCorrect).length;
  const totalRate = totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const titleText = progress.titles.length ? progress.titles.at(-1) : "見習いそば客";
  const weakText = weakUnits.length ? weakUnits.map(escapeHtml).join(" / ") : "まだ十分なデータがありません。";
  const unitText = unitProgress.length ? unitProgress.map(item => `${escapeHtml(item.unit)}：${item.rate}%（${item.total}問）`).join("<br>") : "まだ記録がありません。";
  const teacherUpdated = progress.teacherPackageUpdatedAt ? new Date(progress.teacherPackageUpdatedAt).toLocaleString("ja-JP") : "未反映";
  $("#modalBody").innerHTML = `
    <div class="menu-hub">
      <section class="menu-hero-card">
        <div>
          <p class="menu-hero-kicker">学習の足あと</p>
          <h3>${escapeHtml(titleText)}</h3>
          <p>理解度 ${totalRate}%・最高 ${progress.bestStreak || 0}連杯</p>
        </div>
        <div class="mini-donut" style="--rate:${totalRate}">
          <div><strong>${totalRate}%</strong><span>理解度</span></div>
        </div>
      </section>

      <section class="menu-section-card menu-primary-actions">
        <div class="menu-section-head">
          <span class="menu-section-icon">🍜</span>
          <div><h3>おかわり場</h3><p>間違えた問題だけを、あとから復習できます。</p></div>
        </div>
        <div class="menu-action-list">
          <button class="menu-action-button primary" id="startReviewBtn" type="button" ${wrongCount ? "" : "disabled"}>
            <span>おかわり復習</span><small>${wrongCount ? `復習待ち ${wrongCount}問` : "復習待ちはありません"}</small>
          </button>
        </div>
      </section>

      <details class="menu-section-card" open>
        <summary><span class="menu-section-icon">📊</span><span>学習の進み具合</span></summary>
        <div class="menu-mini-grid">
          <div class="menu-mini-card"><span>総解答数</span><strong>${totalAnswers}</strong></div>
          <div class="menu-mini-card"><span>復習待ち</span><strong>${wrongCount}</strong></div>
          <div class="menu-mini-card"><span>保存英文</span><strong>${progress.solvedBank.length}</strong></div>
          <div class="menu-mini-card"><span>先生の一杯</span><strong>${teacherCount}</strong></div>
        </div>
      </details>

      <details class="menu-section-card">
        <summary><span class="menu-section-icon">🔓</span><span>解放状況</span></summary>
        <div class="menu-mini-grid">
          <div class="menu-mini-card"><span>うめて一杯</span><strong>${progress.blankClearCount}/30</strong></div>
          <div class="menu-mini-card"><span>書ききり一杯</span><strong>${progress.fullClearCount}/10</strong></div>
          <div class="menu-mini-card wide"><span>EX</span><strong>${escapeHtml(exText)}</strong></div>
        </div>
      </details>

      <details class="menu-section-card" open>
        <summary><span class="menu-section-icon">🥢</span><span>理解度</span></summary>
        ${renderUnderstandingPanel(unitProgress)}
      </details>

      <details class="menu-section-card">
        <summary><span class="menu-section-icon">📚</span><span>単元の様子</span></summary>
        <div class="menu-info-block">
          <h4>苦手そうな単元</h4>
          <p>${weakText}</p>
        </div>
        <div class="menu-info-block">
          <h4>単元別達成率</h4>
          <p>${unitText}</p>
        </div>
      </details>

      <details class="menu-section-card">
        <summary><span class="menu-section-icon">🏷️</span><span>称号・先生メニュー</span></summary>
        <div class="menu-info-block">
          <h4>称号</h4>
          <p>${progress.titles.map(escapeHtml).join(" / ") || "まだ称号はありません。"}</p>
        </div>
        <div class="menu-info-block">
          <h4>先生からの一杯</h4>
          <p>追加問題：${teacherCount}問<br>最終反映：${escapeHtml(teacherUpdated)}</p>
        </div>
      </details>
    </div>
  `;
  $("#modal").showModal();
  $("#startReviewBtn")?.addEventListener("click", startReviewSession);
}
function startQuestionTimer() {
  stopTimer();
  state.remainingSeconds = state.selectedTime;
  state.questionStartTime = Date.now();
  updateTimerDisplay();
  state.timerId = window.setInterval(() => {
    state.remainingSeconds -= 1;
    updateTimerDisplay();
    if (state.remainingSeconds <= 0) handleTimeUp();
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerDisplay() {
  const timer = $("#timerText");
  if (!timer) return;
  timer.textContent = `${Math.max(0, state.remainingSeconds)}秒`;
  timer.classList.toggle("danger", state.remainingSeconds <= 5);
}

function handleTimeUp() {
  if (state.answered) return;
  stopTimer();
  const question = state.questions[state.currentIndex];
  let correctAnswer = question.blankAnswer;
  if (state.selectedMode === "kakikiri" || state.selectedMode === "narabete") {
    correctAnswer = question.fullSentence.replace(/[.?!]/g, "");
  }
  state.answered = true;
  state.streak = 0;
  state.wrongQuestions.push(question);
  saveAnswerLog(question, false, "時間切れ");
  renderFeedback(question, false, correctAnswer, true);
  renderBowls();
  $("#streakText").textContent = `${state.streak}連杯`;
  $("#answerArea").classList.add("shake");
  setTimeout(() => $("#answerArea")?.classList.remove("shake"), 400);
}

function startReviewSession() {
  const bank = progress.wrongBank || [];
  if (!bank.length) return;
  $("#modal").close();
  resetGameState();
  state.reviewMode = true;
  state.selectedMode = "umete";
  state.questions = shuffle(bank).slice(0, state.selectedCups).map(q => ({
    ...q,
    id: `review-${q.id || hashCode(q.fullSentence)}-${Date.now()}-${Math.random()}`,
    level: q.level || state.selectedLevel,
    explanation: q.explanation || "正解の形を確認して、同じ文をもう一度使えるようにしましょう。"
  }));
  showScreen("gameScreen");
  renderQuestion();
}

function makeTeacherAddedQuestion(level, unitFilter = null) {
  const bank = progress.teacherBank || [];
  const unitName = unitFilter || TEACHER_UNIT_NAME;
  const filteredByUnit = unitFilter ? bank.filter(q => (q.unit || TEACHER_UNIT_NAME) === unitFilter) : bank;
  const filteredByLevel = filteredByUnit.filter(q => !q.level || q.level === level);
  const pool = filteredByLevel.length ? filteredByLevel : filteredByUnit;
  if (!pool.length) return makeFallbackQuestion(unitName, state.selectedGrade, level);
  const item = pick(pool);
  return baseQuestion({
    unit: item.unit || unitName,
    grade: item.grade || findGradeByUnit(item.unit) || state.selectedGrade,
    level: item.level || level,
    jp: item.jp,
    fullSentence: item.fullSentence,
    blankSentence: item.blankSentence,
    blankAnswer: item.blankAnswer,
    choices: item.choices,
    explanation: item.explanation || "先生が追加した問題です。文の形と空欄の前後を確認しましょう。",
    teacherMade: true
  });
}


const EXPANDED_QUESTION_BANK = {
  "be動詞の文①": [
    {
      "jp": "私は学生です。",
      "en": "I am a student.",
      "blank": "I ___ a student.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "私は学生ではありません。",
      "en": "I am not a student.",
      "blank": "I am ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "私は親切です。",
      "en": "I am kind.",
      "blank": "I ___ kind.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "私は親切ではありません。",
      "en": "I am not kind.",
      "blank": "I am ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "私は忙しいです。",
      "en": "I am busy.",
      "blank": "I ___ busy.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "私は忙しいではありません。",
      "en": "I am not busy.",
      "blank": "I am ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "私は元気です。",
      "en": "I am fine.",
      "blank": "I ___ fine.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "私は元気ではありません。",
      "en": "I am not fine.",
      "blank": "I am ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "私は私の友達です。",
      "en": "I am my friend.",
      "blank": "I ___ my friend.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "私は私の友達ではありません。",
      "en": "I am not my friend.",
      "blank": "I am ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あなたは学生です。",
      "en": "You are a student.",
      "blank": "You ___ a student.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "あなたは学生ではありません。",
      "en": "You are not a student.",
      "blank": "You are ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あなたは親切です。",
      "en": "You are kind.",
      "blank": "You ___ kind.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "あなたは親切ではありません。",
      "en": "You are not kind.",
      "blank": "You are ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あなたは忙しいです。",
      "en": "You are busy.",
      "blank": "You ___ busy.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "あなたは忙しいではありません。",
      "en": "You are not busy.",
      "blank": "You are ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あなたは元気です。",
      "en": "You are fine.",
      "blank": "You ___ fine.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "あなたは元気ではありません。",
      "en": "You are not fine.",
      "blank": "You are ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あなたは私の友達です。",
      "en": "You are my friend.",
      "blank": "You ___ my friend.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "be動詞は主語に合わせて選びます。I は am、you は are を使います。"
    },
    {
      "jp": "あなたは私の友達ではありません。",
      "en": "You are not my friend.",
      "blank": "You are ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "私は学生ですか。",
      "en": "Am i a student?",
      "blank": "___ i a student?",
      "answer": "Am",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "私は親切ですか。",
      "en": "Am i kind?",
      "blank": "___ i kind?",
      "answer": "Am",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "私は忙しいですか。",
      "en": "Am i busy?",
      "blank": "___ i busy?",
      "answer": "Am",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "私は元気ですか。",
      "en": "Am i fine?",
      "blank": "___ i fine?",
      "answer": "Am",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "あなたは学生ですか。",
      "en": "Are you a student?",
      "blank": "___ you a student?",
      "answer": "Are",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "あなたは親切ですか。",
      "en": "Are you kind?",
      "blank": "___ you kind?",
      "answer": "Are",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "あなたは忙しいですか。",
      "en": "Are you busy?",
      "blank": "___ you busy?",
      "answer": "Are",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "あなたは元気ですか。",
      "en": "Are you fine?",
      "blank": "___ you fine?",
      "answer": "Are",
      "choices": [
        "Am",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "be動詞の疑問文は、be動詞を主語の前に出します。"
    },
    {
      "jp": "あなたは何歳ですか。",
      "en": "How old are you?",
      "blank": "How old ___ you?",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "do"
      ],
      "explanation": "疑問詞を使う問いでも、be動詞の文では be動詞を主語の前に置きます。"
    },
    {
      "jp": "あなたはどこ出身ですか。",
      "en": "Where are you from?",
      "blank": "Where ___ you from?",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "do"
      ],
      "explanation": "where を使う問いでも、be動詞の形を確認します。"
    }
  ],
  "一般動詞の文①": [
    {
      "jp": "私は毎日英語を勉強します。",
      "en": "I study English every day.",
      "blank": "I ___ English every day.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日英語を勉強しません。",
      "en": "I don't study English every day.",
      "blank": "I ___ ___ English every day.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日英語を勉強しますか。",
      "en": "Do i study English every day?",
      "blank": "___ i ___ English every day?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日本を読みます。",
      "en": "I read books every day.",
      "blank": "I ___ books every day.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日本を読みません。",
      "en": "I don't read books every day.",
      "blank": "I ___ ___ books every day.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日本を読みますか。",
      "en": "Do i read books every day?",
      "blank": "___ i ___ books every day?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日テレビを見ます。",
      "en": "I watch TV every day.",
      "blank": "I ___ TV every day.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日テレビを見ません。",
      "en": "I don't watch TV every day.",
      "blank": "I ___ ___ TV every day.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日テレビを見ますか。",
      "en": "Do i watch TV every day?",
      "blank": "___ i ___ TV every day?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日音楽を聴きます。",
      "en": "I listen to music every day.",
      "blank": "I ___ music every day.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日音楽を聴きません。",
      "en": "I don't listen to music every day.",
      "blank": "I ___ ___ music every day.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日音楽を聴きますか。",
      "en": "Do i listen to music every day?",
      "blank": "___ i ___ music every day?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日ピアノを弾きます。",
      "en": "I play the piano every day.",
      "blank": "I ___ the piano every day.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は毎日ピアノを弾きません。",
      "en": "I don't play the piano every day.",
      "blank": "I ___ ___ the piano every day.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日ピアノを弾きますか。",
      "en": "Do i play the piano every day?",
      "blank": "___ i ___ the piano every day?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後英語を勉強します。",
      "en": "I study English after school.",
      "blank": "I ___ English after school.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後英語を勉強しません。",
      "en": "I don't study English after school.",
      "blank": "I ___ ___ English after school.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は放課後英語を勉強しますか。",
      "en": "Do i study English after school?",
      "blank": "___ i ___ English after school?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後本を読みます。",
      "en": "I read books after school.",
      "blank": "I ___ books after school.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後本を読みません。",
      "en": "I don't read books after school.",
      "blank": "I ___ ___ books after school.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は放課後本を読みますか。",
      "en": "Do i read books after school?",
      "blank": "___ i ___ books after school?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後テレビを見ます。",
      "en": "I watch TV after school.",
      "blank": "I ___ TV after school.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後テレビを見ません。",
      "en": "I don't watch TV after school.",
      "blank": "I ___ ___ TV after school.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は放課後テレビを見ますか。",
      "en": "Do i watch TV after school?",
      "blank": "___ i ___ TV after school?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後音楽を聴きます。",
      "en": "I listen to music after school.",
      "blank": "I ___ music after school.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後音楽を聴きません。",
      "en": "I don't listen to music after school.",
      "blank": "I ___ ___ music after school.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は放課後音楽を聴きますか。",
      "en": "Do i listen to music after school?",
      "blank": "___ i ___ music after school?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後ピアノを弾きます。",
      "en": "I play the piano after school.",
      "blank": "I ___ the piano after school.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は放課後ピアノを弾きません。",
      "en": "I don't play the piano after school.",
      "blank": "I ___ ___ the piano after school.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は放課後ピアノを弾きますか。",
      "en": "Do i play the piano after school?",
      "blank": "___ i ___ the piano after school?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に英語を勉強します。",
      "en": "I study English on Sundays.",
      "blank": "I ___ English on Sundays.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に英語を勉強しません。",
      "en": "I don't study English on Sundays.",
      "blank": "I ___ ___ English on Sundays.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は日曜日に英語を勉強しますか。",
      "en": "Do i study English on Sundays?",
      "blank": "___ i ___ English on Sundays?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に本を読みます。",
      "en": "I read books on Sundays.",
      "blank": "I ___ books on Sundays.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に本を読みません。",
      "en": "I don't read books on Sundays.",
      "blank": "I ___ ___ books on Sundays.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は日曜日に本を読みますか。",
      "en": "Do i read books on Sundays?",
      "blank": "___ i ___ books on Sundays?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日にテレビを見ます。",
      "en": "I watch TV on Sundays.",
      "blank": "I ___ TV on Sundays.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日にテレビを見ません。",
      "en": "I don't watch TV on Sundays.",
      "blank": "I ___ ___ TV on Sundays.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は日曜日にテレビを見ますか。",
      "en": "Do i watch TV on Sundays?",
      "blank": "___ i ___ TV on Sundays?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に音楽を聴きます。",
      "en": "I listen to music on Sundays.",
      "blank": "I ___ music on Sundays.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日に音楽を聴きません。",
      "en": "I don't listen to music on Sundays.",
      "blank": "I ___ ___ music on Sundays.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は日曜日に音楽を聴きますか。",
      "en": "Do i listen to music on Sundays?",
      "blank": "___ i ___ music on Sundays?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日にピアノを弾きます。",
      "en": "I play the piano on Sundays.",
      "blank": "I ___ the piano on Sundays.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は日曜日にピアノを弾きません。",
      "en": "I don't play the piano on Sundays.",
      "blank": "I ___ ___ the piano on Sundays.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は日曜日にピアノを弾きますか。",
      "en": "Do i play the piano on Sundays?",
      "blank": "___ i ___ the piano on Sundays?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は朝英語を勉強します。",
      "en": "I study English in the morning.",
      "blank": "I ___ English in the morning.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は朝英語を勉強しません。",
      "en": "I don't study English in the morning.",
      "blank": "I ___ ___ English in the morning.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は朝英語を勉強しますか。",
      "en": "Do i study English in the morning?",
      "blank": "___ i ___ English in the morning?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は朝本を読みます。",
      "en": "I read books in the morning.",
      "blank": "I ___ books in the morning.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は朝本を読みません。",
      "en": "I don't read books in the morning.",
      "blank": "I ___ ___ books in the morning.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は朝本を読みますか。",
      "en": "Do i read books in the morning?",
      "blank": "___ i ___ books in the morning?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は朝テレビを見ます。",
      "en": "I watch TV in the morning.",
      "blank": "I ___ TV in the morning.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は朝テレビを見ません。",
      "en": "I don't watch TV in the morning.",
      "blank": "I ___ ___ TV in the morning.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は朝テレビを見ますか。",
      "en": "Do i watch TV in the morning?",
      "blank": "___ i ___ TV in the morning?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は朝音楽を聴きます。",
      "en": "I listen to music in the morning.",
      "blank": "I ___ music in the morning.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は朝音楽を聴きません。",
      "en": "I don't listen to music in the morning.",
      "blank": "I ___ ___ music in the morning.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は朝音楽を聴きますか。",
      "en": "Do i listen to music in the morning?",
      "blank": "___ i ___ music in the morning?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "私は朝ピアノを弾きます。",
      "en": "I play the piano in the morning.",
      "blank": "I ___ the piano in the morning.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "私は朝ピアノを弾きません。",
      "en": "I don't play the piano in the morning.",
      "blank": "I ___ ___ the piano in the morning.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は朝ピアノを弾きますか。",
      "en": "Do i play the piano in the morning?",
      "blank": "___ i ___ the piano in the morning?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日英語を勉強します。",
      "en": "You study English every day.",
      "blank": "You ___ English every day.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日英語を勉強しません。",
      "en": "You don't study English every day.",
      "blank": "You ___ ___ English every day.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日英語を勉強しますか。",
      "en": "Do you study English every day?",
      "blank": "___ you ___ English every day?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日本を読みます。",
      "en": "You read books every day.",
      "blank": "You ___ books every day.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日本を読みません。",
      "en": "You don't read books every day.",
      "blank": "You ___ ___ books every day.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日本を読みますか。",
      "en": "Do you read books every day?",
      "blank": "___ you ___ books every day?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日テレビを見ます。",
      "en": "You watch TV every day.",
      "blank": "You ___ TV every day.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日テレビを見ません。",
      "en": "You don't watch TV every day.",
      "blank": "You ___ ___ TV every day.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日テレビを見ますか。",
      "en": "Do you watch TV every day?",
      "blank": "___ you ___ TV every day?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日音楽を聴きます。",
      "en": "You listen to music every day.",
      "blank": "You ___ music every day.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日音楽を聴きません。",
      "en": "You don't listen to music every day.",
      "blank": "You ___ ___ music every day.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日音楽を聴きますか。",
      "en": "Do you listen to music every day?",
      "blank": "___ you ___ music every day?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きます。",
      "en": "You play the piano every day.",
      "blank": "You ___ the piano every day.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きません。",
      "en": "You don't play the piano every day.",
      "blank": "You ___ ___ the piano every day.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きますか。",
      "en": "Do you play the piano every day?",
      "blank": "___ you ___ the piano every day?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後英語を勉強します。",
      "en": "You study English after school.",
      "blank": "You ___ English after school.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後英語を勉強しません。",
      "en": "You don't study English after school.",
      "blank": "You ___ ___ English after school.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは放課後英語を勉強しますか。",
      "en": "Do you study English after school?",
      "blank": "___ you ___ English after school?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後本を読みます。",
      "en": "You read books after school.",
      "blank": "You ___ books after school.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後本を読みません。",
      "en": "You don't read books after school.",
      "blank": "You ___ ___ books after school.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは放課後本を読みますか。",
      "en": "Do you read books after school?",
      "blank": "___ you ___ books after school?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後テレビを見ます。",
      "en": "You watch TV after school.",
      "blank": "You ___ TV after school.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後テレビを見ません。",
      "en": "You don't watch TV after school.",
      "blank": "You ___ ___ TV after school.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは放課後テレビを見ますか。",
      "en": "Do you watch TV after school?",
      "blank": "___ you ___ TV after school?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後音楽を聴きます。",
      "en": "You listen to music after school.",
      "blank": "You ___ music after school.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後音楽を聴きません。",
      "en": "You don't listen to music after school.",
      "blank": "You ___ ___ music after school.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは放課後音楽を聴きますか。",
      "en": "Do you listen to music after school?",
      "blank": "___ you ___ music after school?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後ピアノを弾きます。",
      "en": "You play the piano after school.",
      "blank": "You ___ the piano after school.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後ピアノを弾きません。",
      "en": "You don't play the piano after school.",
      "blank": "You ___ ___ the piano after school.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは放課後ピアノを弾きますか。",
      "en": "Do you play the piano after school?",
      "blank": "___ you ___ the piano after school?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に英語を勉強します。",
      "en": "You study English on Sundays.",
      "blank": "You ___ English on Sundays.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に英語を勉強しません。",
      "en": "You don't study English on Sundays.",
      "blank": "You ___ ___ English on Sundays.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは日曜日に英語を勉強しますか。",
      "en": "Do you study English on Sundays?",
      "blank": "___ you ___ English on Sundays?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に本を読みます。",
      "en": "You read books on Sundays.",
      "blank": "You ___ books on Sundays.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に本を読みません。",
      "en": "You don't read books on Sundays.",
      "blank": "You ___ ___ books on Sundays.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは日曜日に本を読みますか。",
      "en": "Do you read books on Sundays?",
      "blank": "___ you ___ books on Sundays?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日にテレビを見ます。",
      "en": "You watch TV on Sundays.",
      "blank": "You ___ TV on Sundays.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日にテレビを見ません。",
      "en": "You don't watch TV on Sundays.",
      "blank": "You ___ ___ TV on Sundays.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは日曜日にテレビを見ますか。",
      "en": "Do you watch TV on Sundays?",
      "blank": "___ you ___ TV on Sundays?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に音楽を聴きます。",
      "en": "You listen to music on Sundays.",
      "blank": "You ___ music on Sundays.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日に音楽を聴きません。",
      "en": "You don't listen to music on Sundays.",
      "blank": "You ___ ___ music on Sundays.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは日曜日に音楽を聴きますか。",
      "en": "Do you listen to music on Sundays?",
      "blank": "___ you ___ music on Sundays?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日にピアノを弾きます。",
      "en": "You play the piano on Sundays.",
      "blank": "You ___ the piano on Sundays.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは日曜日にピアノを弾きません。",
      "en": "You don't play the piano on Sundays.",
      "blank": "You ___ ___ the piano on Sundays.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは日曜日にピアノを弾きますか。",
      "en": "Do you play the piano on Sundays?",
      "blank": "___ you ___ the piano on Sundays?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝英語を勉強します。",
      "en": "You study English in the morning.",
      "blank": "You ___ English in the morning.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝英語を勉強しません。",
      "en": "You don't study English in the morning.",
      "blank": "You ___ ___ English in the morning.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは朝英語を勉強しますか。",
      "en": "Do you study English in the morning?",
      "blank": "___ you ___ English in the morning?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝本を読みます。",
      "en": "You read books in the morning.",
      "blank": "You ___ books in the morning.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝本を読みません。",
      "en": "You don't read books in the morning.",
      "blank": "You ___ ___ books in the morning.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは朝本を読みますか。",
      "en": "Do you read books in the morning?",
      "blank": "___ you ___ books in the morning?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝テレビを見ます。",
      "en": "You watch TV in the morning.",
      "blank": "You ___ TV in the morning.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝テレビを見ません。",
      "en": "You don't watch TV in the morning.",
      "blank": "You ___ ___ TV in the morning.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは朝テレビを見ますか。",
      "en": "Do you watch TV in the morning?",
      "blank": "___ you ___ TV in the morning?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝音楽を聴きます。",
      "en": "You listen to music in the morning.",
      "blank": "You ___ music in the morning.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝音楽を聴きません。",
      "en": "You don't listen to music in the morning.",
      "blank": "You ___ ___ music in the morning.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは朝音楽を聴きますか。",
      "en": "Do you listen to music in the morning?",
      "blank": "___ you ___ music in the morning?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝ピアノを弾きます。",
      "en": "You play the piano in the morning.",
      "blank": "You ___ the piano in the morning.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "I / You が主語の一般動詞の肯定文では、動詞は原形を使います。"
    },
    {
      "jp": "あなたは朝ピアノを弾きません。",
      "en": "You don't play the piano in the morning.",
      "blank": "You ___ ___ the piano in the morning.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "一般動詞の否定文は don't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは朝ピアノを弾きますか。",
      "en": "Do you play the piano in the morning?",
      "blank": "___ you ___ the piano in the morning?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Does"
      ],
      "explanation": "I / you の一般動詞の疑問文は Do を文頭に置き、動詞は原形を使います。"
    },
    {
      "jp": "あなたは放課後どこで英語を勉強しますか。",
      "en": "Where do you study English after school?",
      "blank": "Where ___ you ___ English after school?",
      "answer": "do study",
      "choices": [
        "do",
        "study",
        "does",
        "studies"
      ],
      "explanation": "疑問詞を使う問いでは、疑問詞の後ろに do + 主語 + 動詞の原形を続けます。"
    },
    {
      "jp": "あなたは朝、何を聴きますか。",
      "en": "What do you listen to in the morning?",
      "blank": "What ___ you ___ ___ in the morning?",
      "answer": "do listen to",
      "choices": [
        "do",
        "listen",
        "to",
        "does"
      ],
      "explanation": "what の後ろも一般動詞の疑問文の形にします。"
    }
  ],
  "be動詞の文②": [
    {
      "jp": "彼は学生です。",
      "en": "He is a student.",
      "blank": "He ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼は学生ではありません。",
      "en": "He is not a student.",
      "blank": "He is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼は学生ですか。",
      "en": "Is he a student?",
      "blank": "___ he a student?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼は親切です。",
      "en": "He is kind.",
      "blank": "He ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼は親切ではありません。",
      "en": "He is not kind.",
      "blank": "He is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼は親切ですか。",
      "en": "Is he kind?",
      "blank": "___ he kind?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼は忙しいです。",
      "en": "He is busy.",
      "blank": "He ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼は忙しいではありません。",
      "en": "He is not busy.",
      "blank": "He is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼は忙しいですか。",
      "en": "Is he busy?",
      "blank": "___ he busy?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼は元気です。",
      "en": "He is fine.",
      "blank": "He ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼は元気ではありません。",
      "en": "He is not fine.",
      "blank": "He is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼は元気ですか。",
      "en": "Is he fine?",
      "blank": "___ he fine?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼は私の友達です。",
      "en": "He is my friend.",
      "blank": "He ___ my friend.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼は私の友達ではありません。",
      "en": "He is not my friend.",
      "blank": "He is ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼は私の友達ですか。",
      "en": "Is he my friend?",
      "blank": "___ he my friend?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼女は学生です。",
      "en": "She is a student.",
      "blank": "She ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼女は学生ではありません。",
      "en": "She is not a student.",
      "blank": "She is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼女は学生ですか。",
      "en": "Is she a student?",
      "blank": "___ she a student?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼女は親切です。",
      "en": "She is kind.",
      "blank": "She ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼女は親切ではありません。",
      "en": "She is not kind.",
      "blank": "She is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼女は親切ですか。",
      "en": "Is she kind?",
      "blank": "___ she kind?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼女は忙しいです。",
      "en": "She is busy.",
      "blank": "She ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼女は忙しいではありません。",
      "en": "She is not busy.",
      "blank": "She is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼女は忙しいですか。",
      "en": "Is she busy?",
      "blank": "___ she busy?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼女は元気です。",
      "en": "She is fine.",
      "blank": "She ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼女は元気ではありません。",
      "en": "She is not fine.",
      "blank": "She is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼女は元気ですか。",
      "en": "Is she fine?",
      "blank": "___ she fine?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "彼女は私の友達です。",
      "en": "She is my friend.",
      "blank": "She ___ my friend.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "彼女は私の友達ではありません。",
      "en": "She is not my friend.",
      "blank": "She is ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "彼女は私の友達ですか。",
      "en": "Is she my friend?",
      "blank": "___ she my friend?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "これは学生です。",
      "en": "This is a student.",
      "blank": "This ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "これは学生ではありません。",
      "en": "This is not a student.",
      "blank": "This is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "これは学生ですか。",
      "en": "Is this a student?",
      "blank": "___ this a student?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "これは親切です。",
      "en": "This is kind.",
      "blank": "This ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "これは親切ではありません。",
      "en": "This is not kind.",
      "blank": "This is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "これは親切ですか。",
      "en": "Is this kind?",
      "blank": "___ this kind?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "これは忙しいです。",
      "en": "This is busy.",
      "blank": "This ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "これは忙しいではありません。",
      "en": "This is not busy.",
      "blank": "This is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "これは忙しいですか。",
      "en": "Is this busy?",
      "blank": "___ this busy?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "これは元気です。",
      "en": "This is fine.",
      "blank": "This ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "これは元気ではありません。",
      "en": "This is not fine.",
      "blank": "This is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "これは元気ですか。",
      "en": "Is this fine?",
      "blank": "___ this fine?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "これは私の友達です。",
      "en": "This is my friend.",
      "blank": "This ___ my friend.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "これは私の友達ではありません。",
      "en": "This is not my friend.",
      "blank": "This is ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "これは私の友達ですか。",
      "en": "Is this my friend?",
      "blank": "___ this my friend?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "あれは学生です。",
      "en": "That is a student.",
      "blank": "That ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "あれは学生ではありません。",
      "en": "That is not a student.",
      "blank": "That is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あれは学生ですか。",
      "en": "Is that a student?",
      "blank": "___ that a student?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "あれは親切です。",
      "en": "That is kind.",
      "blank": "That ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "あれは親切ではありません。",
      "en": "That is not kind.",
      "blank": "That is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あれは親切ですか。",
      "en": "Is that kind?",
      "blank": "___ that kind?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "あれは忙しいです。",
      "en": "That is busy.",
      "blank": "That ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "あれは忙しいではありません。",
      "en": "That is not busy.",
      "blank": "That is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あれは忙しいですか。",
      "en": "Is that busy?",
      "blank": "___ that busy?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "あれは元気です。",
      "en": "That is fine.",
      "blank": "That ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "あれは元気ではありません。",
      "en": "That is not fine.",
      "blank": "That is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あれは元気ですか。",
      "en": "Is that fine?",
      "blank": "___ that fine?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    },
    {
      "jp": "あれは私の友達です。",
      "en": "That is my friend.",
      "blank": "That ___ my friend.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "he / she / this / that は is を使います。"
    },
    {
      "jp": "あれは私の友達ではありません。",
      "en": "That is not my friend.",
      "blank": "That is ___ my friend.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "does",
        "do"
      ],
      "explanation": "be動詞の否定文では、be動詞の後ろに not を置きます。"
    },
    {
      "jp": "あれは私の友達ですか。",
      "en": "Is that my friend?",
      "blank": "___ that my friend?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Am",
        "Do"
      ],
      "explanation": "be動詞の疑問文では、be動詞を文のはじめに出します。"
    }
  ],
  "一般動詞の文②": [
    {
      "jp": "彼は毎日英語を勉強します。",
      "en": "He studies English every day.",
      "blank": "He ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日英語を勉強しません。",
      "en": "He doesn't study English every day.",
      "blank": "He ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日英語を勉強しますか。",
      "en": "Does he study English every day?",
      "blank": "___ he ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日本を読みます。",
      "en": "He reads books every day.",
      "blank": "He ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日本を読みません。",
      "en": "He doesn't read books every day.",
      "blank": "He ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日本を読みますか。",
      "en": "Does he read books every day?",
      "blank": "___ he ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日テレビを見ます。",
      "en": "He watches TV every day.",
      "blank": "He ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日テレビを見ません。",
      "en": "He doesn't watch TV every day.",
      "blank": "He ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日テレビを見ますか。",
      "en": "Does he watch TV every day?",
      "blank": "___ he ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日音楽を聴きます。",
      "en": "He listens to music every day.",
      "blank": "He ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日音楽を聴きません。",
      "en": "He doesn't listen to music every day.",
      "blank": "He ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日音楽を聴きますか。",
      "en": "Does he listen to music every day?",
      "blank": "___ he ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日ピアノを弾きます。",
      "en": "He plays the piano every day.",
      "blank": "He ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日ピアノを弾きません。",
      "en": "He doesn't play the piano every day.",
      "blank": "He ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日ピアノを弾きますか。",
      "en": "Does he play the piano every day?",
      "blank": "___ he ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日母を手伝います。",
      "en": "He helps my mother every day.",
      "blank": "He ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は毎日母を手伝いません。",
      "en": "He doesn't help my mother every day.",
      "blank": "He ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は毎日母を手伝いますか。",
      "en": "Does he help my mother every day?",
      "blank": "___ he ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後英語を勉強します。",
      "en": "He studies English after school.",
      "blank": "He ___ English after school.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後英語を勉強しません。",
      "en": "He doesn't study English after school.",
      "blank": "He ___ ___ English after school.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後英語を勉強しますか。",
      "en": "Does he study English after school?",
      "blank": "___ he ___ English after school?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後本を読みます。",
      "en": "He reads books after school.",
      "blank": "He ___ books after school.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後本を読みません。",
      "en": "He doesn't read books after school.",
      "blank": "He ___ ___ books after school.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後本を読みますか。",
      "en": "Does he read books after school?",
      "blank": "___ he ___ books after school?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後テレビを見ます。",
      "en": "He watches TV after school.",
      "blank": "He ___ TV after school.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後テレビを見ません。",
      "en": "He doesn't watch TV after school.",
      "blank": "He ___ ___ TV after school.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後テレビを見ますか。",
      "en": "Does he watch TV after school?",
      "blank": "___ he ___ TV after school?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後音楽を聴きます。",
      "en": "He listens to music after school.",
      "blank": "He ___ music after school.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後音楽を聴きません。",
      "en": "He doesn't listen to music after school.",
      "blank": "He ___ ___ music after school.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後音楽を聴きますか。",
      "en": "Does he listen to music after school?",
      "blank": "___ he ___ music after school?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後ピアノを弾きます。",
      "en": "He plays the piano after school.",
      "blank": "He ___ the piano after school.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後ピアノを弾きません。",
      "en": "He doesn't play the piano after school.",
      "blank": "He ___ ___ the piano after school.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後ピアノを弾きますか。",
      "en": "Does he play the piano after school?",
      "blank": "___ he ___ the piano after school?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は放課後母を手伝います。",
      "en": "He helps my mother after school.",
      "blank": "He ___ my mother after school.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は放課後母を手伝いません。",
      "en": "He doesn't help my mother after school.",
      "blank": "He ___ ___ my mother after school.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は放課後母を手伝いますか。",
      "en": "Does he help my mother after school?",
      "blank": "___ he ___ my mother after school?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日に英語を勉強します。",
      "en": "He studies English on Sundays.",
      "blank": "He ___ English on Sundays.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日に英語を勉強しません。",
      "en": "He doesn't study English on Sundays.",
      "blank": "He ___ ___ English on Sundays.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日に英語を勉強しますか。",
      "en": "Does he study English on Sundays?",
      "blank": "___ he ___ English on Sundays?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日に本を読みます。",
      "en": "He reads books on Sundays.",
      "blank": "He ___ books on Sundays.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日に本を読みません。",
      "en": "He doesn't read books on Sundays.",
      "blank": "He ___ ___ books on Sundays.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日に本を読みますか。",
      "en": "Does he read books on Sundays?",
      "blank": "___ he ___ books on Sundays?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日にテレビを見ます。",
      "en": "He watches TV on Sundays.",
      "blank": "He ___ TV on Sundays.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日にテレビを見ません。",
      "en": "He doesn't watch TV on Sundays.",
      "blank": "He ___ ___ TV on Sundays.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日にテレビを見ますか。",
      "en": "Does he watch TV on Sundays?",
      "blank": "___ he ___ TV on Sundays?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日に音楽を聴きます。",
      "en": "He listens to music on Sundays.",
      "blank": "He ___ music on Sundays.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日に音楽を聴きません。",
      "en": "He doesn't listen to music on Sundays.",
      "blank": "He ___ ___ music on Sundays.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日に音楽を聴きますか。",
      "en": "Does he listen to music on Sundays?",
      "blank": "___ he ___ music on Sundays?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日にピアノを弾きます。",
      "en": "He plays the piano on Sundays.",
      "blank": "He ___ the piano on Sundays.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日にピアノを弾きません。",
      "en": "He doesn't play the piano on Sundays.",
      "blank": "He ___ ___ the piano on Sundays.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日にピアノを弾きますか。",
      "en": "Does he play the piano on Sundays?",
      "blank": "___ he ___ the piano on Sundays?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は日曜日に母を手伝います。",
      "en": "He helps my mother on Sundays.",
      "blank": "He ___ my mother on Sundays.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は日曜日に母を手伝いません。",
      "en": "He doesn't help my mother on Sundays.",
      "blank": "He ___ ___ my mother on Sundays.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は日曜日に母を手伝いますか。",
      "en": "Does he help my mother on Sundays?",
      "blank": "___ he ___ my mother on Sundays?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝英語を勉強します。",
      "en": "He studies English in the morning.",
      "blank": "He ___ English in the morning.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝英語を勉強しません。",
      "en": "He doesn't study English in the morning.",
      "blank": "He ___ ___ English in the morning.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝英語を勉強しますか。",
      "en": "Does he study English in the morning?",
      "blank": "___ he ___ English in the morning?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝本を読みます。",
      "en": "He reads books in the morning.",
      "blank": "He ___ books in the morning.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝本を読みません。",
      "en": "He doesn't read books in the morning.",
      "blank": "He ___ ___ books in the morning.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝本を読みますか。",
      "en": "Does he read books in the morning?",
      "blank": "___ he ___ books in the morning?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝テレビを見ます。",
      "en": "He watches TV in the morning.",
      "blank": "He ___ TV in the morning.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝テレビを見ません。",
      "en": "He doesn't watch TV in the morning.",
      "blank": "He ___ ___ TV in the morning.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝テレビを見ますか。",
      "en": "Does he watch TV in the morning?",
      "blank": "___ he ___ TV in the morning?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝音楽を聴きます。",
      "en": "He listens to music in the morning.",
      "blank": "He ___ music in the morning.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝音楽を聴きません。",
      "en": "He doesn't listen to music in the morning.",
      "blank": "He ___ ___ music in the morning.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝音楽を聴きますか。",
      "en": "Does he listen to music in the morning?",
      "blank": "___ he ___ music in the morning?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝ピアノを弾きます。",
      "en": "He plays the piano in the morning.",
      "blank": "He ___ the piano in the morning.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝ピアノを弾きません。",
      "en": "He doesn't play the piano in the morning.",
      "blank": "He ___ ___ the piano in the morning.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝ピアノを弾きますか。",
      "en": "Does he play the piano in the morning?",
      "blank": "___ he ___ the piano in the morning?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は朝母を手伝います。",
      "en": "He helps my mother in the morning.",
      "blank": "He ___ my mother in the morning.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼は朝母を手伝いません。",
      "en": "He doesn't help my mother in the morning.",
      "blank": "He ___ ___ my mother in the morning.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼は朝母を手伝いますか。",
      "en": "Does he help my mother in the morning?",
      "blank": "___ he ___ my mother in the morning?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日英語を勉強します。",
      "en": "She studies English every day.",
      "blank": "She ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日英語を勉強しません。",
      "en": "She doesn't study English every day.",
      "blank": "She ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日英語を勉強しますか。",
      "en": "Does she study English every day?",
      "blank": "___ she ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日本を読みます。",
      "en": "She reads books every day.",
      "blank": "She ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日本を読みません。",
      "en": "She doesn't read books every day.",
      "blank": "She ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日本を読みますか。",
      "en": "Does she read books every day?",
      "blank": "___ she ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日テレビを見ます。",
      "en": "She watches TV every day.",
      "blank": "She ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日テレビを見ません。",
      "en": "She doesn't watch TV every day.",
      "blank": "She ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日テレビを見ますか。",
      "en": "Does she watch TV every day?",
      "blank": "___ she ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日音楽を聴きます。",
      "en": "She listens to music every day.",
      "blank": "She ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日音楽を聴きません。",
      "en": "She doesn't listen to music every day.",
      "blank": "She ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日音楽を聴きますか。",
      "en": "Does she listen to music every day?",
      "blank": "___ she ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きます。",
      "en": "She plays the piano every day.",
      "blank": "She ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きません。",
      "en": "She doesn't play the piano every day.",
      "blank": "She ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きますか。",
      "en": "Does she play the piano every day?",
      "blank": "___ she ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日母を手伝います。",
      "en": "She helps my mother every day.",
      "blank": "She ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は毎日母を手伝いません。",
      "en": "She doesn't help my mother every day.",
      "blank": "She ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は毎日母を手伝いますか。",
      "en": "Does she help my mother every day?",
      "blank": "___ she ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後英語を勉強します。",
      "en": "She studies English after school.",
      "blank": "She ___ English after school.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後英語を勉強しません。",
      "en": "She doesn't study English after school.",
      "blank": "She ___ ___ English after school.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後英語を勉強しますか。",
      "en": "Does she study English after school?",
      "blank": "___ she ___ English after school?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後本を読みます。",
      "en": "She reads books after school.",
      "blank": "She ___ books after school.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後本を読みません。",
      "en": "She doesn't read books after school.",
      "blank": "She ___ ___ books after school.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後本を読みますか。",
      "en": "Does she read books after school?",
      "blank": "___ she ___ books after school?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後テレビを見ます。",
      "en": "She watches TV after school.",
      "blank": "She ___ TV after school.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後テレビを見ません。",
      "en": "She doesn't watch TV after school.",
      "blank": "She ___ ___ TV after school.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後テレビを見ますか。",
      "en": "Does she watch TV after school?",
      "blank": "___ she ___ TV after school?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後音楽を聴きます。",
      "en": "She listens to music after school.",
      "blank": "She ___ music after school.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後音楽を聴きません。",
      "en": "She doesn't listen to music after school.",
      "blank": "She ___ ___ music after school.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後音楽を聴きますか。",
      "en": "Does she listen to music after school?",
      "blank": "___ she ___ music after school?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後ピアノを弾きます。",
      "en": "She plays the piano after school.",
      "blank": "She ___ the piano after school.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後ピアノを弾きません。",
      "en": "She doesn't play the piano after school.",
      "blank": "She ___ ___ the piano after school.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後ピアノを弾きますか。",
      "en": "Does she play the piano after school?",
      "blank": "___ she ___ the piano after school?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は放課後母を手伝います。",
      "en": "She helps my mother after school.",
      "blank": "She ___ my mother after school.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は放課後母を手伝いません。",
      "en": "She doesn't help my mother after school.",
      "blank": "She ___ ___ my mother after school.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は放課後母を手伝いますか。",
      "en": "Does she help my mother after school?",
      "blank": "___ she ___ my mother after school?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日に英語を勉強します。",
      "en": "She studies English on Sundays.",
      "blank": "She ___ English on Sundays.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日に英語を勉強しません。",
      "en": "She doesn't study English on Sundays.",
      "blank": "She ___ ___ English on Sundays.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日に英語を勉強しますか。",
      "en": "Does she study English on Sundays?",
      "blank": "___ she ___ English on Sundays?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日に本を読みます。",
      "en": "She reads books on Sundays.",
      "blank": "She ___ books on Sundays.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日に本を読みません。",
      "en": "She doesn't read books on Sundays.",
      "blank": "She ___ ___ books on Sundays.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日に本を読みますか。",
      "en": "Does she read books on Sundays?",
      "blank": "___ she ___ books on Sundays?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日にテレビを見ます。",
      "en": "She watches TV on Sundays.",
      "blank": "She ___ TV on Sundays.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日にテレビを見ません。",
      "en": "She doesn't watch TV on Sundays.",
      "blank": "She ___ ___ TV on Sundays.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日にテレビを見ますか。",
      "en": "Does she watch TV on Sundays?",
      "blank": "___ she ___ TV on Sundays?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日に音楽を聴きます。",
      "en": "She listens to music on Sundays.",
      "blank": "She ___ music on Sundays.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日に音楽を聴きません。",
      "en": "She doesn't listen to music on Sundays.",
      "blank": "She ___ ___ music on Sundays.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日に音楽を聴きますか。",
      "en": "Does she listen to music on Sundays?",
      "blank": "___ she ___ music on Sundays?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日にピアノを弾きます。",
      "en": "She plays the piano on Sundays.",
      "blank": "She ___ the piano on Sundays.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日にピアノを弾きません。",
      "en": "She doesn't play the piano on Sundays.",
      "blank": "She ___ ___ the piano on Sundays.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日にピアノを弾きますか。",
      "en": "Does she play the piano on Sundays?",
      "blank": "___ she ___ the piano on Sundays?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は日曜日に母を手伝います。",
      "en": "She helps my mother on Sundays.",
      "blank": "She ___ my mother on Sundays.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は日曜日に母を手伝いません。",
      "en": "She doesn't help my mother on Sundays.",
      "blank": "She ___ ___ my mother on Sundays.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は日曜日に母を手伝いますか。",
      "en": "Does she help my mother on Sundays?",
      "blank": "___ she ___ my mother on Sundays?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝英語を勉強します。",
      "en": "She studies English in the morning.",
      "blank": "She ___ English in the morning.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝英語を勉強しません。",
      "en": "She doesn't study English in the morning.",
      "blank": "She ___ ___ English in the morning.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝英語を勉強しますか。",
      "en": "Does she study English in the morning?",
      "blank": "___ she ___ English in the morning?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝本を読みます。",
      "en": "She reads books in the morning.",
      "blank": "She ___ books in the morning.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝本を読みません。",
      "en": "She doesn't read books in the morning.",
      "blank": "She ___ ___ books in the morning.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝本を読みますか。",
      "en": "Does she read books in the morning?",
      "blank": "___ she ___ books in the morning?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝テレビを見ます。",
      "en": "She watches TV in the morning.",
      "blank": "She ___ TV in the morning.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝テレビを見ません。",
      "en": "She doesn't watch TV in the morning.",
      "blank": "She ___ ___ TV in the morning.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝テレビを見ますか。",
      "en": "Does she watch TV in the morning?",
      "blank": "___ she ___ TV in the morning?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝音楽を聴きます。",
      "en": "She listens to music in the morning.",
      "blank": "She ___ music in the morning.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝音楽を聴きません。",
      "en": "She doesn't listen to music in the morning.",
      "blank": "She ___ ___ music in the morning.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝音楽を聴きますか。",
      "en": "Does she listen to music in the morning?",
      "blank": "___ she ___ music in the morning?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝ピアノを弾きます。",
      "en": "She plays the piano in the morning.",
      "blank": "She ___ the piano in the morning.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝ピアノを弾きません。",
      "en": "She doesn't play the piano in the morning.",
      "blank": "She ___ ___ the piano in the morning.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝ピアノを弾きますか。",
      "en": "Does she play the piano in the morning?",
      "blank": "___ she ___ the piano in the morning?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は朝母を手伝います。",
      "en": "She helps my mother in the morning.",
      "blank": "She ___ my mother in the morning.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "彼女は朝母を手伝いません。",
      "en": "She doesn't help my mother in the morning.",
      "blank": "She ___ ___ my mother in the morning.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "彼女は朝母を手伝いますか。",
      "en": "Does she help my mother in the morning?",
      "blank": "___ she ___ my mother in the morning?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日英語を勉強します。",
      "en": "My brother studies English every day.",
      "blank": "My brother ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日英語を勉強しません。",
      "en": "My brother doesn't study English every day.",
      "blank": "My brother ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日英語を勉強しますか。",
      "en": "Does my brother study English every day?",
      "blank": "___ my brother ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日本を読みます。",
      "en": "My brother reads books every day.",
      "blank": "My brother ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日本を読みません。",
      "en": "My brother doesn't read books every day.",
      "blank": "My brother ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日本を読みますか。",
      "en": "Does my brother read books every day?",
      "blank": "___ my brother ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日テレビを見ます。",
      "en": "My brother watches TV every day.",
      "blank": "My brother ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日テレビを見ません。",
      "en": "My brother doesn't watch TV every day.",
      "blank": "My brother ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日テレビを見ますか。",
      "en": "Does my brother watch TV every day?",
      "blank": "___ my brother ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きます。",
      "en": "My brother listens to music every day.",
      "blank": "My brother ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きません。",
      "en": "My brother doesn't listen to music every day.",
      "blank": "My brother ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きますか。",
      "en": "Does my brother listen to music every day?",
      "blank": "___ my brother ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きます。",
      "en": "My brother plays the piano every day.",
      "blank": "My brother ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きません。",
      "en": "My brother doesn't play the piano every day.",
      "blank": "My brother ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きますか。",
      "en": "Does my brother play the piano every day?",
      "blank": "___ my brother ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日母を手伝います。",
      "en": "My brother helps my mother every day.",
      "blank": "My brother ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は毎日母を手伝いません。",
      "en": "My brother doesn't help my mother every day.",
      "blank": "My brother ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は毎日母を手伝いますか。",
      "en": "Does my brother help my mother every day?",
      "blank": "___ my brother ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後英語を勉強します。",
      "en": "My brother studies English after school.",
      "blank": "My brother ___ English after school.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後英語を勉強しません。",
      "en": "My brother doesn't study English after school.",
      "blank": "My brother ___ ___ English after school.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後英語を勉強しますか。",
      "en": "Does my brother study English after school?",
      "blank": "___ my brother ___ English after school?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後本を読みます。",
      "en": "My brother reads books after school.",
      "blank": "My brother ___ books after school.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後本を読みません。",
      "en": "My brother doesn't read books after school.",
      "blank": "My brother ___ ___ books after school.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後本を読みますか。",
      "en": "Does my brother read books after school?",
      "blank": "___ my brother ___ books after school?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後テレビを見ます。",
      "en": "My brother watches TV after school.",
      "blank": "My brother ___ TV after school.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後テレビを見ません。",
      "en": "My brother doesn't watch TV after school.",
      "blank": "My brother ___ ___ TV after school.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後テレビを見ますか。",
      "en": "Does my brother watch TV after school?",
      "blank": "___ my brother ___ TV after school?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後音楽を聴きます。",
      "en": "My brother listens to music after school.",
      "blank": "My brother ___ music after school.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後音楽を聴きません。",
      "en": "My brother doesn't listen to music after school.",
      "blank": "My brother ___ ___ music after school.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後音楽を聴きますか。",
      "en": "Does my brother listen to music after school?",
      "blank": "___ my brother ___ music after school?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後ピアノを弾きます。",
      "en": "My brother plays the piano after school.",
      "blank": "My brother ___ the piano after school.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後ピアノを弾きません。",
      "en": "My brother doesn't play the piano after school.",
      "blank": "My brother ___ ___ the piano after school.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後ピアノを弾きますか。",
      "en": "Does my brother play the piano after school?",
      "blank": "___ my brother ___ the piano after school?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は放課後母を手伝います。",
      "en": "My brother helps my mother after school.",
      "blank": "My brother ___ my mother after school.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は放課後母を手伝いません。",
      "en": "My brother doesn't help my mother after school.",
      "blank": "My brother ___ ___ my mother after school.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は放課後母を手伝いますか。",
      "en": "Does my brother help my mother after school?",
      "blank": "___ my brother ___ my mother after school?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日に英語を勉強します。",
      "en": "My brother studies English on Sundays.",
      "blank": "My brother ___ English on Sundays.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日に英語を勉強しません。",
      "en": "My brother doesn't study English on Sundays.",
      "blank": "My brother ___ ___ English on Sundays.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日に英語を勉強しますか。",
      "en": "Does my brother study English on Sundays?",
      "blank": "___ my brother ___ English on Sundays?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日に本を読みます。",
      "en": "My brother reads books on Sundays.",
      "blank": "My brother ___ books on Sundays.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日に本を読みません。",
      "en": "My brother doesn't read books on Sundays.",
      "blank": "My brother ___ ___ books on Sundays.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日に本を読みますか。",
      "en": "Does my brother read books on Sundays?",
      "blank": "___ my brother ___ books on Sundays?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日にテレビを見ます。",
      "en": "My brother watches TV on Sundays.",
      "blank": "My brother ___ TV on Sundays.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日にテレビを見ません。",
      "en": "My brother doesn't watch TV on Sundays.",
      "blank": "My brother ___ ___ TV on Sundays.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日にテレビを見ますか。",
      "en": "Does my brother watch TV on Sundays?",
      "blank": "___ my brother ___ TV on Sundays?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日に音楽を聴きます。",
      "en": "My brother listens to music on Sundays.",
      "blank": "My brother ___ music on Sundays.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日に音楽を聴きません。",
      "en": "My brother doesn't listen to music on Sundays.",
      "blank": "My brother ___ ___ music on Sundays.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日に音楽を聴きますか。",
      "en": "Does my brother listen to music on Sundays?",
      "blank": "___ my brother ___ music on Sundays?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日にピアノを弾きます。",
      "en": "My brother plays the piano on Sundays.",
      "blank": "My brother ___ the piano on Sundays.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日にピアノを弾きません。",
      "en": "My brother doesn't play the piano on Sundays.",
      "blank": "My brother ___ ___ the piano on Sundays.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日にピアノを弾きますか。",
      "en": "Does my brother play the piano on Sundays?",
      "blank": "___ my brother ___ the piano on Sundays?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は日曜日に母を手伝います。",
      "en": "My brother helps my mother on Sundays.",
      "blank": "My brother ___ my mother on Sundays.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は日曜日に母を手伝いません。",
      "en": "My brother doesn't help my mother on Sundays.",
      "blank": "My brother ___ ___ my mother on Sundays.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は日曜日に母を手伝いますか。",
      "en": "Does my brother help my mother on Sundays?",
      "blank": "___ my brother ___ my mother on Sundays?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝英語を勉強します。",
      "en": "My brother studies English in the morning.",
      "blank": "My brother ___ English in the morning.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝英語を勉強しません。",
      "en": "My brother doesn't study English in the morning.",
      "blank": "My brother ___ ___ English in the morning.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝英語を勉強しますか。",
      "en": "Does my brother study English in the morning?",
      "blank": "___ my brother ___ English in the morning?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝本を読みます。",
      "en": "My brother reads books in the morning.",
      "blank": "My brother ___ books in the morning.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝本を読みません。",
      "en": "My brother doesn't read books in the morning.",
      "blank": "My brother ___ ___ books in the morning.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝本を読みますか。",
      "en": "Does my brother read books in the morning?",
      "blank": "___ my brother ___ books in the morning?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝テレビを見ます。",
      "en": "My brother watches TV in the morning.",
      "blank": "My brother ___ TV in the morning.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝テレビを見ません。",
      "en": "My brother doesn't watch TV in the morning.",
      "blank": "My brother ___ ___ TV in the morning.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝テレビを見ますか。",
      "en": "Does my brother watch TV in the morning?",
      "blank": "___ my brother ___ TV in the morning?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝音楽を聴きます。",
      "en": "My brother listens to music in the morning.",
      "blank": "My brother ___ music in the morning.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝音楽を聴きません。",
      "en": "My brother doesn't listen to music in the morning.",
      "blank": "My brother ___ ___ music in the morning.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝音楽を聴きますか。",
      "en": "Does my brother listen to music in the morning?",
      "blank": "___ my brother ___ music in the morning?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝ピアノを弾きます。",
      "en": "My brother plays the piano in the morning.",
      "blank": "My brother ___ the piano in the morning.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝ピアノを弾きません。",
      "en": "My brother doesn't play the piano in the morning.",
      "blank": "My brother ___ ___ the piano in the morning.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝ピアノを弾きますか。",
      "en": "Does my brother play the piano in the morning?",
      "blank": "___ my brother ___ the piano in the morning?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は朝母を手伝います。",
      "en": "My brother helps my mother in the morning.",
      "blank": "My brother ___ my mother in the morning.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の兄は朝母を手伝いません。",
      "en": "My brother doesn't help my mother in the morning.",
      "blank": "My brother ___ ___ my mother in the morning.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の兄は朝母を手伝いますか。",
      "en": "Does my brother help my mother in the morning?",
      "blank": "___ my brother ___ my mother in the morning?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日英語を勉強します。",
      "en": "My friend studies English every day.",
      "blank": "My friend ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日英語を勉強しません。",
      "en": "My friend doesn't study English every day.",
      "blank": "My friend ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日英語を勉強しますか。",
      "en": "Does my friend study English every day?",
      "blank": "___ my friend ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日本を読みます。",
      "en": "My friend reads books every day.",
      "blank": "My friend ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日本を読みません。",
      "en": "My friend doesn't read books every day.",
      "blank": "My friend ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日本を読みますか。",
      "en": "Does my friend read books every day?",
      "blank": "___ my friend ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日テレビを見ます。",
      "en": "My friend watches TV every day.",
      "blank": "My friend ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日テレビを見ません。",
      "en": "My friend doesn't watch TV every day.",
      "blank": "My friend ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日テレビを見ますか。",
      "en": "Does my friend watch TV every day?",
      "blank": "___ my friend ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日音楽を聴きます。",
      "en": "My friend listens to music every day.",
      "blank": "My friend ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日音楽を聴きません。",
      "en": "My friend doesn't listen to music every day.",
      "blank": "My friend ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日音楽を聴きますか。",
      "en": "Does my friend listen to music every day?",
      "blank": "___ my friend ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日ピアノを弾きます。",
      "en": "My friend plays the piano every day.",
      "blank": "My friend ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日ピアノを弾きません。",
      "en": "My friend doesn't play the piano every day.",
      "blank": "My friend ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日ピアノを弾きますか。",
      "en": "Does my friend play the piano every day?",
      "blank": "___ my friend ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は毎日母を手伝います。",
      "en": "My friend helps my mother every day.",
      "blank": "My friend ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は毎日母を手伝いません。",
      "en": "My friend doesn't help my mother every day.",
      "blank": "My friend ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は毎日母を手伝いますか。",
      "en": "Does my friend help my mother every day?",
      "blank": "___ my friend ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後英語を勉強します。",
      "en": "My friend studies English after school.",
      "blank": "My friend ___ English after school.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後英語を勉強しません。",
      "en": "My friend doesn't study English after school.",
      "blank": "My friend ___ ___ English after school.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後英語を勉強しますか。",
      "en": "Does my friend study English after school?",
      "blank": "___ my friend ___ English after school?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後本を読みます。",
      "en": "My friend reads books after school.",
      "blank": "My friend ___ books after school.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後本を読みません。",
      "en": "My friend doesn't read books after school.",
      "blank": "My friend ___ ___ books after school.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後本を読みますか。",
      "en": "Does my friend read books after school?",
      "blank": "___ my friend ___ books after school?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後テレビを見ます。",
      "en": "My friend watches TV after school.",
      "blank": "My friend ___ TV after school.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後テレビを見ません。",
      "en": "My friend doesn't watch TV after school.",
      "blank": "My friend ___ ___ TV after school.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後テレビを見ますか。",
      "en": "Does my friend watch TV after school?",
      "blank": "___ my friend ___ TV after school?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後音楽を聴きます。",
      "en": "My friend listens to music after school.",
      "blank": "My friend ___ music after school.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後音楽を聴きません。",
      "en": "My friend doesn't listen to music after school.",
      "blank": "My friend ___ ___ music after school.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後音楽を聴きますか。",
      "en": "Does my friend listen to music after school?",
      "blank": "___ my friend ___ music after school?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後ピアノを弾きます。",
      "en": "My friend plays the piano after school.",
      "blank": "My friend ___ the piano after school.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後ピアノを弾きません。",
      "en": "My friend doesn't play the piano after school.",
      "blank": "My friend ___ ___ the piano after school.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後ピアノを弾きますか。",
      "en": "Does my friend play the piano after school?",
      "blank": "___ my friend ___ the piano after school?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は放課後母を手伝います。",
      "en": "My friend helps my mother after school.",
      "blank": "My friend ___ my mother after school.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は放課後母を手伝いません。",
      "en": "My friend doesn't help my mother after school.",
      "blank": "My friend ___ ___ my mother after school.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は放課後母を手伝いますか。",
      "en": "Does my friend help my mother after school?",
      "blank": "___ my friend ___ my mother after school?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日に英語を勉強します。",
      "en": "My friend studies English on Sundays.",
      "blank": "My friend ___ English on Sundays.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日に英語を勉強しません。",
      "en": "My friend doesn't study English on Sundays.",
      "blank": "My friend ___ ___ English on Sundays.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日に英語を勉強しますか。",
      "en": "Does my friend study English on Sundays?",
      "blank": "___ my friend ___ English on Sundays?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日に本を読みます。",
      "en": "My friend reads books on Sundays.",
      "blank": "My friend ___ books on Sundays.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日に本を読みません。",
      "en": "My friend doesn't read books on Sundays.",
      "blank": "My friend ___ ___ books on Sundays.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日に本を読みますか。",
      "en": "Does my friend read books on Sundays?",
      "blank": "___ my friend ___ books on Sundays?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日にテレビを見ます。",
      "en": "My friend watches TV on Sundays.",
      "blank": "My friend ___ TV on Sundays.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日にテレビを見ません。",
      "en": "My friend doesn't watch TV on Sundays.",
      "blank": "My friend ___ ___ TV on Sundays.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日にテレビを見ますか。",
      "en": "Does my friend watch TV on Sundays?",
      "blank": "___ my friend ___ TV on Sundays?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日に音楽を聴きます。",
      "en": "My friend listens to music on Sundays.",
      "blank": "My friend ___ music on Sundays.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日に音楽を聴きません。",
      "en": "My friend doesn't listen to music on Sundays.",
      "blank": "My friend ___ ___ music on Sundays.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日に音楽を聴きますか。",
      "en": "Does my friend listen to music on Sundays?",
      "blank": "___ my friend ___ music on Sundays?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日にピアノを弾きます。",
      "en": "My friend plays the piano on Sundays.",
      "blank": "My friend ___ the piano on Sundays.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日にピアノを弾きません。",
      "en": "My friend doesn't play the piano on Sundays.",
      "blank": "My friend ___ ___ the piano on Sundays.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日にピアノを弾きますか。",
      "en": "Does my friend play the piano on Sundays?",
      "blank": "___ my friend ___ the piano on Sundays?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は日曜日に母を手伝います。",
      "en": "My friend helps my mother on Sundays.",
      "blank": "My friend ___ my mother on Sundays.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は日曜日に母を手伝いません。",
      "en": "My friend doesn't help my mother on Sundays.",
      "blank": "My friend ___ ___ my mother on Sundays.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は日曜日に母を手伝いますか。",
      "en": "Does my friend help my mother on Sundays?",
      "blank": "___ my friend ___ my mother on Sundays?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝英語を勉強します。",
      "en": "My friend studies English in the morning.",
      "blank": "My friend ___ English in the morning.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝英語を勉強しません。",
      "en": "My friend doesn't study English in the morning.",
      "blank": "My friend ___ ___ English in the morning.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝英語を勉強しますか。",
      "en": "Does my friend study English in the morning?",
      "blank": "___ my friend ___ English in the morning?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝本を読みます。",
      "en": "My friend reads books in the morning.",
      "blank": "My friend ___ books in the morning.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝本を読みません。",
      "en": "My friend doesn't read books in the morning.",
      "blank": "My friend ___ ___ books in the morning.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝本を読みますか。",
      "en": "Does my friend read books in the morning?",
      "blank": "___ my friend ___ books in the morning?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝テレビを見ます。",
      "en": "My friend watches TV in the morning.",
      "blank": "My friend ___ TV in the morning.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝テレビを見ません。",
      "en": "My friend doesn't watch TV in the morning.",
      "blank": "My friend ___ ___ TV in the morning.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝テレビを見ますか。",
      "en": "Does my friend watch TV in the morning?",
      "blank": "___ my friend ___ TV in the morning?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝音楽を聴きます。",
      "en": "My friend listens to music in the morning.",
      "blank": "My friend ___ music in the morning.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝音楽を聴きません。",
      "en": "My friend doesn't listen to music in the morning.",
      "blank": "My friend ___ ___ music in the morning.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝音楽を聴きますか。",
      "en": "Does my friend listen to music in the morning?",
      "blank": "___ my friend ___ music in the morning?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝ピアノを弾きます。",
      "en": "My friend plays the piano in the morning.",
      "blank": "My friend ___ the piano in the morning.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝ピアノを弾きません。",
      "en": "My friend doesn't play the piano in the morning.",
      "blank": "My friend ___ ___ the piano in the morning.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝ピアノを弾きますか。",
      "en": "Does my friend play the piano in the morning?",
      "blank": "___ my friend ___ the piano in the morning?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の友達は朝母を手伝います。",
      "en": "My friend helps my mother in the morning.",
      "blank": "My friend ___ my mother in the morning.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "he / she / 1人を表す主語では、現在の一般動詞に s / es をつけます。"
    },
    {
      "jp": "私の友達は朝母を手伝いません。",
      "en": "My friend doesn't help my mother in the morning.",
      "blank": "My friend ___ ___ my mother in the morning.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "doesn't を使った後ろの動詞は原形に戻します。"
    },
    {
      "jp": "私の友達は朝母を手伝いますか。",
      "en": "Does my friend help my mother in the morning?",
      "blank": "___ my friend ___ my mother in the morning?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do"
      ],
      "explanation": "he / she / 1人を表す主語の疑問文は Does + 主語 + 動詞の原形で作ります。"
    }
  ],
  "be動詞のまとめ": [
    {
      "jp": "私は学生です。",
      "en": "I am a student.",
      "blank": "I ___ a student.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "私は学生ではありません。",
      "en": "I am not a student.",
      "blank": "I am ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "私は親切です。",
      "en": "I am kind.",
      "blank": "I ___ kind.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "私は親切ではありません。",
      "en": "I am not kind.",
      "blank": "I am ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "私は忙しいです。",
      "en": "I am busy.",
      "blank": "I ___ busy.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "私は忙しいではありません。",
      "en": "I am not busy.",
      "blank": "I am ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "私は元気です。",
      "en": "I am fine.",
      "blank": "I ___ fine.",
      "answer": "am",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "私は元気ではありません。",
      "en": "I am not fine.",
      "blank": "I am ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あなたは学生です。",
      "en": "You are a student.",
      "blank": "You ___ a student.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あなたは学生ではありません。",
      "en": "You are not a student.",
      "blank": "You are ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あなたは親切です。",
      "en": "You are kind.",
      "blank": "You ___ kind.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あなたは親切ではありません。",
      "en": "You are not kind.",
      "blank": "You are ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あなたは忙しいです。",
      "en": "You are busy.",
      "blank": "You ___ busy.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あなたは忙しいではありません。",
      "en": "You are not busy.",
      "blank": "You are ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あなたは元気です。",
      "en": "You are fine.",
      "blank": "You ___ fine.",
      "answer": "are",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あなたは元気ではありません。",
      "en": "You are not fine.",
      "blank": "You are ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼は学生です。",
      "en": "He is a student.",
      "blank": "He ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼は学生ではありません。",
      "en": "He is not a student.",
      "blank": "He is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼は親切です。",
      "en": "He is kind.",
      "blank": "He ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼は親切ではありません。",
      "en": "He is not kind.",
      "blank": "He is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼は忙しいです。",
      "en": "He is busy.",
      "blank": "He ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼は忙しいではありません。",
      "en": "He is not busy.",
      "blank": "He is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼は元気です。",
      "en": "He is fine.",
      "blank": "He ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼は元気ではありません。",
      "en": "He is not fine.",
      "blank": "He is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼女は学生です。",
      "en": "She is a student.",
      "blank": "She ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼女は学生ではありません。",
      "en": "She is not a student.",
      "blank": "She is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼女は親切です。",
      "en": "She is kind.",
      "blank": "She ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼女は親切ではありません。",
      "en": "She is not kind.",
      "blank": "She is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼女は忙しいです。",
      "en": "She is busy.",
      "blank": "She ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼女は忙しいではありません。",
      "en": "She is not busy.",
      "blank": "She is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "彼女は元気です。",
      "en": "She is fine.",
      "blank": "She ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "彼女は元気ではありません。",
      "en": "She is not fine.",
      "blank": "She is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "これは学生です。",
      "en": "This is a student.",
      "blank": "This ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "これは学生ではありません。",
      "en": "This is not a student.",
      "blank": "This is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "これは親切です。",
      "en": "This is kind.",
      "blank": "This ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "これは親切ではありません。",
      "en": "This is not kind.",
      "blank": "This is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "これは忙しいです。",
      "en": "This is busy.",
      "blank": "This ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "これは忙しいではありません。",
      "en": "This is not busy.",
      "blank": "This is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "これは元気です。",
      "en": "This is fine.",
      "blank": "This ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "これは元気ではありません。",
      "en": "This is not fine.",
      "blank": "This is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あれは学生です。",
      "en": "That is a student.",
      "blank": "That ___ a student.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あれは学生ではありません。",
      "en": "That is not a student.",
      "blank": "That is ___ a student.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あれは親切です。",
      "en": "That is kind.",
      "blank": "That ___ kind.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あれは親切ではありません。",
      "en": "That is not kind.",
      "blank": "That is ___ kind.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あれは忙しいです。",
      "en": "That is busy.",
      "blank": "That ___ busy.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あれは忙しいではありません。",
      "en": "That is not busy.",
      "blank": "That is ___ busy.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    },
    {
      "jp": "あれは元気です。",
      "en": "That is fine.",
      "blank": "That ___ fine.",
      "answer": "is",
      "choices": [
        "am",
        "are",
        "is",
        "be"
      ],
      "explanation": "主語を見て、am / are / is を選びます。"
    },
    {
      "jp": "あれは元気ではありません。",
      "en": "That is not fine.",
      "blank": "That is ___ fine.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "be動詞の否定文は be動詞 + not です。"
    }
  ],
  "一般動詞の文のまとめ": [
    {
      "jp": "私は毎日英語を勉強します。",
      "en": "I study English every day.",
      "blank": "I ___ English every day.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日英語を勉強しません。",
      "en": "I don't study English every day.",
      "blank": "I ___ ___ English every day.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日英語を勉強しますか。",
      "en": "Do i study English every day?",
      "blank": "___ i ___ English every day?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日本を読みます。",
      "en": "I read books every day.",
      "blank": "I ___ books every day.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日本を読みません。",
      "en": "I don't read books every day.",
      "blank": "I ___ ___ books every day.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日本を読みますか。",
      "en": "Do i read books every day?",
      "blank": "___ i ___ books every day?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日テレビを見ます。",
      "en": "I watch TV every day.",
      "blank": "I ___ TV every day.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日テレビを見ません。",
      "en": "I don't watch TV every day.",
      "blank": "I ___ ___ TV every day.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日テレビを見ますか。",
      "en": "Do i watch TV every day?",
      "blank": "___ i ___ TV every day?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日音楽を聴きます。",
      "en": "I listen to music every day.",
      "blank": "I ___ music every day.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日音楽を聴きません。",
      "en": "I don't listen to music every day.",
      "blank": "I ___ ___ music every day.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日音楽を聴きますか。",
      "en": "Do i listen to music every day?",
      "blank": "___ i ___ music every day?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日ピアノを弾きます。",
      "en": "I play the piano every day.",
      "blank": "I ___ the piano every day.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日ピアノを弾きません。",
      "en": "I don't play the piano every day.",
      "blank": "I ___ ___ the piano every day.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日ピアノを弾きますか。",
      "en": "Do i play the piano every day?",
      "blank": "___ i ___ the piano every day?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日母を手伝います。",
      "en": "I help my mother every day.",
      "blank": "I ___ my mother every day.",
      "answer": "help",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私は毎日母を手伝いません。",
      "en": "I don't help my mother every day.",
      "blank": "I ___ ___ my mother every day.",
      "answer": "don't help",
      "choices": [
        "don't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私は毎日母を手伝いますか。",
      "en": "Do i help my mother every day?",
      "blank": "___ i ___ my mother every day?",
      "answer": "Do help",
      "choices": [
        "Do",
        "help",
        "helps",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日英語を勉強します。",
      "en": "You study English every day.",
      "blank": "You ___ English every day.",
      "answer": "study",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日英語を勉強しません。",
      "en": "You don't study English every day.",
      "blank": "You ___ ___ English every day.",
      "answer": "don't study",
      "choices": [
        "don't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日英語を勉強しますか。",
      "en": "Do you study English every day?",
      "blank": "___ you ___ English every day?",
      "answer": "Do study",
      "choices": [
        "Do",
        "study",
        "studies",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日本を読みます。",
      "en": "You read books every day.",
      "blank": "You ___ books every day.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日本を読みません。",
      "en": "You don't read books every day.",
      "blank": "You ___ ___ books every day.",
      "answer": "don't read",
      "choices": [
        "don't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日本を読みますか。",
      "en": "Do you read books every day?",
      "blank": "___ you ___ books every day?",
      "answer": "Do read",
      "choices": [
        "Do",
        "read",
        "reads",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日テレビを見ます。",
      "en": "You watch TV every day.",
      "blank": "You ___ TV every day.",
      "answer": "watch",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日テレビを見ません。",
      "en": "You don't watch TV every day.",
      "blank": "You ___ ___ TV every day.",
      "answer": "don't watch",
      "choices": [
        "don't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日テレビを見ますか。",
      "en": "Do you watch TV every day?",
      "blank": "___ you ___ TV every day?",
      "answer": "Do watch",
      "choices": [
        "Do",
        "watch",
        "watches",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日音楽を聴きます。",
      "en": "You listen to music every day.",
      "blank": "You ___ music every day.",
      "answer": "listen to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日音楽を聴きません。",
      "en": "You don't listen to music every day.",
      "blank": "You ___ ___ music every day.",
      "answer": "don't listen to",
      "choices": [
        "don't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日音楽を聴きますか。",
      "en": "Do you listen to music every day?",
      "blank": "___ you ___ music every day?",
      "answer": "Do listen to",
      "choices": [
        "Do",
        "listen to",
        "listens to",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きます。",
      "en": "You play the piano every day.",
      "blank": "You ___ the piano every day.",
      "answer": "play",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きません。",
      "en": "You don't play the piano every day.",
      "blank": "You ___ ___ the piano every day.",
      "answer": "don't play",
      "choices": [
        "don't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日ピアノを弾きますか。",
      "en": "Do you play the piano every day?",
      "blank": "___ you ___ the piano every day?",
      "answer": "Do play",
      "choices": [
        "Do",
        "play",
        "plays",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日母を手伝います。",
      "en": "You help my mother every day.",
      "blank": "You ___ my mother every day.",
      "answer": "help",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "あなたは毎日母を手伝いません。",
      "en": "You don't help my mother every day.",
      "blank": "You ___ ___ my mother every day.",
      "answer": "don't help",
      "choices": [
        "don't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "あなたは毎日母を手伝いますか。",
      "en": "Do you help my mother every day?",
      "blank": "___ you ___ my mother every day?",
      "answer": "Do help",
      "choices": [
        "Do",
        "help",
        "helps",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日英語を勉強します。",
      "en": "He studies English every day.",
      "blank": "He ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日英語を勉強しません。",
      "en": "He doesn't study English every day.",
      "blank": "He ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日英語を勉強しますか。",
      "en": "Does he study English every day?",
      "blank": "___ he ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日本を読みます。",
      "en": "He reads books every day.",
      "blank": "He ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日本を読みません。",
      "en": "He doesn't read books every day.",
      "blank": "He ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日本を読みますか。",
      "en": "Does he read books every day?",
      "blank": "___ he ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日テレビを見ます。",
      "en": "He watches TV every day.",
      "blank": "He ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日テレビを見ません。",
      "en": "He doesn't watch TV every day.",
      "blank": "He ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日テレビを見ますか。",
      "en": "Does he watch TV every day?",
      "blank": "___ he ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日音楽を聴きます。",
      "en": "He listens to music every day.",
      "blank": "He ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日音楽を聴きません。",
      "en": "He doesn't listen to music every day.",
      "blank": "He ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日音楽を聴きますか。",
      "en": "Does he listen to music every day?",
      "blank": "___ he ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日ピアノを弾きます。",
      "en": "He plays the piano every day.",
      "blank": "He ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日ピアノを弾きません。",
      "en": "He doesn't play the piano every day.",
      "blank": "He ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日ピアノを弾きますか。",
      "en": "Does he play the piano every day?",
      "blank": "___ he ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日母を手伝います。",
      "en": "He helps my mother every day.",
      "blank": "He ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼は毎日母を手伝いません。",
      "en": "He doesn't help my mother every day.",
      "blank": "He ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼は毎日母を手伝いますか。",
      "en": "Does he help my mother every day?",
      "blank": "___ he ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日英語を勉強します。",
      "en": "She studies English every day.",
      "blank": "She ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日英語を勉強しません。",
      "en": "She doesn't study English every day.",
      "blank": "She ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日英語を勉強しますか。",
      "en": "Does she study English every day?",
      "blank": "___ she ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日本を読みます。",
      "en": "She reads books every day.",
      "blank": "She ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日本を読みません。",
      "en": "She doesn't read books every day.",
      "blank": "She ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日本を読みますか。",
      "en": "Does she read books every day?",
      "blank": "___ she ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日テレビを見ます。",
      "en": "She watches TV every day.",
      "blank": "She ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日テレビを見ません。",
      "en": "She doesn't watch TV every day.",
      "blank": "She ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日テレビを見ますか。",
      "en": "Does she watch TV every day?",
      "blank": "___ she ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日音楽を聴きます。",
      "en": "She listens to music every day.",
      "blank": "She ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日音楽を聴きません。",
      "en": "She doesn't listen to music every day.",
      "blank": "She ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日音楽を聴きますか。",
      "en": "Does she listen to music every day?",
      "blank": "___ she ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きます。",
      "en": "She plays the piano every day.",
      "blank": "She ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きません。",
      "en": "She doesn't play the piano every day.",
      "blank": "She ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日ピアノを弾きますか。",
      "en": "Does she play the piano every day?",
      "blank": "___ she ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日母を手伝います。",
      "en": "She helps my mother every day.",
      "blank": "She ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "彼女は毎日母を手伝いません。",
      "en": "She doesn't help my mother every day.",
      "blank": "She ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "彼女は毎日母を手伝いますか。",
      "en": "Does she help my mother every day?",
      "blank": "___ she ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日英語を勉強します。",
      "en": "My brother studies English every day.",
      "blank": "My brother ___ English every day.",
      "answer": "studies",
      "choices": [
        "study",
        "studies",
        "studying",
        "studied"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日英語を勉強しません。",
      "en": "My brother doesn't study English every day.",
      "blank": "My brother ___ ___ English every day.",
      "answer": "doesn't study",
      "choices": [
        "doesn't",
        "study",
        "studies",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日英語を勉強しますか。",
      "en": "Does my brother study English every day?",
      "blank": "___ my brother ___ English every day?",
      "answer": "Does study",
      "choices": [
        "Does",
        "study",
        "studies",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日本を読みます。",
      "en": "My brother reads books every day.",
      "blank": "My brother ___ books every day.",
      "answer": "reads",
      "choices": [
        "read",
        "reads",
        "reading",
        "read"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日本を読みません。",
      "en": "My brother doesn't read books every day.",
      "blank": "My brother ___ ___ books every day.",
      "answer": "doesn't read",
      "choices": [
        "doesn't",
        "read",
        "reads",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日本を読みますか。",
      "en": "Does my brother read books every day?",
      "blank": "___ my brother ___ books every day?",
      "answer": "Does read",
      "choices": [
        "Does",
        "read",
        "reads",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日テレビを見ます。",
      "en": "My brother watches TV every day.",
      "blank": "My brother ___ TV every day.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watching",
        "watched"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日テレビを見ません。",
      "en": "My brother doesn't watch TV every day.",
      "blank": "My brother ___ ___ TV every day.",
      "answer": "doesn't watch",
      "choices": [
        "doesn't",
        "watch",
        "watches",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日テレビを見ますか。",
      "en": "Does my brother watch TV every day?",
      "blank": "___ my brother ___ TV every day?",
      "answer": "Does watch",
      "choices": [
        "Does",
        "watch",
        "watches",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きます。",
      "en": "My brother listens to music every day.",
      "blank": "My brother ___ music every day.",
      "answer": "listens to",
      "choices": [
        "listen to",
        "listens to",
        "listening to",
        "listened to"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きません。",
      "en": "My brother doesn't listen to music every day.",
      "blank": "My brother ___ ___ music every day.",
      "answer": "doesn't listen to",
      "choices": [
        "doesn't",
        "listen to",
        "listens to",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日音楽を聴きますか。",
      "en": "Does my brother listen to music every day?",
      "blank": "___ my brother ___ music every day?",
      "answer": "Does listen to",
      "choices": [
        "Does",
        "listen to",
        "listens to",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きます。",
      "en": "My brother plays the piano every day.",
      "blank": "My brother ___ the piano every day.",
      "answer": "plays",
      "choices": [
        "play",
        "plays",
        "playing",
        "played"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きません。",
      "en": "My brother doesn't play the piano every day.",
      "blank": "My brother ___ ___ the piano every day.",
      "answer": "doesn't play",
      "choices": [
        "doesn't",
        "play",
        "plays",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日ピアノを弾きますか。",
      "en": "Does my brother play the piano every day?",
      "blank": "___ my brother ___ the piano every day?",
      "answer": "Does play",
      "choices": [
        "Does",
        "play",
        "plays",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日母を手伝います。",
      "en": "My brother helps my mother every day.",
      "blank": "My brother ___ my mother every day.",
      "answer": "helps",
      "choices": [
        "help",
        "helps",
        "helping",
        "helped"
      ],
      "explanation": "主語によって、現在の一般動詞の形が変わります。"
    },
    {
      "jp": "私の兄は毎日母を手伝いません。",
      "en": "My brother doesn't help my mother every day.",
      "blank": "My brother ___ ___ my mother every day.",
      "answer": "doesn't help",
      "choices": [
        "doesn't",
        "help",
        "helps",
        "not"
      ],
      "explanation": "否定文は don't / doesn't + 動詞の原形で作ります。"
    },
    {
      "jp": "私の兄は毎日母を手伝いますか。",
      "en": "Does my brother help my mother every day?",
      "blank": "___ my brother ___ my mother every day?",
      "answer": "Does help",
      "choices": [
        "Does",
        "help",
        "helps",
        "Do",
        "Does"
      ],
      "explanation": "疑問文は Do / Does + 主語 + 動詞の原形で作ります。"
    }
  ],
  "名詞・代名詞の基本": [
    {
      "jp": "私は本を2冊持っています。",
      "en": "I have two books.",
      "blank": "I have two ___.",
      "answer": "books",
      "choices": [
        "book",
        "books",
        "books",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私は箱を2個持っています。",
      "en": "I have two boxes.",
      "blank": "I have two ___.",
      "answer": "boxes",
      "choices": [
        "box",
        "boxes",
        "boxs",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私はペンを2本持っています。",
      "en": "I have two pens.",
      "blank": "I have two ___.",
      "answer": "pens",
      "choices": [
        "pen",
        "pens",
        "pens",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私は辞書を2冊持っています。",
      "en": "I have two dictionaries.",
      "blank": "I have two ___.",
      "answer": "dictionaries",
      "choices": [
        "dictionary",
        "dictionaries",
        "dictionarys",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私はリンゴを2個持っています。",
      "en": "I have two apples.",
      "blank": "I have two ___.",
      "answer": "apples",
      "choices": [
        "apple",
        "apples",
        "apples",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私はノートを2冊持っています。",
      "en": "I have two notebooks.",
      "blank": "I have two ___.",
      "answer": "notebooks",
      "choices": [
        "notebook",
        "notebooks",
        "notebooks",
        "a"
      ],
      "explanation": "2つ以上のものを表すときは、名詞を複数形にします。"
    },
    {
      "jp": "私は彼女を知っています。",
      "en": "I know her.",
      "blank": "I know ___.",
      "answer": "her",
      "choices": [
        "she",
        "her",
        "hers",
        "he"
      ],
      "explanation": "代名詞は、文の中での役割に合わせて形を変えます。"
    },
    {
      "jp": "これは私の本です。",
      "en": "This is my book.",
      "blank": "This is ___ book.",
      "answer": "my",
      "choices": [
        "I",
        "my",
        "me",
        "mine"
      ],
      "explanation": "代名詞は、文の中での役割に合わせて形を変えます。"
    },
    {
      "jp": "彼は私たちを手伝います。",
      "en": "He helps us.",
      "blank": "He helps ___.",
      "answer": "us",
      "choices": [
        "we",
        "our",
        "us",
        "ours"
      ],
      "explanation": "代名詞は、文の中での役割に合わせて形を変えます。"
    },
    {
      "jp": "あれは彼らの学校です。",
      "en": "That is their school.",
      "blank": "That is ___ school.",
      "answer": "their",
      "choices": [
        "they",
        "them",
        "their",
        "theirs"
      ],
      "explanation": "代名詞は、文の中での役割に合わせて形を変えます。"
    },
    {
      "jp": "このペンは私のものです。",
      "en": "This pen is mine.",
      "blank": "This pen is ___.",
      "answer": "mine",
      "choices": [
        "I",
        "my",
        "me",
        "mine"
      ],
      "explanation": "代名詞は、文の中での役割に合わせて形を変えます。"
    },
    {
      "jp": "私は本を3冊持っています。",
      "en": "I have three books.",
      "blank": "I have three ___.",
      "answer": "books",
      "choices": [
        "book",
        "books",
        "books",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上に本が2冊あります。",
      "en": "There are two books on the desk.",
      "blank": "There are two ___.",
      "answer": "books",
      "choices": [
        "book",
        "books",
        "books",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私は箱を3個持っています。",
      "en": "I have three boxes.",
      "blank": "I have three ___.",
      "answer": "boxes",
      "choices": [
        "box",
        "boxes",
        "boxs",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上に箱が2個あります。",
      "en": "There are two boxes on the desk.",
      "blank": "There are two ___.",
      "answer": "boxes",
      "choices": [
        "box",
        "boxes",
        "boxs",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私はペンを3本持っています。",
      "en": "I have three pens.",
      "blank": "I have three ___.",
      "answer": "pens",
      "choices": [
        "pen",
        "pens",
        "pens",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上にペンが2本あります。",
      "en": "There are two pens on the desk.",
      "blank": "There are two ___.",
      "answer": "pens",
      "choices": [
        "pen",
        "pens",
        "pens",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私は辞書を3冊持っています。",
      "en": "I have three dictionaries.",
      "blank": "I have three ___.",
      "answer": "dictionaries",
      "choices": [
        "dictionary",
        "dictionaries",
        "dictionarys",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上に辞書が2冊あります。",
      "en": "There are two dictionaries on the desk.",
      "blank": "There are two ___.",
      "answer": "dictionaries",
      "choices": [
        "dictionary",
        "dictionaries",
        "dictionarys",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私はリンゴを3個持っています。",
      "en": "I have three apples.",
      "blank": "I have three ___.",
      "answer": "apples",
      "choices": [
        "apple",
        "apples",
        "apples",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上にリンゴが2個あります。",
      "en": "There are two apples on the desk.",
      "blank": "There are two ___.",
      "answer": "apples",
      "choices": [
        "apple",
        "apples",
        "apples",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私はノートを3冊持っています。",
      "en": "I have three notebooks.",
      "blank": "I have three ___.",
      "answer": "notebooks",
      "choices": [
        "notebook",
        "notebooks",
        "notebooks",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上にノートが2冊あります。",
      "en": "There are two notebooks on the desk.",
      "blank": "There are two ___.",
      "answer": "notebooks",
      "choices": [
        "notebook",
        "notebooks",
        "notebooks",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私は時計を3個持っています。",
      "en": "I have three watches.",
      "blank": "I have three ___.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watchs",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上に時計が2個あります。",
      "en": "There are two watches on the desk.",
      "blank": "There are two ___.",
      "answer": "watches",
      "choices": [
        "watch",
        "watches",
        "watchs",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私はバスを3台持っています。",
      "en": "I have three buses.",
      "blank": "I have three ___.",
      "answer": "buses",
      "choices": [
        "bus",
        "buses",
        "buss",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上にバスが2台あります。",
      "en": "There are two buses on the desk.",
      "blank": "There are two ___.",
      "answer": "buses",
      "choices": [
        "bus",
        "buses",
        "buss",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私はクラスを3つ持っています。",
      "en": "I have three classes.",
      "blank": "I have three ___.",
      "answer": "classes",
      "choices": [
        "class",
        "classes",
        "classs",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上にクラスが2つあります。",
      "en": "There are two classes on the desk.",
      "blank": "There are two ___.",
      "answer": "classes",
      "choices": [
        "class",
        "classes",
        "classs",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "私は赤ちゃんを3人持っています。",
      "en": "I have three babies.",
      "blank": "I have three ___.",
      "answer": "babies",
      "choices": [
        "baby",
        "babies",
        "babys",
        "a"
      ],
      "explanation": "数が2以上のときは、名詞を複数形にします。"
    },
    {
      "jp": "机の上に赤ちゃんが2人あります。",
      "en": "There are two babies on the desk.",
      "blank": "There are two ___.",
      "answer": "babies",
      "choices": [
        "baby",
        "babies",
        "babys",
        "a"
      ],
      "explanation": "two の後ろは複数形にします。"
    },
    {
      "jp": "彼女は私を知っています。",
      "en": "She knows me.",
      "blank": "She knows ___.",
      "answer": "me",
      "choices": [
        "I",
        "my",
        "me",
        "mine"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "私は彼を知っています。",
      "en": "I know him.",
      "blank": "I know ___.",
      "answer": "him",
      "choices": [
        "he",
        "his",
        "him",
        "her"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "私は彼らを手伝います。",
      "en": "I help them.",
      "blank": "I help ___.",
      "answer": "them",
      "choices": [
        "they",
        "their",
        "them",
        "theirs"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "これは彼のかばんです。",
      "en": "This is his bag.",
      "blank": "This is ___ bag.",
      "answer": "his",
      "choices": [
        "he",
        "his",
        "him",
        "her"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "これは彼女のノートです。",
      "en": "This is her notebook.",
      "blank": "This is ___ notebook.",
      "answer": "her",
      "choices": [
        "she",
        "her",
        "hers",
        "he"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "この本は彼のものです。",
      "en": "This book is his.",
      "blank": "This book is ___.",
      "answer": "his",
      "choices": [
        "he",
        "his",
        "him",
        "her"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "あの家は彼らのものです。",
      "en": "That house is theirs.",
      "blank": "That house is ___.",
      "answer": "theirs",
      "choices": [
        "they",
        "their",
        "them",
        "theirs"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "これは私たちの教室です。",
      "en": "This is our classroom.",
      "blank": "This is ___ classroom.",
      "answer": "our",
      "choices": [
        "we",
        "us",
        "our",
        "ours"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    },
    {
      "jp": "この席はあなたのものです。",
      "en": "This seat is yours.",
      "blank": "This seat is ___.",
      "answer": "yours",
      "choices": [
        "you",
        "your",
        "yours",
        "yourself"
      ],
      "explanation": "代名詞は、主語・所有・目的語など、文の中での役割に合わせて形が変わります。"
    }
  ],
  "疑問詞を使った疑問文": [
    {
      "jp": "これは何ですか。",
      "en": "What is this?",
      "blank": "___ is this?",
      "answer": "What",
      "choices": [
        "What",
        "Who",
        "Where",
        "When"
      ],
      "explanation": "what は「何」をたずねます。"
    },
    {
      "jp": "あの女の人はだれですか。",
      "en": "Who is that woman?",
      "blank": "___ is that woman?",
      "answer": "Who",
      "choices": [
        "Who",
        "What",
        "Where",
        "When"
      ],
      "explanation": "who は「だれ」をたずねます。"
    },
    {
      "jp": "あなたはどこに住んでいますか。",
      "en": "Where do you live?",
      "blank": "___ do you live?",
      "answer": "Where",
      "choices": [
        "Where",
        "When",
        "What",
        "Who"
      ],
      "explanation": "where は「どこ」をたずねます。"
    },
    {
      "jp": "あなたはいつ英語を勉強しますか。",
      "en": "When do you study English?",
      "blank": "___ do you study English?",
      "answer": "When",
      "choices": [
        "When",
        "Where",
        "What",
        "Who"
      ],
      "explanation": "when は「いつ」をたずねます。"
    },
    {
      "jp": "あなたはなぜ英語を勉強するのですか。",
      "en": "Why do you study English?",
      "blank": "___ do you study English?",
      "answer": "Why",
      "choices": [
        "Why",
        "How",
        "What",
        "When"
      ],
      "explanation": "why は「なぜ」をたずねます。"
    },
    {
      "jp": "あなたはどうやって学校へ行きますか。",
      "en": "How do you go to school?",
      "blank": "___ do you go to school?",
      "answer": "How",
      "choices": [
        "How",
        "What",
        "Why",
        "Where"
      ],
      "explanation": "how は「どのように」をたずねます。"
    },
    {
      "jp": "あなたは本を何冊持っていますか。",
      "en": "How many books do you have?",
      "blank": "___ ___ books do you have?",
      "answer": "How many",
      "choices": [
        "How",
        "many",
        "What",
        "When"
      ],
      "explanation": "How many は数をたずねます。"
    },
    {
      "jp": "今何時ですか。",
      "en": "What time is it now?",
      "blank": "___ ___ is it now?",
      "answer": "What time",
      "choices": [
        "What",
        "time",
        "When",
        "How"
      ],
      "explanation": "What time は時刻をたずねます。"
    },
    {
      "jp": "これはだれのかばんですか。",
      "en": "Whose bag is this?",
      "blank": "___ bag is this?",
      "answer": "Whose",
      "choices": [
        "Whose",
        "Who",
        "Which",
        "What"
      ],
      "explanation": "Whose は「だれの」をたずねます。"
    },
    {
      "jp": "あなたはどちらの本が好きですか。",
      "en": "Which book do you like?",
      "blank": "___ book do you like?",
      "answer": "Which",
      "choices": [
        "Which",
        "Whose",
        "What",
        "Who"
      ],
      "explanation": "Which は「どちらの」をたずねます。"
    },
    {
      "jp": "あなたは紅茶とコーヒーのどちらが好きですか。",
      "en": "Do you like tea or coffee?",
      "blank": "Do you like tea ___ coffee?",
      "answer": "or",
      "choices": [
        "or",
        "and",
        "but",
        "so"
      ],
      "explanation": "or を使うと「AかBか」をたずねられます。"
    },
    {
      "jp": "なんて美しい花なのでしょう。",
      "en": "What a beautiful flower!",
      "blank": "___ a beautiful flower!",
      "answer": "What",
      "choices": [
        "What",
        "How",
        "Who",
        "When"
      ],
      "explanation": "感嘆文では What a + 形容詞 + 名詞 の形を使うことがあります。"
    },
    {
      "jp": "これは何色ですか。",
      "en": "What color is this?",
      "blank": "___ color is this?",
      "answer": "What",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたの名前は何ですか。",
      "en": "What is your name?",
      "blank": "___ is your name?",
      "answer": "What",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "ドアのところにいる人はだれですか。",
      "en": "Who is at the door?",
      "blank": "___ is at the door?",
      "answer": "Who",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "だれがこの歌を歌いますか。",
      "en": "Who sings this song?",
      "blank": "___ sings this song?",
      "answer": "Who",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたのかばんはどこにありますか。",
      "en": "Where is your bag?",
      "blank": "___ is your bag?",
      "answer": "Where",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼女はどこでテニスをしますか。",
      "en": "Where does she play tennis?",
      "blank": "___ does she play tennis?",
      "answer": "Where",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたの誕生日はいつですか。",
      "en": "When is your birthday?",
      "blank": "___ is your birthday?",
      "answer": "When",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼はいつ本を読みますか。",
      "en": "When does he read books?",
      "blank": "___ does he read books?",
      "answer": "When",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたはなぜ忙しいのですか。",
      "en": "Why are you busy?",
      "blank": "___ are you busy?",
      "answer": "Why",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼女はなぜ英語が好きなのですか。",
      "en": "Why does she like English?",
      "blank": "___ does she like English?",
      "answer": "Why",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼はどうやってピアノを練習しますか。",
      "en": "How does he practice the piano?",
      "blank": "___ does he practice the piano?",
      "answer": "How",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "この箱はいくつありますか。",
      "en": "How many boxes are there?",
      "blank": "___ ___ boxes are there?",
      "answer": "How many",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたは何時に起きますか。",
      "en": "What time do you get up?",
      "blank": "___ ___ do you get up?",
      "answer": "What time",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "これはだれのペンですか。",
      "en": "Whose pen is this?",
      "blank": "___ pen is this?",
      "answer": "Whose",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "あなたはどちらの色が好きですか。",
      "en": "Which color do you like?",
      "blank": "___ color do you like?",
      "answer": "Which",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼はサッカーとテニスのどちらをしますか。",
      "en": "Does he play soccer or tennis?",
      "blank": "Does he play soccer ___ tennis?",
      "answer": "or",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "なんて大きな犬なのでしょう。",
      "en": "What a big dog!",
      "blank": "___ a big dog!",
      "answer": "What",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    },
    {
      "jp": "彼女はなんて速く走るのでしょう。",
      "en": "How fast she runs!",
      "blank": "___ fast she runs!",
      "answer": "How",
      "choices": [
        "What",
        "Who",
        "Where",
        "When",
        "Why",
        "How",
        "Which",
        "Whose",
        "or"
      ],
      "explanation": "疑問詞は、たずねたい内容に合わせて選びます。"
    }
  ],
  "基本表現の広がり①": [
    {
      "jp": "窓を開けなさい。",
      "en": "Open the window.",
      "blank": "___ the window.",
      "answer": "Open",
      "choices": [
        "Open",
        "To open",
        "Opens",
        "Opening"
      ],
      "explanation": "命令文は、主語 you を省略して動詞の原形から始めます。"
    },
    {
      "jp": "ここで走ってはいけません。",
      "en": "Don't run here.",
      "blank": "___ ___ here.",
      "answer": "Don't run",
      "choices": [
        "Don't",
        "run",
        "Runs",
        "Not"
      ],
      "explanation": "命令文は、主語 you を省略して動詞の原形から始めます。"
    },
    {
      "jp": "静かにしなさい。",
      "en": "Be quiet.",
      "blank": "___ quiet.",
      "answer": "Be",
      "choices": [
        "Be",
        "Are",
        "Is",
        "Do"
      ],
      "explanation": "命令文は、主語 you を省略して動詞の原形から始めます。"
    },
    {
      "jp": "この本を読んでください。",
      "en": "Read this book.",
      "blank": "___ this book.",
      "answer": "Read",
      "choices": [
        "Read",
        "Reads",
        "Reading",
        "To read"
      ],
      "explanation": "命令文は、主語 you を省略して動詞の原形から始めます。"
    },
    {
      "jp": "私は英語を勉強することができます。",
      "en": "I can study English.",
      "blank": "I ___ ___ English.",
      "answer": "can study",
      "choices": [
        "can",
        "study",
        "studies",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "私は英語を勉強することができません。",
      "en": "I cannot study English.",
      "blank": "I ___ ___ English.",
      "answer": "cannot study",
      "choices": [
        "cannot",
        "can",
        "study",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "私は本を読むことができます。",
      "en": "I can read books.",
      "blank": "I ___ ___ books.",
      "answer": "can read",
      "choices": [
        "can",
        "read",
        "reads",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "私は本を読むことができません。",
      "en": "I cannot read books.",
      "blank": "I ___ ___ books.",
      "answer": "cannot read",
      "choices": [
        "cannot",
        "can",
        "read",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "私はテレビを見ることができます。",
      "en": "I can watch TV.",
      "blank": "I ___ ___ TV.",
      "answer": "can watch",
      "choices": [
        "can",
        "watch",
        "watches",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "私はテレビを見ることができません。",
      "en": "I cannot watch TV.",
      "blank": "I ___ ___ TV.",
      "answer": "cannot watch",
      "choices": [
        "cannot",
        "can",
        "watch",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "私は音楽を聴くことができます。",
      "en": "I can listen to music.",
      "blank": "I ___ ___ music.",
      "answer": "can listen to",
      "choices": [
        "can",
        "listen to",
        "listens to",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "私は音楽を聴くことができません。",
      "en": "I cannot listen to music.",
      "blank": "I ___ ___ music.",
      "answer": "cannot listen to",
      "choices": [
        "cannot",
        "can",
        "listen to",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "あなたは英語を勉強することができます。",
      "en": "You can study English.",
      "blank": "You ___ ___ English.",
      "answer": "can study",
      "choices": [
        "can",
        "study",
        "studies",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "あなたは英語を勉強することができません。",
      "en": "You cannot study English.",
      "blank": "You ___ ___ English.",
      "answer": "cannot study",
      "choices": [
        "cannot",
        "can",
        "study",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "あなたは本を読むことができます。",
      "en": "You can read books.",
      "blank": "You ___ ___ books.",
      "answer": "can read",
      "choices": [
        "can",
        "read",
        "reads",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "あなたは本を読むことができません。",
      "en": "You cannot read books.",
      "blank": "You ___ ___ books.",
      "answer": "cannot read",
      "choices": [
        "cannot",
        "can",
        "read",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "あなたはテレビを見ることができます。",
      "en": "You can watch TV.",
      "blank": "You ___ ___ TV.",
      "answer": "can watch",
      "choices": [
        "can",
        "watch",
        "watches",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "あなたはテレビを見ることができません。",
      "en": "You cannot watch TV.",
      "blank": "You ___ ___ TV.",
      "answer": "cannot watch",
      "choices": [
        "cannot",
        "can",
        "watch",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "あなたは音楽を聴くことができます。",
      "en": "You can listen to music.",
      "blank": "You ___ ___ music.",
      "answer": "can listen to",
      "choices": [
        "can",
        "listen to",
        "listens to",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "あなたは音楽を聴くことができません。",
      "en": "You cannot listen to music.",
      "blank": "You ___ ___ music.",
      "answer": "cannot listen to",
      "choices": [
        "cannot",
        "can",
        "listen to",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼は英語を勉強することができます。",
      "en": "He can study English.",
      "blank": "He ___ ___ English.",
      "answer": "can study",
      "choices": [
        "can",
        "study",
        "studies",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼は英語を勉強することができません。",
      "en": "He cannot study English.",
      "blank": "He ___ ___ English.",
      "answer": "cannot study",
      "choices": [
        "cannot",
        "can",
        "study",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼は本を読むことができます。",
      "en": "He can read books.",
      "blank": "He ___ ___ books.",
      "answer": "can read",
      "choices": [
        "can",
        "read",
        "reads",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼は本を読むことができません。",
      "en": "He cannot read books.",
      "blank": "He ___ ___ books.",
      "answer": "cannot read",
      "choices": [
        "cannot",
        "can",
        "read",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼はテレビを見ることができます。",
      "en": "He can watch TV.",
      "blank": "He ___ ___ TV.",
      "answer": "can watch",
      "choices": [
        "can",
        "watch",
        "watches",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼はテレビを見ることができません。",
      "en": "He cannot watch TV.",
      "blank": "He ___ ___ TV.",
      "answer": "cannot watch",
      "choices": [
        "cannot",
        "can",
        "watch",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼は音楽を聴くことができます。",
      "en": "He can listen to music.",
      "blank": "He ___ ___ music.",
      "answer": "can listen to",
      "choices": [
        "can",
        "listen to",
        "listens to",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼は音楽を聴くことができません。",
      "en": "He cannot listen to music.",
      "blank": "He ___ ___ music.",
      "answer": "cannot listen to",
      "choices": [
        "cannot",
        "can",
        "listen to",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼女は英語を勉強することができます。",
      "en": "She can study English.",
      "blank": "She ___ ___ English.",
      "answer": "can study",
      "choices": [
        "can",
        "study",
        "studies",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼女は英語を勉強することができません。",
      "en": "She cannot study English.",
      "blank": "She ___ ___ English.",
      "answer": "cannot study",
      "choices": [
        "cannot",
        "can",
        "study",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼女は本を読むことができます。",
      "en": "She can read books.",
      "blank": "She ___ ___ books.",
      "answer": "can read",
      "choices": [
        "can",
        "read",
        "reads",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼女は本を読むことができません。",
      "en": "She cannot read books.",
      "blank": "She ___ ___ books.",
      "answer": "cannot read",
      "choices": [
        "cannot",
        "can",
        "read",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼女はテレビを見ることができます。",
      "en": "She can watch TV.",
      "blank": "She ___ ___ TV.",
      "answer": "can watch",
      "choices": [
        "can",
        "watch",
        "watches",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼女はテレビを見ることができません。",
      "en": "She cannot watch TV.",
      "blank": "She ___ ___ TV.",
      "answer": "cannot watch",
      "choices": [
        "cannot",
        "can",
        "watch",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    },
    {
      "jp": "彼女は音楽を聴くことができます。",
      "en": "She can listen to music.",
      "blank": "She ___ ___ music.",
      "answer": "can listen to",
      "choices": [
        "can",
        "listen to",
        "listens to",
        "to"
      ],
      "explanation": "can の後ろは動詞の原形を使います。"
    },
    {
      "jp": "彼女は音楽を聴くことができません。",
      "en": "She cannot listen to music.",
      "blank": "She ___ ___ music.",
      "answer": "cannot listen to",
      "choices": [
        "cannot",
        "can",
        "listen to",
        "not"
      ],
      "explanation": "can の否定文は cannot + 動詞の原形です。"
    }
  ],
  "存在構文": [
    {
      "jp": "机の上に本が1冊あります。",
      "en": "There is a book on the desk.",
      "blank": "There ___ a book on the desk.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "There is は「〜があります」を表します。"
    },
    {
      "jp": "机の上に本が3冊あります。",
      "en": "There are three books on the desk.",
      "blank": "There ___ three books on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "複数のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上に本はありません。",
      "en": "There is not a book on the desk.",
      "blank": "There is ___ a book on the desk.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "There is の否定文は is の後ろに not を置きます。"
    },
    {
      "jp": "机の上に箱が1個あります。",
      "en": "There is a box on the desk.",
      "blank": "There ___ a box on the desk.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "There is は「〜があります」を表します。"
    },
    {
      "jp": "机の上に箱が3個あります。",
      "en": "There are three boxes on the desk.",
      "blank": "There ___ three boxes on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "複数のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上に箱はありません。",
      "en": "There is not a box on the desk.",
      "blank": "There is ___ a box on the desk.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "There is の否定文は is の後ろに not を置きます。"
    },
    {
      "jp": "机の上にペンが1本あります。",
      "en": "There is a pen on the desk.",
      "blank": "There ___ a pen on the desk.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "There is は「〜があります」を表します。"
    },
    {
      "jp": "机の上にペンが3本あります。",
      "en": "There are three pens on the desk.",
      "blank": "There ___ three pens on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "複数のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上にペンはありません。",
      "en": "There is not a pen on the desk.",
      "blank": "There is ___ a pen on the desk.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "There is の否定文は is の後ろに not を置きます。"
    },
    {
      "jp": "机の上に辞書が1冊あります。",
      "en": "There is a dictionary on the desk.",
      "blank": "There ___ a dictionary on the desk.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "There is は「〜があります」を表します。"
    },
    {
      "jp": "机の上に辞書が3冊あります。",
      "en": "There are three dictionaries on the desk.",
      "blank": "There ___ three dictionaries on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "複数のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上に辞書はありません。",
      "en": "There is not a dictionary on the desk.",
      "blank": "There is ___ a dictionary on the desk.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "There is の否定文は is の後ろに not を置きます。"
    },
    {
      "jp": "机の上にリンゴが1個あります。",
      "en": "There is a apple on the desk.",
      "blank": "There ___ a apple on the desk.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "There is は「〜があります」を表します。"
    },
    {
      "jp": "机の上にリンゴが3個あります。",
      "en": "There are three apples on the desk.",
      "blank": "There ___ three apples on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "複数のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上にリンゴはありません。",
      "en": "There is not a apple on the desk.",
      "blank": "There is ___ a apple on the desk.",
      "answer": "not",
      "choices": [
        "not",
        "no",
        "do",
        "does"
      ],
      "explanation": "There is の否定文は is の後ろに not を置きます。"
    },
    {
      "jp": "机の上に本は何冊ありますか。",
      "en": "How many books are there on the desk?",
      "blank": "How many books ___ there on the desk?",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "do",
        "does"
      ],
      "explanation": "How many ... are there? で数をたずねます。"
    },
    {
      "jp": "机の上に本が2冊あります。",
      "en": "There are two books on the desk.",
      "blank": "There ___ two books on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "かばんの中に本が1冊あります。",
      "en": "There is a book in the bag.",
      "blank": "There ___ a book in the bag.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "かばんの中に本が2冊あります。",
      "en": "There are two books in the bag.",
      "blank": "There ___ two books in the bag.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "公園に本が1冊あります。",
      "en": "There is a book in the park.",
      "blank": "There ___ a book in the park.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "公園に本が2冊あります。",
      "en": "There are two books in the park.",
      "blank": "There ___ two books in the park.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "教室に本が1冊あります。",
      "en": "There is a book in the classroom.",
      "blank": "There ___ a book in the classroom.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "教室に本が2冊あります。",
      "en": "There are two books in the classroom.",
      "blank": "There ___ two books in the classroom.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "駅の近くに本が1冊あります。",
      "en": "There is a book near the station.",
      "blank": "There ___ a book near the station.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "駅の近くに本が2冊あります。",
      "en": "There are two books near the station.",
      "blank": "There ___ two books near the station.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "テーブルの下に本が1冊あります。",
      "en": "There is a book under the table.",
      "blank": "There ___ a book under the table.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "テーブルの下に本が2冊あります。",
      "en": "There are two books under the table.",
      "blank": "There ___ two books under the table.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上に箱が2個あります。",
      "en": "There are two boxes on the desk.",
      "blank": "There ___ two boxes on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "かばんの中に箱が1個あります。",
      "en": "There is a box in the bag.",
      "blank": "There ___ a box in the bag.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "かばんの中に箱が2個あります。",
      "en": "There are two boxes in the bag.",
      "blank": "There ___ two boxes in the bag.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "公園に箱が1個あります。",
      "en": "There is a box in the park.",
      "blank": "There ___ a box in the park.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "公園に箱が2個あります。",
      "en": "There are two boxes in the park.",
      "blank": "There ___ two boxes in the park.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "教室に箱が1個あります。",
      "en": "There is a box in the classroom.",
      "blank": "There ___ a box in the classroom.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "教室に箱が2個あります。",
      "en": "There are two boxes in the classroom.",
      "blank": "There ___ two boxes in the classroom.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "駅の近くに箱が1個あります。",
      "en": "There is a box near the station.",
      "blank": "There ___ a box near the station.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "駅の近くに箱が2個あります。",
      "en": "There are two boxes near the station.",
      "blank": "There ___ two boxes near the station.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "テーブルの下に箱が1個あります。",
      "en": "There is a box under the table.",
      "blank": "There ___ a box under the table.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "テーブルの下に箱が2個あります。",
      "en": "There are two boxes under the table.",
      "blank": "There ___ two boxes under the table.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "机の上にペンが2本あります。",
      "en": "There are two pens on the desk.",
      "blank": "There ___ two pens on the desk.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "かばんの中にペンが1本あります。",
      "en": "There is a pen in the bag.",
      "blank": "There ___ a pen in the bag.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "かばんの中にペンが2本あります。",
      "en": "There are two pens in the bag.",
      "blank": "There ___ two pens in the bag.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "公園にペンが1本あります。",
      "en": "There is a pen in the park.",
      "blank": "There ___ a pen in the park.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "公園にペンが2本あります。",
      "en": "There are two pens in the park.",
      "blank": "There ___ two pens in the park.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "教室にペンが1本あります。",
      "en": "There is a pen in the classroom.",
      "blank": "There ___ a pen in the classroom.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "教室にペンが2本あります。",
      "en": "There are two pens in the classroom.",
      "blank": "There ___ two pens in the classroom.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "駅の近くにペンが1本あります。",
      "en": "There is a pen near the station.",
      "blank": "There ___ a pen near the station.",
      "answer": "is",
      "choices": [
        "is",
        "are",
        "am",
        "be"
      ],
      "explanation": "1つのものがあるときは There is を使います。"
    },
    {
      "jp": "駅の近くにペンが2本あります。",
      "en": "There are two pens near the station.",
      "blank": "There ___ two pens near the station.",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "am",
        "be"
      ],
      "explanation": "2つ以上のものがあるときは There are を使います。"
    },
    {
      "jp": "教室に生徒は何人いますか。",
      "en": "How many students are there in the classroom?",
      "blank": "How many students ___ there in the classroom?",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "do",
        "does"
      ],
      "explanation": "How many ... are there? で数をたずねます。"
    },
    {
      "jp": "かばんの中にペンはありますか。",
      "en": "Is there a pen in the bag?",
      "blank": "___ there a pen in the bag?",
      "answer": "Is",
      "choices": [
        "Is",
        "Are",
        "Do",
        "Does"
      ],
      "explanation": "There is の疑問文は Is there ...? です。"
    },
    {
      "jp": "公園に犬は何匹いますか。",
      "en": "How many dogs are there in the park?",
      "blank": "How many dogs ___ there in the park?",
      "answer": "are",
      "choices": [
        "are",
        "is",
        "do",
        "does"
      ],
      "explanation": "複数の数をたずねるときは are there を使います。"
    }
  ],
  "方法をたずねる文": [
    {
      "jp": "あなたはどうやって英語を勉強しますか。",
      "en": "How do you study English?",
      "blank": "How ___ you ___ English?",
      "answer": "do study",
      "choices": [
        "do",
        "study",
        "does",
        "studies"
      ],
      "explanation": "How do you ...? で方法をたずねます。"
    },
    {
      "jp": "あなたはどうやって学校へ行きますか。",
      "en": "How do you go to school?",
      "blank": "How ___ you ___ to school?",
      "answer": "do go",
      "choices": [
        "do",
        "go",
        "does",
        "goes"
      ],
      "explanation": "How do you ...? の後ろは一般動詞の疑問文の形です。"
    },
    {
      "jp": "私はどうやってこのペンを使えばよいですか。",
      "en": "How can I use this pen?",
      "blank": "How ___ I ___ this pen?",
      "answer": "can use",
      "choices": [
        "can",
        "use",
        "do",
        "uses"
      ],
      "explanation": "How can I ...? で「どうやって〜できますか」を表します。"
    },
    {
      "jp": "私たちはどうやってこの問題を解けばよいですか。",
      "en": "How can we solve this problem?",
      "blank": "How ___ we ___ this problem?",
      "answer": "can solve",
      "choices": [
        "can",
        "solve",
        "do",
        "solves"
      ],
      "explanation": "can の後ろは動詞の原形です。"
    },
    {
      "jp": "手伝ってくれますか。",
      "en": "Can you help me?",
      "blank": "___ you ___ me?",
      "answer": "Can help",
      "choices": [
        "Can",
        "help",
        "Do",
        "helps"
      ],
      "explanation": "Can you ...? で相手にお願いできます。"
    },
    {
      "jp": "もう一度言ってくれますか。",
      "en": "Can you say that again?",
      "blank": "___ you ___ that again?",
      "answer": "Can say",
      "choices": [
        "Can",
        "say",
        "Do",
        "says"
      ],
      "explanation": "Can you ...? は依頼にも使えます。"
    },
    {
      "jp": "この単語をどうやって覚えますか。",
      "en": "How do you remember this word?",
      "blank": "How ___ you ___ this word?",
      "answer": "do remember",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この文をどうやって訳しますか。",
      "en": "How do you translate this sentence?",
      "blank": "How ___ you ___ this sentence?",
      "answer": "do translate",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "私はどうやって駅へ行けばよいですか。",
      "en": "How can I get to the station?",
      "blank": "How ___ I ___ to the station?",
      "answer": "can get",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "私たちはどうやってこの箱を運べばよいですか。",
      "en": "How can we carry this box?",
      "blank": "How ___ we ___ this box?",
      "answer": "can carry",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "ドアを開けてくれますか。",
      "en": "Can you open the door?",
      "blank": "___ you ___ the door?",
      "answer": "Can open",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "写真を撮ってくれますか。",
      "en": "Can you take a picture?",
      "blank": "___ you ___ a picture?",
      "answer": "Can take",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この問題を解いてくれますか。",
      "en": "Can you solve this problem?",
      "blank": "___ you ___ this problem?",
      "answer": "Can solve",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この漢字をどうやって読みますか。",
      "en": "How do you read this kanji?",
      "blank": "How ___ you ___ this kanji?",
      "answer": "do read",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "私はどうやってこのアプリを使えばよいですか。",
      "en": "How can I use this app?",
      "blank": "How ___ I ___ this app?",
      "answer": "can use",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "もう少しゆっくり話してくれますか。",
      "en": "Can you speak more slowly?",
      "blank": "___ you ___ more slowly?",
      "answer": "Can speak",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "あなたはどうやって英語を勉強しますか。",
      "en": "How do you study English?",
      "blank": "How do you ___ English?",
      "answer": "study",
      "choices": [
        "do",
        "study",
        "does",
        "studies"
      ],
      "explanation": "How do you ...? で方法をたずねます。"
    },
    {
      "jp": "あなたはどうやって学校へ行きますか。",
      "en": "How do you go to school?",
      "blank": "How do you ___ to school?",
      "answer": "go",
      "choices": [
        "do",
        "go",
        "does",
        "goes"
      ],
      "explanation": "How do you ...? の後ろは一般動詞の疑問文の形です。"
    },
    {
      "jp": "私はどうやってこのペンを使えばよいですか。",
      "en": "How can I use this pen?",
      "blank": "How can I ___ this pen?",
      "answer": "use",
      "choices": [
        "can",
        "use",
        "do",
        "uses"
      ],
      "explanation": "How can I ...? で「どうやって〜できますか」を表します。"
    },
    {
      "jp": "私たちはどうやってこの問題を解けばよいですか。",
      "en": "How can we solve this problem?",
      "blank": "How can we ___ this problem?",
      "answer": "solve",
      "choices": [
        "can",
        "solve",
        "do",
        "solves"
      ],
      "explanation": "can の後ろは動詞の原形です。"
    },
    {
      "jp": "手伝ってくれますか。",
      "en": "Can you help me?",
      "blank": "Can you ___ me?",
      "answer": "help",
      "choices": [
        "Can",
        "help",
        "Do",
        "helps"
      ],
      "explanation": "Can you ...? で相手にお願いできます。"
    },
    {
      "jp": "もう一度言ってくれますか。",
      "en": "Can you say that again?",
      "blank": "Can you ___ that again?",
      "answer": "say",
      "choices": [
        "Can",
        "say",
        "Do",
        "says"
      ],
      "explanation": "Can you ...? は依頼にも使えます。"
    },
    {
      "jp": "この単語をどうやって覚えますか。",
      "en": "How do you remember this word?",
      "blank": "How do you ___ this word?",
      "answer": "remember",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この文をどうやって訳しますか。",
      "en": "How do you translate this sentence?",
      "blank": "How do you ___ this sentence?",
      "answer": "translate",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "私はどうやって駅へ行けばよいですか。",
      "en": "How can I get to the station?",
      "blank": "How can I ___ to the station?",
      "answer": "get",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "私たちはどうやってこの箱を運べばよいですか。",
      "en": "How can we carry this box?",
      "blank": "How can we ___ this box?",
      "answer": "carry",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "ドアを開けてくれますか。",
      "en": "Can you open the door?",
      "blank": "Can you ___ the door?",
      "answer": "open",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "写真を撮ってくれますか。",
      "en": "Can you take a picture?",
      "blank": "Can you ___ a picture?",
      "answer": "take",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この問題を解いてくれますか。",
      "en": "Can you solve this problem?",
      "blank": "Can you ___ this problem?",
      "answer": "solve",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    },
    {
      "jp": "この漢字をどうやって読みますか。",
      "en": "How do you read this kanji?",
      "blank": "How do you ___ this kanji?",
      "answer": "read",
      "choices": [
        "How",
        "do",
        "does",
        "can",
        "Can",
        "use",
        "open",
        "speak"
      ],
      "explanation": "方法をたずねる文では How do you ...? / How can I ...? / Can you ...? を使います。"
    }
  ],
  "現在進行形": [
    {
      "jp": "私は英語を勉強しています。",
      "en": "I am studying English.",
      "blank": "I am ___ English.",
      "answer": "studying",
      "choices": [
        "studying",
        "study",
        "studies",
        "studied"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私は英語を勉強していません。",
      "en": "I am not studying English.",
      "blank": "I am ___ ___ English.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "私は本を読んでいます。",
      "en": "I am reading books.",
      "blank": "I am ___ books.",
      "answer": "reading",
      "choices": [
        "reading",
        "read",
        "reads",
        "read"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私は本を読んでいます。",
      "en": "I am not reading books.",
      "blank": "I am ___ ___ books.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "私はテレビを見ています。",
      "en": "I am watching TV.",
      "blank": "I am ___ TV.",
      "answer": "watching",
      "choices": [
        "watching",
        "watch",
        "watches",
        "watched"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私はテレビを見ていません。",
      "en": "I am not watching TV.",
      "blank": "I am ___ ___ TV.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "私は音楽を聴いています。",
      "en": "I am listening to music.",
      "blank": "I am ___ music.",
      "answer": "listening to",
      "choices": [
        "listening to",
        "listen to",
        "listens to",
        "listened to"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私は音楽を聴いていません。",
      "en": "I am not listening to music.",
      "blank": "I am ___ ___ music.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "私はピアノを弾いています。",
      "en": "I am playing the piano.",
      "blank": "I am ___ the piano.",
      "answer": "playing",
      "choices": [
        "playing",
        "play",
        "plays",
        "played"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私はピアノを弾いていません。",
      "en": "I am not playing the piano.",
      "blank": "I am ___ ___ the piano.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "私は母を手伝っています。",
      "en": "I am helping my mother.",
      "blank": "I am ___ my mother.",
      "answer": "helping",
      "choices": [
        "helping",
        "help",
        "helps",
        "helped"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "私は母を手伝っていません。",
      "en": "I am not helping my mother.",
      "blank": "I am ___ ___ my mother.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたは英語を勉強しています。",
      "en": "You are studying English.",
      "blank": "You are ___ English.",
      "answer": "studying",
      "choices": [
        "studying",
        "study",
        "studies",
        "studied"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたは英語を勉強していません。",
      "en": "You are not studying English.",
      "blank": "You are ___ ___ English.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたは本を読んでいます。",
      "en": "You are reading books.",
      "blank": "You are ___ books.",
      "answer": "reading",
      "choices": [
        "reading",
        "read",
        "reads",
        "read"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたは本を読んでいます。",
      "en": "You are not reading books.",
      "blank": "You are ___ ___ books.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたはテレビを見ています。",
      "en": "You are watching TV.",
      "blank": "You are ___ TV.",
      "answer": "watching",
      "choices": [
        "watching",
        "watch",
        "watches",
        "watched"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたはテレビを見ていません。",
      "en": "You are not watching TV.",
      "blank": "You are ___ ___ TV.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたは音楽を聴いています。",
      "en": "You are listening to music.",
      "blank": "You are ___ music.",
      "answer": "listening to",
      "choices": [
        "listening to",
        "listen to",
        "listens to",
        "listened to"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたは音楽を聴いていません。",
      "en": "You are not listening to music.",
      "blank": "You are ___ ___ music.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたはピアノを弾いています。",
      "en": "You are playing the piano.",
      "blank": "You are ___ the piano.",
      "answer": "playing",
      "choices": [
        "playing",
        "play",
        "plays",
        "played"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたはピアノを弾いていません。",
      "en": "You are not playing the piano.",
      "blank": "You are ___ ___ the piano.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "あなたは母を手伝っています。",
      "en": "You are helping my mother.",
      "blank": "You are ___ my mother.",
      "answer": "helping",
      "choices": [
        "helping",
        "help",
        "helps",
        "helped"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "あなたは母を手伝っていません。",
      "en": "You are not helping my mother.",
      "blank": "You are ___ ___ my mother.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼は英語を勉強しています。",
      "en": "He is studying English.",
      "blank": "He is ___ English.",
      "answer": "studying",
      "choices": [
        "studying",
        "study",
        "studies",
        "studied"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼は英語を勉強していません。",
      "en": "He is not studying English.",
      "blank": "He is ___ ___ English.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼は本を読んでいます。",
      "en": "He is reading books.",
      "blank": "He is ___ books.",
      "answer": "reading",
      "choices": [
        "reading",
        "read",
        "reads",
        "read"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼は本を読んでいます。",
      "en": "He is not reading books.",
      "blank": "He is ___ ___ books.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼はテレビを見ています。",
      "en": "He is watching TV.",
      "blank": "He is ___ TV.",
      "answer": "watching",
      "choices": [
        "watching",
        "watch",
        "watches",
        "watched"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼はテレビを見ていません。",
      "en": "He is not watching TV.",
      "blank": "He is ___ ___ TV.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼は音楽を聴いています。",
      "en": "He is listening to music.",
      "blank": "He is ___ music.",
      "answer": "listening to",
      "choices": [
        "listening to",
        "listen to",
        "listens to",
        "listened to"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼は音楽を聴いていません。",
      "en": "He is not listening to music.",
      "blank": "He is ___ ___ music.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼はピアノを弾いています。",
      "en": "He is playing the piano.",
      "blank": "He is ___ the piano.",
      "answer": "playing",
      "choices": [
        "playing",
        "play",
        "plays",
        "played"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼はピアノを弾いていません。",
      "en": "He is not playing the piano.",
      "blank": "He is ___ ___ the piano.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼は母を手伝っています。",
      "en": "He is helping my mother.",
      "blank": "He is ___ my mother.",
      "answer": "helping",
      "choices": [
        "helping",
        "help",
        "helps",
        "helped"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼は母を手伝っていません。",
      "en": "He is not helping my mother.",
      "blank": "He is ___ ___ my mother.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女は英語を勉強しています。",
      "en": "She is studying English.",
      "blank": "She is ___ English.",
      "answer": "studying",
      "choices": [
        "studying",
        "study",
        "studies",
        "studied"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女は英語を勉強していません。",
      "en": "She is not studying English.",
      "blank": "She is ___ ___ English.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女は本を読んでいます。",
      "en": "She is reading books.",
      "blank": "She is ___ books.",
      "answer": "reading",
      "choices": [
        "reading",
        "read",
        "reads",
        "read"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女は本を読んでいます。",
      "en": "She is not reading books.",
      "blank": "She is ___ ___ books.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女はテレビを見ています。",
      "en": "She is watching TV.",
      "blank": "She is ___ TV.",
      "answer": "watching",
      "choices": [
        "watching",
        "watch",
        "watches",
        "watched"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女はテレビを見ていません。",
      "en": "She is not watching TV.",
      "blank": "She is ___ ___ TV.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女は音楽を聴いています。",
      "en": "She is listening to music.",
      "blank": "She is ___ music.",
      "answer": "listening to",
      "choices": [
        "listening to",
        "listen to",
        "listens to",
        "listened to"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女は音楽を聴いていません。",
      "en": "She is not listening to music.",
      "blank": "She is ___ ___ music.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女はピアノを弾いています。",
      "en": "She is playing the piano.",
      "blank": "She is ___ the piano.",
      "answer": "playing",
      "choices": [
        "playing",
        "play",
        "plays",
        "played"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女はピアノを弾いていません。",
      "en": "She is not playing the piano.",
      "blank": "She is ___ ___ the piano.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼女は母を手伝っています。",
      "en": "She is helping my mother.",
      "blank": "She is ___ my mother.",
      "answer": "helping",
      "choices": [
        "helping",
        "help",
        "helps",
        "helped"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼女は母を手伝っていません。",
      "en": "She is not helping my mother.",
      "blank": "She is ___ ___ my mother.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らは英語を勉強しています。",
      "en": "They are studying English.",
      "blank": "They are ___ English.",
      "answer": "studying",
      "choices": [
        "studying",
        "study",
        "studies",
        "studied"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らは英語を勉強していません。",
      "en": "They are not studying English.",
      "blank": "They are ___ ___ English.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らは本を読んでいます。",
      "en": "They are reading books.",
      "blank": "They are ___ books.",
      "answer": "reading",
      "choices": [
        "reading",
        "read",
        "reads",
        "read"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らは本を読んでいます。",
      "en": "They are not reading books.",
      "blank": "They are ___ ___ books.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らはテレビを見ています。",
      "en": "They are watching TV.",
      "blank": "They are ___ TV.",
      "answer": "watching",
      "choices": [
        "watching",
        "watch",
        "watches",
        "watched"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らはテレビを見ていません。",
      "en": "They are not watching TV.",
      "blank": "They are ___ ___ TV.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らは音楽を聴いています。",
      "en": "They are listening to music.",
      "blank": "They are ___ music.",
      "answer": "listening to",
      "choices": [
        "listening to",
        "listen to",
        "listens to",
        "listened to"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らは音楽を聴いていません。",
      "en": "They are not listening to music.",
      "blank": "They are ___ ___ music.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らはピアノを弾いています。",
      "en": "They are playing the piano.",
      "blank": "They are ___ the piano.",
      "answer": "playing",
      "choices": [
        "playing",
        "play",
        "plays",
        "played"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らはピアノを弾いていません。",
      "en": "They are not playing the piano.",
      "blank": "They are ___ ___ the piano.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    },
    {
      "jp": "彼らは母を手伝っています。",
      "en": "They are helping my mother.",
      "blank": "They are ___ my mother.",
      "answer": "helping",
      "choices": [
        "helping",
        "help",
        "helps",
        "helped"
      ],
      "explanation": "現在進行形は be動詞 + 動詞のing形で作ります。"
    },
    {
      "jp": "彼らは母を手伝っていません。",
      "en": "They are not helping my mother.",
      "blank": "They are ___ ___ my mother.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "no"
      ],
      "explanation": "現在進行形の否定文は be動詞 + not + ing形です。"
    }
  ],
  "過去形の基本": [
    {
      "jp": "私は昨日英語を勉強しました。",
      "en": "I studied English yesterday.",
      "blank": "I ___ English yesterday.",
      "answer": "studied",
      "choices": [
        "study",
        "studies",
        "studied",
        "studying"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日本を読みました。",
      "en": "I read books yesterday.",
      "blank": "I ___ books yesterday.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "read",
        "reading"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日テレビを見ました。",
      "en": "I watched TV yesterday.",
      "blank": "I ___ TV yesterday.",
      "answer": "watched",
      "choices": [
        "watch",
        "watches",
        "watched",
        "watching"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日音楽を聴きました。",
      "en": "I listened to music yesterday.",
      "blank": "I ___ music yesterday.",
      "answer": "listened to",
      "choices": [
        "listen to",
        "listens to",
        "listened to",
        "listening to"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日ピアノを弾きました。",
      "en": "I played the piano yesterday.",
      "blank": "I ___ the piano yesterday.",
      "answer": "played",
      "choices": [
        "play",
        "plays",
        "played",
        "playing"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日母を手伝いました。",
      "en": "I helped my mother yesterday.",
      "blank": "I ___ my mother yesterday.",
      "answer": "helped",
      "choices": [
        "help",
        "helps",
        "helped",
        "helping"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日英語を勉強しました。",
      "en": "You studied English yesterday.",
      "blank": "You ___ English yesterday.",
      "answer": "studied",
      "choices": [
        "study",
        "studies",
        "studied",
        "studying"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日本を読みました。",
      "en": "You read books yesterday.",
      "blank": "You ___ books yesterday.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "read",
        "reading"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日テレビを見ました。",
      "en": "You watched TV yesterday.",
      "blank": "You ___ TV yesterday.",
      "answer": "watched",
      "choices": [
        "watch",
        "watches",
        "watched",
        "watching"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日音楽を聴きました。",
      "en": "You listened to music yesterday.",
      "blank": "You ___ music yesterday.",
      "answer": "listened to",
      "choices": [
        "listen to",
        "listens to",
        "listened to",
        "listening to"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日ピアノを弾きました。",
      "en": "You played the piano yesterday.",
      "blank": "You ___ the piano yesterday.",
      "answer": "played",
      "choices": [
        "play",
        "plays",
        "played",
        "playing"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "あなたは昨日母を手伝いました。",
      "en": "You helped my mother yesterday.",
      "blank": "You ___ my mother yesterday.",
      "answer": "helped",
      "choices": [
        "help",
        "helps",
        "helped",
        "helping"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日英語を勉強しました。",
      "en": "He studied English yesterday.",
      "blank": "He ___ English yesterday.",
      "answer": "studied",
      "choices": [
        "study",
        "studies",
        "studied",
        "studying"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日本を読みました。",
      "en": "He read books yesterday.",
      "blank": "He ___ books yesterday.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "read",
        "reading"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日テレビを見ました。",
      "en": "He watched TV yesterday.",
      "blank": "He ___ TV yesterday.",
      "answer": "watched",
      "choices": [
        "watch",
        "watches",
        "watched",
        "watching"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日音楽を聴きました。",
      "en": "He listened to music yesterday.",
      "blank": "He ___ music yesterday.",
      "answer": "listened to",
      "choices": [
        "listen to",
        "listens to",
        "listened to",
        "listening to"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日ピアノを弾きました。",
      "en": "He played the piano yesterday.",
      "blank": "He ___ the piano yesterday.",
      "answer": "played",
      "choices": [
        "play",
        "plays",
        "played",
        "playing"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼は昨日母を手伝いました。",
      "en": "He helped my mother yesterday.",
      "blank": "He ___ my mother yesterday.",
      "answer": "helped",
      "choices": [
        "help",
        "helps",
        "helped",
        "helping"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日英語を勉強しました。",
      "en": "She studied English yesterday.",
      "blank": "She ___ English yesterday.",
      "answer": "studied",
      "choices": [
        "study",
        "studies",
        "studied",
        "studying"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日本を読みました。",
      "en": "She read books yesterday.",
      "blank": "She ___ books yesterday.",
      "answer": "read",
      "choices": [
        "read",
        "reads",
        "read",
        "reading"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日テレビを見ました。",
      "en": "She watched TV yesterday.",
      "blank": "She ___ TV yesterday.",
      "answer": "watched",
      "choices": [
        "watch",
        "watches",
        "watched",
        "watching"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日音楽を聴きました。",
      "en": "She listened to music yesterday.",
      "blank": "She ___ music yesterday.",
      "answer": "listened to",
      "choices": [
        "listen to",
        "listens to",
        "listened to",
        "listening to"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日ピアノを弾きました。",
      "en": "She played the piano yesterday.",
      "blank": "She ___ the piano yesterday.",
      "answer": "played",
      "choices": [
        "play",
        "plays",
        "played",
        "playing"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "彼女は昨日母を手伝いました。",
      "en": "She helped my mother yesterday.",
      "blank": "She ___ my mother yesterday.",
      "answer": "helped",
      "choices": [
        "help",
        "helps",
        "helped",
        "helping"
      ],
      "explanation": "過去のことを表すときは、一般動詞を過去形にします。"
    },
    {
      "jp": "私は昨日学生でした。",
      "en": "I was a student yesterday.",
      "blank": "I ___ a student yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "私は昨日親切でした。",
      "en": "I was kind yesterday.",
      "blank": "I ___ kind yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "私は昨日忙しいでした。",
      "en": "I was busy yesterday.",
      "blank": "I ___ busy yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "私は昨日元気でした。",
      "en": "I was fine yesterday.",
      "blank": "I ___ fine yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼は昨日学生でした。",
      "en": "He was a student yesterday.",
      "blank": "He ___ a student yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼は昨日親切でした。",
      "en": "He was kind yesterday.",
      "blank": "He ___ kind yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼は昨日忙しいでした。",
      "en": "He was busy yesterday.",
      "blank": "He ___ busy yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼は昨日元気でした。",
      "en": "He was fine yesterday.",
      "blank": "He ___ fine yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼女は昨日学生でした。",
      "en": "She was a student yesterday.",
      "blank": "She ___ a student yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼女は昨日親切でした。",
      "en": "She was kind yesterday.",
      "blank": "She ___ kind yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼女は昨日忙しいでした。",
      "en": "She was busy yesterday.",
      "blank": "She ___ busy yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼女は昨日元気でした。",
      "en": "She was fine yesterday.",
      "blank": "She ___ fine yesterday.",
      "answer": "was",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼らは昨日学生でした。",
      "en": "They were a student yesterday.",
      "blank": "They ___ a student yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼らは昨日親切でした。",
      "en": "They were kind yesterday.",
      "blank": "They ___ kind yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼らは昨日忙しいでした。",
      "en": "They were busy yesterday.",
      "blank": "They ___ busy yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "彼らは昨日元気でした。",
      "en": "They were fine yesterday.",
      "blank": "They ___ fine yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "あなたは昨日学生でした。",
      "en": "You were a student yesterday.",
      "blank": "You ___ a student yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "あなたは昨日親切でした。",
      "en": "You were kind yesterday.",
      "blank": "You ___ kind yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "あなたは昨日忙しいでした。",
      "en": "You were busy yesterday.",
      "blank": "You ___ busy yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    },
    {
      "jp": "あなたは昨日元気でした。",
      "en": "You were fine yesterday.",
      "blank": "You ___ fine yesterday.",
      "answer": "were",
      "choices": [
        "was",
        "were",
        "is",
        "are"
      ],
      "explanation": "be動詞の過去形は was / were です。"
    }
  ],
  "過去・進行形の発展": [
    {
      "jp": "私はそのとき英語を勉強していました。",
      "en": "I was studying English then.",
      "blank": "I ___ ___ English then.",
      "answer": "was studying",
      "choices": [
        "was",
        "were",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日英語を勉強していませんでした。",
      "en": "I was not studying English yesterday.",
      "blank": "I was ___ ___ English yesterday.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "私はそのとき本を読んでいました。",
      "en": "I was reading books then.",
      "blank": "I ___ ___ books then.",
      "answer": "was reading",
      "choices": [
        "was",
        "were",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日本を読んでいませんでした。",
      "en": "I was not reading books yesterday.",
      "blank": "I was ___ ___ books yesterday.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "私はそのときテレビを見ていました。",
      "en": "I was watching TV then.",
      "blank": "I ___ ___ TV then.",
      "answer": "was watching",
      "choices": [
        "was",
        "were",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日テレビを見ていませんでした。",
      "en": "I was not watching TV yesterday.",
      "blank": "I was ___ ___ TV yesterday.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "私はそのとき音楽を聴いていました。",
      "en": "I was listening to music then.",
      "blank": "I ___ ___ music then.",
      "answer": "was listening to",
      "choices": [
        "was",
        "were",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日音楽を聴いていませんでした。",
      "en": "I was not listening to music yesterday.",
      "blank": "I was ___ ___ music yesterday.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "私はそのときピアノを弾いていました。",
      "en": "I was playing the piano then.",
      "blank": "I ___ ___ the piano then.",
      "answer": "was playing",
      "choices": [
        "was",
        "were",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日ピアノを弾いていませんでした。",
      "en": "I was not playing the piano yesterday.",
      "blank": "I was ___ ___ the piano yesterday.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "私はそのとき母を手伝っていました。",
      "en": "I was helping my mother then.",
      "blank": "I ___ ___ my mother then.",
      "answer": "was helping",
      "choices": [
        "was",
        "were",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "私は昨日母を手伝っていませんでした。",
      "en": "I was not helping my mother yesterday.",
      "blank": "I was ___ ___ my mother yesterday.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのとき英語を勉強していました。",
      "en": "He was studying English then.",
      "blank": "He ___ ___ English then.",
      "answer": "was studying",
      "choices": [
        "was",
        "were",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日英語を勉強していませんでした。",
      "en": "He was not studying English yesterday.",
      "blank": "He was ___ ___ English yesterday.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのとき本を読んでいました。",
      "en": "He was reading books then.",
      "blank": "He ___ ___ books then.",
      "answer": "was reading",
      "choices": [
        "was",
        "were",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日本を読んでいませんでした。",
      "en": "He was not reading books yesterday.",
      "blank": "He was ___ ___ books yesterday.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのときテレビを見ていました。",
      "en": "He was watching TV then.",
      "blank": "He ___ ___ TV then.",
      "answer": "was watching",
      "choices": [
        "was",
        "were",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日テレビを見ていませんでした。",
      "en": "He was not watching TV yesterday.",
      "blank": "He was ___ ___ TV yesterday.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのとき音楽を聴いていました。",
      "en": "He was listening to music then.",
      "blank": "He ___ ___ music then.",
      "answer": "was listening to",
      "choices": [
        "was",
        "were",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日音楽を聴いていませんでした。",
      "en": "He was not listening to music yesterday.",
      "blank": "He was ___ ___ music yesterday.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのときピアノを弾いていました。",
      "en": "He was playing the piano then.",
      "blank": "He ___ ___ the piano then.",
      "answer": "was playing",
      "choices": [
        "was",
        "were",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日ピアノを弾いていませんでした。",
      "en": "He was not playing the piano yesterday.",
      "blank": "He was ___ ___ the piano yesterday.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼はそのとき母を手伝っていました。",
      "en": "He was helping my mother then.",
      "blank": "He ___ ___ my mother then.",
      "answer": "was helping",
      "choices": [
        "was",
        "were",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼は昨日母を手伝っていませんでした。",
      "en": "He was not helping my mother yesterday.",
      "blank": "He was ___ ___ my mother yesterday.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのとき英語を勉強していました。",
      "en": "She was studying English then.",
      "blank": "She ___ ___ English then.",
      "answer": "was studying",
      "choices": [
        "was",
        "were",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日英語を勉強していませんでした。",
      "en": "She was not studying English yesterday.",
      "blank": "She was ___ ___ English yesterday.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのとき本を読んでいました。",
      "en": "She was reading books then.",
      "blank": "She ___ ___ books then.",
      "answer": "was reading",
      "choices": [
        "was",
        "were",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日本を読んでいませんでした。",
      "en": "She was not reading books yesterday.",
      "blank": "She was ___ ___ books yesterday.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのときテレビを見ていました。",
      "en": "She was watching TV then.",
      "blank": "She ___ ___ TV then.",
      "answer": "was watching",
      "choices": [
        "was",
        "were",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日テレビを見ていませんでした。",
      "en": "She was not watching TV yesterday.",
      "blank": "She was ___ ___ TV yesterday.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのとき音楽を聴いていました。",
      "en": "She was listening to music then.",
      "blank": "She ___ ___ music then.",
      "answer": "was listening to",
      "choices": [
        "was",
        "were",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日音楽を聴いていませんでした。",
      "en": "She was not listening to music yesterday.",
      "blank": "She was ___ ___ music yesterday.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのときピアノを弾いていました。",
      "en": "She was playing the piano then.",
      "blank": "She ___ ___ the piano then.",
      "answer": "was playing",
      "choices": [
        "was",
        "were",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日ピアノを弾いていませんでした。",
      "en": "She was not playing the piano yesterday.",
      "blank": "She was ___ ___ the piano yesterday.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼女はそのとき母を手伝っていました。",
      "en": "She was helping my mother then.",
      "blank": "She ___ ___ my mother then.",
      "answer": "was helping",
      "choices": [
        "was",
        "were",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼女は昨日母を手伝っていませんでした。",
      "en": "She was not helping my mother yesterday.",
      "blank": "She was ___ ___ my mother yesterday.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのとき英語を勉強していました。",
      "en": "They were studying English then.",
      "blank": "They ___ ___ English then.",
      "answer": "were studying",
      "choices": [
        "was",
        "were",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日英語を勉強していませんでした。",
      "en": "They were not studying English yesterday.",
      "blank": "They were ___ ___ English yesterday.",
      "answer": "not studying",
      "choices": [
        "not",
        "studying",
        "study",
        "studied"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのとき本を読んでいました。",
      "en": "They were reading books then.",
      "blank": "They ___ ___ books then.",
      "answer": "were reading",
      "choices": [
        "was",
        "were",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日本を読んでいませんでした。",
      "en": "They were not reading books yesterday.",
      "blank": "They were ___ ___ books yesterday.",
      "answer": "not reading",
      "choices": [
        "not",
        "reading",
        "read",
        "read"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのときテレビを見ていました。",
      "en": "They were watching TV then.",
      "blank": "They ___ ___ TV then.",
      "answer": "were watching",
      "choices": [
        "was",
        "were",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日テレビを見ていませんでした。",
      "en": "They were not watching TV yesterday.",
      "blank": "They were ___ ___ TV yesterday.",
      "answer": "not watching",
      "choices": [
        "not",
        "watching",
        "watch",
        "watched"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのとき音楽を聴いていました。",
      "en": "They were listening to music then.",
      "blank": "They ___ ___ music then.",
      "answer": "were listening to",
      "choices": [
        "was",
        "were",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日音楽を聴いていませんでした。",
      "en": "They were not listening to music yesterday.",
      "blank": "They were ___ ___ music yesterday.",
      "answer": "not listening to",
      "choices": [
        "not",
        "listening to",
        "listen to",
        "listened to"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのときピアノを弾いていました。",
      "en": "They were playing the piano then.",
      "blank": "They ___ ___ the piano then.",
      "answer": "were playing",
      "choices": [
        "was",
        "were",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日ピアノを弾いていませんでした。",
      "en": "They were not playing the piano yesterday.",
      "blank": "They were ___ ___ the piano yesterday.",
      "answer": "not playing",
      "choices": [
        "not",
        "playing",
        "play",
        "played"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    },
    {
      "jp": "彼らはそのとき母を手伝っていました。",
      "en": "They were helping my mother then.",
      "blank": "They ___ ___ my mother then.",
      "answer": "were helping",
      "choices": [
        "was",
        "were",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形は was / were + ing形で「〜していました」を表します。"
    },
    {
      "jp": "彼らは昨日母を手伝っていませんでした。",
      "en": "They were not helping my mother yesterday.",
      "blank": "They were ___ ___ my mother yesterday.",
      "answer": "not helping",
      "choices": [
        "not",
        "helping",
        "help",
        "helped"
      ],
      "explanation": "過去進行形の否定文は was / were not + ing形です。"
    }
  ],
  "接続詞 when": [
    {
      "jp": "私が帰宅したとき、母は夕食を作っていました。",
      "en": "When I came home, my mother was cooking dinner.",
      "blank": "___ I came home, my mother was cooking dinner.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で、2つの文をつなぎます。"
    },
    {
      "jp": "雨が降り始めたとき、私たちはサッカーをしていました。",
      "en": "When it started to rain, we were playing soccer.",
      "blank": "___ it started to rain, we were playing soccer.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で、2つの文をつなぎます。"
    },
    {
      "jp": "私が駅に着いたとき、彼は私を待っていました。",
      "en": "When I arrived at the station, he was waiting for me.",
      "blank": "___ I arrived at the station, he was waiting for me.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で、2つの文をつなぎます。"
    },
    {
      "jp": "電話が鳴ったとき、私は本を読んでいました。",
      "en": "When the phone rang, I was reading a book.",
      "blank": "___ the phone rang, I was reading a book.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で、2つの文をつなぎます。"
    },
    {
      "jp": "私が家を出たとき、雨が降り始めました。",
      "en": "When I left home, it started to rain.",
      "blank": "___ I left home, it started to rain.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "雨が降り始めました。そのとき、私が家を出た。",
      "en": "It started to rain when I left home.",
      "blank": "It started to rain ___ I left home.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "私が教室に入ったとき、先生は黒板を書いていました。",
      "en": "When I entered the classroom, the teacher was writing on the board.",
      "blank": "___ I entered the classroom, the teacher was writing on the board.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "先生は黒板を書いていました。そのとき、私が教室に入った。",
      "en": "The teacher was writing on the board when I entered the classroom.",
      "blank": "The teacher was writing on the board ___ I entered the classroom.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "彼が電話をくれたとき、私は英語を勉強していました。",
      "en": "When he called me, I was studying English.",
      "blank": "___ he called me, I was studying English.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "私は英語を勉強していました。そのとき、彼が電話をくれた。",
      "en": "I was studying english when he called me.",
      "blank": "I was studying english ___ he called me.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "私が駅に着いたとき、電車はすでに出ていました。",
      "en": "When I got to the station, the train had already left.",
      "blank": "___ I got to the station, the train had already left.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "電車はすでに出ていました。そのとき、私が駅に着いた。",
      "en": "The train had already left when I got to the station.",
      "blank": "The train had already left ___ I got to the station.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "彼女が帰宅したとき、母は夕食を作っていました。",
      "en": "When she came home, her mother was cooking dinner.",
      "blank": "___ she came home, her mother was cooking dinner.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "母は夕食を作っていました。そのとき、彼女が帰宅した。",
      "en": "Her mother was cooking dinner when she came home.",
      "blank": "Her mother was cooking dinner ___ she came home.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "ベルが鳴ったとき、生徒たちは席に着きました。",
      "en": "When the bell rang, the students sat down.",
      "blank": "___ the bell rang, the students sat down.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "生徒たちは席に着きました。そのとき、ベルが鳴った。",
      "en": "The students sat down when the bell rang.",
      "blank": "The students sat down ___ the bell rang.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "私がその知らせを聞いたとき、とても驚きました。",
      "en": "When I heard the news, I was very surprised.",
      "blank": "___ I heard the news, I was very surprised.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "とても驚きました。そのとき、私がその知らせを聞いた。",
      "en": "I was very surprised when I heard the news.",
      "blank": "I was very surprised ___ I heard the news.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "彼が部屋に入ったとき、みんなは静かになりました。",
      "en": "When he entered the room, everyone became quiet.",
      "blank": "___ he entered the room, everyone became quiet.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "みんなは静かになりました。そのとき、彼が部屋に入った。",
      "en": "Everyone became quiet when he entered the room.",
      "blank": "Everyone became quiet ___ he entered the room.",
      "answer": "when",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "雨が降り始めました。そのとき、私が家を出た。",
      "en": "It started to rain when I left home.",
      "blank": "___ started to rain when I left home.",
      "answer": "It",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "先生は黒板を書いていました。そのとき、私が教室に入った。",
      "en": "The teacher was writing on the board when I entered the classroom.",
      "blank": "___ teacher was writing on the board when I entered the classroom.",
      "answer": "The",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "私は英語を勉強していました。そのとき、彼が電話をくれた。",
      "en": "I was studying english when he called me.",
      "blank": "___ was studying english when he called me.",
      "answer": "I",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "電車はすでに出ていました。そのとき、私が駅に着いた。",
      "en": "The train had already left when I got to the station.",
      "blank": "___ train had already left when I got to the station.",
      "answer": "The",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "母は夕食を作っていました。そのとき、彼女が帰宅した。",
      "en": "Her mother was cooking dinner when she came home.",
      "blank": "___ mother was cooking dinner when she came home.",
      "answer": "Her",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "生徒たちは席に着きました。そのとき、ベルが鳴った。",
      "en": "The students sat down when the bell rang.",
      "blank": "___ students sat down when the bell rang.",
      "answer": "The",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "とても驚きました。そのとき、私がその知らせを聞いた。",
      "en": "I was very surprised when I heard the news.",
      "blank": "___ was very surprised when I heard the news.",
      "answer": "I",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "みんなは静かになりました。そのとき、彼が部屋に入った。",
      "en": "Everyone became quiet when he entered the room.",
      "blank": "___ became quiet when he entered the room.",
      "answer": "Everyone",
      "choices": [
        "when",
        "if",
        "because",
        "that"
      ],
      "explanation": "when は文の途中に置くこともできます。"
    },
    {
      "jp": "私がドアを開けたとき、犬が走ってきました。",
      "en": "When I opened the door, the dog ran to me.",
      "blank": "___ I opened the door, the dog ran to me.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "彼女がその歌を聞いたとき、泣きました。",
      "en": "When she heard the song, she cried.",
      "blank": "___ she heard the song, she cried.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "私たちが公園に着いたとき、雨がやみました。",
      "en": "When we arrived at the park, the rain stopped.",
      "blank": "___ we arrived at the park, the rain stopped.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "父が帰宅したとき、私は宿題をしていました。",
      "en": "When my father came home, I was doing my homework.",
      "blank": "___ my father came home, I was doing my homework.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "私が小学生だったとき、名古屋に住んでいました。",
      "en": "When I was an elementary school student, I lived in Nagoya.",
      "blank": "___ I was an elementary school student, I lived in Nagoya.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "彼が若かったとき、サッカーが得意でした。",
      "en": "When he was young, he was good at soccer.",
      "blank": "___ he was young, he was good at soccer.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "私が窓を見たとき、雪が降っていました。",
      "en": "When I looked out the window, it was snowing.",
      "blank": "___ I looked out the window, it was snowing.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    },
    {
      "jp": "彼女が名前を呼ばれたとき、立ち上がりました。",
      "en": "When her name was called, she stood up.",
      "blank": "___ her name was called, she stood up.",
      "answer": "When",
      "choices": [
        "When",
        "If",
        "Because",
        "That"
      ],
      "explanation": "when は「〜するとき」という意味で2つの文をつなぎます。"
    }
  ],
  "未来表現": [
    {
      "jp": "私は明日英語を勉強します。",
      "en": "I am going to study English tomorrow.",
      "blank": "I ___ ___ ___ study English tomorrow.",
      "answer": "am going to",
      "choices": [
        "am",
        "going",
        "to",
        "will",
        "study"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "私は明日英語を勉強しますつもりです。",
      "en": "I will study English tomorrow.",
      "blank": "I ___ ___ English tomorrow.",
      "answer": "will study",
      "choices": [
        "will",
        "study",
        "studies",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "私は明日英語を勉強しません。",
      "en": "I will not study English tomorrow.",
      "blank": "I ___ ___ ___ English tomorrow.",
      "answer": "will not study",
      "choices": [
        "will",
        "not",
        "study",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "私は明日本を読みます。",
      "en": "I am going to read books tomorrow.",
      "blank": "I ___ ___ ___ read books tomorrow.",
      "answer": "am going to",
      "choices": [
        "am",
        "going",
        "to",
        "will",
        "read"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "私は明日本を読みますつもりです。",
      "en": "I will read books tomorrow.",
      "blank": "I ___ ___ books tomorrow.",
      "answer": "will read",
      "choices": [
        "will",
        "read",
        "reads",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "私は明日本を読みません。",
      "en": "I will not read books tomorrow.",
      "blank": "I ___ ___ ___ books tomorrow.",
      "answer": "will not read",
      "choices": [
        "will",
        "not",
        "read",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "私は明日テレビを見ます。",
      "en": "I am going to watch TV tomorrow.",
      "blank": "I ___ ___ ___ watch TV tomorrow.",
      "answer": "am going to",
      "choices": [
        "am",
        "going",
        "to",
        "will",
        "watch"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "私は明日テレビを見ますつもりです。",
      "en": "I will watch TV tomorrow.",
      "blank": "I ___ ___ TV tomorrow.",
      "answer": "will watch",
      "choices": [
        "will",
        "watch",
        "watches",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "私は明日テレビを見ません。",
      "en": "I will not watch TV tomorrow.",
      "blank": "I ___ ___ ___ TV tomorrow.",
      "answer": "will not watch",
      "choices": [
        "will",
        "not",
        "watch",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "私は明日音楽を聴きます。",
      "en": "I am going to listen to music tomorrow.",
      "blank": "I ___ ___ ___ listen to music tomorrow.",
      "answer": "am going to",
      "choices": [
        "am",
        "going",
        "to",
        "will",
        "listen to"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "私は明日音楽を聴きますつもりです。",
      "en": "I will listen to music tomorrow.",
      "blank": "I ___ ___ music tomorrow.",
      "answer": "will listen to",
      "choices": [
        "will",
        "listen to",
        "listens to",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "私は明日音楽を聴きません。",
      "en": "I will not listen to music tomorrow.",
      "blank": "I ___ ___ ___ music tomorrow.",
      "answer": "will not listen to",
      "choices": [
        "will",
        "not",
        "listen to",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "私は明日ピアノを弾きます。",
      "en": "I am going to play the piano tomorrow.",
      "blank": "I ___ ___ ___ play the piano tomorrow.",
      "answer": "am going to",
      "choices": [
        "am",
        "going",
        "to",
        "will",
        "play"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "私は明日ピアノを弾きますつもりです。",
      "en": "I will play the piano tomorrow.",
      "blank": "I ___ ___ the piano tomorrow.",
      "answer": "will play",
      "choices": [
        "will",
        "play",
        "plays",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "私は明日ピアノを弾きません。",
      "en": "I will not play the piano tomorrow.",
      "blank": "I ___ ___ ___ the piano tomorrow.",
      "answer": "will not play",
      "choices": [
        "will",
        "not",
        "play",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "あなたは明日英語を勉強します。",
      "en": "You are going to study English tomorrow.",
      "blank": "You ___ ___ ___ study English tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "study"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "あなたは明日英語を勉強しますつもりです。",
      "en": "You will study English tomorrow.",
      "blank": "You ___ ___ English tomorrow.",
      "answer": "will study",
      "choices": [
        "will",
        "study",
        "studies",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "あなたは明日英語を勉強しません。",
      "en": "You will not study English tomorrow.",
      "blank": "You ___ ___ ___ English tomorrow.",
      "answer": "will not study",
      "choices": [
        "will",
        "not",
        "study",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "あなたは明日本を読みます。",
      "en": "You are going to read books tomorrow.",
      "blank": "You ___ ___ ___ read books tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "read"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "あなたは明日本を読みますつもりです。",
      "en": "You will read books tomorrow.",
      "blank": "You ___ ___ books tomorrow.",
      "answer": "will read",
      "choices": [
        "will",
        "read",
        "reads",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "あなたは明日本を読みません。",
      "en": "You will not read books tomorrow.",
      "blank": "You ___ ___ ___ books tomorrow.",
      "answer": "will not read",
      "choices": [
        "will",
        "not",
        "read",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "あなたは明日テレビを見ます。",
      "en": "You are going to watch TV tomorrow.",
      "blank": "You ___ ___ ___ watch TV tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "watch"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "あなたは明日テレビを見ますつもりです。",
      "en": "You will watch TV tomorrow.",
      "blank": "You ___ ___ TV tomorrow.",
      "answer": "will watch",
      "choices": [
        "will",
        "watch",
        "watches",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "あなたは明日テレビを見ません。",
      "en": "You will not watch TV tomorrow.",
      "blank": "You ___ ___ ___ TV tomorrow.",
      "answer": "will not watch",
      "choices": [
        "will",
        "not",
        "watch",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "あなたは明日音楽を聴きます。",
      "en": "You are going to listen to music tomorrow.",
      "blank": "You ___ ___ ___ listen to music tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "listen to"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "あなたは明日音楽を聴きますつもりです。",
      "en": "You will listen to music tomorrow.",
      "blank": "You ___ ___ music tomorrow.",
      "answer": "will listen to",
      "choices": [
        "will",
        "listen to",
        "listens to",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "あなたは明日音楽を聴きません。",
      "en": "You will not listen to music tomorrow.",
      "blank": "You ___ ___ ___ music tomorrow.",
      "answer": "will not listen to",
      "choices": [
        "will",
        "not",
        "listen to",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "あなたは明日ピアノを弾きます。",
      "en": "You are going to play the piano tomorrow.",
      "blank": "You ___ ___ ___ play the piano tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "play"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "あなたは明日ピアノを弾きますつもりです。",
      "en": "You will play the piano tomorrow.",
      "blank": "You ___ ___ the piano tomorrow.",
      "answer": "will play",
      "choices": [
        "will",
        "play",
        "plays",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "あなたは明日ピアノを弾きません。",
      "en": "You will not play the piano tomorrow.",
      "blank": "You ___ ___ ___ the piano tomorrow.",
      "answer": "will not play",
      "choices": [
        "will",
        "not",
        "play",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼は明日英語を勉強します。",
      "en": "He is going to study English tomorrow.",
      "blank": "He ___ ___ ___ study English tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "study"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼は明日英語を勉強しますつもりです。",
      "en": "He will study English tomorrow.",
      "blank": "He ___ ___ English tomorrow.",
      "answer": "will study",
      "choices": [
        "will",
        "study",
        "studies",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼は明日英語を勉強しません。",
      "en": "He will not study English tomorrow.",
      "blank": "He ___ ___ ___ English tomorrow.",
      "answer": "will not study",
      "choices": [
        "will",
        "not",
        "study",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼は明日本を読みます。",
      "en": "He is going to read books tomorrow.",
      "blank": "He ___ ___ ___ read books tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "read"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼は明日本を読みますつもりです。",
      "en": "He will read books tomorrow.",
      "blank": "He ___ ___ books tomorrow.",
      "answer": "will read",
      "choices": [
        "will",
        "read",
        "reads",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼は明日本を読みません。",
      "en": "He will not read books tomorrow.",
      "blank": "He ___ ___ ___ books tomorrow.",
      "answer": "will not read",
      "choices": [
        "will",
        "not",
        "read",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼は明日テレビを見ます。",
      "en": "He is going to watch TV tomorrow.",
      "blank": "He ___ ___ ___ watch TV tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "watch"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼は明日テレビを見ますつもりです。",
      "en": "He will watch TV tomorrow.",
      "blank": "He ___ ___ TV tomorrow.",
      "answer": "will watch",
      "choices": [
        "will",
        "watch",
        "watches",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼は明日テレビを見ません。",
      "en": "He will not watch TV tomorrow.",
      "blank": "He ___ ___ ___ TV tomorrow.",
      "answer": "will not watch",
      "choices": [
        "will",
        "not",
        "watch",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼は明日音楽を聴きます。",
      "en": "He is going to listen to music tomorrow.",
      "blank": "He ___ ___ ___ listen to music tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "listen to"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼は明日音楽を聴きますつもりです。",
      "en": "He will listen to music tomorrow.",
      "blank": "He ___ ___ music tomorrow.",
      "answer": "will listen to",
      "choices": [
        "will",
        "listen to",
        "listens to",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼は明日音楽を聴きません。",
      "en": "He will not listen to music tomorrow.",
      "blank": "He ___ ___ ___ music tomorrow.",
      "answer": "will not listen to",
      "choices": [
        "will",
        "not",
        "listen to",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼は明日ピアノを弾きます。",
      "en": "He is going to play the piano tomorrow.",
      "blank": "He ___ ___ ___ play the piano tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "play"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼は明日ピアノを弾きますつもりです。",
      "en": "He will play the piano tomorrow.",
      "blank": "He ___ ___ the piano tomorrow.",
      "answer": "will play",
      "choices": [
        "will",
        "play",
        "plays",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼は明日ピアノを弾きません。",
      "en": "He will not play the piano tomorrow.",
      "blank": "He ___ ___ ___ the piano tomorrow.",
      "answer": "will not play",
      "choices": [
        "will",
        "not",
        "play",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼女は明日英語を勉強します。",
      "en": "She is going to study English tomorrow.",
      "blank": "She ___ ___ ___ study English tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "study"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼女は明日英語を勉強しますつもりです。",
      "en": "She will study English tomorrow.",
      "blank": "She ___ ___ English tomorrow.",
      "answer": "will study",
      "choices": [
        "will",
        "study",
        "studies",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼女は明日英語を勉強しません。",
      "en": "She will not study English tomorrow.",
      "blank": "She ___ ___ ___ English tomorrow.",
      "answer": "will not study",
      "choices": [
        "will",
        "not",
        "study",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼女は明日本を読みます。",
      "en": "She is going to read books tomorrow.",
      "blank": "She ___ ___ ___ read books tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "read"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼女は明日本を読みますつもりです。",
      "en": "She will read books tomorrow.",
      "blank": "She ___ ___ books tomorrow.",
      "answer": "will read",
      "choices": [
        "will",
        "read",
        "reads",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼女は明日本を読みません。",
      "en": "She will not read books tomorrow.",
      "blank": "She ___ ___ ___ books tomorrow.",
      "answer": "will not read",
      "choices": [
        "will",
        "not",
        "read",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼女は明日テレビを見ます。",
      "en": "She is going to watch TV tomorrow.",
      "blank": "She ___ ___ ___ watch TV tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "watch"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼女は明日テレビを見ますつもりです。",
      "en": "She will watch TV tomorrow.",
      "blank": "She ___ ___ TV tomorrow.",
      "answer": "will watch",
      "choices": [
        "will",
        "watch",
        "watches",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼女は明日テレビを見ません。",
      "en": "She will not watch TV tomorrow.",
      "blank": "She ___ ___ ___ TV tomorrow.",
      "answer": "will not watch",
      "choices": [
        "will",
        "not",
        "watch",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼女は明日音楽を聴きます。",
      "en": "She is going to listen to music tomorrow.",
      "blank": "She ___ ___ ___ listen to music tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "listen to"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼女は明日音楽を聴きますつもりです。",
      "en": "She will listen to music tomorrow.",
      "blank": "She ___ ___ music tomorrow.",
      "answer": "will listen to",
      "choices": [
        "will",
        "listen to",
        "listens to",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼女は明日音楽を聴きません。",
      "en": "She will not listen to music tomorrow.",
      "blank": "She ___ ___ ___ music tomorrow.",
      "answer": "will not listen to",
      "choices": [
        "will",
        "not",
        "listen to",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼女は明日ピアノを弾きます。",
      "en": "She is going to play the piano tomorrow.",
      "blank": "She ___ ___ ___ play the piano tomorrow.",
      "answer": "is going to",
      "choices": [
        "is",
        "going",
        "to",
        "will",
        "play"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼女は明日ピアノを弾きますつもりです。",
      "en": "She will play the piano tomorrow.",
      "blank": "She ___ ___ the piano tomorrow.",
      "answer": "will play",
      "choices": [
        "will",
        "play",
        "plays",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼女は明日ピアノを弾きません。",
      "en": "She will not play the piano tomorrow.",
      "blank": "She ___ ___ ___ the piano tomorrow.",
      "answer": "will not play",
      "choices": [
        "will",
        "not",
        "play",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼らは明日英語を勉強します。",
      "en": "They are going to study English tomorrow.",
      "blank": "They ___ ___ ___ study English tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "study"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼らは明日英語を勉強しますつもりです。",
      "en": "They will study English tomorrow.",
      "blank": "They ___ ___ English tomorrow.",
      "answer": "will study",
      "choices": [
        "will",
        "study",
        "studies",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼らは明日英語を勉強しません。",
      "en": "They will not study English tomorrow.",
      "blank": "They ___ ___ ___ English tomorrow.",
      "answer": "will not study",
      "choices": [
        "will",
        "not",
        "study",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼らは明日本を読みます。",
      "en": "They are going to read books tomorrow.",
      "blank": "They ___ ___ ___ read books tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "read"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼らは明日本を読みますつもりです。",
      "en": "They will read books tomorrow.",
      "blank": "They ___ ___ books tomorrow.",
      "answer": "will read",
      "choices": [
        "will",
        "read",
        "reads",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼らは明日本を読みません。",
      "en": "They will not read books tomorrow.",
      "blank": "They ___ ___ ___ books tomorrow.",
      "answer": "will not read",
      "choices": [
        "will",
        "not",
        "read",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼らは明日テレビを見ます。",
      "en": "They are going to watch TV tomorrow.",
      "blank": "They ___ ___ ___ watch TV tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "watch"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼らは明日テレビを見ますつもりです。",
      "en": "They will watch TV tomorrow.",
      "blank": "They ___ ___ TV tomorrow.",
      "answer": "will watch",
      "choices": [
        "will",
        "watch",
        "watches",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼らは明日テレビを見ません。",
      "en": "They will not watch TV tomorrow.",
      "blank": "They ___ ___ ___ TV tomorrow.",
      "answer": "will not watch",
      "choices": [
        "will",
        "not",
        "watch",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼らは明日音楽を聴きます。",
      "en": "They are going to listen to music tomorrow.",
      "blank": "They ___ ___ ___ listen to music tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "listen to"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼らは明日音楽を聴きますつもりです。",
      "en": "They will listen to music tomorrow.",
      "blank": "They ___ ___ music tomorrow.",
      "answer": "will listen to",
      "choices": [
        "will",
        "listen to",
        "listens to",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼らは明日音楽を聴きません。",
      "en": "They will not listen to music tomorrow.",
      "blank": "They ___ ___ ___ music tomorrow.",
      "answer": "will not listen to",
      "choices": [
        "will",
        "not",
        "listen to",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    },
    {
      "jp": "彼らは明日ピアノを弾きます。",
      "en": "They are going to play the piano tomorrow.",
      "blank": "They ___ ___ ___ play the piano tomorrow.",
      "answer": "are going to",
      "choices": [
        "are",
        "going",
        "to",
        "will",
        "play"
      ],
      "explanation": "be going to + 動詞の原形で未来の予定を表します。"
    },
    {
      "jp": "彼らは明日ピアノを弾きますつもりです。",
      "en": "They will play the piano tomorrow.",
      "blank": "They ___ ___ the piano tomorrow.",
      "answer": "will play",
      "choices": [
        "will",
        "play",
        "plays",
        "going"
      ],
      "explanation": "will + 動詞の原形で未来のことを表します。"
    },
    {
      "jp": "彼らは明日ピアノを弾きません。",
      "en": "They will not play the piano tomorrow.",
      "blank": "They ___ ___ ___ the piano tomorrow.",
      "answer": "will not play",
      "choices": [
        "will",
        "not",
        "play",
        "does"
      ],
      "explanation": "will の否定文は will not + 動詞の原形です。"
    }
  ],
  "接続詞 if": [
    {
      "jp": "もし明日晴れたら、私はテニスをします。",
      "en": "If it is sunny tomorrow, I will play tennis.",
      "blank": "___ it is sunny tomorrow, I will play tennis.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という意味で、条件を表します。"
    },
    {
      "jp": "もし時間があれば、私はあなたを手伝います。",
      "en": "If I have time, I will help you.",
      "blank": "___ I have time, I will help you.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という意味で、条件を表します。"
    },
    {
      "jp": "もし雨が降ったら、私たちは家にいます。",
      "en": "If it rains, we will stay home.",
      "blank": "___ it rains, we will stay home.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という意味で、条件を表します。"
    },
    {
      "jp": "もし早く起きたら、私は朝食を作ります。",
      "en": "If I get up early, I will make breakfast.",
      "blank": "___ I get up early, I will make breakfast.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という意味で、条件を表します。"
    },
    {
      "jp": "私はテニスをします、もし明日晴れるなら。",
      "en": "I will play tennis if it is sunny tomorrow.",
      "blank": "I will play tennis ___ it is sunny tomorrow.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "あなたを手伝います、もし時間があるなら。",
      "en": "I will help you if I have time.",
      "blank": "I will help you ___ I have time.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "私たちは家にいます、もし雨が降るなら。",
      "en": "We will stay home if it rains.",
      "blank": "We will stay home ___ it rains.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "朝食を作ります、もし早く起きるなら。",
      "en": "I will make breakfast if I get up early.",
      "blank": "I will make breakfast ___ I get up early.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "もし彼女が来るなら、私たちは会議を始めます。",
      "en": "If she comes, we will start the meeting.",
      "blank": "___ she comes, we will start the meeting.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "私たちは会議を始めます、もし彼女が来るなら。",
      "en": "We will start the meeting if she comes.",
      "blank": "We will start the meeting ___ she comes.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "もしこの本を読むなら、英語が好きになります。",
      "en": "If you read this book, you will like English.",
      "blank": "___ you read this book, you will like English.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "英語が好きになります、もしこの本を読むなら。",
      "en": "You will like english if you read this book.",
      "blank": "You will like english ___ you read this book.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "もし練習を続けるなら、上手になります。",
      "en": "If you keep practicing, you will get better.",
      "blank": "___ you keep practicing, you will get better.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "上手になります、もし練習を続けるなら。",
      "en": "You will get better if you keep practicing.",
      "blank": "You will get better ___ you keep practicing.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "もし道に迷うなら、私に電話してください。",
      "en": "If you get lost, call me.",
      "blank": "___ you get lost, call me.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "私に電話してください、もし道に迷うなら。",
      "en": "Call me if you get lost.",
      "blank": "Call me ___ you get lost.",
      "answer": "if",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "私はテニスをします、もし明日晴れるなら。",
      "en": "I will play tennis if it is sunny tomorrow.",
      "blank": "___ will play tennis if it is sunny tomorrow.",
      "answer": "I",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "あなたを手伝います、もし時間があるなら。",
      "en": "I will help you if I have time.",
      "blank": "___ will help you if I have time.",
      "answer": "I",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "私たちは家にいます、もし雨が降るなら。",
      "en": "We will stay home if it rains.",
      "blank": "___ will stay home if it rains.",
      "answer": "We",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "朝食を作ります、もし早く起きるなら。",
      "en": "I will make breakfast if I get up early.",
      "blank": "___ will make breakfast if I get up early.",
      "answer": "I",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "私たちは会議を始めます、もし彼女が来るなら。",
      "en": "We will start the meeting if she comes.",
      "blank": "___ will start the meeting if she comes.",
      "answer": "We",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "英語が好きになります、もしこの本を読むなら。",
      "en": "You will like english if you read this book.",
      "blank": "___ will like english if you read this book.",
      "answer": "You",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "上手になります、もし練習を続けるなら。",
      "en": "You will get better if you keep practicing.",
      "blank": "___ will get better if you keep practicing.",
      "answer": "You",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "私に電話してください、もし道に迷うなら。",
      "en": "Call me if you get lost.",
      "blank": "___ me if you get lost.",
      "answer": "Call",
      "choices": [
        "if",
        "when",
        "because",
        "that"
      ],
      "explanation": "if節は文の後ろに置くこともできます。"
    },
    {
      "jp": "もし明日時間があれば、映画を見ます。",
      "en": "If I have time tomorrow, I will watch a movie.",
      "blank": "___ I have time tomorrow, I will watch a movie.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし彼が忙しければ、私が手伝います。",
      "en": "If he is busy, I will help him.",
      "blank": "___ he is busy, I will help him.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もしこの本を読み終えたら、あなたに貸します。",
      "en": "If I finish reading this book, I will lend it to you.",
      "blank": "___ I finish reading this book, I will lend it to you.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし電車に乗り遅れたら、先生に電話します。",
      "en": "If I miss the train, I will call my teacher.",
      "blank": "___ I miss the train, I will call my teacher.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし英語を毎日聞けば、リスニングが上達します。",
      "en": "If you listen to English every day, your listening will get better.",
      "blank": "___ you listen to English every day, your listening will get better.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし宿題が終わったら、外で遊べます。",
      "en": "If you finish your homework, you can play outside.",
      "blank": "___ you finish your homework, you can play outside.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし寒ければ、窓を閉めてください。",
      "en": "If it is cold, please close the window.",
      "blank": "___ it is cold, please close the window.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし質問があれば、私に聞いてください。",
      "en": "If you have a question, please ask me.",
      "blank": "___ you have a question, please ask me.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし道に迷ったら、この地図を使ってください。",
      "en": "If you get lost, please use this map.",
      "blank": "___ you get lost, please use this map.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    },
    {
      "jp": "もし明日雨なら、試合は中止になります。",
      "en": "If it is rainy tomorrow, the game will be canceled.",
      "blank": "___ it is rainy tomorrow, the game will be canceled.",
      "answer": "If",
      "choices": [
        "If",
        "When",
        "Because",
        "That"
      ],
      "explanation": "if は「もし〜なら」という条件を表します。"
    }
  ],
  "助動詞・必要を表す文": [
    {
      "jp": "私はここで写真を撮ってもよいです。",
      "en": "I may take pictures here.",
      "blank": "I ___ take pictures here.",
      "answer": "may",
      "choices": [
        "may",
        "must",
        "have",
        "will"
      ],
      "explanation": "may は「〜してもよい」を表します。"
    },
    {
      "jp": "窓を開けましょうか。",
      "en": "Shall I open the window?",
      "blank": "___ I open the window?",
      "answer": "Shall",
      "choices": [
        "Shall",
        "May",
        "Must",
        "Have"
      ],
      "explanation": "Shall I ...? で「〜しましょうか」と申し出ることができます。"
    },
    {
      "jp": "あなたは宿題をしなければなりません。",
      "en": "You must do your homework.",
      "blank": "You ___ ___ your homework.",
      "answer": "must do",
      "choices": [
        "must",
        "do",
        "does",
        "to"
      ],
      "explanation": "must + 動詞の原形で「〜しなければならない」を表します。"
    },
    {
      "jp": "彼は早く起きなければなりません。",
      "en": "He has to get up early.",
      "blank": "He ___ ___ get up early.",
      "answer": "has to",
      "choices": [
        "has",
        "to",
        "have",
        "must"
      ],
      "explanation": "have to は主語に合わせて has to になることがあります。"
    },
    {
      "jp": "あなたはここで走ってはいけません。",
      "en": "You must not run here.",
      "blank": "You ___ ___ run here.",
      "answer": "must not",
      "choices": [
        "must",
        "not",
        "don't",
        "have"
      ],
      "explanation": "must not は「〜してはいけない」を表します。"
    },
    {
      "jp": "あなたは今日勉強しなければなりませんか。",
      "en": "Do you have to study today?",
      "blank": "___ you ___ ___ study today?",
      "answer": "Do have to",
      "choices": [
        "Do",
        "have",
        "to",
        "Does"
      ],
      "explanation": "have to の疑問文は Do / Does を使います。"
    },
    {
      "jp": "彼は今日勉強しなければなりませんか。",
      "en": "Does he have to study today?",
      "blank": "___ he ___ ___ study today?",
      "answer": "Does have to",
      "choices": [
        "Does",
        "have",
        "to",
        "Do"
      ],
      "explanation": "三人称単数でも、Does の後ろは have to です。"
    },
    {
      "jp": "あなたは今日出かける必要はありません。",
      "en": "You don't have to go out today.",
      "blank": "You ___ ___ ___ go out today.",
      "answer": "don't have to",
      "choices": [
        "don't",
        "have",
        "to",
        "must"
      ],
      "explanation": "don't have to は「〜する必要はない」を表します。"
    },
    {
      "jp": "私はここで待ってもよいですか。",
      "en": "May I wait here?",
      "blank": "___ I wait here?",
      "answer": "May",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼女は今日早く帰ってもよいです。",
      "en": "She may go home early today.",
      "blank": "She ___ go home early today.",
      "answer": "may",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "私たちは規則を守らなければなりません。",
      "en": "We must follow the rules.",
      "blank": "We ___ ___ the rules.",
      "answer": "must follow",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼は今すぐ出発しなければなりません。",
      "en": "He must leave now.",
      "blank": "He ___ ___ now.",
      "answer": "must leave",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "あなたはここでスマホを使ってはいけません。",
      "en": "You must not use your phone here.",
      "blank": "You ___ ___ use your phone here.",
      "answer": "must not",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼女は今日学校へ行く必要はありません。",
      "en": "She does not have to go to school today.",
      "blank": "She ___ ___ ___ ___ go to school today.",
      "answer": "does not have to",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "私たちは制服を着なければなりませんか。",
      "en": "Do we have to wear uniforms?",
      "blank": "___ we ___ ___ wear uniforms?",
      "answer": "Do have to",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼は明日早く起きなければなりませんか。",
      "en": "Does he have to get up early tomorrow?",
      "blank": "___ he ___ ___ get up early tomorrow?",
      "answer": "Does have to",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "窓を閉めましょうか。",
      "en": "Shall I close the window?",
      "blank": "___ I close the window?",
      "answer": "Shall",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "一緒に昼食を食べましょうか。",
      "en": "Shall we have lunch together?",
      "blank": "___ we have lunch together?",
      "answer": "Shall",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "私はもっと速く走ることができます。",
      "en": "I can run faster.",
      "blank": "I ___ run faster.",
      "answer": "can",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼女は英語で手紙を書くことができます。",
      "en": "She can write a letter in English.",
      "blank": "She ___ write a letter in English.",
      "answer": "can",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "私はここで写真を撮ってもよいです。",
      "en": "I may take pictures here.",
      "blank": "___ may take pictures here.",
      "answer": "I",
      "choices": [
        "may",
        "must",
        "have",
        "will"
      ],
      "explanation": "may は「〜してもよい」を表します。"
    },
    {
      "jp": "あなたは宿題をしなければなりません。",
      "en": "You must do your homework.",
      "blank": "You must ___ your homework.",
      "answer": "do",
      "choices": [
        "must",
        "do",
        "does",
        "to"
      ],
      "explanation": "must + 動詞の原形で「〜しなければならない」を表します。"
    },
    {
      "jp": "彼は早く起きなければなりません。",
      "en": "He has to get up early.",
      "blank": "He has ___ get up early.",
      "answer": "to",
      "choices": [
        "has",
        "to",
        "have",
        "must"
      ],
      "explanation": "have to は主語に合わせて has to になることがあります。"
    },
    {
      "jp": "あなたはここで走ってはいけません。",
      "en": "You must not run here.",
      "blank": "You must ___ run here.",
      "answer": "not",
      "choices": [
        "must",
        "not",
        "don't",
        "have"
      ],
      "explanation": "must not は「〜してはいけない」を表します。"
    },
    {
      "jp": "あなたは今日勉強しなければなりませんか。",
      "en": "Do you have to study today?",
      "blank": "Do you have ___ study today?",
      "answer": "to",
      "choices": [
        "Do",
        "have",
        "to",
        "Does"
      ],
      "explanation": "have to の疑問文は Do / Does を使います。"
    },
    {
      "jp": "彼は今日勉強しなければなりませんか。",
      "en": "Does he have to study today?",
      "blank": "Does he have ___ study today?",
      "answer": "to",
      "choices": [
        "Does",
        "have",
        "to",
        "Do"
      ],
      "explanation": "三人称単数でも、Does の後ろは have to です。"
    },
    {
      "jp": "あなたは今日出かける必要はありません。",
      "en": "You don't have to go out today.",
      "blank": "You don't have ___ go out today.",
      "answer": "to",
      "choices": [
        "don't",
        "have",
        "to",
        "must"
      ],
      "explanation": "don't have to は「〜する必要はない」を表します。"
    },
    {
      "jp": "彼女は今日早く帰ってもよいです。",
      "en": "She may go home early today.",
      "blank": "___ may go home early today.",
      "answer": "She",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "私たちは規則を守らなければなりません。",
      "en": "We must follow the rules.",
      "blank": "We must ___ the rules.",
      "answer": "follow",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    },
    {
      "jp": "彼は今すぐ出発しなければなりません。",
      "en": "He must leave now.",
      "blank": "He must ___ now.",
      "answer": "leave",
      "choices": [
        "can",
        "may",
        "must",
        "not",
        "have",
        "to",
        "Do",
        "Does",
        "Shall"
      ],
      "explanation": "助動詞・have to は、意味と主語に合わせて形を選びます。"
    }
  ],
  "不定詞・動名詞": [
    {
      "jp": "私は英語を勉強したいです。",
      "en": "I want to study English.",
      "blank": "I want ___ ___ English.",
      "answer": "to study",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は本を読むために図書館へ行きました。",
      "en": "I went to the library to read books.",
      "blank": "I went to the library ___ ___ books.",
      "answer": "to read",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は何か飲むものがほしいです。",
      "en": "I want something to drink.",
      "blank": "I want something ___ ___.",
      "answer": "to drink",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "英語を勉強することは大切です。",
      "en": "To study English is important.",
      "blank": "___ ___ English is important.",
      "answer": "To study",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は本を読むことが好きです。",
      "en": "I like reading books.",
      "blank": "I like ___ books.",
      "answer": "reading",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "彼女はピアノを弾くことを楽しみます。",
      "en": "She enjoys playing the piano.",
      "blank": "She enjoys ___ the piano.",
      "answer": "playing",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "テレビを見すぎることはよくありません。",
      "en": "Watching TV too much is not good.",
      "blank": "___ TV too much is not good.",
      "answer": "Watching",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は夕食を作り終えました。",
      "en": "I finished cooking dinner.",
      "blank": "I finished ___ dinner.",
      "answer": "cooking",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は英語を勉強することが好きです。",
      "en": "I like to study English.",
      "blank": "I like ___ ___",
      "answer": "to study",
      "choices": [
        "to",
        "study",
        "studying"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は本を読むことが好きです。",
      "en": "I like to read books.",
      "blank": "I like ___ ___",
      "answer": "to read",
      "choices": [
        "to",
        "read",
        "reading"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私はピアノを弾くことが好きです。",
      "en": "I like to play the piano.",
      "blank": "I like ___ ___",
      "answer": "to play",
      "choices": [
        "to",
        "play",
        "playing"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は音楽を聴くことが好きです。",
      "en": "I like to listen to music.",
      "blank": "I like ___ ___",
      "answer": "to listen",
      "choices": [
        "to",
        "listen",
        "listening"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は夕食を作ることが好きです。",
      "en": "I like to cook dinner.",
      "blank": "I like ___ ___",
      "answer": "to cook",
      "choices": [
        "to",
        "cook",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は部屋を掃除することが好きです。",
      "en": "I like to clean my room.",
      "blank": "I like ___ ___",
      "answer": "to clean",
      "choices": [
        "to",
        "clean",
        "cleaning"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は早く起きることが好きです。",
      "en": "I like to get up early.",
      "blank": "I like ___ ___",
      "answer": "to get",
      "choices": [
        "to",
        "get",
        "geting"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私は友達を手伝うことが好きです。",
      "en": "I like to help my friend.",
      "blank": "I like ___ ___",
      "answer": "to help",
      "choices": [
        "to",
        "help",
        "helping"
      ],
      "explanation": "不定詞は to + 動詞の原形で「〜すること」を表します。"
    },
    {
      "jp": "私はもっと上手に英語を話したいです。",
      "en": "I want to speak English better.",
      "blank": "I want ___ ___ English better.",
      "answer": "to speak",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "彼は医者になるために一生懸命勉強しています。",
      "en": "He studies hard to be a doctor.",
      "blank": "He studies hard ___ ___ a doctor.",
      "answer": "to be",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "私は何か冷たいものを飲みたいです。",
      "en": "I want something cold to drink.",
      "blank": "I want something cold ___ ___.",
      "answer": "to drink",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "彼女は走ることが好きです。",
      "en": "She likes running.",
      "blank": "She likes ___.",
      "answer": "running",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "彼は写真を撮ることを楽しみます。",
      "en": "He enjoys taking pictures.",
      "blank": "He enjoys ___ pictures.",
      "answer": "taking",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "早く寝ることは大切です。",
      "en": "Going to bed early is important.",
      "blank": "___ to bed early is important.",
      "answer": "Going",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "私は英語を聞くことが好きです。",
      "en": "I like listening to English.",
      "blank": "I like ___ ___ English.",
      "answer": "listening to",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "彼女はケーキを作り終えました。",
      "en": "She finished making a cake.",
      "blank": "She finished ___ a cake.",
      "answer": "making",
      "choices": [
        "to",
        "speak",
        "be",
        "drink",
        "running",
        "taking",
        "Going",
        "listening",
        "making"
      ],
      "explanation": "不定詞と動名詞は、文の中で「〜すること」や目的を表します。"
    },
    {
      "jp": "私は英語を勉強したいです。",
      "en": "I want to study English.",
      "blank": "I want to ___ English.",
      "answer": "study",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は本を読むために図書館へ行きました。",
      "en": "I went to the library to read books.",
      "blank": "I went to the library to ___ books.",
      "answer": "read",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は何か飲むものがほしいです。",
      "en": "I want something to drink.",
      "blank": "I want something to ___.",
      "answer": "drink",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "英語を勉強することは大切です。",
      "en": "To study English is important.",
      "blank": "To ___ English is important.",
      "answer": "study",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "私は本を読むことが好きです。",
      "en": "I like reading books.",
      "blank": "___ like reading books.",
      "answer": "I",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    },
    {
      "jp": "彼女はピアノを弾くことを楽しみます。",
      "en": "She enjoys playing the piano.",
      "blank": "___ enjoys playing the piano.",
      "answer": "She",
      "choices": [
        "to",
        "study",
        "read",
        "reading",
        "playing",
        "cooking"
      ],
      "explanation": "不定詞は to + 動詞の原形、動名詞は動詞のing形で「〜すること」を表します。"
    }
  ],
  "人にものを渡す・伝える文": [
    {
      "jp": "私は彼に本をあげました。",
      "en": "I gave him a book.",
      "blank": "I ___ ___ a book.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "彼女は私に写真を見せました。",
      "en": "She showed me a picture.",
      "blank": "She ___ ___ a picture.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "母は私にその話を話してくれました。",
      "en": "My mother told me the story.",
      "blank": "My mother ___ ___ the story.",
      "answer": "told me",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "彼は妹にかばんを買いました。",
      "en": "He bought his sister a bag.",
      "blank": "He ___ his sister a bag.",
      "answer": "bought",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私はあなたにメールを送りました。",
      "en": "I sent you an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "sent you",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "先生は私たちに英語を教えます。",
      "en": "Our teacher teaches us English.",
      "blank": "Our teacher ___ ___ English.",
      "answer": "teaches us",
      "choices": [
        "gave",
        "showed",
        "told",
        "bought",
        "sent",
        "teaches",
        "me",
        "him",
        "us"
      ],
      "explanation": "give / show / tell / buy などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に本をあげました。",
      "en": "I gave me a book.",
      "blank": "I ___ ___ a book.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に本を見せました。",
      "en": "I showed me a book.",
      "blank": "I ___ ___ a book.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に本を送りました。",
      "en": "I sent me a book.",
      "blank": "I ___ ___ a book.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に写真をあげました。",
      "en": "I gave me a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に写真を見せました。",
      "en": "I showed me a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に写真を送りました。",
      "en": "I sent me a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に手紙をあげました。",
      "en": "I gave me a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に手紙を見せました。",
      "en": "I showed me a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私に手紙を送りました。",
      "en": "I sent me a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にかばんをあげました。",
      "en": "I gave me a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にかばんを見せました。",
      "en": "I showed me a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にかばんを送りました。",
      "en": "I sent me a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にメールをあげました。",
      "en": "I gave me an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にメールを見せました。",
      "en": "I showed me an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にメールを送りました。",
      "en": "I sent me an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にプレゼントをあげました。",
      "en": "I gave me a present.",
      "blank": "I ___ ___ a present.",
      "answer": "gave me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にプレゼントを見せました。",
      "en": "I showed me a present.",
      "blank": "I ___ ___ a present.",
      "answer": "showed me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は私にプレゼントを送りました。",
      "en": "I sent me a present.",
      "blank": "I ___ ___ a present.",
      "answer": "sent me",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に本を見せました。",
      "en": "I showed him a book.",
      "blank": "I ___ ___ a book.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に本を送りました。",
      "en": "I sent him a book.",
      "blank": "I ___ ___ a book.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に写真をあげました。",
      "en": "I gave him a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に写真を見せました。",
      "en": "I showed him a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に写真を送りました。",
      "en": "I sent him a picture.",
      "blank": "I ___ ___ a picture.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に手紙をあげました。",
      "en": "I gave him a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に手紙を見せました。",
      "en": "I showed him a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼に手紙を送りました。",
      "en": "I sent him a letter.",
      "blank": "I ___ ___ a letter.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にかばんをあげました。",
      "en": "I gave him a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にかばんを見せました。",
      "en": "I showed him a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にかばんを送りました。",
      "en": "I sent him a bag.",
      "blank": "I ___ ___ a bag.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にメールをあげました。",
      "en": "I gave him an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にメールを見せました。",
      "en": "I showed him an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にメールを送りました。",
      "en": "I sent him an e-mail.",
      "blank": "I ___ ___ an e-mail.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にプレゼントをあげました。",
      "en": "I gave him a present.",
      "blank": "I ___ ___ a present.",
      "answer": "gave him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にプレゼントを見せました。",
      "en": "I showed him a present.",
      "blank": "I ___ ___ a present.",
      "answer": "showed him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼にプレゼントを送りました。",
      "en": "I sent him a present.",
      "blank": "I ___ ___ a present.",
      "answer": "sent him",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼女に本をあげました。",
      "en": "I gave her a book.",
      "blank": "I ___ ___ a book.",
      "answer": "gave her",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    },
    {
      "jp": "私は彼女に本を見せました。",
      "en": "I showed her a book.",
      "blank": "I ___ ___ a book.",
      "answer": "showed her",
      "choices": [
        "gave",
        "showed",
        "sent",
        "me",
        "him",
        "her",
        "us",
        "them"
      ],
      "explanation": "give / show / send などは「人にものを〜する」という形で使えます。"
    }
  ],
  "前置詞の基本": [
    {
      "jp": "猫はテーブルの下にいます。",
      "en": "The cat is under the table.",
      "blank": "The cat is ___ the table.",
      "answer": "under",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "本は机の上にあります。",
      "en": "The book is on the desk.",
      "blank": "The book is ___ the desk.",
      "answer": "on",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は7時に起きます。",
      "en": "I get up at seven.",
      "blank": "I get up ___ seven.",
      "answer": "at",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は日曜日にテニスをします。",
      "en": "I play tennis on Sundays.",
      "blank": "I play tennis ___ Sundays.",
      "answer": "on",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は6月に京都を訪れました。",
      "en": "I visited Kyoto in June.",
      "blank": "I visited Kyoto ___ June.",
      "answer": "in",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は友達を待っています。",
      "en": "I am waiting for my friend.",
      "blank": "I am waiting ___ my friend.",
      "answer": "for",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は音楽に興味があります。",
      "en": "I am interested in music.",
      "blank": "I am interested ___ music.",
      "answer": "in",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "彼は英語が得意です。",
      "en": "He is good at English.",
      "blank": "He is good ___ English.",
      "answer": "at",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "彼はバスで学校へ行きます。",
      "en": "He goes to school by bus.",
      "blank": "He goes to school ___ bus.",
      "answer": "by",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私は友達と公園へ行きます。",
      "en": "I go to the park with my friend.",
      "blank": "I go to the park ___ my friend.",
      "answer": "with",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私は母のために夕食を作ります。",
      "en": "I cook dinner for my mother.",
      "blank": "I cook dinner ___ my mother.",
      "answer": "for",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "彼女は8時から9時まで勉強します。",
      "en": "She studies from eight to nine.",
      "blank": "She studies ___ eight ___ nine.",
      "answer": "from to",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私は日曜日の朝に走ります。",
      "en": "I run on Sunday morning.",
      "blank": "I run ___ Sunday morning.",
      "answer": "on",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "その店は駅の前にあります。",
      "en": "The shop is in front of the station.",
      "blank": "The shop is ___ ___ ___ the station.",
      "answer": "in front of",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "猫は箱の中にいます。",
      "en": "The cat is in the box.",
      "blank": "The cat is ___ the box.",
      "answer": "in",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "鳥は木の上にいます。",
      "en": "The bird is in the tree.",
      "blank": "The bird is ___ the tree.",
      "answer": "in",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "彼は私に話しかけました。",
      "en": "He talked to me.",
      "blank": "He talked ___ me.",
      "answer": "to",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私はその答えについて考えました。",
      "en": "I thought about the answer.",
      "blank": "I thought ___ the answer.",
      "answer": "about",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "猫はテーブルの下にいます。",
      "en": "The cat is under the table.",
      "blank": "___ cat is under the table.",
      "answer": "The",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "本は机の上にあります。",
      "en": "The book is on the desk.",
      "blank": "___ book is on the desk.",
      "answer": "The",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は7時に起きます。",
      "en": "I get up at seven.",
      "blank": "___ get up at seven.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は日曜日にテニスをします。",
      "en": "I play tennis on Sundays.",
      "blank": "___ play tennis on Sundays.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は6月に京都を訪れました。",
      "en": "I visited Kyoto in June.",
      "blank": "___ visited Kyoto in June.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は友達を待っています。",
      "en": "I am waiting for my friend.",
      "blank": "___ am waiting for my friend.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "私は音楽に興味があります。",
      "en": "I am interested in music.",
      "blank": "___ am interested in music.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "彼は英語が得意です。",
      "en": "He is good at English.",
      "blank": "___ is good at English.",
      "answer": "He",
      "choices": [
        "in",
        "on",
        "at",
        "under",
        "for",
        "to",
        "with"
      ],
      "explanation": "前置詞は、場所・時・動詞とのつながりを表します。"
    },
    {
      "jp": "彼はバスで学校へ行きます。",
      "en": "He goes to school by bus.",
      "blank": "___ goes to school by bus.",
      "answer": "He",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私は友達と公園へ行きます。",
      "en": "I go to the park with my friend.",
      "blank": "___ go to the park with my friend.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "私は母のために夕食を作ります。",
      "en": "I cook dinner for my mother.",
      "blank": "___ cook dinner for my mother.",
      "answer": "I",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    },
    {
      "jp": "彼女は8時から9時まで勉強します。",
      "en": "She studies from eight to nine.",
      "blank": "She studies from eight ___ nine.",
      "answer": "to",
      "choices": [
        "in",
        "on",
        "at",
        "by",
        "with",
        "for",
        "from",
        "to",
        "about"
      ],
      "explanation": "前置詞は場所・時・方法・相手などを表します。"
    }
  ],
  "接続詞と文をつなぐ表現": [
    {
      "jp": "私は疲れていたので、早く寝ました。",
      "en": "I went to bed early because I was tired.",
      "blank": "I went to bed early ___ I was tired.",
      "answer": "because",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "彼女は英語が好きだと思います。",
      "en": "I think that she likes English.",
      "blank": "I think ___ she likes English.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は彼が正しいと確信しています。",
      "en": "I am sure that he is right.",
      "blank": "I am sure ___ he is right.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "彼はその本がおもしろいと言いました。",
      "en": "He said that the book was interesting.",
      "blank": "He said ___ the book was interesting.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は忙しいですが、あなたを手伝います。",
      "en": "I am busy, but I will help you.",
      "blank": "I am busy, ___ I will help you.",
      "answer": "but",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "早く起きなさい。そうすれば朝食を食べられます。",
      "en": "Get up early, and you can eat breakfast.",
      "blank": "Get up early, ___ you can eat breakfast.",
      "answer": "and",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "一生懸命勉強しなさい。そうしないと試験に落ちます。",
      "en": "Study hard, or you will fail the test.",
      "blank": "Study hard, ___ you will fail the test.",
      "answer": "or",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は眠かったので、早く寝ました。",
      "en": "I went to bed early because I was sleepy.",
      "blank": "I went to bed early ___ I was sleepy.",
      "answer": "because",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼は病気だったので、学校を休みました。",
      "en": "He was absent from school because he was sick.",
      "blank": "He was absent from school ___ he was sick.",
      "answer": "because",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私は彼女が親切だと思います。",
      "en": "I think that she is kind.",
      "blank": "I think ___ she is kind.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼は英語が大切だと思っています。",
      "en": "He thinks that English is important.",
      "blank": "He thinks ___ English is important.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私はあなたがうまくいくと確信しています。",
      "en": "I am sure that you will do well.",
      "blank": "I am sure ___ you will do well.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼女はその話が本当だと確信しています。",
      "en": "She is sure that the story is true.",
      "blank": "She is sure ___ the story is true.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私は疲れていましたが、宿題をしました。",
      "en": "I was tired, but I did my homework.",
      "blank": "I was tired, ___ I did my homework.",
      "answer": "but",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "急ぎなさい、そうすれば間に合います。",
      "en": "Hurry up, and you will be in time.",
      "blank": "Hurry up, ___ you will be in time.",
      "answer": "and",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "早く寝なさい、そうしないと明日起きられません。",
      "en": "Go to bed early, or you cannot get up tomorrow.",
      "blank": "Go to bed early, ___ you cannot get up tomorrow.",
      "answer": "or",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私は彼が昨日忙しかったと聞きました。",
      "en": "I heard that he was busy yesterday.",
      "blank": "I heard ___ he was busy yesterday.",
      "answer": "that",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私は疲れていたので、早く寝ました。",
      "en": "I went to bed early because I was tired.",
      "blank": "___ went to bed early because I was tired.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "彼女は英語が好きだと思います。",
      "en": "I think that she likes English.",
      "blank": "___ think that she likes English.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は彼が正しいと確信しています。",
      "en": "I am sure that he is right.",
      "blank": "___ am sure that he is right.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "彼はその本がおもしろいと言いました。",
      "en": "He said that the book was interesting.",
      "blank": "___ said that the book was interesting.",
      "answer": "He",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は忙しいですが、あなたを手伝います。",
      "en": "I am busy, but I will help you.",
      "blank": "___ am busy, but I will help you.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "早く起きなさい。そうすれば朝食を食べられます。",
      "en": "Get up early, and you can eat breakfast.",
      "blank": "___ up early, and you can eat breakfast.",
      "answer": "Get",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "一生懸命勉強しなさい。そうしないと試験に落ちます。",
      "en": "Study hard, or you will fail the test.",
      "blank": "___ hard, or you will fail the test.",
      "answer": "Study",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文をつなぎ、理由・内容・対比などを表します。"
    },
    {
      "jp": "私は眠かったので、早く寝ました。",
      "en": "I went to bed early because I was sleepy.",
      "blank": "___ went to bed early because I was sleepy.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼は病気だったので、学校を休みました。",
      "en": "He was absent from school because he was sick.",
      "blank": "___ was absent from school because he was sick.",
      "answer": "He",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私は彼女が親切だと思います。",
      "en": "I think that she is kind.",
      "blank": "___ think that she is kind.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼は英語が大切だと思っています。",
      "en": "He thinks that English is important.",
      "blank": "___ thinks that English is important.",
      "answer": "He",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "私はあなたがうまくいくと確信しています。",
      "en": "I am sure that you will do well.",
      "blank": "___ am sure that you will do well.",
      "answer": "I",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    },
    {
      "jp": "彼女はその話が本当だと確信しています。",
      "en": "She is sure that the story is true.",
      "blank": "___ is sure that the story is true.",
      "answer": "She",
      "choices": [
        "because",
        "that",
        "but",
        "and",
        "or",
        "if"
      ],
      "explanation": "接続詞や that節は、文と文の関係を表します。"
    }
  ],
  "It is 構文": [
    {
      "jp": "私にとって英語を勉強することは大切です。",
      "en": "It is important for me to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "私たちにとって早く起きることは必要です。",
      "en": "It is necessary for us to get up early.",
      "blank": "It is necessary ___ ___ ___ get up early.",
      "answer": "for us to",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "彼にとってこの問題を解くことは難しいです。",
      "en": "It is difficult for him to solve this problem.",
      "blank": "It is difficult ___ ___ ___ solve this problem.",
      "answer": "for him to",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "私にとって本を読むことは楽しいです。",
      "en": "It is fun for me to read books.",
      "blank": "It is fun ___ ___ ___ read books.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "英語を勉強することは大切です。",
      "en": "To study English is important.",
      "blank": "___ ___ English is important.",
      "answer": "To study",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "早く起きることは必要です。",
      "en": "To get up early is necessary.",
      "blank": "___ ___ ___ early is necessary.",
      "answer": "To get up",
      "choices": [
        "for",
        "me",
        "us",
        "him",
        "to",
        "To",
        "study",
        "get"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で「人にとって〜することは…だ」を表します。"
    },
    {
      "jp": "私にとって本を読むことは大切です。",
      "en": "It is important for me to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとってピアノを弾くことは大切です。",
      "en": "It is important for me to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって音楽を聴くことは大切です。",
      "en": "It is important for me to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって夕食を作ることは大切です。",
      "en": "It is important for me to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって英語を勉強することは大切です。",
      "en": "It is important for you to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって本を読むことは大切です。",
      "en": "It is important for you to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとってピアノを弾くことは大切です。",
      "en": "It is important for you to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって音楽を聴くことは大切です。",
      "en": "It is important for you to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって夕食を作ることは大切です。",
      "en": "It is important for you to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとって英語を勉強することは大切です。",
      "en": "It is important for him to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとって本を読むことは大切です。",
      "en": "It is important for him to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとってピアノを弾くことは大切です。",
      "en": "It is important for him to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとって音楽を聴くことは大切です。",
      "en": "It is important for him to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとって夕食を作ることは大切です。",
      "en": "It is important for him to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼女にとって英語を勉強することは大切です。",
      "en": "It is important for her to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for her to",
      "choices": [
        "for",
        "her",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼女にとって本を読むことは大切です。",
      "en": "It is important for her to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for her to",
      "choices": [
        "for",
        "her",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼女にとってピアノを弾くことは大切です。",
      "en": "It is important for her to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for her to",
      "choices": [
        "for",
        "her",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼女にとって音楽を聴くことは大切です。",
      "en": "It is important for her to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for her to",
      "choices": [
        "for",
        "her",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼女にとって夕食を作ることは大切です。",
      "en": "It is important for her to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for her to",
      "choices": [
        "for",
        "her",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私たちにとって英語を勉強することは大切です。",
      "en": "It is important for us to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for us to",
      "choices": [
        "for",
        "us",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私たちにとって本を読むことは大切です。",
      "en": "It is important for us to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for us to",
      "choices": [
        "for",
        "us",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私たちにとってピアノを弾くことは大切です。",
      "en": "It is important for us to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for us to",
      "choices": [
        "for",
        "us",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私たちにとって音楽を聴くことは大切です。",
      "en": "It is important for us to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for us to",
      "choices": [
        "for",
        "us",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私たちにとって夕食を作ることは大切です。",
      "en": "It is important for us to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for us to",
      "choices": [
        "for",
        "us",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼らにとって英語を勉強することは大切です。",
      "en": "It is important for them to study English.",
      "blank": "It is important ___ ___ ___ study English.",
      "answer": "for them to",
      "choices": [
        "for",
        "them",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼らにとって本を読むことは大切です。",
      "en": "It is important for them to read books.",
      "blank": "It is important ___ ___ ___ read books.",
      "answer": "for them to",
      "choices": [
        "for",
        "them",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼らにとってピアノを弾くことは大切です。",
      "en": "It is important for them to play the piano.",
      "blank": "It is important ___ ___ ___ play the piano.",
      "answer": "for them to",
      "choices": [
        "for",
        "them",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼らにとって音楽を聴くことは大切です。",
      "en": "It is important for them to listen to music.",
      "blank": "It is important ___ ___ ___ listen to music.",
      "answer": "for them to",
      "choices": [
        "for",
        "them",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼らにとって夕食を作ることは大切です。",
      "en": "It is important for them to cook dinner.",
      "blank": "It is important ___ ___ ___ cook dinner.",
      "answer": "for them to",
      "choices": [
        "for",
        "them",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって英語を勉強することは簡単です。",
      "en": "It is easy for me to study English.",
      "blank": "It is easy ___ ___ ___ study English.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって本を読むことは簡単です。",
      "en": "It is easy for me to read books.",
      "blank": "It is easy ___ ___ ___ read books.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとってピアノを弾くことは簡単です。",
      "en": "It is easy for me to play the piano.",
      "blank": "It is easy ___ ___ ___ play the piano.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって音楽を聴くことは簡単です。",
      "en": "It is easy for me to listen to music.",
      "blank": "It is easy ___ ___ ___ listen to music.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "私にとって夕食を作ることは簡単です。",
      "en": "It is easy for me to cook dinner.",
      "blank": "It is easy ___ ___ ___ cook dinner.",
      "answer": "for me to",
      "choices": [
        "for",
        "me",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって英語を勉強することは簡単です。",
      "en": "It is easy for you to study English.",
      "blank": "It is easy ___ ___ ___ study English.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって本を読むことは簡単です。",
      "en": "It is easy for you to read books.",
      "blank": "It is easy ___ ___ ___ read books.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとってピアノを弾くことは簡単です。",
      "en": "It is easy for you to play the piano.",
      "blank": "It is easy ___ ___ ___ play the piano.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって音楽を聴くことは簡単です。",
      "en": "It is easy for you to listen to music.",
      "blank": "It is easy ___ ___ ___ listen to music.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "あなたにとって夕食を作ることは簡単です。",
      "en": "It is easy for you to cook dinner.",
      "blank": "It is easy ___ ___ ___ cook dinner.",
      "answer": "for you to",
      "choices": [
        "for",
        "you",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    },
    {
      "jp": "彼にとって英語を勉強することは簡単です。",
      "en": "It is easy for him to study English.",
      "blank": "It is easy ___ ___ ___ study English.",
      "answer": "for him to",
      "choices": [
        "for",
        "him",
        "to",
        "that"
      ],
      "explanation": "It is + 形容詞 + for 人 + to 動詞の原形で表します。"
    }
  ],
  "比較": [
    {
      "jp": "この本はあの本より新しいです。",
      "en": "This book is newer than that one.",
      "blank": "This book is ___ than that one.",
      "answer": "newer",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "この問題はあの問題より難しいです。",
      "en": "This question is more difficult than that one.",
      "blank": "This question is ___ ___ than that one.",
      "answer": "more difficult",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "彼は私より背が高いです。",
      "en": "He is taller than I.",
      "blank": "He is ___ than I.",
      "answer": "taller",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "これは3つの中で一番古い机です。",
      "en": "This is the oldest desk of the three.",
      "blank": "This is ___ ___ desk of the three.",
      "answer": "the oldest",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "これは今日解いた中で一番難しい問題です。",
      "en": "This is the most difficult question I solved today.",
      "blank": "This is ___ ___ ___ question I solved today.",
      "answer": "the most difficult",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "彼女は私と同じくらい速く走ります。",
      "en": "She runs as fast as I.",
      "blank": "She runs ___ fast ___ I.",
      "answer": "as as",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "この本はあの本ほど高くありません。",
      "en": "This book is not as expensive as that one.",
      "blank": "This book is not ___ expensive ___ that one.",
      "answer": "as as",
      "choices": [
        "newer",
        "more",
        "difficult",
        "the",
        "most",
        "oldest",
        "as",
        "than"
      ],
      "explanation": "比較では、比較級 + than、the + 最上級、as ... as の形を見分けます。"
    },
    {
      "jp": "このかばんはあのかばんより大きいです。",
      "en": "This bag is larger than that one.",
      "blank": "This bag is ___ than that one.",
      "answer": "larger",
      "choices": [
        "larger",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "このかばんは3つの中で一番大きいです。",
      "en": "This bag is the largest of the three.",
      "blank": "This bag is ___ ___ of the three.",
      "answer": "the largest",
      "choices": [
        "the",
        "largest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんと同じくらい大きいです。",
      "en": "This bag is as large as that one.",
      "blank": "This bag is ___ large ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんより長いです。",
      "en": "This bag is longer than that one.",
      "blank": "This bag is ___ than that one.",
      "answer": "longer",
      "choices": [
        "longer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "このかばんは3つの中で一番長いです。",
      "en": "This bag is the longest of the three.",
      "blank": "This bag is ___ ___ of the three.",
      "answer": "the longest",
      "choices": [
        "the",
        "longest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんと同じくらい長いです。",
      "en": "This bag is as long as that one.",
      "blank": "This bag is ___ long ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんより新しいです。",
      "en": "This bag is newer than that one.",
      "blank": "This bag is ___ than that one.",
      "answer": "newer",
      "choices": [
        "newer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "このかばんは3つの中で一番新しいです。",
      "en": "This bag is the newest of the three.",
      "blank": "This bag is ___ ___ of the three.",
      "answer": "the newest",
      "choices": [
        "the",
        "newest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんと同じくらい新しいです。",
      "en": "This bag is as new as that one.",
      "blank": "This bag is ___ new ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんより難しいです。",
      "en": "This bag is more difficult than that one.",
      "blank": "This bag is ___ than that one.",
      "answer": "more difficult",
      "choices": [
        "more",
        "difficult",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "このかばんは3つの中で一番難しいです。",
      "en": "This bag is the most difficult of the three.",
      "blank": "This bag is ___ ___ of the three.",
      "answer": "the most difficult",
      "choices": [
        "the",
        "most difficult",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんと同じくらい難しいです。",
      "en": "This bag is as difficult as that one.",
      "blank": "This bag is ___ difficult ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんよりおもしろいです。",
      "en": "This bag is more interesting than that one.",
      "blank": "This bag is ___ than that one.",
      "answer": "more interesting",
      "choices": [
        "more",
        "interesting",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "このかばんは3つの中で一番おもしろいです。",
      "en": "This bag is the most interesting of the three.",
      "blank": "This bag is ___ ___ of the three.",
      "answer": "the most interesting",
      "choices": [
        "the",
        "most interesting",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "このかばんはあのかばんと同じくらいおもしろいです。",
      "en": "This bag is as interesting as that one.",
      "blank": "This bag is ___ interesting ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この川はあの川より大きいです。",
      "en": "This river is larger than that one.",
      "blank": "This river is ___ than that one.",
      "answer": "larger",
      "choices": [
        "larger",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この川は3つの中で一番大きいです。",
      "en": "This river is the largest of the three.",
      "blank": "This river is ___ ___ of the three.",
      "answer": "the largest",
      "choices": [
        "the",
        "largest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この川はあの川と同じくらい大きいです。",
      "en": "This river is as large as that one.",
      "blank": "This river is ___ large ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この川はあの川より長いです。",
      "en": "This river is longer than that one.",
      "blank": "This river is ___ than that one.",
      "answer": "longer",
      "choices": [
        "longer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この川は3つの中で一番長いです。",
      "en": "This river is the longest of the three.",
      "blank": "This river is ___ ___ of the three.",
      "answer": "the longest",
      "choices": [
        "the",
        "longest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この川はあの川と同じくらい長いです。",
      "en": "This river is as long as that one.",
      "blank": "This river is ___ long ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この川はあの川より新しいです。",
      "en": "This river is newer than that one.",
      "blank": "This river is ___ than that one.",
      "answer": "newer",
      "choices": [
        "newer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この川は3つの中で一番新しいです。",
      "en": "This river is the newest of the three.",
      "blank": "This river is ___ ___ of the three.",
      "answer": "the newest",
      "choices": [
        "the",
        "newest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この川はあの川と同じくらい新しいです。",
      "en": "This river is as new as that one.",
      "blank": "This river is ___ new ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この川はあの川より難しいです。",
      "en": "This river is more difficult than that one.",
      "blank": "This river is ___ than that one.",
      "answer": "more difficult",
      "choices": [
        "more",
        "difficult",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この川は3つの中で一番難しいです。",
      "en": "This river is the most difficult of the three.",
      "blank": "This river is ___ ___ of the three.",
      "answer": "the most difficult",
      "choices": [
        "the",
        "most difficult",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この川はあの川と同じくらい難しいです。",
      "en": "This river is as difficult as that one.",
      "blank": "This river is ___ difficult ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この川はあの川よりおもしろいです。",
      "en": "This river is more interesting than that one.",
      "blank": "This river is ___ than that one.",
      "answer": "more interesting",
      "choices": [
        "more",
        "interesting",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この川は3つの中で一番おもしろいです。",
      "en": "This river is the most interesting of the three.",
      "blank": "This river is ___ ___ of the three.",
      "answer": "the most interesting",
      "choices": [
        "the",
        "most interesting",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この川はあの川と同じくらいおもしろいです。",
      "en": "This river is as interesting as that one.",
      "blank": "This river is ___ interesting ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この町はあの町より大きいです。",
      "en": "This town is larger than that one.",
      "blank": "This town is ___ than that one.",
      "answer": "larger",
      "choices": [
        "larger",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この町は3つの中で一番大きいです。",
      "en": "This town is the largest of the three.",
      "blank": "This town is ___ ___ of the three.",
      "answer": "the largest",
      "choices": [
        "the",
        "largest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この町はあの町と同じくらい大きいです。",
      "en": "This town is as large as that one.",
      "blank": "This town is ___ large ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この町はあの町より長いです。",
      "en": "This town is longer than that one.",
      "blank": "This town is ___ than that one.",
      "answer": "longer",
      "choices": [
        "longer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この町は3つの中で一番長いです。",
      "en": "This town is the longest of the three.",
      "blank": "This town is ___ ___ of the three.",
      "answer": "the longest",
      "choices": [
        "the",
        "longest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この町はあの町と同じくらい長いです。",
      "en": "This town is as long as that one.",
      "blank": "This town is ___ long ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この町はあの町より新しいです。",
      "en": "This town is newer than that one.",
      "blank": "This town is ___ than that one.",
      "answer": "newer",
      "choices": [
        "newer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この町は3つの中で一番新しいです。",
      "en": "This town is the newest of the three.",
      "blank": "This town is ___ ___ of the three.",
      "answer": "the newest",
      "choices": [
        "the",
        "newest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この町はあの町と同じくらい新しいです。",
      "en": "This town is as new as that one.",
      "blank": "This town is ___ new ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この町はあの町より難しいです。",
      "en": "This town is more difficult than that one.",
      "blank": "This town is ___ than that one.",
      "answer": "more difficult",
      "choices": [
        "more",
        "difficult",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この町は3つの中で一番難しいです。",
      "en": "This town is the most difficult of the three.",
      "blank": "This town is ___ ___ of the three.",
      "answer": "the most difficult",
      "choices": [
        "the",
        "most difficult",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この町はあの町と同じくらい難しいです。",
      "en": "This town is as difficult as that one.",
      "blank": "This town is ___ difficult ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この町はあの町よりおもしろいです。",
      "en": "This town is more interesting than that one.",
      "blank": "This town is ___ than that one.",
      "answer": "more interesting",
      "choices": [
        "more",
        "interesting",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この町は3つの中で一番おもしろいです。",
      "en": "This town is the most interesting of the three.",
      "blank": "This town is ___ ___ of the three.",
      "answer": "the most interesting",
      "choices": [
        "the",
        "most interesting",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この町はあの町と同じくらいおもしろいです。",
      "en": "This town is as interesting as that one.",
      "blank": "This town is ___ interesting ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この問題はあの問題より大きいです。",
      "en": "This question is larger than that one.",
      "blank": "This question is ___ than that one.",
      "answer": "larger",
      "choices": [
        "larger",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この問題は3つの中で一番大きいです。",
      "en": "This question is the largest of the three.",
      "blank": "This question is ___ ___ of the three.",
      "answer": "the largest",
      "choices": [
        "the",
        "largest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この問題はあの問題と同じくらい大きいです。",
      "en": "This question is as large as that one.",
      "blank": "This question is ___ large ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    },
    {
      "jp": "この問題はあの問題より長いです。",
      "en": "This question is longer than that one.",
      "blank": "This question is ___ than that one.",
      "answer": "longer",
      "choices": [
        "longer",
        "than",
        "more"
      ],
      "explanation": "比較級 + than で「〜より…」を表します。"
    },
    {
      "jp": "この問題は3つの中で一番長いです。",
      "en": "This question is the longest of the three.",
      "blank": "This question is ___ ___ of the three.",
      "answer": "the longest",
      "choices": [
        "the",
        "longest",
        "most"
      ],
      "explanation": "the + 最上級で「一番〜」を表します。"
    },
    {
      "jp": "この問題はあの問題と同じくらい長いです。",
      "en": "This question is as long as that one.",
      "blank": "This question is ___ long ___ that one.",
      "answer": "as as",
      "choices": [
        "as",
        "than",
        "more"
      ],
      "explanation": "as ... as で「同じくらい〜」を表します。"
    }
  ],
  "受け身": [
    {
      "jp": "この本は多くの生徒に読まれています。",
      "en": "This book is read by many students.",
      "blank": "This book ___ ___ by many students.",
      "answer": "is read",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "英語は多くの国で話されています。",
      "en": "English is spoken in many countries.",
      "blank": "English ___ ___ in many countries.",
      "answer": "is spoken",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この部屋は毎日掃除されます。",
      "en": "This room is cleaned every day.",
      "blank": "This room ___ ___ every day.",
      "answer": "is cleaned",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "その手紙は彼女によって書かれました。",
      "en": "The letter was written by her.",
      "blank": "The letter ___ ___ by her.",
      "answer": "was written",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この歌は日本で知られています。",
      "en": "This song is known in Japan.",
      "blank": "This song ___ ___ in Japan.",
      "answer": "is known",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この窓は昨日壊されました。",
      "en": "This window was broken yesterday.",
      "blank": "This window ___ ___ yesterday.",
      "answer": "was broken",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この本は多くの生徒に読まれていません。",
      "en": "This book is not read by many students.",
      "blank": "This book ___ ___ ___ by many students.",
      "answer": "is not read",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この部屋は毎日掃除されますか。",
      "en": "Is this room cleaned every day?",
      "blank": "___ this room ___ every day?",
      "answer": "Is cleaned",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    },
    {
      "jp": "この本は読まれています。",
      "en": "This book is read.",
      "blank": "This book ___ ___.",
      "answer": "is read",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "read"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "この本は読まれていません。",
      "en": "This book is not read.",
      "blank": "This book ___ ___ ___.",
      "answer": "is not read",
      "choices": [
        "is",
        "was",
        "not",
        "read"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "この本は読まれていますか。",
      "en": "Is this book read?",
      "blank": "___ this book ___?",
      "answer": "Is read",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "read"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "この部屋は掃除されます。",
      "en": "This room is cleaned.",
      "blank": "This room ___ ___.",
      "answer": "is cleaned",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "cleaned"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "この部屋は掃除されません。",
      "en": "This room is not cleaned.",
      "blank": "This room ___ ___ ___.",
      "answer": "is not cleaned",
      "choices": [
        "is",
        "was",
        "not",
        "cleaned"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "この部屋は掃除されますか。",
      "en": "Is this room cleaned?",
      "blank": "___ this room ___?",
      "answer": "Is cleaned",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "cleaned"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "その手紙は書かれました。",
      "en": "The letter was written.",
      "blank": "The letter ___ ___.",
      "answer": "was written",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "written"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "その手紙は書かれませんでした。",
      "en": "The letter was not written.",
      "blank": "The letter ___ ___ ___.",
      "answer": "was not written",
      "choices": [
        "is",
        "was",
        "not",
        "written"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "その手紙は書かれましたか。",
      "en": "Was the letter written?",
      "blank": "___ the letter ___?",
      "answer": "Was written",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "written"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "この歌は知られています。",
      "en": "This song is known.",
      "blank": "This song ___ ___.",
      "answer": "is known",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "この歌は知られていません。",
      "en": "This song is not known.",
      "blank": "This song ___ ___ ___.",
      "answer": "is not known",
      "choices": [
        "is",
        "was",
        "not",
        "known"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "この歌は知られていますか。",
      "en": "Is this song known?",
      "blank": "___ this song ___?",
      "answer": "Is known",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "known"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "この窓は壊されました。",
      "en": "This window was broken.",
      "blank": "This window ___ ___.",
      "answer": "was broken",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "broken"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "この窓は壊されませんでした。",
      "en": "This window was not broken.",
      "blank": "This window ___ ___ ___.",
      "answer": "was not broken",
      "choices": [
        "is",
        "was",
        "not",
        "broken"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "この窓は壊されましたか。",
      "en": "Was this window broken?",
      "blank": "___ this window ___?",
      "answer": "Was broken",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "broken"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "英語は話されています。",
      "en": "English is spoken.",
      "blank": "English ___ ___.",
      "answer": "is spoken",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "spoken"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "英語は話されていません。",
      "en": "English is not spoken.",
      "blank": "English ___ ___ ___.",
      "answer": "is not spoken",
      "choices": [
        "is",
        "was",
        "not",
        "spoken"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "英語は話されていますか。",
      "en": "Is english spoken?",
      "blank": "___ english ___?",
      "answer": "Is spoken",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "spoken"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "この机は使われています。",
      "en": "This desk is used.",
      "blank": "This desk ___ ___.",
      "answer": "is used",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "used"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で作ります。"
    },
    {
      "jp": "この机は使われていません。",
      "en": "This desk is not used.",
      "blank": "This desk ___ ___ ___.",
      "answer": "is not used",
      "choices": [
        "is",
        "was",
        "not",
        "used"
      ],
      "explanation": "受け身の否定文は be動詞 + not + 過去分詞です。"
    },
    {
      "jp": "この机は使われていますか。",
      "en": "Is this desk used?",
      "blank": "___ this desk ___?",
      "answer": "Is used",
      "choices": [
        "Is",
        "Was",
        "Are",
        "Were",
        "used"
      ],
      "explanation": "受け身の疑問文は be動詞を文頭に出します。"
    },
    {
      "jp": "この本は多くの生徒に読まれています。",
      "en": "This book is read by many students.",
      "blank": "This book is ___ by many students.",
      "answer": "read",
      "choices": [
        "is",
        "are",
        "was",
        "were",
        "not",
        "read",
        "cleaned",
        "written",
        "spoken",
        "known"
      ],
      "explanation": "受け身は be動詞 + 過去分詞で「〜される」を表します。中2では will be + 過去分詞は扱いません。"
    }
  ],
  "受け身の発展": [
    {
      "jp": "この部屋は明日掃除されるでしょう。",
      "en": "This room will be cleaned tomorrow.",
      "blank": "This room ___ ___ ___ tomorrow.",
      "answer": "will be cleaned",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "その橋は来年建てられる予定です。",
      "en": "The bridge will be built next year.",
      "blank": "The bridge ___ ___ ___ next year.",
      "answer": "will be built",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "この試合は多くの人に見られるでしょう。",
      "en": "This game will be watched by many people.",
      "blank": "This game ___ ___ ___ by many people.",
      "answer": "will be watched",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "英語はカナダでも話されています。",
      "en": "English is spoken in Canada.",
      "blank": "English ___ ___ in Canada.",
      "answer": "is spoken",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "その知らせはすぐに知られるでしょう。",
      "en": "The news will be known soon.",
      "blank": "The news ___ ___ ___ soon.",
      "answer": "will be known",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "このケーキは卵を使わずに作られています。",
      "en": "This cake is made without eggs.",
      "blank": "This cake ___ ___ without eggs.",
      "answer": "is made",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "この本は明日読まれれるでしょう。",
      "en": "This book will be read tomorrow.",
      "blank": "This book ___ ___ ___ tomorrow.",
      "answer": "will be read",
      "choices": [
        "will",
        "be",
        "read",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "この本は多くの人に読まれています。",
      "en": "This book is read by many people.",
      "blank": "This book ___ ___ by many people.",
      "answer": "is read",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "read"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この部屋は多くの人に掃除されます。",
      "en": "This room is cleaned by many people.",
      "blank": "This room ___ ___ by many people.",
      "answer": "is cleaned",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "cleaned"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "その手紙は明日書かれるでしょう。",
      "en": "The letter will be written tomorrow.",
      "blank": "The letter ___ ___ ___ tomorrow.",
      "answer": "will be written",
      "choices": [
        "will",
        "be",
        "written",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "その手紙は多くの人に書かれました。",
      "en": "The letter is written by many people.",
      "blank": "The letter ___ ___ by many people.",
      "answer": "is written",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "written"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この歌は明日知られれるでしょう。",
      "en": "This song will be known tomorrow.",
      "blank": "This song ___ ___ ___ tomorrow.",
      "answer": "will be known",
      "choices": [
        "will",
        "be",
        "known",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "この歌は多くの人に知られています。",
      "en": "This song is known by many people.",
      "blank": "This song ___ ___ by many people.",
      "answer": "is known",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "known"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この窓は明日壊されるでしょう。",
      "en": "This window will be broken tomorrow.",
      "blank": "This window ___ ___ ___ tomorrow.",
      "answer": "will be broken",
      "choices": [
        "will",
        "be",
        "broken",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "この窓は多くの人に壊されました。",
      "en": "This window is broken by many people.",
      "blank": "This window ___ ___ by many people.",
      "answer": "is broken",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "broken"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "英語は明日話されれるでしょう。",
      "en": "English will be spoken tomorrow.",
      "blank": "English ___ ___ ___ tomorrow.",
      "answer": "will be spoken",
      "choices": [
        "will",
        "be",
        "spoken",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "英語は多くの人に話されています。",
      "en": "English is spoken by many people.",
      "blank": "English ___ ___ by many people.",
      "answer": "is spoken",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "spoken"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この机は明日使われれるでしょう。",
      "en": "This desk will be used tomorrow.",
      "blank": "This desk ___ ___ ___ tomorrow.",
      "answer": "will be used",
      "choices": [
        "will",
        "be",
        "used",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "この机は多くの人に使われています。",
      "en": "This desk is used by many people.",
      "blank": "This desk ___ ___ by many people.",
      "answer": "is used",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "used"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この部屋は明日掃除されるでしょう。",
      "en": "This room will be cleaned tomorrow.",
      "blank": "This room will be ___ tomorrow.",
      "answer": "cleaned",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "その橋は来年建てられる予定です。",
      "en": "The bridge will be built next year.",
      "blank": "The bridge will be ___ next year.",
      "answer": "built",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "この試合は多くの人に見られるでしょう。",
      "en": "This game will be watched by many people.",
      "blank": "This game will be ___ by many people.",
      "answer": "watched",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "英語はカナダでも話されています。",
      "en": "English is spoken in Canada.",
      "blank": "English is ___ in Canada.",
      "answer": "spoken",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "その知らせはすぐに知られるでしょう。",
      "en": "The news will be known soon.",
      "blank": "The news will be ___ soon.",
      "answer": "known",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "このケーキは卵を使わずに作られています。",
      "en": "This cake is made without eggs.",
      "blank": "This cake is ___ without eggs.",
      "answer": "made",
      "choices": [
        "will",
        "be",
        "is",
        "was",
        "cleaned",
        "built",
        "spoken",
        "made"
      ],
      "explanation": "受け身の発展では、will be + 過去分詞や、byを使わない受け身も扱います。"
    },
    {
      "jp": "この本は明日読まれれるでしょう。",
      "en": "This book will be read tomorrow.",
      "blank": "This book will be ___ tomorrow.",
      "answer": "read",
      "choices": [
        "will",
        "be",
        "read",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "この本は多くの人に読まれています。",
      "en": "This book is read by many people.",
      "blank": "This book is ___ by many people.",
      "answer": "read",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "read"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "この部屋は多くの人に掃除されます。",
      "en": "This room is cleaned by many people.",
      "blank": "This room is ___ by many people.",
      "answer": "cleaned",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "cleaned"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    },
    {
      "jp": "その手紙は明日書かれるでしょう。",
      "en": "The letter will be written tomorrow.",
      "blank": "The letter will be ___ tomorrow.",
      "answer": "written",
      "choices": [
        "will",
        "be",
        "written",
        "is"
      ],
      "explanation": "will be + 過去分詞で未来の受け身を表します。"
    },
    {
      "jp": "その手紙は多くの人に書かれました。",
      "en": "The letter is written by many people.",
      "blank": "The letter is ___ by many people.",
      "answer": "written",
      "choices": [
        "is",
        "was",
        "will",
        "be",
        "written"
      ],
      "explanation": "受け身では by を使って「〜によって」を表すことがあります。"
    }
  ],
  "人やものを説明する文": [
    {
      "jp": "私たちは彼をケンと呼びます。",
      "en": "We call him Ken.",
      "blank": "We ___ ___ Ken.",
      "answer": "call him",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "その知らせは私を幸せにしました。",
      "en": "The news made me happy.",
      "blank": "The news ___ ___ happy.",
      "answer": "made me",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "彼らはその犬をポチと名づけました。",
      "en": "They named the dog Pochi.",
      "blank": "They ___ the dog Pochi.",
      "answer": "named",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "母は私に部屋を掃除させました。",
      "en": "My mother made me clean my room.",
      "blank": "My mother ___ ___ ___ my room.",
      "answer": "made me clean",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "彼は私にその箱を運ぶのを手伝ってくれました。",
      "en": "He helped me carry the box.",
      "blank": "He ___ ___ ___ the box.",
      "answer": "helped me carry",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "先生は私たちに早く帰らせました。",
      "en": "The teacher let us go home early.",
      "blank": "The teacher ___ ___ ___ home early.",
      "answer": "let us go",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "私たちは彼女をユイと呼びます。",
      "en": "We call her Yui.",
      "blank": "We ___ ___ Yui.",
      "answer": "call her",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "彼らはその猫をミケと名づけました。",
      "en": "They named the cat Mike.",
      "blank": "They ___ the cat Mike.",
      "answer": "named",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "その映画は私たちを悲しくさせました。",
      "en": "The movie made us sad.",
      "blank": "The movie ___ ___ sad.",
      "answer": "made us",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "その歌は彼女を幸せにしました。",
      "en": "The song made her happy.",
      "blank": "The song ___ ___ happy.",
      "answer": "made her",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "父は私に車を洗わせました。",
      "en": "My father made me wash the car.",
      "blank": "My father ___ ___ ___ the car.",
      "answer": "made me wash",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "彼女は私にその本を読ませてくれました。",
      "en": "She let me read the book.",
      "blank": "She ___ ___ ___ the book.",
      "answer": "let me read",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "兄は私が机を動かすのを手伝ってくれました。",
      "en": "My brother helped me move the desk.",
      "blank": "My brother ___ ___ ___ the desk.",
      "answer": "helped me move",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "先生は生徒たちを静かにさせました。",
      "en": "The teacher made the students quiet.",
      "blank": "The teacher ___ the students quiet.",
      "answer": "made",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "私たちは彼をケンと呼びます。",
      "en": "We call him Ken.",
      "blank": "We call ___ Ken.",
      "answer": "him",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "その知らせは私を幸せにしました。",
      "en": "The news made me happy.",
      "blank": "The news made ___ happy.",
      "answer": "me",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "彼らはその犬をポチと名づけました。",
      "en": "They named the dog Pochi.",
      "blank": "___ named the dog Pochi.",
      "answer": "They",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "母は私に部屋を掃除させました。",
      "en": "My mother made me clean my room.",
      "blank": "My mother made me ___ my room.",
      "answer": "clean",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "彼は私にその箱を運ぶのを手伝ってくれました。",
      "en": "He helped me carry the box.",
      "blank": "He helped me ___ the box.",
      "answer": "carry",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "先生は私たちに早く帰らせました。",
      "en": "The teacher let us go home early.",
      "blank": "The teacher let us ___ home early.",
      "answer": "go",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "私たちは彼女をユイと呼びます。",
      "en": "We call her Yui.",
      "blank": "We call ___ Yui.",
      "answer": "her",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "彼らはその猫をミケと名づけました。",
      "en": "They named the cat Mike.",
      "blank": "___ named the cat Mike.",
      "answer": "They",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "その映画は私たちを悲しくさせました。",
      "en": "The movie made us sad.",
      "blank": "The movie made ___ sad.",
      "answer": "us",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "その歌は彼女を幸せにしました。",
      "en": "The song made her happy.",
      "blank": "The song made ___ happy.",
      "answer": "her",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "父は私に車を洗わせました。",
      "en": "My father made me wash the car.",
      "blank": "My father made me ___ the car.",
      "answer": "wash",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "彼女は私にその本を読ませてくれました。",
      "en": "She let me read the book.",
      "blank": "She let me ___ the book.",
      "answer": "read",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "兄は私が机を動かすのを手伝ってくれました。",
      "en": "My brother helped me move the desk.",
      "blank": "My brother helped me ___ the desk.",
      "answer": "move",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "先生は生徒たちを静かにさせました。",
      "en": "The teacher made the students quiet.",
      "blank": "___ teacher made the students quiet.",
      "answer": "The",
      "choices": [
        "call",
        "her",
        "named",
        "made",
        "us",
        "let",
        "me",
        "read",
        "helped",
        "move"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明します。"
    },
    {
      "jp": "私たちは彼をケンと呼びます。",
      "en": "We call him Ken.",
      "blank": "___ call him Ken.",
      "answer": "We",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    },
    {
      "jp": "その知らせは私を幸せにしました。",
      "en": "The news made me happy.",
      "blank": "___ news made me happy.",
      "answer": "The",
      "choices": [
        "call",
        "him",
        "made",
        "me",
        "named",
        "helped",
        "let",
        "us",
        "clean",
        "carry",
        "go"
      ],
      "explanation": "目的語の後ろに名前・状態・動作を続けて、目的語を説明する形です。"
    }
  ],
  "現在完了": [
    {
      "jp": "私は3年間ここに住んでいます。",
      "en": "I have lived here for three years.",
      "blank": "I ___ ___ here for three years.",
      "answer": "have lived",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼女は去年から英語を勉強しています。",
      "en": "She has studied English since last year.",
      "blank": "She ___ ___ English since last year.",
      "answer": "has studied",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は東京へ行ったことがあります。",
      "en": "I have been to Tokyo.",
      "blank": "I ___ ___ to Tokyo.",
      "answer": "have been",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼は一度も京都を訪れたことがありません。",
      "en": "He has never visited Kyoto.",
      "blank": "He ___ never ___ Kyoto.",
      "answer": "has visited",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私はちょうど宿題を終えたところです。",
      "en": "I have just finished my homework.",
      "blank": "I ___ just ___ my homework.",
      "answer": "have finished",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼女はもう昼食を食べてしまいました。",
      "en": "She has already eaten lunch.",
      "blank": "She ___ already ___ lunch.",
      "answer": "has eaten",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は1時間ずっと英語を勉強しています。",
      "en": "I have been studying English for an hour.",
      "blank": "I ___ ___ ___ English for an hour.",
      "answer": "have been studying",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼は朝からずっと本を読んでいます。",
      "en": "He has been reading a book since morning.",
      "blank": "He ___ ___ ___ a book since morning.",
      "answer": "has been reading",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は5年間ピアノを弾いています。",
      "en": "I have played the piano for five years.",
      "blank": "I ___ ___ the piano for five years.",
      "answer": "have played",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼は小学生のころから京都に住んでいます。",
      "en": "He has lived in Kyoto since he was an elementary school student.",
      "blank": "He ___ ___ in Kyoto since he was an elementary school student.",
      "answer": "has lived",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼女は一度も北海道へ行ったことがありません。",
      "en": "She has never been to Hokkaido.",
      "blank": "She ___ never ___ to Hokkaido.",
      "answer": "has been",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "あなたは今までに富士山を見たことがありますか。",
      "en": "Have you ever seen Mt. Fuji?",
      "blank": "___ you ever ___ Mt. Fuji?",
      "answer": "Have seen",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "私はもうその映画を見てしまいました。",
      "en": "I have already seen the movie.",
      "blank": "I ___ already ___ the movie.",
      "answer": "have seen",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼はまだ昼食を食べていません。",
      "en": "He has not eaten lunch yet.",
      "blank": "He ___ not ___ lunch yet.",
      "answer": "has eaten",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼女は2時間ずっとピアノを練習しています。",
      "en": "She has been practicing the piano for two hours.",
      "blank": "She ___ ___ ___ the piano for two hours.",
      "answer": "has been practicing",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "雨が朝からずっと降っています。",
      "en": "It has been raining since morning.",
      "blank": "It ___ ___ ___ since morning.",
      "answer": "has been raining",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "私は3年間ここに住んでいます。",
      "en": "I have lived here for three years.",
      "blank": "I have ___ here for three years.",
      "answer": "lived",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼女は去年から英語を勉強しています。",
      "en": "She has studied English since last year.",
      "blank": "She has ___ English since last year.",
      "answer": "studied",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は東京へ行ったことがあります。",
      "en": "I have been to Tokyo.",
      "blank": "I have ___ to Tokyo.",
      "answer": "been",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼は一度も京都を訪れたことがありません。",
      "en": "He has never visited Kyoto.",
      "blank": "He has never ___ Kyoto.",
      "answer": "visited",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私はちょうど宿題を終えたところです。",
      "en": "I have just finished my homework.",
      "blank": "I have just ___ my homework.",
      "answer": "finished",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼女はもう昼食を食べてしまいました。",
      "en": "She has already eaten lunch.",
      "blank": "She has already ___ lunch.",
      "answer": "eaten",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は1時間ずっと英語を勉強しています。",
      "en": "I have been studying English for an hour.",
      "blank": "I have been ___ English for an hour.",
      "answer": "studying",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "彼は朝からずっと本を読んでいます。",
      "en": "He has been reading a book since morning.",
      "blank": "He has been ___ a book since morning.",
      "answer": "reading",
      "choices": [
        "have",
        "has",
        "been",
        "lived",
        "studied",
        "visited",
        "finished",
        "eaten",
        "studying",
        "reading"
      ],
      "explanation": "現在完了は have / has + 過去分詞で、過去と現在のつながりを表します。"
    },
    {
      "jp": "私は5年間ピアノを弾いています。",
      "en": "I have played the piano for five years.",
      "blank": "I have ___ the piano for five years.",
      "answer": "played",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼は小学生のころから京都に住んでいます。",
      "en": "He has lived in Kyoto since he was an elementary school student.",
      "blank": "He has ___ in Kyoto since he was an elementary school student.",
      "answer": "lived",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼女は一度も北海道へ行ったことがありません。",
      "en": "She has never been to Hokkaido.",
      "blank": "She has never ___ to Hokkaido.",
      "answer": "been",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "あなたは今までに富士山を見たことがありますか。",
      "en": "Have you ever seen Mt. Fuji?",
      "blank": "Have you ever ___ Mt. Fuji?",
      "answer": "seen",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "私はもうその映画を見てしまいました。",
      "en": "I have already seen the movie.",
      "blank": "I have already ___ the movie.",
      "answer": "seen",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    },
    {
      "jp": "彼はまだ昼食を食べていません。",
      "en": "He has not eaten lunch yet.",
      "blank": "He has not ___ lunch yet.",
      "answer": "eaten",
      "choices": [
        "have",
        "has",
        "been",
        "played",
        "lived",
        "seen",
        "eaten",
        "practicing",
        "raining"
      ],
      "explanation": "現在完了は、継続・経験・完了・現在完了進行形に分けて考えます。"
    }
  ],
  "関係代名詞": [
    {
      "jp": "私は英語を話せる少年を知っています。",
      "en": "I know a boy who can speak English.",
      "blank": "I know a boy ___ can speak English.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは私が昨日買った本です。",
      "en": "This is the book that I bought yesterday.",
      "blank": "This is the book ___ I bought yesterday.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "彼女が書いた手紙は長かったです。",
      "en": "The letter which she wrote was long.",
      "blank": "The letter ___ she wrote was long.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは多くの人に読まれている本です。",
      "en": "This is a book that is read by many people.",
      "blank": "This is a book ___ is read by many people.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私が一番好きな歌はこれです。",
      "en": "This is the song that I like the best.",
      "blank": "This is the song ___ I like the best.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私はピアノを弾いている少女を見ました。",
      "en": "I saw a girl who was playing the piano.",
      "blank": "I saw a girl ___ was playing the piano.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは英語で書かれた本です。",
      "en": "This is a book which was written in English.",
      "blank": "This is a book ___ was written in English.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は歌を歌っている女の子を知っています。",
      "en": "I know the girl who is singing a song.",
      "blank": "I know the girl ___ is singing a song.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "歌を歌っている女の子は有名です。",
      "en": "The girl who is singing a song is famous.",
      "blank": "The girl ___ is singing a song is famous.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は英語を教えている先生を知っています。",
      "en": "I know the teacher who teaches English.",
      "blank": "I know the teacher ___ teaches English.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "英語を教えている先生は有名です。",
      "en": "The teacher who teaches English is famous.",
      "blank": "The teacher ___ teaches English is famous.",
      "answer": "who",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は公園を走っている犬を知っています。",
      "en": "I know the dog that is running in the park.",
      "blank": "I know the dog ___ is running in the park.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "公園を走っている犬は有名です。",
      "en": "The dog that is running in the park is famous.",
      "blank": "The dog ___ is running in the park is famous.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は私が昨日読んだ本を知っています。",
      "en": "I know the book that I read yesterday.",
      "blank": "I know the book ___ I read yesterday.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "私が昨日読んだ本は有名です。",
      "en": "The book that I read yesterday is famous.",
      "blank": "The book ___ I read yesterday is famous.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は私たちが昨夜見た映画を知っています。",
      "en": "I know the movie which we watched last night.",
      "blank": "I know the movie ___ we watched last night.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "私たちが昨夜見た映画は有名です。",
      "en": "The movie which we watched last night is famous.",
      "blank": "The movie ___ we watched last night is famous.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は彼女が撮った写真を知っています。",
      "en": "I know the picture which she took.",
      "blank": "I know the picture ___ she took.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "彼女が撮った写真は有名です。",
      "en": "The picture which she took is famous.",
      "blank": "The picture ___ she took is famous.",
      "answer": "which",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は彼が書いた手紙を知っています。",
      "en": "I know the letter that he wrote.",
      "blank": "I know the letter ___ he wrote.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "彼が書いた手紙は有名です。",
      "en": "The letter that he wrote is famous.",
      "blank": "The letter ___ he wrote is famous.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は私の兄が使っている自転車を知っています。",
      "en": "I know the bike that my brother uses.",
      "blank": "I know the bike ___ my brother uses.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから説明します。"
    },
    {
      "jp": "私の兄が使っている自転車は有名です。",
      "en": "The bike that my brother uses is famous.",
      "blank": "The bike ___ my brother uses is famous.",
      "answer": "that",
      "choices": [
        "who",
        "which",
        "that",
        "where"
      ],
      "explanation": "人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私は英語を話せる少年を知っています。",
      "en": "I know a boy who can speak English.",
      "blank": "___ know a boy who can speak English.",
      "answer": "I",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは私が昨日買った本です。",
      "en": "This is the book that I bought yesterday.",
      "blank": "___ is the book that I bought yesterday.",
      "answer": "This",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "彼女が書いた手紙は長かったです。",
      "en": "The letter which she wrote was long.",
      "blank": "___ letter which she wrote was long.",
      "answer": "The",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは多くの人に読まれている本です。",
      "en": "This is a book that is read by many people.",
      "blank": "___ is a book that is read by many people.",
      "answer": "This",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私が一番好きな歌はこれです。",
      "en": "This is the song that I like the best.",
      "blank": "___ is the song that I like the best.",
      "answer": "This",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "私はピアノを弾いている少女を見ました。",
      "en": "I saw a girl who was playing the piano.",
      "blank": "___ saw a girl who was playing the piano.",
      "answer": "I",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    },
    {
      "jp": "これは英語で書かれた本です。",
      "en": "This is a book which was written in English.",
      "blank": "___ is a book which was written in English.",
      "answer": "This",
      "choices": [
        "who",
        "which",
        "that",
        "where",
        "what"
      ],
      "explanation": "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。"
    }
  ],
  "thatを使う文・間接疑問文": [
    {
      "jp": "あなたが元気でうれしいです。",
      "en": "I am glad that you are fine.",
      "blank": "I am glad ___ you are fine.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼が試験に合格してうれしいです。",
      "en": "I am happy that he passed the test.",
      "blank": "I am happy ___ he passed the test.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼女がその知らせを知っていて驚きました。",
      "en": "I was surprised that she knew the news.",
      "blank": "I was surprised ___ she knew the news.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女はあなたが来られると聞いて喜んでいます。",
      "en": "She is happy that you can come.",
      "blank": "She is happy ___ you can come.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私はこの話が本当だと知っています。",
      "en": "I know that this story is true.",
      "blank": "I know ___ this story is true.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼は自分が忙しいと言いました。",
      "en": "He said that he was busy.",
      "blank": "He said ___ he was busy.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私たちは英語が役に立つと信じています。",
      "en": "We believe that English is useful.",
      "blank": "We believe ___ English is useful.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私はあなたが正しいと思います。",
      "en": "I feel that you are right.",
      "blank": "I feel ___ you are right.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼がどこに住んでいるか知っています。",
      "en": "I know where he lives.",
      "blank": "I know ___ ___ ___.",
      "answer": "where he lives",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女がなぜその本を読んだのか、私は知りません。",
      "en": "I don't know why she read the book.",
      "blank": "I don't know ___ ___ ___ the book.",
      "answer": "why she read",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "あなたが何をほしいのか教えてください。",
      "en": "Please tell me what you want.",
      "blank": "Please tell me ___ ___ ___.",
      "answer": "what you want",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼がいつ戻ってくるか知りません。",
      "en": "I don't know when he will come back.",
      "blank": "I don't know ___ ___ ___ come back.",
      "answer": "when he will",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女はあなたが正直だと知っています。",
      "en": "She knows that you are honest.",
      "blank": "She knows ___ you are honest.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼が明日来ると聞きました。",
      "en": "I heard that he will come tomorrow.",
      "blank": "I heard ___ he will come tomorrow.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼はその問題が難しいと思っています。",
      "en": "He feels that the question is difficult.",
      "blank": "He feels ___ the question is difficult.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私たちは彼女が親切だと知っています。",
      "en": "We know that she is kind.",
      "blank": "We know ___ she is kind.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私はあなたがその試合に勝ってうれしいです。",
      "en": "I am glad that you won the game.",
      "blank": "I am glad ___ you won the game.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女は母が元気でうれしく思っています。",
      "en": "She is happy that her mother is fine.",
      "blank": "She is happy ___ her mother is fine.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼が私の名前を覚えていて驚きました。",
      "en": "I was surprised that he remembered my name.",
      "blank": "I was surprised ___ he remembered my name.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私たちはその計画がうまくいくと信じています。",
      "en": "We believe that the plan will work.",
      "blank": "We believe ___ the plan will work.",
      "answer": "that",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼女がどこで働いているか知っています。",
      "en": "I know where she works.",
      "blank": "I know ___ ___ ___.",
      "answer": "where she works",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼が何を言ったのか教えてください。",
      "en": "Please tell me what he said.",
      "blank": "Please tell me ___ ___ ___.",
      "answer": "what he said",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "あなたがなぜ怒っているのかわかりません。",
      "en": "I don't know why you are angry.",
      "blank": "I don't know ___ ___ ___ angry.",
      "answer": "why you are",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女がいつ出発するか知っていますか。",
      "en": "Do you know when she will leave?",
      "blank": "Do you know ___ ___ ___ leave?",
      "answer": "when she will",
      "choices": [
        "that",
        "where",
        "what",
        "why",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "あなたが元気でうれしいです。",
      "en": "I am glad that you are fine.",
      "blank": "___ am glad that you are fine.",
      "answer": "I",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼が試験に合格してうれしいです。",
      "en": "I am happy that he passed the test.",
      "blank": "___ am happy that he passed the test.",
      "answer": "I",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私は彼女がその知らせを知っていて驚きました。",
      "en": "I was surprised that she knew the news.",
      "blank": "___ was surprised that she knew the news.",
      "answer": "I",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼女はあなたが来られると聞いて喜んでいます。",
      "en": "She is happy that you can come.",
      "blank": "___ is happy that you can come.",
      "answer": "She",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "私はこの話が本当だと知っています。",
      "en": "I know that this story is true.",
      "blank": "___ know that this story is true.",
      "answer": "I",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    },
    {
      "jp": "彼は自分が忙しいと言いました。",
      "en": "He said that he was busy.",
      "blank": "___ said that he was busy.",
      "answer": "He",
      "choices": [
        "that",
        "where",
        "why",
        "what",
        "when",
        "he",
        "she",
        "you",
        "will"
      ],
      "explanation": "that節は「〜ということ」を表します。間接疑問文では「疑問詞 + 主語 + 動詞」の語順になります。"
    }
  ],
  "名詞を後ろから説明する文": [
    {
      "jp": "サッカーをしている少年は私の弟です。",
      "en": "The boy playing soccer is my brother.",
      "blank": "The boy ___ soccer is my brother.",
      "answer": "playing",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "英語で書かれた本は難しいです。",
      "en": "The book written in English is difficult.",
      "blank": "The book ___ in English is difficult.",
      "answer": "written",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "壊れた窓を見てください。",
      "en": "Look at the broken window.",
      "blank": "Look at the ___ window.",
      "answer": "broken",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "あそこで走っている犬は私の犬です。",
      "en": "The dog running over there is mine.",
      "blank": "The dog ___ over there is mine.",
      "answer": "running",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "私が昨日買った本はおもしろいです。",
      "en": "The book I bought yesterday is interesting.",
      "blank": "The book ___ ___ yesterday is interesting.",
      "answer": "I bought",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "彼女が作ったケーキはおいしかったです。",
      "en": "The cake she made was delicious.",
      "blank": "The cake ___ ___ was delicious.",
      "answer": "she made",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "私たちが昨日見た映画は長かったです。",
      "en": "The movie we saw yesterday was long.",
      "blank": "The movie ___ ___ yesterday was long.",
      "answer": "we saw",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "机の上にある本は私のものです。",
      "en": "The book on the desk is mine.",
      "blank": "The book ___ the desk is mine.",
      "answer": "on",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "窓のそばに立っている男の子は私の友達です。",
      "en": "The boy standing by the window is my friend.",
      "blank": "The boy ___ by the window is my friend.",
      "answer": "standing",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "英語を話している女性は私の先生です。",
      "en": "The woman speaking English is my teacher.",
      "blank": "The woman ___ English is my teacher.",
      "answer": "speaking",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "昨日撮られた写真は美しいです。",
      "en": "The picture taken yesterday is beautiful.",
      "blank": "The picture ___ yesterday is beautiful.",
      "answer": "taken",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "日本で作られた車は人気があります。",
      "en": "The car made in Japan is popular.",
      "blank": "The car ___ in Japan is popular.",
      "answer": "made",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "私が今朝会った人は有名な歌手です。",
      "en": "The person I met this morning is a famous singer.",
      "blank": "The person ___ ___ this morning is a famous singer.",
      "answer": "I met",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "あなたが探している本は机の上にあります。",
      "en": "The book you are looking for is on the desk.",
      "blank": "The book ___ ___ looking for is on the desk.",
      "answer": "you are",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "彼が使っているペンは高いです。",
      "en": "The pen he uses is expensive.",
      "blank": "The pen ___ ___ is expensive.",
      "answer": "he uses",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "私たちが泊まったホテルは駅の近くでした。",
      "en": "The hotel we stayed at was near the station.",
      "blank": "The hotel ___ ___ at was near the station.",
      "answer": "we stayed",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "サッカーをしている少年は私の弟です。",
      "en": "The boy playing soccer is my brother.",
      "blank": "___ boy playing soccer is my brother.",
      "answer": "The",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "英語で書かれた本は難しいです。",
      "en": "The book written in English is difficult.",
      "blank": "___ book written in English is difficult.",
      "answer": "The",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "壊れた窓を見てください。",
      "en": "Look at the broken window.",
      "blank": "___ at the broken window.",
      "answer": "Look",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "あそこで走っている犬は私の犬です。",
      "en": "The dog running over there is mine.",
      "blank": "___ dog running over there is mine.",
      "answer": "The",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "私が昨日買った本はおもしろいです。",
      "en": "The book I bought yesterday is interesting.",
      "blank": "The book I ___ yesterday is interesting.",
      "answer": "bought",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "彼女が作ったケーキはおいしかったです。",
      "en": "The cake she made was delicious.",
      "blank": "The cake she ___ was delicious.",
      "answer": "made",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "私たちが昨日見た映画は長かったです。",
      "en": "The movie we saw yesterday was long.",
      "blank": "The movie we ___ yesterday was long.",
      "answer": "saw",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "机の上にある本は私のものです。",
      "en": "The book on the desk is mine.",
      "blank": "___ book on the desk is mine.",
      "answer": "The",
      "choices": [
        "playing",
        "written",
        "broken",
        "running",
        "I",
        "bought",
        "she",
        "made",
        "we",
        "saw",
        "on"
      ],
      "explanation": "英語では、名詞の後ろに説明を足して詳しくすることがあります。"
    },
    {
      "jp": "窓のそばに立っている男の子は私の友達です。",
      "en": "The boy standing by the window is my friend.",
      "blank": "___ boy standing by the window is my friend.",
      "answer": "The",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "英語を話している女性は私の先生です。",
      "en": "The woman speaking English is my teacher.",
      "blank": "___ woman speaking English is my teacher.",
      "answer": "The",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "昨日撮られた写真は美しいです。",
      "en": "The picture taken yesterday is beautiful.",
      "blank": "___ picture taken yesterday is beautiful.",
      "answer": "The",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "日本で作られた車は人気があります。",
      "en": "The car made in Japan is popular.",
      "blank": "___ car made in Japan is popular.",
      "answer": "The",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "私が今朝会った人は有名な歌手です。",
      "en": "The person I met this morning is a famous singer.",
      "blank": "The person I ___ this morning is a famous singer.",
      "answer": "met",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    },
    {
      "jp": "あなたが探している本は机の上にあります。",
      "en": "The book you are looking for is on the desk.",
      "blank": "The book you ___ looking for is on the desk.",
      "answer": "are",
      "choices": [
        "standing",
        "speaking",
        "taken",
        "made",
        "I",
        "met",
        "you",
        "are",
        "he",
        "uses",
        "we",
        "stayed"
      ],
      "explanation": "名詞を後ろから説明する表現では、分詞や「主語 + 動詞」のまとまりを使います。"
    }
  ],
  "不定詞の発展": [
    {
      "jp": "私は何をすればよいかわかりません。",
      "en": "I don't know what to do.",
      "blank": "I don't know ___ ___ ___.",
      "answer": "what to do",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女はどこへ行けばよいかわかりません。",
      "en": "She doesn't know where to go.",
      "blank": "She doesn't know ___ ___ ___.",
      "answer": "where to go",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はどちらの本を選べばよいかわかりません。",
      "en": "I don't know which book to choose.",
      "blank": "I don't know ___ ___ ___ choose.",
      "answer": "which book to",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はあなたにこの本を読んでほしいです。",
      "en": "I want you to read this book.",
      "blank": "I want you ___ ___ this book.",
      "answer": "to read",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女は私に待つように頼みました。",
      "en": "She asked me to wait.",
      "blank": "She asked me ___ ___.",
      "answer": "to wait",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "先生は私たちに英語を勉強するように言いました。",
      "en": "Our teacher told us to study English.",
      "blank": "Our teacher told us ___ ___ English.",
      "answer": "to study",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私は彼に部屋を掃除してほしいです。",
      "en": "I want him to clean his room.",
      "blank": "I want him ___ ___ his room.",
      "answer": "to clean",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はいつ出発すればよいかわかりません。",
      "en": "I don't know when to leave.",
      "blank": "I don't know ___ ___ ___.",
      "answer": "when to leave",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼はどうやってこの機械を使えばよいかわかりません。",
      "en": "He doesn't know how to use this machine.",
      "blank": "He doesn't know ___ ___ ___ this machine.",
      "answer": "how to use",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はだれに電話すればよいかわかりません。",
      "en": "I don't know who to call.",
      "blank": "I don't know ___ ___ ___.",
      "answer": "who to call",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女は私に静かにするように言いました。",
      "en": "She told me to be quiet.",
      "blank": "She told me ___ ___ quiet.",
      "answer": "to be",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "父は私に早く帰るように頼みました。",
      "en": "My father asked me to come home early.",
      "blank": "My father asked me ___ ___ home early.",
      "answer": "to come",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私は彼女にここで待ってほしいです。",
      "en": "I want her to wait here.",
      "blank": "I want her ___ ___ here.",
      "answer": "to wait",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "母は私に夕食を作ってほしいと思っています。",
      "en": "My mother wants me to cook dinner.",
      "blank": "My mother wants me ___ ___ dinner.",
      "answer": "to cook",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "先生は私たちに大きな声で読むように言いました。",
      "en": "The teacher told us to read aloud.",
      "blank": "The teacher told us ___ ___ aloud.",
      "answer": "to read",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私は何をすればよいかわかりません。",
      "en": "I don't know what to do.",
      "blank": "I ___n't know what to do.",
      "answer": "do",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女はどこへ行けばよいかわかりません。",
      "en": "She doesn't know where to go.",
      "blank": "She doesn't know where to ___.",
      "answer": "go",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はどちらの本を選べばよいかわかりません。",
      "en": "I don't know which book to choose.",
      "blank": "I don't know which book ___ choose.",
      "answer": "to",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はあなたにこの本を読んでほしいです。",
      "en": "I want you to read this book.",
      "blank": "I want you to ___ this book.",
      "answer": "read",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女は私に待つように頼みました。",
      "en": "She asked me to wait.",
      "blank": "She asked me to ___.",
      "answer": "wait",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "先生は私たちに英語を勉強するように言いました。",
      "en": "Our teacher told us to study English.",
      "blank": "Our teacher told us to ___ English.",
      "answer": "study",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私は彼に部屋を掃除してほしいです。",
      "en": "I want him to clean his room.",
      "blank": "I want him to ___ his room.",
      "answer": "clean",
      "choices": [
        "what",
        "where",
        "which",
        "book",
        "to",
        "do",
        "go",
        "read",
        "wait",
        "study",
        "clean"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はいつ出発すればよいかわかりません。",
      "en": "I don't know when to leave.",
      "blank": "I don't know when to ___.",
      "answer": "leave",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼はどうやってこの機械を使えばよいかわかりません。",
      "en": "He doesn't know how to use this machine.",
      "blank": "He doesn't know how to ___ this machine.",
      "answer": "use",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私はだれに電話すればよいかわかりません。",
      "en": "I don't know who to call.",
      "blank": "I don't know who to ___.",
      "answer": "call",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "彼女は私に静かにするように言いました。",
      "en": "She told me to be quiet.",
      "blank": "She told me to ___ quiet.",
      "answer": "be",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "父は私に早く帰るように頼みました。",
      "en": "My father asked me to come home early.",
      "blank": "My father asked me to ___ home early.",
      "answer": "come",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "私は彼女にここで待ってほしいです。",
      "en": "I want her to wait here.",
      "blank": "I want her to ___ here.",
      "answer": "wait",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "母は私に夕食を作ってほしいと思っています。",
      "en": "My mother wants me to cook dinner.",
      "blank": "My mother wants me to ___ dinner.",
      "answer": "cook",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    },
    {
      "jp": "先生は私たちに大きな声で読むように言いました。",
      "en": "The teacher told us to read aloud.",
      "blank": "The teacher told us to ___ aloud.",
      "answer": "read",
      "choices": [
        "what",
        "when",
        "where",
        "how",
        "who",
        "to",
        "leave",
        "use",
        "call",
        "wait",
        "cook",
        "read"
      ],
      "explanation": "疑問詞 + to不定詞、want 人 to、tell / ask 人 to の形を確認します。"
    }
  ],
  "前置詞の発展": [
    {
      "jp": "私は音楽に興味があります。",
      "en": "I am interested in music.",
      "blank": "I am interested ___ music.",
      "answer": "in",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼は英語が得意です。",
      "en": "He is good at English.",
      "blank": "He is good ___ English.",
      "answer": "at",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私はその知らせに驚きました。",
      "en": "I was surprised at the news.",
      "blank": "I was surprised ___ the news.",
      "answer": "at",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼女は犬の世話をします。",
      "en": "She takes care of her dog.",
      "blank": "She takes care ___ her dog.",
      "answer": "of",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私はバスを待っています。",
      "en": "I am waiting for the bus.",
      "blank": "I am waiting ___ the bus.",
      "answer": "for",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "机の上の本は私のものです。",
      "en": "The book on the desk is mine.",
      "blank": "The book ___ the desk is mine.",
      "answer": "on",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "公園にいる男の子は私の弟です。",
      "en": "The boy in the park is my brother.",
      "blank": "The boy ___ the park is my brother.",
      "answer": "in",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私は将来を楽しみにしています。",
      "en": "I am looking forward to the future.",
      "blank": "I am looking forward ___ the future.",
      "answer": "to",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼女は数学が得意です。",
      "en": "She is good at math.",
      "blank": "She is good ___ math.",
      "answer": "at",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私はその結果に満足しています。",
      "en": "I am satisfied with the result.",
      "blank": "I am satisfied ___ the result.",
      "answer": "with",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "彼はその知らせを聞いて驚きました。",
      "en": "He was surprised at the news.",
      "blank": "He was surprised ___ the news.",
      "answer": "at",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私は将来について心配しています。",
      "en": "I am worried about the future.",
      "blank": "I am worried ___ the future.",
      "answer": "about",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "彼女は動物に親切です。",
      "en": "She is kind to animals.",
      "blank": "She is kind ___ animals.",
      "answer": "to",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私はこの計画に賛成です。",
      "en": "I agree with this plan.",
      "blank": "I agree ___ this plan.",
      "answer": "with",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "彼はその本を探しています。",
      "en": "He is looking for the book.",
      "blank": "He is looking ___ the book.",
      "answer": "for",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "彼女はその赤ちゃんの世話をしています。",
      "en": "She is taking care of the baby.",
      "blank": "She is taking care ___ the baby.",
      "answer": "of",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "ドアの近くにいる少年は私の弟です。",
      "en": "The boy near the door is my brother.",
      "blank": "The boy ___ the door is my brother.",
      "answer": "near",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "机の下の箱を取ってください。",
      "en": "Please take the box under the desk.",
      "blank": "Please take the box ___ the desk.",
      "answer": "under",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私は音楽に興味があります。",
      "en": "I am interested in music.",
      "blank": "___ am interested in music.",
      "answer": "I",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼は英語が得意です。",
      "en": "He is good at English.",
      "blank": "___ is good at English.",
      "answer": "He",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私はその知らせに驚きました。",
      "en": "I was surprised at the news.",
      "blank": "___ was surprised at the news.",
      "answer": "I",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼女は犬の世話をします。",
      "en": "She takes care of her dog.",
      "blank": "___ takes care of her dog.",
      "answer": "She",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私はバスを待っています。",
      "en": "I am waiting for the bus.",
      "blank": "___ am waiting for the bus.",
      "answer": "I",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "机の上の本は私のものです。",
      "en": "The book on the desk is mine.",
      "blank": "___ book on the desk is mine.",
      "answer": "The",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "公園にいる男の子は私の弟です。",
      "en": "The boy in the park is my brother.",
      "blank": "___ boy in the park is my brother.",
      "answer": "The",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "私は将来を楽しみにしています。",
      "en": "I am looking forward to the future.",
      "blank": "___ am looking forward to the future.",
      "answer": "I",
      "choices": [
        "in",
        "at",
        "of",
        "for",
        "on",
        "to",
        "with"
      ],
      "explanation": "前置詞は、動詞や形容詞とセットで使われたり、名詞を後ろから説明したりします。"
    },
    {
      "jp": "彼女は数学が得意です。",
      "en": "She is good at math.",
      "blank": "___ is good at math.",
      "answer": "She",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私はその結果に満足しています。",
      "en": "I am satisfied with the result.",
      "blank": "___ am satisfied with the result.",
      "answer": "I",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "彼はその知らせを聞いて驚きました。",
      "en": "He was surprised at the news.",
      "blank": "___ was surprised at the news.",
      "answer": "He",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    },
    {
      "jp": "私は将来について心配しています。",
      "en": "I am worried about the future.",
      "blank": "___ am worried about the future.",
      "answer": "I",
      "choices": [
        "at",
        "with",
        "about",
        "to",
        "for",
        "of",
        "near",
        "under"
      ],
      "explanation": "動詞や形容詞とセットになる前置詞、名詞を説明する前置詞句を確認します。"
    }
  ],
  "仮定法": [
    {
      "jp": "もし私があなたなら、もっと早く出発します。",
      "en": "If I were you, I would leave earlier.",
      "blank": "___ I ___ you, I would leave earlier.",
      "answer": "If were",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし空を飛べたら、世界中を旅したいです。",
      "en": "If I could fly, I would travel around the world.",
      "blank": "If I ___ fly, I ___ travel around the world.",
      "answer": "could would",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "英語をもっと上手に話せたらいいのに。",
      "en": "I wish I could speak English better.",
      "blank": "I wish I ___ speak English better.",
      "answer": "could",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし時間があれば、あなたを手伝うのに。",
      "en": "If I had time, I would help you.",
      "blank": "If I ___ time, I ___ help you.",
      "answer": "had would",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が鳥なら、空を飛べるのに。",
      "en": "If I were a bird, I could fly.",
      "blank": "If I ___ a bird, I ___ fly.",
      "answer": "were could",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "ピアノが弾けたらいいのに。",
      "en": "I wish I could play the piano.",
      "blank": "I wish I ___ play the piano.",
      "answer": "could",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が先生なら、毎日小テストをします。",
      "en": "If I were a teacher, I would give a quiz every day.",
      "blank": "___ I ___ a teacher, I would give a quiz every day.",
      "answer": "If were",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私がもっと時間を持っていたら、本を読むのに。",
      "en": "If I had more time, I would read books.",
      "blank": "If I ___ more time, I ___ read books.",
      "answer": "had would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし英語を話せたら、外国の人と話したいです。",
      "en": "If I could speak English, I would talk with foreign people.",
      "blank": "If I ___ speak English, I ___ talk with foreign people.",
      "answer": "could would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もっと速く走れたらいいのに。",
      "en": "I wish I could run faster.",
      "blank": "I wish I ___ run faster.",
      "answer": "could",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が校長なら、図書館を大きくします。",
      "en": "If I were the principal, I would make the library bigger.",
      "blank": "If I ___ the principal, I ___ make the library bigger.",
      "answer": "were would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし彼がここにいたら、私たちを手伝ってくれるのに。",
      "en": "If he were here, he would help us.",
      "blank": "If he ___ here, he ___ help us.",
      "answer": "were would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もしお金が十分あれば、新しい自転車を買うのに。",
      "en": "If I had enough money, I would buy a new bike.",
      "blank": "If I ___ enough money, I ___ buy a new bike.",
      "answer": "had would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "フランス語を話せたらいいのに。",
      "en": "I wish I could speak French.",
      "blank": "I wish I ___ speak French.",
      "answer": "could",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私があなたなら、もっと早く出発します。",
      "en": "If I were you, I would leave earlier.",
      "blank": "If I ___ you, I would leave earlier.",
      "answer": "were",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし空を飛べたら、世界中を旅したいです。",
      "en": "If I could fly, I would travel around the world.",
      "blank": "If I could fly, I ___ travel around the world.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "英語をもっと上手に話せたらいいのに。",
      "en": "I wish I could speak English better.",
      "blank": "___ wish I could speak English better.",
      "answer": "I",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし時間があれば、あなたを手伝うのに。",
      "en": "If I had time, I would help you.",
      "blank": "If I had time, I ___ help you.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が鳥なら、空を飛べるのに。",
      "en": "If I were a bird, I could fly.",
      "blank": "If I were a bird, I ___ fly.",
      "answer": "could",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "ピアノが弾けたらいいのに。",
      "en": "I wish I could play the piano.",
      "blank": "___ wish I could play the piano.",
      "answer": "I",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が先生なら、毎日小テストをします。",
      "en": "If I were a teacher, I would give a quiz every day.",
      "blank": "If I ___ a teacher, I would give a quiz every day.",
      "answer": "were",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私がもっと時間を持っていたら、本を読むのに。",
      "en": "If I had more time, I would read books.",
      "blank": "If I had more time, I ___ read books.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし英語を話せたら、外国の人と話したいです。",
      "en": "If I could speak English, I would talk with foreign people.",
      "blank": "If I could speak English, I ___ talk with foreign people.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もっと速く走れたらいいのに。",
      "en": "I wish I could run faster.",
      "blank": "___ wish I could run faster.",
      "answer": "I",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私が校長なら、図書館を大きくします。",
      "en": "If I were the principal, I would make the library bigger.",
      "blank": "If I were the principal, I ___ make the library bigger.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし彼がここにいたら、私たちを手伝ってくれるのに。",
      "en": "If he were here, he would help us.",
      "blank": "If he were here, he ___ help us.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もしお金が十分あれば、新しい自転車を買うのに。",
      "en": "If I had enough money, I would buy a new bike.",
      "blank": "If I had enough money, I ___ buy a new bike.",
      "answer": "would",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "フランス語を話せたらいいのに。",
      "en": "I wish I could speak French.",
      "blank": "___ wish I could speak French.",
      "answer": "I",
      "choices": [
        "If",
        "were",
        "had",
        "could",
        "would",
        "wish"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし私があなたなら、もっと早く出発します。",
      "en": "If I were you, I would leave earlier.",
      "blank": "___ I were you, I would leave earlier.",
      "answer": "If",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    },
    {
      "jp": "もし空を飛べたら、世界中を旅したいです。",
      "en": "If I could fly, I would travel around the world.",
      "blank": "___ I could fly, I would travel around the world.",
      "answer": "If",
      "choices": [
        "If",
        "were",
        "was",
        "could",
        "would",
        "had",
        "can",
        "will"
      ],
      "explanation": "仮定法では、現実とは違うことや願いを、過去形を使って表します。"
    }
  ]
};

// v3.5: 中1 選択式・穴埋め式ルールをユーザー指定に合わせて再構成
(function applyV35JuniorOneRuleBank(){
  const bank = {};
  const add = (unit, jp, en, blank, answer, choices, explanation) => {
    if (!bank[unit]) bank[unit] = [];
    bank[unit].push({ jp, en, blank, answer, choices, explanation });
  };
  const blankOf = (answer) => String(answer).trim().split(/\s+/).map(() => "___").join(" ");

  const be1 = "be動詞の文①では、I は am、you / we は are を使います。肯定文・疑問文・否定文の形を確認します。";
  [
    ["私は生徒です。", "I am a student.", "___ ___ a student.", "I am"],
    ["私は愛知県出身です。", "I am from Aichi.", "___ ___ from Aichi.", "I am"],
    ["私は1年2組です。", "I am in 1-2.", "___ ___ in 1-2.", "I am"],
    ["あなたは私の友達です。", "You are my friend.", "___ ___ my friend.", "You are"],
    ["あなたは名古屋出身です。", "You are from Nagoya.", "___ ___ from Nagoya.", "You are"],
    ["私たちは生徒です。", "We are students.", "___ ___ students.", "We are"],
    ["私たちは1年2組です。", "We are in 1-2.", "___ ___ in 1-2.", "We are"],
    ["私たちは愛知県出身です。", "We are from Aichi.", "___ ___ from Aichi.", "We are"]
  ].forEach(x => add("be動詞の文①", x[0], x[1], x[2], x[3], ["I", "You", "We", "am", "are", "is"], be1));
  [
    ["あなたは英語の先生ですか。", "Are you an English teacher?", "___ ___ an English teacher?", "Are you"],
    ["あなたは愛知県出身ですか。", "Are you from Aichi?", "___ ___ from Aichi?", "Are you"],
    ["あなたは1年2組ですか。", "Are you in 1-2?", "___ ___ in 1-2?", "Are you"],
    ["あなたは生徒ですか。", "Are you a student?", "___ ___ a student?", "Are you"]
  ].forEach(x => add("be動詞の文①", x[0], x[1], x[2], x[3], ["Are", "you", "I", "am", "is", "are"], be1));
  add("be動詞の文①", "はい、そうです。", "Yes, I am.", "Yes, ___ ___.", "I am", ["I", "you", "am", "are"], be1);
  add("be動詞の文①", "いいえ、そうではありません。", "No, I am not.", "No, ___ ___ ___.", "I am not", ["I", "you", "am", "are", "not"], be1);
  [
    ["私は英語の先生ではありません。", "I'm not an English teacher.", "___ ___ an English teacher.", "I'm not"],
    ["私は生徒ではありません。", "I'm not a student.", "___ ___ a student.", "I'm not"],
    ["私たちは愛知県出身ではありません。", "We are not from Aichi.", "We ___ ___ from Aichi.", "are not"],
    ["私たちは1年2組ではありません。", "We are not in 1-2.", "We ___ ___ in 1-2.", "are not"],
    ["あなたは1年2組ではありません。", "You are not in 1-2.", "You ___ ___ in 1-2.", "are not"],
    ["あなたは英語の先生ではありません。", "You are not an English teacher.", "You ___ ___ an English teacher.", "are not"]
  ].forEach(x => add("be動詞の文①", x[0], x[1], x[2], x[3], ["I'm", "I", "am", "are", "not", "is"], be1));

  const gen1 = "一般動詞の文①では、I / you / we を主語にし、動詞は原形を使います。疑問文は Do you、否定文は don’t + 動詞の原形です。";
  [
    ["私はサッカーをします。", "I play soccer.", "___ ___ soccer.", "I play"],
    ["私は毎日英語を勉強します。", "I study English every day.", "___ ___ English every day.", "I study"],
    ["私は犬を飼っています。", "I have a dog.", "___ ___ a dog.", "I have"],
    ["あなたはテニスをします。", "You play tennis.", "___ ___ tennis.", "You play"],
    ["あなたは猫を飼っています。", "You have a cat.", "___ ___ a cat.", "You have"],
    ["私たちは毎日英語を勉強します。", "We study English every day.", "___ ___ English every day.", "We study"],
    ["私たちは放課後にサッカーをします。", "We play soccer after school.", "___ ___ soccer after school.", "We play"],
    ["私たちは音楽が好きです。", "We like music.", "___ ___ music.", "We like"]
  ].forEach(x => add("一般動詞の文①", x[0], x[1], x[2], x[3], ["I", "You", "We", "play", "study", "have", "like", "plays", "studies"], gen1));
  [
    ["あなたはサッカーをしますか。", "Do you play soccer?", "___ ___ ___ soccer?", "Do you play"],
    ["あなたは毎日英語を勉強しますか。", "Do you study English every day?", "___ ___ ___ English every day?", "Do you study"],
    ["あなたは犬を飼っていますか。", "Do you have a dog?", "___ ___ ___ a dog?", "Do you have"],
    ["あなたは音楽が好きですか。", "Do you like music?", "___ ___ ___ music?", "Do you like"],
    ["あなたは本を読みますか。", "Do you read books?", "___ ___ ___ books?", "Do you read"]
  ].forEach(x => add("一般動詞の文①", x[0], x[1], x[2], x[3], ["Do", "you", "play", "study", "have", "like", "read", "Does"], gen1));
  add("一般動詞の文①", "はい、します。", "Yes, I do.", "Yes, ___ ___.", "I do", ["I", "you", "do", "does"], gen1);
  add("一般動詞の文①", "いいえ、しません。", "No, I don't.", "No, ___ ___.", "I don't", ["I", "you", "don't", "do"], gen1);
  [
    ["私はサッカーをしません。", "I don't play soccer.", "I ___ ___ soccer.", "don't play"],
    ["私たちは毎日英語を勉強しません。", "We don't study English every day.", "We ___ ___ English every day.", "don't study"],
    ["あなたは犬を飼っていません。", "You don't have a dog.", "You ___ ___ a dog.", "don't have"],
    ["私は音楽が好きではありません。", "I don't like music.", "I ___ ___ music.", "don't like"],
    ["私たちは本を読みません。", "We don't read books.", "We ___ ___ books.", "don't read"]
  ].forEach(x => add("一般動詞の文①", x[0], x[1], x[2], x[3], ["don't", "do", "play", "study", "have", "like", "read", "doesn't"], gen1));

  const be2 = "be動詞の文②では、he / she / this / that / 三人称単数の主語に is を使います。this / that の返答は it is / it isn’t です。";
  [
    ["彼は私の兄です。", "He is my brother.", "___ ___ my brother.", "He is"],
    ["彼女は私の姉です。", "She is my sister.", "___ ___ my sister.", "She is"],
    ["これは私の本です。", "This is my book.", "___ ___ my book.", "This is"],
    ["あれはあなたの机です。", "That is your desk.", "___ ___ your desk.", "That is"],
    ["トムは私の友達です。", "Tom is my friend.", "___ ___ my friend.", "Tom is"],
    ["サラは生徒です。", "Sara is a student.", "___ ___ a student.", "Sara is"],
    ["私の兄は親切です。", "My brother is kind.", "___ ___ kind.", "My brother is"],
    ["私の姉は忙しいです。", "My sister is busy.", "___ ___ busy.", "My sister is"]
  ].forEach(x => add("be動詞の文②", x[0], x[1], x[2], x[3], ["He", "She", "This", "That", "Tom", "Sara", "My", "brother", "sister", "is", "am", "are"], be2));
  [
    ["彼はあなたの兄ですか。", "Is he your brother?", "___ ___ your brother?", "Is he"],
    ["彼女はあなたの姉ですか。", "Is she your sister?", "___ ___ your sister?", "Is she"],
    ["これはあなたのペンですか。", "Is this your pen?", "___ ___ your pen?", "Is this"],
    ["あれはあなたのかばんですか。", "Is that your bag?", "___ ___ your bag?", "Is that"],
    ["トムはあなたの友達ですか。", "Is Tom your friend?", "___ ___ your friend?", "Is Tom"],
    ["サラは生徒ですか。", "Is Sara a student?", "___ ___ a student?", "Is Sara"]
  ].forEach(x => add("be動詞の文②", x[0], x[1], x[2], x[3], ["Is", "he", "she", "this", "that", "Tom", "Sara", "are"], be2));
  add("be動詞の文②", "はい、そうです。", "Yes, he is.", "Yes, ___ ___.", "he is", ["he", "she", "it", "is", "are"], be2);
  add("be動詞の文②", "いいえ、そうではありません。", "No, she isn't.", "No, ___ ___.", "she isn't", ["he", "she", "it", "isn't", "is"], be2);
  add("be動詞の文②", "はい、そうです。", "Yes, it is.", "Yes, ___ ___.", "it is", ["it", "this", "that", "is", "are"], be2);
  add("be動詞の文②", "いいえ、そうではありません。", "No, it isn't.", "No, ___ ___.", "it isn't", ["it", "this", "that", "isn't", "is"], be2);
  [
    ["彼は私の兄ではありません。", "He is not my brother.", "He ___ ___ my brother.", "is not"],
    ["彼女は私の先生ではありません。", "She is not my teacher.", "She ___ ___ my teacher.", "is not"],
    ["これは私の本ではありません。", "This is not my book.", "This ___ ___ my book.", "is not"],
    ["あれはあなたの机ではありません。", "That is not your desk.", "That ___ ___ your desk.", "is not"],
    ["トムは私の同級生ではありません。", "Tom is not my classmate.", "Tom ___ ___ my classmate.", "is not"],
    ["これは私のペンではありません。", "This isn't my pen.", "This ___ my pen.", "isn't"],
    ["彼は私の兄ではありません。", "He isn't my brother.", "He ___ my brother.", "isn't"]
  ].forEach(x => add("be動詞の文②", x[0], x[1], x[2], x[3], ["is", "not", "isn't", "am", "are"], be2));

  const gen2 = "一般動詞の文②では、三人称単数の主語では肯定文の動詞に s / es / ies がつきます。疑問文・否定文では does / doesn’t を使い、動詞は原形に戻します。";
  [
    ["彼はサッカーをします。", "He plays soccer.", "___ ___ soccer.", "He plays"],
    ["サラは音楽が好きです。", "Sara likes music.", "___ ___ music.", "Sara likes"],
    ["私の兄は毎日英語を勉強します。", "My brother studies English every day.", "___ ___ ___ English every day.", "My brother studies"],
    ["彼女は夕食後にテレビを見ます。", "She watches TV after dinner.", "___ ___ TV after dinner.", "She watches"],
    ["彼は犬を飼っています。", "He has a dog.", "___ ___ a dog.", "He has"],
    ["トムは学校へ行きます。", "Tom goes to school.", "___ ___ to school.", "Tom goes"]
  ].forEach(x => add("一般動詞の文②", x[0], x[1], x[2], x[3], ["He", "She", "Sara", "Tom", "My", "brother", "play", "plays", "like", "likes", "study", "studies", "watch", "watches", "have", "has", "go", "goes"], gen2));
  [
    ["彼はサッカーをしますか。", "Does he play soccer?", "___ ___ ___ soccer?", "Does he play"],
    ["彼女は音楽が好きですか。", "Does she like music?", "___ ___ ___ music?", "Does she like"],
    ["彼は毎日英語を勉強しますか。", "Does he study English every day?", "___ ___ ___ English every day?", "Does he study"],
    ["彼女は夕食後にテレビを見ますか。", "Does she watch TV after dinner?", "___ ___ ___ TV after dinner?", "Does she watch"],
    ["トムは学校へ行きますか。", "Does Tom go to school?", "___ ___ ___ to school?", "Does Tom go"]
  ].forEach(x => add("一般動詞の文②", x[0], x[1], x[2], x[3], ["Does", "he", "she", "Tom", "play", "like", "study", "watch", "go", "plays", "likes", "Do"], gen2));
  add("一般動詞の文②", "はい、します。", "Yes, he does.", "Yes, ___ ___.", "he does", ["he", "she", "does", "do"], gen2);
  add("一般動詞の文②", "いいえ、しません。", "No, she doesn't.", "No, ___ ___.", "she doesn't", ["he", "she", "doesn't", "does"], gen2);
  [
    ["彼はサッカーをしません。", "He does not play soccer.", "He ___ ___ ___ soccer.", "does not play"],
    ["彼女は音楽が好きではありません。", "She doesn't like music.", "She ___ ___ music.", "doesn't like"],
    ["彼は毎日英語を勉強しません。", "He doesn't study English every day.", "He ___ ___ English every day.", "doesn't study"],
    ["彼女は夕食後にテレビを見ません。", "She doesn't watch TV after dinner.", "She ___ ___ TV after dinner.", "doesn't watch"],
    ["彼は犬を飼っていません。", "He doesn't have a dog.", "He ___ ___ a dog.", "doesn't have"]
  ].forEach(x => add("一般動詞の文②", x[0], x[1], x[2], x[3], ["does", "not", "doesn't", "play", "like", "study", "watch", "have", "plays", "likes"], gen2));

  const beSum = "be動詞のまとめでは、主語を見て am / is / are を使い分けます。主語とbe動詞の組み合わせを確認します。";
  [
    ["私は生徒です。", "I am a student.", "___ ___ a student.", "I am"],
    ["あなたは親切です。", "You are kind.", "___ ___ kind.", "You are"],
    ["私たちは1年2組です。", "We are in 1-2.", "___ ___ in 1-2.", "We are"],
    ["彼は私の友達です。", "He is my friend.", "___ ___ my friend.", "He is"],
    ["彼女は忙しいです。", "She is busy.", "___ ___ busy.", "She is"],
    ["これは私のペンです。", "This is my pen.", "___ ___ my pen.", "This is"],
    ["あれは図書館です。", "That is a library.", "___ ___ a library.", "That is"],
    ["彼らは愛知県出身です。", "They are from Aichi.", "___ ___ from Aichi.", "They are"],
    ["これらは私の本です。", "These are my books.", "___ ___ my books.", "These are"],
    ["あれらはあなたのかばんです。", "Those are your bags.", "___ ___ your bags.", "Those are"],
    ["トムは私の同級生です。", "Tom is my classmate.", "___ ___ my classmate.", "Tom is"],
    ["私の友達は親切です。", "My friends are kind.", "___ ___ kind.", "My friends are"]
  ].forEach(x => add("be動詞のまとめ", x[0], x[1], x[2], x[3], ["I", "You", "We", "He", "She", "They", "These", "Those", "My", "friends", "am", "is", "are"], beSum));

  const genSum = "一般動詞のまとめでは、主語を見て動詞の形、Do / Does、don’t / doesn’t を使い分けます。疑問文・否定文では動詞は原形に戻します。";
  [
    ["私はサッカーをします。", "I play soccer.", "___ ___ soccer.", "I play"],
    ["私たちは毎日英語を勉強します。", "We study English every day.", "___ ___ English every day.", "We study"],
    ["彼女は音楽が好きです。", "She likes music.", "___ ___ music.", "She likes"],
    ["トムは夕食後にテレビを見ます。", "Tom watches TV after dinner.", "___ ___ TV after dinner.", "Tom watches"],
    ["私の兄は犬を飼っています。", "My brother has a dog.", "___ ___ ___ a dog.", "My brother has"],
    ["彼らは放課後にサッカーをします。", "They play soccer after school.", "___ ___ soccer after school.", "They play"],
    ["あなたはサッカーをしますか。", "Do you play soccer?", "___ ___ ___ soccer?", "Do you play"],
    ["彼は毎日英語を勉強しますか。", "Does he study English every day?", "___ ___ ___ English every day?", "Does he study"],
    ["サラは音楽が好きですか。", "Does Sara like music?", "___ ___ ___ music?", "Does Sara like"],
    ["彼らは夕食後にテレビを見ますか。", "Do they watch TV after dinner?", "___ ___ ___ TV after dinner?", "Do they watch"],
    ["私はサッカーをしません。", "I don't play soccer.", "I ___ ___ soccer.", "don't play"],
    ["彼は音楽が好きではありません。", "He doesn't like music.", "He ___ ___ music.", "doesn't like"],
    ["彼らは犬を飼っていません。", "They don't have a dog.", "They ___ ___ a dog.", "don't have"]
  ].forEach(x => add("一般動詞の文のまとめ", x[0], x[1], x[2], x[3], ["I", "you", "he", "she", "they", "Do", "Does", "don't", "doesn't", "play", "plays", "study", "studies", "like", "likes", "watch", "watches", "have", "has"], genSum));

  const np = "名詞・代名詞の基本では、名詞の複数形と、文の中で必要な代名詞の形を確認します。";
  [
    ["私は本を2冊持っています。", "I have two books.", "I have two ___.", "books", ["book", "books", "box", "boxes"]],
    ["私は箱を3つ持っています。", "I have three boxes.", "I have three ___.", "boxes", ["box", "boxes", "book", "books"]],
    ["私は時計を2つ持っています。", "I have two watches.", "I have two ___.", "watches", ["watch", "watches", "city", "cities"]],
    ["私は市を3つ知っています。", "I know three cities.", "I know three ___.", "cities", ["city", "cities", "baby", "babies"]],
    ["これは私の本です。", "This is my book.", "This is ___ ___.", "my book", ["my", "me", "I", "book", "books"]],
    ["あれはあなたの机です。", "That is your desk.", "That is ___ ___.", "your desk", ["your", "you", "desk", "desks"]],
    ["これは彼女のかばんです。", "This is her bag.", "This is ___ ___.", "her bag", ["she", "her", "bag", "bags"]],
    ["これは私たちの英語の先生です。", "This is our English teacher.", "This is ___ ___ ___.", "our English teacher", ["our", "us", "English", "teacher", "teachers"]],
    ["これらは彼らの新しい本です。", "These are their new books.", "These are ___ ___ ___.", "their new books", ["they", "their", "new", "book", "books"]],
    ["私は彼が好きです。", "I like him.", "I like ___.", "him", ["he", "his", "him", "her"]],
    ["彼女は私を知っています。", "She knows me.", "She knows ___.", "me", ["I", "my", "me", "mine"]],
    ["私たちは彼らを助けます。", "We help them.", "We help ___.", "them", ["they", "their", "them", "we"]],
    ["この本は私のものです。", "This book is mine.", "This book is ___.", "mine", ["my", "me", "mine", "I"]]
  ].forEach(x => add("名詞・代名詞の基本", x[0], x[1], x[2], x[3], x[4], np));

  const imp = "命令文では主語を置かず、動詞の原形から始めます。否定命令文は Don’t + 動詞の原形です。";
  [
    ["ドアを開けなさい。", "Open the door.", "___ the door.", "Open"],
    ["英語を勉強しなさい。", "Study English.", "___ English.", "Study"],
    ["ここに名前を書きなさい。", "Write your name here.", "___ your name here.", "Write"],
    ["ここで走ってはいけません。", "Don't run here.", "___ ___ here.", "Don't run"],
    ["ドアを開けてはいけません。", "Don't open the door.", "___ ___ the door.", "Don't open"],
    ["日本語を話してはいけません。", "Don't speak Japanese.", "___ ___ Japanese.", "Don't speak"],
    ["窓を開けてください。", "Please open the window.", "___ ___ the window.", "Please open"],
    ["あなたの名前を書いてください。", "Write your name, please.", "___ your name, please.", "Write"]
  ].forEach(x => add("基本表現の広がり①", x[0], x[1], x[2], x[3], ["Open", "Study", "Write", "Don't", "run", "open", "speak", "Please"], imp));
  const can = "can の後ろは必ず動詞の原形です。主語が he / she でも can plays にはしません。";
  [
    ["私は速く走ることができます。", "I can run fast.", "I ___ ___ fast.", "can run"],
    ["彼女は英語を話すことができます。", "She can speak English.", "She ___ ___ English.", "can speak"],
    ["彼らはピアノを弾くことができます。", "They can play the piano.", "They ___ ___ the piano.", "can play"],
    ["あなたは英語を話すことができますか。", "Can you speak English?", "___ ___ ___ English?", "Can you speak"],
    ["彼女はピアノを弾くことができますか。", "Can she play the piano?", "___ ___ ___ the piano?", "Can she play"],
    ["はい、できます。", "Yes, I can.", "Yes, ___ ___.", "I can"],
    ["いいえ、できません。", "No, she can't.", "No, ___ ___.", "she can't"],
    ["私は速く走ることができません。", "I can't run fast.", "I ___ ___ fast.", "can't run"],
    ["彼は英語を話すことができません。", "He can't speak English.", "He ___ ___ English.", "can't speak"]
  ].forEach(x => add("基本表現の広がり①", x[0], x[1], x[2], x[3], ["can", "can't", "Can", "I", "you", "she", "run", "speak", "play", "cans"], can));

  const there = "存在構文では、単数なら There is、複数なら There are を使います。How many の後ろは複数名詞です。";
  [
    ["机の上に本が1冊あります。", "There is a book on the desk.", "___ ___ a book on the desk.", "There is"],
    ["かばんの中にペンが1本あります。", "There is a pen in the bag.", "___ ___ a pen in the bag.", "There is"],
    ["机の上に本が2冊あります。", "There are two books on the desk.", "___ ___ two books on the desk.", "There are"],
    ["部屋にたくさんの生徒がいます。", "There are many students in the room.", "___ ___ many students in the room.", "There are"],
    ["机の上に本はありません。", "There is not a book on the desk.", "___ ___ ___ a book on the desk.", "There is not"],
    ["机の上に本は1冊もありません。", "There are not any books on the desk.", "___ ___ ___ any books on the desk.", "There are not"],
    ["机の上に本がありますか。", "Is there a book on the desk?", "___ ___ a book on the desk?", "Is there"],
    ["机の上に本はありますか。", "Are there any books on the desk?", "___ ___ any books on the desk?", "Are there"],
    ["部屋には何人の生徒がいますか。", "How many students are there in the room?", "___ ___ ___ ___ ___ in the room?", "How many students are there"],
    ["机の上には何冊の本がありますか。", "How many books are there on the desk?", "___ ___ ___ ___ ___ on the desk?", "How many books are there"]
  ].forEach(x => add("存在構文", x[0], x[1], x[2], x[3], ["There", "is", "are", "not", "Is", "Are", "How", "many", "students", "books", "there"], there));

  const how = "方法をたずねる文では、日本語に合わせて How do you / How can I・we / Can you を使い分けます。";
  [
    ["あなたはどうやって学校へ行きますか。", "How do you go to school?", "___ ___ ___ go to school?", "How do you"],
    ["あなたはどうやって英語を勉強しますか。", "How do you study English?", "___ ___ ___ study English?", "How do you"],
    ["あなたはどうやって学校へ行きますか。", "How do you go to school?", "___ ___ ___ ___ to school?", "How do you go"],
    ["私はどうやって駅へ行けますか。", "How can I go to the station?", "___ ___ ___ go to the station?", "How can I"],
    ["私たちはどうやって英語を勉強できますか。", "How can we study English?", "___ ___ ___ study English?", "How can we"],
    ["私を手伝ってくれますか。", "Can you help me?", "___ ___ ___ me?", "Can you help"],
    ["ドアを開けてくれますか。", "Can you open the door?", "___ ___ ___ the door?", "Can you open"]
  ].forEach(x => add("方法をたずねる文", x[0], x[1], x[2], x[3], ["How", "do", "you", "can", "I", "we", "Can", "help", "open", "go", "study"], how));

  const prog = "現在進行形は be動詞 + 動詞ing で作ります。動詞＋前置詞は語数分に分けて空欄を用意します。";
  [
    ["私は今英語を勉強しています。", "I am studying English now.", "I ___ ___ English now.", "am studying"],
    ["彼は今サッカーをしています。", "He is playing soccer now.", "He ___ ___ soccer now.", "is playing"],
    ["彼らは今テレビを見ています。", "They are watching TV now.", "They ___ ___ TV now.", "are watching"],
    ["彼女は今音楽を聴いています。", "She is listening to music now.", "She ___ ___ ___ music now.", "is listening to"],
    ["あなたは今英語を勉強していますか。", "Are you studying English now?", "___ ___ ___ English now?", "Are you studying"],
    ["彼は今サッカーをしていますか。", "Is he playing soccer now?", "___ ___ ___ soccer now?", "Is he playing"],
    ["彼女は今音楽を聴いていますか。", "Is she listening to music now?", "___ ___ ___ ___ music now?", "Is she listening to"],
    ["私は今英語を勉強していません。", "I am not studying English now.", "I ___ ___ ___ English now.", "am not studying"],
    ["彼は今サッカーをしていません。", "He is not playing soccer now.", "He ___ ___ ___ soccer now.", "is not playing"],
    ["彼は今音楽を聴いていません。", "He isn't listening to music now.", "He ___ ___ ___ music now.", "isn't listening to"],
    ["彼は今音楽を聴いていません。", "He is not listening to music now.", "He ___ ___ ___ ___ music now.", "is not listening to"]
  ].forEach(x => add("現在進行形", x[0], x[1], x[2], x[3], ["am", "is", "are", "not", "isn't", "aren't", "studying", "playing", "watching", "listening", "to", "Are", "Is", "you", "he", "she"], prog));

  const past = "過去の文では、一般動詞は過去形を使います。Did / didn’t を使う疑問文・否定文では動詞は原形に戻します。be動詞の過去形は was / were です。";
  [
    ["私は昨日サッカーをしました。", "I played soccer yesterday.", "I ___ soccer yesterday.", "played"],
    ["彼女は昨夜英語を勉強しました。", "She studied English last night.", "She ___ English last night.", "studied"],
    ["彼は夕食後にテレビを見ました。", "He watched TV after dinner.", "He ___ TV after dinner.", "watched"],
    ["私たちは昨日学校へ行きました。", "We went to school yesterday.", "We ___ to school yesterday.", "went"],
    ["私は昨日音楽を聴きました。", "I listened to music yesterday.", "I ___ ___ music yesterday.", "listened to"],
    ["あなたは昨日サッカーをしましたか。", "Did you play soccer yesterday?", "___ ___ ___ soccer yesterday?", "Did you play"],
    ["彼女は昨夜英語を勉強しましたか。", "Did she study English last night?", "___ ___ ___ English last night?", "Did she study"],
    ["彼は昨日学校へ行きましたか。", "Did he go to school yesterday?", "___ ___ ___ to school yesterday?", "Did he go"],
    ["あなたは昨日音楽を聴きましたか。", "Did you listen to music yesterday?", "___ ___ ___ ___ music yesterday?", "Did you listen to"],
    ["私は昨日サッカーをしませんでした。", "I didn't play soccer yesterday.", "I ___ ___ soccer yesterday.", "didn't play"],
    ["彼女は昨夜英語を勉強しませんでした。", "She didn't study English last night.", "She ___ ___ English last night.", "didn't study"],
    ["私は昨日音楽を聴きませんでした。", "I didn't listen to music yesterday.", "I ___ ___ ___ music yesterday.", "didn't listen to"],
    ["私は昨日忙しかったです。", "I was busy yesterday.", "___ ___ busy yesterday.", "I was"],
    ["彼女は昨日うれしそうでした。", "She was happy yesterday.", "___ ___ happy yesterday.", "She was"],
    ["彼らは昨日公園にいました。", "They were in the park yesterday.", "___ ___ in the park yesterday.", "They were"],
    ["あなたは昨日忙しかったですか。", "Were you busy yesterday?", "___ ___ busy yesterday?", "Were you"],
    ["彼は昨日公園にいましたか。", "Was he in the park yesterday?", "___ ___ in the park yesterday?", "Was he"],
    ["私は昨日忙しくありませんでした。", "I was not busy yesterday.", "I ___ ___ busy yesterday.", "was not"],
    ["彼らは昨日公園にいませんでした。", "They were not in the park yesterday.", "They ___ ___ in the park yesterday.", "were not"],
    ["彼は昨日忙しくありませんでした。", "He wasn't busy yesterday.", "He ___ busy yesterday.", "wasn't"],
    ["私たちは昨日学校にいませんでした。", "We weren't at school yesterday.", "We ___ at school yesterday.", "weren't"]
  ].forEach(x => add("過去形の基本", x[0], x[1], x[2], x[3], ["played", "studied", "watched", "went", "listen", "listened", "to", "Did", "didn't", "play", "study", "go", "was", "were", "not", "wasn't", "weren't", "I", "you", "he", "she", "they"], past));

  Object.assign(EXPANDED_QUESTION_BANK, bank);
})();

function makeExpandedBankQuestion(unit, grade, level) {
  const bank = EXPANDED_QUESTION_BANK[unit];
  if (!Array.isArray(bank) || bank.length === 0) return null;
  const index = Math.floor(Math.random() * bank.length);
  const item = bank[index];
  return baseQuestion({
    unit,
    grade,
    level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: item.choices,
    explanation: item.explanation,
    sourceKey: buildBankQuestionKey(unit, index)
  });
}

function generateQuestion(unit, grade, level) {
  if (isTeacherUnitSelection(unit)) return makeTeacherAddedQuestion(level, getTeacherUnitName(unit));
  if (unit === TEACHER_UNIT_NAME) return makeTeacherAddedQuestion(level);
  const expandedQuestion = makeExpandedBankQuestion(unit, grade, level);
  if (expandedQuestion) return expandedQuestion;
  if (unit === "be動詞のまとめ") {
    return generateQuestion(pick(["be動詞の文①", "be動詞の文②"]), grade, level);
  }
  if (unit === "一般動詞の文のまとめ") {
    return generateQuestion(pick(["一般動詞の文①", "一般動詞の文②"]), grade, level);
  }
  if (unit === "be動詞の文①" || unit === "be動詞の文②") {
    const form = pick(["positive", "negative", "question"]);
    if (form === "negative") return makeBeNegativeQuestion(unit, grade, level);
    if (form === "question") return makeBeQuestionForm(unit, grade, level);
    return makeBeQuestion(unit, grade, level);
  }
  if (unit === "一般動詞の文①" || unit === "一般動詞の文②") {
    return makeGeneralVerbQuestion(unit, grade, level, pick(["positive", "negative", "question"]));
  }
  if (unit === "名詞・代名詞の基本") return pick([makePluralQuestion, makePronounQuestion])(unit, grade, level);
  if (unit === "疑問詞を使った疑問文") return makeWhQuestion(unit, grade, level, pick(["what", "who", "when", "where"]));
  if (unit === "基本表現の広がり①") return pick([makeImperativeQuestion, (u,g,l)=>makeModalQuestion(u,g,l,"can")])(unit, grade, level);
  if (unit === "存在構文") return makeThereIsQuestion(unit, grade, level);
  if (unit === "方法をたずねる文") return makeWhQuestion(unit, grade, level, pick(["how", "what"]));
  if (unit === "過去形の基本") return pick([makePastVerbQuestion, makePastBeQuestion])(unit, grade, level);
  if (unit === "過去・進行形の発展") return pick([makePastBeQuestion, (u,g,l)=>makeProgressiveQuestion(u,g,l,"past")])(unit, grade, level);
  if (unit === "接続詞 when" || unit === "接続詞 if" || unit === "接続詞と文をつなぐ表現") return makeConjunctionQuestion(unit, grade, level);
  if (unit === "未来表現") return pick([makeBeGoingToQuestion, (u,g,l)=>makeWillQuestion(u,g,l,pick(["positive","negative","question"]))])(unit, grade, level);
  if (unit === "助動詞・必要を表す文") return pick([
    (u,g,l)=>makeModalQuestion(u,g,l,"can"),
    (u,g,l)=>makeModalQuestion(u,g,l,"may"),
    (u,g,l)=>makeModalQuestion(u,g,l,"shall"),
    (u,g,l)=>makeModalQuestion(u,g,l,"must"),
    (u,g,l)=>makeHaveToQuestion(u,g,l,pick(["positive","negative","question"]))
  ])(unit, grade, level);
  if (unit === "不定詞・動名詞") return pick([makeInfinitiveQuestion, makeGerundQuestion])(unit, grade, level);
  if (unit === "人にものを渡す・伝える文") return makeSvooQuestion(unit, grade, level);
  if (unit === "前置詞の基本" || unit === "前置詞の発展") return makePrepositionQuestion(unit, grade, level);
  if (unit === "It is 構文") return makeItForToQuestion(unit, grade, level);
  if (unit === "比較") return makeComparisonQuestion(unit, grade, level, pick(["comparative", "superlative", "as"]));
  if (unit === "受け身" || unit === "受け身の発展") return makePassiveQuestion(unit, grade, level, pick(["positive", "questionNegative", "noBy"]));
  if (unit === "人やものを説明する文") return makeSvocQuestion(unit, grade, level);
  if (unit === "現在完了") return makePresentPerfectQuestion(unit, grade, level, pick(["continuous", "experience", "completion"]));
  if (unit === "関係代名詞") return makeRelativeQuestion(unit, grade, level);
  if (unit === "thatを使う文・間接疑問文") return makeIndirectQuestion(unit, grade, level);
  if (unit === "名詞を後ろから説明する文") return pick([makeParticipleQuestion, makePostModifierQuestion])(unit, grade, level);
  if (unit === "不定詞の発展") return pick([makeWhToQuestion, makeWantPersonToQuestion])(unit, grade, level);
  if (unit === "仮定法") return makeSubjunctiveQuestion(unit, grade, level);

  if (unit.includes("I am") || unit.includes("He is") || unit.includes("This is") || unit.includes("be動詞の使い分け")) return makeBeQuestion(unit, grade, level);
  if (unit.includes("be動詞の否定文")) return makeBeNegativeQuestion(unit, grade, level);
  if (unit.includes("be動詞の疑問文")) return makeBeQuestionForm(unit, grade, level);
  if (unit.includes("一般動詞とは")) return makeGeneralVerbQuestion(unit, grade, level, "positive");
  if (unit.includes("一般動詞の否定文")) return makeGeneralVerbQuestion(unit, grade, level, "negative");
  if (unit.includes("一般動詞の疑問文")) return makeGeneralVerbQuestion(unit, grade, level, "question");
  if (unit.includes("疑問詞what")) return makeWhQuestion(unit, grade, level, "what");
  if (unit.includes("疑問詞who")) return makeWhQuestion(unit, grade, level, "who");
  if (unit.includes("疑問詞when")) return makeWhQuestion(unit, grade, level, "when");
  if (unit.includes("疑問詞where")) return makeWhQuestion(unit, grade, level, "where");
  if (unit.includes("複数形")) return makePluralQuestion(unit, grade, level);
  if (unit.includes("命令文")) return makeImperativeQuestion(unit, grade, level);
  if (unit.includes("代名詞")) return makePronounQuestion(unit, grade, level);
  if (unit.includes("現在進行形")) return makeProgressiveQuestion(unit, grade, level, "present");
  if (unit.includes("can")) return makeModalQuestion(unit, grade, level, "can");
  if (unit.includes("一般動詞の過去形")) return makePastVerbQuestion(unit, grade, level);
  if (unit.includes("be動詞の過去形")) return makePastBeQuestion(unit, grade, level);
  if (unit.includes("過去進行形")) return makeProgressiveQuestion(unit, grade, level, "past");
  if (unit.includes("look")) return makeLinkingVerbQuestion(unit, grade, level);
  if (unit.includes("be going to")) return makeBeGoingToQuestion(unit, grade, level);
  if (unit.includes("give")) return makeSvooQuestion(unit, grade, level);
  if (unit.includes("不定詞")) return makeInfinitiveQuestion(unit, grade, level);
  if (unit.includes("willの疑問文")) return makeWillQuestion(unit, grade, level, "question");
  if (unit.includes("willの否定文")) return makeWillQuestion(unit, grade, level, "negative");
  if (unit.includes("未来形will")) return makeWillQuestion(unit, grade, level, "positive");
  if (unit.includes("have toの疑問文")) return makeHaveToQuestion(unit, grade, level, "question");
  if (unit.includes("have toの否定文")) return makeHaveToQuestion(unit, grade, level, "negative");
  if (unit === "have to") return makeHaveToQuestion(unit, grade, level, "positive");
  if (unit.includes("mustの疑問文")) return makeModalQuestion(unit, grade, level, "mustQuestion");
  if (unit.includes("mustの否定文")) return makeModalQuestion(unit, grade, level, "mustNot");
  if (unit === "must") return makeModalQuestion(unit, grade, level, "must");
  if (unit === "may") return makeModalQuestion(unit, grade, level, "may");
  if (unit === "shall") return makeModalQuestion(unit, grade, level, "shall");
  if (unit.includes("動名詞")) return makeGerundQuestion(unit, grade, level);
  if (unit.includes("There is")) return makeThereIsQuestion(unit, grade, level);
  if (unit.includes("接続詞")) return makeConjunctionQuestion(unit, grade, level);
  if (unit.includes("比較級")) return makeComparisonQuestion(unit, grade, level, "comparative");
  if (unit.includes("最上級")) return makeComparisonQuestion(unit, grade, level, "superlative");
  if (unit.includes("as ... as")) return makeComparisonQuestion(unit, grade, level, "as");
  if (unit.includes("前置詞の種類") || unit.includes("前置詞の使い方")) return makePrepositionQuestion(unit, grade, level);
  if (unit.includes("受動態でby")) return makePassiveQuestion(unit, grade, level, "noBy");
  if (unit.includes("受動態の疑問文")) return makePassiveQuestion(unit, grade, level, "questionNegative");
  if (unit.includes("受動態")) return makePassiveQuestion(unit, grade, level, "positive");
  if (unit.includes("call")) return makeSvocQuestion(unit, grade, level);
  if (unit.includes("現在完了形の継続")) return makePresentPerfectQuestion(unit, grade, level, "continuous");
  if (unit.includes("現在完了形の経験")) return makePresentPerfectQuestion(unit, grade, level, "experience");
  if (unit.includes("現在完了形の完了")) return makePresentPerfectQuestion(unit, grade, level, "completion");
  if (unit.includes("疑問詞 + to")) return makeWhToQuestion(unit, grade, level);
  if (unit.includes("It is")) return makeItForToQuestion(unit, grade, level);
  if (unit.includes("want 人 to")) return makeWantPersonToQuestion(unit, grade, level);
  if (unit.includes("間接疑問文")) return makeIndirectQuestion(unit, grade, level);
  if (unit.includes("現在分詞") || unit.includes("過去分詞")) return makeParticipleQuestion(unit, grade, level);
  if (unit.includes("主語＋動詞")) return makePostModifierQuestion(unit, grade, level);
  if (unit.includes("関係代名詞")) return makeRelativeQuestion(unit, grade, level);
  return makeFallbackQuestion(unit, grade, level);
}



function sanitizeJapanese(text) {
  return String(text)
    .replace(/音楽を聞/g, "音楽を聴")
    .replace(/音楽を好きますか/g, "音楽を聴きますか")
    .replace(/音楽を好きます/g, "音楽を聴きます")
    .replace(/音楽を好きません/g, "音楽を聴きません")
    .replace(/音楽を好きる/g, "音楽を聴く")
    .replace(/音楽を好く/g, "音楽を聴く")
    .replace(/音楽を好みます/g, "音楽が好きです")
    .replace(/音楽を好みません/g, "音楽が好きではありません")
    .replace(/音楽を聞/g, "音楽を聴")
    .replace(/どのようにして/g, "どうやって")
    .replace(/1つの本があります/g, "本が1冊あります")
    .replace(/1つの辞書があります/g, "辞書が1冊あります")
    .replace(/1つのノートがあります/g, "ノートが1冊あります")
    .replace(/1つのペンがあります/g, "ペンが1本あります")
    .replace(/1つの箱があります/g, "箱が1個あります")
    .replace(/1つのリンゴがあります/g, "リンゴが1個あります");
}

function jpDo(verb) {
  return `${verb.object.jp}を${verb.jpDict}`;
}

function jpMasu(verb) {
  return `${verb.object.jp}を${verb.jpMasu}`;
}

function jpNegative(verb) {
  return `${verb.object.jp}を${verb.jpNegative}`;
}

function jpPast(verb) {
  return `${verb.object.jp}を${verb.jpPast}`;
}

function jpTe(verb) {
  return `${verb.object.jp}を${verb.jpTe}`;
}

function jpTePlain(verb) {
  return `${verb.object.jp}を${verb.jpTePlain}`;
}

function jpNai(verb) {
  return `${verb.object.jp}を${verb.jpNai}`;
}

function jpTai(verb) {
  return `${verb.object.jp}を${verb.jpTai}`;
}

function jpNakereba(verb) {
  return `${verb.object.jp}を${verb.jpNaiStem}なければなりません`;
}

function jpCount(noun, num) {
  return `${noun.jp}を${num}${noun.counter || "つ"}`;
}


function makeCoreBlank(phrase) {
  return tokenize(phrase).map(() => "___").join(" ");
}

function countBlankSlots(sentence) {
  return (String(sentence || "").match(/___/g) || []).length;
}

function expandBlankSlotsForAnswer(sentence, answer) {
  const text = String(sentence || "");
  const answerCount = tokenize(answer).length;
  const blankCount = countBlankSlots(text);
  if (!answerCount || blankCount >= answerCount) return text;
  if (!blankCount) return text;

  // 複数語の答えに対して空欄数が足りない場合は、
  // 文頭の助動詞・be動詞側ではなく、基本的に最後の空欄を広げる。
  // 例：___ he ___ music? / Does listen to
  // → ___ he ___ ___ music?
  // 例：I was ___ ___ music. / not listening to
  // → I was ___ ___ ___ music.
  const blanksToPutInLastSlot = answerCount - blankCount + 1;
  const expandedBlank = Array.from({ length: blanksToPutInLastSlot }, () => "___").join(" ");
  const lastBlankIndex = text.lastIndexOf("___");
  if (lastBlankIndex < 0) return text;
  return `${text.slice(0, lastBlankIndex)}${expandedBlank}${text.slice(lastBlankIndex + 3)}`;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function corePhraseRegex(phrase) {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|[.,?!]|$)`);
}

function hasCorePhrase(fullSentence, phrase) {
  if (!phrase) return false;
  return corePhraseRegex(phrase).test(String(fullSentence || ""));
}

function replaceCorePhrase(fullSentence, phrase) {
  const full = String(fullSentence || "");
  if (!hasCorePhrase(full, phrase)) return null;
  return full.replace(corePhraseRegex(phrase), (match, prefix) => `${prefix}${makeCoreBlank(phrase)}`);
}

function applyCoreBlank(question, phrase, extraChoices = []) {
  const blank = replaceCorePhrase(question.fullSentence, phrase);
  if (!blank) return question;
  return {
    ...question,
    blankSentence: blank,
    blankAnswer: phrase,
    choices: unique([...tokenize(phrase), ...extraChoices, ...(question.choices || [])])
  };
}

function enforceCoreBlankPolicy(question) {
  if (!question || question.teacherMade) return question;
  const unit = String(question.unit || "");
  const full = String(question.fullSentence || "");

  // 不定詞・動名詞では、主語や周辺語ではなく、必ず文法の核を問う。
  // 不定詞：to + 動詞の原形（listen to のような動詞＋前置詞は語数分の空欄）
  // 動名詞：動詞ing、または finished/enjoyed などの過去形 + 動詞ing
  if (unit === "不定詞・動名詞") {
    const basePhrases = [
      "study", "read", "play", "watch", "listen to", "help", "visit", "use",
      "clean", "cook", "get up", "speak", "drink", "be", "run", "take", "go", "make"
    ];
    const gerundPhrases = [
      "studying", "reading", "playing", "watching", "listening to", "helping", "visiting", "using",
      "cleaning", "cooking", "getting up", "speaking", "drinking", "being", "running", "taking", "going", "making"
    ];

    const candidates = [];
    for (const base of basePhrases) {
      candidates.push({ phrase: `to ${base}`, choices: ["to", ...tokenize(base), ...gerundPhrases.flatMap(tokenize)] });
      candidates.push({ phrase: `To ${base}`, choices: ["To", ...tokenize(base), ...gerundPhrases.flatMap(tokenize)] });
    }

    for (const gerund of gerundPhrases) {
      // 「I like reading books.」のような文では reading を問う。
      candidates.push({ phrase: gerund, choices: [...tokenize(gerund), "to", ...basePhrases.flatMap(tokenize)] });
      candidates.push({ phrase: cap(gerund), choices: [cap(tokenize(gerund)[0]), ...tokenize(gerund).slice(1), "To", ...basePhrases.flatMap(tokenize)] });

      // 「I finished cooking dinner.」のような文では finished cooking をまとめて問う。
      for (const pastVerb of ["finished", "enjoyed", "liked", "started", "stopped", "practiced"]) {
        candidates.push({ phrase: `${pastVerb} ${gerund}`, choices: [pastVerb, ...tokenize(gerund), "finish", "enjoy", "like", "start", "stop", "practice"] });
      }
    }

    // 長い句を優先。例：to listen to を to listen より先に見る。
    const hit = candidates
      .sort((a, b) => tokenize(b.phrase).length - tokenize(a.phrase).length)
      .find(p => hasCorePhrase(full, p.phrase));
    if (hit) return applyCoreBlank(question, hit.phrase, hit.choices);
  }

  // that節は、that だけではなく「気持ち・判断・発言 + that」までを核として問う。
  // 例：I am glad that... → I am ___ ___ ... / 答え：glad that
  const thatCoreUnits = unit === "thatを使う文・間接疑問文" || unit === "接続詞と文をつなぐ表現";
  if (thatCoreUnits && hasCorePhrase(full, "that")) {
    const thatPatterns = [
      { phrase: "glad that", choices: ["happy", "sure", "surprised", "to"] },
      { phrase: "happy that", choices: ["glad", "sure", "because", "to"] },
      { phrase: "surprised that", choices: ["glad", "sure", "surprising", "to"] },
      { phrase: "sure that", choices: ["glad", "happy", "because", "to"] },
      { phrase: "think that", choices: ["thinks", "thinking", "what", "if"] },
      { phrase: "thinks that", choices: ["think", "thinking", "what", "if"] },
      { phrase: "know that", choices: ["knows", "knowing", "what", "if"] },
      { phrase: "knows that", choices: ["know", "knowing", "what", "if"] },
      { phrase: "heard that", choices: ["hear", "hears", "what", "when"] },
      { phrase: "hope that", choices: ["hopes", "hoping", "what", "if"] },
      { phrase: "believe that", choices: ["believes", "believing", "what", "if"] },
      { phrase: "said that", choices: ["say", "says", "what", "if"] }
    ];
    const hit = thatPatterns.find(p => hasCorePhrase(full, p.phrase));
    if (hit) return applyCoreBlank(question, hit.phrase, hit.choices);
  }

  // 疑問詞の単元は、疑問詞だけでなく「疑問詞 + 助動詞 / 疑問詞 + be動詞」まで問う。
  const whUnits = unit === "疑問詞を使った疑問文" || unit === "方法をたずねる文";
  if (whUnits) {
    const whPatterns = [
      { phrase: "What do", choices: ["What", "Who", "When", "Where", "do", "does"] },
      { phrase: "What does", choices: ["What", "Who", "When", "Where", "do", "does"] },
      { phrase: "When do", choices: ["When", "Where", "What", "Who", "do", "does"] },
      { phrase: "When does", choices: ["When", "Where", "What", "Who", "do", "does"] },
      { phrase: "Where do", choices: ["Where", "When", "What", "Who", "do", "does"] },
      { phrase: "Where does", choices: ["Where", "When", "What", "Who", "do", "does"] },
      { phrase: "How do", choices: ["How", "What", "When", "Where", "do", "does"] },
      { phrase: "How can", choices: ["How", "What", "Can", "do", "can"] },
      { phrase: "What time", choices: ["What", "time", "When", "Where"] },
      { phrase: "How many", choices: ["How", "many", "What", "much"] }
    ];
    const hit = whPatterns.find(p => hasCorePhrase(full, p.phrase));
    if (hit) return applyCoreBlank(question, hit.phrase, hit.choices);
  }

  // There is / are は There ではなく「There + be動詞」を核として問う。
  if (unit === "存在構文") {
    const hit = ["There is", "There are"].find(p => full.includes(p));
    if (hit) return applyCoreBlank(question, hit, ["There", "is", "are", "am", "be"]);
  }

  return question;
}

function baseQuestion({ unit, grade, level, jp, fullSentence, blankAnswer, explanation, blankSentence, choices, teacherMade = false, sourceKey = "" }) {
  const answerTokens = tokenize(blankAnswer);
  const rawSentence = blankSentence || fullSentence.replace(blankAnswer, answerTokens.map(() => "___").join(" "));
  const sentence = expandBlankSlotsForAnswer(rawSentence, blankAnswer);
  const cleanJp = sanitizeJapanese(jp);
  const base = {
    id: `q-${hashCode(`${unit}|${cleanJp}|${fullSentence}|${Math.random()}`)}`,
    unit,
    grade,
    level,
    jp: cleanJp,
    fullSentence: ensurePunctuation(fullSentence),
    blankSentence: sentence,
    blankAnswer,
    choices: choices || [],
    explanation: teacherMade ? explanation : alignGeneratedExplanation(explanation, blankAnswer),
    teacherMade,
    sourceKey
  };
  const editedBase = teacherMade ? base : applyEditedQuestionOverride(base);
  const core = enforceCoreBlankPolicy(editedBase);
  core.blankSentence = expandBlankSlotsForAnswer(core.blankSentence, core.blankAnswer);
  if (!teacherMade && core.blankAnswer !== base.blankAnswer) {
    core.explanation = alignGeneratedExplanation(explanation, core.blankAnswer);
  }
  return core;
}

function alignGeneratedExplanation(explanation, answer) {
  const clean = String(explanation || "文の形と空欄の前後を確認しましょう。").trim();
  const ans = String(answer || "").trim();
  if (!ans || clean.startsWith("答え")) return clean;
  return `答えは「${ans}」です。${clean}`;
}

function makeBeQuestion(unit, grade, level) {
  const options = [
    { jp: "私は学生です。", en: "I am a student.", answer: "am", blank: "I ___ a student." },
    { jp: "あなたは親切です。", en: "You are kind.", answer: "are", blank: "You ___ kind." },
    { jp: "彼は忙しいです。", en: "He is busy.", answer: "is", blank: "He ___ busy." },
    { jp: "彼女は私の友達です。", en: "She is my friend.", answer: "is", blank: "She ___ my friend." },
    { jp: "これは私のかばんです。", en: "This is my bag.", answer: "is", blank: "This ___ my bag." },
    { jp: "あれは図書館です。", en: "That is a library.", answer: "is", blank: "That ___ a library." }
  ];
  const item = pick(options);
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: ["am", "is", "are", "be"],
    explanation: "主語に合わせて be動詞を選びます。I は am、you や複数は are、he / she / this / that は is です。"
  });
}

function makeBeNegativeQuestion(unit, grade, level) {
  const subject = pick(VOCAB.subjects.filter(s => ["I", "you", "he", "she", "they"].includes(s.en)));
  const adjective = pick(VOCAB.adjectives);
  const full = `${cap(subject.en)} ${subject.be} not ${adjective.en}.`;
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}${adjective.jpNeg}。`,
    fullSentence: full,
    blankSentence: `${cap(subject.en)} ${subject.be} ___ ${adjective.en}.`,
    blankAnswer: "not",
    choices: ["not", "no", "don't", "isn't"],
    explanation: "be動詞の否定文は、be動詞の後ろに not を置きます。"
  });
}

function makeBeQuestionForm(unit, grade, level) {
  const subject = pick(VOCAB.subjects.filter(s => ["you", "he", "she", "they"].includes(s.en)));
  const adjective = pick(VOCAB.adjectives);
  const full = `${cap(subject.be)} ${subject.en} ${adjective.en}?`;
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}${adjective.jp}ですか。`,
    fullSentence: full,
    blankSentence: `___ ${subject.en} ${adjective.en}?`,
    blankAnswer: cap(subject.be),
    choices: [cap(subject.be), "Do", "Does", "Is"],
    explanation: "be動詞の疑問文は、be動詞を主語の前に出します。"
  });
}

function makeGeneralVerbQuestion(unit, grade, level, form) {
  const subject = pick(VOCAB.subjects.filter(s => s.en !== "I" || form !== "question"));
  const verb = pick(VOCAB.verbs.filter(v => v.base !== "visit"));
  const time = pick(VOCAB.times.filter(t => !["yesterday", "tomorrow"].includes(t.en)));
  const main = subject.type === "thirdSingle" ? verb.s : verb.base;
  const aux = subject.type === "thirdSingle" ? "does" : "do";
  const dont = subject.type === "thirdSingle" ? "doesn't" : "don't";

  if (form === "negative") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}${time.jp}${jpNegative(verb)}。`,
      fullSentence: `${cap(subject.en)} ${dont} ${verb.base} ${verb.object.en} ${time.en}.`,
      blankSentence: `${cap(subject.en)} ___ ___ ${verb.object.en} ${time.en}.`,
      blankAnswer: `${dont} ${verb.base}`,
      choices: [dont, verb.base, main, "does", "not", "didn't"],
      explanation: "一般動詞の否定文は don't / doesn't + 動詞の原形です。doesn't の後ろは三単現の s をつけません。"
    });
  }

  if (form === "question") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}${time.jp}${jpMasu(verb)}か。`,
      fullSentence: `${cap(aux)} ${subject.en} ${verb.base} ${verb.object.en} ${time.en}?`,
      blankSentence: `___ ${subject.en} ___ ${verb.object.en} ${time.en}?`,
      blankAnswer: `${cap(aux)} ${verb.base}`,
      choices: [cap(aux), verb.base, main, "Do", "Does", "did"],
      explanation: "一般動詞の疑問文は Do / Does を文頭に置きます。Does を使うと、動詞は原形に戻ります。"
    });
  }

  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}${time.jp}${jpMasu(verb)}。`,
    fullSentence: `${cap(subject.en)} ${main} ${verb.object.en} ${time.en}.`,
    blankSentence: `${cap(subject.en)} ___ ${verb.object.en} ${time.en}.`,
    blankAnswer: main,
    choices: [verb.base, verb.s, verb.ing, verb.past],
    explanation: "一般動詞は主語と時制に合わせて形を変えます。主語が三人称単数で現在なら s / es がつきます。"
  });
}

function makeWhQuestion(unit, grade, level, type) {
  const whFriendlyVerbs = VOCAB.verbs.filter(v => !["help", "visit", "use"].includes(v.base));
  const verb = pick(whFriendlyVerbs);
  const subject = pick(VOCAB.subjects.filter(s => s.en === "you" || s.en === "he" || s.en === "she"));
  const aux = subject.type === "thirdSingle" ? "does" : "do";
  if (type === "what") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}何を${verb.jpMasu}か。`,
      fullSentence: `What ${aux} ${subject.en} ${verb.base}?`,
      blankSentence: `___ ${aux} ${subject.en} ${verb.base}?`,
      blankAnswer: "What",
      choices: ["What", "Who", "When", "Where"],
      explanation: "what は『何』をたずねる疑問詞です。疑問詞は文のはじめに置きます。"
    });
  }
  if (type === "who") {
    return baseQuestion({
      unit, grade, level,
      jp: `だれが${jpMasu(verb)}か。`,
      fullSentence: `Who ${verb.s} ${verb.object.en}?`,
      blankSentence: `___ ${verb.s} ${verb.object.en}?`,
      blankAnswer: "Who",
      choices: ["Who", "What", "When", "Where"],
      explanation: "who が主語になる文では、Who plays...? のようにそのまま動詞を続けます。"
    });
  }
  if (type === "when") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}いつ${jpMasu(verb)}か。`,
      fullSentence: `When ${aux} ${subject.en} ${verb.base} ${verb.object.en}?`,
      blankSentence: `___ ${aux} ${subject.en} ${verb.base} ${verb.object.en}?`,
      blankAnswer: "When",
      choices: ["When", "Where", "Who", "What"],
      explanation: "when は『いつ』をたずねる疑問詞です。"
    });
  }
  if (type === "how") {
    const howItems = [
      { jp: "あなたはどうやって学校へ行きますか。", en: "How do you go to school?", blank: "___ do you go to school?" },
      { jp: "あなたはどうやって英語を勉強しますか。", en: "How do you study English?", blank: "___ do you study English?" },
      { jp: "私はどうやってこのペンを使えばよいですか。", en: "How can I use this pen?", blank: "___ can I use this pen?" }
    ];
    const item = pick(howItems);
    return baseQuestion({
      unit, grade, level,
      jp: item.jp,
      fullSentence: item.en,
      blankSentence: item.blank,
      blankAnswer: "How",
      choices: ["How", "What", "When", "Where"],
      explanation: "how は『どうやって』『どのように』という方法をたずねる疑問詞です。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}どこで${jpMasu(verb)}か。`,
    fullSentence: `Where ${aux} ${subject.en} ${verb.base} ${verb.object.en}?`,
    blankSentence: `___ ${aux} ${subject.en} ${verb.base} ${verb.object.en}?`,
    blankAnswer: "Where",
    choices: ["Where", "When", "Who", "What"],
    explanation: "where は『どこで』『どこへ』をたずねる疑問詞です。"
  });
}

function makePluralQuestion(unit, grade, level) {
  const noun = pick(VOCAB.nouns);
  const num = pick([2, 3, 4, 5]);
  return baseQuestion({
    unit, grade, level,
    jp: `私は${jpCount(noun, num)}持っています。`, 
    fullSentence: `I have ${num} ${noun.plural}.`,
    blankSentence: `I have ${num} ___.`,
    blankAnswer: noun.plural,
    choices: [noun.en, noun.plural, `${noun.en}s`, `${noun.en}es`],
    explanation: "2つ以上のものを表すときは名詞を複数形にします。語尾によって s / es / ies などに変わります。"
  });
}

function makeImperativeQuestion(unit, grade, level) {
  const options = [
    { jp: "窓を開けなさい。", en: "Open the window.", blank: "___ the window.", answer: "Open", choices: ["Open", "Opens", "Opening", "To open"] },
    { jp: "ここで走ってはいけません。", en: "Don't run here.", blank: "___ ___ here.", answer: "Don't run", choices: ["Don't", "run", "not", "running", "runs"] },
    { jp: "静かにしなさい。", en: "Be quiet.", blank: "___ quiet.", answer: "Be", choices: ["Be", "Is", "Are", "Being"] }
  ];
  const item = pick(options);
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: item.choices,
    explanation: "命令文は主語 you を省略し、動詞の原形から始めます。否定命令は Don't + 動詞の原形です。"
  });
}

function makePronounQuestion(unit, grade, level) {
  const options = [
    { jp: "私は彼女が好きです。", en: "I like her.", blank: "I like ___.", answer: "her", choices: ["she", "her", "hers", "his"] },
    { jp: "これは私の本です。", en: "This is my book.", blank: "This is ___ book.", answer: "my", choices: ["I", "my", "me", "mine"] },
    { jp: "彼らは私たちを知っています。", en: "They know us.", blank: "They know ___.", answer: "us", choices: ["we", "our", "us", "ours"] },
    { jp: "そのかばんは彼のものです。", en: "The bag is his.", blank: "The bag is ___.", answer: "his", choices: ["he", "him", "his", "her"] }
  ];
  const item = pick(options);
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: item.choices,
    explanation: "代名詞は、主語・所有・目的語など文の中での役割によって形が変わります。"
  });
}

function makeProgressiveQuestion(unit, grade, level, tense) {
  const subject = pick(VOCAB.subjects);
  const verb = pick(VOCAB.verbs);
  const be = tense === "past" ? subject.pastBe : subject.be;
  const jpTime = tense === "past" ? "その時" : "今";
  const enTime = tense === "past" ? "then" : "now";
  const jpAction = tense === "past" ? jpTe(verb).replace("います", "いました") : jpTe(verb);
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}${jpTime}${jpAction}。`,
    fullSentence: `${cap(subject.en)} ${be} ${verb.ing} ${verb.object.en} ${enTime}.`,
    blankSentence: `${cap(subject.en)} ___ ___ ${verb.object.en} ${enTime}.`,
    blankAnswer: `${be} ${verb.ing}`,
    choices: [be, verb.ing, verb.base, verb.s, subject.be, subject.pastBe],
    explanation: `${tense === "past" ? "過去進行形" : "現在進行形"}は be動詞 + 動詞のing形で作ります。`
  });
}

function makeModalQuestion(unit, grade, level, modalType) {
  const subject = pick(VOCAB.subjects.filter(s => s.en !== "they"));
  const modalVerbPool = (modalType === "must" || modalType === "mustQuestion" || modalType === "mustNot")
    ? VOCAB.verbs.filter(v => ["study", "read", "help", "use"].includes(v.base))
    : VOCAB.verbs.filter(v => v.base !== "visit");
  const verb = pick(modalVerbPool);
  const capSub = cap(subject.en);
  const patterns = {
    can: {
      jp: `${subject.jp}${jpDo(verb)}ことができます。`,
      full: `${capSub} can ${verb.base} ${verb.object.en}.`,
      blank: `${capSub} ___ ___ ${verb.object.en}.`,
      answer: `can ${verb.base}`,
      explanation: "can + 動詞の原形で『〜できる』を表します。"
    },
    must: {
      jp: `${subject.jp}${jpNakereba(verb)}。`,
      full: `${capSub} must ${verb.base} ${verb.object.en}.`,
      blank: `${capSub} ___ ___ ${verb.object.en}.`,
      answer: `must ${verb.base}`,
      explanation: "must + 動詞の原形で『〜しなければならない』を表します。"
    },
    mustNot: {
      jp: `${subject.jp}ここで${jpTePlain(verb)}はいけません。`,
      full: `${capSub} must not ${verb.base} ${verb.object.en} here.`,
      blank: `${capSub} ___ ___ ${verb.base} ${verb.object.en} here.`,
      answer: "must not",
      explanation: "must not は『〜してはいけない』という禁止を表します。"
    },
    mustQuestion: {
      jp: `${subject.jp}${jpNakereba(verb)}か。`,
      full: `Must ${subject.en} ${verb.base} ${verb.object.en}?`,
      blank: `___ ${subject.en} ___ ${verb.object.en}?`,
      answer: `Must ${verb.base}`,
      explanation: "must の疑問文は Must を文頭に置き、後ろは動詞の原形にします。"
    },
    may: {
      jp: `${subject.jp}このペンを使ってもよいです。`,
      full: `${capSub} may use this pen.`,
      blank: `${capSub} ___ ___ this pen.`,
      answer: "may use",
      explanation: "may + 動詞の原形で『〜してもよい』『〜かもしれない』を表します。"
    },
    shall: {
      jp: "窓を開けましょうか。",
      full: "Shall I open the window?",
      blank: "___ I ___ the window?",
      answer: "Shall open",
      explanation: "Shall I...? で『私が〜しましょうか』を表します。"
    }
  };
  const item = patterns[modalType] || patterns.can;
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.full,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: ["can", "must", "may", "Shall", "not", verb.base, verb.s, "open"],
    explanation: item.explanation
  });
}

function makePastVerbQuestion(unit, grade, level) {
  const subject = pick(VOCAB.subjects);
  const verb = pick(VOCAB.verbs);
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}昨日${jpPast(verb)}。`,
    fullSentence: `${cap(subject.en)} ${verb.past} ${verb.object.en} yesterday.`,
    blankSentence: `${cap(subject.en)} ___ ${verb.object.en} yesterday.`,
    blankAnswer: verb.past,
    choices: [verb.base, verb.s, verb.ing, verb.past],
    explanation: "yesterday など過去を表す語があるときは、一般動詞を過去形にします。"
  });
}

function makePastBeQuestion(unit, grade, level) {
  const subject = pick(VOCAB.subjects);
  const adjective = pick(VOCAB.adjectives.filter(adj => !["new", "large"].includes(adj.en)));
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}昨日、${adjective.jpPast}。`,
    fullSentence: `${cap(subject.en)} ${subject.pastBe} ${adjective.en} yesterday.`,
    blankSentence: `${cap(subject.en)} ___ ${adjective.en} yesterday.`,
    blankAnswer: subject.pastBe,
    choices: ["was", "were", "is", "are"],
    explanation: "am / is の過去形は was、are の過去形は were です。"
  });
}

function makeLinkingVerbQuestion(unit, grade, level) {
  const items = [
    { jp: "あなたはうれしそうに見えます。", en: "You look happy.", blank: "You ___ happy.", answer: "look" },
    { jp: "それはよさそうに聞こえます。", en: "It sounds good.", blank: "It ___ good.", answer: "sounds" },
    { jp: "彼女は有名になりました。", en: "She became famous.", blank: "She ___ famous.", answer: "became" },
    { jp: "外は暗くなってきています。", en: "It is getting dark outside.", blank: "It is ___ dark outside.", answer: "getting" }
  ];
  const item = pick(items);
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: [item.answer, "looks", "sounds", "becomes", "gets"],
    explanation: "look / sound / become / get などの後ろには、主語の状態を表す形容詞が続きます。"
  });
}

function makeBeGoingToQuestion(unit, grade, level) {
  const subject = pick(VOCAB.subjects.filter(s => s.en !== "they"));
  const verb = pick(VOCAB.verbs);
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}明日${jpDo(verb)}つもりです。`,
    fullSentence: `${cap(subject.en)} ${subject.be} going to ${verb.base} ${verb.object.en} tomorrow.`,
    blankSentence: `${cap(subject.en)} ___ ___ ___ ${verb.base} ${verb.object.en} tomorrow.`,
    blankAnswer: `${subject.be} going to`,
    choices: [subject.be, "going", "to", "will", verb.base, "goes"],
    explanation: "be going to + 動詞の原形で『〜するつもり』を表します。be動詞は主語に合わせます。"
  });
}

function makeSvooQuestion(unit, grade, level) {
  const items = [
    { jp: "私は彼に本をあげました。", en: "I gave him a book.", blank: "I ___ ___ a book.", answer: "gave him", choices: ["gave", "give", "him", "he", "to"] },
    { jp: "彼女は私に写真を見せました。", en: "She showed me a picture.", blank: "She ___ ___ a picture.", answer: "showed me", choices: ["showed", "shows", "me", "I", "to"] },
    { jp: "母は私にバッグを買ってくれました。", en: "My mother bought me a bag.", blank: "My mother ___ ___ a bag.", answer: "bought me", choices: ["bought", "buy", "me", "my", "for"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "give / show / tell / buy などは『動詞 + 人 + 物』の形を作れます。" });
}

function makeInfinitiveQuestion(unit, grade, level) {
  const verb = pick(VOCAB.verbs);
  const type = pick(level === "small" ? ["noun", "adverb", "adjective"] : ["noun", "adverb", "adjective", "it", "too"]);
  if (type === "adverb") {
    const purpose = pick([
      { jp: "本を読む", enVerb: "read", enObject: "books", placeJp: "図書館", placeEn: "the library", choices: ["to", "read", "reading", "for", "reads"] },
      { jp: "英語を勉強する", enVerb: "study", enObject: "English", placeJp: "図書館", placeEn: "the library", choices: ["to", "study", "studying", "for", "studies"] },
      { jp: "テニスをする", enVerb: "play", enObject: "tennis", placeJp: "公園", placeEn: "the park", choices: ["to", "play", "playing", "for", "plays"] },
      { jp: "音楽を聴く", enVerb: "listen to", enObject: "music", placeJp: "自分の部屋", placeEn: "my room", choices: ["to", "listen", "listening", "for", "to"] }
    ]);
    return baseQuestion({
      unit, grade, level,
      jp: `私は${purpose.jp}ために${purpose.placeJp}へ行きました。`,
      fullSentence: `I went to ${purpose.placeEn} to ${purpose.enVerb} ${purpose.enObject}.`,
      blankSentence: `I went to ${purpose.placeEn} ___ ${purpose.enVerb} ${purpose.enObject}.`,
      blankAnswer: "to",
      choices: purpose.choices,
      explanation: "『〜するために』は to + 動詞の原形で表せます。"
    });
  }
  if (type === "adjective") {
    return baseQuestion({
      unit, grade, level,
      jp: `私は${jpDo(verb)}ための時間が必要です。`,
      fullSentence: `I need time to ${verb.base} ${verb.object.en}.`,
      blankSentence: `I need time ___ ___ ${verb.object.en}.`,
      blankAnswer: `to ${verb.base}`,
      choices: ["to", verb.base, verb.ing, "for", "time"],
      explanation: "名詞を後ろから説明する不定詞は『〜するための』の意味になります。"
    });
  }
  if (type === "it") {
    return makeItForToQuestion(unit, grade, level);
  }
  if (type === "too") {
    return baseQuestion({
      unit, grade, level,
      jp: "この本は難しすぎて私には読めません。",
      fullSentence: "This book is too difficult for me to read.",
      blankSentence: "This book is ___ difficult for me ___ read.",
      blankAnswer: "too to",
      choices: ["too", "to", "enough", "for", "read"],
      explanation: "too ... to 動詞の原形で『〜すぎて…できない』を表します。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `私は${jpTai(verb)}です。`,
    fullSentence: `I want to ${verb.base} ${verb.object.en}.`,
    blankSentence: `I want ___ ___ ${verb.object.en}.`,
    blankAnswer: `to ${verb.base}`,
    choices: ["to", verb.base, verb.ing, verb.s, "for"],
    explanation: "『〜すること』『〜したい』の中心は to + 動詞の原形です。"
  });
}

function makeWillQuestion(unit, grade, level, form) {
  const subject = pick(VOCAB.subjects);
  const verb = pick(VOCAB.verbs);
  if (form === "question") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}明日${jpMasu(verb)}か。`,
      fullSentence: `Will ${subject.en} ${verb.base} ${verb.object.en} tomorrow?`,
      blankSentence: `___ ${subject.en} ___ ${verb.object.en} tomorrow?`,
      blankAnswer: `Will ${verb.base}`,
      choices: ["Will", verb.base, verb.s, "Do", "Does"],
      explanation: "will の疑問文は Will を文頭に置き、後ろは動詞の原形にします。"
    });
  }
  if (form === "negative") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}明日${jpNai(verb)}でしょう。`,
      fullSentence: `${cap(subject.en)} will not ${verb.base} ${verb.object.en} tomorrow.`,
      blankSentence: `${cap(subject.en)} ___ ___ ${verb.base} ${verb.object.en} tomorrow.`,
      blankAnswer: "will not",
      choices: ["will", "not", "won't", "doesn't", verb.base],
      explanation: "will の否定文は will not + 動詞の原形です。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}明日${jpDo(verb)}でしょう。`,
    fullSentence: `${cap(subject.en)} will ${verb.base} ${verb.object.en} tomorrow.`,
    blankSentence: `${cap(subject.en)} ___ ___ ${verb.object.en} tomorrow.`,
    blankAnswer: `will ${verb.base}`,
    choices: ["will", verb.base, verb.s, "going", "to"],
    explanation: "will + 動詞の原形で未来を表します。"
  });
}

function makeHaveToQuestion(unit, grade, level, form) {
  const subject = pick(VOCAB.subjects.filter(s => s.en !== "they"));
  const verb = pick(VOCAB.verbs.filter(v => ["study", "read", "help", "use", "visit"].includes(v.base)));
  const has = subject.type === "thirdSingle" ? "has to" : "have to";
  const aux = subject.type === "thirdSingle" ? "Does" : "Do";
  const dont = subject.type === "thirdSingle" ? "doesn't" : "don't";
  if (form === "question") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}${jpNakereba(verb)}か。`,
      fullSentence: `${aux} ${subject.en} have to ${verb.base} ${verb.object.en}?`,
      blankSentence: `___ ${subject.en} ___ ___ ${verb.base} ${verb.object.en}?`,
      blankAnswer: `${aux} have to`,
      choices: [aux, "have", "to", "has", "must"],
      explanation: "have to の疑問文は Do / Does + 主語 + have to + 動詞の原形です。"
    });
  }
  if (form === "negative") {
    return baseQuestion({
      unit, grade, level,
      jp: `${subject.jp}${jpDo(verb)}必要はありません。`,
      fullSentence: `${cap(subject.en)} ${dont} have to ${verb.base} ${verb.object.en}.`,
      blankSentence: `${cap(subject.en)} ___ ___ ___ ${verb.base} ${verb.object.en}.`,
      blankAnswer: `${dont} have to`,
      choices: [dont, "have", "to", "must", "not"],
      explanation: "don't / doesn't have to は『〜する必要はない』です。must not とは意味が違います。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `${subject.jp}${jpNakereba(verb)}。`,
    fullSentence: `${cap(subject.en)} ${has} ${verb.base} ${verb.object.en}.`,
    blankSentence: `${cap(subject.en)} ___ ___ ${verb.base} ${verb.object.en}.`,
    blankAnswer: has,
    choices: ["have", "has", "to", "must", "will"],
    explanation: "have to + 動詞の原形で『〜しなければならない』です。主語が三人称単数なら has to になります。"
  });
}

function makeGerundQuestion(unit, grade, level) {
  const verb = pick(VOCAB.verbs.filter(v => !["use"].includes(v.base)));
  const pattern = pick(["like", "enjoy", "subject"]);
  if (pattern === "enjoy") {
    return baseQuestion({
      unit, grade, level,
      jp: `私は${jpDo(verb)}のを楽しんでいます。`,
      fullSentence: `I enjoy ${verb.ing} ${verb.object.en}.`,
      blankSentence: `I enjoy ___ ${verb.object.en}.`,
      blankAnswer: verb.ing,
      choices: [verb.base, verb.s, verb.ing, `to ${verb.base}`],
      explanation: "enjoy の後ろは動名詞を使います。動名詞は『〜すること』を表します。"
    });
  }
  if (pattern === "subject") {
    return baseQuestion({
      unit, grade, level,
      jp: `${jpDo(verb)}ことは楽しいです。`,
      fullSentence: `${cap(verb.ing)} ${verb.object.en} is fun.`,
      blankSentence: `___ ${verb.object.en} is fun.`,
      blankAnswer: cap(verb.ing),
      choices: [cap(verb.ing), cap(verb.base), `To ${verb.base}`, verb.s],
      explanation: "動名詞は文の主語にもなります。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `私は${jpDo(verb)}ことが好きです。`,
    fullSentence: `I like ${verb.ing} ${verb.object.en}.`,
    blankSentence: `I like ___ ${verb.object.en}.`,
    blankAnswer: verb.ing,
    choices: [verb.base, verb.s, verb.ing, `to ${verb.base}`],
    explanation: "『〜すること』を動名詞で表すときは、動詞のing形を使います。"
  });
}

function makeThereIsQuestion(unit, grade, level) {
  const noun = pick(VOCAB.nouns);
  const place = pick(VOCAB.places);
  const plural = Math.random() > 0.5;
  const article = /^[aeiou]/i.test(noun.en) ? "an" : "a";
  const enNoun = plural ? `many ${noun.plural}` : `${article} ${noun.en}`;
  const jpNoun = plural ? `${noun.jp}がたくさん` : `${noun.jp}が1${noun.counter || "つ"}`;
  const be = plural ? "are" : "is";
  return baseQuestion({
    unit, grade, level,
    jp: `${place.jp}に${jpNoun}あります。`,
    fullSentence: `There ${be} ${enNoun} ${place.prep}.`,
    blankSentence: `There ___ ${enNoun} ${place.prep}.`,
    blankAnswer: be,
    choices: ["is", "are", "am", "be"],
    explanation: "There is / are は、後ろの名詞が単数なら is、複数なら are を使います。"
  });
}

function makeConjunctionQuestion(unit, grade, level) {
  const whenItems = [
    { jp: "家に帰ったとき、母は料理をしていました。", en: "When I got home, my mother was cooking.", blank: "___ I got home, my mother was cooking.", answer: "When", choices: ["When", "Because", "If", "And"] },
    { jp: "私が駅に着いたとき、雨が降っていました。", en: "When I arrived at the station, it was raining.", blank: "___ I arrived at the station, it was raining.", answer: "When", choices: ["When", "Because", "If", "But"] }
  ];
  const ifItems = [
    { jp: "もし時間があれば、私は本を読みます。", en: "If I have time, I will read a book.", blank: "___ I have time, I will read a book.", answer: "If", choices: ["If", "When", "Because", "But"] },
    { jp: "もし明日晴れたら、私たちは公園へ行きます。", en: "If it is sunny tomorrow, we will go to the park.", blank: "___ it is sunny tomorrow, we will go to the park.", answer: "If", choices: ["If", "When", "Because", "And"] }
  ];
  const mixedItems = [
    { jp: "雨が降っていたので、私は家にいました。", en: "I stayed home because it was raining.", blank: "I stayed home ___ it was raining.", answer: "because", choices: ["because", "but", "and", "if"] },
    { jp: "彼女は忙しかったですが、私を手伝ってくれました。", en: "She was busy, but she helped me.", blank: "She was busy, ___ she helped me.", answer: "but", choices: ["but", "because", "when", "if"] },
    ...whenItems,
    ...ifItems
  ];
  const pool = unit === "接続詞 when" ? whenItems : unit === "接続詞 if" ? ifItems : mixedItems;
  const item = pick(pool);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "接続詞は文と文をつなぎ、理由・時・条件・逆接などの関係を表します。" });
}

function makeComparisonQuestion(unit, grade, level, type) {
  const items = [
    {
      jpSubject: "この本", enSubject: "This book", jpOther: "あの本", enOther: "that one",
      groupJp: "私が持っている本の中で", groupEn: "book I have",
      adjective: { jp: "おもしろい", en: "interesting", comp: "more interesting", sup: "most interesting" }
    },
    {
      jpSubject: "この問題", enSubject: "This question", jpOther: "あの問題", enOther: "that one",
      groupJp: "今日解いた問題の中で", groupEn: "question I solved today",
      adjective: { jp: "難しい", en: "difficult", comp: "more difficult", sup: "most difficult" }
    },
    {
      jpSubject: "この辞書", enSubject: "This dictionary", jpOther: "あの辞書", enOther: "that one",
      groupJp: "私が持っている辞書の中で", groupEn: "dictionary I have",
      adjective: { jp: "便利", en: "useful", comp: "more useful", sup: "most useful" }
    },
    {
      jpSubject: "このかばん", enSubject: "This bag", jpOther: "あのかばん", enOther: "that one",
      groupJp: "私が持っているかばんの中で", groupEn: "bag I have",
      adjective: { jp: "新しい", en: "new", comp: "newer", sup: "newest" }
    }
  ];
  const item = pick(items);
  const adjective = item.adjective;

  if (type === "superlative") {
    return baseQuestion({
      unit, grade, level,
      jp: `${item.groupJp}、${item.jpSubject}が一番${adjective.jp}です。`,
      fullSentence: `This is the ${adjective.sup} ${item.groupEn}.`,
      blankAnswer: `the ${adjective.sup}`,
      choices: ["the", ...tokenize(adjective.sup), adjective.comp, "than"],
      explanation: "最上級は the + 最上級 で『一番〜』を表します。"
    });
  }
  if (type === "as") {
    return baseQuestion({
      unit, grade, level,
      jp: `${item.jpSubject}は${item.jpOther}と同じくらい${adjective.jp}です。`,
      fullSentence: `${item.enSubject} is as ${adjective.en} as ${item.enOther}.`,
      blankSentence: `${item.enSubject} is ___ ${adjective.en} ___ ${item.enOther}.`,
      blankAnswer: "as as",
      choices: ["as", "than", "more", "the"],
      explanation: "as + 原級 + as で『〜と同じくらい…』を表します。"
    });
  }
  return baseQuestion({
    unit, grade, level,
    jp: `${item.jpSubject}は${item.jpOther}より${adjective.jp}です。`,
    fullSentence: `${item.enSubject} is ${adjective.comp} than ${item.enOther}.`,
    blankAnswer: adjective.comp,
    choices: [adjective.comp, adjective.en, adjective.sup, "more"],
    explanation: "比較級 + than で『〜より…』を表します。長い形容詞では more + 形容詞を使うことがあります。"
  });
}

function makePrepositionQuestion(unit, grade, level) {
  const items = [
    { jp: "私は朝、英語を勉強します。", en: "I study English in the morning.", blank: "I study English ___ the morning.", answer: "in", choices: ["in", "on", "at", "to"] },
    { jp: "私は日曜日にテニスをします。", en: "I play tennis on Sunday.", blank: "I play tennis ___ Sunday.", answer: "on", choices: ["on", "in", "at", "for"] },
    { jp: "彼女は学校にいます。", en: "She is at school.", blank: "She is ___ school.", answer: "at", choices: ["at", "in", "on", "to"] },
    { jp: "私は音楽を聴きます。", en: "I listen to music.", blank: "I listen ___ music.", answer: "to", choices: ["to", "for", "at", "on"] },
    { jp: "彼は英語が得意です。", en: "He is good at English.", blank: "He is good ___ English.", answer: "at", choices: ["at", "in", "on", "for"] }
  ];
  const item = pick(level === "small" ? items.slice(0, 3) : items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "前置詞は時・場所・方向・熟語のまとまりで使い分けます。" });
}

function makePassiveQuestion(unit, grade, level, type) {
  if (type === "questionNegative") {
    const isQuestion = Math.random() > 0.5;
    if (isQuestion) {
      return baseQuestion({ unit, grade, level, jp: "この本は多くの人に読まれていますか。", fullSentence: "Is this book read by many people?", blankSentence: "___ this book ___ by many people?", blankAnswer: "Is read", choices: ["Is", "Does", "read", "reads", "readed"], explanation: "受動態の疑問文は be動詞を文頭に出し、be動詞 + 過去分詞を保ちます。" });
    }
    return baseQuestion({ unit, grade, level, jp: "この本は多くの人に読まれていません。", fullSentence: "This book is not read by many people.", blankSentence: "This book ___ ___ ___ by many people.", blankAnswer: "is not read", choices: ["is", "not", "read", "doesn't", "reads"], explanation: "受動態の否定文は be動詞の後ろに not を置きます。" });
  }
  if (type === "noBy") {
    return baseQuestion({ unit, grade, level, jp: "英語は多くの国で話されています。", fullSentence: "English is spoken in many countries.", blankSentence: "English ___ ___ in many countries.", blankAnswer: "is spoken", choices: ["is", "spoken", "speaks", "by", "speak"], explanation: "行為者が一般的・不明・重要でないとき、受動態でも by を使わないことがあります。" });
  }
  const noun = pick([
    { jp: "この本", en: "This book", pp: "read", by: "many people", jpBy: "多くの人", jpPassive: "読まれています" },
    { jp: "この部屋", en: "This room", pp: "cleaned", by: "my sister", jpBy: "私の姉", jpPassive: "掃除されています" },
    { jp: "この歌", en: "This song", pp: "loved", by: "many students", jpBy: "多くの生徒", jpPassive: "愛されています" }
  ]);
  return baseQuestion({ unit, grade, level, jp: `${noun.jp}は${noun.jpBy}に${noun.jpPassive}。`, fullSentence: `${noun.en} is ${noun.pp} by ${noun.by}.`, blankSentence: `${noun.en} ___ ___ by ${noun.by}.`, blankAnswer: `is ${noun.pp}`, choices: ["is", noun.pp, "are", "does", "done"], explanation: "受動態は be動詞 + 過去分詞で『〜される』を表します。" });
}

function makeSvocQuestion(unit, grade, level) {
  const items = [
    { jp: "私たちは彼をケンと呼びます。", en: "We call him Ken.", blank: "We ___ ___ Ken.", answer: "call him", choices: ["call", "him", "he", "name", "make"] },
    { jp: "その知らせは私をうれしくさせました。", en: "The news made me happy.", blank: "The news ___ ___ happy.", answer: "made me", choices: ["made", "make", "me", "I", "called"] },
    { jp: "彼らはその犬をポチと名付けました。", en: "They named the dog Pochi.", blank: "They ___ the dog Pochi.", answer: "named", choices: ["named", "name", "called", "made"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "call / make / name などは、目的語の後ろに補語を置いて『AをBと呼ぶ／AをBにする』を表します。" });
}

function makePresentPerfectQuestion(unit, grade, level, type) {
  if (type === "continuous") {
    return baseQuestion({ unit, grade, level, jp: "私は3年間ここに住んでいます。", fullSentence: "I have lived here for three years.", blankSentence: "I ___ ___ here for three years.", blankAnswer: "have lived", choices: ["have", "has", "lived", "live", "for"], explanation: "現在完了の継続は have / has + 過去分詞で、for や since とよく使います。" });
  }
  if (type === "experience") {
    return baseQuestion({ unit, grade, level, jp: "私は東京へ行ったことがあります。", fullSentence: "I have been to Tokyo.", blankSentence: "I ___ ___ to Tokyo.", blankAnswer: "have been", choices: ["have", "has", "been", "went", "gone"], explanation: "経験用法では have been to で『〜へ行ったことがある』を表します。" });
  }
  return baseQuestion({ unit, grade, level, jp: "私はちょうど宿題を終えたところです。", fullSentence: "I have just finished my homework.", blankSentence: "I ___ just ___ my homework.", blankAnswer: "have finished", choices: ["have", "has", "finished", "finish", "just"], explanation: "完了用法では have / has + 過去分詞で『ちょうど〜したところ』などを表します。" });
}

function makeWhToQuestion(unit, grade, level) {
  const items = [
    { jp: "私は何をすればよいかわかりません。", en: "I don't know what to do.", blank: "I don't know ___ ___ ___.", answer: "what to do", choices: ["what", "to", "do", "how", "does"] },
    { jp: "彼女はどこへ行けばよいかわかりません。", en: "She doesn't know where to go.", blank: "She doesn't know ___ ___ ___.", answer: "where to go", choices: ["where", "to", "go", "goes", "what"] },
    { jp: "私はどちらの本を選べばよいかわかりません。", en: "I don't know which book to choose.", blank: "I don't know ___ ___ ___ choose.", answer: "which book to", choices: ["which", "book", "to", "what", "choose"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "疑問詞 + to + 動詞の原形で『何を〜すべきか』『どこへ〜すべきか』を表します。" });
}

function makeItForToQuestion(unit, grade, level) {
  const items = [
    { jp: "私にとって英語を勉強することは大切です。", en: "It is important for me to study English.", blank: "It is important ___ ___ ___ study English.", answer: "for me to", choices: ["for", "me", "to", "I", "that"] },
    { jp: "私にとってこの本を読むことは簡単です。", en: "It is easy for me to read this book.", blank: "It is easy ___ ___ ___ read this book.", answer: "for me to", choices: ["for", "me", "to", "I", "that"] },
    { jp: "私にとって早く起きることは難しいです。", en: "It is difficult for me to get up early.", blank: "It is difficult ___ ___ ___ get up early.", answer: "for me to", choices: ["for", "me", "to", "I", "that"] },
    { jp: "私たちにとって約束を守ることは必要です。", en: "It is necessary for us to keep promises.", blank: "It is necessary ___ ___ ___ keep promises.", answer: "for us to", choices: ["for", "us", "to", "we", "that"] }
  ];
  const item = pick(items);
  return baseQuestion({
    unit, grade, level,
    jp: item.jp,
    fullSentence: item.en,
    blankSentence: item.blank,
    blankAnswer: item.answer,
    choices: item.choices,
    explanation: "It is + 形容詞 + for 人 + to 動詞の原形で『人にとって〜することは…だ』を表します。"
  });
}

function makeWantPersonToQuestion(unit, grade, level) {
  const person = pick([{ jp: "あなた", en: "you" }, { jp: "彼", en: "him" }, { jp: "彼女", en: "her" }]);
  const verb = pick(VOCAB.verbs);
  return baseQuestion({
    unit, grade, level,
    jp: `私は${person.jp}に${jpTePlain(verb)}ほしいです。`,
    fullSentence: `I want ${person.en} to ${verb.base} ${verb.object.en}.`,
    blankSentence: `I want ${person.en} ___ ___ ${verb.object.en}.`,
    blankAnswer: `to ${verb.base}`,
    choices: ["to", verb.base, verb.ing, "for", person.en],
    explanation: "want 人 to 動詞の原形で『人に〜してほしい』を表します。"
  });
}

function makeIndirectQuestion(unit, grade, level) {
  const items = [
    { jp: "私は彼がどこに住んでいるか知っています。", en: "I know where he lives.", blank: "I know ___ ___ ___.", answer: "where he lives", choices: ["where", "he", "lives", "does", "live"] },
    { jp: "彼女がなぜその本を読んだのか、私は知りません。", en: "I don't know why she read the book.", blank: "I don't know ___ ___ ___ the book.", answer: "why she read", choices: ["why", "she", "read", "did", "reads"] },
    { jp: "あなたが何をほしいのか教えてください。", en: "Please tell me what you want.", blank: "Please tell me ___ ___ ___.", answer: "what you want", choices: ["what", "you", "want", "do", "wants"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "間接疑問文では、語順が『疑問詞 + 主語 + 動詞』になります。疑問文の語順にしません。" });
}

function makeParticipleQuestion(unit, grade, level) {
  const items = [
    { jp: "サッカーをしている少年は私の弟です。", en: "The boy playing soccer is my brother.", blank: "The boy ___ soccer is my brother.", answer: "playing", choices: ["playing", "played", "plays", "to play"] },
    { jp: "英語で書かれた本は難しいです。", en: "The book written in English is difficult.", blank: "The book ___ in English is difficult.", answer: "written", choices: ["written", "writing", "wrote", "writes"] },
    { jp: "壊れた窓を見てください。", en: "Look at the broken window.", blank: "Look at the ___ window.", answer: "broken", choices: ["broken", "breaking", "break", "broke"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "分詞は名詞を後ろから説明できます。現在分詞は能動、過去分詞は受動の意味になりやすいです。" });
}

function makePostModifierQuestion(unit, grade, level) {
  const items = [
    { jp: "私が昨日買った本はおもしろいです。", en: "The book I bought yesterday is interesting.", blank: "The book ___ ___ yesterday is interesting.", answer: "I bought", choices: ["I", "bought", "buy", "me", "which"] },
    { jp: "彼女が作ったケーキはおいしかったです。", en: "The cake she made was delicious.", blank: "The cake ___ ___ was delicious.", answer: "she made", choices: ["she", "made", "makes", "her", "which"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "名詞の後ろに『主語 + 動詞』を続けて、その名詞を説明できます。" });
}

function makeRelativeQuestion(unit, grade, level) {
  const items = [
    { jp: "私は英語を話せる少年を知っています。", en: "I know a boy who can speak English.", blank: "I know a boy ___ can speak English.", answer: "who", choices: ["who", "which", "where", "what"] },
    { jp: "これは私が昨日買った本です。", en: "This is the book that I bought yesterday.", blank: "This is the book ___ I bought yesterday.", answer: "that", choices: ["that", "who", "where", "what"] },
    { jp: "彼女が書いた手紙は長かったです。", en: "The letter which she wrote was long.", blank: "The letter ___ she wrote was long.", answer: "which", choices: ["which", "who", "where", "when"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "関係代名詞は、前の名詞を後ろから詳しく説明します。人なら who、物なら which / that を使います。" });
}

function makeSubjunctiveQuestion(unit, grade, level) {
  const items = [
    { jp: "もし私があなたなら、もっと早く出発します。", en: "If I were you, I would leave earlier.", blank: "___ I ___ you, I would leave earlier.", answer: "If were", choices: ["If", "were", "was", "will", "would"] },
    { jp: "もし空を飛べたら、世界中を旅したいです。", en: "If I could fly, I would travel around the world.", blank: "If I ___ fly, I ___ travel around the world.", answer: "could would", choices: ["could", "can", "would", "will", "travel"] },
    { jp: "英語をもっと上手に話せたらいいのに。", en: "I wish I could speak English better.", blank: "I wish I ___ speak English better.", answer: "could", choices: ["could", "can", "will", "would"] }
  ];
  const item = pick(items);
  return baseQuestion({ unit, grade, level, jp: item.jp, fullSentence: item.en, blankSentence: item.blank, blankAnswer: item.answer, choices: item.choices, explanation: "仮定法では、現実とは違うことや実現が難しい願いを、If I were... / If I could... / I wish I could... などで表します。" });
}

function makeFallbackQuestion(unit, grade, level) {
  const verb = pick(VOCAB.verbs);
  return baseQuestion({
    unit, grade, level,
    jp: `私は${jpMasu(verb)}。`,
    fullSentence: `I ${verb.base} ${verb.object.en}.`,
    blankSentence: `I ___ ${verb.object.en}.`,
    blankAnswer: verb.base,
    choices: [verb.base, verb.s, verb.ing, verb.past],
    explanation: "文の中心になる動詞の形を確認します。"
  });
}

function buildChoices(question, answerTokens) {
  // 正解に必要な語句は、必ず選択肢に残す。
  // 以前の処理では、選択肢をシャッフルしてから切り取っていたため、
  // 正解語句が一部消えることがあった。
  const required = answerTokens.map(token => String(token).trim()).filter(Boolean);
  const teacherChoices = Array.isArray(question.choices) ? question.choices.flatMap(tokenize) : [];
  const common = [
    "am", "is", "are", "was", "were",
    "do", "does", "did", "not", "don't", "doesn't", "didn't",
    "to", "for", "that", "if", "when", "because",
    "have", "has", "will", "can", "could", "must", "may",
    "be", "been", "being", "by", "than", "as"
  ];
  const distractors = unique([...teacherChoices, ...getUnitChoiceDistractors(question), ...common])
    .filter(token => token && !required.includes(token));

  const targetCount = Math.min(10, Math.max(4, required.length + 3));
  const selectedDistractors = shuffle(distractors).slice(0, Math.max(0, targetCount - required.length));
  return shuffle([...required, ...selectedDistractors]);
}

function getUnitChoiceDistractors(question) {
  const unit = question.unit || "";
  const level = question.level || "small";
  const words = [];

  if (unit.includes("be動詞") || unit.includes("進行形")) words.push("am", "is", "are", "was", "were", "be", "being");
  if (unit.includes("一般動詞") || unit.includes("過去形")) words.push("do", "does", "did", "don't", "doesn't", "didn't");
  if (unit.includes("疑問詞") || unit.includes("間接疑問文")) words.push("what", "who", "where", "when", "why", "how", "which", "whose");
  if (unit.includes("助動詞") || unit.includes("未来")) words.push("can", "could", "will", "would", "must", "may", "shall", "should");
  if (unit.includes("不定詞") || unit.includes("It is")) words.push("to", "for", "of", "it", "important", "easy", "difficult");
  if (unit.includes("動名詞")) words.push("reading", "playing", "studying", "to", "read", "play", "study");
  if (unit.includes("接続詞") || unit.includes("that")) words.push("that", "because", "when", "if", "and", "but");
  if (unit.includes("比較")) words.push("more", "most", "than", "as", "the", "better", "best");
  if (unit.includes("受け身")) words.push("is", "are", "was", "were", "by", "be", "been");
  if (unit.includes("関係代名詞")) words.push("who", "which", "that", "where", "what");
  if (unit.includes("仮定法")) words.push("if", "were", "could", "would", "wish", "was", "will");

  if (level === "large" || level === "extra") words.push("been", "being", "would", "could", "should", "whether");
  return words;
}

function getSortDistractors(question) {
  const tokens = tokenize(question.fullSentence.replace(/[.?!]/g, ""));
  const distractors = [];
  if (tokens.includes("is")) distractors.push("are");
  if (tokens.includes("are")) distractors.push("is");
  if (tokens.includes("does")) distractors.push("do");
  if (tokens.includes("do")) distractors.push("does");
  if (tokens.includes("to")) distractors.push("for");
  if (tokens.includes("have")) distractors.push("has");
  if (distractors.length < 2) distractors.push(pick(["not", "very", "there", "at", "on"]));
  return unique(distractors).slice(0, state.selectedLevel === "extra" ? 3 : 2);
}

function findGradeByUnit(unit) {
  if (isTeacherUnitSelection(unit)) return findGradeByUnit(getTeacherUnitName(unit));
  if (unit === TEACHER_UNIT_NAME) return state.selectedGrade;
  const teacherMatch = (progress.teacherBank || []).find(q => q.unit === unit);
  if (teacherMatch?.grade) return Number(teacherMatch.grade);
  for (const [grade, units] of Object.entries(GRAMMAR_UNITS)) {
    if (units.includes(unit)) return Number(grade);
  }
  return null;
}

function teacherSelectionKey(unit) {
  return `${TEACHER_UNIT_PREFIX}${unit}`;
}

function isTeacherUnitSelection(unit) {
  return String(unit || "").startsWith(TEACHER_UNIT_PREFIX);
}

function getTeacherUnitName(unit) {
  return String(unit || "").replace(TEACHER_UNIT_PREFIX, "");
}

function isUnitSelected(unit) {
  return state.selectedUnits.has(unit) || state.selectedUnits.has(teacherSelectionKey(unit));
}

function normalizeMenuUnits(units) {
  return unique(units.map(unit => isTeacherUnitSelection(unit) ? getTeacherUnitName(unit) : unit));
}

function tokenize(text) {
  return String(text)
    .replace(/[.?!]/g, "")
    .split(/\s+/)
    .map(x => x.trim())
    .filter(Boolean);
}

function normalize(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.?!]/g, "")
    .replace(/\s+/g, " ");
}

function ensurePunctuation(sentence) {
  const trimmed = String(sentence).trim();
  if (/[.?!]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function cap(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function unique(list) {
  return [...new Set(list)];
}

function escapeHtml(value) {
  return String(value)
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
