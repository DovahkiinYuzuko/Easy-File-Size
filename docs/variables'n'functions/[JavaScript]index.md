# [JavaScript]index.js 仕様書

`index.js` における主要な定数、変数および関数の定義と、それらの依存関係を示します。

## 関数定義

### 関数 `formatSize` (L29-42)
- **役割**: バイト数を人間が読みやすい単位（B, KB, MB, GB, TB）に変換する。カラー表示が有効な場合はサイズ情報を灰色で装飾する。
- **引数**:
  - `bytes` (number): 変換対象のバイト数。
  - `useColor` (boolean): カラー表示を使用するかどうか（デフォルト: `false`）。
- **戻り値**:
  - `string`: フォーマットされたサイズ表記。

### 関数 `buildSizeMap` (L51-88)
- **役割**: 指定されたディレクトリ配下の全ファイルおよびフォルダのサイズを1回の走査で集計し、各パスの合計バイト数を記録した `Map` オブジェクトを構築して返す。無視リストに含まれる名前のファイルやフォルダは走査から除外する。
- **引数**:
  - `dirPath` (string): 走査を開始するルートディレクトリ의パス。
  - `ignoreList` (string[]): 無視するフォルダ名・ファイル名の配列。
- **戻り値**:
  - `Map<string, number>`: キーが各フォルダ・ファイルの絶対パス、値がその合計バイト数である `Map` オブジェクト。

### 関数 `renderTree` (L96-181)
- **役割**: `buildSizeMap` で構築したサイズキャッシュ（`Map`）を利用し、指定されたディレクトリ配下のファイルとフォルダをツリー構造で再帰的にコンソールに描画する。深さに応じた色分けや、サイズ順ソートのオプションに対応する。
- **引数**:
  - `dirPath` (string): 対象ディレクトリのパス。
  - `sizeMap` (Map<string, number>): `buildSizeMap` で取得したサイズ情報のマップ。
  - `options` (object):
    - `prefix` (string): 描画用インデントプレフィックス。
    - `currentDepth` (number): 現在のツリーの深さ。
    - `maxDepth` (number): ツリー表示の最大深さ。
    - `ignoreList` (string[]): 無視する名前の配列。
    - `isSort` (boolean): サイズ順でソートして描画するかどうか。
    - `useColor` (boolean): カラー表示を使用するかどうか。
- **戻り値**:
  - `void`

### 関数 `main` (L186-279)
- **役割**: コマンドのメインエントリーポイント。引数をパースしてオプションを抽出し、カラー表示の有効/無効を TTY 状態から判定後、対象パスに対して `buildSizeMap` や `renderTree` を呼び出す。
- **引数**:
  - なし（`process.argv` から取得）。
- **戻り値**:
  - `void`

---

## 依存関係マッピング (Dependency Mapping)

```mermaid
graph TD
  main["main()"] --> buildSizeMap["buildSizeMap()"]
  main --> renderTree["renderTree()"]
  main --> formatSize["formatSize()"]
  renderTree --> formatSize
```

---

## 影響範囲 (Impact Scope)

- **既存コードへの影響**:
  - ツリー表示やサイズ情報の出力処理にカラー用のエスケープシーケンスが出力されるようになります。
- **外部環境への影響**:
  - `process.stdout.isTTY` を使用してリダイレクトを判定するため、パイプライン処理時にもプレーンテキストが維持されます。