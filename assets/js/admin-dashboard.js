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
      if (!session) { window.location.href = "../login.html"; return; }

      const role = await window.getUserRole();
      if (role !== "admin_cancha") {
        App.showToast("Acceso denegado. No tienes permisos de administrador.");
        setTimeout(() => { window.location.href = "../venues.html"; }, 1500);
        return;
      }

      // Set admin profile in sidebar
      const profile = await window.getUserProfile(session.user.id);
      if (profile) {
        const fullName = `${profile.nombre} ${profile.apellido}`;
        const email = profile.correo_electronico || session.user.email;
        
        const nameEl = document.getElementById("sidebar-user-name");
        const emailEl = document.getElementById("sidebar-user-email");
        const avatarImg = document.getElementById("sidebar-avatar-img");
        
        if (nameEl) nameEl.textContent = fullName;
        if (emailEl) emailEl.textContent = email;
        if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;

        // Populate Profile Form (edit inputs)
        const profileName = document.getElementById('profile-name');
        const profileLastname = document.getElementById('profile-lastname');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        if (profileName) profileName.value = profile.nombre;
        if (profileLastname) profileLastname.value = profile.apellido;
        if (profileEmail) profileEmail.value = email;
        if (profilePhone) profilePhone.value = profile.telefono || '';

        // Populate hero + view-mode fields
        _refreshProfileView(profile, email, session.user);
      }

      // Setup Profile Save
      const profileForm = document.getElementById('profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btnSave = document.getElementById('btn-save');
          btnSave.textContent = 'Guardando...';
          btnSave.disabled = true;

          const updatedData = {
            nombre: document.getElementById('profile-name').value.trim(),
            apellido: document.getElementById('profile-lastname').value.trim(),
            telefono: document.getElementById('profile-phone').value.trim()
          };

          try {
            await window.updateUserProfile(session.user.id, updatedData);
            App.showToast('✅ Perfil actualizado correctamente');
            const newFullName = `${updatedData.nombre} ${updatedData.apellido}`;
            // Update sidebar
            document.getElementById('sidebar-user-name').textContent = newFullName;
            document.getElementById('sidebar-avatar-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newFullName)}&background=2ecc50&color=fff`;
            // Refresh view-mode fields & hero
            _refreshProfileView({ nombre: updatedData.nombre, apellido: updatedData.apellido, telefono: updatedData.telefono }, email, session.user);
            // Switch back to view mode
            _setProfileEditMode(false);
          } catch (err) {
            App.showToast('❌ Error al actualizar el perfil');
          } finally {
            btnSave.textContent = 'Guardar Cambios';
            btnSave.disabled = false;
          }
        });
      }
      
      // Setup Logout Button for sidebar
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await supabaseClient.auth.signOut();
          window.location.href = "../../index.html";
        });
      }

      await loadDashboardData();
      await loadReservas();

      // SPA Tab parameter routing
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['canchas', 'reservas', 'profile'].includes(tabParam)) {
        switchTab(tabParam);
      } else {
        switchTab('canchas');
      }
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      App.showToast("Error de autenticación.");
      setTimeout(() => { window.location.href = "../login.html"; }, 1500);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     TAB SWITCHING
  ───────────────────────────────────────────────────────────────── */
  function switchTab(tab) {
    _activeTab = tab;

    const ALL_TABS = ["canchas", "reservas", "clientes", "reportes", "profile"];

    // Update sidebar active state
    ALL_TABS.forEach(t => {
      document.getElementById(`sidebar-tab-${t}`)?.classList.toggle("active", tab === t);
    });

    // Show only the active panel, hide the rest
    ALL_TABS.forEach(t => {
      document.getElementById(`panel-${t}`)?.classList.toggle("active", tab === t);
    });

    // Scroll main content to top on every tab change
    document.querySelector(".main-content")?.scrollTo({ top: 0, behavior: "smooth" });

    // Update sidebar badge visibility
    const badge = document.getElementById("sidebar-badge-reservas");
    if (badge) {
      const pending = parseInt(badge.textContent) || 0;
      badge.style.display = pending > 0 ? "inline-flex" : "none";
    }

    // Auto-load data when entering each section
    if (tab === "clientes") loadClientes();
    if (tab === "reportes") loadReportes();
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

    allReservas = data ?? [];

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

    // Badge count (pending) — update sidebar badge
    const badge = document.getElementById("sidebar-badge-reservas");
    if (badge) {
      badge.textContent = pendientes > 0 ? String(pendientes) : "";
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


  /* ─────────────────────────────────────────────────────────────────
     CLIENTES
  ───────────────────────────────────────────────────────────────── */
  let _allClientes = [];

  async function loadClientes() {
    const tbody = document.getElementById("clientes-tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando clientes…</td></tr>`;
    }

    // Build client list from existing reservations data
    const { data, error } = await window.VenuesService.getReservasAdmin();
    if (error || !data) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#dc2626;padding:3rem;">❌ Error al cargar clientes.</td></tr>`;
      return;
    }

    // Group by user
    const clientMap = {};
    data.forEach(r => {
      const uid = r.usuario_id;
      if (!uid) return;
      const u = r.usuarios ?? {};
      if (!clientMap[uid]) {
        clientMap[uid] = {
          nombre: `${u.nombre ?? "–"} ${u.apellido ?? ""}`.trim(),
          correo: u.correo_electronico ?? "–",
          telefono: u.telefono ?? "–",
          reservas: [],
        };
      }
      clientMap[uid].reservas.push(r);
    });

    _allClientes = Object.values(clientMap).map(c => {
      const sorted = [...c.reservas].sort((a, b) => b.fecha?.localeCompare(a.fecha));
      const ultima = sorted[0];
      // Most used venue
      const venueCounts = {};
      c.reservas.forEach(r => {
        const n = r.escenarios?.nombre ?? "–";
        venueCounts[n] = (venueCounts[n] ?? 0) + 1;
      });
      const favorita = Object.entries(venueCounts).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "–";
      return { ...c, ultimaFecha: ultima?.fecha, ultimaCancha: ultima?.escenarios?.nombre ?? "–", favorita };
    });

    _renderClientes(_allClientes);
  }

  function _renderClientes(list) {
    const tbody = document.getElementById("clientes-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:3rem;">Sin clientes registrados aún.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(c => {
      const initials = c.nombre.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
      const fechaStr = c.ultimaFecha ? _formatDateShort(c.ultimaFecha) : "–";
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:.75rem;">
              <div style="width:36px;height:36px;border-radius:50%;background:rgba(46,204,80,.15);
                          color:var(--color-green-dark);font-weight:800;font-size:.8rem;
                          display:flex;align-items:center;justify-content:center;flex-shrink:0;">${initials}</div>
              <div>
                <strong style="display:block;color:var(--text-dark);">${c.nombre}</strong>
                <span style="font-size:.75rem;color:var(--text-muted);">${c.correo}</span>
              </div>
            </div>
          </td>
          <td style="color:var(--text-muted);font-size:.85rem;">${c.telefono}</td>
          <td>
            <span style="font-weight:700;color:var(--text-dark);">${c.reservas.length}</span>
            <span style="font-size:.75rem;color:var(--text-muted);margin-left:.25rem;">reserva${c.reservas.length !== 1 ? "s" : ""}</span>
          </td>
          <td style="font-size:.85rem;color:var(--text-muted);">${fechaStr}</td>
          <td>
            <span style="background:rgba(46,204,80,.1);color:#065f46;padding:.2rem .6rem;
                         border-radius:99px;font-size:.75rem;font-weight:700;">${c.favorita}</span>
          </td>
        </tr>`;
    }).join("");
  }

  function filterClientes() {
    const q = document.getElementById("clientes-search")?.value.toLowerCase() ?? "";
    if (!q) { _renderClientes(_allClientes); return; }
    const filtered = _allClientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q)
    );
    _renderClientes(filtered);
  }

  /* ─────────────────────────────────────────────────────────────────
     REPORTES
  ───────────────────────────────────────────────────────────────── */
  async function loadReportes() {
    // Use existing allReservas if loaded, otherwise fetch
    const reservas = allReservas.length > 0 ? allReservas : (await window.VenuesService.getReservasAdmin()).data ?? [];

    // ── KPIs ──
    const total      = reservas.length;
    const pendientes = reservas.filter(r => r.estado === "pendiente").length;
    const confirmadas= reservas.filter(r => r.estado === "confirmada").length;
    const completadas= reservas.filter(r => r.estado === "completada").length;
    const canceladas = reservas.filter(r => r.estado === "cancelada").length;

    const ingresos = reservas
      .filter(r => r.estado === "confirmada" || r.estado === "completada")
      .reduce((acc, r) => acc + (r.escenarios?.precio ?? 0) * _diffHours(r.hora_inicio, r.hora_fin), 0);

    const kpiEl = document.getElementById("reportes-kpis");
    if (kpiEl) {
      const kpis = [
        { label: "Total Reservas",   value: total,      color: "#6366f1", icon: "📅" },
        { label: "Completadas",      value: completadas, color: "#10b981", icon: "✅" },
        { label: "Pendientes",       value: pendientes,  color: "#f59e0b", icon: "⏳" },
        { label: "Canceladas",       value: canceladas,  color: "#ef4444", icon: "❌" },
        { label: "Ingresos Est.",    value: _formatCOP(ingresos), color: "#2ecc50", icon: "💰" },
      ];
      kpiEl.innerHTML = kpis.map(k => `
        <div style="background:var(--bg-white);border:1px solid var(--border-light);
                    border-radius:var(--radius-md);padding:1.25rem;
                    box-shadow:0 4px 15px rgba(0,0,0,.03);text-align:center;">
          <div style="font-size:1.6rem;margin-bottom:.35rem;">${k.icon}</div>
          <div style="font-size:1.5rem;font-weight:800;color:${k.color};font-family:var(--font-display);">${k.value}</div>
          <div style="font-size:.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px;">${k.label}</div>
        </div>`).join("");
    }

    // ── Reservas por cancha ──
    const byCanchaEl = document.getElementById("reportes-por-cancha");
    if (byCanchaEl) {
      const counts = {};
      reservas.forEach(r => {
        const n = r.escenarios?.nombre ?? "Sin nombre";
        counts[n] = (counts[n] ?? 0) + 1;
      });
      const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
      const maxVal  = entries[0]?.[1] ?? 1;

      if (entries.length === 0) {
        byCanchaEl.innerHTML = `<p style="color:var(--text-muted);font-size:.9rem;">Sin datos.</p>`;
      } else {
        byCanchaEl.innerHTML = entries.map(([name, count]) => {
          const pct = Math.round((count / maxVal) * 100);
          return `
            <div style="margin-bottom:1rem;">
              <div style="display:flex;justify-content:space-between;margin-bottom:.35rem;">
                <span style="font-size:.88rem;font-weight:600;color:var(--text-dark);">${name}</span>
                <span style="font-size:.85rem;color:var(--text-muted);">${count} reserva${count!==1?"s":""}</span>
              </div>
              <div style="background:rgba(0,0,0,.06);border-radius:99px;height:10px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;border-radius:99px;
                            background:linear-gradient(90deg,var(--color-green),var(--color-green-dark));
                            transition:width .5s ease;"></div>
              </div>
            </div>`;
        }).join("");
      }
    }

    // ── Ingresos por mes ──
    const ingMesEl = document.getElementById("reportes-ingresos-mes");
    if (ingMesEl) {
      const byMonth = {};
      reservas
        .filter(r => r.estado === "confirmada" || r.estado === "completada")
        .forEach(r => {
          if (!r.fecha) return;
          const [y, m] = r.fecha.split("-");
          const key = `${y}-${m}`;
          byMonth[key] = (byMonth[key] ?? 0) + (r.escenarios?.precio ?? 0) * _diffHours(r.hora_inicio, r.hora_fin);
        });

      const entries = Object.entries(byMonth).sort((a,b) => a[0].localeCompare(b[0]));
      const maxIng  = Math.max(...entries.map(e => e[1]), 1);

      if (entries.length === 0) {
        ingMesEl.innerHTML = `<p style="color:var(--text-muted);font-size:.9rem;">Sin ingresos registrados aún.</p>`;
      } else {
        const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        ingMesEl.innerHTML = `
          <div style="display:flex;align-items:flex-end;gap:.6rem;height:140px;padding-bottom:.5rem;overflow-x:auto;">
            ${entries.map(([key, val]) => {
              const [y, m] = key.split("-");
              const label = `${MESES[parseInt(m)-1]} ${y}`;
              const pct   = Math.round((val / maxIng) * 100);
              const barH  = Math.max(pct * 1.2, 8);
              return `
                <div style="display:flex;flex-direction:column;align-items:center;gap:.4rem;min-width:52px;flex:1;">
                  <span style="font-size:.62rem;color:var(--text-muted);font-weight:600;">${_formatCOP(val).replace("COP","").trim()}</span>
                  <div style="width:100%;height:${barH}px;border-radius:6px 6px 0 0;
                              background:linear-gradient(180deg,var(--color-green),var(--color-green-dark));
                              transition:height .4s ease;"></div>
                  <span style="font-size:.65rem;color:var(--text-muted);text-align:center;white-space:nowrap;">${label}</span>
                </div>`;
            }).join("")}
          </div>`;
      }
    }
  }


  /* ─────────────────────────────────────────────────────────────────
     PROFILE UI HELPERS
  ───────────────────────────────────────────────────────────────── */

  function _refreshProfileView(profile, email, user) {
    const fullName = `${profile.nombre ?? ""} ${profile.apellido ?? ""}`.trim();
    email = email || user?.email || "";

    // Hero card
    const heroName  = document.getElementById("prf-hero-name");
    const heroEmail = document.getElementById("prf-hero-email");
    const heroSince = document.getElementById("prf-hero-since");
    const avatarImg = document.getElementById("prf-avatar-img");
    if (heroName)  heroName.textContent  = fullName || "—";
    if (heroEmail) heroEmail.textContent = email;
    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "U")}&background=2ecc50&color=fff`;

    // "Miembro desde" — parse created_at from user metadata or fallback
    if (heroSince) {
      const raw = user?.created_at || user?.user_metadata?.created_at;
      if (raw) {
        const d = new Date(raw);
        const mes = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
        heroSince.textContent = `Miembro desde ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
      } else {
        heroSince.textContent = "Miembro ASY";
      }
    }

    // View-mode fields
    const vName  = document.getElementById("prf-view-name");
    const vEmail = document.getElementById("prf-view-email");
    const vPhone = document.getElementById("prf-view-phone");
    if (vName)  vName.textContent  = fullName || "—";
    if (vEmail) vEmail.textContent = email || "—";
    if (vPhone) vPhone.textContent = profile.telefono || "—";
  }

  function _setProfileEditMode(editing) {
    const view = document.getElementById("prf-view-mode");
    const edit = document.getElementById("prf-edit-mode");
    const btn  = document.getElementById("prf-edit-toggle");
    if (view) view.style.display = editing ? "none"  : "block";
    if (edit) edit.style.display = editing ? "block" : "none";
    if (btn)  btn.innerHTML = editing
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancelar`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar`;
  }

  function toggleProfileEdit() {
    const editMode = document.getElementById("prf-edit-mode");
    const isEditing = editMode && editMode.style.display !== "none";
    _setProfileEditMode(!isEditing);
  }

  function openChangePassword() {
    const modal = document.getElementById("prf-password-modal");
    if (modal) {
      document.getElementById("prf-new-password").value = "";
      document.getElementById("prf-confirm-password").value = "";
      document.getElementById("prf-password-error").textContent = "";
      modal.classList.add("open");
    }
  }

  function closeChangePassword() {
    document.getElementById("prf-password-modal")?.classList.remove("open");
  }

  async function saveNewPassword() {
    const pw1 = document.getElementById("prf-new-password")?.value || "";
    const pw2 = document.getElementById("prf-confirm-password")?.value || "";
    const errEl = document.getElementById("prf-password-error");

    if (pw1.length < 8) { errEl.textContent = "La contraseña debe tener al menos 8 caracteres."; return; }
    if (pw1 !== pw2)    { errEl.textContent = "Las contraseñas no coinciden."; return; }

    errEl.textContent = "";
    const { error } = await supabaseClient.auth.updateUser({ password: pw1 });
    if (error) { errEl.textContent = "Error: " + error.message; return; }

    closeChangePassword();
    App.showToast("✅ Contraseña actualizada correctamente.");
  }

  async function signOutAll() {
    if (!confirm("¿Cerrar sesión en todos los dispositivos?")) return;
    await supabaseClient.auth.signOut({ scope: "global" });
    window.location.href = "../index.html";
  }

  return { init, switchTab, openModal, closeModal, saveVenue, deleteVenue, loadReservas, filterReservas, changeEstado, loadClientes, filterClientes, loadReportes, toggleProfileEdit, openChangePassword, closeChangePassword, saveNewPassword, signOutAll };
})();

window.AdminDashboard = AdminDashboard;

document.addEventListener("DOMContentLoaded", () => {
  AdminDashboard.init();
});