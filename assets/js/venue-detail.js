"use strict";

/* ═══════════════════════════════════════
   venue-detail.js — Venue detail page logic
   Handles loading venue data from URL param,
   rendering the detail view, and reservation modal.
   ═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   LOCAL STATE
   ═══════════════════════════════════════ */
let venueData = null; // Current venue data

/* ═══════════════════════════════════════
   RENDER UTILITIES
   ═══════════════════════════════════════ */

/** Format price as Colombian currency */
function formatPrice(price) {
  return "$" + Number(price).toLocaleString("es-CO");
}

/** Render star rating string */
function renderStars(n = 4) {
  const r = Math.round(n);
  return "★".repeat(r) + "☆".repeat(5 - r);
}

/* ═══════════════════════════════════════
   VENUE DETAIL MODULE
   ═══════════════════════════════════════ */
const VenueDetail = (() => {

  /* ── Get venue ID from URL ?id= param ── */
  function getVenueId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || null;
  }

  /* ── Load venue data and render ── */
  async function load() {
    const venueId = getVenueId();

    // No ID → show error
    if (!venueId) {
      showError("No se proporcionó un ID de escenario.");
      return;
    }

    // Fetch venue from service
    const { data, error } = await VenuesService.getEscenarioById(venueId);

    // Handle error
    if (error || !data) {
      console.error("Error cargando escenario:", error);
      showError("El escenario no fue encontrado.");
      return;
    }

    // Store and render
    venueData = data;
    renderDetail(venueData);
  }

  /* ── Show error state ── */
  function showError(message) {
    document.getElementById("detail-loading").classList.add("hidden");
    document.getElementById("detail-content").classList.add("hidden");
    const errorEl = document.getElementById("detail-error");
    document.getElementById("detail-error-msg").textContent = message;
    errorEl.classList.remove("hidden");
  }

  /* ── Render venue detail into DOM ── */
  function renderDetail(venue) {
    // Hide loading, show content
    document.getElementById("detail-loading").classList.add("hidden");
    document.getElementById("detail-error").classList.add("hidden");
    document.getElementById("detail-content").classList.remove("hidden");

    // Hero image
    const heroImg = document.getElementById("detail-hero-img");
    const imgSrc = venue.imagen_url?.startsWith("http")
      ? venue.imagen_url
      : `../assets/img/venues/${venue.imagen_url}`;
    heroImg.src = imgSrc;
    heroImg.alt = venue.nombre;
    heroImg.onerror = () => { heroImg.src = "../assets/img/venues/Estadio_Ipiales.jpg"; };

    // Tag / tipo
    document.getElementById("detail-tipo").textContent = venue.tipo || "Cancha";

    // Title / nombre
    document.getElementById("detail-nombre").textContent = venue.nombre || "Sin nombre";

    // Location
    document.getElementById("detail-ubicacion").textContent = venue.ubicacion || "Ipiales";

    // Description
    const descContainer = document.getElementById("detail-descripcion-container");
    if (venue.descripcion) {
      document.getElementById("detail-descripcion").textContent = venue.descripcion;
      descContainer.style.display = "block";
    } else {
      descContainer.style.display = "none";
    }

    // Features list (capacity, equipment, etc.)
    const featuresList = document.getElementById("detail-features-list");
    featuresList.innerHTML = "";
    const features = buildFeaturesList(venue);
    if (features.length > 0) {
      features.forEach(f => {
        const li = document.createElement("li");
        li.textContent = f;
        featuresList.appendChild(li);
      });
      document.getElementById("detail-features").style.display = "block";
    } else {
      document.getElementById("detail-features").style.display = "none";
    }

    // Price
    document.getElementById("detail-precio").textContent = formatPrice(venue.precio || 0);

    // Rating (static 4.0 for now)
    const rating = venue.rating || 4;
    document.getElementById("detail-rating").innerHTML = `
      <span class="detail-rating__stars">${renderStars(rating)}</span>
      <span class="detail-rating__text">${rating}.0 (0 reseñas)</span>
    `;

    // Booking button → check auth then open modal
    document.getElementById("detail-btn-reservar").onclick = () => openModal();
  }

  /* ── Build features list from venue data ── */
  function buildFeaturesList(venue) {
    const features = [];
    if (venue.capacidad) features.push(`Capacidad: ${venue.capacidad} personas`);
    if (venue.equipamiento) features.push(`Equipamiento: ${venue.equipamiento}`);
    if (venue.iluminacion) features.push("Iluminación");
    if (venue.estacionamiento) features.push("Estacionamiento");
    if (venue.vestuarios) features.push("Vestuarios");
    if (venue.duchas) features.push("Duchas");
    if (venue.cover) features.push("Área cubierta");
    if (venue.tiene_cesped) features.push("Cesped natural");
    if (venue.tiene_sintetico) features.push("Cesped sintético");
    return features;
  }

  /* ── Open reservation modal ── */
  async function openModal() {
    // Check auth
    const usuario = await VenuesService.getUsuarioActual();
    if (!usuario) {
      App.showToast("⚠️ Debes iniciar sesión para reservar");
      setTimeout(() => window.location.href = "./login.html", 1500);
      return;
    }

    if (!venueData) return;

    // Populate modal
    document.getElementById("modal-venue-name").textContent = venueData.nombre;
    document.getElementById("modal-venue-tipo").textContent = venueData.tipo || "Cancha";
    document.getElementById("modal-venue-precio").textContent = formatPrice(venueData.precio) + " /hora";

    // Set min date to today
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("modal-fecha").min = today;
    document.getElementById("modal-fecha").value = "";
    document.getElementById("modal-hora-inicio").value = "";
    document.getElementById("modal-hora-fin").value = "";
    document.getElementById("modal-error").textContent = "";

    // Show modal
    document.getElementById("reserva-modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /* ── Close reservation modal ── */
  function closeModal() {
    document.getElementById("reserva-modal").classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ── Confirm reservation ── */
  async function confirmarReserva() {
    const fecha      = document.getElementById("modal-fecha").value;
    const horaInicio = document.getElementById("modal-hora-inicio").value;
    const horaFin    = document.getElementById("modal-hora-fin").value;
    const errorEl    = document.getElementById("modal-error");
    const btnEl      = document.getElementById("modal-btn-confirmar");

    // Validate
    if (!fecha || !horaInicio || !horaFin) {
      errorEl.textContent = "Por favor completa todos los campos.";
      return;
    }
    if (horaFin <= horaInicio) {
      errorEl.textContent = "La hora de fin debe ser después de la hora de inicio.";
      return;
    }

    // Submit
    errorEl.textContent = "";
    btnEl.disabled = true;
    btnEl.textContent = "Guardando...";

    const { error } = await VenuesService.insertReserva({
      escenario_id: venueData.id,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });

    btnEl.disabled = false;
    btnEl.textContent = "Confirmar Reserva";

    if (error) {
      console.error("Error al reservar:", error);
      errorEl.textContent = "Error al guardar la reserva: " + error.message;
      return;
    }

    closeModal();
    App.showToast(`✅ ¡Reserva confirmada en ${venueData.nombre}!`);
  }

  /* ── Public API ── */
  return { load, openModal, closeModal, confirmarReserva };

})();

// Expose globally
window.VenueDetail = VenueDetail;

/* ── Init on DOM ready ── */
document.addEventListener("DOMContentLoaded", () => {
  VenueDetail.load();

  // Form submit handler
  document.getElementById("modal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    VenueDetail.confirmarReserva();
  });
});