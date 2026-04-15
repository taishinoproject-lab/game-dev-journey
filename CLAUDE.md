# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
npm run dev       # 開発サーバー起動 (port 5173)
npm run build     # プロダクションビルド
npm run preview   # ビルド結果をローカルで確認
npm run test      # テスト実行（vitest）
npm run test:watch # テストをウォッチモードで実行
npm run lint      # ESLint 実行
```

テストを1ファイルだけ実行する場合：
```bash
npx vitest run src/test/example.test.ts
```

## アーキテクチャ

### ゲームの状態管理
すべてのゲーム状態は `src/components/GameManager.tsx` の単一コンポーネントで管理している（useState + useEffect）。Redux や Context は使っていない。

**ゲームフェーズ（`GamePhase` 型）:**
`title` → `wave-intro` → `normal`（通常戦） → `wave-intro` → `boss-intro` → `boss`（ボス戦） → `wave-intro` → ... → `result`

`tutorial` は型定義にはあるが未実装。

### タイピングエンジン（`src/game/romajiEngine.ts`）
ひらがなをローマ字の状態遷移マシンで処理する。

- `parseHiragana(text)` → `RomajiChar[]`（各文字の許容ローマ字パターン）
- `createTypingState(hiragana)` → `TypingState`（セグメント単位で生成）
- `processInput(state, key)` → `{ result: InputResult, state: TypingState }`
  - result は `'correct' | 'complete' | 'miss' | 'absorb'`
  - `'complete'` はセグメント1つが完了した意味（呪文全体ではない）
  - `'absorb'` は `ん` 後の余分な `n` を無音でスキップする特殊ケース
- `ん` は常に `['nn']` パターンで管理。表示は `getDisplayChar()` で `'n'` 1文字にする
- ミスタイプ時は巻き戻しなし。`processInput` が元の `state` を返すのでそのまま維持

### ボス戦の呪文選択システム
ボス戦は「候補モード → 詠唱モード」の2段階。

- `currentSpell === null` のとき候補モード
- プレイヤーが打つたびに `tryReplayInput(spell, inputBuffer)` を全呪文に対して実行し候補を絞り込む
- 候補が1件になったら自動で詠唱モード（`currentSpell` をセット）に移行
- Ctrl+C で詠唱中断 → 候補モードへ戻る

### 敵データ（`src/game/enemies.ts`）
- `createNormalEnemies(wave)`: Wave ごとに敵数（3〜6体）・HP をスケール
- `createBossEnemy(wave)`: HP = 100 + wave×50、攻撃間隔 = max(3, 8 - wave×0.5)秒、警告時間 = max(2, 3 - wave×0.1)秒
- `getBossTimeLimit(wave)`: Wave1→60秒、2-3→50秒、4-6→45秒、7+→40秒
- `getNormalTimeLimit(romajiLength, wave)`: ローマ字長と Wave から動的に制限時間を計算

### 呪文データ（`src/game/spells.ts`）
- 攻撃呪文（破道）5種：衝・赤火砲・蒼火墜・雷吼炮・黒棺
- 防御呪文（縛道）2種：斥・断空
- 各呪文は `segments: string[]`（ひらがな）で区切られており、セグメント完了が `processInput` の `'complete'` に対応

### 魔法陣（`src/components/MagicCircle.tsx`）
HTML Canvas で 60fps 描画。`requestAnimationFrame` ループ内で直接描画。React の再レンダリングとは独立している。

進捗（`progress: 0〜1`）に応じて5段階でレイヤーを描画：
1. 外周の円 (0〜20%)
2. 幾何学模様 (20〜40%)
3. ルーン文字 (40〜60%)
4. 内側シンボル (60〜80%)
5. 完成グロー (80〜100%)

コンボ数に応じて `getComboColor()` / `getComboGlowColor()` で色が変化（定義は `src/game/types.ts`）。

### スコア計算
```
スコア = baseDamage × 10 × コンボ倍率 × 速度ボーナス × ノーミスボーナス
```
- コンボ倍率: 0-4→×1.0 / 5-9→×1.5 / 10-14→×2.0 / 15-19→×2.5 / 20+→×3.0
- 速度ボーナス: 残り80%超→×1.5 / 50%超→×1.2 / それ以下→×1.0
- ノーミスボーナス: ×1.5（ミスあり→×1.0）

### デザイン方針
BLEACHの美学をベースにした黒背景・白/青白ライン。
- 背景: `#0A0A0A`（漆黒）
- フォント: Noto Serif JP（詠唱テキスト） / Fira Code（ローマ字）/ Noto Sans JP（UI）
- `castingAnimation` は視覚エフェクト専用で、入力はブロックしない

## カスタムコマンド

`.claude/commands/` にプロジェクト固有のスラッシュコマンドを定義している。

| コマンド | ファイル | 動作 |
|---|---|---|
| `/ship` | `ship.md` | ビルド確認 → コミット（日本語メッセージ） → push |

## デプロイ
`main` ブランチへの push で GitHub Actions が自動的に GitHub Pages へデプロイ。
`GITHUB_ACTIONS=true` のとき `vite.config.ts` が `base: '/game-dev-journey/'` を適用する。
公開 URL: `https://taishinoproject-lab.github.io/game-dev-journey/`

## 要件定義書
`requirements_v2.md` に詳細な仕様が記載されている。未実装の主な機能はチュートリアル、防御の不完全防御（途中タイプで半減）、断空の攻撃バフ効果。
