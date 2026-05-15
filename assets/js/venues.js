"use strict";

/* ═══════════════════════════════════════
   venues.js - Venues page UI logic
   2-Step reservation modal: date/time → summary + payment.
   All database calls go through VenuesService.
   ═══════════════════════════════════════ */

/* ─── Module state ─────────────────────────────────────────────────── */
let allVenues     = [];
let currentFilter = "todos";
let selectedVenue = null;
let _modalStep    = 1;   // 1 or 2

/* ─── Sport icon map ───────────────────────────────────────────────── */
const SPORT_ICONS = {
  futbol: "⚽", baloncesto: "🏀", tenis: "🎾",
  voleibol: "🏐", natacion: "🏊", gimnasio: "🏋️",
  padel: "🏸", beisbol: "⚾", default: "🏟️",
};

function getSportIcon(tipo = "") {
  const lower = tipo.toLowerCase();
  for (const [k, v] of Object.entries(SPORT_ICONS)) {
    if (k !== "default" && lower.includes(k)) return v;
  }
  return SPORT_ICONS.default;
}

/* ─── Formatting helpers ───────────────────────────────────────────── */
function formatPrice(price) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(Number(price));
}

function formatDateLong(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

function fmtTime(t) { return t ? t.slice(0, 5) : "–"; }

/** Compute hours between two "HH:MM" strings, rounded to 2 decimals */
function diffHours(inicio, fin) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100;
}

