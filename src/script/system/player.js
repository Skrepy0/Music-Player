(function() {
  const audio = new Audio();
  let displayList = [];
  let nowPlayingTrack = null;
  let isPlaying = false;
  let playMode = 'order';
  let nextQueueTrack = null;

  // 随机播放相关
  let shuffledIndices = [];      // 打乱后的索引数组
  let shuffledPos = 0;           // 当前在 shuffledIndices 中的位置

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

  // 生成随机播放顺序（洗牌）
  function generateShuffle(startIndex = null) {
    if (displayList.length === 0) {
      shuffledIndices = [];
      shuffledPos = 0;
      return;
    }
    const indices = Array.from({ length: displayList.length }, (_, i) => i);
    // Fisher-Yates 洗牌
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    if (startIndex !== null && displayList[startIndex]) {
      // 将 startIndex 移到开头，其余保持随机
      const pos = indices.indexOf(startIndex);
      if (pos !== -1) {
        indices.splice(pos, 1);
        indices.unshift(startIndex);
      }
    }
    shuffledIndices = indices;
    shuffledPos = 0;
  }

  // 获取当前随机索引（用于播放）
  function getCurrentShuffledTrack() {
    if (shuffledIndices.length === 0) return null;
    return displayList[shuffledIndices[shuffledPos]];
  }

  // 播放当前歌曲（无论模式）
  function playCurrent() {
    if (!nowPlayingTrack) {
      if (displayList.length > 0) {
        nowPlayingTrack = displayList[0];
        if (playMode === 'random') generateShuffle(0);
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
        if (playMode === 'random') generateShuffle(0);
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

    if (playMode === 'random') {
      // 随机模式：移动到 shuffled 中的下一首
      if (shuffledIndices.length === 0) {
        generateShuffle();
      }
      shuffledPos++;
      if (shuffledPos >= shuffledIndices.length) {
        // 播放完一遍，重新洗牌
        generateShuffle();
      }
      nowPlayingTrack = displayList[shuffledIndices[shuffledPos]];
      playCurrent();
    } else {
      // 顺序模式
      const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack?.url);
      if (currentIdx === -1) {
        nowPlayingTrack = displayList[0];
      } else {
        let nextIdx = (currentIdx + 1) % displayList.length;
        nowPlayingTrack = displayList[nextIdx];
      }
      playCurrent();
    }
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
          if (playMode === 'random') generateShuffle(0);
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
          }).catch(e => showToast('播放失败: ' + e, "error"));
        }
      });

      prevBtn.addEventListener('click', () => {
        if (displayList.length === 0 || !nowPlayingTrack) return;

        if (playMode === 'random') {
          // 随机模式：移动到 shuffled 中的上一首
          if (shuffledIndices.length === 0) generateShuffle();
          shuffledPos = (shuffledPos - 1 + shuffledIndices.length) % shuffledIndices.length;
          nowPlayingTrack = displayList[shuffledIndices[shuffledPos]];
          playCurrent();
        } else {
          const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack.url);
          if (currentIdx === -1) {
            nowPlayingTrack = displayList[0];
          } else {
            let prevIdx = (currentIdx - 1 + displayList.length) % displayList.length;
            nowPlayingTrack = displayList[prevIdx];
          }
          playCurrent();
        }
      });

      nextBtn.addEventListener('click', () => {
        if (displayList.length === 0 || !nowPlayingTrack) return;

        if (nextQueueTrack) {
          nowPlayingTrack = nextQueueTrack;
          nextQueueTrack = null;
          playCurrent();
          return;
        }

        if (playMode === 'random') {
          // 随机模式：移动到 shuffled 中的下一首
          if (shuffledIndices.length === 0) generateShuffle();
          shuffledPos = (shuffledPos + 1) % shuffledIndices.length;
          nowPlayingTrack = displayList[shuffledIndices[shuffledPos]];
          playCurrent();
        } else {
          const currentIdx = displayList.findIndex(t => t.url === nowPlayingTrack.url);
          if (currentIdx === -1) {
            nowPlayingTrack = displayList[0];
          } else {
            let nextIdx = (currentIdx + 1) % displayList.length;
            nowPlayingTrack = displayList[nextIdx];
          }
          playCurrent();
        }
      });

      progressBarBg.addEventListener('click', (e) => {
        const rect = progressBarBg.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        if (audio.duration) audio.currentTime = percent * audio.duration;
      });

      modeBtn.addEventListener('click', () => {
        if (playMode === 'order') {
          playMode = 'single';
        } else if (playMode === 'single') {
          playMode = 'random';
          // 进入随机模式时，根据当前歌曲生成随机顺序
          const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : 0;
          generateShuffle(currentIdx >= 0 ? currentIdx : 0);
        } else {
          playMode = 'order';
        }
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
      if (playMode === 'random') {
        // 列表变化后重新生成随机顺序
        const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : 0;
        generateShuffle(currentIdx >= 0 ? currentIdx : 0);
      }
      if (onPlaylistChange) {
        const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : -1;
        onPlaylistChange(displayList, currentIdx);
      }
    },

    playByIndex: function(index) {
      if (index >= 0 && index < displayList.length) {
        nowPlayingTrack = displayList[index];
        if (playMode === 'random') {
          // 手动点击时，以该歌曲为起点重新洗牌
          generateShuffle(index);
        }
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