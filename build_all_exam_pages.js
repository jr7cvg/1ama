const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const KAKOMON = path.join(ROOT, "Kakomon");
const TMP = path.join(ROOT, ".tmp_exam_blocks");
const TERMS = [
  ["R7.5", "2025", "R07", "05", "令和7年5月期"],
  ["R6.12", "2024", "R06", "12", "令和6年12月期"],
  ["R6.8", "2024", "R06", "08", "令和6年8月期"],
  ["R6.4", "2024", "R06", "04", "令和6年4月期"],
  ["R5.12", "2023", "R05", "12", "令和5年12月期"],
  ["R5.8", "2023", "R05", "08", "令和5年8月期"],
  ["R5.4", "2023", "R05", "04", "令和5年4月期"],
  ["R4.12", "2022", "R04", "12", "令和4年12月期"],
  ["R4.8", "2022", "R04", "08", "令和4年8月期"],
  ["R4.4", "2022", "R04", "04", "令和4年4月期"],
  ["R3.12", "2021", "R03", "12", "令和3年12月期"],
  ["R3.9", "2021", "R03", "09", "令和3年9月期"],
  ["R3.4", "2021", "R03", "04", "令和3年4月期"],
];

const MANUAL_EXPLANATIONS = {
  "HZ604:A-4": [
    "変成器によるインピーダンス変換と最大電力供給の問題です。",
    "理想変成器では、二次側の負荷抵抗 RL を一次側から見ると Rab = (N1 / N2)^2 RL になります。抵抗は巻数比の2乗で変換されるため、A は (N1 / N2)^2 RL です。",
    "交流電源の内部抵抗を RG とすると、負荷側へ最大電力を送る条件は、電源側から見た負荷抵抗が内部抵抗と等しい Rab = RG になることです。したがって B は RG です。",
    "このとき回路は RG と Rab=RG の直列になるので、負荷側へ加わる電圧は V/2、負荷で消費される最大電力は Pm = (V/2)^2 / RG = V^2 / (4RG) です。よって C は V^2/(4RG) です。",
    "A=(N1/N2)^2RL、B=RG、C=V^2/(4RG) の組合せなので、正解は3です。"
  ].join("\n")
};

function examsFor(subject) {
  const prefix = subject === "houki" ? "HY" : "HZ";
  return TERMS.map(([id, year, reiwa, month, title]) => ({
    id,
    title,
    subject,
    label: subject === "houki" ? "法規" : "無線工学",
    code: `${prefix}${Number(reiwa.slice(1))}${month}`,
    out: `${subject}_${id}.html`,
    pdf: `Kakomon/1ama-${year}(${reiwa})-${month}-${subject}.pdf`,
    answerPdf: `Kakomon/1ama-${year}(${reiwa})-${month}-${subject}-kaitou.pdf`,
    aCount: subject === "houki" ? 24 : 25,
    bCount: subject === "houki" ? 6 : 5,
  }));
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeText(text) {
  return text
    .replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10))
    .replace(/[ＡＡА]/g, "A")
    .replace(/[ＢВ]/g, "B")
    .replace(/[－ー―一]/g, "-")
    .replace(/[＊※]/g, "*");
}

function parseAnswers(exam) {
  const text = normalizeText(execFileSync("pdftotext", [path.join(ROOT, exam.answerPdf), "-"], { encoding: "utf8" }));
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const a = Array(exam.aCount).fill(null);
  const bFlat = [];

  for (let i = 0; i < lines.length - 1; i += 1) {
    const m = lines[i].replace(/\s/g, "").match(/^〔A-([0-9]{1,2})〕$/);
    if (!m) continue;
    const n = Number(m[1]);
    if (n < 1 || n > exam.aCount) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
      if (/^([0-9]+|\*)$/.test(lines[j])) {
        a[n - 1] = lines[j] === "*" ? "*" : Number(lines[j]);
        break;
      }
    }
  }

  if (a.some((value) => value == null)) {
    const marker = text.indexOf("B問題\n正答");
    if (marker < 0) throw new Error(`${exam.code}: answer marker not found`);
    const numbers = [...text.slice(marker).matchAll(/^\s*([0-9]+|\*)\s*$/gm)].map((m) => (m[1] === "*" ? "*" : Number(m[1])));
    if (numbers.length < exam.aCount + exam.bCount * 5) {
      throw new Error(`${exam.code}: not enough numeric answers (${numbers.length})`);
    }
    numbers.slice(0, exam.aCount).forEach((value, index) => {
      a[index] = value;
    });
  }

  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!/^[アイウエオ]$/.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j += 1) {
      if (/^[0-9]+$/.test(lines[j])) {
        bFlat.push(Number(lines[j]));
        break;
      }
    }
  }

  const bTotal = exam.bCount * 5;
  let bValues = bFlat.length >= bTotal ? bFlat.slice(0, bTotal) : null;
  if (!bValues) {
    const lastNumbers = [...text.matchAll(/^\s*([0-9]+)\s*$/gm)].map((m) => Number(m[1]));
    bValues = lastNumbers.slice(-bTotal);
  }
  if (a.length !== exam.aCount || a.some((value) => value == null)) throw new Error(`${exam.code}: A answers incomplete`);
  if (bValues.length !== bTotal) throw new Error(`${exam.code}: B answers incomplete`);
  return {
    a,
    b: Array.from({ length: exam.bCount }, (_, i) => bValues.slice(i * 5, i * 5 + 5)),
  };
}

