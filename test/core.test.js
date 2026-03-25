const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeKeyword,
  buildOptionRecords,
  buildOptionRecordsFromSelect,
  findMatches,
  getNextMatchIndex,
} = require('../src/core');
const { applyMatchSelection } = require('../src/selection');

test('buildOptionRecords keeps option text and value for matching', () => {
  const records = buildOptionRecords([
    { text: 'origin/develop', value: 'origin/develop' },
    { text: 'origin/feat/demo', value: 'origin/feat/demo' },
  ]);

  assert.equal(records.length, 2);
  assert.equal(records[1].searchText, 'origin/feat/demo origin/feat/demo');
});

test('findMatches returns case-insensitive matches by text or value', () => {
  const records = buildOptionRecords([
    { text: 'origin/develop', value: 'origin/develop' },
    { text: 'Origin/Feat/World', value: 'origin/feat/world' },
    { text: 'release', value: 'origin/release' },
  ]);

  const matches = findMatches(records, 'world');

  assert.deepEqual(matches.map((item) => item.optionIndex), [1]);
});

test('buildOptionRecordsFromSelect reads the latest options from a select-like element', () => {
  const selectElement = {
    options: [
      { text: 'origin/master', value: 'origin/master' }
    ]
  };

  let records = buildOptionRecordsFromSelect(selectElement);
  assert.equal(records.length, 1);

  selectElement.options = [
    { text: 'origin/master', value: 'origin/master' },
    { text: 'origin/version_erp', value: 'origin/version_erp' }
  ];

  records = buildOptionRecordsFromSelect(selectElement);
  assert.deepEqual(records.map((item) => item.value), ['origin/master', 'origin/version_erp']);
});

test('getNextMatchIndex starts from the first match and wraps to the beginning', () => {
  const matches = [{ optionIndex: 2 }, { optionIndex: 4 }, { optionIndex: 8 }];

  assert.equal(getNextMatchIndex(matches, -1), 0);
  assert.equal(getNextMatchIndex(matches, 0), 1);
  assert.equal(getNextMatchIndex(matches, 1), 2);
  assert.equal(getNextMatchIndex(matches, 2), 0);
});

test('normalizeKeyword trims whitespace for enter-triggered searches', () => {
  assert.equal(normalizeKeyword('  world  '), 'world');
  assert.equal(normalizeKeyword('   '), '');
});

test('applyMatchSelection restores focus to the search input after updating the select', () => {
  const events = [];
  const selectElement = {
    selectedIndex: -1,
    dispatchEvent(event) {
      events.push(event.type);
    },
    scrollIntoView() {},
  };
  const inputElement = {
    focused: false,
    focus() {
      this.focused = true;
    },
  };

  applyMatchSelection(selectElement, 3, inputElement);

  assert.equal(selectElement.selectedIndex, 3);
  assert.deepEqual(events, ['input', 'change']);
  assert.equal(inputElement.focused, true);
});
