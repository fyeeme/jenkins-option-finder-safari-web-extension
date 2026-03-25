(function initJenkinsOptionFinderSelection(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.JenkinsOptionFinderSelection = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSelection() {
  function applyMatchSelection(selectElement, optionIndex, inputElement) {
    selectElement.selectedIndex = optionIndex;
    selectElement.dispatchEvent(new Event('input', { bubbles: true }));
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    selectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputElement.focus({ preventScroll: true });
  }

  return {
    applyMatchSelection,
  };
});
