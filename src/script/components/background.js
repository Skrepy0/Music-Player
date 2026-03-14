(async function initBackground() {
  const carousel = document.getElementById('backgroundCarousel');
  if (!carousel) return;

  try {
    const response = await fetch('/api/background-list');
    if (!response.ok) throw new Error('无法获取背景图片列表');
    const images = await response.json();

    if (images.length === 0) {
      carousel.style.background = '#1a1f28';
      return;
    }

    images.forEach((imgUrl, index) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.backgroundImage = `url('${imgUrl}')`;
      carousel.appendChild(slide);
    });

    if (images.length === 1) {
      carousel.firstChild.style.opacity = 1;
      carousel.firstChild.style.animation = 'none';
    }
  } catch (err) {
    console.error('背景加载失败:', err);
    carousel.style.background = '#1a1f28';
  }
})();