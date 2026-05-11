const EXPLANATIONS = {
  HZ512: {
    "A-4": "各抵抗は同じ 3R です。図の接続点のうち同電位になる点をまとめ、直列・並列に置き換えて端子 a-b から見た合成抵抗を求めると 5R/2 になります。したがって選択肢 5 が正解です。",
    "A-5": "この問題は公式正答表で全員正解扱いです。採点上はどの番号を選んでも正解になります。"
  }
};

function answerText(q) {
  if (q.acceptAll) return "公式正答表で全員正解扱いです。";
  if (q.kind === "A") return `正答表では選択肢 ${q.answer} が正解です。問題文の条件と選択肢を照合し、該当する式・記述・組合せが選択肢 ${q.answer} になることを確認します。`;
  return `正答表では ${q.labels.map((label, index) => `${label}=${q.answers[index]}`).join("、")} です。各空欄を個別に照合し、すべて一致した場合に正解になります。`;
}

function explanationFor(examCode, q) {
  return EXPLANATIONS[examCode]?.[q.id] || answerText(q);
}

module.exports = { explanationFor };
