# firestore-lint

[![CI](https://github.com/KoseiTanno/firestore-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/KoseiTanno/firestore-lint/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/firestore-lint.svg)](https://www.npmjs.com/package/firestore-lint)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Firebase Firestore / Storage セキュリティルールの静的解析CLI。

[English README](./README.md)

## 課題

Firestore セキュリティルールは `firebase deploy --only firestore:rules` の完了と同時に、
全ユーザーへ即座に効きます。段階的なロールアウトはありません。「テストモードで開始」が
残したこのようなルール——

```
allow read, write: if request.time < timestamp.date(2024, 1, 1);
```

——は、期限が来る前は全世界にデータベースを公開し、期限が過ぎれば全ユーザーを締め出します。
ルールファイルはコードベースの中でも特にテストが書かれにくい部分です。宣言的で読み間違えやすく、
ミスの影響は事故が起きるまで見えません。firestore-lint は、デプロイする前にこうした事故につながる
書き方を検出します。

## クイックスタート

```bash
npx firestore-lint firestore.rules
```

## 出力例

実際の本番ルールファイルに対して実行した結果:

```
firestore.rules
  11:7   warn   This condition performs 4 document lookups; each is a billed read (max 10 per request).  limit-get-calls
  49:9   warn   Prefer create, update, and delete over the broad write method.                            prefer-granular-write
  76:7   warn   Prefer create, update, and delete over the broad write method.                            prefer-granular-write

3 problems (3 warnings)
```

## インストール

```bash
npm install --save-dev firestore-lint
```

公開パッケージの実行には Node.js 20+ が必要です。このリポジトリの開発には
Node.js 22.13+ が必要です（[CONTRIBUTING.md](./CONTRIBUTING.md) 参照）。

## 使い方

```bash
firestore-lint <file...>            人が読みやすい出力（色付き・行番号付き）
firestore-lint --format json <file> 機械可読な出力（CI向け）
firestore-lint --max-warnings 0     警告が1件でもあればビルドを失敗させる
```

終了コード: `0` = 問題なし（または`--max-warnings`以内の警告のみ） / `1` = エラーを検出
（または警告が`--max-warnings`を超過） / `2` = コマンド自体の実行失敗（引数不正・ファイル不在）

## ルール一覧

| ルール | Severity | 内容 |
| --- | --- | --- |
| [`no-public-read`](./docs/rules/no-public-read.md) | error | 読み取りが `if true` のみで保護されている |
| [`require-auth-check`](./docs/rules/require-auth-check.md) | error | `request.auth` の検査なしにアクセスを許可している |
| [`no-wildcard-write`](./docs/rules/no-wildcard-write.md) | error | 再帰ワイルドカードパス配下で書き込みを許可している |
| [`no-expired-test-mode`](./docs/rules/no-expired-test-mode.md) | error | `timestamp.date(...)` のテストモード期限が切れている、または開放中 |
| [`no-auth-only-read`](./docs/rules/no-auth-only-read.md) | warn | ログインさえすれば誰でも読める（所有者/メンバーチェックが無い） |
| [`limit-get-calls`](./docs/rules/limit-get-calls.md) | warn | 条件式内で3回以上のドキュメント参照が行われている |
| [`prefer-granular-write`](./docs/rules/prefer-granular-write.md) | warn | `create`/`update`/`delete` の代わりに `allow write` を使っている |
| [`require-rules-version`](./docs/rules/require-rules-version.md) | warn | `rules_version = '2'` が欠落している、または非推奨の `'1'` |
| [`no-unused-function`](./docs/rules/no-unused-function.md) | info | 定義された `function` が一度も呼ばれていない |

## CIでの使い方

```yaml
- run: npx firestore-lint firestore.rules --max-warnings 0
```

## `@firebase/rules-unit-testing` との違い

`@firebase/rules-unit-testing` が答えるのは「このルールは意図どおりに動くか？」という問いです。
テストを書き、特定の read/write が成功・失敗することをアサートし、意図と一致しているかを
エミュレータが教えてくれます。

firestore-lint が答えるのは別の問いです。「その意図自体が危険ではないか？」。
エミュレータを起動する必要もテストケースも要りません——ルールファイルを読み、書いた人の
意図に関わらず危険な形を指摘します。「そもそも認証無しで読まれたらどうなる？」のように、
テストしようと思いつきもしなかったルールこそ `@firebase/rules-unit-testing` では
捕まえられません。そのギャップを埋めるのがこのツールです。

## 既知の限界

- ルールはトークン列として検査され、評価はしません。`limit-get-calls` は
  短絡評価で実際には実行されない分岐内の `get()`/`exists()`/`getAfter()` も
  文字通りカウントします。詳細は [ADR-0001](./docs/adr/0001-lightweight-parser.md) を参照。
- アプリケーションのデータモデルに対する型・スキーマチェックは行いません。
- `require-auth-check` は関数呼び出しの間接参照を1段のみ辿ります
  （`allow read: if isOwner();`）。関数が別の関数を呼ぶ連鎖までは追跡しません。

## コントリビュート

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ライセンス

MIT