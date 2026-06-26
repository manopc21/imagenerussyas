const track = document.getElementById("carousel-track");
const counter = document.getElementById("counter");
const dots = document.getElementById("dots");
const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const closeModalButton = document.getElementById("close-modal");
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const prevButton = document.getElementById("prev-btn");
const nextButton = document.getElementById("next-btn");
const expandButton = document.getElementById("expand-btn");

let images = [];
let currentIndex = 0;
let intervalId = null;
let isModalOpen = false;
let zoomLevel = 1;
let startX = 0;
let isDragging = false;
let modalDragStartX = 0;
let modalDragStartY = 0;
let isModalDragging = false;
let modalTranslateX = 0;
let modalTranslateY = 0;

function renderDots() {
  dots.innerHTML = "";
  images.forEach((_, index) => {
    const dot = document.createElement("span");
    dot.className = `dot${index === currentIndex ? " active" : ""}`;
    dots.appendChild(dot);
  });
}

function buildImagePath(fileName) {
  return `./your_posts/${fileName}`;
}

function renderCarousel() {
  track.innerHTML = "";
  track.style.transform = `translateX(-${currentIndex * 100}%)`;

  images.forEach((fileName) => {
    const item = document.createElement("div");
    item.className = "carousel-item";

    const img = document.createElement("img");
    img.src = buildImagePath(fileName);
    img.alt = fileName;
    img.loading = "lazy";
    img.style.cursor = "zoom-in";
    img.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openImageModal(fileName);
    });
    img.onerror = () => {
      img.src = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80";
      img.alt = "Imagem indisponível";
      console.warn("Algumas imagens não foram encontradas; exibindo fallback.");
    };

    item.appendChild(img);
    track.appendChild(item);
  });

  counter.textContent = `${images.length ? currentIndex + 1 : 0}/${images.length}`;
  renderDots();
}

function startCarousel() {
  clearInterval(intervalId);
  if (!images.length || isModalOpen) return;

  intervalId = setInterval(() => {
    if (isModalOpen) return;
    currentIndex = (currentIndex + 1) % images.length;
    renderCarousel();
  }, 4000);
}

function goToNextImage() {
  if (!images.length || isModalOpen) return;
  currentIndex = (currentIndex + 1) % images.length;
  renderCarousel();
}

function goToPreviousImage() {
  if (!images.length || isModalOpen) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  renderCarousel();
}

function updateZoom() {
  modalImage.style.transform = `translate(${modalTranslateX}px, ${modalTranslateY}px) scale(${zoomLevel})`;
}

function handleZoom(delta, originX = 50, originY = 50) {
  zoomLevel = Math.max(1, Math.min(3, zoomLevel + delta));
  modalImage.style.transformOrigin = `${originX}% ${originY}%`;
  updateZoom();
}

function resetZoom() {
  zoomLevel = 1;
  modalTranslateX = 0;
  modalTranslateY = 0;
  updateZoom();
}

function openImageModal(fileName) {
  isModalOpen = true;
  resetZoom();
  modalImage.src = buildImagePath(fileName);
  modalImage.alt = fileName;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  clearInterval(intervalId);
  document.body.style.overflow = "hidden";
}

function openImageFromModal(indexDelta) {
  if (!images.length) return;
  currentIndex = (currentIndex + indexDelta + images.length) % images.length;
  modalImage.src = buildImagePath(images[currentIndex]);
  modalImage.alt = images[currentIndex];
  resetZoom();
}

function closeImageModal() {
  isModalOpen = false;
  resetZoom();
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  startCarousel();
}

function loadImages() {
  if (typeof imageFiles !== "undefined" && Array.isArray(imageFiles) && imageFiles.length > 0) {
    images = imageFiles;
    renderCarousel();
    startCarousel();
    return;
  }

  const fallbackImages = [
    "122189498780452812.jpg",
    "122189498792452812.jpg",
    "122189498846452812.jpg"
  ];

  images = fallbackImages;
  renderCarousel();
  startCarousel();
}

prevButton.addEventListener("click", () => {
  goToPreviousImage();
});

expandButton.addEventListener("click", () => {
  if (!images.length) return;
  openImageModal(images[currentIndex]);
});

