// 手動E2E（CIには含めない）: dist/ を /tomori-cards-004/ で配信し、iPhone相当の画面で操作を検証する
// 使い方: npm run build:web && node scripts/e2e.mjs   （Playwright が必要）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const BASE = '/tomori-cards-004';
const root = path.resolve('dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!p.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  p = p.slice(BASE.length) || '/';
  let f = path.join(root, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4173, r));

const results = [];
const check = (name, cond) => { results.push([name, !!cond]); console.log(cond ? 'PASS' : 'FAIL', name); };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const url = `http://localhost:4173${BASE}/`;
await page.goto(url);
await page.getByText('カードセット', { exact: true }).waitFor();
check('ホームが表示される', true);
check('データ消失の注意が表示される', await page.getByText('ブラウザの閲覧データを削除', { exact: false }).isVisible());
check('横スクロールが発生しない', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

// セット作成（不正入力→正常）
await page.getByText('＋ 新しいカードセットを作る').click();
await page.getByRole('button', { name: '作成する' }).click();
check('空のセット名はエラー', await page.getByText('セット名を入力してください。').isVisible());
await page.getByLabel('セット名').fill('英単語テスト');
await page.getByRole('button', { name: '作成する' }).click();
await page.getByText('英単語テスト').waitFor();
check('セットが作成される', true);

// カード追加
await page.getByRole('button', { name: '英単語テストのカードを編集' }).click();
await page.getByRole('button', { name: 'カードを追加', exact: true }).click();
check('空カードはエラー', await page.getByText('表面（問題）を入力してください。').isVisible());
for (const [q, a] of [['apple', 'りんご'], ['book', '本'], ['cat', '猫']]) {
  await page.getByLabel('表面（問題）').fill(q);
  await page.getByLabel('裏面（答え）').fill(a);
  await page.getByRole('button', { name: 'カードを追加', exact: true }).click();
}
check('3枚登録される', (await page.getByText('→ ', { exact: false }).count()) === 3);

// 編集
await page.getByRole('button', { name: '編集', exact: true }).first().click();
await page.getByLabel('表面（問題）').fill('apples');
await page.getByRole('button', { name: '変更を保存' }).click();
check('カード編集が反映される', await page.getByText('apples', { exact: true }).isVisible());

// 削除（確認ダイアログ）
await page.getByRole('button', { name: '削除', exact: true }).nth(2).click();
await page.getByText('このカードを削除しますか？').waitFor();
await page.getByRole('button', { name: '削除する' }).click();
check('カード削除', (await page.getByText('→ ', { exact: false }).count()) === 2);
// 1枚戻す
await page.getByLabel('表面（問題）').fill('cat');
await page.getByLabel('裏面（答え）').fill('猫');
await page.getByRole('button', { name: 'カードを追加', exact: true }).click();

// 再読み込み後の保持
await page.reload();
await page.getByText('英単語テスト').waitFor();
check('再読み込み後もセットが残る', true);
check('再読み込み後もカード数が残る', await page.getByText('3枚', { exact: false }).first().isVisible());

// 学習
await page.getByRole('button', { name: '学習する' }).click();
check('学習画面（1/3）', await page.getByText('1 / 3').isVisible());
const card = page.getByRole('button', { name: /タップで答えを見る/ });
await card.click();
await page.waitForTimeout(500);
check('タップで裏面（答え）になる', await page.getByRole('button', { name: /答え：/ }).isVisible());
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/study-back.png` : undefined });
await page.getByRole('button', { name: 'もう一度' }).click();
check('次のカード(2/3)', await page.getByText('2 / 3').isVisible());
await page.getByRole('button', { name: '答えを見る', exact: true }).click();
await page.getByRole('button', { name: '覚えた！' }).click();
await page.getByRole('button', { name: '残りのカードをシャッフル' }).click();
check('シャッフル後も学習継続', await page.getByText('3 / 3').isVisible());
await page.getByRole('button', { name: '答えを見る', exact: true }).click();
await page.getByRole('button', { name: '覚えた！' }).click();

// 結果
await page.getByText('おつかれさま！').waitFor();
check('結果: 覚えた2 / もう一度1', (await page.getByText('2', { exact: true }).count()) >= 1 && (await page.getByText('1', { exact: true }).count()) >= 1);
check('進捗 67% 表示', await page.getByText('（67%）', { exact: false }).isVisible());
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/result.png` : undefined });

// 復習
await page.getByRole('button', { name: /まちがえたカードを復習/ }).click();
check('復習は1枚のみ', await page.getByText('1 / 1').isVisible());
await page.getByRole('button', { name: '答えを見る', exact: true }).click();
await page.getByRole('button', { name: '覚えた！' }).click();
await page.getByText('ぜんぶ覚えた！').waitFor();
check('復習で全部覚えた', true);
await page.getByRole('button', { name: 'ホームにもどる' }).click();
check('ホームの進捗100%', await page.getByText('進捗 100%').isVisible());
await page.reload();
check('再読み込み後も進捗100%保持', await page.getByText('進捗 100%').isVisible());

// 壊れたデータ
await page.evaluate(() => localStorage.setItem('tomori-cards-004:data:v1', '{broken'));
await page.reload();
check('壊れた保存データでも起動し通知', await page.getByText('読み込めなかった', { exact: false }).isVisible());

// セット削除
await page.evaluate(() => localStorage.clear());
await page.reload();
check('ストレージ削除後は空の状態', await page.getByText('まだカードセットがありません').isVisible());
check('JSエラーなし', errors.length === 0);
if (errors.length) console.log(errors);

// PC幅
const pc = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await pc.goto(url);
await pc.getByText('カードセット', { exact: true }).waitFor();
check('PC幅でも表示', true);
if (process.env.SHOT_DIR) await pc.screenshot({ path: `${process.env.SHOT_DIR}/pc-home.png` });

await browser.close();
server.close();
const failed = results.filter(([, ok]) => !ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
