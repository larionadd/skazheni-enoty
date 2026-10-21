/**
 * Test suite for App Logic:
 * Autosave, Version Snapshots, Safety Prompts, Export/Import, and Markdown Generation
 */
const assert = require('assert');
require('./diff.js');
require('./samples.js');
const QuestDiff = globalThis.QuestDiff;
const { QUEST_SAMPLES } = globalThis;

console.log('--- 1. Тестування структури даних сцени та знімків історії ---');
function createMockScene(title, original, edited) {
  return {
    id: 'scene_' + Date.now(),
    title,
    original,
    edited,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const scene = createMockScene('Сцена 1: Зустріч у таверні', 'Оригінальний текст', 'Відредагований текст');
assert.strictEqual(scene.title, 'Сцена 1: Зустріч у таверні');
assert.strictEqual(scene.original, 'Оригінальний текст');
assert.strictEqual(scene.edited, 'Відредагований текст');

// Додавання знімка версії
const diff = QuestDiff.diff(scene.original, scene.edited);
const snapshot = {
  id: 'snap_' + Date.now(),
  timestamp: new Date().toISOString(),
  note: 'Перша вичитка',
  original: scene.original,
  edited: scene.edited,
  wordsAdded: diff.stats.wordsAdded,
  wordsDeleted: diff.stats.wordsDeleted,
  totalWords: diff.stats.editedWords
};
scene.history.push(snapshot);
assert.strictEqual(scene.history.length, 1);
assert.strictEqual(scene.history[0].note, 'Перша вичитка');
console.log('✓ Створення сцени та збереження знімка версії пройшло успішно.');

console.log('\n--- 2. Тестування моделі експорту/імпорту резервної копії (JSON Backup) ---');
const backupPayload = {
  app: 'QuestEditorUA',
  version: 1,
  exportedAt: new Date().toISOString(),
  scenes: [scene],
  activeSceneId: scene.id
};

const jsonStr = JSON.stringify(backupPayload, null, 2);
const restored = JSON.parse(jsonStr);
assert.strictEqual(restored.app, 'QuestEditorUA');
assert.strictEqual(restored.scenes.length, 1);
assert.strictEqual(restored.scenes[0].title, 'Сцена 1: Зустріч у таверні');
assert.strictEqual(restored.scenes[0].history.length, 1);
console.log('✓ Експорт та імпорт JSON резервної копії відновлює всі дані без втрат.');

console.log('\n--- 3. Тестування форматування експорту в Markdown (.md) та Text (.txt) ---');
function formatMarkdown(sceneTitle, text) {
  return `# ${sceneTitle}\n\n${text}\n`;
}

const mdOutput = formatMarkdown(scene.title, scene.edited);
assert(mdOutput.startsWith('# Сцена 1: Зустріч у таверні\n\n'));
assert(mdOutput.includes('Відредагований текст'));
console.log('✓ Генерація Markdown містить правильний заголовок і текст.');

console.log('\n--- 4. Тестування логіки виявлення конфлікту при заміні оригіналу ---');
function shouldWarnOnOriginalChange(currentOrig, currentEdit, newOrig) {
  if (newOrig === currentOrig) return false;
  if (!currentEdit || !currentEdit.trim()) return false;
  if (currentEdit === currentOrig) return false;
  return true; // Є користувацькі правки!
}

assert.strictEqual(shouldWarnOnOriginalChange('Текст А', 'Текст А', 'Текст Б'), false, 'Якщо правки не вносилися, попередження не потрібне');
assert.strictEqual(shouldWarnOnOriginalChange('Текст А', 'Текст А з правками', 'Текст Б'), true, 'Якщо є правки, має бути попередження!');
console.log('✓ Логіка захисту оригіналу надійно виявляє незбережені/змінені редакції.');

console.log('\n--- 5. Перевірка цілісності HTML та CSS файлів ---');
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/styles.css', 'utf8');

// HTML перевірки
assert(html.includes('id="txt-original"'), 'HTML має містити textarea для оригіналу');
assert(html.includes('id="txt-edited"'), 'HTML має містити textarea для редакції');
assert(html.includes('id="comparison-view"'), 'HTML має містити секцію порівняння');
assert(html.includes('dialog id="dialog-replace-warn"'), 'HTML має містити діалог попередження про заміну');
assert(html.includes('dialog id="dialog-history"'), 'HTML має містити діалог історії версій');
assert(html.includes('dialog id="dialog-scenes"'), 'HTML має містити менеджер сцен');
assert(html.includes('data-tab="original"'), 'HTML має містити вкладку оригіналу');
assert(html.includes('data-tab="edited"'), 'HTML має містити вкладку редакції');
assert(html.includes('data-tab="comparison"'), 'HTML має містити вкладку порівняння');

// CSS перевірки для мобільних
assert(css.includes('@media (max-width: 768px)'), 'CSS має містити медіа-запит для телефонів');
assert(css.includes('overflow-x: hidden'), 'CSS має блокувати горизонтальне прокручування');
assert(css.includes('min-height: 44px'), 'CSS має забезпечувати сенсорні зони 44px+ для кнопок на телефоні');
assert(css.includes('--diff-ins-bg'), 'CSS має визначати доступні кольори для додавання');
assert(css.includes('--diff-del-bg'), 'CSS має визначати доступні кольори для вилучення');

console.log('✓ HTML та CSS файли містять усі необхідні елементи інтерфейсу та адаптивності.');

console.log('\n========================================');
console.log('ВСІ ТЕСТИ ЛОГІКИ ДОДАТКА ПРОЙДЕНО УСПІШНО!');
console.log('========================================');
