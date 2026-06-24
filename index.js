#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// カラーコードの定義
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  depths: [
    '\x1b[36m', // Cyan (深さ0)
    '\x1b[32m', // Green (深さ1)
    '\x1b[33m', // Yellow (深さ2)
    '\x1b[35m', // Magenta (深さ3)
    '\x1b[34m', // Blue (深さ4)
  ],
  file: '\x1b[37m', // White
  size: '\x1b[90m', // Gray
  error: '\x1b[31m', // Red
};

/**
 * ワイルドカードパターン（例: *.py）を正規表現オブジェクトに変換する
 * @param {string} pattern - ワイルドカードパターン
 * @returns {RegExp} 変換後の正規表現
 */
function wildcardToRegex(pattern) {
  // 特別な正規表現文字をエスケープし、* を .* に、? を . に変換する
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * バイト数を人間が読みやすい単位（B, KB, MB, GB, TB）に変換する
 * @param {number} bytes - バイト数
 * @param {boolean} useColor - カラー表示を使用するかどうか
 * @returns {string} フォーマットされたサイズ表記
 */
export function formatSize(bytes, useColor = false) {
  if (bytes === 0) {
    return useColor ? `${COLORS.dim}0 B${COLORS.reset}` : '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  if (useColor) {
    return `${COLORS.bold}${formatted} ${sizes[i]}${COLORS.reset} ${COLORS.dim}(${bytes.toLocaleString()} bytes)${COLORS.reset}`;
  }
  return `${formatted} ${sizes[i]} (${bytes.toLocaleString()} bytes)`;
}

/**
 * 指定されたディレクトリ配下のサイズを1回の走査で集計し、各パスの合計バイト数を記録したMapを返す
 * @param {string} dirPath - 対象ディレクトリのパス
 * @param {object} options - パースオプション（ignoreList, matchPattern）
 * @param {Map<string, number>} sizeMap - 再帰用サイズ情報マップ
 * @returns {Map<string, number>} 構築されたサイズマップ
 */
export function buildSizeMap(dirPath, options = {}, sizeMap = new Map()) {
  const { ignoreList = [], matchPattern = null } = options;
  let totalSize = 0;
  let hasMatch = false;
  const resolvedPath = path.resolve(dirPath);
  const baseName = path.basename(resolvedPath);

  // 指定されたディレクトリ自体が無視対象であれば空のマップを返す
  if (ignoreList.includes(baseName)) {
    return sizeMap;
  }

  const matchRegex = matchPattern ? wildcardToRegex(matchPattern) : null;

  try {
    const files = fs.readdirSync(resolvedPath, { withFileTypes: true });
    for (const file of files) {
      if (ignoreList.includes(file.name)) {
        continue;
      }
      const filePath = path.join(resolvedPath, file.name);

      if (file.isDirectory()) {
        buildSizeMap(filePath, options, sizeMap);
        // サブディレクトリ配下にマッチするファイルが存在した場合のみサイズを加算
        if (sizeMap.has(filePath)) {
          totalSize += sizeMap.get(filePath) || 0;
          hasMatch = true;
        }
      } else if (file.isFile()) {
        // パターンが指定されている場合はマッチングを行い、指定がない場合は全てマッチ扱いとする
        const isMatched = matchRegex ? matchRegex.test(file.name) : true;
        if (isMatched) {
          try {
            const stats = fs.statSync(filePath);
            sizeMap.set(filePath, stats.size);
            totalSize += stats.size;
            hasMatch = true;
          } catch (e) {
            sizeMap.set(filePath, 0);
            hasMatch = true;
          }
        }
      }
    }
  } catch (e) {
    // ディレクトリが読み込めない場合は totalSize = 0 のまま
  }

  // 配下にマッチするものがある、またはパターン指定がない場合のみマップに登録
  if (hasMatch || !matchPattern) {
    sizeMap.set(resolvedPath, totalSize);
  }
  return sizeMap;
}

/**
 * ディレクトリ配下の構造をキャッシュされたサイズ情報を用いてツリー表示する
 * @param {string} dirPath - 対象ディレクトリのパス
 * @param {Map<string, number>} sizeMap - 構築済みのサイズマップ
 * @param {object} options - ツリー描画用オプション
 */
export function renderTree(dirPath, sizeMap, options = {}) {
  const {
    prefix = '',
    currentDepth = 0,
    maxDepth = Infinity,
    ignoreList = [],
    isSort = false,
    useColor = false,
    showFiles = false
  } = options;

  // 指定の深さに達した場合は処理を終了
  if (currentDepth >= maxDepth) {
    return;
  }

  const resolvedPath = path.resolve(dirPath);
  let files = [];
  try {
    files = fs.readdirSync(resolvedPath, { withFileTypes: true });
  } catch (e) {
    const errorMsg = useColor ? `${COLORS.error}[アクセス拒否または読み取りエラー]${COLORS.reset}` : '[アクセス拒否または読み取りエラー]';
    console.log(`${prefix}├── ${errorMsg}`);
    return;
  }

  // 無視するファイル・フォルダを除外
  let displayFiles = files.filter(file => !ignoreList.includes(file.name));

  // パターンマッチで有効なパス（sizeMapに含まれているパス）のみにフィルタ
  displayFiles = displayFiles.filter(file => {
    const filePath = path.join(resolvedPath, file.name);
    return sizeMap.has(filePath);
  });

  // ファイル表示フラグが false の場合は、フォルダのみに制限
  if (!showFiles) {
    displayFiles = displayFiles.filter(file => file.isDirectory());
  }

  // ソート処理
  displayFiles.sort((a, b) => {
    const pathA = path.join(resolvedPath, a.name);
    const pathB = path.join(resolvedPath, b.name);

    if (isSort) {
      // 合計サイズが大きい順（降順）にソート
      const sizeA = sizeMap.get(pathA) || 0;
      const sizeB = sizeMap.get(pathB) || 0;
      return sizeB - sizeA;
    } else {
      // デフォルト: ディレクトリが先、ファイルが後。それぞれ名前順。
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    }
  });

  displayFiles.forEach((file, index) => {
    const isLast = index === displayFiles.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const filePath = path.join(resolvedPath, file.name);

    if (file.isDirectory()) {
      const dirSize = sizeMap.get(filePath) || 0;
      const sizeStr = formatSize(dirSize, useColor);
      
      let dirNameDisp = `${file.name}/`;
      if (useColor) {
        const color = COLORS.depths[currentDepth % COLORS.depths.length];
        dirNameDisp = `${color}${file.name}/${COLORS.reset}`;
      }

      console.log(`${prefix}${marker}${dirNameDisp} [${sizeStr}]`);

      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      renderTree(filePath, sizeMap, {
        prefix: newPrefix,
        currentDepth: currentDepth + 1,
        maxDepth,
        ignoreList,
        isSort,
        useColor,
        showFiles
      });
    } else if (file.isFile()) {
      const fileSize = sizeMap.get(filePath) || 0;
      const sizeStr = formatSize(fileSize, useColor);
      
      let fileNameDisp = file.name;
      if (useColor) {
        fileNameDisp = `${COLORS.file}${file.name}${COLORS.reset}`;
      }

      console.log(`${prefix}${marker}${fileNameDisp} [${sizeStr}]`);
    }
  });
}

/**
 * メインエントリーポイント。引数をパースして処理を振り分ける
 */
export function main() {
  const rawArgs = process.argv.slice(2);
  let isTree = false;
  let isSort = false;
  let showFiles = false;
  let maxDepth = Infinity;
  let matchPattern = null;
  const ignoreList = [];
  const paths = [];

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === '-tree' || arg === '--tree') {
      isTree = true;
    } else if (arg === '-sort' || arg === '--sort') {
      isSort = true;
    } else if (arg === '-f' || arg === '--files' || arg === '/f') {
      showFiles = true;
    } else if (arg === '-depth' || arg === '--depth') {
      const nextArg = rawArgs[i + 1];
      const parsedDepth = parseInt(nextArg, 10);
      if (!isNaN(parsedDepth)) {
        maxDepth = parsedDepth;
        i++;
      } else {
        console.error(`警告: -depth には数値を指定してください。デフォルトの無制限で動作します。`);
      }
    } else if (arg === '-match' || arg === '--match') {
      const nextArg = rawArgs[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        matchPattern = nextArg;
        i++;
      } else {
        console.error(`警告: -match には検索するワイルドカードパターンを指定してください。`);
      }
    } else if (arg === '-ignore' || arg === '--ignore') {
      while (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
        ignoreList.push(rawArgs[i + 1]);
        i++;
      }
    } else {
      paths.push(arg);
    }
  }

  // TTY出力かつ --no-color がない場合にカラー表示を有効化
  let useColor = process.stdout.isTTY;
  if (rawArgs.includes('--no-color')) {
    useColor = false;
  }

  // パスが指定されていなければカレントディレクトリをデフォルトにする
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
        const baseName = path.basename(resolvedPath);
        if (ignoreList.includes(baseName)) {
          console.log(`情報: ${targetPath} は無視リストに含まれているためスキップします。`);
          continue;
        }

        // サイズ情報をキャッシュ（パターンマッチ情報も渡す）
        const sizeMap = buildSizeMap(resolvedPath, { ignoreList, matchPattern });
        
        // パターンマッチが指定されていて、かつマッチするものが存在しない場合は登録がない
        if (matchPattern && !sizeMap.has(resolvedPath)) {
          console.log(`情報: ${targetPath} 配下にパターン "${matchPattern}" にマッチするファイルはありません。`);
          continue;
        }

        const totalSize = sizeMap.get(resolvedPath) || 0;

        if (isTree) {
          console.log(`\n${targetPath} のツリー構造 (サイズ表示):`);
          console.log(`. [${formatSize(totalSize, useColor)}]`);
          renderTree(resolvedPath, sizeMap, {
            maxDepth,
            ignoreList,
            isSort,
            useColor,
            showFiles
          });
        } else {
          const typeStr = useColor ? `${COLORS.depths[0]}[ディレクトリ]${COLORS.reset}` : '[ディレクトリ]';
          console.log(`${targetPath}: ${typeStr} ${formatSize(totalSize, useColor)}`);
        }
      } else if (stats.isFile()) {
        const baseName = path.basename(resolvedPath);
        if (ignoreList.includes(baseName)) {
          console.log(`情報: ${targetPath} は無視リストに含まれているためスキップします。`);
          continue;
        }

        // ファイル個別のマッチ判定
        if (matchPattern) {
          const matchRegex = wildcardToRegex(matchPattern);
          if (!matchRegex.test(baseName)) {
            console.log(`情報: ${targetPath} はパターン "${matchPattern}" にマッチしないためスキップします。`);
            continue;
          }
        }

        const typeStr = useColor ? `${COLORS.file}[ファイル]${COLORS.reset}` : '[ファイル]';
        console.log(`${targetPath}: ${typeStr} ${formatSize(stats.size, useColor)}`);
      }
    } catch (error) {
      console.error(`エラー: ${targetPath} の処理中にエラーが発生しました: ${error.message}`);
    }
  }
}

// CLI実行時にメインロジックを開始
main();
