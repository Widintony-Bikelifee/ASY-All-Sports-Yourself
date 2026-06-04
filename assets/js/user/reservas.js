/**
 * reservas.js script file.
 * Archivo de script reservas.js.
 */
"use strict";






const SPORT_ICONS = {
  futbol:       "⚽",
  baloncesto:   "🏀",
  tenis:        "🎾",
  voleibol:     "🏐",
  natacion:     "🏊",
  gimnasio:     "🏋️",
  padel:        "🏸",
  beisbol:      "⚾",
  default:      "🏟️",
};


const STATUS_LABELS = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada:  "Cancelada",
};




let _allReservas = [];


let _pendingCancelId = null;



const grid       = document.getElementById("reservas-grid");
const countEl    = document.getElementById("reservas-count");
const filterSts  = document.getElementById("filter-status");
const filterFrom = document.getElementById("filter-date-from");
const filterTo   = document.getElementById("filter-date-to");
const btnReset   = document.getElementById("btn-reset-filters");


const statTotal    = document.getElementById("stat-total-val");
const statPend     = document.getElementById("stat-pendiente-val");
const statComp     = document.getElementById("stat-completada-val");
const statCancel   = document.getElementById("stat-cancelada-val");


const modal          = document.getElementById("cancel-modal");
const modalVenue     = document.getElementById("modal-venue");
const modalDate      = document.getElementById("modal-date");
const modalTime      = document.getElementById("modal-time");
const modalBtnClose  = document.getElementById("modal-btn-cancel-close");
const modalBtnConfirm= document.getElementById("modal-btn-confirm-cancel");




/**
 * Format date.
 * Formatear date.
 */
function formatDate(isoDate) {
  if (!isoDate) return "–";
  const [y, m, d] = isoDate.split("-").map(Number);
  
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
    timeZone: "UTC",
  });
}


/**
 * Format time.
 * Formatear time.
 */
function formatTime(t) {
  if (!t) return "–";
  return t.slice(0, 5);
}


/**
 * Get sport icon.
 * Obtener sport icon.
 */
function getSportIcon(tipo = "") {
  const lower = tipo.toLowerCase();
  for (const [key, icon] of Object.entries(SPORT_ICONS)) {
    if (key !== "default" && lower.includes(key)) return icon;
  }
  return SPORT_ICONS.default;
}


/**
 * Format price.
 * Formatear price.
 */
