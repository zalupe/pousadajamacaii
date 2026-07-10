const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const guestFilter = document.querySelector("[data-guest-filter]");
const roomCards = [...document.querySelectorAll("[data-capacity]")];
const filterFeedback = document.querySelector("[data-filter-feedback]");
const noResults = document.querySelector("[data-no-results]");
const findButton = document.querySelector("[data-find-button]");

function setHeaderState() {
  header?.classList.toggle("scrolled", window.scrollY > 24);
}

function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  nav?.classList.remove("open");
  header?.classList.remove("menu-active");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  nav?.classList.toggle("open", !open);
  header?.classList.toggle("menu-active", !open);
  document.body.classList.toggle("menu-open", !open);
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

function applyGuestFilter() {
  if (!guestFilter) return;

  const selected = guestFilter.value;
  const requestedGuests = Number(selected);
  let visibleCount = 0;

  roomCards.forEach((card) => {
    const capacity = Number(card.dataset.capacity);
    const visible = selected === "all" || capacity >= requestedGuests;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  noResults.hidden = visibleCount !== 0;

  if (selected === "all") {
    filterFeedback.textContent = "Mostrando as 7 suítes disponíveis.";
  } else {
    const label = requestedGuests === 1 ? "1 hóspede" : `${requestedGuests} hóspedes`;
    filterFeedback.textContent = `${visibleCount} ${visibleCount === 1 ? "suíte acomoda" : "suítes acomodam"} ${label}.`;
  }
}

guestFilter?.addEventListener("change", applyGuestFilter);

findButton?.addEventListener("click", () => {
  applyGuestFilter();
});

document.querySelectorAll("[data-contact]").forEach((link) => {
  link.addEventListener("click", () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "contact_click",
      contact_channel: link.dataset.contact,
      contact_context: link.dataset.contactContext || "general",
      accommodation: link.dataset.room || "Não informado",
      destination_url: link.href
    });
  });
});

const galleryItems = [...document.querySelectorAll("[data-gallery-item]")];
const galleryViewport = document.querySelector("[data-gallery-viewport]");
const galleryCounter = document.querySelector("[data-gallery-counter]");
const galleryPrev = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCounter = document.querySelector("[data-lightbox-counter]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeCarouselIndex = 0;
let activeGalleryIndex = 0;
let lastGalleryTrigger = null;
let galleryScrollFrame = null;
let galleryDragPointer = null;
let galleryDragStartX = 0;
let galleryDragStartScroll = 0;
let galleryDragMoved = false;
let suppressGalleryClick = false;

function formatGalleryCounter(index) {
  return `${String(index + 1).padStart(2, "0")} / ${String(galleryItems.length).padStart(2, "0")}`;
}

function updateGalleryControls(index) {
  if (!galleryItems.length) return;

  activeCarouselIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
  galleryCounter.textContent = formatGalleryCounter(activeCarouselIndex);
  galleryPrev.disabled = activeCarouselIndex === 0;
  galleryNext.disabled = activeCarouselIndex === galleryItems.length - 1;
}

function scrollGalleryTo(index, behavior = "smooth") {
  if (!galleryViewport || !galleryItems.length) return;

  const nextIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
  galleryViewport.scrollTo({
    left: galleryItems[nextIndex].offsetLeft,
    behavior: reducedMotion ? "auto" : behavior
  });
  updateGalleryControls(nextIndex);
}

function syncGalleryFromScroll() {
  if (!galleryViewport || !galleryItems.length) return;

  cancelAnimationFrame(galleryScrollFrame);
  galleryScrollFrame = requestAnimationFrame(() => {
    const currentLeft = galleryViewport.scrollLeft;
    const closestIndex = galleryItems.reduce((closest, item, index) => {
      const currentDistance = Math.abs(item.offsetLeft - currentLeft);
      const closestDistance = Math.abs(galleryItems[closest].offsetLeft - currentLeft);
      return currentDistance < closestDistance ? index : closest;
    }, 0);

    updateGalleryControls(closestIndex);
  });
}

function finishGalleryDrag(event) {
  if (!galleryViewport || galleryDragPointer !== event.pointerId) return;

  galleryViewport.classList.remove("is-dragging");
  if (galleryViewport.hasPointerCapture(event.pointerId)) {
    galleryViewport.releasePointerCapture(event.pointerId);
  }

  galleryDragPointer = null;
  suppressGalleryClick = galleryDragMoved;

  if (galleryDragMoved) {
    syncGalleryFromScroll();
    requestAnimationFrame(() => scrollGalleryTo(activeCarouselIndex));
  }
}

galleryPrev?.addEventListener("click", () => scrollGalleryTo(activeCarouselIndex - 1));
galleryNext?.addEventListener("click", () => scrollGalleryTo(activeCarouselIndex + 1));
galleryViewport?.addEventListener("scroll", syncGalleryFromScroll, { passive: true });
galleryViewport?.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;

  galleryDragPointer = event.pointerId;
  galleryDragStartX = event.clientX;
  galleryDragStartScroll = galleryViewport.scrollLeft;
  galleryDragMoved = false;
  suppressGalleryClick = false;
  galleryViewport.classList.add("is-dragging");
  galleryViewport.setPointerCapture(event.pointerId);
  event.preventDefault();
});
galleryViewport?.addEventListener("pointermove", (event) => {
  if (galleryDragPointer !== event.pointerId) return;

  const distance = event.clientX - galleryDragStartX;
  galleryDragMoved ||= Math.abs(distance) > 6;
  galleryViewport.scrollLeft = galleryDragStartScroll - distance;
});
galleryViewport?.addEventListener("pointerup", finishGalleryDrag);
galleryViewport?.addEventListener("pointercancel", finishGalleryDrag);
galleryViewport?.addEventListener(
  "click",
  (event) => {
    if (!suppressGalleryClick) return;

    event.preventDefault();
    event.stopPropagation();
    suppressGalleryClick = false;
  },
  true
);
galleryViewport?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    scrollGalleryTo(activeCarouselIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    scrollGalleryTo(activeCarouselIndex + 1);
  }
});

