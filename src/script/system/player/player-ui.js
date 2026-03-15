(function() {
  const core = window.playerCore;
  if (!core) {
    console.error('player-core.js 必须先加载');
    showToast('player-core.js 必须先加载','error')
    return;
  }

  let playPauseBtn, prevBtn, nextBtn, modeBtn, progressBarBg, progressFill, vinylRecord;
  let volumeBar, volumeLevel, volumeIndicator;

  function updateModeButton() {
    const icons = { order: '🔁', single: '🔂', random: '🔀' };
    const names = { order: '顺序', single: '单曲', random: '随机' };
    modeBtn.innerHTML = `<span>${icons[core.getPlayMode()]}</span> ${names[core.getPlayMode()]}`;
  }

  function init(callbacks) {
    core.setCallbacks(callbacks);

    playPauseBtn = document.getElementById('playPauseBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    modeBtn = document.getElementById('modeBtn');
    progressBarBg = document.getElementById('progressBarBg');
    progressFill = document.getElementById('progressFill');
    vinylRecord = document.getElementById('vinylRecord');

    // 音频事件
    core.getAudio().addEventListener('timeupdate', () => {
      if (core.getAudio().duration && callbacks.onProgress) {
        callbacks.onProgress(core.getAudio().currentTime, core.getAudio().duration);
      }
    });

    core.getAudio().addEventListener('loadedmetadata', () => {
      if (core.getNowPlaying()) {
        core.getNowPlaying().durationFormatted = formatTime(core.getAudio().duration);
        if (callbacks.onPlaylistChange) {
          const idx = core.getCurrentIndex();
          callbacks.onPlaylistChange(core.getDisplayList(), idx);
        }
      }
    });

    core.getAudio().addEventListener('ended', () => core.handleEnded());

    // 播放/暂停
    playPauseBtn.addEventListener('click', () => {
      if (!core.getNowPlaying() && core.getDisplayList().length > 0) {
        core.playByIndex(0);
      }
      if (!core.getNowPlaying()) return;

      if (core.isPlaying()) {
        core.getAudio().pause();
        core.setIsPlaying(false);
        playPauseBtn.innerHTML = '▶';
        vinylRecord.style.animationPlayState = 'paused';
      } else {
        core.getAudio().play().then(() => {
          core.setIsPlaying(true);
          playPauseBtn.innerHTML = '⏸';
          vinylRecord.style.animationPlayState = 'running';
        }).catch(e => showToast('播放失败: ' + e, "error"));
      }
    });

    // 上一首
    prevBtn.addEventListener('click', () => {
      const list = core.getDisplayList();
      if (list.length === 0 || !core.getNowPlaying()) return;

      if (core.getPlayMode() === 'random') {
        const shuffled = core.getShuffledIndices();
        if (shuffled.length === 0) core.generateShuffle();
        let pos = (core.getShuffledPos() - 1 + shuffled.length) % shuffled.length;
        core.setShuffledPos(pos);
        core.playByIndex(shuffled[pos]);
      } else {
        const currentIdx = core.getCurrentIndex();
        const newIdx = (currentIdx - 1 + list.length) % list.length;
        core.playByIndex(newIdx);
      }
    });

    // 下一首
    nextBtn.addEventListener('click', () => {
      if (core.getNextQueueTrack()) {
        const track = core.getNextQueueTrack();
        core.setNextQueueTrack(null);
        const list = core.getDisplayList();
        const idx = list.findIndex(t => t.url === track.url);
        if (idx !== -1) core.playByIndex(idx);
        else core.playByIndex(0);
        return;
      }

      const list = core.getDisplayList();
      if (list.length === 0 || !core.getNowPlaying()) return;

      if (core.getPlayMode() === 'random') {
        const shuffled = core.getShuffledIndices();
        if (shuffled.length === 0) core.generateShuffle();
        let pos = (core.getShuffledPos() + 1) % shuffled.length;
        core.setShuffledPos(pos);
        core.playByIndex(shuffled[pos]);
      } else {
        const currentIdx = core.getCurrentIndex();
        const newIdx = (currentIdx + 1) % list.length;
        core.playByIndex(newIdx);
      }
    });

    // 进度条点击
    progressBarBg.addEventListener('click', (e) => {
      const rect = progressBarBg.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      if (core.getAudio().duration) {
        core.getAudio().currentTime = percent * core.getAudio().duration;
      }
    });

    // 模式切换
    modeBtn.addEventListener('click', () => {
      let mode = core.getPlayMode();
      if (mode === 'order') mode = 'single';
      else if (mode === 'single') mode = 'random';
      else mode = 'order';
      core.setPlayMode(mode);
      if (mode === 'random') {
        const currentIdx = core.getCurrentIndex();
        core.generateShuffle(currentIdx >= 0 ? currentIdx : 0);
      }
      updateModeButton();
    });

    // 音量控制
    volumeBar = document.querySelector('.volume-bar');
    volumeLevel = document.querySelector('.volume-level');
    volumeIndicator = document.getElementById('volume-indicator');
    if (volumeBar && volumeLevel) {
      core.setVolume(0.7);
      volumeLevel.style.width = '70%';

      volumeBar.addEventListener('click', (e) => {
        const rect = volumeBar.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const vol = x / rect.width;
        core.setVolume(vol);
        volumeLevel.style.width = (vol * 100) + '%';
      });

      let isDragging = false;
      volumeBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = volumeBar.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const vol = x / rect.width;
        core.setVolume(vol);
        volumeLevel.style.width = (vol * 100) + '%';
      });

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = volumeBar.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const vol = x / rect.width;
        core.setVolume(vol);
        volumeLevel.style.width = (vol * 100) + '%';
      });

      document.addEventListener('mouseup', () => isDragging = false);

      volumeIndicator.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newVol = core.getAudio().volume + delta;
        core.setVolume(newVol);
        volumeLevel.style.width = (newVol * 100) + '%';
      }, { passive: false });
    }

    updateModeButton();
  }
  // 构建最终暴露的 player 对象（包含 core 的所有方法 + init）
  window.player = {
    init,
    setDisplayList: core.setDisplayList,
    playByIndex: core.playByIndex,
    queueToNext: core.queueToNext,
    getDisplayList: core.getDisplayList,
    getCurrentIndex: core.getCurrentIndex,
    getNowPlaying: core.getNowPlaying
  };
})();