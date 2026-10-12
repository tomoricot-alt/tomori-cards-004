# TOMORI CARDS（APP 004）

TOMORI APP LAB 第4号。中学生・高校生向けのシンプルな暗記カード（フラッシュカード）アプリです。
英単語・歴史・理科・漢字などを、スマホでもPCでも手軽に覚えられます。

- 公開URL（予定）: https://tomoricot-alt.github.io/tomori-cards-004/
- サーバー・会員登録・外部API・広告・外部リンクは一切ありません
- 氏名・学校名・メールアドレスなどの個人情報は要求しません
- データは端末のブラウザ（localStorage）にのみ保存されます。**ブラウザデータを削除すると消えます**（アプリ内にも注意を表示）

## 機能

- カードセット（科目別）の作成・名前変更・削除
- カードの作成・編集・削除（表面＝問題／裏面＝答え、各200文字まで）
- タップでカードをめくる（回転アニメーション）
- シャッフル、「覚えた」「もう一度」の記録
- 覚えた枚数・進捗(%)の表示、間違えたカードだけの再復習
- 保存データの検証（壊れたデータは破棄して起動、入力の長さ・制御文字チェック）

## 技術構成

React Native / Expo (SDK 57) / TypeScript / React Native Web / localStorage（iOS・AndroidではAsyncStorage）。
追加ライブラリは `@react-native-async-storage/async-storage` のみ（画面遷移はstateで自前実装）。

```
App.tsx                 画面遷移・データ読み書き
src/logic.ts            検証・シャッフル・進捗などの純粋関数
src/storage.ts          保存/読み込み
src/screens/            ホーム / カード編集 / 学習 / 結果
src/components/         FlipCard, 共通UI
__tests__/              Jestテスト
scripts/e2e.mjs         手動E2E（Playwright）
docs/                   USER_GUIDE.md, DEV_REPORT.md
```

## 開発

```bash
npm ci
npm run web          # 開発サーバー（ブラウザ）
npm run typecheck    # 型チェック
npm test             # テスト
npm run build:web    # dist/ にWebビルド（baseUrl=/tomori-cards-004）
```

E2E（任意）: `npm run build:web && node scripts/e2e.mjs`（Playwright と Chromium が必要。`PLAYWRIGHT_MODULE` / `CHROMIUM_PATH` で指定可）

## 公開手順（GitHub Pages）

1. このPull Requestを確認し、**本人が**承認してmainへマージする（自動マージはしません）
2. GitHubの `Settings` → `Pages` → `Build and deployment` → **Source** を **「GitHub Actions」** にする（初回のみ）
3. mainへのマージで `.github/workflows/ci.yml` が実行され、型チェック・テスト・Webビルド後に自動公開される
4. https://tomoricot-alt.github.io/tomori-cards-004/ で確認する

PR上では型チェック・テスト・Webビルドのみ実行され、公開はmainマージ後だけです。

## ドキュメント

- [使い方（中高生向け）](docs/USER_GUIDE.md)
- [開発レポート](docs/DEV_REPORT.md)