function pageSize(pdfPath) {
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = info.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)\s+pts/);
  if (!match) throw new Error(`Page size not found: ${pdfPath}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function imageSize(file) {
  const out = execFileSync("identify", ["-format", "%w %h", file], { encoding: "utf8" });
  const [width, height] = out.trim().split(/\s+/).map(Number);
  return { width, height };
}

function renderPages(exam, dir) {
  const prefix = path.join(dir, "page");
  execFileSync("pdftoppm", ["-png", "-r", "160", path.join(ROOT, exam.pdf), prefix], { cwd: ROOT });
  return fs.readdirSync(dir)
    .filter((f) => /^page-\d+\.png$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => path.join(dir, f));
}

function expectedIds(exam) {
  return Array.from({ length: exam.aCount }, (_, i) => `A-${i + 1}`).concat(Array.from({ length: exam.bCount }, (_, i) => `B-${i + 1}`));
}

function startsFromTsv(exam, pdfPath, tsvPath) {
  execFileSync("pdftotext", ["-tsv", pdfPath, tsvPath], { cwd: ROOT });
  const words = tsvWords(tsvPath)
    .map((word) => ({ ...word, text: word.text.replace(/\s/g, "") }))
    .filter((word) => word.text && word.left < 170 && !word.text.startsWith("###"));

  const groups = [];
  for (const word of words.sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left)) {
    let group = groups.find((item) => item.page === word.page && Math.abs(item.top - word.top) < 4);
    if (!group) {
      group = { page: word.page, top: word.top, items: [] };
      groups.push(group);
    }
    group.items.push(word);
  }

  const starts = [];
  for (const group of groups) {
    const text = group.items.sort((a, b) => a.left - b.left).map((item) => item.text).join("");
    const match = text.match(/^([AB])-?([0-9]{1,2})/) || text.match(/^([AB])-([0-9]{1,2})/);
    if (!match) continue;
    starts.push({ page: group.page, y: group.top, id: `${match[1]}-${Number(match[2])}` });
  }

  const seen = new Set();
  const unique = starts.filter((start) => {
    const key = `${start.page}:${start.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.page - b.page || a.y - b.y);

  const expected = expectedIds(exam);
  const got = unique.map((start) => start.id);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    throw new Error(`${exam.code}: question starts mismatch\nexpected ${expected.join(",")}\ngot      ${got.join(",")}`);
  }
  return unique;
}

function tsvWords(tsvPath) {
  const rows = fs.readFileSync(tsvPath, "utf8").split(/\r?\n/).slice(1).map((line) => line.split("\t")).filter((cols) => cols.length >= 12);
  return rows
    .map((cols) => ({
      page: Number(cols[1]),
      left: Number(cols[6]),
      top: Number(cols[7]),
      text: normalizeText(cols.slice(11).join("\t")).trim(),
    }))
    .filter((word) => word.text && !word.text.startsWith("###"));
}

function textBlocksFromTsv(tsvPath, starts, size) {
  const words = tsvWords(tsvPath);
  const texts = {};
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const y1pt = next && next.page === start.page ? next.y - 7 : size.height - 36;
    const inBlock = words
      .filter((word) => word.page === start.page && word.top >= start.y - 6 && word.top < y1pt)
      .sort((a, b) => a.top - b.top || a.left - b.left);
    const lines = [];
    for (const word of inBlock) {
      let line = lines.find((item) => Math.abs(item.top - word.top) < 4);
      if (!line) {
        line = { top: word.top, words: [] };
        lines.push(line);
      }
      line.words.push(word);
    }
    texts[start.id] = lines
      .sort((a, b) => a.top - b.top)
      .map((line) => line.words.sort((a, b) => a.left - b.left).map((word) => word.text).join(" "))
      .join("\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }
  return texts;
}

function blockImages(exam) {
  const examTmp = path.join(TMP, exam.subject, exam.code);
  const pagesDir = path.join(examTmp, "pages");
  const blocksDir = path.join(examTmp, "blocks");
  cleanDir(examTmp);
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(blocksDir, { recursive: true });

  const pdfPath = path.join(ROOT, exam.pdf);
  const size = pageSize(pdfPath);
  const pages = renderPages(exam, pagesDir);
  const tsvPath = path.join(examTmp, "starts.tsv");
  const starts = startsFromTsv(exam, pdfPath, tsvPath);
  const texts = textBlocksFromTsv(tsvPath, starts, size);
  const images = {};

  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    const pageFile = pages[start.page - 1];
    const pagePx = imageSize(pageFile);
    const sx = pagePx.width / size.width;
    const sy = pagePx.height / size.height;
    const y1pt = next && next.page === start.page ? next.y - 7 : size.height - 36;
    const x = Math.round(42 * sx);
    const y = Math.max(0, Math.round((start.y - 7) * sy));
    const width = Math.min(pagePx.width - x, Math.round((size.width - 74) * sx));
    const height = Math.max(36, Math.min(pagePx.height - y, Math.round((y1pt - start.y + 14) * sy)));
    const out = path.join(blocksDir, `${start.id}.png`);
    execFileSync("magick", [pageFile, "-crop", `${width}x${height}+${x}+${y}`, "-colorspace", "Gray", out]);
    images[start.id] = fs.readFileSync(out).toString("base64");
  }
  return { images, texts };
}

