/**
 * Квестопис — Редактор сюжетних квестів
 * Головний контролер застосунку
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. Архітектура сховища та синхронізації (Storage & Sync Architecture)
  // -------------------------------------------------------------------------

  /**
   * Інтерфейс локального адаптера сховища (LocalStorage)
   */
  const LocalStorageAdapter = {
    STORAGE_KEY: 'quest_editor_data_v1',
    SETTINGS_KEY: 'quest_editor_settings_v1',

    loadData() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        console.error('Помилка завантаження з LocalStorage:', err);
        return null;
      }
    },

    saveData(data) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('Помилка збереження у LocalStorage:', err);
        return false;
      }
    },

    loadSettings() {
      try {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    },

    saveSettings(settings) {
      try {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {}
    }
  };

  /**
   * Модульний адаптер синхронізації (Sync Adapter Interface)
   * Підготовлений для підключення WebRTC, E2EE або приватного сервера.
   */
  const SyncService = {
    currentProvider: 'offline-local',

    getStatus() {
      return {
        online: navigator.onLine,
        provider: this.currentProvider,
        message: 'Локальний автономний режим. Чернетки не синхронізуються між пристроями.'
      };
    },

    // Хук для майбутнього розширення (WebRTC, CouchDB, WebDAV тощо)
    registerRemoteProvider(provider) {
      console.log('Підключено зовнішній провайдер синхронізації:', provider.name);
      this.currentProvider = provider.name;
    }
  };

  // Робимо доступним глобально для розширення
  window.QuestSyncAdapter = SyncService;

  // -------------------------------------------------------------------------
  // 2. Стан додатку (Application State)
  // -------------------------------------------------------------------------

  const state = {
    scenes: [],
    activeSceneId: null,
    activeTab: 'edited', // 'original' | 'edited' | 'comparison' (на телефоні)
    comparisonMode: 'inline', // 'inline' | 'side-by-side'
    desktopSplit: 50, // % ширини лівого поля
    undoStack: [],
    redoStack: [],
    isTypingUndoLocked: false,
    theme: 'dark',
    bannerDismissed: false
  };

  // Кешовані DOM елементи
  const dom = {};

  // -------------------------------------------------------------------------
  // 3. Ініціалізація та завантаження за замовчуванням
  // -------------------------------------------------------------------------

  function initApp() {
    cacheDom();
    bindEvents();
    loadPersistedData();
    applyTheme(state.theme);
    applySplit(state.desktopSplit);
    renderSceneDropdown();
    renderActiveScene();
    updateDiffAndStats();
    handleResize();
  }

  function cacheDom() {
    dom.syncBanner = document.getElementById('sync-banner');
    dom.dismissBannerBtn = document.getElementById('btn-dismiss-banner');
    dom.sceneSelect = document.getElementById('scene-select');
    dom.btnNewScene = document.getElementById('btn-new-scene');
    dom.btnManageScenes = document.getElementById('btn-manage-scenes');
    dom.btnHistory = document.getElementById('btn-history');
    dom.btnBackup = document.getElementById('btn-backup');
    dom.btnHelp = document.getElementById('btn-help');
    dom.btnSamples = document.getElementById('btn-samples');
    dom.btnTheme = document.getElementById('btn-theme');

    dom.tabBtns = document.querySelectorAll('.tab-btn');
    dom.tabOriginalCount = document.getElementById('tab-orig-count');
    dom.tabEditedCount = document.getElementById('tab-edit-count');
    dom.tabDiffBadge = document.getElementById('tab-diff-count');

    dom.paneOriginal = document.getElementById('pane-original');
    dom.paneEdited = document.getElementById('pane-edited');
    dom.paneSplitter = document.getElementById('pane-splitter');
    dom.comparisonView = document.getElementById('comparison-view');
    dom.editorPanesWrapper = document.getElementById('editor-panes-wrapper');

    dom.txtOriginal = document.getElementById('txt-original');
    dom.txtEdited = document.getElementById('txt-edited');
    dom.backdropOriginal = document.getElementById('backdrop-original');
    dom.backdropEdited = document.getElementById('backdrop-edited');

    dom.origStats = document.getElementById('orig-stats');
    dom.editStats = document.getElementById('edit-stats');
    dom.diffStatsHeader = document.getElementById('diff-stats-header');

    dom.btnPasteOrig = document.getElementById('btn-paste-orig');
    dom.btnClearOrig = document.getElementById('btn-clear-orig');
    dom.btnSyncOrigToEdit = document.getElementById('btn-sync-orig-to-edit');

    dom.btnUndo = document.getElementById('btn-undo');
    dom.btnRedo = document.getElementById('btn-redo');
    dom.btnCopyEdit = document.getElementById('btn-copy-edit');
    dom.btnDownloadTxt = document.getElementById('btn-download-txt');
    dom.btnDownloadMd = document.getElementById('btn-download-md');

    dom.btnSplit50 = document.getElementById('split-50');
    dom.btnSplit40 = document.getElementById('split-40');
    dom.btnSplit60 = document.getElementById('split-60');

    dom.btnCompareInline = document.getElementById('btn-compare-inline');
    dom.btnCompareSide = document.getElementById('btn-compare-side');
    dom.comparisonContent = document.getElementById('comparison-content');
    dom.compSimValue = document.getElementById('comp-sim-value');
    dom.compSimProgress = document.getElementById('comp-sim-progress');

    dom.saveIndicator = document.getElementById('save-indicator');
    dom.statusText = document.getElementById('status-text');
    dom.toastContainer = document.getElementById('toast-container');

    // Модальні вікна
    dom.dialogReplaceWarn = document.getElementById('dialog-replace-warn');
    dom.dialogScenes = document.getElementById('dialog-scenes');
    dom.dialogHistory = document.getElementById('dialog-history');
    dom.dialogBackup = document.getElementById('dialog-backup');
    dom.dialogHelp = document.getElementById('dialog-help');
    dom.dialogSamples = document.getElementById('dialog-samples');
  }

  function loadPersistedData() {
    const saved = LocalStorageAdapter.loadData();
    const settings = LocalStorageAdapter.loadSettings();

    if (settings.theme) state.theme = settings.theme;
    if (settings.desktopSplit) state.desktopSplit = settings.desktopSplit;
    if (settings.bannerDismissed) state.bannerDismissed = true;

    if (state.bannerDismissed && dom.syncBanner) {
      dom.syncBanner.style.display = 'none';
    }

    if (saved && saved.scenes && saved.scenes.length > 0) {
      state.scenes = saved.scenes;
      state.activeSceneId = saved.activeSceneId || saved.scenes[0].id;
    } else {
      // Створюємо стартову початкову сцену
      const initialScene = createDefaultScene('Сцена 1: Початок квесту');
      state.scenes = [initialScene];
      state.activeSceneId = initialScene.id;
      persistState();
    }
  }

  function createDefaultScene(title = 'Нова сцена') {
    return {
      id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: title,
      original: '',
      edited: '',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function getActiveScene() {
    return state.scenes.find(s => s.id === state.activeSceneId) || state.scenes[0];
  }

  function persistState(isAutosave = true) {
    if (isAutosave) {
      setSaveStatus('Збереження...', true);
    }
    const scene = getActiveScene();
    if (scene) {
      scene.updatedAt = new Date().toISOString();
    }

    const payload = {
      scenes: state.scenes,
      activeSceneId: state.activeSceneId,
      version: 1
    };

    const success = LocalStorageAdapter.saveData(payload);
    if (success) {
      setTimeout(() => {
        setSaveStatus('Усі зміни збережено локально', false);
      }, 350);
    } else {
      setSaveStatus('Помилка локального збереження!', false);
    }
  }

  function setSaveStatus(text, isSaving) {
    if (dom.statusText) dom.statusText.textContent = text;
    if (dom.saveIndicator) {
      if (isSaving) {
        dom.saveIndicator.classList.add('saving');
      } else {
        dom.saveIndicator.classList.remove('saving');
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. Логіка редагування та захисту оригіналу
  // -------------------------------------------------------------------------

  function renderActiveScene() {
    const scene = getActiveScene();
    if (!scene) return;

    dom.txtOriginal.value = scene.original || '';
    dom.txtEdited.value = scene.edited || '';

    // Оновлення Undo/Redo стеків для цієї сцени
    state.undoStack = [scene.edited || ''];
    state.redoStack = [];
    updateUndoRedoButtons();

    if (dom.sceneSelect) {
      dom.sceneSelect.value = scene.id;
    }
  }

  /**
   * Обробка зміни поля «Оригінал»
   */
  let pendingOriginalReplacement = null;

  function handleOriginalInputChange(newOriginalText, force = false) {
    const scene = getActiveScene();
    if (!scene) return;

    const currentOriginal = scene.original || '';
    const currentEdited = scene.edited || '';

    // Якщо новий оригінал такий самий як старий, нічого не робимо
    if (newOriginalText === currentOriginal) return;

    // Якщо поле «Моя редакція» пусте або точно співпадає зі старим оригіналом,
    // просто автоматично оновлюємо редакцію новою копією
    if (!currentEdited.trim() || currentEdited === currentOriginal || force) {
      scene.original = newOriginalText;
      scene.edited = newOriginalText;
      dom.txtEdited.value = newOriginalText;
      recordUndoState(newOriginalText);
      updateDiffAndStats();
      persistState();
      return;
    }

    // Якщо в редакції вже є модифікований текст, показуємо попередження!
    pendingOriginalReplacement = newOriginalText;
    showReplaceWarningModal(currentOriginal, currentEdited, newOriginalText);
  }

  function showReplaceWarningModal(oldOrig, currentEdit, newOrig) {
    const dialog = dom.dialogReplaceWarn;
    if (!dialog) return;

    const diffCurrent = QuestDiff.diff(oldOrig, currentEdit);
    const changesCount = diffCurrent.stats.wordsAdded + diffCurrent.stats.wordsDeleted;

    document.getElementById('warn-edit-status').innerHTML = `
      У вашій поточній редакції є <strong>${changesCount} змінених слів</strong>. 
      Якщо замінити оригінал без створення копії, поточні правки можуть втратити зв'язок з первинним текстом.
    `;

    dialog.showModal();
  }

  // -------------------------------------------------------------------------
  // 5. Розрахунок різниці та оновлення статистики (Diff & Stats)
  // -------------------------------------------------------------------------

  let diffDebounceTimer = null;

  function updateDiffAndStats() {
    const scene = getActiveScene();
    if (!scene) return;

    const origText = dom.txtOriginal.value;
    const editText = dom.txtEdited.value;

    const diffResult = QuestDiff.diff(origText, editText);
    const stats = diffResult.stats;

    // Оновлення статистики на вкладках та в заголовках
    if (dom.tabOriginalCount) dom.tabOriginalCount.textContent = `${stats.originalWords} слів`;
    if (dom.tabEditedCount) dom.tabEditedCount.textContent = `${stats.editedWords} слів`;

    if (dom.origStats) {
      dom.origStats.textContent = `${stats.originalWords} слів, ${stats.originalChars} симв.`;
    }
    if (dom.editStats) {
      dom.editStats.textContent = `${stats.editedWords} слів, ${stats.editedChars} симв.`;
    }

    // Підсумок різниці та процент схожості
    const simPercent = stats.similarity !== undefined ? stats.similarity : 100;
    let simClass = 'sim-high';
    let simColor = '#3fb950';
    if (simPercent < 60) {
      simClass = 'sim-low';
      simColor = '#f85149';
    } else if (simPercent < 85) {
      simClass = 'sim-mid';
      simColor = '#f1c40f';
    }

    if (dom.diffStatsHeader) {
      if (stats.isIdentical) {
        dom.diffStatsHeader.innerHTML = `
          <span class="stat-sim-badge sim-high" title="Процент схожості між оригіналом та редакцією">Схожість: 100%</span>
          <span class="stat-identical">✓ Тексти ідентичні (без правок)</span>
        `;
        if (dom.tabDiffBadge) {
          dom.tabDiffBadge.textContent = '100%';
          dom.tabDiffBadge.classList.remove('diff-badge-count');
        }
      } else {
        dom.diffStatsHeader.innerHTML = `
          <span class="stat-sim-badge ${simClass}" title="Процент схожості між оригіналом та редакцією">Схожість: ${simPercent}%</span>
          <span class="stat-add" title="Додано слів">+${stats.wordsAdded}</span>
          <span class="stat-del" title="Вилучено слів">-${stats.wordsDeleted}</span>
          <span style="color: var(--text-muted);">(${stats.changeClusters} місць змін)</span>
        `;
        if (dom.tabDiffBadge) {
          dom.tabDiffBadge.textContent = `${simPercent}% · +${stats.wordsAdded}/-${stats.wordsDeleted}`;
          dom.tabDiffBadge.classList.add('diff-badge-count');
        }
      }
    }

    // Оновлення окремого індикатора у панелі порівняння
    if (dom.compSimValue) {
      dom.compSimValue.textContent = `${simPercent}%`;
    }
    if (dom.compSimProgress) {
      dom.compSimProgress.style.width = `${simPercent}%`;
      dom.compSimProgress.style.backgroundColor = simColor;
    }

    // Оновлення живої підсвітки доданих та змінених фрагментів прямо під час друку (Live Backdrop)
    if (dom.backdropEdited && typeof diffResult.renderLiveEdited === 'function') {
      const liveHtmlEdited = diffResult.renderLiveEdited();
      dom.backdropEdited.innerHTML = liveHtmlEdited + (editText.endsWith('\n') ? ' ' : '');
      syncBackdropScroll(dom.txtEdited, dom.backdropEdited);
    }
    if (dom.backdropOriginal && typeof diffResult.renderLiveOriginal === 'function') {
      const liveHtmlOriginal = diffResult.renderLiveOriginal();
      dom.backdropOriginal.innerHTML = liveHtmlOriginal + (origText.endsWith('\n') ? ' ' : '');
      syncBackdropScroll(dom.txtOriginal, dom.backdropOriginal);
    }

    // Відображення режиму порівняння
    renderComparisonView(diffResult);
  }

  function syncBackdropScroll(textarea, backdrop) {
    if (!textarea || !backdrop) return;
    backdrop.scrollTop = textarea.scrollTop;
    backdrop.scrollLeft = textarea.scrollLeft;
  }

  function renderComparisonView(diffResult) {
    if (!dom.comparisonContent) return;

    if (state.comparisonMode === 'side-by-side') {
      const side = diffResult.renderSideBySide();
      dom.comparisonContent.innerHTML = `
        <div class="diff-side-by-side-container">
          <div class="diff-col" id="diff-col-left">
            <div class="diff-col-header">Оригінал (із позначенням вилученого)</div>
            ${side.leftHtml}
          </div>
          <div class="diff-col" id="diff-col-right">
            <div class="diff-col-header">Моя редакція (із позначенням доданого)</div>
            ${side.rightHtml}
          </div>
        </div>
      `;
    } else {
      // Об'єднаний (Inline diff)
      dom.comparisonContent.innerHTML = diffResult.renderInline();
    }
  }

  // -------------------------------------------------------------------------
  // 6. Скасування дій (Undo/Redo) та автозбереження
  // -------------------------------------------------------------------------

  function recordUndoState(text) {
    if (state.isTypingUndoLocked) return;

    // Не дублюємо той самий стан
    if (state.undoStack.length > 0 && state.undoStack[state.undoStack.length - 1] === text) {
      return;
    }

    state.undoStack.push(text);
    if (state.undoStack.length > 60) {
      state.undoStack.shift();
    }
    state.redoStack = [];
    updateUndoRedoButtons();
  }

  function undo() {
    if (state.undoStack.length <= 1) return;
    const current = state.undoStack.pop();
    state.redoStack.push(current);

    const prev = state.undoStack[state.undoStack.length - 1];
    state.isTypingUndoLocked = true;
    dom.txtEdited.value = prev;
    const scene = getActiveScene();
    if (scene) scene.edited = prev;
    updateDiffAndStats();
    persistState();
    state.isTypingUndoLocked = false;
    updateUndoRedoButtons();
    showToast('Дію скасовано');
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack.pop();
    state.undoStack.push(next);

    state.isTypingUndoLocked = true;
    dom.txtEdited.value = next;
    const scene = getActiveScene();
    if (scene) scene.edited = next;
    updateDiffAndStats();
    persistState();
    state.isTypingUndoLocked = false;
    updateUndoRedoButtons();
    showToast('Дію повторено');
  }

  function updateUndoRedoButtons() {
    if (dom.btnUndo) dom.btnUndo.disabled = state.undoStack.length <= 1;
    if (dom.btnRedo) dom.btnRedo.disabled = state.redoStack.length === 0;
  }

  // -------------------------------------------------------------------------
  // 7. Керування сценами (Multi-Scene / Multi-Document)
  // -------------------------------------------------------------------------

  function renderSceneDropdown() {
    if (!dom.sceneSelect) return;
    dom.sceneSelect.innerHTML = '';
    state.scenes.forEach(scene => {
      const opt = document.createElement('option');
      opt.value = scene.id;
      opt.textContent = scene.title || 'Безназвна сцена';
      if (scene.id === state.activeSceneId) opt.selected = true;
      dom.sceneSelect.appendChild(opt);
    });
  }

  function switchScene(sceneId) {
    if (sceneId === state.activeSceneId) return;
    // Зберігаємо поточний стан перед переходом
    const currentScene = getActiveScene();
    if (currentScene) {
      currentScene.original = dom.txtOriginal.value;
      currentScene.edited = dom.txtEdited.value;
    }
    state.activeSceneId = sceneId;
    renderSceneDropdown();
    renderActiveScene();
    updateDiffAndStats();
    persistState();
  }

  function createNewScene(title = '') {
    const sceneCount = state.scenes.length + 1;
    const defaultTitle = title || `Сцена ${sceneCount}: Новий фрагмент`;
    const newScene = createDefaultScene(defaultTitle);
    state.scenes.push(newScene);
    switchScene(newScene.id);
    showToast(`Створено сцену: «${defaultTitle}»`, 'success');
  }

  function duplicateCurrentScene() {
    const current = getActiveScene();
    if (!current) return;
    const copy = {
      id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title: `${current.title} (Копія)`,
      original: current.original,
      edited: current.edited,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.scenes.push(copy);
    switchScene(copy.id);
    showToast('Сцену продубльовано', 'success');
  }

  function deleteCurrentScene(sceneId) {
    if (state.scenes.length <= 1) {
      showToast('Неможливо видалити єдину сцену!', 'warn');
      return;
    }
    const targetId = sceneId || state.activeSceneId;
    const idx = state.scenes.findIndex(s => s.id === targetId);
    if (idx === -1) return;

    const deleted = state.scenes.splice(idx, 1)[0];
    state.activeSceneId = state.scenes[Math.max(0, idx - 1)].id;

    renderSceneDropdown();
    renderActiveScene();
    updateDiffAndStats();
    persistState();
    showToast(`Вилучено сцену: «${deleted.title}»`);
  }

  function openSceneManagerModal() {
    const listContainer = document.getElementById('scene-manager-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    state.scenes.forEach(scene => {
      const item = document.createElement('div');
      item.className = `scene-item ${scene.id === state.activeSceneId ? 'active' : ''}`;

      const origWords = QuestDiff.tokenize(scene.original).length;
      const editWords = QuestDiff.tokenize(scene.edited).length;

      item.innerHTML = `
        <div class="scene-info">
          <div class="scene-name">${QuestDiff.escapeHtml(scene.title)}</div>
          <div class="scene-meta">
            Редакція: ${editWords} слів | Оновлено: ${new Date(scene.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
        <div class="scene-actions">
          <button class="btn btn-sm btn-secondary btn-switch" data-id="${scene.id}">
            ${scene.id === state.activeSceneId ? 'Активна' : 'Відкрити'}
          </button>
          <button class="btn btn-sm btn-secondary btn-rename" data-id="${scene.id}" title="Перейменувати">✏️</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${scene.id}" title="Видалити">🗑️</button>
        </div>
      `;

      item.querySelector('.btn-switch').addEventListener('click', () => {
        switchScene(scene.id);
        dom.dialogScenes.close();
      });

      item.querySelector('.btn-rename').addEventListener('click', () => {
        const newName = prompt('Введіть нову назву для сцени:', scene.title);
        if (newName && newName.trim()) {
          scene.title = newName.trim();
          renderSceneDropdown();
          openSceneManagerModal();
          persistState();
        }
      });

      item.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm(`Ви дійсно бажаєте видалити сцену «${scene.title}»?`)) {
          deleteCurrentScene(scene.id);
          openSceneManagerModal();
        }
      });

      listContainer.appendChild(item);
    });

    dom.dialogScenes.showModal();
  }

  // -------------------------------------------------------------------------
  // 8. Історія версій та знімки (Version History)
  // -------------------------------------------------------------------------

  function createVersionSnapshot(note = 'Ручний знімок') {
    const scene = getActiveScene();
    if (!scene) return;

    if (!scene.history) scene.history = [];

    const diff = QuestDiff.diff(scene.original, scene.edited);
    const snapshot = {
      id: 'snap_' + Date.now(),
      timestamp: new Date().toISOString(),
      note: note,
      original: scene.original,
      edited: scene.edited,
      wordsAdded: diff.stats.wordsAdded,
      wordsDeleted: diff.stats.wordsDeleted,
      totalWords: diff.stats.editedWords,
      similarity: diff.stats.similarity !== undefined ? diff.stats.similarity : 100
    };

    scene.history.unshift(snapshot);
    if (scene.history.length > 30) {
      scene.history.pop();
    }
    persistState();
    showToast('Знімок версії успішно збережено', 'success');
  }

  function openHistoryModal() {
    const scene = getActiveScene();
    if (!scene) return;

    const container = document.getElementById('history-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (!scene.history || scene.history.length === 0) {
      container.innerHTML = '<div class="diff-empty-state">Для цієї сцени ще немає збережених знімків історії.</div>';
    } else {
      scene.history.forEach((snap, idx) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const dateStr = new Date(snap.timestamp).toLocaleString();
        const simVal = snap.similarity !== undefined ? snap.similarity : 100;

        item.innerHTML = `
          <div class="scene-info">
            <div class="scene-name">${QuestDiff.escapeHtml(snap.note)} <span style="font-weight:normal;color:var(--text-muted);font-size:0.8rem">#${scene.history.length - idx}</span></div>
            <div class="scene-meta">
              ${dateStr} | Слів: ${snap.totalWords} | Схожість: <strong>${simVal}%</strong> | <span style="color:var(--diff-ins-text)">+${snap.wordsAdded}</span> / <span style="color:var(--diff-del-text)">-${snap.wordsDeleted}</span>
            </div>
          </div>
          <div class="scene-actions">
            <button class="btn btn-sm btn-accent btn-restore-snap" data-id="${snap.id}">Відновити</button>
          </div>
        `;

        item.querySelector('.btn-restore-snap').addEventListener('click', () => {
          if (confirm(`Відновити версію від ${dateStr}? Поточний текст редакції буде замінено.`)) {
            // Перед відновленням зберігаємо поточний стан у знімок
            createVersionSnapshot('Автознімок перед відновленням');
            scene.edited = snap.edited;
            dom.txtEdited.value = snap.edited;
            recordUndoState(snap.edited);
            updateDiffAndStats();
            persistState();
            dom.dialogHistory.close();
            showToast('Версію успішно відновлено!', 'success');
          }
        });

        container.appendChild(item);
      });
    }

    dom.dialogHistory.showModal();
  }

  // -------------------------------------------------------------------------
  // 9. Експорт та імпорт (Export & Backup)
  // -------------------------------------------------------------------------

  function copyEditedText() {
    const text = dom.txtEdited.value;
    if (!text) {
      showToast('Текст редакції порожній!', 'warn');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Текст редакції скопійовано у буфер!', 'success');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Текст скопійовано у буфер!', 'success');
    } catch (e) {
      showToast('Не вдалося скопіювати текст', 'warn');
    }
    document.body.removeChild(ta);
  }

  function sanitizeFilename(name) {
    return (name || 'quest').replace(/[\\/:*?"<>|]/g, '_').trim();
  }

  function downloadEditedText(format = 'txt') {
    const scene = getActiveScene();
    const text = dom.txtEdited.value;
    const safeTitle = sanitizeFilename(scene ? scene.title : 'quest');

    let content = text;
    let mime = 'text/plain;charset=utf-8';
    let filename = `${safeTitle}.${format}`;

    if (format === 'md') {
      content = `# ${scene ? scene.title : 'Квест'}\n\n${text}\n`;
      mime = 'text/markdown;charset=utf-8';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Завантажено файл ${filename}`, 'success');
  }

  function exportBackupJson() {
    const backupData = {
      app: 'QuestEditorUA',
      version: 1,
      exportedAt: new Date().toISOString(),
      scenes: state.scenes,
      activeSceneId: state.activeSceneId
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `quest_editor_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Резервну копію збережено у файл', 'success');
  }

  function importBackupJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
          throw new Error('Невірний формат файлу резервної копії');
        }

        if (confirm(`Імпортувати ${parsed.scenes.length} сцен(и) з резервної копії? Поточні дані будуть замінені.`)) {
          state.scenes = parsed.scenes;
          state.activeSceneId = parsed.activeSceneId || parsed.scenes[0].id;
          renderSceneDropdown();
          renderActiveScene();
          updateDiffAndStats();
          persistState();
          dom.dialogBackup.close();
          showToast('Дані успішно відновлено з копії!', 'success');
        }
      } catch (err) {
        alert('Помилка імпорту: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // -------------------------------------------------------------------------
  // 10. Адаптивність, розділювач (Splitter) та вкладки
  // -------------------------------------------------------------------------

  function applySplit(percent) {
    state.desktopSplit = Math.max(20, Math.min(80, percent));
    if (dom.paneOriginal) {
      dom.paneOriginal.style.width = `${state.desktopSplit}%`;
    }
    LocalStorageAdapter.saveSettings({ desktopSplit: state.desktopSplit });
  }

  function initSplitter() {
    if (!dom.paneSplitter) return;
    let isDragging = false;

    dom.paneSplitter.addEventListener('mousedown', (e) => {
      isDragging = true;
      dom.paneSplitter.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerRect = dom.editorPanesWrapper.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const percentage = (offsetX / containerRect.width) * 100;
      applySplit(percentage);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        dom.paneSplitter.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Подвійний клік на розділювач повертає 50/50
    dom.paneSplitter.addEventListener('dblclick', () => {
      applySplit(50);
    });
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // На мобільних показуємо тільки одну активну панель
      dom.paneOriginal.classList.toggle('mobile-active-pane', tabName === 'original');
      dom.paneEdited.classList.toggle('mobile-active-pane', tabName === 'edited');
      dom.comparisonView.classList.toggle('mobile-active-pane', tabName === 'comparison');

      if (tabName === 'comparison') {
        dom.editorPanesWrapper.style.display = 'none';
        dom.comparisonView.style.display = 'flex';
      } else {
        dom.editorPanesWrapper.style.display = 'block';
        dom.comparisonView.style.display = 'none';
      }
    } else {
      // На десктопі: вкладка «Порівняння» перемикає між редактором (2 поля) та повноекранним порівнянням
      if (tabName === 'comparison') {
        dom.editorPanesWrapper.style.display = 'none';
        dom.comparisonView.style.display = 'flex';
      } else {
        dom.editorPanesWrapper.style.display = 'flex';
        dom.comparisonView.style.display = 'none';
      }
    }
  }

  function handleResize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      switchTab(state.activeTab);
    } else {
      if (state.activeTab === 'comparison') {
        switchTab('comparison');
      } else {
        dom.editorPanesWrapper.style.display = 'flex';
        dom.comparisonView.style.display = 'none';
        dom.paneOriginal.classList.remove('mobile-active-pane');
        dom.paneEdited.classList.remove('mobile-active-pane');
      }
    }
    syncBackdropScroll(dom.txtEdited, dom.backdropEdited);
    syncBackdropScroll(dom.txtOriginal, dom.backdropOriginal);
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (dom.btnTheme) {
      dom.btnTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
      dom.btnTheme.title = theme === 'dark' ? 'Світла тема' : 'Темна тема';
    }
    LocalStorageAdapter.saveSettings({ theme: state.theme });
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function showToast(message, type = 'normal') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 2500);
  }

  // -------------------------------------------------------------------------
  // 11. Завантаження зразків (Sample Quests)
  // -------------------------------------------------------------------------

  function openSamplesModal() {
    const container = document.getElementById('samples-list-container');
    if (!container || typeof QUEST_SAMPLES === 'undefined') return;

    container.innerHTML = '';
    QUEST_SAMPLES.forEach(sample => {
      const card = document.createElement('div');
      card.className = 'history-item';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'flex-start';
      card.style.gap = '8px';

      card.innerHTML = `
        <div style="font-weight:700;font-size:1rem;color:var(--text-primary);">${QuestDiff.escapeHtml(sample.title)}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);">${QuestDiff.escapeHtml(sample.description)}</div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn btn-sm btn-primary btn-load-sample">Завантажити як нову сцену</button>
        </div>
      `;

      card.querySelector('.btn-load-sample').addEventListener('click', () => {
        const newScene = {
          id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          title: sample.title,
          original: sample.original,
          edited: sample.edited,
          history: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.scenes.push(newScene);
        switchScene(newScene.id);
        dom.dialogSamples.close();
        showToast(`Зразок «${sample.title}» завантажено!`, 'success');
      });

      container.appendChild(card);
    });

    dom.dialogSamples.showModal();
  }

  // -------------------------------------------------------------------------
  // 12. Прив'язка подій (Event Bindings)
  // -------------------------------------------------------------------------

  function bindEvents() {
    // Введення в Оригінал
    dom.txtOriginal.addEventListener('input', (e) => {
      handleOriginalInputChange(e.target.value);
    });
    dom.txtOriginal.addEventListener('scroll', () => {
      syncBackdropScroll(dom.txtOriginal, dom.backdropOriginal);
    });

    // Кнопка вставити у оригінал
    dom.btnPasteOrig.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            handleOriginalInputChange(text);
            dom.txtOriginal.value = text;
            showToast('Текст вставлено з буфера');
          }
        } else {
          dom.txtOriginal.focus();
          showToast('Натисніть Ctrl+V у полі оригіналу');
        }
      } catch (err) {
        dom.txtOriginal.focus();
      }
    });

    // Очистити оригінал
    dom.btnClearOrig.addEventListener('click', () => {
      if (!dom.txtOriginal.value) return;
      if (confirm('Очистити поле «Оригінал»?')) {
        handleOriginalInputChange('', true);
        dom.txtOriginal.value = '';
      }
    });

    // Скопіювати оригінал у редакцію (Синхронізувати)
    dom.btnSyncOrigToEdit.addEventListener('click', () => {
      if (confirm('Замінити поточну редакцію точною копією оригіналу? Усі зроблені правки будуть замінені.')) {
        const orig = dom.txtOriginal.value;
        const scene = getActiveScene();
        if (scene) {
          scene.edited = orig;
        }
        dom.txtEdited.value = orig;
        recordUndoState(orig);
        updateDiffAndStats();
        persistState();
        showToast('Редакцію оновлено копією оригіналу');
      }
    });

    // Введення в Редакцію
    dom.txtEdited.addEventListener('input', (e) => {
      const val = e.target.value;
      const scene = getActiveScene();
      if (scene) {
        scene.edited = val;
      }

      // Дебаунс підрахунку diff для миттєвої плавності введення
      clearTimeout(diffDebounceTimer);
      diffDebounceTimer = setTimeout(() => {
        updateDiffAndStats();
        persistState();
      }, 120);

      // Запис у стек undo після невеликої паузи друку
      clearTimeout(state.undoTypingTimer);
      state.undoTypingTimer = setTimeout(() => {
        recordUndoState(val);
      }, 400);
    });

    dom.txtEdited.addEventListener('scroll', () => {
      syncBackdropScroll(dom.txtEdited, dom.backdropEdited);
    });

    // Гарячі клавіші для Undo / Redo
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')) {
        if (document.activeElement === dom.txtEdited || document.activeElement === document.body) {
          e.preventDefault();
          undo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || e.key === 'н' || e.key === 'Н')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        if (document.activeElement === dom.txtEdited || document.activeElement === document.body) {
          e.preventDefault();
          redo();
        }
      }
    });

    dom.btnUndo.addEventListener('click', undo);
    dom.btnRedo.addEventListener('click', redo);

    // Копіювання та збереження
    dom.btnCopyEdit.addEventListener('click', copyEditedText);
    dom.btnDownloadTxt.addEventListener('click', () => downloadEditedText('txt'));
    dom.btnDownloadMd.addEventListener('click', () => downloadEditedText('md'));

    // Вкладки
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Пресети розділювача
    dom.btnSplit50.addEventListener('click', () => applySplit(50));
    dom.btnSplit40.addEventListener('click', () => applySplit(40));
    dom.btnSplit60.addEventListener('click', () => applySplit(60));

    // Режими порівняння (inline vs side-by-side)
    dom.btnCompareInline.addEventListener('click', () => {
      state.comparisonMode = 'inline';
      dom.btnCompareInline.classList.add('btn-primary');
      dom.btnCompareInline.classList.remove('btn-secondary');
      dom.btnCompareSide.classList.remove('btn-primary');
      dom.btnCompareSide.classList.add('btn-secondary');
      updateDiffAndStats();
    });

    dom.btnCompareSide.addEventListener('click', () => {
      state.comparisonMode = 'side-by-side';
      dom.btnCompareSide.classList.add('btn-primary');
      dom.btnCompareSide.classList.remove('btn-secondary');
      dom.btnCompareInline.classList.remove('btn-primary');
      dom.btnCompareInline.classList.add('btn-secondary');
      updateDiffAndStats();
    });

    // Сцени
    dom.sceneSelect.addEventListener('change', (e) => {
      switchScene(e.target.value);
    });

    dom.btnNewScene.addEventListener('click', () => {
      const title = prompt('Введіть назву для нової сцени або документу:');
      if (title !== null) {
        createNewScene(title.trim());
      }
    });

    dom.btnManageScenes.addEventListener('click', openSceneManagerModal);

    // Історія версій
    dom.btnHistory.addEventListener('click', openHistoryModal);
    document.getElementById('btn-create-snapshot')?.addEventListener('click', () => {
      const note = prompt('Введіть примітку до знімка (наприклад: "Після вичитки діалогу"):', 'Ручний знімок версії');
      if (note !== null) {
        createVersionSnapshot(note.trim() || 'Знімок версії');
        openHistoryModal();
      }
    });

    // Резервне копіювання
    dom.btnBackup.addEventListener('click', () => dom.dialogBackup.showModal());
    document.getElementById('btn-export-backup-json')?.addEventListener('click', exportBackupJson);
    document.getElementById('file-import-backup')?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importBackupJson(e.target.files[0]);
      }
    });

    // Довідка та зразки
    dom.btnHelp.addEventListener('click', () => dom.dialogHelp.showModal());
    dom.btnSamples.addEventListener('click', openSamplesModal);
    dom.btnTheme.addEventListener('click', toggleTheme);

    // Банер синхронізації
    if (dom.dismissBannerBtn) {
      dom.dismissBannerBtn.addEventListener('click', () => {
        dom.syncBanner.style.display = 'none';
        state.bannerDismissed = true;
        LocalStorageAdapter.saveSettings({ bannerDismissed: true });
      });
    }

    // Модальне вікно попередження заміни оригіналу
    document.getElementById('btn-warn-new-scene')?.addEventListener('click', () => {
      if (pendingOriginalReplacement !== null) {
        const title = prompt('Назва нової сцени для цього тексту:', `Сцена ${state.scenes.length + 1}`);
        if (title !== null) {
          const newScene = createDefaultScene(title.trim() || 'Нова сцена');
          newScene.original = pendingOriginalReplacement;
          newScene.edited = pendingOriginalReplacement;
          state.scenes.push(newScene);
          switchScene(newScene.id);
          dom.dialogReplaceWarn.close();
          pendingOriginalReplacement = null;
          showToast('Створено нову сцену з новим оригіналом', 'success');
        }
      }
    });

    document.getElementById('btn-warn-overwrite')?.addEventListener('click', () => {
      if (pendingOriginalReplacement !== null) {
        // Зберігаємо поточний стан в історію про всяк випадок
        createVersionSnapshot('Автозбереження перед перезаписом оригіналу');
        const scene = getActiveScene();
        if (scene) {
          scene.original = pendingOriginalReplacement;
          scene.edited = pendingOriginalReplacement;
          dom.txtOriginal.value = pendingOriginalReplacement;
          dom.txtEdited.value = pendingOriginalReplacement;
          recordUndoState(pendingOriginalReplacement);
          updateDiffAndStats();
          persistState();
        }
        dom.dialogReplaceWarn.close();
        pendingOriginalReplacement = null;
        showToast('Оригінал і редакцію оновлено новим текстом');
      }
    });

    document.getElementById('btn-warn-keep-edit')?.addEventListener('click', () => {
      if (pendingOriginalReplacement !== null) {
        const scene = getActiveScene();
        if (scene) {
          scene.original = pendingOriginalReplacement;
          dom.txtOriginal.value = pendingOriginalReplacement;
          updateDiffAndStats();
          persistState();
        }
        dom.dialogReplaceWarn.close();
        pendingOriginalReplacement = null;
        showToast('Оригінал оновлено. Поточну редакцію збережено');
      }
    });

    document.getElementById('btn-warn-cancel')?.addEventListener('click', () => {
      const scene = getActiveScene();
      if (scene) {
        dom.txtOriginal.value = scene.original || '';
      }
      dom.dialogReplaceWarn.close();
      pendingOriginalReplacement = null;
    });

    // Кнопки закриття діалогів
    document.querySelectorAll('.btn-close-dialog').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    // Адаптивність вікна
    window.addEventListener('resize', handleResize);

    // Ініціалізація розділювача
    initSplitter();
  }

  // Запуск при завантаженні DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
