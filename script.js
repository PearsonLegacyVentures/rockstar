(() => {
  "use strict";
  const modal = document.getElementById("booking-modal");
  const panel = modal.querySelector(".booking-panel");
  const form = document.getElementById("booking-form");
  const service = document.getElementById("service");
  const date = document.getElementById("visit-date");
  const status = document.getElementById("booking-status");
  const fallback = document.getElementById("booking-fallback");
  const submitButton = form.querySelector("[type=submit]");
  const menuButton = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const state = { lastFocus: null, requestText: "" };

  function todayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }
  date.min = todayLocalDate();
  document.getElementById("year").textContent = String(new Date().getFullYear());

  function closeMenu() {
    mobileNav.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }
  menuButton.addEventListener("click", () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
  });
  mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!modal.hidden) closeBooking();
      else closeMenu();
    }
  });

  function openBooking(requested) {
    state.lastFocus = document.activeElement;
    if (requested && requested !== "Choose an experience") {
      const found = [...service.options].find(option => option.value === requested);
      if (found) service.value = requested;
    }
    closeMenu();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    status.textContent = "";
    status.classList.remove("error");
    fallback.hidden = true;
    panel.scrollTop = 0;
    requestAnimationFrame(() => panel.focus());
  }
  function closeBooking() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (state.lastFocus && state.lastFocus.isConnected && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }
  document.querySelectorAll("[data-book]").forEach(button => {
    button.addEventListener("click", () => openBooking(button.getAttribute("data-book")));
  });
  modal.querySelectorAll("[data-close]").forEach(element => element.addEventListener("click", closeBooking));
  modal.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll('button:not(:disabled),[href],input:not([tabindex="-1"]),select,textarea')].filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
    if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(b => {
        const active = b === button;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll("[data-category]").forEach(card => {
        const categories = card.dataset.category.split(" ");
        card.classList.toggle("is-filtered-out", category !== "all" && !categories.includes(category));
      });
    });
  });

  function composeRequest(fields) {
    return [
      "ROCKSTAR TRANSPORTATION & TOURS — BOOKING REQUEST",
      "Experience: " + fields.service,
      "Travel date: " + fields.date,
      "Guests: " + fields.guests,
      "Name: " + fields.name,
      "Email: " + fields.email,
      "Arriving from: " + fields.pickupType,
      "Ship / hotel / pickup area: " + (fields.pickupLocation || "Not specified"),
      "Additional notes: " + (fields.notes || "None"),
      "",
      "Booking requires availability and a final quote. No payment was taken."
    ].join("\n");
  }
  function fieldsFromForm() {
    return {
      service: form.elements.service.value.trim(),
      date: form.elements.date.value,
      guests: Number(form.elements.guests.value),
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      pickupType: form.elements.pickupType.value.trim(),
      pickupLocation: form.elements.pickupLocation.value.trim(),
      notes: form.elements.notes.value.trim(),
      company: form.elements.company.value
    };
  }
  function showFallback(message) {
    status.textContent = message;
    status.classList.add("error");
    fallback.hidden = false;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    fallback.hidden = true;
    status.textContent = "";
    status.classList.remove("error");
    if (!form.reportValidity()) return;
    const fields = fieldsFromForm();
    if (!fields.date || fields.date < todayLocalDate()) {
      showFallback("Choose today or a future date.");
      date.focus();
      return;
    }
    if (!Number.isFinite(fields.guests) || fields.guests < 1 || fields.guests > 250) {
      showFallback("Enter a group size between 1 and 250.");
      form.elements.guests.focus();
      return;
    }
    state.requestText = composeRequest(fields);
    submitButton.disabled = true;
    submitButton.textContent = "CHECKING REQUEST INBOX...";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      let response;
      try {
        response = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      let json = {};
      try { json = await response.json(); } catch (_) { /* static host may return HTML */ }
      if (!response.ok || json.ok !== true) throw new Error(json.message || "The booking inbox is not available.");
      status.textContent = "Your booking request has been sent. Rockstar will need to confirm availability and the final price before your experience is booked.";
      form.reset();
      fallback.hidden = true;
    } catch (_) {
      showFallback("This request has NOT been sent. The online booking inbox is not configured or is temporarily unavailable.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "REQUEST AVAILABILITY ↗";
    }
  });

  document.getElementById("copy-request").addEventListener("click", async (event) => {
    if (!state.requestText) return;
    const button = event.currentTarget;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(state.requestText);
      } else {
        const temp = document.createElement("textarea");
        temp.value = state.requestText;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        if (!document.execCommand("copy")) throw new Error("Copy failed");
        temp.remove();
      }
      button.textContent = "COPIED ✓";
      setTimeout(() => { button.textContent = "COPY MY REQUEST ⧉"; }, 3000);
    } catch (_) {
      status.textContent = "Copying isn't available in this browser. Please keep these details and contact Rockstar directly.";
      status.classList.add("error");
    }
  });
})();