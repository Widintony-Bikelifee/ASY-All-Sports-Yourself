"use strict";




let allVenues     = [];
let currentFilter = "todos";
let selectedVenue = null;
let _modalStep    = 1;   


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

const PENDING_VENUE_KEY = "pendingVenue";

function savePendingVenue(venue) {
  if (!venue || !venue.id) return;
  sessionStorage.setItem(PENDING_VENUE_KEY, JSON.stringify({
    id: venue.id,
    nombre: venue.nombre,
  }));
}

function getStoredPendingVenue() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_VENUE_KEY));
  } catch {
    return null;
  }
}

function clearStoredPendingVenue() {
  sessionStorage.removeItem(PENDING_VENUE_KEY);
}

function highlightVenueCard(venueId) {
  if (!venueId) return;
  const card = document.querySelector(`.venue-card[data-id="${venueId}"]`);
  if (!card) return;

  document.querySelectorAll(".venue-card--highlight").forEach(el => el.classList.remove("venue-card--highlight"));
  card.classList.add("venue-card--highlight");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

function restorePendingVenue() {
  const params = new URLSearchParams(window.location.search);
  const pendingParam = params.get("pendingVenueId");
  const stored = getStoredPendingVenue();
  const venueId = pendingParam || stored?.id;

  if (!venueId) return;

  highlightVenueCard(venueId);

  if (stored) clearStoredPendingVenue();
  if (pendingParam) {
    const url = new URL(window.location.href);
    url.searchParams.delete("pendingVenueId");
    window.history.replaceState({}, "", url.toString());
  }

  App.showToast("Has regresado a la cancha que seleccionaste.");
}

function fmtTime(t) { return t ? t.slice(0, 5) : "–"; }


function diffHours(inicio, fin) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100;
}

function renderStars(n = 4) {
  const r = Math.round(n);
  return "★".repeat(r) + "☆".repeat(5 - r);
}


function renderVenueCard(venue) {
  
  const isUserPage = window.location.pathname.includes('/pages/user/');
  const assetsBase = isUserPage ? '../../assets' : '../assets';
  const imgSrc = venue.imagen_url?.startsWith('http')
    ? venue.imagen_url
    : `${assetsBase}/img/venues/${venue.imagen_url}`;

  return `
    <div class="col">
      <article class="card h-100 venue-card" data-id="${venue.id}">
        <div class="venue-card__img">
          <img src="${imgSrc}" alt="${venue.nombre}"
               onerror="this.src='../assets/img/venues/Estadio_Ipiales.jpg'" />
        </div>
        <div class="card-body d-flex flex-column">
          <h3 class="venue-card__name">${venue.nombre}</h3>
          <p class="text-muted mb-3">📍 ${venue.ubicacion ?? "Ipiales"}</p>
          <div class="d-flex flex-wrap gap-2 mb-3">
            <span class="badge rounded-pill bg-success text-white">${venue.tipo}</span>
          </div>
          <div class="mb-3">
            <div class="text-warning mb-2" style="font-size:0.9rem;">${renderStars(4)}</div>
            <div class="venue-card__price">
              ${formatPrice(venue.precio)}
              <small class="text-muted">/hora</small>
            </div>
          </div>
          <button class="btn btn-success mt-auto w-100" onclick="Venues.openModal(${venue.id})">
            Reservar ahora
          </button>
        </div>
      </article>
    </div>`;
}