window.addEventListener("resize", () => scrollGalleryTo(activeCarouselIndex, "auto"));
updateGalleryControls(0);

function renderGalleryItem(index) {
  if (!galleryItems.length || !lightboxImage) return;

  activeGalleryIndex = Math.max(0, Math.min(index, galleryItems.length - 1));
  const item = galleryItems[activeGalleryIndex];
  const image = item.querySelector("img");

  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCounter.textContent = formatGalleryCounter(activeGalleryIndex);
  lightboxPrev.disabled = activeGalleryIndex === 0;
  lightboxNext.disabled = activeGalleryIndex === galleryItems.length - 1;
}

function openLightbox(index, trigger) {
  if (!lightbox) return;

  lastGalleryTrigger = trigger;
  renderGalleryItem(index);

  if (typeof lightbox.showModal === "function") {
    lightbox.showModal();
  } else {
    lightbox.setAttribute("open", "");
  }
}

function closeLightbox() {
  if (!lightbox) return;

  if (typeof lightbox.close === "function") {
    lightbox.close();
  } else {
    lightbox.removeAttribute("open");
    lastGalleryTrigger?.focus();
  }
}

galleryItems.forEach((item, index) => {
  item.addEventListener("click", () => openLightbox(index, item));
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => {
  if (activeGalleryIndex > 0) renderGalleryItem(activeGalleryIndex - 1);
});
lightboxNext?.addEventListener("click", () => {
  if (activeGalleryIndex < galleryItems.length - 1) renderGalleryItem(activeGalleryIndex + 1);
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

lightbox?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeLightbox();
    return;
  }

  if (event.key === "ArrowLeft" && activeGalleryIndex > 0) {
    renderGalleryItem(activeGalleryIndex - 1);
  }
  if (event.key === "ArrowRight" && activeGalleryIndex < galleryItems.length - 1) {
    renderGalleryItem(activeGalleryIndex + 1);
  }
});

lightbox?.addEventListener("close", () => {
  lastGalleryTrigger?.focus();
});

const revealItems = document.querySelectorAll(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelector("[data-year]").textContent = new Date().getFullYear();
