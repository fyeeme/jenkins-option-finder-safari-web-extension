(function initJenkinsOptionFinderCore(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.JenkinsOptionFinderCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCore() {
  function normalizeKeyword(keyword) {
    return String(keyword ?? '').trim().toLowerCase();
  }

  function buildOptionRecords(options) {
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
  }

  function buildOptionRecordsFromSelect(selectElement) {
    return buildOptionRecords(
      Array.from(selectElement?.options ?? []).map((option) => ({
        text: option.text,
        value: option.value,
      }))
    );
  }

  function findMatches(records, keyword) {
    const normalizedKeyword = normalizeKeyword(keyword);
    if (!normalizedKeyword) {
      return [];
    }

    return records.filter((record) => record.searchText.includes(normalizedKeyword));
  }

  function getNextMatchIndex(matches, currentMatchIndex) {
    if (!Array.isArray(matches) || matches.length === 0) {
      return -1;
    }

    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length - 1) {
      return 0;
    }

    return currentMatchIndex + 1;
  }

  return {
    normalizeKeyword,
    buildOptionRecords,
    buildOptionRecordsFromSelect,
    findMatches,
    getNextMatchIndex,
  };
});
