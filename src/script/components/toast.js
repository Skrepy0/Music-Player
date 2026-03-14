function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msgEl = document.getElementById('toast-message');

  // 移除所有类型类，添加当前类型
  toast.classList.remove('success', 'warning', 'error', 'info', 'show');
  toast.classList.add(type);

  // 设置图标（使用简单字符，也可以替换为 emoji）
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };
  icon.textContent = icons[type] || 'ℹ️';

  // 设置消息文本
  msgEl.textContent = msg;

  // 显示 toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 2.5秒后隐藏
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// 将函数暴露为全局
window.showToast = showToast;