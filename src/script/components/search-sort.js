(function() {
  let originalPlaylist = [];
  let currentFilterText = '';
  let currentSortType = 'default';

  function applySortAndFilter() {
    if (!originalPlaylist.length) {
      window.player.setDisplayList([]);
      return;
    }

    let filtered = originalPlaylist;
    if (currentFilterText) {
      const lower = currentFilterText.toLowerCase();
      filtered = originalPlaylist.filter(track =>
        (track.title && track.title.toLowerCase().includes(lower)) ||
        (track.artist && track.artist.toLowerCase().includes(lower))
      );
    }

    if (currentSortType !== 'default') {
      filtered = [...filtered];
      filtered.sort((a, b) => {
        switch (currentSortType) {
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
          case 'artist':
            return (a.artist || '').localeCompare(b.artist || '');
          case 'duration':
            const getSec = (track) => {
              if (track.durationFormatted) {
                const parts = track.durationFormatted.split(':');
                return parseInt(parts[0]) * 60 + parseInt(parts[1]);
              }
              return 0;
            };
            return getSec(a) - getSec(b);
          default:
            return 0;
        }
      });
    }

    window.player.setDisplayList(filtered);
  }

  window.searchSort = {
    init: function(list) {
      originalPlaylist = list;
      currentSortType = loadSortType();
      document.getElementById('sortSelect').value = currentSortType;

      document.getElementById('searchInput').addEventListener('input', (e) => {
        currentFilterText = e.target.value.trim();
        applySortAndFilter();
      });

      document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSortType = e.target.value;
        saveSortType(currentSortType);
        applySortAndFilter();
      });

      applySortAndFilter();
    },
    updateOriginalList: function(newList) {
      originalPlaylist = newList;
      applySortAndFilter();
    }
  };
})();