function trimSentence(text, max = 150) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function problemTopic(text) {
  const clean = text.replace(/\s+/g, " ").replace(/^[AB]-[0-9]{1,2}\s*/, "").trim();
  const match = clean.match(/^(.*?)(?:下の[0-9１-９]|このうち|□|に入れる|番号から|正しいもの|誤っているもの|適合するもの|適合しないもの)/);
  return trimSentence((match ? match[1] : clean).replace(/[、。]\s*$/, "").replace(/\s*内$/, ""), 130);
}

function citedRules(text) {
  const clean = text.replace(/\s+/g, "");
  const rulePattern = /(電波法施行規則|電波法|無線設備規則|無線局運用規則|無線局免許手続規則|無線従事者規則|無線通信規則|国際電気通信連合憲章|国際電気通信連合条約)(?:（([^）]+)）)?/g;
  const found = [...clean.matchAll(rulePattern)].map((match) => `${match[1]}${match[2] ? `（${match[2]}）` : ""}`);
  return [...new Set(found)].slice(0, 3);
}

function correctChoiceText(text, answer) {
  if (typeof answer !== "number") return "";
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const pattern = new RegExp(`^${answer}[\\s　]+(.+)`);
  const line = lines.find((item) => pattern.test(item));
  if (!line) return "";
  return trimSentence(line.replace(pattern, "$1"), 120);
}

