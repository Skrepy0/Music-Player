(function () {
  const audio = new Audio();
  let displayList = [];
  let nowPlayingTrack = null;
  let isPlaying = false;
  let playMode = 'order';
  let nextQueueTrack = null;

  // 随机播放相关
  let shuffledIndices = [];
  let shuffledPos = 0;

  // 回调函数，由 UI 层设置
  let onProgress = null;
  let onPlaylistChange = null;
  let onNowPlayingChange = null;

  // 音量设置
  function setVolume(vol) {
    vol = Math.max(0, Math.min(1, vol));
    audio.volume = vol;
  }

  // 生成随机播放顺序（洗牌）
  function generateShuffle(startIndex = null) {
    if (displayList.length === 0) {
      shuffledIndices = [];
      shuffledPos = 0;
      return;
    }
    const indices = Array.from({length: displayList.length}, (_, i) => i);
    // Fisher-Yates 洗牌
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    if (startIndex !== null && displayList[startIndex]) {
      const pos = indices.indexOf(startIndex);
      if (pos !== -1) {
        indices.splice(pos, 1);
        indices.unshift(startIndex);
      }
    }
    shuffledIndices = indices;
    shuffledPos = 0;
  }

  // 播放当前歌曲（无论模式）
  function playCurrent() {
    loadCurrent();
    audio.play().then(() => {
      isPlaying = true;
    }).catch(e => console.warn('播放被阻止', e));

    if (onNowPlayingChange) onNowPlayingChange(nowPlayingTrack);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nowPlayingTrack.title || "未知歌曲",
        artist: nowPlayingTrack.artist || "未知艺术家",
        album: "本地音乐",
        artwork: [
          {src: nowPlayingTrack.url, sizes: "500x500", type: "image/png"},
        ]
      });
      const setHanders = () => {
        function playAndPause() {
          if (window.player && window.player.updatePauseBtn) {
            let playPauseBtn = document.getElementById('playPauseBtn');
            playPauseBtn.click();
          }
        }

        navigator.mediaSession.setActionHandler('play', playAndPause);
        navigator.mediaSession.setActionHandler('pause', playAndPause);
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (window.player) {
            let prevBtn = document.getElementById('prevBtn');
            prevBtn.click();
          }
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (window.player) {
            let nextBtn = document.getElementById('nextBtn');
            nextBtn.click();
          }
        });
      }
      setHanders();
    }
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
      if (shuffledIndices.length === 0) generateShuffle();
      shuffledPos++;
      if (shuffledPos >= shuffledIndices.length) {
        generateShuffle();
      }
      nowPlayingTrack = displayList[shuffledIndices[shuffledPos]];
      playCurrent();
    } else {
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

  // 公共 API
  window.playerCore = {
    // 状态访问
    getAudio: () => audio,
    getDisplayList: () => displayList,
    getNowPlaying: () => nowPlayingTrack,
    getPlayMode: () => playMode,
    isPlaying: () => isPlaying,
    getNextQueueTrack: () => nextQueueTrack,
    getShuffledIndices: () => shuffledIndices,
    getShuffledPos: () => shuffledPos,

    // 回调设置
    setCallbacks: (callbacks) => {
      onProgress = callbacks.onProgress;
      onPlaylistChange = callbacks.onPlaylistChange;
      onNowPlayingChange = callbacks.onNowPlayingChange;
    },
    setIsPlaying: (playing) => {
      isPlaying = playing;
    },
    setPlayMode: (mode) => {
      playMode = mode;
    },
    setShuffledPos: (pos) => {
      shuffledPos = pos;
    },
    setNextQueueTrack: (track) => {
      nextQueueTrack = track;
    },

    // 核心操作
    setVolume,
    generateShuffle,
    // playCurrent,
    // loadCurrent,
    handleEnded,

    // 列表管理
    setDisplayList: function (newList) {
      displayList = newList;
      if (playMode === 'random') {
        const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : 0;
        generateShuffle(currentIdx >= 0 ? currentIdx : 0);
      }
      if (onPlaylistChange) {
        const currentIdx = nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : -1;
        onPlaylistChange(displayList, currentIdx);
      }
    },

    playByIndex: function (index) {
      if (index >= 0 && index < displayList.length) {
        nowPlayingTrack = displayList[index];
        if (playMode === 'random') generateShuffle(index);
        playCurrent();
      }
    },

    queueToNext: function (trackIndex) {
      if (trackIndex >= 0 && trackIndex < displayList.length) {
        nextQueueTrack = displayList[trackIndex];
      }
    },

    getCurrentIndex: function () {
      return nowPlayingTrack ? displayList.findIndex(t => t.url === nowPlayingTrack.url) : -1;
    }
  };
})();