const Venues = (() => {
  const gridEl  = document.getElementById("venues-grid");
  const countEl = document.getElementById("venues-count");

  
  async function load() {
    if (gridEl) gridEl.innerHTML = `
      <div class="col-12">
        <div class="venues__empty">
          <div class="venues__empty-icon">⏳</div>
          <h3>Cargando escenarios...</h3>
        </div>
      </div>`;

    const { data, error } = await VenuesService.getEscenarios();

    if (error) {
      if (gridEl) gridEl.innerHTML = `
        <div class="col-12">
          <div class="venues__empty">
            <div class="venues__empty-icon">❌</div>
            <h3>Error al cargar</h3>
            <p>${error.message}</p>
          </div>
        </div>`;
      return;
    }

    allVenues = data;
    render(currentFilter);
  }

  
  function render(filter = "todos") {
    currentFilter = filter;
    if (!gridEl) return;

    const filtered = filter === "todos"
      ? allVenues
      : allVenues.filter(v => v.tipo?.toLowerCase().includes(filter));

    gridEl.innerHTML = filtered.length === 0
      ? `<div class="col-12">
           <div class="venues__empty">
             <div class="venues__empty-icon">🔍</div>
             <h3>Sin resultados</h3>
             <p>No hay escenarios disponibles con ese filtro.</p>
           </div>
         </div>`
      : filtered.map(renderVenueCard).join("");

    if (countEl) {
      const n = filtered.length;
      countEl.innerHTML = `Mostrando <strong>${n} espacio${n !== 1 ? "s" : ""}</strong> en Ipiales`;
    }
  }

  
  function applyFilter(type, chipEl) {
    document.querySelectorAll(".venues__filter-chip").forEach(c => c.classList.remove("active"));
    if (chipEl) chipEl.classList.add("active");
    render(type);
  }

  

  
  async function openModal(venueId) {
    selectedVenue = allVenues.find(v => v.id === venueId);
    if (!selectedVenue) return;

    const usuario = await VenuesService.getUsuarioActual();
    if (!usuario) {
      App.showToast("⚠️ Debes iniciar sesión para reservar");
      setTimeout(() => (window.location.href = "./login.html"), 1400);
      return;
    }

    
    const isUserFolder = window.location.pathname.includes('/user/');
    const targetUrl = isUserFolder ? `../reservations_page.html?venueId=${venueId}` : `./reservations_page.html?venueId=${venueId}`;
    
    
    window.location.href = targetUrl;
  }

  
  function closeModal() {
    document.getElementById("reserva-modal").classList.remove("open");
    document.body.style.overflow = "";
    selectedVenue = null;
    _modalStep = 1;
  }

  

  function nextStep() {
    if (_modalStep === 1) _validateAndGoStep2();
    else if (_modalStep === 2) confirmarReserva();
  }

  function prevStep() {
    if (_modalStep === 2) _goToStep(1);
  }

  function _goToStep(step) {
    _modalStep = step;

    
    document.getElementById("rmodal-step-1").classList.toggle("active", step === 1);
    document.getElementById("rmodal-step-2").classList.toggle("active", step === 2);
    document.getElementById("rmodal-success").classList.remove("active");

    
    document.getElementById("rmodal-step-label").textContent = `Paso ${step} de 2`;
    document.getElementById("rmodal-title").textContent = step === 1
      ? "Elige fecha y horario"
      : "Resumen y pago";

    
    document.getElementById("rmodal-progress-bar").style.width = step === 1 ? "50%" : "100%";

    
    const btnBack = document.getElementById("rmodal-btn-back");
    const btnNext = document.getElementById("rmodal-btn-next");
    btnBack.style.display = step === 2 ? "block" : "none";
    btnNext.innerHTML = step === 1
      ? `Siguiente <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Confirmar Reserva`;

    
    document.getElementById("rmodal-footer").style.display = "flex";
  }

  
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

    
    const hours = diffHours(horaInicio, horaFin);
    const total = (selectedVenue.precio ?? 0) * hours;

    document.getElementById("sum-venue").textContent    = selectedVenue.nombre;
    document.getElementById("sum-date").textContent     = formatDateLong(fecha);
    document.getElementById("sum-time").textContent     = `${fmtTime(horaInicio)} – ${fmtTime(horaFin)}`;
    document.getElementById("sum-duration").textContent = `${hours} hora${hours !== 1 ? "s" : ""}`;
    document.getElementById("sum-total").textContent    = formatPrice(total);

    _goToStep(2);
  }

  
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

    
    _showSuccess(fecha, horaInicio, horaFin);
  }

  function _showSuccess(fecha, inicio, fin) {
    
    document.getElementById("rmodal-step-1").classList.remove("active");
    document.getElementById("rmodal-step-2").classList.remove("active");
    document.getElementById("rmodal-footer").style.display = "none";

    
    document.getElementById("rmodal-step-label").textContent = "✅ Completado";
    document.getElementById("rmodal-title").textContent      = "¡Reserva Confirmada!";
    document.getElementById("rmodal-progress-bar").style.width = "100%";

    
    document.getElementById("success-text").textContent =
      `Tu reserva en ${selectedVenue.nombre} para el ${formatDateLong(fecha)} ` +
      `(${fmtTime(inicio)} – ${fmtTime(fin)}) ha sido registrada exitosamente.`;

    document.getElementById("rmodal-success").classList.add("active");
  }

  
  return { load, render, applyFilter, openModal, closeModal, nextStep, prevStep, confirmarReserva };
})();

window.Venues = Venues;

document.addEventListener("DOMContentLoaded", async () => {
  
  if (!document.getElementById("venues-grid")) {
    return;
  }

  await Venues.load();
  restorePendingVenue();

  
  const overlay = document.getElementById("reserva-modal");
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) Venues.closeModal();
    });
  }

  
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && overlay?.classList.contains("open")) Venues.closeModal();
  });
});