function kougakuCalculationExplanation(question, sourceText) {
  const text = sourceText.replace(/\s+/g, " ");
  const answerText = question.kind === "A"
    ? `正答表では${question.id}の正解は${question.answer}です。`
    : `正答表では${question.id}の正解は${question.labels.map((label, index) => `${label}=${question.answers[index]}`).join("、")}です。`;
  const topic = problemTopic(sourceText);
  const lines = [];
  function finish(items) {
    return [`この問題は「${topic}」を計算で確認する問題です。`, answerText, ...items].join("\n");
  }

  if (/変成器|巻数|インピ-ダンス整合|インピーダンス整合/.test(text)) {
    return finish([
      "理想変成器では、二次側の負荷抵抗を一次側から見ると、抵抗は巻数比の2乗で変換されます。基本式は Rab = (N1 / N2)^2 RL です。",
      "最大電力を送る条件は、電源の内部抵抗と負荷側を見た抵抗が等しいこと、つまり Rab = RG です。",
      "そのとき負荷側にかかる電圧は電源電圧の半分になり、最大電力は Pm = (V/2)^2 / RG = V^2 / (4RG) になります。"
    ]);
  }

  if (/コンデンサ|静電容量|誘電体|直列|並列/.test(text)) {
    return finish([
      "コンデンサでは Q = CV、したがって V = Q/C を使います。直列接続では各コンデンサの電荷 Q が同じになり、電圧は容量 C に反比例します。",
      "耐電圧を考える問題では、容量が小さいコンデンサほど大きい電圧を受ける点が重要です。最も厳しいコンデンサが耐電圧に達する条件から全体の最大電圧を求めます。",
      "誘電体を含む平行板コンデンサは C = εS/d を基本に、層が直列になる場合は各層の電圧分担、並列になる場合は容量の和で整理します。"
    ]);
  }

  if (/共振|RLC|リアクタンス|尖鋭度|Q|同調|コイル|インダクタンス/.test(text)) {
    return finish([
      "共振回路では XL = 2πfL、XC = 1/(2πfC) を使い、共振条件は XL = XC です。",
      "共振周波数は f0 = 1/(2π√LC) で、直列共振ではインピーダンスが最小、並列共振ではインピーダンスが最大になります。",
      "尖鋭度 Q は、回路の抵抗成分に対してリアクタンス成分がどれだけ大きいかを表す量です。問題が直列か並列かを確認して、対応する式に代入します。"
    ]);
  }

  if (/SWR|定在波比|反射波|進行波|反射係数/.test(text)) {
    return finish([
      "SWRから反射係数を求める式は |Γ| = (SWR - 1) / (SWR + 1) です。",
      "反射波電力は Pr = |Γ|^2 Pf で求めます。ここで Pf は進行波電力です。",
      "リターンロスは 10log10(Pf/Pr) = -20log10|Γ| です。SWR、反射係数、進行波/反射波電力の順に変換すると整理しやすくなります。"
    ]);
  }

  if (/dB|デシベル|減衰|利得|リタ-ンロス|リターンロス/.test(text)) {
    return finish([
      "デシベル計算では、電力比は 10log10(P2/P1)、電圧・電界・電流の比は 20log10(V2/V1) を使います。",
      "減衰量が L[dB] のとき、電力比は 10^(L/10)、電圧比は 10^(L/20) です。増幅なら掛け算、減衰なら割り算として扱います。",
      "アンテナ利得や減衰器が複数ある場合は、dB表示では足し算・引き算で合成できます。最後に必要なら真数に戻します。"
    ]);
  }

  if (/AM|A3E|変調度|平均電力|搬送波/.test(text)) {
    return finish([
      "AM波の平均電力は、搬送波電力を Pc、変調度を m とすると P = Pc(1 + m^2/2) です。",
      "変調度がパーセントで与えられているときは、80%なら m=0.8 のように小数へ直して代入します。",
      "平均電力から変調度を求める場合は、P/Pc = 1 + m^2/2 から m を逆算します。"
    ]);
  }

  if (/PLL|周波数シンセサイザ|発振器|出力周波数/.test(text)) {
    return finish([
      "PLL周波数シンセサイザでは、分周後の周波数が基準周波数と一致するように制御されます。",
      "基本は 出力周波数 = 基準周波数 × 分周比 です。途中に逓倍・分周がある場合は、その倍率を順に掛けるか割るかして整理します。",
      "ブロック図の信号の流れに沿って、比較器に入る2つの周波数が等しくなる条件を立てるのがポイントです。"
    ]);
  }

  if (/見通し距離|地上高|アンテナの高さ|VHF|UHF/.test(text)) {
    return finish([
      "VHF/UHFの見通し距離は、標準大気中では d[km] ≒ 4.12(√h1 + √h2) を使います。h1、h2 は送受信アンテナ高[m]です。",
      "片方の高さを求める場合は、d/4.12 から既知側の √h を引き、残りを2乗します。",
      "単位は km と m の組合せで使う公式なので、問題文の単位をそのまま代入できるか確認します。"
    ]);
  }

  if (/導波管|遮断周波数|TE/.test(text)) {
    return finish([
      "方形導波管のTE10波の遮断周波数は fc = c/(2a) です。c は光速 3.0×10^8[m/s]、a は長辺の長さです。",
      "a を求めるときは a = c/(2fc) と変形します。GHzは10^9Hz、cmは10^-2mに直して計算します。",
      "遮断周波数より高い周波数で伝搬できるため、まずTE10の基本式で長辺寸法を求めます。"
    ]);
  }

  if (/ビットレ-ト|ビットレート|標本化|量子化/.test(text)) {
    return finish([
      "デジタル信号のビットレートは、標本化周波数 × 1標本あたりのビット数で求めます。",
      "誤り訂正符号などの付加ビットがある場合は、量子化ビット数に付加ビット数を足してから掛けます。",
      "kHz と bit の積は kbit/s になります。必要なら最後に Mbit/s へ換算します。"
    ]);
  }

  if (/電界強度|半波長ダイポ-ル|受信機の入力端子|実効長/.test(text)) {
    return finish([
      "受信アンテナの端子電圧は、電界強度とアンテナの実効長から求めます。半波長ダイポールでは実効長を波長に比例する量として扱います。",
      "まず周波数から波長 λ = c/f を求め、実効長を使って誘起電圧を計算します。",
      "問題が受信機入力電圧を与えて電界強度を問う形なら、この関係を逆に使います。mV、μV、m の単位換算に注意します。"
    ]);
  }

  if (/整流|実効値|無負荷電圧|電源電圧/.test(text)) {
    return finish([
      "整流回路では、交流の実効値と最大値の関係 Vmax = √2 Vrms を使います。",
      "コンデンサ入力形平滑回路の無負荷電圧は、おおむね整流後のピーク値になります。全波整流や倍電圧整流では、回路構成に応じてピーク値が何個分になるかを確認します。",
      "求める値が実効値かピーク値かを取り違えないことがポイントです。"
    ]);
  }

  return null;
}

