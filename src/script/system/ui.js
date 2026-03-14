function renderPlaylist(playlist, currentIndex, filterText = '') {
  const container = document.getElementById('playlistContainer');
  const songCountEl = document.getElementById('songCount');

  if (!playlist || playlist.length === 0) {
    container.innerHTML = '<div class="error-msg no-select">📁 没有匹配的歌曲</div>';
    songCountEl.textContent = '0 首';
    return;
  }

  let html = '';
  playlist.forEach((track, idx) => {
    const activeClass = (currentIndex !== -1 && idx === currentIndex) ? 'active' : '';
    const hue = (idx * 30) % 360;
    const coverStyle = `background: linear-gradient(145deg, hsl(${hue}, 40%, 30%), hsl(${hue}, 30%, 15%));`;

    let titleDisplay = track.title || track.name;
    let artistDisplay = track.artist || '未知';
    if (filterText) {
      const regex = new RegExp(`(${filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      titleDisplay = titleDisplay.replace(regex, '<mark>$1</mark>');
      artistDisplay = artistDisplay.replace(regex, '<mark>$1</mark>');
    }

    html += `
            <div class="playlist-item ${activeClass} no-select" data-index="${idx}">
                <div class="item-cover-mini no-select" style="${coverStyle}"></div>
                <div class="item-desc no-select">
                    <div class="item-title no-select">${titleDisplay}</div>
                    <div class="item-artist no-select">${artistDisplay}</div>
                </div>
                <div class="item-duration no-select">${track.durationFormatted || '--:--'}</div>
            </div>
        `;
  });
  container.innerHTML = html;
  songCountEl.textContent = playlist.length + ' 首';

  container.style.position = 'relative';

  // 左键点击播放歌曲
  container.addEventListener('click', (e) => {
    const playlistItem = e.target.closest('.playlist-item');
    if (!playlistItem) return;
    const index = playlistItem.dataset.index;
    if (index !== undefined) {
      window.player.playByIndex(parseInt(index));
    }
  });

  // 为每个列表项绑定右键菜单
  document.querySelectorAll('.playlist-item').forEach(item => {
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const index = item.dataset.index;
      if (index === undefined) return;

      // 关闭已打开的菜单
      if (window.closeCurrentMenu) window.closeCurrentMenu();

      // 创建菜单
      const menu = document.createElement('div');
      menu.className = 'item-menu';
      menu.innerHTML = `<div class="item-menu-item no-select" data-action="next">下一首播放</div>`;

      // 基于鼠标点击位置计算，使用 fixed 定位
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const menuWidth = 100;
      const menuHeight = 36; // 可根据实际调整

      let left = mouseX;
      let top = mouseY;

      // 防止菜单超出视口右侧或底部
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 5;
      }
      if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 5;
      }

      menu.style.position = 'fixed';
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
      menu.style.zIndex = '1000';

      document.body.appendChild(menu); // 直接添加到 body
      window.currentMenu = menu;

      // 菜单项点击
      menu.querySelector('.item-menu-item').addEventListener('click', () => {
        if (window.player && window.player.queueToNext) {
          window.player.queueToNext(parseInt(index));
          showToast('已添加到下一首播放','info');
        }
        window.closeCurrentMenu();
      });

      // 点击外部关闭菜单
      setTimeout(() => {
        function closeHandler(e) {
          if (!menu.contains(e.target)) {
            window.closeCurrentMenu();
            document.removeEventListener('click', closeHandler);
          }
        }
        document.addEventListener('click', closeHandler);
      }, 0);

      // 滚动时关闭菜单
      const scrollHandler = () => {
        window.closeCurrentMenu();
        window.removeEventListener('scroll', scrollHandler);
      };
      window.addEventListener('scroll', scrollHandler, { once: true });
    });
  });
}

function updateNowPlaying(track) {
  document.getElementById('trackName').textContent = track.title || '--';
  document.getElementById('artistName').textContent = track.artist || '未知艺术家';
  document.getElementById('nowPlayingBadge').innerHTML = `⏵ ${track.title || '--'}`;
}

function updateProgress(currentTime, duration, progressFill) {
  document.getElementById('currentTime').textContent = formatTime(currentTime);
  document.getElementById('duration').textContent = formatTime(duration);
  const percent = (currentTime / duration) * 100 || 0;
  progressFill.style.width = percent + '%';
}

window.closeCurrentMenu = function() {
  if (window.currentMenu) {
    window.currentMenu.remove();
    window.currentMenu = null;
  }
};