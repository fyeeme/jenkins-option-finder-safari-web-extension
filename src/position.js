(function initJenkinsOptionFinderPosition(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.JenkinsOptionFinderPosition = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPosition() {
  const STORAGE_KEY = 'jenkins-option-finder:panel-position';
  const DEFAULT_PANEL_POSITION = {
    top: 20,
    left: 20,
  };

  function normalizePosition(position) {
    const top = Number(position?.top);
    const left = Number(position?.left);

    if (!Number.isFinite(top) || !Number.isFinite(left)) {
      return { ...DEFAULT_PANEL_POSITION };
    }

    return { top, left };
  }

  function loadPanelPosition(storage) {
    const rawValue = storage?.getItem?.(STORAGE_KEY);
    if (!rawValue) {
      return { ...DEFAULT_PANEL_POSITION };
    }

    try {
      return normalizePosition(JSON.parse(rawValue));
    } catch {
      return { ...DEFAULT_PANEL_POSITION };
    }
  }

  function savePanelPosition(storage, position) {
    const nextPosition = normalizePosition(position);
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(nextPosition));
    return nextPosition;
  }

  function resetPanelPosition(storage) {
    storage?.removeItem?.(STORAGE_KEY);
    return { ...DEFAULT_PANEL_POSITION };
  }

  return {
    STORAGE_KEY,
    DEFAULT_PANEL_POSITION,
    loadPanelPosition,
    savePanelPosition,
    resetPanelPosition,
  };
});
