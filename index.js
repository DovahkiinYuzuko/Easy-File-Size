#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * バイト数を人間が読みやすい単位（B, KB, MB, GB, TB）に変換する
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたサイズ表記
 */
export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${formatted} ${sizes[i]} (${bytes.toLocaleString()} bytes)`;
}

/**
 * 指定されたディレクトリ配下の全ファイルの合計サイズを再帰的に計算する
 * @param {string} dirPath - 対象ディレクトリのパス
 * @returns {number} 合計バイト数
 */
export function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += getDirSize(filePath);
      } else if (file.isFile()) {
        try {
          const stats = fs.statSync(filePath);
          size += stats.size;
        } catch (e) {
          // ファイル情報が取得できない場合はサイズ0として無視
        }
      }
    }
  } catch (e) {
    // ディレクトリの読み込みに失敗した場合はサイズ0として無視
  }
  return size;
}

/**
 * ディレクトリ配下の構造をツリー形式で再帰的にコンソール出力する
 * @param {string} dirPath - 対象ディレクトリのパス
 * @param {string} prefix - インデント描画用の接頭辞
 */
export function renderTree(dirPath, prefix = '') {
  let files = [];
  try {
    files = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (e) {
    console.log(`${prefix}├── [アクセス拒否または読み取りエラー]`);
    return;
  }

  // ディレクトリが先、ファイルが後になるよう名前順でソート
  files.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const filePath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      const dirSize = getDirSize(filePath);
      const sizeStr = formatSize(dirSize);
      console.log(`${prefix}${marker}${file.name}/ [${sizeStr}]`);
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      renderTree(filePath, newPrefix);
    } else if (file.isFile()) {
      let fileSize = 0;
      try {
        fileSize = fs.statSync(filePath).size;
      } catch (e) {
        // エラー時は0バイト扱い
      }
      const sizeStr = formatSize(fileSize);
      console.log(`${prefix}${marker}${file.name} [${sizeStr}]`);
    }
  });
}

/**
 * メインエントリーポイント。引数をパースして処理を振り分ける
 */
export function main() {
  const rawArgs = process.argv.slice(2);
  let isTree = false;
  const paths = [];

  for (const arg of rawArgs) {
    if (arg === '-tree' || arg === '--tree') {
      isTree = true;
    } else {
      paths.push(arg);
    }
  }

  // 対象パスが指定されていなければカレントディレクトリをデフォルトにする
  if (paths.length === 0) {
    paths.push('.');
  }

  for (const targetPath of paths) {
    const resolvedPath = path.resolve(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`エラー: パスが見つかりません: ${targetPath}`);
      continue;
    }

    try {
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        if (isTree) {
          console.log(`\n${targetPath} のツリー構造 (サイズ表示):`);
          const totalSize = getDirSize(resolvedPath);
          console.log(`. [${formatSize(totalSize)}]`);
          renderTree(resolvedPath);
        } else {
          const totalSize = getDirSize(resolvedPath);
          console.log(`${targetPath}: [ディレクトリ] ${formatSize(totalSize)}`);
        }
      } else if (stats.isFile()) {
        console.log(`${targetPath}: [ファイル] ${formatSize(stats.size)}`);
      }
    } catch (error) {
      console.error(`エラー: ${targetPath} の処理中にエラーが発生しました: ${error.message}`);
    }
  }
}

// CLI実行時にメインロジックを開始
main();
