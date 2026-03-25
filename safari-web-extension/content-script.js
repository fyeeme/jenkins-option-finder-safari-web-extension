(function initJenkinsOptionFinderBundle() {
  if (window.__jenkinsOptionFinderLoaded) {
    return;
  }

  const core = {
    normalizeKeyword(keyword) {
      return String(keyword ?? '').trim().toLowerCase();
    },
    buildOptionRecords(options) {
      return options.map((option, optionIndex) => {
        const text = String(option.text ?? '').trim();
        const value = String(option.value ?? '').trim();

        return {
          optionIndex,
          text,
          value,
          searchText: `${text} ${value}`.trim().toLowerCase(),
        };
      });
    },
    buildOptionRecordsFromSelect(selectElement) {
      return core.buildOptionRecords(
        Array.from(selectElement?.options ?? []).map((option) => ({
          text: option.text,
          value: option.value,
        }))
      );
    },
    findMatches(records, keyword) {
      const normalizedKeyword = core.normalizeKeyword(keyword);
      if (!normalizedKeyword) {
        return [];
      }

      return records.filter((record) => record.searchText.includes(normalizedKeyword));
    },
    getNextMatchIndex(matches, currentMatchIndex) {
      if (!Array.isArray(matches) || matches.length === 0) {
        return -1;
      }

      if (currentMatchIndex < 0 || currentMatchIndex >= matches.length - 1) {
        return 0;
      }

      return currentMatchIndex + 1;
    },
  };

  const positionState = {
    STORAGE_KEY: 'jenkins-option-finder:panel-position',
    DEFAULT_PANEL_POSITION: {
      top: 20,
      left: 20,
    },
    normalizePosition(position) {
      const top = Number(position?.top);
      const left = Number(position?.left);

      if (!Number.isFinite(top) || !Number.isFinite(left)) {
        return { ...positionState.DEFAULT_PANEL_POSITION };
      }

      return { top, left };
    },
    loadPanelPosition(storage) {
      const rawValue = storage?.getItem?.(positionState.STORAGE_KEY);
      if (!rawValue) {
        return { ...positionState.DEFAULT_PANEL_POSITION };
      }

      try {
        return positionState.normalizePosition(JSON.parse(rawValue));
      } catch {
        return { ...positionState.DEFAULT_PANEL_POSITION };
      }
    },
    savePanelPosition(storage, position) {
      const nextPosition = positionState.normalizePosition(position);
      storage?.setItem?.(positionState.STORAGE_KEY, JSON.stringify(nextPosition));
      return nextPosition;
    },
    resetPanelPosition(storage) {
      storage?.removeItem?.(positionState.STORAGE_KEY);
      return { ...positionState.DEFAULT_PANEL_POSITION };
    },
  };

  const selection = {
    applyMatchSelection(selectElement, optionIndex, inputElement) {
      selectElement.selectedIndex = optionIndex;
      selectElement.dispatchEvent(new Event('input', { bubbles: true }));
      selectElement.dispatchEvent(new Event('change', { bubbles: true }));
      selectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inputElement.focus({ preventScroll: true });
    },
  };

  const SELECTOR = 'select.gitParameterSelect';
  const PANEL_ID = 'jenkins-option-finder';
  const STYLE_ID = 'jenkins-option-finder-style';

  let activeHighlight = null;
  let records = [];
  let matches = [];
  let currentMatchIndex = -1;
  let lastKeyword = '';
  let dragState = null;

  function getSelectElement() {
    return document.querySelector(SELECTOR);
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  function applyPanelPosition(panel, nextPosition) {
    panel.style.top = `${nextPosition.top}px`;
    panel.style.left = `${nextPosition.left}px`;
    panel.style.right = 'auto';
  }

  function clampPanelPosition(panel, nextPosition) {
    const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth - 12);
    const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight - 12);

    return {
      left: Math.min(Math.max(0, nextPosition.left), maxLeft),
      top: Math.min(Math.max(0, nextPosition.top), maxTop),
    };
  }

  function persistPanelPosition(storage, panel, nextPosition) {
    const clampedPosition = clampPanelPosition(panel, nextPosition);
    const savedPosition = positionState.savePanelPosition(storage, clampedPosition);
    applyPanelPosition(panel, savedPosition);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = STYLE_ID;
    styleElement.textContent = `
#jenkins-option-finder{position:fixed;top:20px;left:20px;z-index:2147483647;width:320px;padding:12px;border:1px solid #d0d7de;border-radius:10px;background:rgba(255,255,255,.98);box-shadow:0 12px 30px rgba(15,23,42,.16);color:#0f172a;font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#jenkins-option-finder[data-state="missing"]{border-color:#dc2626}
.jof-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-weight:600;cursor:move;user-select:none;gap:8px}
.jof-header-actions{display:flex;align-items:center;gap:4px}
.jof-reset,.jof-close{border:0;background:transparent;color:#64748b;cursor:pointer}
.jof-reset{padding:2px 6px;border-radius:6px;font-size:12px}
.jof-close{font-size:16px}
.jof-reset:hover,.jof-close:hover{background:rgba(148,163,184,.16)}
.jof-input{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;outline:none;font:inherit}
.jof-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.jof-status{margin-top:8px;color:#475569;min-height:18px}
.jof-status[data-empty="true"]{color:#dc2626}
.jof-hint{margin-top:6px;color:#94a3b8;font-size:12px}
.jof-highlight{outline:3px solid #2563eb !important;outline-offset:2px}
`;
    document.head.appendChild(styleElement);
  }

  function clearHighlight() {
    if (activeHighlight) {
      activeHighlight.classList.remove('jof-highlight');
      activeHighlight = null;
    }
  }

  function setStatus(statusElement, message, isEmpty) {
    statusElement.textContent = message;
    statusElement.dataset.empty = isEmpty ? 'true' : 'false';
  }

  function loadRecords(selectElement) {
    records = core.buildOptionRecordsFromSelect(selectElement);
  }

  function selectMatch(selectElement, inputElement, statusElement, matchIndex) {
    const match = matches[matchIndex];
    if (!match) {
      setStatus(statusElement, '0 results', true);
      return;
    }

    currentMatchIndex = matchIndex;
    selection.applyMatchSelection(selectElement, match.optionIndex, inputElement);

    clearHighlight();
    selectElement.classList.add('jof-highlight');
    activeHighlight = selectElement;

    setStatus(
      statusElement,
      `${currentMatchIndex + 1}/${matches.length}: ${match.text || match.value}`,
      false
    );
  }

  function runSearch(selectElement, inputElement, statusElement, inputValue) {
    loadRecords(selectElement);

    const keyword = core.normalizeKeyword(inputValue);
    if (!keyword) {
      matches = [];
      currentMatchIndex = -1;
      lastKeyword = '';
      clearHighlight();
      setStatus(statusElement, 'Enter a keyword', false);
      return;
    }

    if (keyword !== lastKeyword) {
      matches = core.findMatches(records, keyword);
      currentMatchIndex = -1;
      lastKeyword = keyword;
    }

    const nextMatchIndex = core.getNextMatchIndex(matches, currentMatchIndex);
    if (nextMatchIndex === -1) {
      clearHighlight();
      setStatus(statusElement, '0 results', true);
      return;
    }

    selectMatch(selectElement, inputElement, statusElement, nextMatchIndex);
  }

  function bindPanelDragging(panel, dragHandle, inputElement) {
    const storage = getStorage();

    dragHandle.addEventListener('mousedown', (event) => {
      if (event.target.closest('button')) {
        return;
      }

      dragState = {
        startX: event.clientX,
        startY: event.clientY,
        originLeft: panel.offsetLeft,
        originTop: panel.offsetTop,
      };
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
      if (!dragState) {
        return;
      }

      const nextPosition = {
        left: dragState.originLeft + (event.clientX - dragState.startX),
        top: dragState.originTop + (event.clientY - dragState.startY),
      };

      applyPanelPosition(panel, clampPanelPosition(panel, nextPosition));
    });

    document.addEventListener('mouseup', () => {
      if (!dragState) {
        return;
      }

      persistPanelPosition(storage, panel, {
        left: panel.offsetLeft,
        top: panel.offsetTop,
      });
      dragState = null;
      inputElement.focus({ preventScroll: true });
    });
  }

  function createPanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      existing.remove();
    }

    const panel = document.createElement('div');
    panel.id = PANEL_ID;

    const selectElement = getSelectElement();
    if (!selectElement) {
      panel.dataset.state = 'missing';
    }

    panel.innerHTML = `
      <div class="jof-header">
        <span>Branch Finder</span>
        <div class="jof-header-actions">
          <button type="button" class="jof-reset">Reset</button>
          <button type="button" class="jof-close" aria-label="Close">×</button>
        </div>
      </div>
      <input class="jof-input" type="text" placeholder="Type keyword, press Enter" />
      <div class="jof-status"></div>
      <div class="jof-hint">Enter cycles to the next matching option and wraps to the first match.</div>
    `;

    const headerElement = panel.querySelector('.jof-header');
    const inputElement = panel.querySelector('.jof-input');
    const statusElement = panel.querySelector('.jof-status');
    const resetElement = panel.querySelector('.jof-reset');
    const closeElement = panel.querySelector('.jof-close');
    const storage = getStorage();

    closeElement.addEventListener('click', () => {
      clearHighlight();
      panel.remove();
      window.__jenkinsOptionFinderLoaded = false;
    });

    resetElement.addEventListener('click', () => {
      const defaultPosition = positionState.resetPanelPosition(storage);
      applyPanelPosition(panel, defaultPosition);
      inputElement.focus({ preventScroll: true });
    });

    applyPanelPosition(panel, positionState.loadPanelPosition(storage));

    if (!selectElement) {
      setStatus(statusElement, 'Target select.gitParameterSelect not found', true);
      inputElement.disabled = true;
      return panel;
    }

    loadRecords(selectElement);
    setStatus(statusElement, 'Enter a keyword', false);
    bindPanelDragging(panel, headerElement, inputElement);

    inputElement.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      runSearch(selectElement, inputElement, statusElement, inputElement.value);
    });

    return panel;
  }

  function mount() {
    window.__jenkinsOptionFinderLoaded = true;
    ensureStyles();
    const panel = createPanel();
    document.body.appendChild(panel);
    applyPanelPosition(panel, positionState.loadPanelPosition(getStorage()));
    const inputElement = panel.querySelector('.jof-input');
    if (inputElement && !inputElement.disabled) {
      inputElement.focus();
      inputElement.select();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
    return;
  }

  mount();
})();