nextButton.addEventListener("click", () => {
  goToNextImage();
});

zoomInButton.addEventListener("click", () => handleZoom(0.25, 50, 50));

zoomOutButton.addEventListener("click", () => handleZoom(-0.25, 50, 50));

modal.addEventListener("wheel", (event) => {
  if (!isModalOpen) return;
  event.preventDefault();
  const rect = modalImage.getBoundingClientRect();
  const originX = ((event.clientX - rect.left) / rect.width) * 100;
  const originY = ((event.clientY - rect.top) / rect.height) * 100;
  handleZoom(event.deltaY < 0 ? 0.1 : -0.1, originX, originY);
}, { passive: false });

let touchStartY = 0;
let touchStartX = 0;
let touchStartZoom = 1;

modal.addEventListener("touchstart", (event) => {
  if (event.touches.length === 2) {
    touchStartZoom = zoomLevel;
    const [first, second] = event.touches;
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    event.currentTarget.dataset.touchDistance = distance.toString();
  } else if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}, { passive: true });

modal.addEventListener("touchmove", (event) => {
  if (!isModalOpen) return;

  if (event.touches.length === 2) {
    event.preventDefault();
    const [first, second] = event.touches;
    const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
    const startDistance = Number(event.currentTarget.dataset.touchDistance || 1);
    const ratio = distance / startDistance;
    zoomLevel = Math.max(1, Math.min(3, touchStartZoom * ratio));
    updateZoom();
  }
}, { passive: false });

modal.addEventListener("touchend", () => {
  delete modal.dataset.touchDistance;
});

track.addEventListener("pointerdown", (event) => {
  if (isModalOpen) return;
  startX = event.clientX;
  isDragging = true;
  track.style.transition = "none";
});

track.addEventListener("pointermove", (event) => {
  if (!isDragging || isModalOpen) return;
  const deltaX = event.clientX - startX;
  track.style.transform = `translateX(calc(-${currentIndex * 100}% + ${deltaX}px))`;
});

track.addEventListener("pointerup", (event) => {
  if (!isDragging || isModalOpen) return;
  const deltaX = event.clientX - startX;
  track.style.transition = "transform 0.3s ease";
  if (deltaX < -70) {
    goToNextImage();
  } else if (deltaX > 70) {
    goToPreviousImage();
  } else {
    renderCarousel();
  }
  isDragging = false;
});

track.addEventListener("pointerleave", () => {
  if (isDragging && !isModalOpen) {
    track.style.transition = "transform 0.3s ease";
    renderCarousel();
    isDragging = false;
  }
});

closeModalButton.addEventListener("click", closeImageModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeImageModal();
  }
});

modalImage.addEventListener("click", (event) => {
  event.stopPropagation();
  event.preventDefault();
});

modalImage.addEventListener("pointerdown", (event) => {
  if (zoomLevel <= 1) return;
  event.preventDefault();
  event.stopPropagation();
  modalDragStartX = event.clientX;
  modalDragStartY = event.clientY;
  isModalDragging = true;
  modalImage.style.transition = "none";
});

modalImage.addEventListener("pointermove", (event) => {
  if (!isModalDragging || zoomLevel <= 1) return;
  event.preventDefault();
  const deltaX = event.clientX - modalDragStartX;
  const deltaY = event.clientY - modalDragStartY;
  modalTranslateX += deltaX;
  modalTranslateY += deltaY;
  modalDragStartX = event.clientX;
  modalDragStartY = event.clientY;
  updateZoom();
});

modalImage.addEventListener("pointerup", () => {
  if (!isModalDragging || zoomLevel <= 1) return;
  modalImage.style.transition = "transform 0.2s ease";
  updateZoom();
  isModalDragging = false;
});

modalImage.addEventListener("pointercancel", () => {
  if (isModalDragging && zoomLevel > 1) {
    modalImage.style.transition = "transform 0.2s ease";
    updateZoom();
    isModalDragging = false;
  }
});

modalImage.addEventListener("pointerleave", () => {
  if (isModalDragging && zoomLevel > 1) {
    modalImage.style.transition = "transform 0.2s ease";
    updateZoom();
    isModalDragging = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isModalOpen) {
    closeImageModal();
  }
});

loadImages();