function formatPrice(precio) {
  if (precio == null || precio === 0) return "Precio no especificado";
  return new Intl.NumberFormat("es-CO", {
    style:    "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(precio);
}

/**
 * Get relative page path.
 * Obtener relative page path.
 */
function getRelativePagePath(fileName) {
  const isUserPage = window.location.pathname.includes('/pages/user/');
  return `${isUserPage ? '../' : './'}${fileName}`;
}




/**
 * CheckAuth.
 * Realiza.
 */
async function checkAuth() {
  const { data } = await supabaseClient.auth.getSession();
  const session  = data?.session;

  if (!session) {
    window.location.href = getRelativePagePath('login.html');
    return null;
  }

  
  const userId = session.user.id;
  const { data: usuario } = await supabaseClient
    .from("usuarios")
    .select("nombre, apellido, correo_electronico")
    .eq("id", userId)
    .single();

  if (usuario) {
    const nameEl   = document.getElementById("user-name");
    const avatarEl = document.getElementById("user-avatar");
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarEmail = document.getElementById("sidebar-user-email");
    const sidebarAvatar = document.getElementById("sidebar-avatar-img");
    const fullName = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "Usuario";
    const email = usuario.correo_electronico || session.user.email || "";
    const avatarUrl = session.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;

    if (nameEl)   nameEl.textContent   = fullName;
    if (avatarEl) avatarEl.textContent = (usuario.nombre || "U").charAt(0).toUpperCase();

    if (sidebarName) sidebarName.textContent = fullName;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (sidebarAvatar) {
      sidebarAvatar.src = avatarUrl;
      sidebarAvatar.onerror = function() { this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`; };
    }
  }

  return session;
}




/**
 * ClearSkeletons.
 * Realiza.
 */
function clearSkeletons() {
  document.querySelectorAll(".reserva-skeleton").forEach(el => el.remove());
}


/**
 * BuildCard.
 * Realiza.
 */
function buildCard(r) {
  const esc    = r.escenarios ?? {};
  const status = r.estado ?? "pendiente";
  const icon   = getSportIcon(esc.tipo);
  const canCancel = status === "pendiente" || status === "confirmada";

  const card = document.createElement("article");
  card.className = `reserva-card reserva-card--${status}`;
  card.setAttribute("role", "listitem");
  card.setAttribute("data-id", r.id);

  card.innerHTML = `
    <div class="reserva-card__body">
      <!-- Header: name + sport type -->
      <div class="reserva-card__header">
        <h2 class="reserva-card__venue-name">${esc.nombre ?? "Cancha sin nombre"}</h2>
        <span class="reserva-card__type-tag">${icon} ${esc.tipo ?? "Deporte"}</span>
      </div>

      <!-- Location -->
      ${esc.ubicacion ? `
      <div class="reserva-card__info-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${esc.ubicacion}</span>
      </div>` : ""}

      <!-- Date -->
      <div class="reserva-card__info-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span><strong>${formatDate(r.fecha)}</strong></span>
      </div>

      <!-- Time -->
      <div class="reserva-card__info-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${formatTime(r.hora_inicio)} – ${formatTime(r.hora_fin)}</span>
      </div>

      <div class="reserva-card__divider"></div>

      <!-- Price -->
      <div class="reserva-card__info-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <span class="reserva-card__price">${formatPrice(esc.precio)}</span>
      </div>
    </div>

    <!-- Footer: status + cancel -->
    <div class="reserva-card__footer">
      <span class="status-badge status-badge--${status}">${STATUS_LABELS[status] ?? status}</span>
      <div style="display:flex;align-items:center;gap:0.6rem;">
        <span class="reserva-card__id">#${String(r.id).slice(0, 8)}</span>
        ${canCancel ? `
        <button
          class="reserva-card__btn-cancel"
          data-id="${r.id}"
          data-venue="${esc.nombre ?? "Cancha"}"
          data-date="${r.fecha}"
          data-inicio="${r.hora_inicio}"
          data-fin="${r.hora_fin}"
          aria-label="Cancelar reserva en ${esc.nombre}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Cancelar
        </button>` : ""}
      </div>
    </div>
  `;

  
  if (canCancel) {
    const btn = card.querySelector(".reserva-card__btn-cancel");
    btn.addEventListener("click", () => openCancelModal(btn.dataset));
  }

  return card;
}


/**
 * BuildEmptyState.
 * Realiza.
 */
function buildEmptyState(isFiltered) {
  const div = document.createElement("div");
  div.className = "reservas-empty";
  div.innerHTML = `
    <div class="reservas-empty__icon">${isFiltered ? "🔍" : "📅"}</div>
    <h3 class="reservas-empty__title">${isFiltered ? "Sin resultados" : "Sin reservas todavía"}</h3>
    <p class="reservas-empty__text">
      ${isFiltered
        ? "No se encontraron reservas con los filtros seleccionados. Prueba cambiando el estado o las fechas."
        : "Aún no has hecho ninguna reserva. Explora los espacios disponibles y agenda tu primera sesión."
      }
    </p>
    ${!isFiltered ? `<a href="${getRelativePagePath('venues.html')}" class="reservas-btn-primary" style="margin-top:0.5rem;">Explorar Canchas</a>` : ""}
  `;
  return div;
}




/**
 * Get filters.
 * Obtener filters.
 */
function getFilters() {
  return {
    status: filterSts.value,
    from:   filterFrom.value,   
    to:     filterTo.value,
  };
}


/**
 * ApplyFilters.
 * Realiza.
 */
function applyFilters() {
  const { status, from, to } = getFilters();

  return _allReservas.filter(r => {
    if (status && r.estado !== status) return false;
    if (from   && r.fecha < from)      return false;
    if (to     && r.fecha > to)        return false;
    return true;
  });
}




/**
 * Render stats.
 * Renderizar stats.
 */
function renderStats() {
  const total      = _allReservas.length;
  const pendiente  = _allReservas.filter(r => r.estado === "pendiente").length;
  const completada = _allReservas.filter(r => r.estado === "completada").length;
  const cancelada  = _allReservas.filter(r => r.estado === "cancelada").length;

  statTotal.textContent  = total;
  statPend.textContent   = pendiente;
  statComp.textContent   = completada;
  statCancel.textContent = cancelada;
}




/**
 * Render.
 * Renderizar.
 */
function render() {
  clearSkeletons();
  grid.innerHTML = "";

  const filtered = applyFilters();
  const { status, from, to } = getFilters();
  const isFiltered = !!(status || from || to);

  
  if (countEl) {
    if (_allReservas.length === 0) {
      countEl.textContent = "";
    } else {
      countEl.innerHTML = isFiltered
        ? `Mostrando <span>${filtered.length}</span> de <span>${_allReservas.length}</span> reservas`
        : `<span>${filtered.length}</span> reserva${filtered.length !== 1 ? "s" : ""} en total`;
    }
  }

  if (filtered.length === 0) {
    grid.appendChild(buildEmptyState(isFiltered));
    return;
  }

  filtered.forEach(r => grid.appendChild(buildCard(r)));
}




/**
 * Open cancel modal.
 * Abrir cancel modal.
 */
function openCancelModal({ id, venue, date, inicio, fin }) {
  _pendingCancelId = id;

  modalVenue.textContent = venue;
  modalDate.textContent  = formatDate(date);
  modalTime.textContent  = `${formatTime(inicio)} – ${formatTime(fin)}`;

  modalBtnConfirm.disabled = false;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}


/**
 * Close modal.
 * Cerrar modal.
 */
function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
  _pendingCancelId = null;
}


/**
 * ConfirmCancel.
 * Realiza.
 */
async function confirmCancel() {
  if (!_pendingCancelId) return;

  modalBtnConfirm.disabled = true;
  modalBtnConfirm.textContent = "Cancelando…";

  const { error } = await VenuesService.cancelReserva(_pendingCancelId);

  if (error) {
    App.showToast("❌ No se pudo cancelar la reserva. Inténtalo de nuevo.");
    modalBtnConfirm.disabled = false;
    modalBtnConfirm.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      Sí, cancelar
    `;
    return;
  }

  
  const idx = _allReservas.findIndex(r => String(r.id) === String(_pendingCancelId));
  if (idx !== -1) _allReservas[idx].estado = "cancelada";

  closeModal();
  renderStats();
  render();
  App.showToast("✅ Reserva cancelada correctamente.");
}



/**
 * AttachListeners.
 * Realiza.
 */
function attachListeners() {
  
  filterSts?.addEventListener("change", render);
  filterFrom?.addEventListener("change", render);
  filterTo?.addEventListener("change", render);

  btnReset?.addEventListener("click", () => {
    if (filterSts) filterSts.value  = "";
    if (filterFrom) filterFrom.value = "";
    if (filterTo) filterTo.value   = "";
    render();
  });

  
  modalBtnClose?.addEventListener("click",   closeModal);
  modalBtnConfirm?.addEventListener("click", confirmCancel);

  
  modal?.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  
  /**
   * Initialize page scripting once DOM content is ready.
   * Inicializa el script de la página cuando el contenido DOM está listo.
   */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal?.classList.contains("open")) closeModal();
  });
}



/**
 * Init.
 * Realiza.
 */
async function init() {
  
  if (!document.getElementById("reservas-grid")) {
    return;
  }

  
  const session = await checkAuth();
  if (!session) return;

  
  attachListeners();

  
  const { data, error } = await VenuesService.getMisReservas();

  clearSkeletons();

  if (error) {
    App.showToast("⚠️ Error al cargar las reservas. Recarga la página.");
    if (grid) {
      grid.innerHTML = "";
      grid.appendChild(buildEmptyState(false));
    }
    return;
  }

  _allReservas = data;

  
  renderStats();
  render();
}


/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */
document.addEventListener("DOMContentLoaded", init);
