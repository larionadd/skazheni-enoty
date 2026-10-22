/**
 * Quest Text Diff Engine
 * Optimized for Ukrainian and multilingual texts.
 * Word and token-level diff with Myers algorithm and common-prefix/suffix optimization.
 */

(function (root, factory) {
  const instance = factory();
  if (typeof define === 'function' && define.amd) {
    define([], function() { return instance; });
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = instance;
  }
  if (root) {
    root.QuestDiff = instance;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  // Tokenizer regex: matches words (including Ukrainian letters, apostrophes ' ’ ʼ, hyphens),
  // newlines, runs of whitespace, or single punctuation symbols.
  const TOKEN_REGEX = /[a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9]+(?:['’ʼ-][a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9]+)*|\r?\n|[^\S\r\n]+|[^\s\wа-яА-ЯіїєґІЇЄҐ]/gu;

  function tokenize(text) {
    if (!text) return [];
    const tokens = [];
    let match;
    TOKEN_REGEX.lastIndex = 0;
    while ((match = TOKEN_REGEX.exec(text)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  }

  function isWord(token) {
    return /^[a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9]+(?:['’ʼ-][a-zA-Zа-яА-ЯіїєґІЇЄҐ0-9]+)*$/.test(token);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Myers Diff Algorithm on Arrays of Tokens
   * With prefix and suffix pruning for high performance.
   */
  function diffTokens(a, b) {
    const N = a.length;
    const M = b.length;

    // 1. Common prefix pruning
    let start = 0;
    while (start < N && start < M && a[start] === b[start]) {
      start++;
    }

    // 2. Common suffix pruning
    let endA = N - 1;
    let endB = M - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
      endA--;
      endB--;
    }

    const prefix = a.slice(0, start).map(token => ({ type: 'equal', value: token }));
    const suffix = a.slice(endA + 1, N).map(token => ({ type: 'equal', value: token }));

    const subA = a.slice(start, endA + 1);
    const subB = b.slice(start, endB + 1);

    const midOps = myersDiffCore(subA, subB);

    return combineOps(prefix.concat(midOps, suffix));
  }

  function myersDiffCore(a, b) {
    const N = a.length;
    const M = b.length;
    if (N === 0) {
      return b.map(token => ({ type: 'insert', value: token }));
    }
    if (M === 0) {
      return a.map(token => ({ type: 'delete', value: token }));
    }

    const MAX = N + M;
    const vOffset = MAX;
    const v = new Int32Array(2 * MAX + 1);
    const trace = [];

    v[vOffset + 1] = 0;

    for (let d = 0; d <= MAX; d++) {
      trace.push(new Int32Array(v));
      for (let k = -d; k <= d; k += 2) {
        let x;
        if (k === -d || (k !== d && v[vOffset + k - 1] < v[vOffset + k + 1])) {
          x = v[vOffset + k + 1];
        } else {
          x = v[vOffset + k - 1] + 1;
        }
        let y = x - k;

        while (x < N && y < M && a[x] === b[y]) {
          x++;
          y++;
        }

        v[vOffset + k] = x;

        if (x >= N && y >= M) {
          return backtrack(trace, a, b, d, k, vOffset);
        }
      }
    }

    // Fallback if limit reached
    return [
      ...a.map(val => ({ type: 'delete', value: val })),
      ...b.map(val => ({ type: 'insert', value: val }))
    ];
  }

  function backtrack(trace, a, b, d, k, vOffset) {
    const ops = [];
    let x = a.length;
    let y = b.length;

    for (let step = d; step > 0; step--) {
      const v = trace[step];
      let prevK;
      if (k === -step || (k !== step && v[vOffset + k - 1] < v[vOffset + k + 1])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }
      const prevX = v[vOffset + prevK];
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        ops.unshift({ type: 'equal', value: a[x - 1] });
        x--;
        y--;
      }

      if (step > 0) {
        if (x === prevX) {
          ops.unshift({ type: 'insert', value: b[prevY] });
          y = prevY;
        } else {
          ops.unshift({ type: 'delete', value: a[prevX] });
          x = prevX;
        }
      }
      k = prevK;
    }

    while (x > 0 && y > 0) {
      ops.unshift({ type: 'equal', value: a[x - 1] });
      x--;
      y--;
    }

    return ops;
  }

  /**
   * Group contiguous ops of the same type for cleaner rendering and performance
   */
  function combineOps(rawOps) {
    if (!rawOps.length) return [];
    const grouped = [];
    let current = { type: rawOps[0].type, value: rawOps[0].value };

    for (let i = 1; i < rawOps.length; i++) {
      const op = rawOps[i];
      if (op.type === current.type) {
        current.value += op.value;
      } else {
        grouped.push(current);
        current = { type: op.type, value: op.value };
      }
    }
    grouped.push(current);
    return grouped;
  }

  /**
   * Calculate statistics about edits: word counts, added words, deleted words, character metrics
   */
  function calculateStats(originalText, editedText, ops) {
    const origTokens = tokenize(originalText);
    const editTokens = tokenize(editedText);

    const origWords = origTokens.filter(isWord).length;
    const editWords = editTokens.filter(isWord).length;

    let wordsAdded = 0;
    let wordsDeleted = 0;
    let charsAdded = 0;
    let charsDeleted = 0;
    let changeClusters = 0;

    let wordsEqual = 0;
    let charsEqual = 0;

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const opTokens = tokenize(op.value);
      const wordCount = opTokens.filter(isWord).length;

      if (op.type === 'insert') {
        wordsAdded += wordCount;
        charsAdded += op.value.length;
        changeClusters++;
      } else if (op.type === 'delete') {
        wordsDeleted += wordCount;
        charsDeleted += op.value.length;
        changeClusters++;
      } else if (op.type === 'equal') {
        wordsEqual += wordCount;
        charsEqual += op.value.length;
      }
    }

    const isIdentical = originalText === editedText;

    // Розрахунок відсотка схожості (Similarity Percentage)
    let similarity = 100;
    if (isIdentical) {
      similarity = 100;
    } else if (!originalText.trim() && !editedText.trim()) {
      similarity = 100;
    } else if (!originalText.trim() || !editedText.trim()) {
      similarity = 0;
    } else {
      const maxWords = Math.max(origWords, editWords);
      if (maxWords > 0) {
        similarity = Math.round((wordsEqual / maxWords) * 100);
      } else {
        const maxChars = Math.max(originalText.length, editedText.length);
        similarity = maxChars > 0 ? Math.round((charsEqual / maxChars) * 100) : 100;
      }
      similarity = Math.max(0, Math.min(100, similarity));
    }

    return {
      originalWords: origWords,
      editedWords: editWords,
      wordsEqual,
      wordsAdded,
      wordsDeleted,
      charsEqual,
      charsAdded,
      charsDeleted,
      originalChars: originalText.length,
      editedChars: editedText.length,
      changeClusters,
      similarity,
      isIdentical
    };
  }

  /**
   * Formats text into HTML with newlines properly preserved
   */
  function formatTextChunk(text) {
    return escapeHtml(text).replace(/\n/g, '<br>\n');
  }

  /**
   * Renders Inline Diff (Об'єднаний вигляд) with accessible indicators:
   * Uses <ins> and <del> tags with semantic attributes, visual markers, and ARIA labels.
   */
  function renderInlineDiff(ops) {
    if (!ops || !ops.length) {
      return '<div class="diff-empty-state">Немає тексту для порівняння</div>';
    }

    let html = '<div class="diff-inline-content" role="region" aria-label="Результат порівняння тексту">';

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const safeVal = formatTextChunk(op.value);

      if (op.type === 'equal') {
        html += `<span class="diff-equal">${safeVal}</span>`;
      } else if (op.type === 'insert') {
        html += `<ins class="diff-chunk diff-ins" aria-label="Додано: ${escapeHtml(op.value)}"><span class="diff-badge diff-badge-ins" aria-hidden="true">[+]</span>${safeVal}</ins>`;
      } else if (op.type === 'delete') {
        html += `<del class="diff-chunk diff-del" aria-label="Вилучено: ${escapeHtml(op.value)}"><span class="diff-badge diff-badge-del" aria-hidden="true">[-]</span>${safeVal}</del>`;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Renders Side-by-Side Diff (Паралельне порівняння)
   */
  function renderSideBySideDiff(ops) {
    if (!ops || !ops.length) {
      return '<div class="diff-empty-state">Немає тексту для порівняння</div>';
    }

    let leftHtml = '';
    let rightHtml = '';

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const safeVal = formatTextChunk(op.value);

      if (op.type === 'equal') {
        leftHtml += `<span class="diff-equal">${safeVal}</span>`;
        rightHtml += `<span class="diff-equal">${safeVal}</span>`;
      } else if (op.type === 'delete') {
        leftHtml += `<del class="diff-chunk diff-del" aria-label="Вилучено"><span class="diff-badge diff-badge-del" aria-hidden="true">[-]</span>${safeVal}</del>`;
      } else if (op.type === 'insert') {
        rightHtml += `<ins class="diff-chunk diff-ins" aria-label="Додано"><span class="diff-badge diff-badge-ins" aria-hidden="true">[+]</span>${safeVal}</ins>`;
      }
    }

    return {
      leftHtml: `<div class="diff-column-content" role="region" aria-label="Оригінальний текст із вилученнями">${leftHtml}</div>`,
      rightHtml: `<div class="diff-column-content" role="region" aria-label="Редакція із додаваннями">${rightHtml}</div>`
    };
  }

  return {
    tokenize,
    diff: function (orig, edit) {
      const tokensA = tokenize(orig || '');
      const tokensB = tokenize(edit || '');
      const ops = diffTokens(tokensA, tokensB);
      const stats = calculateStats(orig || '', edit || '', ops);
      return {
        ops,
        stats,
        renderInline: () => renderInlineDiff(ops),
        renderSideBySide: () => renderSideBySideDiff(ops)
      };
    },
    escapeHtml
  };
});
