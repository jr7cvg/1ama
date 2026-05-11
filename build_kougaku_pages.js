const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { explanationFor } = require("./kougaku_explanations");

const ROOT = __dirname;
const TMP = path.join(ROOT, ".tmp_kougaku_blocks");
fs.mkdirSync(TMP, { recursive: true });

const EXAMS = [
  {
    id: "R7.5",
    code: "HZ705",
    title: "令和7年5月期",
    out: "kougaku_R7.5.html",
    pdf: "Kakomon/1ama-2025(R07)-05-kougaku.pdf",
    startSource: "bbox",
    a: [3, 4, 5, 1, 2, 2, 3, 4, 2, 4, 1, 3, 2, 3, 3, 2, 4, 1, 3, 1, 5, 4, 5, 1, 4],
    b: [[5, 9, 2, 1, 8], [1, 7, 3, 9, 10], [1, 1, 1, 1, 2], [3, 10, 5, 9, 2], [10, 7, 4, 1, 3]],
  },
  {
    id: "R6.12",
    code: "HZ612",
    title: "令和6年12月期",
    out: "kougaku_R6.12.html",
    pdf: "Kakomon/1ama-2024(R06)-12-kougaku.pdf",
    startSource: "bbox",
    a: [1, 4, 5, 4, 2, 1, 2, 3, 3, 4, 2, 1, 5, 3, 1, 5, 4, 2, 2, 2, 1, 5, 4, 3, 4],
    b: [[10, 5, 6, 2, 8], [1, 7, 3, 9, 5], [5, 6, 7, 4, 3], [2, 1, 1, 1, 2], [10, 3, 9, 1, 7]],
  },
  {
    id: "R6.8",
    code: "HZ608",
    title: "令和6年8月期",
    out: "kougaku_R6.8.html",
    pdf: "Kakomon/1ama-2024(R06)-08-kougaku.pdf",
    startSource: "bbox",
    a: [2, 1, 5, 2, 3, 5, 2, 3, 5, 5, 1, 2, 1, 4, 5, 2, 1, 3, 4, 4, 3, 2, 3, 3, 4],
    b: [[9, 10, 8, 2, 1], [4, 2, 6, 3, 5], [5, 8, 9, 4, 2], [6, 8, 4, 5, 7], [1, 1, 2, 1, 1]],
  },
  {
    id: "R6.4",
    code: "HZ604",
    title: "令和6年4月期",
    out: "kougaku_R6.4.html",
    pdf: "Kakomon/1ama-2024(R06)-04-kougaku.pdf",
    startSource: "imageHeading",
    a: [5, 1, 4, 3, 1, 4, 5, 5, 2, 3, 3, 2, 2, 1, 3, 2, 4, 5, 1, 2, 3, 5, 1, 1, 2],
    b: [[6, 3, 7, 4, 5], [6, 4, 7, 2, 10], [5, 1, 2, 8, 9], [1, 1, 1, 2, 1], [9, 7, 3, 10, 6]],
  },
  {
    id: "R5.12",
    code: "HZ512",
    title: "令和5年12月期",
    out: "kougaku_R5.12.html",
    pdf: "Kakomon/1ama-2023(R05)-12-kougaku.pdf",
    startSource: "imageHeading",
    a: [1, 1, 5, 5, "*", 5, 4, 5, 2, 1, 2, 2, 3, 4, 4, 3, 4, 1, 3, 3, 1, 4, 5, 2, 2],
    b: [[10, 3, 2, 7, 6], [6, 5, 9, 7, 3], [7, 8, 6, 9, 5], [1, 1, 1, 2, 2], [9, 10, 8, 6, 2]],
  },
];

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function pageSize(pdfPath) {
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = info.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/);
  if (!match) throw new Error(`Page size not found: ${pdfPath}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function renderPages(exam, dir) {
  const prefix = path.join(dir, "page");
  execFileSync("pdftoppm", ["-png", "-r", "160", path.join(ROOT, exam.pdf), prefix], { cwd: ROOT });
  return fs
    .readdirSync(dir)
    .filter((f) => /^page-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => path.join(dir, f));
}

function lineWords(lineHtml) {
  const words = [];
  const re = /<word\s+([^>]+)>([\s\S]*?)<\/word>/g;
  let match;
  while ((match = re.exec(lineHtml))) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const xMin = Number((attrs.match(/xMin="([^"]+)"/) || [])[1]);
    const yMin = Number((attrs.match(/yMin="([^"]+)"/) || [])[1]);
    if (text) words.push({ text, xMin, yMin });
  }
  return words;
}

function questionStarts(exam, bboxHtml) {
  const starts = [];
  const pageRe = /<page\s+[^>]*>([\s\S]*?)<\/page>/g;
  let pageMatch;
  let page = 0;
  while ((pageMatch = pageRe.exec(bboxHtml))) {
    page += 1;
    const pageHtml = pageMatch[1];
    const lineRe = /<line\s+[^>]*>([\s\S]*?)<\/line>/g;
    let lineMatch;
    while ((lineMatch = lineRe.exec(pageHtml))) {
      const words = lineWords(lineMatch[1]);
      for (let i = 0; i < words.length - 2; i += 1) {
        if (
          (words[i].text === "A" || words[i].text === "B") &&
          words[i + 1].text === "-" &&
          /^\d+$/.test(words[i + 2].text) &&
          words[i].xMin < 95
        ) {
          starts.push({ page, y: words[i].yMin, id: `${words[i].text}-${words[i + 2].text}` });
        }
      }
    }
  }
  starts.sort((a, b) => a.page - b.page || a.y - b.y);
  const expected = Array.from({ length: 25 }, (_, i) => `A-${i + 1}`).concat(Array.from({ length: 5 }, (_, i) => `B-${i + 1}`));
  const got = starts.map((s) => s.id);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    throw new Error(`${exam.code}: question starts mismatch\nexpected ${expected.join(",")}\ngot      ${got.join(",")}`);
  }
  return starts;
}

function expectedQuestionIds() {
  return Array.from({ length: 25 }, (_, i) => `A-${i + 1}`).concat(Array.from({ length: 5 }, (_, i) => `B-${i + 1}`));
}

function assertQuestionStarts(exam, starts) {
  const expected = expectedQuestionIds();
  const got = starts.map((s) => s.id);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    throw new Error(`${exam.code}: question starts mismatch\nexpected ${expected.join(",")}\ngot      ${got.join(",")}`);
  }
}

const IMAGE_HEADING_STARTS = {
  HZ604: [
    [1, 8, "A-1"], [1, 23, "A-2"], [1, 37, "A-3"], [1, 52, "A-4"],
    [2, 0, "A-5"], [2, 11, "A-6"], [2, 30, "A-7"], [2, 44, "A-8"], [2, 57, "A-9"],
    [3, 0, "A-10"], [3, 13, "A-11"], [3, 27, "A-12"], [3, 59, "A-13"],
    [4, 0, "A-14"], [4, 25, "A-15"], [4, 43, "A-16"], [4, 55, "A-17"],
    [5, 0, "A-18"], [5, 25, "A-19"], [5, 37, "A-20"], [5, 58, "A-21"],
    [6, 0, "A-22"], [6, 12, "A-23"], [6, 32, "A-24"], [6, 71, "A-25"],
    [7, 0, "B-1"], [7, 14, "B-2"], [7, 28, "B-3"], [7, 43, "B-4"], [7, 55, "B-5"],
  ],
  HZ512: [
    [1, 7, "A-1"], [1, 26, "A-2"], [1, 58, "A-3"],
    [2, 0, "A-4"], [2, 23, "A-5"], [2, 55, "A-6"], [2, 75, "A-7"],
    [3, 0, "A-8"], [3, 26, "A-9"], [3, 40, "A-10"], [3, 59, "A-11"],
    [4, 0, "A-12"], [4, 23, "A-13"], [4, 36, "A-14"], [4, 55, "A-15"],
    [5, 0, "A-16"], [5, 13, "A-17"], [5, 36, "A-18"], [5, 46, "A-19"], [5, 54, "A-20"],
    [6, 0, "A-21"], [6, 33, "A-22"], [6, 50, "A-23"],
    [7, 0, "A-24"], [7, 20, "A-25"], [7, 33, "B-1"], [7, 53, "B-2"],
    [8, 0, "B-3"], [8, 33, "B-4"], [8, 46, "B-5"],
  ],
};

function startsFromImageHeadings(exam, pages, size) {
  const rows = IMAGE_HEADING_STARTS[exam.code];
  if (!rows) throw new Error(`${exam.code}: imageHeading starts are not configured`);
  const expectedByPage = new Map();
  for (const [page, line, id] of rows) {
    if (!expectedByPage.has(page)) expectedByPage.set(page, []);
    expectedByPage.get(page).push({ line, id });
  }
  const detector = `
import json, sys
from PIL import Image
pages = json.loads(sys.argv[1])
out = []
for page in pages:
    im = Image.open(page["path"]).convert("L")
    rows = []
    for y in range(im.height):
        count = 0
        for x in range(115, 180):
            if im.getpixel((x, y)) < 150:
                count += 1
        if count > 3:
            rows.append(y)
    groups = []
    for y in rows:
        if not groups or y - groups[-1][1] > 8:
            groups.append([y, y])
        else:
            groups[-1][1] = y
    candidates = [(a + b) // 2 for a, b in groups if b - a + 1 >= 8]
    out.append(candidates)
print(json.dumps(out))
`;
  const candidatesByPage = JSON.parse(execFileSync("python3", [
    "-c",
    detector,
    JSON.stringify(pages.map((p) => ({ path: p }))),
  ], { encoding: "utf8" }));

  const starts = [];
  for (const [page, expected] of expectedByPage.entries()) {
    let candidates = candidatesByPage[page - 1] || [];
    if (expected[0].line > 0) candidates = candidates.filter((y) => y > 250);
    if (candidates.length !== expected.length) {
      throw new Error(`${exam.code}: imageHeading detection failed on page ${page}: expected ${expected.length}, got ${candidates.length} (${candidates.join(",")})`);
    }
    const pagePx = imageSize(pages[page - 1]);
    const sy = pagePx.height / size.height;
    expected.forEach((item, index) => {
      starts.push({ page, y: candidates[index] / sy, id: item.id, startSource: "imageHeading" });
    });
  }
  starts.sort((a, b) => a.page - b.page || a.y - b.y);
  assertQuestionStarts(exam, starts);
  return starts;
}

function imageSize(file) {
  const out = execFileSync("identify", ["-format", "%w %h", file], { encoding: "utf8" });
  const [width, height] = out.trim().split(/\s+/).map(Number);
  return { width, height };
}

function blockImages(exam) {
  const examTmp = path.join(TMP, exam.code);
  const pagesDir = path.join(examTmp, "pages");
  const blocksDir = path.join(examTmp, "blocks");
  cleanDir(examTmp);
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(blocksDir, { recursive: true });

  const pdfPath = path.join(ROOT, exam.pdf);
  const size = pageSize(pdfPath);
  const pages = renderPages(exam, pagesDir);
  let starts;
  if (exam.startSource === "bbox") {
    const bboxPath = path.join(examTmp, "bbox.html");
    execFileSync("pdftotext", ["-bbox-layout", pdfPath, bboxPath], { cwd: ROOT, stdio: ["ignore", "ignore", "pipe"] });
    starts = questionStarts(exam, fs.readFileSync(bboxPath, "utf8"));
  } else if (exam.startSource === "imageHeading") {
    starts = startsFromImageHeadings(exam, pages, size);
  } else {
    throw new Error(`${exam.code}: unknown startSource ${exam.startSource}`);
  }

  const images = {};
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const pageFile = pages[start.page - 1];
    const pagePx = imageSize(pageFile);
    const sx = pagePx.width / size.width;
    const sy = pagePx.height / size.height;
    const y1pt = next && next.page === start.page ? next.y - 8 : size.height - 38;
    const x = Math.round(45 * sx);
    const y = Math.max(0, Math.round((start.y - 9) * sy));
    const w = Math.round((size.width - 83) * sx);
    const h = Math.max(80, Math.round((y1pt - (start.y - 9)) * sy));
    const out = path.join(blocksDir, `${start.id}.png`);
    execFileSync("magick", [
      pageFile,
      "-crop",
      `${w}x${h}+${x}+${y}`,
      "-trim",
      "+repage",
      "-bordercolor",
      "white",
      "-border",
      "18",
      out,
    ]);
    images[start.id] = fs.readFileSync(out).toString("base64");
  }

  const contact = path.join(examTmp, `${exam.out.replace(/\.html$/, "")}_contact.jpg`);
  execFileSync("magick", [
    "montage",
    ...starts.map((s) => path.join(blocksDir, `${s.id}.png`)),
    "-label",
    "%t",
    "-thumbnail",
    "300x420",
    "-tile",
    "5x",
    "-geometry",
    "320x470+12+12",
    "-background",
    "white",
    contact,
  ]);

  return { images, contact };
}

function makeQuestions(exam, images) {
  const questions = [];
  for (let i = 0; i < exam.a.length; i += 1) {
    const id = `A-${i + 1}`;
    const question = { id, kind: "A", answer: exam.a[i], acceptAll: exam.a[i] === "*", options: [1, 2, 3, 4, 5], blockImage: images[id] };
    question.explanation = explanationFor(exam.code, question);
    if (!question.explanation) throw new Error(`${exam.code} ${id}: explanation is empty`);
    questions.push(question);
  }
  for (let i = 0; i < exam.b.length; i += 1) {
    const id = `B-${i + 1}`;
    const answers = exam.b[i];
    const options = Math.max(...answers) <= 2 ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const question = { id, kind: "B", answers, options, labels: ["ア", "イ", "ウ", "エ", "オ"], blockImage: images[id] };
    question.explanation = explanationFor(exam.code, question);
    if (!question.explanation) throw new Error(`${exam.code} ${id}: explanation is empty`);
    questions.push(question);
  }
  return questions;
}

function html(exam, questions) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>一アマ 無線工学 ${exam.title}</title>
<style>
:root{color-scheme:dark;--bg:#0b1020;--panel:#121a2b;--line:#26344f;--text:#e7edf7;--muted:#94a3b8;--accent:#38bdf8;--ok:#22c55e;--bad:#ef4444}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.7}
header{position:sticky;top:0;z-index:10;background:rgba(11,16,32,.96);border-bottom:1px solid var(--line);padding:12px 16px}.top{max-width:1100px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}h1{font-size:18px;margin:0}
.nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.nav a,.nav button,.ans,.move{border:1px solid var(--line);background:#172036;color:var(--text);padding:8px 10px;border-radius:7px;text-decoration:none;cursor:pointer;font-size:14px}.nav button.active{border-color:var(--accent);color:#dff6ff}.danger{border-color:#7f1d1d!important;background:#3f1111!important}
.wrap{max-width:1100px;margin:0 auto;padding:16px}.chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.chip{width:48px;height:34px;border-radius:7px;border:1px solid var(--line);background:#141d31;color:var(--text);cursor:pointer}.chip.current{border-color:var(--accent);background:#0c4a6e}.chip.ok{background:#14532d}.chip.bad{background:#581c1c}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px;margin-bottom:14px}.meta{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px;color:var(--muted)}.hint{color:var(--muted);font-size:14px;margin:0}.question-block{display:block;max-width:100%;height:auto;background:#fff;border:1px solid var(--line);border-radius:6px;margin:0 auto 14px}
.answers{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin-top:12px}.ans{padding:12px;font-size:16px}.ans:hover,.move:hover{border-color:var(--accent)}.ans.correct{background:#14532d;border-color:var(--ok)}.ans.selected.ok{background:#14532d;border-color:var(--ok)}.ans.selected.bad{background:#581c1c;border-color:var(--bad)}
.sub{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}.sub-title{font-weight:700;margin-bottom:8px}.result{padding:12px;border-radius:7px;margin-top:12px;border:1px solid var(--line)}.result.ok{background:rgba(34,197,94,.12);border-color:var(--ok)}.result.bad{background:rgba(239,68,68,.12);border-color:var(--bad)}.explanation{margin-top:10px;padding-top:10px;border-top:1px solid var(--line);color:var(--text)}.explanation-title{font-weight:700;margin-bottom:4px}.foot-actions{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:640px){header{position:static}.wrap{padding:10px}.card{padding:12px}.chip{width:44px}.answers{grid-template-columns:repeat(5,1fr)}.ans{padding:10px 6px}}
</style>
</head>
<body>
<header><div class="top"><h1>一アマ 無線工学 ${exam.title}（${exam.code}）</h1><div class="nav"><a href="index.html">メニュー</a><button id="reviewBtn">間違い復習</button><button id="allBtn" class="active">全問</button><button id="resetBtn" class="danger">記録リセット</button></div></div></header>
<main class="wrap">
  <div class="card"><div id="summary"></div><p class="hint">問題は1問ずつPDFから切り出して表示します。回答ボタンと記録はこのページで処理します。</p></div>
  <div class="chips" id="chips"></div>
  <section class="card">
    <div class="meta"><strong id="qid"></strong><span id="progress"></span></div>
    <div id="questionBody"></div>
    <div id="answerArea"></div>
    <div id="result"></div>
  </section>
  <div class="foot-actions"><button class="move" id="prevBtn">前へ</button><button class="move" id="nextBtn">次へ</button></div>
</main>
<script>
const EXAM=${JSON.stringify({ id: exam.id, code: exam.code, title: exam.title })};
const QUESTIONS=${JSON.stringify(questions)};
const STORE_KEY="ama1_kougaku_"+EXAM.code+"_v4";
let state={answers:{},wrong:{},current:0,review:false};
function load(){try{const raw=localStorage.getItem(STORE_KEY);if(raw)state={...state,...JSON.parse(raw)};}catch(e){console.warn(e)}}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function visibleQuestions(){return state.review?QUESTIONS.filter(q=>state.wrong[q.id]):QUESTIONS}
function currentQuestion(){const qs=visibleQuestions();if(!qs.length){state.review=false;state.current=0;return QUESTIONS[0]}if(state.current>=qs.length)state.current=qs.length-1;return qs[state.current]}
function isAnswered(q){return q.kind==="A"?state.answers[q.id]!==undefined:q.labels.every(l=>(state.answers[q.id]||{})[l]!==undefined)}
function chipClass(q){return "chip"+(q.id===currentQuestion().id?" current":"")+(isAnswered(q)?" ok":"")+(state.wrong[q.id]?" bad":"")}
function renderChips(){const el=document.getElementById("chips");el.innerHTML="";visibleQuestions().forEach((q,i)=>{const b=document.createElement("button");b.className=chipClass(q);b.textContent=q.id;b.onclick=()=>{state.current=i;save();render()};el.appendChild(b)})}
function renderSummary(){const total=QUESTIONS.length;const answered=QUESTIONS.filter(isAnswered).length;const wrong=Object.keys(state.wrong).length;document.getElementById("summary").textContent=state.review?("復習モード: 間違えた問題 "+visibleQuestions().length+" 問"):(EXAM.title+" / 回答済み "+answered+" / "+total+" 問、苦手 "+wrong+" 問")}
function renderQuestion(q){const body=document.getElementById("questionBody");body.innerHTML="";const img=document.createElement("img");img.className="question-block";img.alt=q.id+" 問題";img.src="data:image/png;base64,"+q.blockImage;body.appendChild(img)}
function renderA(q){const wrap=document.createElement("div");wrap.className="answers";const saved=state.answers[q.id];const answered=saved!==undefined;q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(answered&&(q.acceptAll||n===q.answer))b.classList.add("correct");if(saved===n)b.classList.add("selected",(q.acceptAll||n===q.answer)?"ok":"bad");b.onclick=()=>answerA(q,n);wrap.appendChild(b)});return wrap}
function renderB(q){const outer=document.createElement("div");q.labels.forEach((label,idx)=>{const row=document.createElement("div");row.className="sub";const title=document.createElement("div");title.className="sub-title";title.textContent=label;row.appendChild(title);const ans=document.createElement("div");ans.className="answers";const saved=(state.answers[q.id]||{})[label];q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(saved!==undefined&&n===q.answers[idx])b.classList.add("correct");if(saved===n)b.classList.add("selected",n===q.answers[idx]?"ok":"bad");b.onclick=()=>answerB(q,label,idx,n);ans.appendChild(b)});row.appendChild(ans);outer.appendChild(row)});return outer}
function answerA(q,n){state.answers[q.id]=n;if(q.acceptAll||n===q.answer)delete state.wrong[q.id];else state.wrong[q.id]=true;save();render()}
function answerB(q,label,idx,n){state.answers[q.id]=state.answers[q.id]||{};state.answers[q.id][label]=n;const all=q.labels.every((l,i)=>(state.answers[q.id]||{})[l]===q.answers[i]);const anyWrong=q.labels.some((l,i)=>state.answers[q.id]?.[l]!==undefined&&state.answers[q.id][l]!==q.answers[i]);if(all)delete state.wrong[q.id];else if(anyWrong)state.wrong[q.id]=true;save();render()}
function showResult(ok,msg,explanation){const r=document.getElementById("result");r.className="result "+(ok?"ok":"bad");r.textContent="";const main=document.createElement("div");main.textContent=msg;r.appendChild(main);if(explanation){const box=document.createElement("div");box.className="explanation";const title=document.createElement("div");title.className="explanation-title";title.textContent="解説";const body=document.createElement("div");body.textContent=explanation;box.appendChild(title);box.appendChild(body);r.appendChild(box)}}
function renderStoredResult(q){const r=document.getElementById("result");r.className="";r.textContent="";if(q.kind==="A"){const saved=state.answers[q.id];if(saved===undefined)return;if(q.acceptAll){showResult(true,"この問題は公式に全員正解です。選択した番号: "+saved,q.explanation);return}const ok=saved===q.answer;showResult(ok,(ok?"正解です。":"不正解です。")+"正答表の正解は "+q.answer+" です。",q.explanation)}else{const saved=state.answers[q.id]||{};const answered=q.labels.filter(l=>saved[l]!==undefined);if(!answered.length)return;const wrong=q.labels.filter((l,i)=>saved[l]!==undefined&&saved[l]!==q.answers[i]);const ok=answered.length===q.labels.length&&wrong.length===0;const correct=q.labels.map((l,i)=>l+"="+q.answers[i]).join("、");const selected=answered.map(l=>l+"="+saved[l]).join("、");showResult(ok,((ok?"正解です。":wrong.length?"不正解があります。":"回答途中です。")+" 選択: "+selected+" / 正答表: "+correct),q.explanation);}}
function render(){const qs=visibleQuestions();const q=currentQuestion();renderSummary();renderChips();document.getElementById("qid").textContent=q.id;document.getElementById("progress").textContent=(state.current+1)+" / "+qs.length;renderQuestion(q);const area=document.getElementById("answerArea");area.innerHTML="";area.appendChild(q.kind==="A"?renderA(q):renderB(q));renderStoredResult(q)}
document.getElementById("prevBtn").onclick=()=>{state.current=Math.max(0,state.current-1);save();render()};
document.getElementById("nextBtn").onclick=()=>{state.current=Math.min(visibleQuestions().length-1,state.current+1);save();render()};
document.getElementById("reviewBtn").onclick=()=>{state.review=true;state.current=0;save();render()};
document.getElementById("allBtn").onclick=()=>{state.review=false;state.current=0;save();render()};
document.getElementById("resetBtn").onclick=()=>{if(confirm("この年度の回答記録をリセットしますか？")){state={answers:{},wrong:{},current:0,review:false};save();render()}};
load();render();
</script>
</body>
</html>
`;
}

for (const exam of EXAMS) {
  const { images, contact } = blockImages(exam);
  const questions = makeQuestions(exam, images);
  fs.writeFileSync(path.join(ROOT, exam.out), html(exam, questions));
  console.log(`${exam.out}: ${questions.length} questions, ${fs.statSync(path.join(ROOT, exam.out)).size} bytes, contact=${path.basename(contact)}`);
}
