# 簡単ファイルサイズ / Easy-File-Size

ファイルやディレクトリの容量をターミナルで直感的に確認するためのCLIツールです。 / A CLI tool to easily check file and directory sizes in the terminal.

![Node.js](https://img.shields.io/badge/Node.js-v16.0.0+-339933?style=flat-square&logo=node.js&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

[日本語](#日本語) | [English](#english)

---

## 日本語

### 概要
簡単ファイルサイズ（Easy-File-Size）は、ターミナル上から `yoryo` コマンドで呼び出して、指定したファイルやフォルダのサイズを素早く調査・確認できるNode.js製のCLIツールです。

> [!NOTE]
> **動作環境に関する注意点**
> 本ツールは現在 Windows 11 環境（PowerShell および コマンドプロンプト）でのみ動作テストを行っています。macOSやLinux等の他OS環境での動作検証は行われていません。

### 主な特徴
- **効率的なスキャン**: ディレクトリ走査を1回のみに制限し、計算したサイズ情報をキャッシュ（Map）に保持します。無駄な重複読み込みがないため、ファイル数が多いフォルダでも高速に処理が完了します。
- **スリムなツリー表示 (デフォルト)**: デフォルトのツリー表示 (`yoryo -tree`) ではフォルダ構造のみを出力します。表示行数を極力減らすため、ターミナルのログスクロール制限に引っかかりません。
- **ファイル表示オプション**: `-f` (または `/f`, `--files`) オプションを付与することで、ファイルも含めたフルツリーを描画可能です。
- **パターンマッチ機能**: `-match` オプションでワイルドカード（例: `*.js`）を指定し、特定の拡張子や名前を持つファイルのみを対象にツリーを抽出し、その合計サイズを集計できます。マッチしないフォルダは自動で除外されます。
- **ソートと深さ制限**: 容量が大きい順に並び替える `-sort` オプションや、ツリーの展開レベルを制限する `-depth` オプションを利用できます。
- **インテリジェントなカラー表示**: ディレクトリの深さに応じて自動で色分け表示します。なお、`>` などのリダイレクトでファイルに結果を書き出す際は、カラー用エスケープシーケンスを自動でカットし、文字化けを防ぎます。

### インストール方法
お使いの環境に応じて、以下のいずれかの方法でインストールできます。

#### 方法 1: npm によるインストール（推奨・超軽量）
Node.js（npm）環境がすでに用意されている方向けの、最も軽量なインストール方法です（サイズは数KB程度）。
以下のコマンドを実行するだけで、GitHubから直接グローバルコマンドとしてインストールできます。
```bash
npm install -g YuzukoUnderson/Easy-File-Size
```

#### 方法 2: インストーラーまたは実行ファイルによるインストール
お使いのパソコンに Node.js がインストールされていなくても動作します。
リポジトリの [Releases](../../releases) ページから最新のバイナリをダウンロードできます。
- **Windows の場合**: `.msi` インストーラーを実行すると、自動的にインストールと環境変数 `PATH` の設定が行われ、すぐに `yoryo` コマンドが使用可能になります。
- **macOS / Linux の場合**: 各OS用の実行バイナリをダウンロードし、任意のフォルダに配置して環境変数 `PATH` を通してご利用ください。

> [!WARNING]
> - インストーラーおよび実行ファイルは、実行に必要な Node.js ランタイムを内部に同梱してビルドされているため、ファイルサイズが数十MB〜100MB程度と大きくなります。
> - macOS および Linux 用の実行バイナリは自動ビルドされていますが、開発環境（Windows 11）以外での実機検証は行われていないため**動作保証外（自己責任での利用）**となります。

### 使い方
```bash
# カレントディレクトリの容量を表示
yoryo

# 特定のパスの容量を表示（複数指定可能）
yoryo path/to/dir1 path/to/dir2

# フォルダ構造のみをツリー表示
yoryo -tree

# ファイルも含めてツリー表示
yoryo -tree -f

# 特定の拡張子（例: JSファイル）のみを抽出してツリー表示
yoryo -tree -f -match "*.js"

# 容量が大きい順にソートしてツリー表示
yoryo -tree -sort

# 階層の深さを2までに制限して表示
yoryo -tree -depth 2

# 特定のフォルダ（例: node_modules）を除外して表示
yoryo -tree -ignore node_modules .git

# ヘルプ画面（英語）を表示
yoryo -h
```

### ライセンス
このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

---

## English

### Overview
Easy-File-Size is a Node.js-based CLI tool that can be invoked via the `yoryo` command in your terminal to quickly inspect and check the sizes of files and folders.

> [!NOTE]
> **Environment Compatibility**
> This tool has been developed and tested exclusively on Windows 11 (PowerShell and Command Prompt). Performance and compatibility on other OS environments like macOS or Linux have not been verified yet.

### Key Features
- **High-Performance Scanning**: Restricts directory traversal to a single scan and caches calculated sizes in a Map. This prevents duplicate disk reads and ensures fast processing even in massive directories.
- **Clean Tree View by Default**: The default tree view (`yoryo -tree`) renders only the directory structure. This minimises output lines and prevents cluttering the terminal.
- **File Output Option**: Specify `-f` (or `/f`, `--files`) to display files alongside directories in the tree.
- **Pattern Matching Filter**: Use the `-match` option with a wildcard (e.g., `*.js`) to show only matching files and calculate their combined size. Directories containing no matches are automatically hidden.
- **Depth Limiting & Sorting**: Restrict tree depth using `-depth` and sort output by size in descending order using `-sort`.
- **Smart Colorization**: Color-codes directories dynamically by depth. It automatically detects redirection and falls back to plain text when outputting to files to prevent encoding issues.

### Installation
Choose one of the following methods depending on your environment.

#### Method 1: Install via npm (Recommended & Lightweight)
If you already have Node.js (npm) installed, this is the most lightweight method (only a few KB).
Run the following command to install globally directly from GitHub:
```bash
npm install -g YuzukoUnderson/Easy-File-Size
```

#### Method 2: Install via Installer or Standalone Binary (No Node.js Required)
Use this option if Node.js is not installed on your system.
You can download the files from the [Releases](../../releases) page.
- **For Windows**: Download and run the `.msi` installer. It will automatically install the tool and register it to your system `PATH`.
- **For macOS / Linux**: Download the standalone binary for your OS, place it in an appropriate directory, and manually add it to your system `PATH`.

> [!WARNING]
> - Standalone binaries/installers bundle the Node.js runtime environment inside them. Therefore, the download size is significantly larger (tens of MBs to 100MB).
> - macOS and Linux binaries are built automatically, but they have not been verified on actual devices. They are provided as-is without any warranties or guarantees of operation.

### Usage
```bash
# Check current directory size
yoryo

# Check specific path sizes (multiple paths supported)
yoryo path/to/dir1 path/to/dir2

# Render folder-only tree
yoryo -tree

# Render tree including files
yoryo -tree -f

# Filter tree to specific files (e.g., Python files)
yoryo -tree -f -match "*.py"

# Sort tree by size in descending order
yoryo -tree -sort

# Limit tree depth to 2
yoryo -tree -depth 2

# Ignore specific directories
yoryo -tree -ignore node_modules .git

# Show help
yoryo -h
```

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
