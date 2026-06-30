(function () {
  const STORAGE_KEY = "historinhas.childName";
  const FALLBACK_NAME = "Rafael";

  function normalizeName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 28);
  }

  function titleCaseName(value) {
    const clean = normalizeName(value);
    if (!clean) return "";
    return clean
      .toLocaleLowerCase("pt-BR")
      .replace(/(^|\s|[-'])\p{L}/gu, (match) => match.toLocaleUpperCase("pt-BR"));
  }

  function getUrlName() {
    const params = new URLSearchParams(window.location.search);
    return normalizeName(params.get("crianca") || params.get("nome"));
  }

  function getStoredName() {
    try {
      return normalizeName(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return "";
    }
  }

  function saveName(name) {
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch (error) {
      return;
    }
  }

  function currentName() {
    return titleCaseName(getUrlName() || getStoredName() || FALLBACK_NAME);
  }

  function pageUrl(page, name) {
    const url = new URL(page, window.location.href);
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.forEach((value, key) => {
      if (key !== "nome") url.searchParams.set(key, value);
    });

    url.searchParams.set("crianca", titleCaseName(name) || FALLBACK_NAME);
    return `${url.pathname.split("/").pop()}?${url.searchParams.toString()}`;
  }

  function applyName(name) {
    const safeName = titleCaseName(name) || FALLBACK_NAME;
    const upperName = safeName.toLocaleUpperCase("pt-BR");

    document.querySelectorAll("[data-child]").forEach((element) => {
      element.textContent = safeName;
    });

    document.querySelectorAll("[data-child-upper]").forEach((element) => {
      element.textContent = upperName;
    });

    const quickInput = document.querySelector("#quickChildName");
    if (quickInput) {
      quickInput.value = "";
      quickInput.placeholder = safeName;
    }

    document.title = `Historinha Bíblica personalizada para ${safeName}`;
    saveName(safeName);
  }

  function bindNameGate() {
    const form = document.querySelector("#nameForm");
    if (!form) return;

    const input = form.querySelector("#childName");
    const error = form.querySelector("#nameError");
    const existingName = currentName();

    if (input && existingName !== FALLBACK_NAME) {
      input.value = existingName;
    }

    applyName(input && input.value ? input.value : existingName);

    input.addEventListener("input", () => {
      const previewName = titleCaseName(input.value) || FALLBACK_NAME;
      applyName(previewName);
      if (error) error.textContent = "";
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = titleCaseName(input.value);

      if (!name) {
        if (error) error.textContent = "Digite o nome da criança para continuar.";
        input.focus();
        return;
      }

      saveName(name);
      window.location.href = pageUrl("historinha.html", name);
    });
  }

  function bindQuickNameForm() {
    const form = document.querySelector("#quickNameForm");
    if (!form) return;

    const input = form.querySelector("#quickChildName");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = titleCaseName(input.value);
      if (!name) {
        input.focus();
        return;
      }

      applyName(name);
      const url = new URL(window.location.href);
      url.searchParams.set("crianca", name);
      window.history.replaceState({}, "", url);
    });
  }

  function bindStorybook() {
    const storybook = document.querySelector("[data-storybook]");
    if (!storybook) return;

    const pages = Array.from(storybook.querySelectorAll("[data-story-page]"));
    const prev = storybook.querySelector("[data-story-prev]");
    const next = storybook.querySelector("[data-story-next]");
    const progressText = storybook.querySelector("[data-story-progress-text]");
    const progressBar = storybook.querySelector("[data-story-progress-bar]");
    const salesLink = storybook.querySelector("[data-sales-link]");
    let index = 0;

    if (!pages.length || !prev || !next || !progressText || !progressBar || !salesLink) return;

    function showPage(nextIndex) {
      index = Math.min(Math.max(nextIndex, 0), pages.length - 1);
      const isLast = index === pages.length - 1;

      pages.forEach((page, pageIndex) => {
        page.classList.toggle("is-active", pageIndex === index);
        page.setAttribute("aria-hidden", pageIndex === index ? "false" : "true");
      });

      prev.disabled = index === 0;
      next.hidden = isLast;
      salesLink.classList.toggle("is-visible", isLast);
      salesLink.href = pageUrl("vendas.html", currentName());
      progressText.textContent = `${index + 1} de ${pages.length}`;
      progressBar.style.width = `${((index + 1) / pages.length) * 100}%`;
    }

    prev.addEventListener("click", () => showPage(index - 1));
    next.addEventListener("click", () => showPage(index + 1));

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showPage(index - 1);
      if (event.key === "ArrowRight") showPage(index + 1);
    });

    showPage(0);
  }

  function bindCarousel() {
    const carousels = document.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
      const prev = carousel.querySelector("[data-prev]");
      const next = carousel.querySelector("[data-next]");
      const dotsContainer = carousel.querySelector(".carousel-dots");
      const shouldAutoplay = carousel.dataset.autoplay === "true" && !prefersReducedMotion;
      const interval = Number(carousel.dataset.interval) || 5200;
      let index = 0;
      let timer = 0;

      if (!track || !slides.length || !prev || !next || !dotsContainer) return;

      function showSlide(nextIndex) {
        index = (nextIndex + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        slides.forEach((slide, slideIndex) => {
          slide.classList.toggle("is-active", slideIndex === index);
          slide.setAttribute("aria-hidden", slideIndex === index ? "false" : "true");
        });
        dotsContainer.querySelectorAll("button").forEach((dot, dotIndex) => {
          dot.setAttribute("aria-selected", dotIndex === index ? "true" : "false");
        });
      }

      function stopAutoplay() {
        window.clearInterval(timer);
      }

      function startAutoplay() {
        if (!shouldAutoplay || slides.length < 2) return;
        stopAutoplay();
        timer = window.setInterval(() => showSlide(index + 1), interval);
      }

      slides.forEach((slide, slideIndex) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Ver parte ${slideIndex + 1}`);
        dot.addEventListener("click", () => {
          showSlide(slideIndex);
          startAutoplay();
        });
        dotsContainer.appendChild(dot);
      });

      prev.addEventListener("click", () => {
        showSlide(index - 1);
        startAutoplay();
      });
      next.addEventListener("click", () => {
        showSlide(index + 1);
        startAutoplay();
      });

      let startX = 0;
      carousel.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
        stopAutoplay();
      }, { passive: true });

      carousel.addEventListener("touchend", (event) => {
        const delta = event.changedTouches[0].clientX - startX;
        if (Math.abs(delta) >= 48) showSlide(delta < 0 ? index + 1 : index - 1);
        startAutoplay();
      }, { passive: true });

      carousel.addEventListener("mouseenter", stopAutoplay);
      carousel.addEventListener("mouseleave", startAutoplay);
      carousel.addEventListener("focusin", stopAutoplay);
      carousel.addEventListener("focusout", startAutoplay);

      showSlide(0);
      startAutoplay();
    });
  }

  function bindCheckoutPlaceholder() {
    const checkoutButton = document.querySelector(".checkout-button");
    if (!checkoutButton) return;

    checkoutButton.addEventListener("click", (event) => {
      if (checkoutButton.getAttribute("href") !== "#") return;
      event.preventDefault();
      checkoutButton.textContent = "Link de checkout pendente";
      checkoutButton.setAttribute("aria-label", "Link de checkout pendente");
    });
  }

  function bindCountdown() {
    const countdown = document.querySelector("[data-countdown]");
    if (!countdown) return;

    const time = countdown.querySelector("[data-countdown-time]");
    const minutes = Number(countdown.dataset.countdownMinutes) || 30;
    const duration = minutes * 60 * 1000;
    const storageKey = "historinhas.offerDeadline";
    let deadline = 0;

    try {
      deadline = Number(window.localStorage.getItem(storageKey));
      if (!deadline || deadline <= Date.now()) {
        deadline = Date.now() + duration;
        window.localStorage.setItem(storageKey, String(deadline));
      }
    } catch (error) {
      deadline = Date.now() + duration;
    }

    function render() {
      const remaining = Math.max(0, deadline - Date.now());
      const totalSeconds = Math.ceil(remaining / 1000);
      const displayMinutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const displaySeconds = String(totalSeconds % 60).padStart(2, "0");

      if (time) time.textContent = `${displayMinutes}:${displaySeconds}`;
      countdown.classList.toggle("is-ending", remaining <= 5 * 60 * 1000);
    }

    render();
    window.setInterval(render, 1000);
  }

  function bindBuyPulse() {
    const buttons = Array.from(document.querySelectorAll(".buy-pulse"));
    if (!buttons.length) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    const pulse = () => {
      if (document.hidden) return;
      buttons.forEach((button) => button.classList.add("is-buy-pulsing"));
      window.setTimeout(() => {
        buttons.forEach((button) => button.classList.remove("is-buy-pulsing"));
      }, 520);
    };

    window.setTimeout(pulse, 650);
    window.setInterval(pulse, 2350);
  }

  applyName(currentName());
  bindNameGate();
  bindQuickNameForm();
  bindStorybook();
  bindCarousel();
  bindCheckoutPlaceholder();
  bindCountdown();
  bindBuyPulse();
})();
