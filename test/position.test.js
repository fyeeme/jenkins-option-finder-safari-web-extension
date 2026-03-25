const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PANEL_POSITION,
  loadPanelPosition,
  savePanelPosition,
  resetPanelPosition,
} = require('../src/position');

function createStorage() {
  const state = new Map();

  return {
    getItem(key) {
      return state.has(key) ? state.get(key) : null;
    },
    setItem(key, value) {
      state.set(key, String(value));
    },
    removeItem(key) {
      state.delete(key);
    },
  };
}

test('loadPanelPosition falls back to the default top-left position', () => {
  const storage = createStorage();

  assert.deepEqual(loadPanelPosition(storage), DEFAULT_PANEL_POSITION);
});

test('savePanelPosition persists left and top coordinates', () => {
  const storage = createStorage();

  savePanelPosition(storage, { top: 48, left: 96 });

  assert.deepEqual(loadPanelPosition(storage), { top: 48, left: 96 });
});

test('resetPanelPosition clears saved coordinates and restores defaults', () => {
  const storage = createStorage();

  savePanelPosition(storage, { top: 80, left: 140 });
  resetPanelPosition(storage);

  assert.deepEqual(loadPanelPosition(storage), DEFAULT_PANEL_POSITION);
});
