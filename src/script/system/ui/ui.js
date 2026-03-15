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