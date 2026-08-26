(() => {
  const SHEET_ID = "1mCEh8PIE1Ke5UnEBzWqBFnkcCdvRAkXtTEoYGNGRDvE";
  const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
  const WHATSAPP_NUMBER = "923205094993";

  const fallbackPlans = [
    { name: "Basic Trial Plan", price: 199, dataLabel: "100 MB", days: "7 Days", reloadable: true, popular: false },
    { name: "Pilot Run Plan", price: 499, dataLabel: "500 MB", days: "7 Days", reloadable: true, popular: false },
    { name: "1GB 7 Days", price: 899, actualPrice: 1500, dataLabel: "1 GB", days: "7 Days", reloadable: true, discount: 60, popular: false },
    { name: "3GB 15 Days", price: 1199, actualPrice: 2000, dataLabel: "3 GB", days: "15 Days", reloadable: true, discount: 60, popular: false },
    { name: "3GB 30 Days", price: 1299, actualPrice: 2500, dataLabel: "3 GB", days: "30 Days", reloadable: true, discount: 52, popular: false },
    { name: "5GB 30 Days", price: 1799, actualPrice: 3500, dataLabel: "5 GB", days: "30 Days", reloadable: true, discount: 51, popular: true },
    { name: "10GB 30 Days", price: 2499, actualPrice: 4500, dataLabel: "10 GB", days: "30 Days", reloadable: true, discount: 56, popular: true },
    { name: "20GB 30 Days", price: 4099, actualPrice: 6500, dataLabel: "20 GB", days: "30 Days", reloadable: true, discount: 63, popular: true }
  ].map((plan, index) => ({ ...plan, id: slugify(plan.name), dataValueMB: parseDataValue(plan.dataLabel), index }));

  const state = {
    plans: fallbackPlans,
    filter: "all",
    sort: "recommended",
    messages: [],
    selectedPlan: null,
    lastFocusedElement: null
  };

  const deviceBrands = [
    { name: "Apple", monogram: "A", logo: "https://cdn.simpleicons.org/apple/071322", models: ["iPhone XS", "iPhone XS Max", "iPhone XR", "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16", "iPhone 17", "iPad Pro", "iPad Air"] },
    { name: "Samsung", monogram: "S", logo: "https://cdn.simpleicons.org/samsung/071322", models: ["Galaxy S20", "Galaxy S21", "Galaxy S22", "Galaxy S23", "Galaxy S24", "Galaxy S25", "Galaxy Note20", "Galaxy Z Flip", "Galaxy Z Fold", "Galaxy A54", "Galaxy A55"] },
    { name: "Google", monogram: "G", logo: "https://cdn.simpleicons.org/google/071322", models: ["Pixel 3a", "Pixel 4", "Pixel 5", "Pixel 6", "Pixel 7", "Pixel 8", "Pixel 9", "Pixel 10", "Pixel Fold"] },
    { name: "Xiaomi", monogram: "Mi", logo: "https://cdn.simpleicons.org/xiaomi/071322", models: ["Xiaomi 12T Pro", "Xiaomi 13", "Xiaomi 13 Pro", "Xiaomi 14", "Xiaomi 15", "Redmi Note 13 Pro+", "Redmi Note 14 Pro+"] },
    { name: "Huawei", monogram: "H", logo: "https://cdn.simpleicons.org/huawei/071322", models: ["P40", "P40 Pro", "Mate 40 Pro", "P50 Pro", "Mate 50 Pro", "Mate Xs 2"] },
    { name: "Motorola", monogram: "M", logo: "https://cdn.simpleicons.org/motorola/071322", models: ["Razr 2019", "Razr 40", "Razr 50", "Edge 40", "Edge 50", "Moto G75"] },
    { name: "OnePlus", monogram: "1+", logo: "https://cdn.simpleicons.org/oneplus/071322", models: ["OnePlus 11", "OnePlus 12", "OnePlus 13", "OnePlus Open"] },
    { name: "Oppo", monogram: "O", logo: "https://cdn.simpleicons.org/oppo/071322", models: ["Find X3 Pro", "Find X5 Pro", "Find X8", "Find N2 Flip", "Reno 12 Pro"] },
    { name: "Sony", monogram: "X", logo: "https://cdn.simpleicons.org/sony/071322", models: ["Xperia 1 IV", "Xperia 1 V", "Xperia 1 VI", "Xperia 5 IV", "Xperia 10 IV"] },
    { name: "Honor", monogram: "Hn", logo: "https://cdn.simpleicons.org/honor/071322", models: ["Magic 4 Pro", "Magic 5 Pro", "Magic 6 Pro", "Magic V2", "200 Pro"] }
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

  function parseDiscount(value) {
    const rawValue = String(value || "").replace(/,/g, "").trim();
    const match = rawValue.match(/([\d.]+)\s*%?/);
    if (!match) return null;
    let amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!rawValue.includes("%") && amount < 1) amount *= 100;
    if (amount > 100) return null;
    return Number.isInteger(amount) ? amount : Number(amount.toFixed(1));
  }

  function discountLabel(value) {
    const amount = parseDiscount(value);
    return amount ? `${amount}% OFF` : "";
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
    const actualPrice = parsePrice(get("Actual Price", "Original Price", "Retail Price"));
    const discount = parseDiscount(get("Discount %", "Discount", "Discount Rate"));
    const days = get("Days", "Validity") || "Flexible validity";
    const reloadableText = get("Reloadable");
    const popularText = get("Most Popular", "Popular");

    return {
      id: `${slugify(name)}-${index}`,
      name,
      price,
      actualPrice,
      discount,
      dataLabel,
      dataValueMB: parseDataValue(dataLabel),
      days,
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

  function extractSheetMessage(rows) {
    const messageKey = Object.keys(rows[0] || {}).find((key) => normalizeKey(key) === "message");
    if (!messageKey) return "";

    const messageRow = rows.find((row) => String(row[messageKey] || "").trim());
    return messageRow ? String(messageRow[messageKey]).replace(/\s+/g, " ").trim().slice(0, 280) : "";
  }

  function renderTicker() {
    if (!elements.tickerTrack || !elements.tickerBar) return;
    if (!state.messages.length) {
      elements.tickerTrack.innerHTML = "";
      elements.tickerBar.hidden = true;
      return;
    }

    const message = state.messages[0];
    const item = `<span class="ticker-item">${escapeHTML(message)}</span>`;
    elements.tickerTrack.innerHTML = `<div class="ticker-set">${item}</div><div class="ticker-set" aria-hidden="true">${item}</div>`;
    elements.tickerBar.hidden = false;
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

  const specIcons = {
    Coverage: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18v-3"/><path d="M8 18v-6"/><path d="M12 18V9"/><path d="M16 18V6"/><path d="M20 18V3"/><path d="M3 21h18"/></svg>`,
    "Plan type": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4M7 13h7M16 13h2"/></svg>`,
    "Validity period": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7 3v4M17 3v4M3.5 10h17M7 14h.01M12 14h.01M17 14h.01M7 17h.01M12 17h.01"/></svg>`,
    Hotspot: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5a13.5 13.5 0 0 1 18 0M6.5 13a8.5 8.5 0 0 1 11 0M10 16.5a4 4 0 0 1 4 0"/><path d="M12 20h.01"/></svg>`,
    "Plan activation": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/></svg>`,
    Reloadable: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0-14.7-3L4 10"/><path d="M4 5v5h5"/><path d="M4 13a8.1 8.1 0 0 0 14.7 3L20 14"/><path d="M20 19v-5h-5"/></svg>`
  };

  function planSpecIcon(label) {
    return specIcons[label] || `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>`;
  }

  function planCard(plan, visibleIndex) {
    const parts = dataParts(plan.dataLabel);
    const badge = plan.popular
      ? `<span class="plan-badge">Most popular</span>`
      : `<span class="plan-badge plan-badge--quiet">Flexible data</span>`;
    const discount = discountLabel(plan.discount);
    const discountAmount = discount.replace(/\s+OFF$/i, "");
    const discountBubble = discount ? `<div class="discount-bubble" role="img" title="${escapeHTML(discount)}" aria-label="${escapeHTML(discount)}"><span>SAVE</span><strong>${escapeHTML(discountAmount)}</strong><small>OFF</small></div>` : "";
    const price = formatPrice(plan.price);
    const actualPrice = plan.actualPrice !== null && plan.actualPrice !== undefined ? formatPrice(plan.actualPrice) : "";
    const actualPriceMarkup = actualPrice ? `<span class="plan-original-price" title="Actual price"><small>Actual price</small><b>${escapeHTML(actualPrice)}</b></span>` : "";
    const coverage = plan.coverage || "5G/4G/LTE";
    const planType = plan.planType || "Data only";
    const hotspot = plan.hotspot || "Yes";
    const activation = plan.activation || "Instant";
    const specifications = [
      ["Coverage", coverage],
      ["Plan type", planType],
      ["Validity period", plan.days],
      ["Hotspot", hotspot],
      ["Plan activation", activation],
      ["Reloadable", plan.reloadable ? "Yes" : "No"]
    ];

    return `
      <article class="plan-card${plan.popular ? " is-popular" : ""}${discount ? " has-discount" : ""}">
        ${discountBubble}
        <div class="plan-card-top">
          <div class="plan-badges">${badge}</div>
          <span class="plan-index">${String(visibleIndex + 1).padStart(2, "0")}</span>
        </div>
        <div class="plan-copy">
          <p class="plan-name">${escapeHTML(plan.name)}</p>
          <div class="plan-metric"><strong>${escapeHTML(parts.amount)}</strong><span>${escapeHTML(parts.unit)}<br />data</span></div>
          <dl class="plan-specs">${specifications.map(([label, value]) => `<div class="plan-spec"><dt><span class="spec-icon">${planSpecIcon(label)}</span><span>${escapeHTML(label)}</span></dt><dd>${escapeHTML(value)}</dd></div>`).join("")}</dl>
        </div>
        <div class="plan-bottom">
          <div class="plan-price"><span class="plan-price-label">Price (PKR)</span><div class="plan-price-values">${actualPriceMarkup}<strong>${escapeHTML(price)}</strong></div></div>
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
    if (!elements.plansGrid) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(SHEET_CSV_URL, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
      const csv = await response.text();
      const rows = parseCSV(csv);
      const plans = rows.map(normalizePlan).filter(Boolean);
      if (!plans.length) throw new Error("No plans found in sheet");

      const message = extractSheetMessage(rows);
      state.messages = message ? [message] : [];
      renderTicker();
      state.plans = plans;
      renderPlans();
      setSheetStatus(`Live pricing synced · ${plans.length} plans`);
    } catch (error) {
      renderPlans();
      state.messages = [];
      renderTicker();
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
        <span class="brand-logo-wrap">
          <img class="brand-logo" src="${escapeHTML(brand.logo)}" alt="${escapeHTML(brand.name)} logo" loading="lazy" />
          <span class="brand-monogram" aria-hidden="true">${escapeHTML(brand.monogram)}</span>
        </span>
        <span>${escapeHTML(brand.name)}</span>
      </button>`).join("");

    elements.brandGrid.querySelectorAll(".brand-logo").forEach((image) => {
      if (image.complete && image.naturalWidth > 0) image.parentElement.classList.add("has-logo");
    });
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

    const candidates = ["ptlogo.png", "ptlogo.svg", "logo.png", "logo.jpg", "logo.jpeg", "logo.webp", "logo.svg"];
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

  function setupBanner() {
    const bannerImage = document.querySelector("[data-banner-image]");
    const bannerFallback = document.querySelector("[data-banner-fallback]");
    if (!bannerImage || !bannerFallback) return;

    const showImage = () => {
      bannerImage.hidden = false;
      bannerFallback.hidden = true;
    };
    const showFallback = () => {
      bannerImage.hidden = true;
      bannerFallback.hidden = false;
    };

    bannerImage.addEventListener("load", showImage, { once: true });
    bannerImage.addEventListener("error", showFallback, { once: true });
    if (bannerImage.complete) {
      if (bannerImage.naturalWidth > 0) showImage();
      else showFallback();
    }
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
    if (elements.plansGrid) {
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
    }

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

    if (elements.sortSelect) {
      elements.sortSelect.addEventListener("change", () => {
        state.sort = elements.sortSelect.value;
        renderPlans();
      });
    }

    document.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeCheckout));
    if (elements.whatsappOrder) elements.whatsappOrder.addEventListener("click", orderOnWhatsApp);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeCheckout();
    });

    if (elements.deviceForm) {
      elements.deviceForm.addEventListener("submit", (event) => {
        event.preventDefault();
        checkDevice(elements.deviceSearch.value);
      });
    }

    if (elements.brandGrid) {
      elements.brandGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-brand]");
        if (button) showBrand(button.dataset.brand);
      });

      elements.brandGrid.addEventListener("load", (event) => {
        if (event.target.matches(".brand-logo")) event.target.parentElement.classList.add("has-logo");
      }, true);

      elements.brandGrid.addEventListener("error", (event) => {
        if (event.target.matches(".brand-logo")) event.target.remove();
      }, true);
    }

    if (elements.floatingWhatsApp) {
      elements.floatingWhatsApp.addEventListener("click", () => {
        window.open(whatsappUrl("Hi Pak-Tel! I’d like help choosing an eSIM plan."), "_blank", "noopener,noreferrer");
      });
    }
  }

  function cacheElements() {
    elements.plansGrid = document.getElementById("plans-grid");
    elements.tickerBar = document.getElementById("news-ticker");
    elements.tickerTrack = document.getElementById("news-ticker-track");
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
    renderTicker();
    renderBrands();
    setupLogo();
    setupBanner();
    setupNavigation();
    setupHeader();
    setupReveal();
    setupEvents();
    const yearElement = document.getElementById("year");
    if (yearElement) yearElement.textContent = new Date().getFullYear();
    loadLivePlans();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
