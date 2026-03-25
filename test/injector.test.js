const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadInjector(windowOverrides = {}) {
  const script = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'injector.js'),
    'utf8'
  );

  const bodyChildren = [];
  const headChildren = [];
  const listeners = new Map();

  const document = {
    readyState: 'complete',
    body: {
      appendChild(node) {
        bodyChildren.push(node);
        return node;
      },
    },
    head: {
      appendChild(node) {
        headChildren.push(node);
        return node;
      },
    },
    querySelector(selector) {
      if (selector === 'select.gitParameterSelect') {
        return null;
      }

      return null;
    },
    getElementById() {
      return null;
    },
    createElement(tagName) {
      const elements = new Map();

      function getOrCreateElement(selector) {
        if (!elements.has(selector)) {
          elements.set(selector, {
            disabled: false,
            dataset: {},
            style: {},
            addEventListener() {},
            focus() {},
            select() {},
            remove() {},
          });
        }

        return elements.get(selector);
      }

      return {
        tagName,
        style: {},
        dataset: {},
        innerHTML: '',
        remove() {},
        querySelector(selector) {
          return getOrCreateElement(selector);
        },
        addEventListener() {},
      };
    },
    addEventListener(eventName, callback) {
      listeners.set(eventName, callback);
    },
  };

  const windowObject = {
    __jenkinsOptionFinderLoaded: false,
    JenkinsOptionFinderCore: {
      buildOptionRecordsFromSelect() {
        return [];
      },
      normalizeKeyword(value) {
        return String(value ?? '').trim().toLowerCase();
      },
      findMatches() {
        return [];
      },
      getNextMatchIndex() {
        return -1;
      },
    },
    JenkinsOptionFinderPosition: {
      loadPanelPosition() {
        return { top: 20, left: 20 };
      },
      savePanelPosition(_storage, position) {
        return position;
      },
      resetPanelPosition() {
        return { top: 20, left: 20 };
      },
    },
    JenkinsOptionFinderSelection: {
      applyMatchSelection() {},
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    innerWidth: 1280,
    innerHeight: 720,
    ...windowOverrides,
  };

  const context = vm.createContext({
    window: windowObject,
    document,
    console,
    Event: class Event {
      constructor(type, init = {}) {
        this.type = type;
        this.bubbles = init.bubbles;
      }
    },
  });

  vm.runInContext(script, context);

  return {
    bodyChildren,
    headChildren,
    listeners,
    window: windowObject,
  };
}

test('injector does not mount the panel when the target select is missing', () => {
  const result = loadInjector();

  assert.equal(result.bodyChildren.length, 0);
  assert.equal(result.window.__jenkinsOptionFinderLoaded, false);
});
