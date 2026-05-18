"use strict";

/* ═══════════════════════════════════════
   venues.js - Venues page UI logic
   Handles rendering venue cards, filters, and reservation modal.
   All database operations are delegated to services/venuesService.js.
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   LOCAL STATE - Module-level variables
   ═══════════════════════════════════════ */
let allVenues     = [];      // All venues fetched from database
let currentFilter = "todos"; // Current active filter type
let selectedVenue = null;    // Venue selected for reservation

/* ═══════════════════════════════════════
   RENDER UTILITIES - Helper functions for UI
   ═══════════════════════════════════════ */

/* Formats price with Colombian locale currency symbol
   @param {number} price - Price value to format
   @returns {string} - Formatted price like "$50.000" */
function formatPrice(price) {
  return "$" + Number(price).toLocaleString("es-CO");
}

/* Renders star rating as text (e.g., "★★★★☆")
   @param {number} n - Rating value (default 4)
   @returns {string} - Star string */
function renderStars(n = 4) {
  const r = Math.round(n);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

/* Generates HTML for a single venue card
   @param {object} venue - Venue object from database
   @returns {string} - HTML string for the card */
function renderVenueCard(venue) {
  // Determine image source - use full URL or construct path
  const imgSrc = venue.imagen_url?.startsWith("http")
    ? venue.imagen_url
    : `../assets/img/venues/${venue.imagen_url}`;

  return `
    <article class="venue-card" data-id="${venue.id}" onclick="window.location.href='./venue-detail.html?id=${venue.id}'">
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
        <button class="venue-card__btn" onclick="event.stopPropagation(); Venues.openModal(${venue.id})">
          Reservar ahora
        </button>
      </div>
    </article>`;
}

/* ═══════════════════════════════════════
   VENUES MODULE - Main UI logic
   ═══════════════════════════════════════
   Uses IIFE pattern to encapsulate venues functionality
   */
const Venues = (() => {
  // Cache DOM elements
  const gridEl  = document.getElementById("venues-grid");
  const countEl = document.getElementById("venues-count");

  /* Loads all venues from service and renders them
     @returns {Promise<void>}
     @description - Shows loading state, fetches from VenuesService, handles errors */
  async function load() {
    // Show loading state
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="venues__empty">
          <div class="venues__empty-icon">⏳</div>
          <h3>Cargando escenarios...</h3>
        </div>`;
    }

    // Fetch venues from service layer
    const { data, error } = await VenuesService.getEscenarios();

    // Handle errors
    if (error) {
      console.error("Error cargando escenarios:", error);
      if (gridEl) gridEl.innerHTML = `
        <div class="venues__empty">
          <div class="venues__empty-icon">❌</div>
          <h3>Error al cargar</h3>
          <p>${error.message}</p>
        </div>`;
      return;
    }

    // Store data and render with current filter
    allVenues = data;
    render(currentFilter);
  }

  /* Renders venue cards with optional filter
     @param {string} filter - Filter type: "todos" or specific sport type
     @returns {void}
     @description - Filters venues and updates the grid HTML */
  function render(filter = "todos") {
    currentFilter = filter;
    if (!gridEl) return;

    // Apply filter or show all
    const filtered = filter === "todos"
      ? allVenues
      : allVenues.filter(v => v.tipo?.toLowerCase() === filter);

    // Show empty state or render cards
    gridEl.innerHTML = filtered.length === 0
      ? `<div class="venues__empty">
           <div class="venues__empty-icon">🔍</div>
           <h3>Sin resultados</h3>
           <p>No hay escenarios disponibles con ese filtro.</p>
         </div>`
      : filtered.map(renderVenueCard).join("");

    // Update count display
    if (countEl) {
      const n = filtered.length;
      countEl.innerHTML = `Mostrando <strong>${n} espacio${n !== 1 ? "s" : ""}</strong> en Ipiales`;
    }
  }

  /* Applies a filter chip selection
     @param {string} type - Filter type to apply
     @param {HTMLElement} chipEl - The clicked chip element
     @returns {void} */
  function applyFilter(type, chipEl) {
    // Remove active class from all chips
    document.querySelectorAll(".venues__filter-chip").forEach(c => c.classList.remove("active"));
    // Add active class to clicked chip
    if (chipEl) chipEl.classList.add("active");
    // Re-render with new filter
    render(type);
  }

  /* Opens reservation modal for a venue
     @param {number} venueId - ID of the venue to reserve
     @returns {Promise<void>}
     @description - Checks auth, populates modal, shows reservation form */
  async function openModal(venueId) {
    // Check if user is logged in via service
    const usuario = await VenuesService.getUsuarioActual();
    if (!usuario) {
      App.showToast("⚠️ Debes iniciar sesión para reservar");
      setTimeout(() => window.location.href = "./login.html", 1500);
      return;
    }

    // Find venue in local data
    selectedVenue = allVenues.find(v => v.id === venueId);
    if (!selectedVenue) return;

    // Populate modal with venue details
    document.getElementById("modal-venue-name").textContent  = selectedVenue.nombre;
    document.getElementById("modal-venue-tipo").textContent  = selectedVenue.tipo;
    document.getElementById("modal-venue-precio").textContent = formatPrice(selectedVenue.precio) + " /hora";

    // Reset form fields with today's date as minimum
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("modal-fecha").min   = today;
    document.getElementById("modal-fecha").value = "";
    document.getElementById("modal-hora-inicio").value = "";
    document.getElementById("modal-hora-fin").value    = "";
    document.getElementById("modal-error").textContent = "";

    // Show modal and disable background scroll
    document.getElementById("reserva-modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* Closes the reservation modal
     @returns {void}
     @description - Hides modal, re-enables scroll, clears selected venue */
  function closeModal() {
    document.getElementById("reserva-modal").classList.remove("open");
    document.body.style.overflow = "";
    selectedVenue = null;
  }

  /* Confirms and saves a reservation
     @returns {Promise<void>}
     @description - Validates form, calls VenuesService.insertReserva, shows result */
  async function confirmarReserva() {
    // Get form values
    const fecha      = document.getElementById("modal-fecha").value;
    const horaInicio = document.getElementById("modal-hora-inicio").value;
    const horaFin    = document.getElementById("modal-hora-fin").value;
    const errorEl    = document.getElementById("modal-error");
    const btnEl      = document.getElementById("modal-btn-confirmar");

    // Validate all fields are filled
    if (!fecha || !horaInicio || !horaFin) {
      errorEl.textContent = "Por favor completa todos los campos.";
      return;
    }
    // Validate end time is after start time
    if (horaFin <= horaInicio) {
      errorEl.textContent = "La hora de fin debe ser después de la hora de inicio.";
      return;
    }

    // Clear errors, disable button, show loading
    errorEl.textContent  = "";
    btnEl.disabled       = true;
    btnEl.textContent    = "Guardando...";

    // Delegate insert to service layer
    const { error } = await VenuesService.insertReserva({
      escenario_id: selectedVenue.id,
      fecha,
      hora_inicio:  horaInicio,
      hora_fin:     horaFin,
    });

    // Restore button state
    btnEl.disabled    = false;
    btnEl.textContent = "Confirmar Reserva";

    // Handle error or success
    if (error) {
      console.error("Error al reservar:", error);
      errorEl.textContent = "Error al guardar la reserva: " + error.message;
      return;
    }

    // Close modal and show success
    closeModal();
    App.showToast(`✅ ¡Reserva confirmada en ${selectedVenue.nombre}!`);
  }

  // Public API - expose these functions externally
  return { load, render, applyFilter, openModal, closeModal, confirmarReserva };
})();

// Expose globally for inline onclick handlers
window.Venues = Venues;

/* ═══════════════════════════════════════
   INITIALIZATION - Load venues on page load
   ═══════════════════════════════════════
   @description - Initializes Venues module when DOM is ready
   */
document.addEventListener("DOMContentLoaded", () => {
  Venues.load();
});
