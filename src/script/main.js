(async function main() {
  try {
    await window.init();
  } catch (err) {
    console.error('加载失败:', err);
    showToast('加载失败:'+err,'error');
    document.getElementById('playlistContainer').innerHTML = `<div class="error-msg">❌ 无法连接服务器<br>请确认服务器已启动 (node server.js)</div>`;
  }
})();