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
      window.location.href = `vendas.html?crianca=${encodeURIComponent(name)}`;
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

  applyName(currentName());
  bindNameGate();
  bindQuickNameForm();
  bindCarousel();
  bindCheckoutPlaceholder();
})();
