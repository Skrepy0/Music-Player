const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // 新增：用于执行打开浏览器的命令
const app = express();
const PORT = 3000;

const musicDir = path.join(__dirname, 'resources', 'music');
const backgroundDir = path.join(__dirname, 'resources', 'background');

// 静态资源
app.use('/music', express.static(musicDir));
app.use('/background', express.static(backgroundDir));

// API：获取音乐列表
app.get('/api/music-list', (req, res) => {
  fs.readdir(musicDir, (err, files) => {
    if (err) {
      console.error('读取音乐目录失败:', err);
      return res.status(500).json({ error: '无法读取音乐目录' });
    }
    const audioExtensions = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg'];
    const musicFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return audioExtensions.includes(ext);
    });
    res.json(musicFiles);
  });
});

// API：获取背景图片列表
app.get('/api/background-list', (req, res) => {
  fs.readdir(backgroundDir, (err, files) => {
    if (err) {
      console.error('读取背景目录失败:', err);
      return res.status(500).json({ error: '无法读取背景目录' });
    }
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    }).map(file => `/background/${encodeURIComponent(file)}`);
    res.json(imageFiles);
  });
});

// 提供前端静态文件
app.use(express.static(__dirname));

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 本地音乐播放器已启动！
    ➜ 访问: http://localhost:${PORT}
    ➜ 音乐目录: ${musicDir}
    ➜ 背景目录: ${backgroundDir}`);

  // 自动在默认浏览器中打开页面
  const url = `http://localhost:${PORT}`;
  let command;
  switch (process.platform) {
    case 'win32':  // Windows
      command = `start ${url}`;
      break;
    case 'darwin': // macOS
      command = `open ${url}`;
      break;
    default:       // Linux 及其他 Unix-like
      command = `xdg-open ${url}`;
      break;
  }
  exec(command, (err) => {
    if (err) {
      console.log('无法自动打开浏览器，请手动访问上述地址。');
    }
  });
});