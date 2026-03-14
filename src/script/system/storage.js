const STORAGE_KEY = 'musicPlayerSettings';

function saveSortType(sortType) {
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  settings.sortType = sortType;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSortType() {
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return settings.sortType || 'default';
}