function explanation(subject, question, sourceText = "") {
  const manual = MANUAL_EXPLANATIONS[`${question.examCode}:${question.id}`];
  if (manual) return manual;
  const calc = subject === "kougaku" ? kougakuCalculationExplanation(question, sourceText) : null;
  if (calc) return calc;
  const topic = problemTopic(sourceText);
  const rules = citedRules(topic || sourceText);
  const ruleText = rules.length ? `根拠として問題文に示されているのは、${rules.join("、")}です。` : "";
  if (question.kind === "A") {
    const answer = question.acceptAll ? "全員正解扱い" : question.answer;
    const choice = correctChoiceText(sourceText, question.answer);
    if (subject === "houki") {
      return `この問題は「${topic}」を問う問題です。${ruleText}正答表では${question.id}の正解は${answer}です。${choice ? `正解肢${question.answer}の要旨は「${choice}」です。` : ""}復習では、正解肢の語句が条文上の要件と一致している点と、他の肢で条件・手続・主体・期間・周波数などがずれている点を確認してください。`;
    }
    return `この問題は「${topic}」を問う問題です。正答表では${question.id}の正解は${answer}です。${choice ? `正解肢${question.answer}の要旨は「${choice}」です。` : ""}復習では、問題文の条件、図表、単位、式の関係を順に整理し、正解肢に至る公式や定義と他の肢でずれる箇所を確認してください。`;
  }
  const correct = question.labels.map((label, index) => `${label}=${question.answers[index]}`).join("、");
  if (subject === "houki") {
    return `この問題は「${topic}」を問うB問題です。${ruleText}正答表では${question.id}の正解は${correct}です。アからオまでを個別に、問題文の条文・定義・表のどの欄に対応しているか確認してください。`;
  }
  return `この問題は「${topic}」を問うB問題です。正答表では${question.id}の正解は${correct}です。アからオまでを個別に、図表・式・定義との対応を確認し、数値問題では単位と係数を分けて見直してください。`;
}

function questionsFor(exam, answers, images, texts) {
  const questions = [];
  answers.a.forEach((answer, index) => {
    const id = `A-${index + 1}`;
    const question = { id, examCode: exam.code, kind: "A", answer, acceptAll: answer === "*", options: [1, 2, 3, 4, 5], blockImage: images[id] };
    question.explanation = explanation(exam.subject, question, texts[id]);
    questions.push(question);
  });
  answers.b.forEach((answerSet, index) => {
    const id = `B-${index + 1}`;
    const question = {
      id,
      examCode: exam.code,
      kind: "B",
      answers: answerSet,
      options: Math.max(...answerSet) <= 2 ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      labels: ["ア", "イ", "ウ", "エ", "オ"],
      blockImage: images[id],
    };
    question.explanation = explanation(exam.subject, question, texts[id]);
    questions.push(question);
  });
  for (const question of questions) {
    if (!question.blockImage) throw new Error(`${exam.code} ${question.id}: block image missing`);
    if (!question.explanation) throw new Error(`${exam.code} ${question.id}: explanation missing`);
  }
  return questions;
}