function renderStars(n = 4) {
  const r = Math.round(n);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

/* ─── Venue card renderer ──────────────────────────────────────────── */
function renderVenueCard(venue) {
  const imgSrc = venue.imagen_url?.startsWith("http")
    ? venue.imagen_url
    : `../assets/img/venues/${venue.imagen_url}`;

  return `
    <article class="venue-card" data-id="${venue.id}">
      <div class="venue-card__img">
        <img src="${imgSrc}" alt="${venue.nombre}"
             style="width:100%;height:100%;object-fit:cover"
             onerror="this.src='../assets/img/venues/Estadio_Ipiales.jpg'"/>
      </div>
      <div class="venue-card__body">
        <h3 class="venue-card__name">${venue.nombre}</h3>
        <p class="venue-card__location">📍 ${venue.ubicacion ?? "Ipiales"}</p>
        <div class="venue-card__tags">
          <span class="venue-card__tag venue-card__tag--green">${venue.tipo}</span>
        </div>
        <div class="venue-card__footer">
          <div>
            <div style="font-size:0.8rem;color:var(--color-orange);margin-bottom:0.3rem">
              ${renderStars(4)}
            </div>
            <div class="venue-card__price">
              ${formatPrice(venue.precio)}
              <span class="venue-card__price-unit">/hora</span>
            </div>
          </div>
        </div>
        <button class="venue-card__btn" onclick="Venues.openModal(${venue.id})">
          Reservar ahora
        </button>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════
   VENUES MODULE
   ═══════════════════════════════════════ */
const Venues = (() => {
  const gridEl  = document.getElementById("venues-grid");
  const countEl = document.getElementById("venues-count");

  /* ─── Load venues from DB ─── */
  async function load() {
    if (gridEl) gridEl.innerHTML = `
      <div class="venues__empty">
        <div class="venues__empty-icon">⏳</div>
        <h3>Cargando escenarios...</h3>
      </div>`;

    const { data, error } = await VenuesService.getEscenarios();

    if (error) {
      if (gridEl) gridEl.innerHTML = `
        <div class="venues__empty">
          <div class="venues__empty-icon">❌</div>
          <h3>Error al cargar</h3>
          <p>${error.message}</p>
        </div>`;
      return;
    }

    allVenues = data;
    render(currentFilter);
  }

  /* ─── Render filtered cards ─── */
  function render(filter = "todos") {
    currentFilter = filter;
    if (!gridEl) return;

    const filtered = filter === "todos"
      ? allVenues
      : allVenues.filter(v => v.tipo?.toLowerCase().includes(filter));

    gridEl.innerHTML = filtered.length === 0
      ? `<div class="venues__empty">
           <div class="venues__empty-icon">🔍</div>
           <h3>Sin resultados</h3>
           <p>No hay escenarios disponibles con ese filtro.</p>
         </div>`
      : filtered.map(renderVenueCard).join("");

    if (countEl) {
      const n = filtered.length;
      countEl.innerHTML = `Mostrando <strong>${n} espacio${n !== 1 ? "s" : ""}</strong> en Ipiales`;
    }
  }

  /* ─── Filter chip ─── */
  function applyFilter(type, chipEl) {
    document.querySelectorAll(".venues__filter-chip").forEach(c => c.classList.remove("active"));
    if (chipEl) chipEl.classList.add("active");
    render(type);
  }

  /* ──────────────────────────────────────────────────────────────────
     MODAL — 2-Step flow
  ────────────────────────────────────────────────────────────────── */

  /* Open the modal (step 1) */
  async function openModal(venueId) {
    const usuario = await VenuesService.getUsuarioActual();
    if (!usuario) {
      App.showToast("⚠️ Debes iniciar sesión para reservar");
      setTimeout(() => (window.location.href = "./login.html"), 1400);
      return;
    }

    selectedVenue = allVenues.find(v => v.id === venueId);
    if (!selectedVenue) return;

    // Populate venue info strip
    document.getElementById("modal-venue-name").textContent = selectedVenue.nombre;
    document.getElementById("modal-venue-tipo-precio").textContent =
      `${selectedVenue.tipo} · ${formatPrice(selectedVenue.precio)}/hora`;
    document.getElementById("rmodal-venue-icon").textContent = getSportIcon(selectedVenue.tipo);

    // Reset form
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("modal-fecha").min   = today;
    document.getElementById("modal-fecha").value = "";
    document.getElementById("modal-hora-inicio").value = "";
    document.getElementById("modal-hora-fin").value    = "";
    document.getElementById("modal-error").textContent = "";

    // Reset payment to efectivo
    _selectPayment("efectivo");

    // Go to step 1
    _goToStep(1);

    // Show overlay
    document.getElementById("reserva-modal").classList.add("open");
    document.body.style.overflow = "hidden";

    // Attach payment click listeners (fresh each open)
    document.querySelectorAll(".rmodal-payment-opt").forEach(opt => {
      opt.addEventListener("click", () => _selectPayment(opt.dataset.value));
    });
  }

  /* Close modal */
  function closeModal() {
    document.getElementById("reserva-modal").classList.remove("open");
    document.body.style.overflow = "";
    selectedVenue = null;
    _modalStep = 1;
  }

  /* ─── Step navigation ─── */

  function nextStep() {
    if (_modalStep === 1) _validateAndGoStep2();
    else if (_modalStep === 2) confirmarReserva();
  }

  function prevStep() {
    if (_modalStep === 2) _goToStep(1);
  }

  function _goToStep(step) {
    _modalStep = step;

    // Steps visibility
    document.getElementById("rmodal-step-1").classList.toggle("active", step === 1);
    document.getElementById("rmodal-step-2").classList.toggle("active", step === 2);
    document.getElementById("rmodal-success").classList.remove("active");

    // Header labels
    document.getElementById("rmodal-step-label").textContent = `Paso ${step} de 2`;
    document.getElementById("rmodal-title").textContent = step === 1
      ? "Elige fecha y horario"
      : "Resumen y pago";

    // Progress bar
    document.getElementById("rmodal-progress-bar").style.width = step === 1 ? "50%" : "100%";

    // Footer buttons
    const btnBack = document.getElementById("rmodal-btn-back");
    const btnNext = document.getElementById("rmodal-btn-next");
    btnBack.style.display = step === 2 ? "block" : "none";
    btnNext.innerHTML = step === 1
      ? `Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Confirmar Reserva`;

    // Footer visible
    document.getElementById("rmodal-footer").style.display = "flex";
  }

  /* ─── Step 1 validation → populate step 2 ─── */
  function _validateAndGoStep2() {
    const fecha      = document.getElementById("modal-fecha").value;
    const horaInicio = document.getElementById("modal-hora-inicio").value;
    const horaFin    = document.getElementById("modal-hora-fin").value;
    const errorEl    = document.getElementById("modal-error");

    if (!fecha || !horaInicio || !horaFin) {
      errorEl.textContent = "Por favor completa todos los campos.";
      return;
    }
    if (horaFin <= horaInicio) {
      errorEl.textContent = "La hora de fin debe ser después de la hora de inicio.";
      return;
    }
    errorEl.textContent = "";

    // Populate summary
    const hours = diffHours(horaInicio, horaFin);
    const total = (selectedVenue.precio ?? 0) * hours;

    document.getElementById("sum-venue").textContent    = selectedVenue.nombre;
    document.getElementById("sum-date").textContent     = formatDateLong(fecha);
    document.getElementById("sum-time").textContent     = `${fmtTime(horaInicio)} – ${fmtTime(horaFin)}`;
    document.getElementById("sum-duration").textContent = `${hours} hora${hours !== 1 ? "s" : ""}`;
    document.getElementById("sum-total").textContent    = formatPrice(total);

    _goToStep(2);
  }

  /* ─── Payment selector ─── */
  function _selectPayment(value) {
    document.querySelectorAll(".rmodal-payment-opt").forEach(opt => {
      const isSelected = opt.dataset.value === value;
      opt.classList.toggle("selected", isSelected);
      const radio = opt.querySelector("input[type=radio]");
      if (radio) radio.checked = isSelected;
    });
  }

  function _getSelectedPayment() {
    const checked = document.querySelector("input[name=metodo_pago]:checked");
    return checked ? checked.value : "efectivo";
  }

  /* ─── Step 2: confirm & save ─── */
  async function confirmarReserva() {
    const fecha      = document.getElementById("modal-fecha").value;
    const horaInicio = document.getElementById("modal-hora-inicio").value;
    const horaFin    = document.getElementById("modal-hora-fin").value;
    const metodoPago = _getSelectedPayment();
    const errorEl    = document.getElementById("modal-error-2");
    const btnNext    = document.getElementById("rmodal-btn-next");

    errorEl.textContent = "";
    btnNext.disabled    = true;
    btnNext.textContent = "Guardando…";

    const { error } = await VenuesService.insertReserva({
      escenario_id: selectedVenue.id,
      fecha,
      hora_inicio:  horaInicio,
      hora_fin:     horaFin,
      metodo_pago:  metodoPago,
    });

    btnNext.disabled = false;
    btnNext.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Confirmar Reserva`;

    if (error) {
      errorEl.textContent = "Error al guardar: " + (error.message ?? "inténtalo de nuevo.");
      return;
    }

    // Show success state
    _showSuccess(fecha, horaInicio, horaFin);
  }

  function _showSuccess(fecha, inicio, fin) {
    // Hide steps and footer
    document.getElementById("rmodal-step-1").classList.remove("active");
    document.getElementById("rmodal-step-2").classList.remove("active");
    document.getElementById("rmodal-footer").style.display = "none";

    // Update header
    document.getElementById("rmodal-step-label").textContent = "✅ Completado";
    document.getElementById("rmodal-title").textContent      = "¡Reserva Confirmada!";
    document.getElementById("rmodal-progress-bar").style.width = "100%";

    // Success message
    document.getElementById("success-text").textContent =
      `Tu reserva en ${selectedVenue.nombre} para el ${formatDateLong(fecha)} ` +
      `(${fmtTime(inicio)} – ${fmtTime(fin)}) ha sido registrada exitosamente.`;

    document.getElementById("rmodal-success").classList.add("active");
  }

  // Public API
  return { load, render, applyFilter, openModal, closeModal, nextStep, prevStep, confirmarReserva };
})();

window.Venues = Venues;

document.addEventListener("DOMContentLoaded", () => {
  Venues.load();

  // Close modal on overlay click
  const overlay = document.getElementById("reserva-modal");
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) Venues.closeModal();
    });
  }

  // Escape key closes modal
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay?.classList.contains("open")) Venues.closeModal();
  });
});
