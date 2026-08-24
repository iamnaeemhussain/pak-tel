(() => {
  const SHEET_ID = "1mCEh8PIE1Ke5UnEBzWqBFnkcCdvRAkXtTEoYGNGRDvE";
  const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
  const WHATSAPP_NUMBER = "923205094993";

  const fallbackPlans = [
    { name: "Basic Trial Plan", price: 199, dataLabel: "100 MB", days: "7 Days", reloadable: true, popular: false },
    { name: "Pilot Run Plan", price: 499, dataLabel: "500 MB", days: "7 Days", reloadable: true, popular: false },
    { name: "1GB 7 Days", price: 899, dataLabel: "1 GB", days: "7 Days", reloadable: true, popular: false },
    { name: "3GB 15 Days", price: 1199, dataLabel: "3 GB", days: "15 Days", reloadable: true, popular: false },
    { name: "3GB 30 Days", price: 1299, dataLabel: "3 GB", days: "30 Days", reloadable: true, popular: false },
    { name: "5GB 30 Days", price: 1799, dataLabel: "5 GB", days: "30 Days", reloadable: true, popular: true },
    { name: "10GB 30 Days", price: 2499, dataLabel: "10 GB", days: "30 Days", reloadable: true, popular: true },
    { name: "20GB 30 Days", price: 4099, dataLabel: "20 GB", days: "30 Days", reloadable: true, popular: true }
  ].map((plan, index) => ({ ...plan, id: slugify(plan.name), dataValueMB: parseDataValue(plan.dataLabel), index }));

  const state = {
    plans: fallbackPlans,
    filter: "all",
    sort: "recommended",
    selectedPlan: null,
    lastFocusedElement: null
  };

  const deviceBrands = [
    { name: "Apple", monogram: "A", models: ["iPhone XS", "iPhone XS Max", "iPhone XR", "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPhone 17", "iPad Pro", "iPad Air"] },
    { name: "Samsung", monogram: "S", models: ["Galaxy S20", "Galaxy S21", "Galaxy S22", "Galaxy S23", "Galaxy S24", "Galaxy S25", "Galaxy Note20", "Galaxy Z Flip", "Galaxy Z Fold", "Galaxy A54", "Galaxy A55"] },
    { name: "Google", monogram: "G", models: ["Pixel 3a", "Pixel 4", "Pixel 5", "Pixel 6", "Pixel 7", "Pixel 8", "Pixel 9", "Pixel 10", "Pixel Fold"] },
    { name: "Xiaomi", monogram: "Mi", models: ["Xiaomi 12T Pro", "Xiaomi 13", "Xiaomi 13 Pro", "Xiaomi 14", "Xiaomi 15", "Redmi Note 13 Pro+", "Redmi Note 14 Pro+"] },
    { name: "Huawei", monogram: "H", models: ["P40", "P40 Pro", "Mate 40 Pro", "P50 Pro", "Mate 50 Pro", "Mate Xs 2"] },
    { name: "Motorola", monogram: "M", models: ["Razr 2019", "Razr 40", "Razr 50", "Edge 40", "Edge 50", "Moto G75"] },
    { name: "OnePlus", monogram: "1+", models: ["OnePlus 11", "OnePlus 12", "OnePlus 13", "OnePlus Open"] },
    { name: "Oppo", monogram: "O", models: ["Find X3 Pro", "Find X5 Pro", "Find X8", "Find N2 Flip", "Reno 12 Pro"] },
    { name: "Sony", monogram: "X", models: ["Xperia 1 IV", "Xperia 1 V", "Xperia 1 VI", "Xperia 5 IV", "Xperia 10 IV"] },
    { name: "Honor", monogram: "Hn", models: ["Magic 4 Pro", "Magic 5 Pro", "Magic 6 Pro", "Magic V2", "200 Pro"] }
  ];

  const elements = {};

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function parsePrice(value) {
    const cleaned = String(value || "").replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseDataValue(value) {
    const match = String(value || "").replace(/,/g, "").match(/([\d.]+)\s*(mb|gb)/i);
    if (!match) return 0;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return 0;
    return match[2].toLowerCase() === "gb" ? amount * 1024 : amount;
  }

  function normalizePlan(row, index) {
    const entries = Object.entries(row).reduce((accumulator, [key, value]) => {
      accumulator[normalizeKey(key)] = String(value || "").trim();
      return accumulator;
    }, {});

    const get = (...keys) => {
      for (const key of keys) {
        const value = entries[normalizeKey(key)];
        if (value) return value;
      }
      return "";
    };

    const name = get("Plan Name", "Name");
    const dataLabel = get("GBs", "Data", "Data Allowance");
    if (!name || !dataLabel) return null;

    const price = parsePrice(get("Price (PKR)", "Price", "Price PKR"));
    const days = get("Days", "Validity") || "Flexible validity";
    const reloadableText = get("Reloadable");
    const popularText = get("Most Popular", "Popular");

    return {
      id: `${slugify(name)}-${index}`,
      name,
      price,
      dataLabel,
      dataValueMB: parseDataValue(dataLabel),
      days,
      simType: get("SIM type", "Sim Type", "Product Type") || "Full-size SIM",
      coverage: get("Coverage", "Network") || "5G/4G/LTE",
      planType: get("Plan type", "Type") || "Data only",
      hotspot: get("Hotspot", "Tethering") || "Yes",
      activation: get("Plan activation", "Activation") || "Instant",
      reloadable: /^(yes|true|y|1|reloadable)$/i.test(reloadableText),
      popular: /^(yes|true|y|1|popular)$/i.test(popularText),
      index
    };
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character]));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const nextCharacter = text[index + 1];

      if (character === '"' && insideQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = !insideQuotes;
      } else if (character === "," && !insideQuotes) {
        row.push(field);
        field = "";
      } else if ((character === "\n" || character === "\r") && !insideQuotes) {
        if (character === "\r" && nextCharacter === "\n") index += 1;
        row.push(field);
        if (row.some((cell) => cell.trim() !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
    }

    if (rows.length < 2) return [];
    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((cells) => headers.reduce((record, header, index) => {
      record[header] = cells[index] || "";
      return record;
    }, {}));
  }

  function formatPrice(price) {
    if (price === null || price === undefined || Number.isNaN(price)) return "Contact us";
    return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(price)}`;
  }

  function dataParts(label) {
    const match = String(label || "").match(/([\d.]+)\s*(MB|GB)/i);
    if (!match) return { amount: label || "—", unit: "data" };
    const amount = Number(match[1]);
    return {
      amount: Number.isInteger(amount) ? String(amount) : String(amount).replace(/0+$/, "").replace(/\.$/, ""),
      unit: match[2].toUpperCase()
    };
  }

  function getFilteredPlans() {
    const filter = state.filter;
    const matches = state.plans.filter((plan) => {
      if (filter === "all") return true;
      if (filter === "under-1") return plan.dataValueMB > 0 && plan.dataValueMB <= 1024;
      if (filter === "1-5") return plan.dataValueMB > 1024 && plan.dataValueMB <= 5120;
      if (filter === "5-10") return plan.dataValueMB > 5120 && plan.dataValueMB <= 10240;
      if (filter === "10-plus") return plan.dataValueMB > 10240;
      return true;
    });

    return matches.sort((first, second) => {
      if (state.sort === "price-low") return (first.price ?? Infinity) - (second.price ?? Infinity);
      if (state.sort === "price-high") return (second.price ?? -Infinity) - (first.price ?? -Infinity);
      if (state.sort === "data-low") return first.dataValueMB - second.dataValueMB;
      if (state.sort === "data-high") return second.dataValueMB - first.dataValueMB;
      if (first.popular !== second.popular) return first.popular ? -1 : 1;
      if (first.popular && second.popular) return first.dataValueMB - second.dataValueMB;
      return first.index - second.index;
    });
  }

  function planCard(plan, visibleIndex) {
    const parts = dataParts(plan.dataLabel);
    const badge = plan.popular
      ? `<span class="plan-badge">Most popular</span>`
      : `<span class="plan-badge plan-badge--quiet">Flexible data</span>`;
    const price = formatPrice(plan.price);
    const simType = plan.simType || "Full-size SIM";
    const coverage = plan.coverage || "5G/4G/LTE";
    const planType = plan.planType || "Data only";
    const hotspot = plan.hotspot || "Yes";
    const activation = plan.activation || "Instant";
    const reloadableLabel = plan.reloadable ? "Reloadable" : "One-time plan";
    const specifications = [
      ["Coverage", coverage],
      ["Plan type", planType],
      ["Validity period", plan.days],
      ["Hotspot", hotspot],
      ["Plan activation", activation]
    ];

    return `
      <article class="plan-card${plan.popular ? " is-popular" : ""}">
        <div class="plan-card-top">${badge}<span class="plan-index">${String(visibleIndex + 1).padStart(2, "0")}</span></div>
        <div class="plan-copy">
          <p class="plan-name">${escapeHTML(plan.name)}</p>
          <div class="plan-identity">
            <span class="sim-chip" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span class="plan-identity-copy"><strong>${escapeHTML(simType)}</strong><small>${escapeHTML(reloadableLabel)}</small></span>
            <span class="plan-ready"><i></i> Ready</span>
          </div>
          <div class="plan-metric"><strong>${escapeHTML(parts.amount)}</strong><span>${escapeHTML(parts.unit)}<br />data</span></div>
          <dl class="plan-specs">${specifications.map(([label, value]) => `<div class="plan-spec"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}</dl>
        </div>
        <div class="plan-bottom">
          <div class="plan-price"><span class="plan-price-label">Total price</span><strong>${escapeHTML(price)}</strong></div>
          <button class="plan-button" type="button" data-plan-id="${escapeHTML(plan.id)}">Get this plan <span aria-hidden="true">↗</span></button>
        </div>
      </article>`;
  }

  function renderPlans() {
    if (!elements.plansGrid) return;
    const visiblePlans = getFilteredPlans();
    elements.plansGrid.setAttribute("aria-busy", "false");

    if (!visiblePlans.length) {
      elements.plansGrid.innerHTML = `
        <div class="plan-empty">
          <p>No plans match that data range yet. Try another filter.</p>
          <button type="button" data-reset-plans>Show all plans</button>
        </div>`;
      return;
    }

    elements.plansGrid.innerHTML = visiblePlans.map((plan, index) => planCard(plan, index)).join("");
  }

  function setSheetStatus(message, isError = false) {
    if (!elements.sheetStatus || !elements.statusText) return;
    elements.statusText.textContent = message;
    elements.sheetStatus.classList.toggle("is-error", isError);
  }

  async function loadLivePlans() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(SHEET_CSV_URL, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
      const csv = await response.text();
      const plans = parseCSV(csv).map(normalizePlan).filter(Boolean);
      if (!plans.length) throw new Error("No plans found in sheet");

      state.plans = plans;
      renderPlans();
      setSheetStatus(`Live pricing synced · ${plans.length} plans`);
    } catch (error) {
      renderPlans();
      setSheetStatus("Showing saved prices · sheet will retry on refresh", true);
      // The saved snapshot keeps the storefront useful when a sheet or connection is unavailable.
      console.info("Pak-Tel plan sheet unavailable; using saved plans.", error.message);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function openCheckout(plan) {
    if (!elements.modal || !elements.selectedPlan || !plan) return;
    state.selectedPlan = plan;
    state.lastFocusedElement = document.activeElement;
    const parts = dataParts(plan.dataLabel);
    elements.selectedPlan.innerHTML = `
      <div><span class="selected-plan-name">${escapeHTML(plan.name)}</span><span class="selected-plan-data">${escapeHTML(parts.amount)} ${escapeHTML(parts.unit)} <span class="selected-plan-meta">/ ${escapeHTML(plan.days)}</span></span></div>
      <strong class="selected-plan-price">${escapeHTML(formatPrice(plan.price))}</strong>`;
    elements.orderNote.value = "";
    elements.modal.hidden = false;
    elements.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => elements.orderNote.focus());
  }

  function closeCheckout() {
    if (!elements.modal || elements.modal.hidden) return;
    elements.modal.hidden = true;
    elements.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") state.lastFocusedElement.focus();
  }

  function orderOnWhatsApp() {
    if (!state.selectedPlan) return;
    const plan = state.selectedPlan;
    const note = elements.orderNote.value.trim();
    const message = [
      "Hi Pak-Tel! I’d like to order an eSIM plan.",
      `Plan: ${plan.name}`,
      `Data: ${plan.dataLabel}`,
      `Validity: ${plan.days}`,
      `Price: ${formatPrice(plan.price)}`,
      note ? `Note: ${note}` : ""
    ].filter(Boolean).join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function whatsappUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function renderBrands() {
    if (!elements.brandGrid) return;
    elements.brandGrid.innerHTML = deviceBrands.map((brand) => `
      <button class="brand-button" type="button" data-brand="${escapeHTML(brand.name)}" aria-label="Browse ${escapeHTML(brand.name)} models">
        <span class="brand-monogram" aria-hidden="true">${escapeHTML(brand.monogram)}</span>
        <span>${escapeHTML(brand.name)}</span>
      </button>`).join("");
  }

  function resultMarkup(title, detail, unknown = false) {
    return `<span class="result-icon" aria-hidden="true">${unknown ? "!" : "✓"}</span><span class="result-text"><b>${escapeHTML(title)}</b><span>${escapeHTML(detail)}</span></span>`;
  }

  function showResult(title, detail, unknown = false) {
    if (!elements.checkerResult) return;
    elements.checkerResult.innerHTML = resultMarkup(title, detail, unknown);
    elements.checkerResult.classList.toggle("is-unknown", unknown);
    elements.checkerResult.hidden = false;
  }

  function checkDevice(query) {
    const cleaned = String(query || "").trim();
    const normalizedQuery = cleaned.toLowerCase().replace(/[^a-z0-9+]/g, "");
    if (!normalizedQuery) {
      showResult("Enter your phone model", "Try a model like iPhone 15, Galaxy S24, or Pixel 8.", true);
      return;
    }

    const brand = deviceBrands.find((item) => normalizedQuery.includes(item.name.toLowerCase().replace(/[^a-z0-9+]/g, "")));
    const matchingBrand = brand || deviceBrands.find((item) => item.models.some((model) => normalizedQuery.includes(model.toLowerCase().replace(/[^a-z0-9+]/g, "")) || model.toLowerCase().replace(/[^a-z0-9+]/g, "").includes(normalizedQuery)));
    const matchingModel = deviceBrands.flatMap((item) => item.models.map((model) => ({ model, brand: item.name }))).find(({ model }) => {
      const normalizedModel = model.toLowerCase().replace(/[^a-z0-9+]/g, "");
      return normalizedQuery.includes(normalizedModel) || normalizedModel.includes(normalizedQuery);
    });

    if (matchingModel) {
      showResult(`${matchingModel.model} is eSIM ready`, `A ${matchingModel.brand} eSIM-compatible example. Regional variants and carrier locks can differ.`);
    } else if (matchingBrand) {
      const examples = matchingBrand.models.slice(0, 4).join(", ");
      showResult(`${matchingBrand.name} has eSIM-ready models`, `Known examples include ${examples}. Check your exact model before ordering.`);
    } else {
      showResult(`We couldn’t verify “${cleaned}”`, "Try the full model name or message us on WhatsApp for an exact check.", true);
    }
  }

  function showBrand(brandName) {
    const brand = deviceBrands.find((item) => item.name === brandName);
    if (!brand) return;
    elements.deviceSearch.value = brand.name;
    document.querySelectorAll(".brand-button").forEach((button) => button.classList.toggle("is-active", button.dataset.brand === brand.name));
    showResult(`${brand.name} eSIM compatibility`, `Known examples: ${brand.models.slice(0, 5).join(", ")}. Support varies by exact model and region.`);
  }

  function setupLogo() {
    const logoImages = [...document.querySelectorAll("[data-brand-image]")];
    const fallbacks = [...document.querySelectorAll(".brand-fallback")];
    if (!logoImages.length) return;

    const candidates = ["logo.png", "logo.jpg", "logo.jpeg", "logo.webp", "logo.svg"];
    const tryCandidate = (index) => {
      if (index >= candidates.length) return;
      const probe = new Image();
      probe.onload = () => {
        logoImages.forEach((image) => {
          image.src = candidates[index];
          image.hidden = false;
        });
        fallbacks.forEach((fallback) => { fallback.hidden = true; });
      };
      probe.onerror = () => tryCandidate(index + 1);
      probe.src = candidates[index];
    };
    tryCandidate(0);
  }

  function setupNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.querySelector(".main-nav");
    if (!menuToggle || !mainNav) return;

    const closeMenu = () => {
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      mainNav.classList.remove("is-open");
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      mainNav.classList.toggle("is-open", isOpen);
    });

    mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  function setupReveal() {
    const revealItems = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -35px" });

    revealItems.forEach((item) => observer.observe(item));
  }

  function setupHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 18);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function setupEvents() {
    elements.plansGrid.addEventListener("click", (event) => {
      const planButton = event.target.closest("[data-plan-id]");
      const resetButton = event.target.closest("[data-reset-plans]");
      if (resetButton) {
        state.filter = "all";
        document.querySelectorAll(".filter-button").forEach((button) => {
          const isActive = button.dataset.filter === "all";
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", String(isActive));
        });
        renderPlans();
        return;
      }
      if (!planButton) return;
      const plan = state.plans.find((item) => item.id === planButton.dataset.planId);
      openCheckout(plan);
    });

    document.querySelectorAll(".filter-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        document.querySelectorAll(".filter-button").forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-selected", String(isActive));
        });
        renderPlans();
      });
    });

    elements.sortSelect.addEventListener("change", () => {
      state.sort = elements.sortSelect.value;
      renderPlans();
    });

    document.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeCheckout));
    elements.whatsappOrder.addEventListener("click", orderOnWhatsApp);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCheckout();
    });

    elements.deviceForm.addEventListener("submit", (event) => {
      event.preventDefault();
      checkDevice(elements.deviceSearch.value);
    });

    elements.brandGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-brand]");
      if (button) showBrand(button.dataset.brand);
    });

    elements.floatingWhatsApp.addEventListener("click", () => {
      window.open(whatsappUrl("Hi Pak-Tel! I’d like help choosing an eSIM plan."), "_blank", "noopener,noreferrer");
    });
  }

  function cacheElements() {
    elements.plansGrid = document.getElementById("plans-grid");
    elements.sheetStatus = document.getElementById("sheet-status");
    elements.statusText = document.querySelector("[data-status-text]");
    elements.sortSelect = document.getElementById("sort-select");
    elements.modal = document.getElementById("checkout-modal");
    elements.selectedPlan = document.getElementById("selected-plan");
    elements.orderNote = document.getElementById("order-note");
    elements.whatsappOrder = document.getElementById("whatsapp-order");
    elements.deviceForm = document.getElementById("device-form");
    elements.deviceSearch = document.getElementById("device-search");
    elements.checkerResult = document.getElementById("checker-result");
    elements.brandGrid = document.getElementById("brand-grid");
    elements.floatingWhatsApp = document.getElementById("floating-whatsapp");
  }

  function init() {
    cacheElements();
    renderPlans();
    renderBrands();
    setupLogo();
    setupNavigation();
    setupHeader();
    setupReveal();
    setupEvents();
    document.getElementById("year").textContent = new Date().getFullYear();
    loadLivePlans();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