function htmlFor(exam, questions) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>一アマ ${exam.label} ${exam.title}</title>
<style>
:root{--bg:#0b1020;--panel:#111827;--panel2:#182235;--line:#2b3a5c;--text:#e5edf8;--muted:#9aa8bd;--accent:#38bdf8;--ok:#22c55e;--bad:#ef4444}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Noto Sans JP","Segoe UI",sans-serif}header{position:sticky;top:0;background:rgba(11,16,32,.96);border-bottom:1px solid var(--line);z-index:2}.top{max-width:1600px;margin:0 auto;padding:12px 20px;display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}h1{font-size:18px;margin:0}.nav{display:flex;gap:8px;flex-wrap:wrap}button,a{border:1px solid var(--line);background:#172033;color:var(--text);border-radius:8px;padding:10px 14px;font-weight:700;text-decoration:none}.danger{background:#3b1111}.active,.chip.current{border-color:var(--accent);background:#075985}.wrap{max-width:1600px;margin:0 auto;padding:18px 20px}.summary{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:14px 18px;margin-bottom:16px}.summary strong{font-size:18px}.muted{color:var(--muted)}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.chip{width:58px}.chip.done{border-color:var(--ok)}.chip.wrong{border-color:var(--bad);background:#3b1d1d}.card{border:1px solid var(--line);background:var(--panel);border-radius:8px;padding:18px;margin-bottom:16px}.qhead{display:flex;justify-content:space-between;color:var(--muted);font-weight:700;font-size:18px}.qimg{display:block;width:100%;height:auto;background:white;border-radius:6px;margin-top:14px}.answers{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;margin-top:12px}.ans{padding:12px;font-size:16px}.ans:hover,.move:hover{border-color:var(--accent)}.ans.correct{background:#14532d;border-color:var(--ok)}.ans.selected.ok{background:#14532d;border-color:var(--ok)}.ans.selected.bad{background:#581c1c;border-color:var(--bad)}.sub{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}.sub-title{font-weight:700;margin-bottom:8px}.result{padding:12px;border-radius:7px;margin-top:12px;border:1px solid var(--line);line-height:1.75}.result.ok{background:rgba(34,197,94,.12);border-color:var(--ok)}.result.bad{background:rgba(239,68,68,.12);border-color:var(--bad)}.explain{margin-top:8px;color:var(--text)}.foot-actions{display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:640px){header{position:static}.wrap{padding:10px}.card{padding:12px}.chip{width:44px}.answers{grid-template-columns:repeat(5,1fr)}.ans{padding:10px 6px}}
</style>
</head>
<body>
<header><div class="top"><h1>一アマ ${exam.label} ${exam.title}（${exam.code}）</h1><div class="nav"><a href="index.html">メニュー</a><button id="reviewBtn">間違い復習</button><button id="allBtn" class="active">全問</button><button id="resetBtn" class="danger">記録リセット</button></div></div></header>
<main class="wrap">
  <div class="summary"><strong>${exam.title} / 回答済み <span id="done">0</span> / ${questions.length} 問、苦手 <span id="wrong">0</span> 問</strong><div class="muted">問題は1問ずつPDFから切り出して表示します。回答ボタンと記録はこのページで処理します。</div></div>
  <div class="chips" id="chips"></div>
  <section class="card"><div class="qhead"><span id="qid"></span><span id="pos"></span></div><div id="qbody"></div><div id="answers"></div><div id="result"></div></section>
  <div class="foot-actions"><button class="move" id="prevBtn">前へ</button><button class="move" id="nextBtn">次へ</button></div>
</main>
<script>
const EXAM=${JSON.stringify({ id: exam.id, code: exam.code, title: exam.title, subject: exam.subject })};
const QUESTIONS=${JSON.stringify(questions)};
const STORE_KEY="ama1_"+EXAM.subject+"_"+EXAM.code+"_"+(EXAM.subject==="kougaku"?"v4":"v1");
let state={answers:{},wrong:{},current:0,review:false};
try{const saved=localStorage.getItem(STORE_KEY);if(saved)state={...state,...JSON.parse(saved)}}catch(e){throw new Error("localStorage parse failed: "+STORE_KEY)}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function activeQuestions(){return state.review?QUESTIONS.filter(q=>state.wrong[q.id]):QUESTIONS}
function currentQuestion(){const list=activeQuestions();if(!list.length)return null;if(state.current>=list.length)state.current=list.length-1;if(state.current<0)state.current=0;return list[state.current]}
function isAnswered(q){return q.kind==="A"?state.answers[q.id]!==undefined:q.labels.every(l=>(state.answers[q.id]||{})[l]!==undefined)}
function updateSummary(){document.getElementById("done").textContent=QUESTIONS.filter(isAnswered).length;document.getElementById("wrong").textContent=Object.keys(state.wrong).length}
function renderChips(){const chips=document.getElementById("chips");chips.innerHTML="";QUESTIONS.forEach(q=>{const b=document.createElement("button");b.className="chip";b.textContent=q.id;if(q===currentQuestion())b.classList.add("current");if(isAnswered(q))b.classList.add("done");if(state.wrong[q.id])b.classList.add("wrong");b.onclick=()=>{state.review=false;state.current=QUESTIONS.indexOf(q);save();render()};chips.appendChild(b)})}
function renderA(q){const wrap=document.createElement("div");wrap.className="answers";const saved=state.answers[q.id];const answered=saved!==undefined;q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(answered&&(q.acceptAll||n===q.answer))b.classList.add("correct");if(saved===n)b.classList.add("selected",(q.acceptAll||n===q.answer)?"ok":"bad");b.onclick=()=>answerA(q,n);wrap.appendChild(b)});return wrap}
function renderB(q){const outer=document.createElement("div");q.labels.forEach((label,idx)=>{const row=document.createElement("div");row.className="sub";const title=document.createElement("div");title.className="sub-title";title.textContent=label;row.appendChild(title);const ans=document.createElement("div");ans.className="answers";const saved=(state.answers[q.id]||{})[label];q.options.forEach(n=>{const b=document.createElement("button");b.className="ans";b.textContent=n;if(saved!==undefined&&n===q.answers[idx])b.classList.add("correct");if(saved===n)b.classList.add("selected",n===q.answers[idx]?"ok":"bad");b.onclick=()=>answerB(q,label,idx,n);ans.appendChild(b)});row.appendChild(ans);outer.appendChild(row)});return outer}
function answerA(q,n){state.answers[q.id]=n;if(q.acceptAll||n===q.answer)delete state.wrong[q.id];else state.wrong[q.id]=true;save();render()}
function answerB(q,label,idx,n){state.answers[q.id]=state.answers[q.id]||{};state.answers[q.id][label]=n;const all=q.labels.every((l,i)=>(state.answers[q.id]||{})[l]===q.answers[i]);const anyWrong=q.labels.some((l,i)=>state.answers[q.id]?.[l]!==undefined&&state.answers[q.id][l]!==q.answers[i]);if(all)delete state.wrong[q.id];else if(anyWrong)state.wrong[q.id]=true;save();render()}
function showResult(ok,msg,explanation){const r=document.getElementById("result");r.className="result "+(ok?"ok":"bad");r.innerHTML="";const p=document.createElement("div");p.textContent=msg;r.appendChild(p);const e=document.createElement("div");e.className="explain";e.textContent=explanation;r.appendChild(e)}
function renderStoredResult(q){const r=document.getElementById("result");r.className="";r.textContent="";if(q.kind==="A"){const saved=state.answers[q.id];if(saved===undefined)return;if(q.acceptAll){showResult(true,"この問題は公式に全員正解です。選択した番号: "+saved,q.explanation);return}const ok=saved===q.answer;showResult(ok,(ok?"正解です。":"不正解です。")+"正答表の正解は "+q.answer+" です。",q.explanation)}else{const saved=state.answers[q.id]||{};const answered=q.labels.filter(l=>saved[l]!==undefined);if(!answered.length)return;const wrong=q.labels.filter((l,i)=>saved[l]!==undefined&&saved[l]!==q.answers[i]);const ok=answered.length===q.labels.length&&wrong.length===0;const correct=q.labels.map((l,i)=>l+"="+q.answers[i]).join("、");const selected=answered.map(l=>l+"="+saved[l]).join("、");showResult(ok,((ok?"正解です。":wrong.length?"不正解があります。":"回答途中です。")+" 選択: "+selected+" / 正答表: "+correct),q.explanation);}}
function render(){updateSummary();renderChips();const q=currentQuestion();document.getElementById("qid").textContent=q?q.id:(state.review?"間違いはありません":"");document.getElementById("pos").textContent=q?(state.current+1)+" / "+activeQuestions().length:"";const body=document.getElementById("qbody");const ans=document.getElementById("answers");body.innerHTML="";ans.innerHTML="";document.getElementById("result").textContent="";if(!q)return;const img=document.createElement("img");img.className="qimg";img.alt=q.id;img.src="data:image/png;base64,"+q.blockImage;body.appendChild(img);ans.appendChild(q.kind==="A"?renderA(q):renderB(q));renderStoredResult(q)}
document.getElementById("prevBtn").onclick=()=>{state.current-=1;save();render()};
document.getElementById("nextBtn").onclick=()=>{state.current+=1;save();render()};
document.getElementById("reviewBtn").onclick=()=>{state.review=true;state.current=0;save();render()};
document.getElementById("allBtn").onclick=()=>{state.review=false;state.current=0;save();render()};
document.getElementById("resetBtn").onclick=()=>{if(confirm("この年度の回答記録をリセットしますか？")){state={answers:{},wrong:{},current:0,review:false};save();render()}};
render();
</script>
</body>
</html>`;
}

function cardHtml(exam, total) {
  return `      <a href="${exam.out}" class="card ${exam.subject === "kougaku" ? "kougaku" : "houki-card"}" data-progress-subject="${exam.subject}" data-progress-code="${exam.code}" data-progress-total="${total}">
        <div class="card-label">${exam.code}</div>
        <div class="card-title">${exam.title}</div>
        <div class="card-sub">${exam.subject === "houki" ? "A問題24問 ／ B問題6問" : "A問題25問 ／ B問題5問"}</div>
        <div class="card-progress" data-progress>0/${total} ☑ 0 ❌ 0</div>
      </a>`;
}

function indexHtml(houki, kougaku) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>一アマ 過去問練習</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Share+Tech+Mono&display=swap');
:root{--bg:#0a0e1a;--surface:#111827;--border:#2a3a5c;--accent:#00d4ff;--accent2:#ff6b35;--text:#e2e8f0;--muted:#64748b}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:'Noto Serif JP',serif;min-height:100vh}body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,212,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}.container{max-width:1250px;margin:0 auto;padding:32px 24px;position:relative}.header{text-align:center;margin-bottom:28px;padding:28px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid var(--border);border-radius:14px}.badge{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--accent);letter-spacing:3px;border:1px solid var(--accent);padding:3px 12px;margin-bottom:12px}.header h1{font-size:clamp(18px,4vw,26px);line-height:1.3;margin-bottom:6px}.header-sub{font-size:12px;color:var(--muted);font-family:'Share Tech Mono',monospace}.section{margin-bottom:26px}.section-title{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:2px;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid var(--border)}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{display:block;padding:18px 20px;background:var(--surface);border:1px solid var(--border);border-radius:10px;text-decoration:none;color:var(--text);transition:all .2s}.card:hover{border-color:var(--accent);transform:translateY(-2px)}.card.kougaku:hover{border-color:var(--accent2)}.card-label{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;margin-bottom:4px}.card-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:8px}.card-sub{display:none}.card-progress{font-family:'Share Tech Mono',monospace;font-size:12px;color:#fff}.footer{text-align:center;margin-top:32px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted)}@media(max-width:720px){.container{padding:24px 14px}.card-grid{grid-template-columns:1fr;gap:12px}.card{padding:18px 20px}}
</style>
</head>
<body><div class="container"><div class="header"><div class="badge">1st CLASS AMATEUR RADIO</div><h1>第一級アマチュア無線技士<br>過去問練習アプリ</h1><div class="header-sub">令和3年4月期〜令和7年5月期 ／ 法規・無線工学</div></div>
<div class="section"><div class="section-title">📋 法規</div><div class="card-grid">
${houki.map((exam) => cardHtml(exam, 30)).join("\n")}
</div></div>
<div class="section"><div class="section-title">📡 無線工学</div><div class="card-grid">
${kougaku.map((exam) => cardHtml(exam, 30)).join("\n")}
</div></div>
<div class="footer">回答の進捗はブラウザのlocalStorageに保存されます。<br>キャッシュクリアや別端末では引き継がれません。</div></div>
${progressScript()}
</body></html>`;
}

