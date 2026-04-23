"use strict";

const VENUES_DATA = [
  {
    id: 1,
    name: "Cancha 11 – Estadio Municipal",
    type: "futbol",
    location: "Av. Panamericana, Ipiales",
    price: 35000,
    priceUnit: "/hora",
    rating: 5,
    slots: 3,
    tags: ["Pasto sintético", "Iluminación", "Vestidores"],
    img: "../assets/img/venues/Estadio_Ipiales.jpg",
  },
  {
    id: 2,
    name: "Cancha Baloncesto El Rosario",
    type: "baloncesto",
    location: "Barrio El Rosario, Ipiales",
    price: 25000,
    priceUnit: "/hora",
    rating: 4,
    slots: 1,
    tags: ["Techada", "Cancha dura", "Marcador digital"],
    img: "../assets/img/venues/Balconcesto_1.jpg",
  },
  {
    id: 3,
    name: "Cancha de Tenis #1",
    type: "tenis",
    location: "Estadio Municipal, Ipiales",
    price: 40000,
    priceUnit: "/hora",
    rating: 5,
    slots: 2,
    tags: ["Arcilla", "Alumbrado", "Juez de línea"],
    img: "../assets/img/venues/Tenis_1.jpg",
  },
  {
    id: 4,
    name: "Cancha Voleibol La Merced",
    type: "voleibol",
    location: "Barrio La Merced, Ipiales",
    price: 20000,
    priceUnit: "/hora",
    rating: 4,
    slots: 4,
    tags: ["Arena fina", "Vista panorámica", "Red profesional"],
    img: "../assets/img/venues/Voleivol_1.jpg",
  },
  {
    id: 5,
    name: "Gimnasio FuerZa Total",
    type: "gimnasio",
    location: "Calle 6 Centro, Ipiales",
    price: 80000,
    priceUnit: "/mes",
    rating: 5,
    slots: 99,
    tags: ["Equipos modernos", "Personal trainer", "Vestuarios"],
    img: "../assets/img/venues/Gimancio_1.jpg",
  },
  {
    id: 6,
    name: "Cancha Fútbol 5 – Norte",
    type: "futbol",
    location: "Zona Norte, Ipiales",
    price: 28000,
    priceUnit: "/hora",
    rating: 3,
    slots: 0,
    tags: ["Grama natural", "Sin techado", "Parqueadero"],
    img: "../assets/img/venues/futbol-5_1.jpg",
  },
  {
    id: 7,
    name: "Cancha Microfútbol – Centro",
    type: "futbol",
    location: "Centro Ipiales",
    price: 22000,
    priceUnit: "/hora",
    rating: 4,
    slots: 5,
    tags: ["Techada", "Piso laminado", "Gradería"],
    img: "../assets/img/venues/Microfutbol_1.jpg",
  },
  {
    id: 8,
    name: "Piscina Municipal",
    type: "natacion",
    location: "Av. Colombia, Ipiales",
    price: 15000,
    priceUnit: "/hora",
    rating: 4,
    slots: 8,
    tags: ["Temperatura controlada", "Instructores", "Carril olímpico"],
    img: "../assets/img/venues/Piscina_1.jpg",
  },
  {
    id: 9,
    name: "Cancha Básquet Panamericana",
    type: "baloncesto",
    location: "Vía Panamericana, Ipiales",
    price: 22000,
    priceUnit: "/hora",
    rating: 3,
    slots: 3,
    tags: ["Descubierta", "Cancha dura", "Cerca vial"],
    img: "../assets/img/venues/Baloncesto_2.jpg",
  },
];

/* STATE */
let currentFilter = "todos";

/* RENDER UTILITIES */

/**
 * Returns rotating tag colors.
 */
const TAG_COLORS = [
  "venue-card__tag--green",
  "venue-card__tag--orange",
  "venue-card__tag--blue",
];

/**
 * Formats a price number as Colombian currency.
 * @param {number} price
 * @returns {string}
 */
function formatPrice(price) {
  return "$" + price.toLocaleString("es-CO");
}

/**
 * Generates star rating display.
 * @param {number} rating — 1 to 5
 * @returns {string}
 */
function renderStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

/**
 * Generates availability HTML.
 * @param {number} slots
 * @returns {string}
 */
