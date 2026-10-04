(() => {
  const grid = document.querySelector("#gallery-grid");
  const slider = document.querySelector("#gallery-size");
  const viewer = document.querySelector("[data-gallery-viewer]");
  if (!grid || !slider || !viewer) return;

  const items = [...grid.querySelectorAll("[data-gallery-item]")];
  const image = viewer.querySelector("[data-gallery-image]");
  const title = viewer.querySelector("[data-gallery-title]");
  const position = viewer.querySelector("[data-gallery-position]");
  const status = viewer.querySelector("[data-gallery-status]");
  const previous = viewer.querySelector("[data-gallery-previous]");
  const next = viewer.querySelector("[data-gallery-next]");
  let currentIndex = -1;
  let opener = null;
  let touchStart = null;

  // Remember the preferred thumbnail size, including after returning from an article.
  try {
    const storedSize = Number(localStorage.getItem("doubling-gallery-size"));
    if (storedSize >= 90 && storedSize <= 370) slider.value = String(storedSize);
  } catch { /* Storage can be unavailable in private browsing. */ }

  function resizeGrid() {
    const width = grid.clientWidth;
    if (!width) return;
    const gap = 12;
    const size = Number(slider.value);
    const targetSize = size * (width < 560 ? (width - gap) / 340 : 1);
    const columns = Math.max(1, Math.floor((width + gap) / (targetSize + gap)));
    grid.style.setProperty("--gallery-columns", String(columns));
  }

  function saveSize() {
    try { localStorage.setItem("doubling-gallery-size", slider.value); }
    catch { /* Resizing still works without storage. */ }
  }

  slider.addEventListener("input", resizeGrid);
  slider.addEventListener("change", saveSize);
  document.querySelectorAll("[data-gallery-step]").forEach((button) => {
    button.addEventListener("click", () => {
      slider.value = String(Math.max(90, Math.min(370, Number(slider.value) + Number(button.dataset.galleryStep))));
      resizeGrid();
      saveSize();
    });
  });
  new ResizeObserver(resizeGrid).observe(grid);
  resizeGrid();

  function showImage(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    const item = items[index];
    image.classList.add("is-loading");
    status.textContent = "正在加载图片…";
    title.textContent = item.dataset.title;
    position.textContent = `${index + 1} / ${items.length}`;
    previous.disabled = index === 0;
    next.disabled = index === items.length - 1;
    image.alt = item.dataset.title;
    image.src = item.dataset.original;
    if (image.complete && image.naturalWidth) {
      image.classList.remove("is-loading");
      status.textContent = "";
    }
  }

  image.addEventListener("load", () => {
    image.classList.remove("is-loading");
    status.textContent = "";
  });
  image.addEventListener("error", () => {
    image.classList.add("is-loading");
    status.textContent = "图片暂时无法加载，请关闭后重试。";
  });

  items.forEach((item, index) => item.addEventListener("click", () => {
    opener = item;
    showImage(index);
    viewer.showModal();
    document.body.classList.add("gallery-viewer-open");
  }));
  viewer.querySelector("[data-gallery-close]").addEventListener("click", () => viewer.close());
  previous.addEventListener("click", () => showImage(currentIndex - 1));
  next.addEventListener("click", () => showImage(currentIndex + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => {
    document.body.classList.remove("gallery-viewer-open");
    image.removeAttribute("src");
    image.classList.add("is-loading");
    touchStart = null;
    opener?.focus({ preventScroll: true });
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showImage(currentIndex - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); showImage(currentIndex + 1); }
  });
  viewer.addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  viewer.addEventListener("touchend", (event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      showImage(currentIndex + (deltaX > 0 ? -1 : 1));
    }
    touchStart = null;
  }, { passive: true });
})();
