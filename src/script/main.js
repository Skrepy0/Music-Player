(async function main() {
  try {
    const response = await fetch('/api/music-list');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const files = await response.json();

    if (files.length === 0) {
      document.getElementById('playlistContainer').innerHTML = '<div class="error-msg">📁 resources/music 目录为空<br>请放入音乐文件后刷新</div>';
      document.getElementById('songCount').textContent = '0 首';
      return;
    }

    const rawPlaylist = files.map(filename => {
      const { artist, title } = parseMetadata(filename);
      return {
        name: filename,
        title: title,
        artist: artist,
        url: `/music/${encodeURIComponent(filename)}`,
        durationFormatted: null
      };
    });

    window.player.init({
      onProgress: (currentTime, duration) => {
        updateProgress(currentTime, duration, document.getElementById('progressFill'));
      },
      onPlaylistChange: (pl, idx) => {
        const filterText = document.getElementById('searchInput')?.value.trim() || '';
        renderPlaylist(pl, idx, filterText);
      },
      onNowPlayingChange: (track) => {
        updateNowPlaying(track);
      }
    });

    window.searchSort.init(rawPlaylist);

    (async function preloadDurations() {
      for (let i = 0; i < rawPlaylist.length; i++) {
        const track = rawPlaylist[i];
        if (track.durationFormatted) continue;
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = track.url;
        try {
          await new Promise((resolve, reject) => {
            audio.addEventListener('loadedmetadata', () => {
              track.durationFormatted = formatTime(audio.duration);
              resolve();
            }, { once: true });
            audio.addEventListener('error', () => {
              track.durationFormatted = '--:--';
              resolve();
            }, { once: true });
            audio.load();
          });
        } catch (e) {
          track.durationFormatted = '--:--';
        }
        window.searchSort.updateOriginalList(rawPlaylist);
        await new Promise(r => setTimeout(r, 20));
      }
    })();

  } catch (err) {
    console.error('加载失败:', err);
    document.getElementById('playlistContainer').innerHTML = `<div class="error-msg">❌ 无法连接服务器<br>请确认服务器已启动 (node server.js)</div>`;
  }
})();