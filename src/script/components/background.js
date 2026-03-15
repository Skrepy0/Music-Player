(async function initBackground() {
  const carousel = document.getElementById('backgroundCarousel');
  if (!carousel) return;

  try {
    const response = await fetch('/api/background-list');
    if (!response.ok) throw new Error('无法获取背景图片列表');
    let images = await response.json();

    if (images.length === 0) {
      carousel.style.background = '#1a1f28';
      return;
    }

    // 随机打乱图片顺序（关键！）
    images = images.sort(() => Math.random() - 0.5);

    // 预加载图片（可选，避免动画卡顿）
    await Promise.all(images.map(imgUrl => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => {
          console.warn(`图片预加载失败: ${imgUrl}`);
          resolve();
        };
        img.src = imgUrl;
      });
    }));

    // 创建幻灯片
    images.forEach((imgUrl, index) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.style.backgroundImage = `url('${imgUrl}')`;

      slide.onerror = function() {
        this.style.backgroundImage = 'none';
        this.style.backgroundColor = '#2a2f3a';
        console.warn(`图片加载失败: ${imgUrl}`);
      };

      carousel.appendChild(slide);
    });

    const slides = carousel.querySelectorAll('.slide');
    const total = slides.length;

    if (total === 1) {
      slides[0].style.opacity = 1;
      slides[0].style.animation = 'none';
    } else {
      const displayTime = 16; // 可调整
      const totalTime = total * displayTime;

      slides.forEach((slide, idx) => {
        slide.style.animation = `carousel ${totalTime}s infinite`;
        slide.style.animationDelay = `${idx * displayTime}s`;
      });
    }

  } catch (err) {
    console.error('背景加载失败:', err);
    carousel.style.background = '#1a1f28';
  }
})();