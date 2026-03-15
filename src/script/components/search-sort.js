(function() {
  let originalPlaylist = [];
  let currentFilterText = '';
  let currentSortType = 'default';

  // 辅助函数：将中文字符串转为拼音（全拼，小写，无空格）
  function toPinyin(text) {
    if (!text || typeof text !== 'string') return '';
    try {
      // 使用 pinyin-pro 库，返回不带声调的全拼字符串
      return pinyinPro.pinyin(text, { toneType: 'none', type: 'string' }).replace(/\s+/g, '').toLowerCase();
    } catch (e) {
      console.warn('拼音转换失败', e);
      return '';
    }
  }

  function applySortAndFilter() {
    if (!originalPlaylist.length) {
      window.player.setDisplayList([]);
      return;
    }

    const lowerFilter = currentFilterText.toLowerCase().trim();

    let filtered = originalPlaylist;

    // 如果有搜索文本
    if (lowerFilter) {
      filtered = originalPlaylist.filter(track => {
        // 原始文本匹配（标题或艺术家）
        const titleMatch = track.title && track.title.toLowerCase().includes(lowerFilter);
        const artistMatch = track.artist && track.artist.toLowerCase().includes(lowerFilter);
        if (titleMatch || artistMatch) return true;

        // 如果输入包含字母，则尝试拼音匹配
        if (/[a-zA-Z]/.test(lowerFilter)) {
          const titlePinyin = track.titlePinyin || '';
          const artistPinyin = track.artistPinyin || '';
          if (titlePinyin.includes(lowerFilter) || artistPinyin.includes(lowerFilter)) {
            return true;
          }
        }
        return false;
      });
    }

    // 排序（与原逻辑相同）
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
      // 为每条记录添加拼音字段
      originalPlaylist = list.map(track => {
        return {
          ...track,
          titlePinyin: toPinyin(track.title),
          artistPinyin: toPinyin(track.artist)
        };
      });

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
      // 更新时也要重新计算拼音
      originalPlaylist = newList.map(track => {
        return {
          ...track,
          titlePinyin: toPinyin(track.title),
          artistPinyin: toPinyin(track.artist)
        };
      });
      applySortAndFilter();
    }
  };
})();