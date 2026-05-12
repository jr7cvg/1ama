# 作業ルール

## 解説の扱い

- 汎用フォールバック解説は禁止。
- 問題固有の解説が未登録の場合は、未対応として `explanation_gaps.json` と `explanation_gaps.md` に出す。
- 通常の `node build_all_exam_pages.js` は、未対応解説が残っている限り失敗させる。
- HTML確認用に未対応を明示表示したい場合だけ、意図を理解したうえで `ALLOW_MISSING_EXPLANATIONS=1 node build_all_exam_pages.js` を使う。
- 「正答表では正解はXです。復習では...」のような画一文を、完成した解説として扱わない。

## 問題画像

- 問題文、図、表、式はPDFから切り出した画像を表示する。
- HTML上で問題本文を無理に再構成しない。

## 生成物

- `build_all_exam_pages.js` を編集した後は、必ず `node --check build_all_exam_pages.js` を実行する。
- 生成後は、各ページの問題数、A/B問題数、画像数を機械検査する。
