/**
 * home.js script file.
 * Archivo de script home.js.
 */
"use strict";

/**
 * Load home venues.
 * Cargar home venues.
 */

async function loadHomeVenues() {
  const gridEl = document.getElementById("home-venues-grid");
  if (!gridEl) return;

  gridEl.innerHTML = `
    <div class="col-12">
      <div class="venues__empty">
        <div class="venues__empty-icon">⏳</div>
        <h3>Cargando espacios...</h3>
      </div>
    </div>`;

  if (!window.VenuesService) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="venues__empty">
          <div class="venues__empty-icon">❌</div>
          <h3>No se pudo cargar los espacios</h3>
          <p>El servicio de espacios no está disponible.</p>
        </div>
      </div>`;
    return;
  }

  const { data, error } = await window.VenuesService.getEscenarios();
  if (error) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="venues__empty">
          <div class="venues__empty-icon">❌</div>
          <h3>Error al cargar los espacios</h3>
          <p>${error.message || 'Intenta recargar la página.'}</p>
        </div>
      </div>`;
    return;
  }

  const venues = data ?? [];
  updateCoverageSection(venues);

  if (!venues.length) {
    gridEl.innerHTML = `
      <div class="col-12">
        <div class="venues__empty">
          <div class="venues__empty-icon">📭</div>
          <h3>No hay espacios disponibles</h3>
          <p>Pronto tendremos más escenarios deportivos en Ipiales.</p>
        </div>
      </div>`;
    return;
  }

  gridEl.innerHTML = venues.slice(0, 4).map(renderHomeVenueCard).join("");
}

/**
 * Update coverage section.
 * Actualizar coverage section.
 */

function updateCoverageSection(venues) {
  const coverageEl = document.getElementById("home-coverage-grid");
  if (!coverageEl) return;

  const cards = venues.slice(0, 4).map(renderCoverageCard);
  if (!cards.length) {
    coverageEl.innerHTML = `
      <div class="col-12">
        <div class="venues__empty">
          <div class="venues__empty-icon">📭</div>
          <h3>No hay barrios disponibles</h3>
          <p>Los nombres de las canchas se cargarán en breve.</p>
        </div>
      </div>`;
    return;
  }

  coverageEl.innerHTML = cards.join("");
}

/**
 * Render coverage card.
 * Renderizar coverage card.
 */

function renderCoverageCard(venue) {
  const displayName = venue.nombre || "Espacio deportivo";
  const displayType = venue.tipo || "Espacio";
  const displayLocation = venue.ubicacion || "Ipiales";

  return `
    <div class="col-6 col-md-3">
      <div class="card border-0 bg-light h-100">
        <div class="card-body">
          <i class="bi bi-geo-alt fs-1 text-success" ></i>
          <p class="fw-bold mt-2 mb-0">${displayName}</p>
          <small class="text-secondary">${displayType} • ${displayLocation}</small>
        </div>
      </div>
    </div>`;
}

/**
 * Format price.
 * Formatear price.
 */

function formatPrice(value) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(number);
}

/**
 * Render home venue card.
 * Renderizar home venue card.
 */

function renderHomeVenueCard(venue) {
  const imgSrc = venue.imagen_url?.startsWith("http")
    ? venue.imagen_url
    : `./assets/img/venues/${venue.imagen_url ?? "Logo-ASY.png"}`;
  const displayName = venue.nombre || "Espacio deportivo";
  const displayLocation = venue.ubicacion || "Ipiales";
  const displayType = venue.tipo || "Espacio";
  const priceLabel = formatPrice(venue.precio ?? 0);

  return `
    <div class="col-12 col-md-6 col-lg-3">
      <article class="card h-100 shadow-sm border-0">
        <img src="${imgSrc}" alt="${displayName}" class="card-img-top" onerror="this.src='./assets/img/Logo-ASY.png'" />
        <div class="card-body d-flex flex-column">
          <h3 class="h5 fw-bold mb-2">${displayName}</h3>
          <p class="text-muted small mb-2">📍 ${displayLocation}</p>
          <span class="badge rounded-pill bg-success text-white mb-3">${displayType}</span>
          <div class="mt-auto">
            <div class="mb-3">
              <strong class="d-block">${priceLabel}</strong>
              <small class="text-muted">/hora</small>
            </div>
            <a href="./pages/venues.html?pendingVenueId=${encodeURIComponent(venue.id)}" class="btn btn-primary w-100 rounded-pill">
              Ver espacio
            </a>
          </div>
        </div>
      </article>
    </div>`;
}

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener("DOMContentLoaded", () => {
  loadHomeVenues();
});
