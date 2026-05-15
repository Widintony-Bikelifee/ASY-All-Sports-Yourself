/* ═══════════════════════════════════════
   admin-dashboard.js - Admin dashboard logic and CRUD
   Handles: venues CRUD, reservations management, tab switching.
   ═══════════════════════════════════════ */

const AdminDashboard = (() => {
  // ── DOM: Modal (Create/Edit Venue) ──
  const modal        = document.getElementById("venue-modal");
  const modalTitle   = document.getElementById("modal-title");
  const modalBtnSave = document.getElementById("modal-btn-save");
  const modalError   = document.getElementById("modal-error");
  const inputId        = document.getElementById("venue-id");
  const inputNombre    = document.getElementById("venue-nombre");
  const inputTipo      = document.getElementById("venue-tipo");
  const inputUbicacion = document.getElementById("venue-ubicacion");
  const inputPrecio    = document.getElementById("venue-precio");
  const inputImagen    = document.getElementById("venue-imagen");

  // ── State ──
  let allVenues   = [];
  let allReservas = [];
  let _activeTab  = "canchas";

  /* ─────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────── */
  async function init() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) { window.location.href = "./login.html"; return; }

      const role = await window.getUserRole();
      if (role !== "admin_cancha") {
        App.showToast("Acceso denegado. No tienes permisos de administrador.");
        setTimeout(() => { window.location.href = "./venues.html"; }, 1500);
        return;
      }

      // Set admin name in navbar
      const { data: usuario } = await supabaseClient
        .from("usuarios")
        .select("nombre, apellido")
        .eq("id", session.user.id)
        .single();
      if (usuario) {
        const nameEl   = document.getElementById("admin-name");
        const avatarEl = document.getElementById("admin-avatar");
        if (nameEl)   nameEl.textContent   = `${usuario.nombre} ${usuario.apellido}`;
        if (avatarEl) avatarEl.textContent = usuario.nombre.charAt(0).toUpperCase();
      }

      await loadDashboardData();
      await loadReservas();
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      App.showToast("Error de autenticación.");
      setTimeout(() => { window.location.href = "./login.html"; }, 1500);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     TAB SWITCHING
  ───────────────────────────────────────────────────────────────── */
  function switchTab(tab) {
    _activeTab = tab;

    // Toggle tab buttons
    document.getElementById("tab-canchas").classList.toggle("active", tab === "canchas");
    document.getElementById("tab-reservas").classList.toggle("active", tab === "reservas");

    // Toggle panels
    document.getElementById("panel-canchas").classList.toggle("active", tab === "canchas");
    document.getElementById("panel-reservas").classList.toggle("active", tab === "reservas");
  }

  /* ─────────────────────────────────────────────────────────────────
     VENUES (Canchas)
  ───────────────────────────────────────────────────────────────── */
  async function loadDashboardData() {
    if (!window.VenuesService) return;

    const { data: canchas, error } = await window.VenuesService.getMisEscenarios();
    if (error) { App.showToast("Error al cargar las canchas."); return; }

    allVenues = canchas ?? [];

    // Update stat
    const countEl = document.getElementById("stat-canchas-count");
    if (countEl) countEl.textContent = allVenues.length;

    const emptyState = document.getElementById("admin-empty-state");
    const container  = document.getElementById("dashboard-venues-container");
    const list       = document.getElementById("dashboard-venues-list");

    if (allVenues.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      if (container)  container.style.display  = "block";

      if (list) {
        list.innerHTML = allVenues.map(c => {
          const precioStr = c.precio ? Number(c.precio).toLocaleString("es-CO") : "0";
          return `
          <div class="dashboard-venue-card">
            <div class="dashboard-venue-info">
              <span class="dashboard-venue-title">${c.nombre}</span>
              <span class="dashboard-venue-meta">📍 ${c.ubicacion || "Sin ubicación"} &nbsp;•&nbsp; 💰 $${precioStr}/hr</span>
            </div>
            <div style="display:flex;gap:.5rem;">
              <button onclick="AdminDashboard.openModal(${c.id})" class="dashboard-venue-action">Editar</button>
              <button onclick="AdminDashboard.deleteVenue(${c.id})" class="dashboard-venue-action dashboard-venue-action--danger">Eliminar</button>
            </div>
          </div>`;
        }).join("");
      }
    } else {
      if (emptyState) emptyState.style.display = "flex";
      if (container)  container.style.display  = "none";
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     RESERVATIONS (Admin view)
  ───────────────────────────────────────────────────────────────── */
  async function loadReservas() {
    const tbody = document.getElementById("reservas-admin-tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando reservas…</td></tr>`;
    }

    console.log("[Admin] Iniciando carga de reservas...");

    // Get current user to show in console
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    console.log("[Admin] Usuario logueado ID:", userId);

    // Check venues for this admin
    const { data: misEsc } = await supabaseClient
      .from("escenarios")
      .select("id, nombre, propietario_id")
      .eq("propietario_id", userId);
    console.log("[Admin] Canchas del admin:", misEsc);

    // Check all reservations (without filter)
    const { data: todasReservas, error: errTodas } = await supabaseClient
      .from("reservas")
      .select("id, estado, escenario_id, usuario_id, fecha")
      .limit(20);
    console.log("[Admin] Todas las reservas visibles (sin filtro):", todasReservas, "Error:", errTodas);

    const { data, error } = await window.VenuesService.getReservasAdmin();
    console.log("[Admin] getReservasAdmin() resultado:", data, "Error:", error);

    if (error) {
      App.showToast("Error al cargar las reservas.");
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc2626;padding:3rem;">
        ❌ Error: ${error.message ?? JSON.stringify(error)}
      </td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:3rem;">
        📭 No hay reservas para tus canchas aún.
      </td></tr>`;
    }

    // Update stats
    const pendientes  = allReservas.filter(r => r.estado === "pendiente").length;
    const confirmadas = allReservas.filter(r => r.estado === "confirmada").length;

    const elPend = document.getElementById("stat-reservas-pendientes");
    const elConf = document.getElementById("stat-reservas-confirmadas");
    if (elPend) elPend.textContent = pendientes;
    if (elConf) elConf.textContent = confirmadas;

    // Estimated income: confirmed + completed reservations
    const income = allReservas
      .filter(r => r.estado === "confirmada" || r.estado === "completada")
      .reduce((acc, r) => {
        const hrs = _diffHours(r.hora_inicio, r.hora_fin);
        return acc + (r.escenarios?.precio ?? 0) * hrs;
      }, 0);
    const elInc = document.getElementById("stat-ingresos");
    if (elInc) elInc.textContent = _formatCOP(income);

    // Badge count (pending)
    const badge = document.getElementById("tab-reservas-badge");
    if (badge) {
      badge.textContent = pendientes > 0 ? pendientes : "";
      badge.style.display = pendientes > 0 ? "inline-flex" : "none";
    }

    // Populate venue filter dropdown
    _populateVenueFilter();

    // Render table
    renderReservasTable();
  }

  function _populateVenueFilter() {
    const sel = document.getElementById("res-filter-venue");
    if (!sel) return;

    const venueNames = [...new Set(allReservas.map(r => r.escenarios?.nombre).filter(Boolean))];
    sel.innerHTML = `<option value="">Todas las canchas</option>` +
      venueNames.map(n => `<option value="${n}">${n}</option>`).join("");
  }

  function filterReservas() { renderReservasTable(); }

  function renderReservasTable() {
    const statusFilter = document.getElementById("res-filter-status")?.value ?? "";
    const venueFilter  = document.getElementById("res-filter-venue")?.value  ?? "";
    const tbody = document.getElementById("reservas-admin-tbody");
    const countEl = document.getElementById("res-count");
    if (!tbody) return;

    const filtered = allReservas.filter(r => {
      if (statusFilter && r.estado !== statusFilter) return false;
      if (venueFilter  && r.escenarios?.nombre !== venueFilter) return false;
      return true;
    });

    if (countEl) countEl.textContent = `${filtered.length} reserva${filtered.length !== 1 ? "s" : ""}`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:3rem;">
        Sin reservas para los filtros seleccionados.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const u = r.usuarios;
      const esc = r.escenarios;
      const userName = u ? `${u.nombre} ${u.apellido}` : "–";
      const userSub  = u?.correo_electronico ?? "";
      const venueName = esc?.nombre ?? "–";
      const fecha = _formatDateShort(r.fecha);
      const horario = `${_fmtTime(r.hora_inicio)} – ${_fmtTime(r.hora_fin)}`;
      const pago = _paymentLabel(r.metodo_pago);
      const estado = r.estado ?? "pendiente";

      const actions = _buildActions(r.id, estado);

      return `
        <tr>
          <td>
            <strong style="display:block;font-weight:700;color:var(--text-dark);">${userName}</strong>
            <span style="font-size:.75rem;color:var(--text-muted);">${userSub}</span>
          </td>
          <td><strong>${venueName}</strong>${esc?.tipo ? `<br><span style="font-size:.75rem;color:var(--text-muted);">${esc.tipo}</span>` : ""}</td>
          <td>${fecha}</td>
          <td>${horario}</td>
          <td>${pago}</td>
          <td><span class="res-badge res-badge--${estado}">${_statusLabel(estado)}</span></td>
          <td><div style="display:flex;gap:.4rem;flex-wrap:wrap;">${actions}</div></td>
        </tr>`;
    }).join("");
  }

  function _buildActions(id, estado) {
    const btns = [];
    if (estado === "pendiente") {
      btns.push(`<button class="res-act-btn res-act-btn--confirm"   onclick="AdminDashboard.changeEstado('${id}','confirmada')">Confirmar</button>`);
      btns.push(`<button class="res-act-btn res-act-btn--cancel"    onclick="AdminDashboard.changeEstado('${id}','cancelada')">Cancelar</button>`);
    } else if (estado === "confirmada") {
      btns.push(`<button class="res-act-btn res-act-btn--complete"  onclick="AdminDashboard.changeEstado('${id}','completada')">Completar</button>`);
      btns.push(`<button class="res-act-btn res-act-btn--cancel"    onclick="AdminDashboard.changeEstado('${id}','cancelada')">Cancelar</button>`);
    } else {
      btns.push(`<span style="font-size:.75rem;color:var(--text-muted);">Sin acciones</span>`);
    }
    return btns.join("");
  }

  async function changeEstado(reservaId, nuevoEstado) {
    const labels = { confirmada: "confirmar", cancelada: "cancelar", completada: "completar" };
    if (!confirm(`¿Deseas ${labels[nuevoEstado]} esta reserva?`)) return;

    const { error } = await window.VenuesService.updateReservaEstado(reservaId, nuevoEstado);
    if (error) {
      App.showToast("❌ Error al actualizar la reserva.");
      return;
    }

    // Optimistic update
    const idx = allReservas.findIndex(r => String(r.id) === String(reservaId));
    if (idx !== -1) allReservas[idx].estado = nuevoEstado;

    const msgs = { confirmada: "✅ Reserva confirmada.", cancelada: "🔴 Reserva cancelada.", completada: "🏁 Reserva marcada como completada." };
    App.showToast(msgs[nuevoEstado] ?? "Reserva actualizada.");

    // Refresh stats + table
    await loadReservas();
    renderReservasTable();
  }

  /* ─────────────────────────────────────────────────────────────────
     MODAL: Create / Edit Venue
  ───────────────────────────────────────────────────────────────── */
  function openModal(id = null) {
    if (!modal) return;
    modalError.textContent = "";

    if (id) {
      const venue = allVenues.find(v => v.id === id);
      if (!venue) return;
      modalTitle.textContent   = "Editar Cancha";
      inputId.value       = venue.id;
      inputNombre.value   = venue.nombre;
      inputTipo.value     = venue.tipo;
      inputUbicacion.value = venue.ubicacion || "";
      inputPrecio.value   = venue.precio || "";
      inputImagen.value   = venue.imagen_url || "";
    } else {
      modalTitle.textContent   = "Añadir Cancha";
      inputId.value       = "";
      inputNombre.value   = "";
      inputTipo.value     = "";
      inputUbicacion.value = "";
      inputPrecio.value   = "";
      inputImagen.value   = "";
    }

    modal.classList.add("open");
  }

  function closeModal() {
    if (modal) modal.classList.remove("open");
  }

  async function saveVenue() {
    const nombre    = inputNombre.value.trim();
    const tipo      = inputTipo.value;
    const ubicacion = inputUbicacion.value.trim();
    const precio    = parseFloat(inputPrecio.value);
    const imagen_url = inputImagen.value.trim() || null;
    const id        = inputId.value;

    if (!nombre || !tipo || isNaN(precio) || precio < 0) {
      modalError.textContent = "Por favor completa todos los campos obligatorios correctamente.";
      return;
    }

    modalError.textContent   = "";
    modalBtnSave.disabled    = true;
    modalBtnSave.textContent = "Guardando...";

    const payload = { nombre, tipo, ubicacion, precio, imagen_url };
    const result  = id
      ? await window.VenuesService.updateEscenario(id, payload)
      : await window.VenuesService.insertEscenario(payload);

    modalBtnSave.disabled    = false;
    modalBtnSave.textContent = "Guardar Cancha";

    if (result.error) {
      modalError.textContent = "Error: " + result.error.message;
      return;
    }

    App.showToast(id ? "✅ Cancha actualizada." : "✅ Cancha creada.");
    closeModal();
    await loadDashboardData();
    await loadReservas();
  }

  async function deleteVenue(id) {
    if (!confirm("¿Eliminar esta cancha? Esta acción no se puede deshacer.")) return;

    const { error } = await window.VenuesService.deleteEscenario(id);
    if (error) { App.showToast("❌ Error al eliminar la cancha."); return; }

    App.showToast("🗑️ Cancha eliminada.");
    await loadDashboardData();
    await loadReservas();
  }

  /* ─────────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────────── */
  function _diffHours(inicio, fin) {
    if (!inicio || !fin) return 0;
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    return Math.max(0, Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100);
  }

  function _formatCOP(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  }

  function _formatDateShort(isoDate) {
    if (!isoDate) return "–";
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    });
  }

  function _fmtTime(t) { return t ? t.slice(0, 5) : "–"; }

  function _statusLabel(s) {
    return { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" }[s] ?? s;
  }

  function _paymentLabel(m) {
    const icons = { efectivo: "💵 Efectivo", transferencia: "🏦 Transferencia", tarjeta: "💳 Tarjeta", pse: "🌐 PSE" };
    return `<span style="font-size:.82rem;">${icons[m] ?? (m ?? "–")}</span>`;
  }

  return { init, switchTab, openModal, closeModal, saveVenue, deleteVenue, loadReservas, filterReservas, changeEstado };
})();

window.AdminDashboard = AdminDashboard;

document.addEventListener("DOMContentLoaded", () => {
  AdminDashboard.init();
});