function renderAvailability(slots) {
  if (slots === 0)
    return `<span class="venue-card__avail full">● Sin disponibilidad</span>`;
  if (slots === 1)
    return `<span class="venue-card__avail busy">● ${slots} turno disponible</span>`;
  if (slots <= 3)
    return `<span class="venue-card__avail busy">● ${slots} turnos disponibles</span>`;
  return `<span class="venue-card__avail available">● ${slots} turnos disponibles</span>`;
}

/**
 * Generates venue card HTML.
 * @param {Object} venue
 * @returns {string}
 */
function renderVenueCard(venue) {
  const tags = venue.tags
    .map(
      (tag, i) =>
        `<span class="venue-card__tag ${TAG_COLORS[i % 3]}">${tag}</span>`,
    )
    .join("");

  return `
    <article class="venue-card" data-id="${venue.id}">
      <div class="venue-card__img">
        <img src="${venue.img}" alt="${venue.name}" style="width:100%;height:100%;object-fit:cover" />
      </div>
      <div class="venue-card__body">
        <h3 class="venue-card__name">${venue.name}</h3>
        <p class="venue-card__location">📍 ${venue.location}</p>
        <div class="venue-card__tags">${tags}</div>
        <div class="venue-card__footer">
          <div>
            <div style="font-size:0.8rem;color:var(--color-orange);margin-bottom:0.3rem">
              ${renderStars(venue.rating)}
            </div>
            <div class="venue-card__price">
              ${formatPrice(venue.price)}
              <span class="venue-card__price-unit">${venue.priceUnit}</span>
            </div>
          </div>
          <div style="text-align:right">
            ${renderAvailability(venue.slots)}
          </div>
        </div>
        <button class="venue-card__btn" onclick="Venues.selectVenue(${venue.id})">
          ${venue.slots > 0 ? "Reservar ahora" : "Ver más info"}
        </button>
      </div>
    </article>
  `;
}

/* VENUES MODULE */
const Venues = (() => {
  const gridEl = document.getElementById("venues-grid");
  const countEl = document.getElementById("venues-count");

  /**
   * Renders venues based on the active filter.
   * @param {string} filter — 'todos' | 'futbol' | 'baloncesto' | ...
   */
  function render(filter = "todos") {
    currentFilter = filter;
    if (!gridEl) return;

    const filtered =
      filter === "todos"
        ? VENUES_DATA
        : VENUES_DATA.filter((v) => v.type === filter);

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="venues__empty">
          <div class="venues__empty-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No hay escenarios disponibles con ese filtro.</p>
        </div>`;
    } else {
      gridEl.innerHTML = filtered.map(renderVenueCard).join("");
    }

    if (countEl) {
      countEl.innerHTML = `Mostrando <strong>${filtered.length} espacio${filtered.length !== 1 ? "s" : ""}</strong> en Ipiales`;
    }
  }

  /**
   * Applies a filter and updates active chips.
   * @param {string} type
   * @param {HTMLElement} chipEl
   */
  function applyFilter(type, chipEl) {
    document
      .querySelectorAll(".venues__filter-chip")
      .forEach((c) => c.classList.remove("active"));
    if (chipEl) chipEl.classList.add("active");
    render(type);
  }

  /**
   * Selects a venue and navigates to the booking page.
   * @param {number} id
   */
  function selectVenue(id) {
    const venue = VENUES_DATA.find((v) => v.id === id);
    if (!venue) return;

    // Save selection for booking.js
    window.selectedVenue = venue;

    // Update booking summary
    const nameEl = document.getElementById("book-venue-name");
    const emojiEl = document.getElementById("book-venue-emoji");
    const priceEl = document.getElementById("sum-price");
    const totalEl = document.getElementById("sum-total");
    const sumName = document.getElementById("sum-venue");
    const sumEmoji = document.getElementById("sum-emoji");

    if (nameEl) nameEl.textContent = venue.name;
    if (emojiEl) emojiEl.textContent = venue.emoji;
    if (sumEmoji) sumEmoji.textContent = venue.emoji;
    if (sumName) sumName.textContent = venue.name;
    if (priceEl) priceEl.textContent = formatPrice(venue.price);
    if (totalEl) totalEl.textContent = formatPrice(venue.price);

    App.showPage("venues"); // go to booking when ready
    App.showToast(`🏟️ Seleccionado: ${venue.name}`);
  }

  return { render, applyFilter, selectVenue };
})();

/* GLOBAL EXPORT */
window.Venues = Venues;
