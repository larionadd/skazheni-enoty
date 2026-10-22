/**
 * Test suite for QuestDiff engine
 */
const assert = require('assert');
require('./diff.js');
require('./samples.js');
const QuestDiff = globalThis.QuestDiff;
const QUEST_SAMPLES = globalThis.QUEST_SAMPLES;

console.log('--- 1. Тестування токенізатора для українських слів ---');
const sampleUkrainian = "Добромир узяв м'яч, зв’язок розірвано, а будь-хто пішов геть!";
const tokens = QuestDiff.tokenize(sampleUkrainian);
console.log('Токени:', tokens);
assert(tokens.includes("м'яч"), "Токенізатор має зберігати апостроф ' у слові");
assert(tokens.includes("зв’язок"), "Токенізатор має зберігати типографічний апостроф ’ у слові");
assert(tokens.includes("будь-хто"), "Токенізатор має зберігати дефіс у складних словах");
console.log('✓ Токенізатор успішно розпізнає специфіку української мови.');

console.log('\n--- 2. Тестування короткого тексту: додавання слів ---');
const origInsert = "Лицар підійшов до воріт фортеці.";
const editInsert = "Лицар підійшов до воріт стародавньої кам'яної фортеці.";
const resultInsert = QuestDiff.diff(origInsert, editInsert);
console.log('Статистика чистого додавання:', resultInsert.stats);
assert.strictEqual(resultInsert.stats.wordsAdded, 2, 'Має бути додано 2 слова (стародавньої, кам\'яної)');
assert.strictEqual(resultInsert.stats.wordsDeleted, 0, 'Вилучень не мало бути');

console.log('\n--- 2b. Тестування додавання на початку з корекцією регістру ---');
const origShort = "Лицар підійшов до воріт фортеці.";
const editShort = "Хоробрий лицар підійшов до воріт стародавньої кам'яної фортеці.";
const resultShort = QuestDiff.diff(origShort, editShort);
console.log('Статистика (з урахуванням зміни Лицар -> Хоробрий лицар):', resultShort.stats);
assert(resultShort.stats.wordsAdded >= 3, 'Додано нові слова');

const inlineHtml = resultShort.renderInline();
console.log('Inline HTML фрагмент:', inlineHtml);
assert(inlineHtml.includes('diff-ins'), 'HTML має містити тег додавання');
assert(inlineHtml.includes('Хоробрий'), 'HTML має містити додане слово');
assert(inlineHtml.includes('кам&#39;яної') || inlineHtml.includes("кам'яної"), 'HTML має містити слово з апострофом');
console.log('✓ Додавання слів на короткому тексті працює коректно.');

console.log('\n--- 3. Тестування заміни окремого слова (без підсвітки всього речення/абзацу) ---');
const origSentence = "Корчмар підозріло глянув на незнайомця з-під густих брів.";
const editSentence = "Корчмар пильно глянув на незнайомця з-під густих брів.";

const resultReplace = QuestDiff.diff(origSentence, editSentence);
console.log('Статистика заміни:', resultReplace.stats);
assert(resultReplace.stats.wordsAdded === 1, 'Має бути додано 1 слово (пильно)');
assert(resultReplace.stats.wordsDeleted === 1, 'Має бути вилучено 1 слово (підозріло)');

// Перевіряємо, що інші слова позначені як рівні (equal), а не вилучені цілими блоками
const ops = resultReplace.ops;
const equalOps = ops.filter(o => o.type === 'equal');
const equalText = equalOps.map(o => o.value).join('');
assert(equalText.includes('Корчмар'), 'Слово Корчмар має залишитися незмінним');
console.log('✓ Заміна окремого слова підсвічує тільки це слово, залишаючи решту речення недоторканою!');

console.log('\n--- 3b. Тестування розрахунку відсотка схожості (Similarity %) ---');
assert.strictEqual(QuestDiff.diff("Один два три", "Один два три").stats.similarity, 100, 'Ідентичні тексти мають давати 100% схожості');
assert.strictEqual(QuestDiff.diff("", "").stats.similarity, 100, 'Порожні тексти мають давати 100%');
assert.strictEqual(QuestDiff.diff("Один два три", "").stats.similarity, 0, 'Порожня редакція має давати 0%');

// 1 слово замінено з 8 слів (7 рівних / 8 = 87.5% -> 88%)
console.log('Схожість при заміні 1 слова з 8:', resultReplace.stats.similarity + '%');
assert(resultReplace.stats.similarity >= 85 && resultReplace.stats.similarity <= 90, 'Схожість має бути близько 88%');
console.log('✓ Відсоток схожості розраховується математично точно.');

console.log('\n--- 4. Тестування великого сюжетного квесту з кількома абзацами ---');
const longSample = QUEST_SAMPLES.find(s => s.id === 'sample-long');
assert(longSample, 'Зразок sample-long має існувати');

const resultLong = QuestDiff.diff(longSample.original, longSample.edited);
console.log('Статистика великої сцени:');
console.log(`- Слів в оригіналі: ${resultLong.stats.originalWords}`);
console.log(`- Слів у редакції: ${resultLong.stats.editedWords}`);
console.log(`- Додано слів: +${resultLong.stats.wordsAdded}`);
console.log(`- Вилучено слів: -${resultLong.stats.wordsDeleted}`);
console.log(`- Осередків змін: ${resultLong.stats.changeClusters}`);

assert(resultLong.stats.wordsAdded > 0, 'У великому тексті мають бути додавання');
assert(resultLong.stats.wordsDeleted > 0, 'У великому тексті мають бути вилучення');

// Перевірка рендерингу side-by-side
const sideBySide = resultLong.renderSideBySide();
assert(sideBySide.leftHtml.includes('diff-del'), 'Ліва колонка має містити вилучення');
assert(sideBySide.rightHtml.includes('diff-ins'), 'Права колонка має містити додавання');
console.log('✓ Великий текст обробляється миттєво та формує обидва режими порівняння.');

console.log('\n========================================');
console.log('ВСІ ТЕСТИ ДИФЕРЕНЦІАТОРА ПРОЙДЕНО УСПІШНО!');
console.log('========================================');