function houkiMenuHtml(houki) {
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>一アマ 法規</title><style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&family=Share+Tech+Mono&display=swap');
:root{--bg:#0a0e1a;--surface:#111827;--border:#2a3a5c;--accent:#00d4ff;--text:#e2e8f0;--muted:#94a3b8}*{box-sizing:border-box;margin:0;padding:0}body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Noto Serif JP',serif}.container{max-width:1250px;margin:0 auto;padding:32px 24px}.top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}h1{font-size:clamp(22px,5vw,32px)}.menu{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:1px solid var(--border);border-radius:8px;background:#172033;color:var(--text);text-decoration:none;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{display:block;padding:18px 20px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);text-decoration:none;transition:all .2s}.card:hover{border-color:var(--accent);transform:translateY(-2px)}.code{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--accent);letter-spacing:1px;margin-bottom:4px}.title{font-size:16px;font-weight:700;margin-bottom:8px}.sub{display:none}.progress{font-family:'Share Tech Mono',monospace;font-size:14px;color:#fff}@media(max-width:720px){.container{padding:24px 14px}.grid{grid-template-columns:1fr;gap:12px}.card{padding:18px 20px}}
</style></head><body><div class="container"><div class="top"><h1>法規</h1><a class="menu" href="index.html">メニュー</a></div><div class="grid">
${houki.map((exam) => `    <a href="${exam.out}" class="card" data-progress-code="${exam.code}" data-progress-total="30"><div class="code">${exam.code}</div><div class="title">${exam.title}</div><div class="sub">A問題24問 ／ B問題6問</div><div class="progress" data-progress>0/30 ☑ 0 ❌ 0</div></a>`).join("\n")}
</div></div>
${progressScript("houkiOnly")}
</body></html>`;
}

function progressScript(mode = "all") {
  if (mode === "houkiOnly") {
    return `<script>
function readJson(key){const raw=localStorage.getItem(key);if(!raw)return null;return JSON.parse(raw)}
function isAnswered(value){if(value==null)return false;if(typeof value==='object')return Object.keys(value).length>0;return true}
function stats(code,total){const state=readJson(\`ama1_houki_\${code}_v1\`);if(!state||!state.answers)return{answered:0,correct:0,wrong:0,total};const answered=Object.values(state.answers).filter(isAnswered).length;const wrong=state.wrong?Object.keys(state.wrong).length:0;return{answered,correct:Math.max(0,answered-wrong),wrong,total}}
document.querySelectorAll('[data-progress-code]').forEach(card=>{const s=stats(card.dataset.progressCode,Number(card.dataset.progressTotal));card.querySelector('[data-progress]').textContent=\`\${s.answered}/\${s.total} ☑ \${s.correct} ❌ \${s.wrong}\`});
</script>`;
  }
  return `<script>
function readJson(key){const raw=localStorage.getItem(key);if(!raw)return null;return JSON.parse(raw)}
function isAnswered(value){if(value==null)return false;if(typeof value==='object')return Object.keys(value).length>0;return true}
function stats(subject,code,total){const version=subject==='kougaku'?'v4':'v1';const state=readJson(\`ama1_\${subject}_\${code}_\${version}\`);if(!state||!state.answers)return{answered:0,correct:0,wrong:0,total};const answered=Object.values(state.answers).filter(isAnswered).length;const wrong=state.wrong?Object.keys(state.wrong).length:0;return{answered,correct:Math.max(0,answered-wrong),wrong,total}}
document.querySelectorAll('[data-progress-subject]').forEach(card=>{const s=stats(card.dataset.progressSubject,card.dataset.progressCode,Number(card.dataset.progressTotal));card.querySelector('[data-progress]').textContent=\`\${s.answered}/\${s.total} ☑ \${s.correct} ❌ \${s.wrong}\`});
</script>`;
}

function main() {
  cleanDir(TMP);
  const houki = examsFor("houki");
  const kougaku = examsFor("kougaku");
  for (const exam of [...houki, ...kougaku]) {
    for (const file of [exam.pdf, exam.answerPdf]) {
      if (!fs.existsSync(path.join(ROOT, file))) throw new Error(`${exam.code}: missing ${file}`);
    }
    const answers = parseAnswers(exam);
    const blocks = blockImages(exam);
    const questions = questionsFor(exam, answers, blocks.images, blocks.texts);
    fs.writeFileSync(path.join(ROOT, exam.out), htmlFor(exam, questions));
    console.log(`${exam.out}: ${questions.length} questions`);
  }
  fs.writeFileSync(path.join(ROOT, "index.html"), indexHtml(houki, kougaku));
  fs.writeFileSync(path.join(ROOT, "houki.html"), houkiMenuHtml(houki));
}

main();
