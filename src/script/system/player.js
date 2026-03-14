(function() {
  const audio = new Audio();
  let displayList = [];
  let nowPlayingTrack = null;
  let isPlaying = false;
  let playMode = 'order';
  let nextQueueTrack = null;

  let onProgress = null;
  let onPlaylistChange = null;
  let onNowPlayingChange = null;

  let playPauseBtn, prevBtn, nextBtn, modeBtn, progressBarBg, progressFill, vinylRecord;
  let volumeBar, volumeLevel;

  function updateModeButton() {
    const icons = { order: '🔁', single: '🔂', random: '🔀' };
    const names = { order: '顺序', single: '单曲', random: '随机' };
    modeBtn.innerHTML = `<span>${icons[playMode]}</span> ${names[playMode]}`;
  }

  function setVolume(vol) {
    vol = Math.max(0, Math.min(1, vol));
    audio.volume = vol;
    if (volumeLevel) {
      volumeLevel.style.width = (vol * 100) + '%';
    }
  }

  function playCurrent() {
    if (!nowPlayingTrack) {
      if (displayList.length > 0) {
        nowPlayingTrack = displayList[0];
      } else {
        return;
      }
    }
    if (!audio.src.includes(nowPlayingTrack.url)) {
      audio.src = nowPlayingTrack.url;
      audio.load();
    }
    audio.play().then(() => {
      isPlaying = true;
      playPauseBtn.innerHTML = '⏸';
      vinylRecord.style.animationPlayState = 'running';
    }).catch(e => console.warn('播放被阻止', e));

    if (onNowPlayingChange) onNowPlayingChange(nowPlayingTrack);
  }

  function loadCurrent() {
    if (!nowPlayingTrack) {
      if (displayList.length > 0) {
        nowPlayingTrack = displayList[0];
      } else {
        return;
      }
    }
    if (!audio.src.includes(nowPlayingTrack.url)) {
      audio.src = nowPlayingTrack.url;
      audio.load();
    }
    if (onNowPlayingChange) onNowPlayingChange(nowPlayingTrack);
  }

  function handleEnded() {
    if (nextQueueTrack) {
      nowPlayingTrack = nextQueueTrack;
      nextQueueTrack = null;
      playCurrent();
      return;
    }

    if (playMode === 'single') {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn(e));
      return;
    }

    if (displayList.length === 0) return;

    const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack?.url);
    if (currentIdx === -1) {
      nowPlayingTrack = displayList[0];
    } else {
      let nextIdx;
      if (playMode === 'random') {
        do {
          nextIdx = Math.floor(Math.random() * displayList.length);
        } while (displayList.length > 1 && nextIdx === currentIdx);
      } else {
        nextIdx = (currentIdx + 1) % displayList.length;
      }
      nowPlayingTrack = displayList[nextIdx];
    }
    playCurrent();
  }

  window.player = {
    init: function(callbacks) {
      onProgress = callbacks.onProgress || null;
      onPlaylistChange = callbacks.onPlaylistChange || null;
      onNowPlayingChange = callbacks.onNowPlayingChange || null;

      playPauseBtn = document.getElementById('playPauseBtn');
      prevBtn = document.getElementById('prevBtn');
      nextBtn = document.getElementById('nextBtn');
      modeBtn = document.getElementById('modeBtn');
      progressBarBg = document.getElementById('progressBarBg');
      progressFill = document.getElementById('progressFill');
      vinylRecord = document.getElementById('vinylRecord');

      audio.addEventListener('timeupdate', () => {
        if (audio.duration && onProgress) {
          onProgress(audio.currentTime, audio.duration);
        }
      });

      audio.addEventListener('loadedmetadata', () => {
        if (nowPlayingTrack) {
          nowPlayingTrack.durationFormatted = formatTime(audio.duration);
          if (onPlaylistChange) onPlaylistChange(displayList, displayList.findIndex(t => t.url === nowPlayingTrack?.url));
        }
      });

      audio.addEventListener('ended', handleEnded);

      playPauseBtn.addEventListener('click', () => {
        if (!nowPlayingTrack && displayList.length > 0) {
          nowPlayingTrack = displayList[0];
        }
        if (!nowPlayingTrack) return;

        if (isPlaying) {
          audio.pause();
          isPlaying = false;
          playPauseBtn.innerHTML = '▶';
          vinylRecord.style.animationPlayState = 'paused';
        } else {
          audio.play().then(() => {
            isPlaying = true;
            playPauseBtn.innerHTML = '⏸';
            vinylRecord.style.animationPlayState = 'running';
          }).catch(e => showToast('播放失败: ' + e,"error"));
        }
      });

      prevBtn.addEventListener('click', () => {
        if (displayList.length === 0 || !nowPlayingTrack) return;
        const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack.url);
        if (currentIdx === -1) {
          nowPlayingTrack = displayList[0];
        } else {
          let prevIdx = (currentIdx - 1 + displayList.length) % displayList.length;
          nowPlayingTrack = displayList[prevIdx];
        }
        playCurrent();
      });

      nextBtn.addEventListener('click', () => {
        if (displayList.length === 0 || !nowPlayingTrack) return;
        if (nextQueueTrack) {
          nowPlayingTrack = nextQueueTrack;
          nextQueueTrack = null;
          playCurrent();
          return;
        }
        const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack.url);
        if (currentIdx === -1) {
          nowPlayingTrack = displayList[0];
        } else {
          let nextIdx = (currentIdx + 1) % displayList.length;
          nowPlayingTrack = displayList[nextIdx];
        }
        playCurrent();
      });

      progressBarBg.addEventListener('click', (e) => {
        const rect = progressBarBg.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (audio.duration) audio.currentTime = percent * audio.duration;
      });

      modeBtn.addEventListener('click', () => {
        if (playMode === 'order') playMode = 'single';
        else if (playMode === 'single') playMode = 'random';
        else playMode = 'order';
        updateModeButton();
      });

      volumeBar = document.querySelector('.volume-bar');
      volumeLevel = document.querySelector('.volume-level');
      if (volumeBar && volumeLevel) {
        setVolume(0.7);
        volumeBar.addEventListener('click', (e) => {
          const rect = volumeBar.getBoundingClientRect();
          let x = e.clientX - rect.left;
          x = Math.max(0, Math.min(rect.width, x));
          setVolume(x / rect.width);
        });
        let isDragging = false;
        volumeBar.addEventListener('mousedown', (e) => {
          isDragging = true;
          const rect = volumeBar.getBoundingClientRect();
          let x = e.clientX - rect.left;
          x = Math.max(0, Math.min(rect.width, x));
          setVolume(x / rect.width);
        });
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const rect = volumeBar.getBoundingClientRect();
          let x = e.clientX - rect.left;
          x = Math.max(0, Math.min(rect.width, x));
          setVolume(x / rect.width);
        });
        document.addEventListener('mouseup', () => isDragging = false);
        volumeBar.addEventListener('wheel', (e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          setVolume(audio.volume + delta);
        }, { passive: false });
      }

      updateModeButton();
    },

    setDisplayList: function(newList) {
      displayList = newList;
      if (onPlaylistChange) {
        const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : -1;
        onPlaylistChange(displayList, currentIdx);
      }
    },

    playByIndex: function(index) {
      if (index >= 0 && index < displayList.length) {
        nowPlayingTrack = displayList[index];
        playCurrent();
      }
    },

    queueToNext: function(trackIndex) {
      if (trackIndex >= 0 && trackIndex < displayList.length) {
        nextQueueTrack = displayList[trackIndex];
      }
    },

    getDisplayList: function() {
      return displayList;
    },

    getCurrentIndex: function() {
      return nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : -1;
    },

    getNowPlaying: function() {
      return nowPlayingTrack;
    }
  };
})();