







/**
 * AdminDashboard module with page helpers and application logic.
 * Módulo AdminDashboard con funciones de página y lógica de aplicación.
 */

const AdminDashboard = (() => {
  
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

  
  let allVenues   = [];
  let allReservas = [];
  let _activeTab  = "canchas";

  
  /**
   * Init. Authenticates the session, checks admin role, loads user profile and dashboard data.
   * Inicializa. Autentica la sesión, verifica el rol de administrador, carga el perfil y los datos del dashboard.
   */
  
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

      
      try {
        const authUser = session.user;
        let profile = null;
        try {
          profile = await window.getUserProfile(authUser.id);
        } catch (e) {
          console.warn("No se encontró perfil en BD, usando metadatos.");
        }
        
        const metadata = authUser.user_metadata || {};
        const emailName = (email) => email ? email.split("@")[0] : "";
        
        const dbNombre = profile?.nombre || "";
        const dbApellido = profile?.apellido || "";
        const fullNameFromDb = `${dbNombre} ${dbApellido}`.trim();
        
        const fullName = fullNameFromDb || metadata.nombre || metadata.name || emailName(authUser.email) || 'Administrador';
        const email = profile?.correo_electronico || authUser.email || 'sin@correo.com';
        
        const avatarUrl = metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;
        
        _populateSidebar(fullName, email, avatarUrl);
      } catch (profileErr) {
        console.error("Error al cargar el perfil de usuario:", profileErr);
        _populateSidebar("Administrador", session.user.email, null);
      }

      
      document.getElementById('btn-logout')?.addEventListener('click', async () => {
          await supabaseClient.auth.signOut();
          window.location.href = "../../index.html";
        });

      await loadDashboardData();
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      App.showToast("Error de autenticación.");
      setTimeout(() => { window.location.href = "../login.html"; }, 1500);
    }
  }

  /**
   * _populateSidebar. Fills the sidebar with the admin's name, email, and avatar URL.
   * _populateSidebar. Rellena la barra lateral con el nombre, correo y URL de avatar del administrador.
   */
  
  function _populateSidebar(fullName, email, avatarUrl) {
    const nameEl = document.getElementById("sidebar-user-name");
    const emailEl = document.getElementById("sidebar-user-email");
    const avatarImg = document.getElementById("sidebar-avatar-img");
    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = email;
    if (avatarImg) {
      avatarImg.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;
      avatarImg.onerror = function() { this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`; };
    }
  }

  
  /**
   * Load dashboard data.
   * Cargar dashboard data.
   */
  
  async function loadDashboardData() {
    if (!window.VenuesService) return;

    const { data: canchas, error } = await window.VenuesService.getMisEscenarios();
    if (error) { App.showToast("Error al cargar las canchas."); return; }

    allVenues = canchas ?? [];
    
    
    const statCanchasCount = document.getElementById("stat-canchas-count");
    if (statCanchasCount) {
      statCanchasCount.textContent = allVenues.length;
    }


    const emptyState = document.getElementById("admin-empty-state");
    const container  = document.getElementById("dashboard-venues-container");
    const list       = document.getElementById("dashboard-venues-list");

    if (allVenues.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      if (container)  container.style.display  = "block";

      if (list) {
        list.innerHTML = allVenues.map(c => {
          const precioStr = c.precio ? Number(c.precio).toLocaleString("es-CO") : "0";
          const imgUrl = c.imagen_url || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop";
          return `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="dashboard-venue-card h-100 flex-column align-items-stretch" style="gap:0; padding:0; overflow:hidden;">
              <div style="height:160px; width:100%; position:relative;">
                <img src="${imgUrl}" alt="${c.nombre}" style="width:100%; height:100%; object-fit:cover;" />
                ${c.tipo ? `<span class="badge bg-dark position-absolute top-0 end-0 m-2 bg-opacity-75">${c.tipo}</span>` : ""}
              </div>
              <div class="p-3 d-flex flex-column flex-grow-1">
                <div class="dashboard-venue-info mb-3">
                  <span class="dashboard-venue-title fs-5">${c.nombre}</span>
                  <span class="dashboard-venue-meta mt-1 d-flex flex-column gap-1">
                    <span><i class="bi bi-geo-alt me-1 text-muted" ></i>${c.ubicacion || "Sin ubicación"}</span>
                    <span class="text-success fw-bold"><i class="bi bi-cash me-1" ></i>$${precioStr}/hr</span>
                  </span>
                </div>
                <div class="d-flex gap-2 mt-auto">
                  <a href="./edit_courts.html?id=${c.id}" class="dashboard-venue-action flex-grow-1 justify-content-center">
                    <i class="bi bi-pencil me-1" ></i>Editar
                  </a>
                  <button onclick="AdminDashboard.deleteVenue(${c.id})" class="dashboard-venue-action dashboard-venue-action--danger flex-grow-1 justify-content-center">
                    <i class="bi bi-trash me-1" ></i>Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>`;
        }).join("");
      }
    } else {
      if (emptyState) emptyState.style.display = "flex";
      if (container)  container.style.display  = "none";
    }

    
    await loadReservas();

  }

  
  /**
   * Load reservas.
   * Cargar reservas.
   */
  
  async function loadReservas() {
    const tbody = document.getElementById("reservas-admin-tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando reservas…</td></tr>`;
    }

    console.log("[Admin] Iniciando carga de reservas...");

    
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    console.log("[Admin] Usuario logueado ID:", userId);

    
    const { data: misEsc } = await supabaseClient
      .from("escenarios")
      .select("id, nombre, propietario_id")
      .eq("propietario_id", userId);
    console.log("[Admin] Canchas del admin:", misEsc);

    
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

    
    const pendientes  = allReservas.filter(r => r.estado === "pendiente").length;
    const confirmadas = allReservas.filter(r => r.estado === "confirmada").length;

    const elPend = document.getElementById("stat-reservas-pendientes");
    const elConf = document.getElementById("stat-reservas-confirmadas");
    if (elPend) elPend.textContent = pendientes;
    if (elConf) elConf.textContent = confirmadas;

    
    const income = allReservas
      .filter(r => r.estado === "confirmada" || r.estado === "completada")
      .reduce((acc, r) => {
        const hrs = _diffHours(r.hora_inicio, r.hora_fin);
        return acc + (r.escenarios?.precio ?? 0) * hrs;
      }, 0);
    const elInc = document.getElementById("stat-ingresos");
    if (elInc) elInc.textContent = _formatCOP(income);

    
    const badge = document.getElementById("sidebar-badge-reservas");
    if (badge) {
      badge.textContent = pendientes > 0 ? String(pendientes) : "";
      badge.style.display = pendientes > 0 ? "inline-flex" : "none";
    }

    
    _populateVenueFilter();

    
    renderReservasTable();
  }

  /**
   * _populateVenueFilter. Fills the venue filter dropdown with unique venue names from reservations.
   * _populateVenueFilter. Rellena el selector de cancha con los nombres únicos extraídos de las reservas.
   */
  
  function _populateVenueFilter() {
    const sel = document.getElementById("res-filter-venue");
    if (!sel) return;

    const venueNames = [...new Set(allReservas.map(r => r.escenarios?.nombre).filter(Boolean))];
    sel.innerHTML = `<option value="">Todas las canchas</option>` +
      venueNames.map(n => `<option value="${n}">${n}</option>`).join("");
  }

  /**
   * FilterReservas. Applies active filters and re-renders the reservations table.
   * FilterReservas. Aplica los filtros activos y vuelve a renderizar la tabla de reservas.
   */
  
  function filterReservas() { renderReservasTable(); }

  /**
   * Render reservas table.
   * Renderizar reservas table.
   */
  
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

      let statusBadgeClass = "";
      switch (estado) {
        case "pendiente": statusBadgeClass = "bg-warning-subtle text-warning"; break;
        case "confirmada": statusBadgeClass = "bg-primary-subtle text-primary"; break;
        case "completada": statusBadgeClass = "bg-success-subtle text-success"; break;
        case "cancelada": statusBadgeClass = "bg-danger-subtle text-danger"; break;
        default: statusBadgeClass = "bg-secondary-subtle text-secondary"; break;
      }

      const actions = _buildActions(r.id, estado);

      return `
        <tr>
          <td class="py-3 px-4">
            <strong class="d-block text-dark fw-bold">${userName}</strong>
            <span class="text-muted small">${userSub}</span>
          </td>
          <td class="py-3 px-4"><strong>${venueName}</strong>${esc?.tipo ? `<br><span class="text-muted small">${esc.tipo}</span>` : ""}</td>
          <td class="py-3 px-4">${fecha}</td>
          <td class="py-3 px-4">${horario}</td>
          <td class="py-3 px-4">${pago}</td>
          <td class="py-3 px-4"><span class="badge ${statusBadgeClass}">${_statusLabel(estado)}</span></td>
          <td class="py-3 px-4"><div class="d-flex gap-2 flex-wrap">${actions}</div></td>
        </tr>`;
    }).join("");
  }

  /**
   * _buildActions. Builds action buttons (confirm, complete, cancel) for a reservation row based on its current state.
   * _buildActions. Construye los botones de acción (confirmar, completar, cancelar) de una fila de reserva según su estado.
   */
  
  function _buildActions(id, estado) {
    const btns = [];
    if (estado === "pendiente") { 
      btns.push(`<button class="btn btn-sm btn-outline-primary" onclick="AdminDashboard.changeEstado('${id}','confirmada')">Confirmar</button>`);
      btns.push(`<button class="btn btn-sm btn-outline-danger"  onclick="AdminDashboard.changeEstado('${id}','cancelada')">Cancelar</button>`);
    } else if (estado === "confirmada") { 
      btns.push(`<button class="btn btn-sm btn-outline-success" onclick="AdminDashboard.changeEstado('${id}','completada')">Completar</button>`);
      btns.push(`<button class="btn btn-sm btn-outline-danger"  onclick="AdminDashboard.changeEstado('${id}','cancelada')">Cancelar</button>`);
    } else {
      btns.push(`<span class="text-muted small">Sin acciones</span>`);
    }
    return btns.join("");
  }

  /**
   * ChangeEstado. Updates the status of a reservation and refreshes the table.
   * ChangeEstado. Actualiza el estado de una reserva y refresca la tabla.
   */
  
  async function changeEstado(reservaId, nuevoEstado) {
    const labels = { confirmada: "confirmar", cancelada: "cancelar", completada: "completar" };
    if (!confirm(`¿Deseas ${labels[nuevoEstado]} esta reserva?`)) return;

    const { error } = await window.VenuesService.updateReservaEstado(reservaId, nuevoEstado);
    if (error) {
      App.showToast("❌ Error al actualizar la reserva.");
      return;
    }

    
    const idx = allReservas.findIndex(r => String(r.id) === String(reservaId));
    if (idx !== -1) allReservas[idx].estado = nuevoEstado;

    const msgs = { confirmada: "✅ Reserva confirmada.", cancelada: "🔴 Reserva cancelada.", completada: "🏁 Reserva marcada como completada." };
    App.showToast(msgs[nuevoEstado] ?? "Reserva actualizada.");

    
    await loadReservas();
    renderReservasTable();
  }

  
  /**
   * Open modal.
   * Abrir modal.
   */
  
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

  /**
   * Close modal.
   * Cerrar modal.
   */
  
  function closeModal() {
    if (modal) modal.classList.remove("open");
  }

  /**
   * Save venue.
   * Guardar venue.
   */
  
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

  /**
   * DeleteVenue. Confirms and permanently deletes a venue from the database.
   * DeleteVenue. Confirma y elimina permanentemente una cancha de la base de datos.
   */
  
  async function deleteVenue(id) {
    if (!confirm("¿Eliminar esta cancha? Esta acción no se puede deshacer.")) return;

    const { error } = await window.VenuesService.deleteEscenario(id);
    if (error) { App.showToast("❌ Error al eliminar la cancha."); return; }

    App.showToast("🗑️ Cancha eliminada.");
    await loadDashboardData();
    await loadReservas();
  }

  
  /**
   * _diffHours. Calculates the difference in hours between two HH:MM time strings.
   * _diffHours. Calcula la diferencia en horas entre dos cadenas de tiempo HH:MM.
   */
  
  function _diffHours(inicio, fin) {
    if (!inicio || !fin) return 0;
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    return Math.max(0, Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100);
  }

  /**
   * Format cop.
   * Formatear cop.
   */
  
  function _formatCOP(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  }

  /**
   * Format date short.
   * Formatear date short.
   */
  
  function _formatDateShort(isoDate) {
    if (!isoDate) return "–";
    const [y, m, d] = isoDate.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    });
  }

  /**
   * _fmtTime. Formats a time string to HH:MM, returning a dash for empty values.
   * _fmtTime. Formatea una cadena de tiempo a HH:MM, devolviendo un guion si el valor está vacío.
   */
  
  function _fmtTime(t) { return t ? t.slice(0, 5) : "–"; }

  /**
   * _statusLabel. Returns the human-readable Spanish label for a reservation status key.
   * _statusLabel. Devuelve la etiqueta legible en español para una clave de estado de reserva.
   */
  
  function _statusLabel(s) {
    return { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" }[s] ?? s;
  }

  /**
   * _paymentLabel. Returns an icon-labelled HTML string for a payment method key.
   * _paymentLabel. Devuelve una cadena HTML con ícono y etiqueta para una clave de método de pago.
   */
  
  function _paymentLabel(m) {
    const icons = { efectivo: "💵 Efectivo", transferencia: "🏦 Transferencia", tarjeta: "💳 Tarjeta", pse: "🌐 PSE" };
    return `<span style="font-size:.82rem;">${icons[m] ?? (m ?? "–")}</span>`;
  }


  
  let _allClientes = [];

  /**
   * Load clientes.
   * Cargar clientes.
   */
  
  async function loadClientes() {
    const tbody = document.getElementById("clientes-tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando clientes…</td></tr>`;
    }

    
    const { data, error } = await window.VenuesService.getReservasAdmin();
    if (error || !data) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#dc2626;padding:3rem;">❌ Error al cargar clientes.</td></tr>`;
      return;
    }

    
    const clientMap = {};
    data.forEach(r => {
      const uid = r.usuario_id;
      if (!uid) return;
      const u = r.usuarios ?? {};
      if (!clientMap[uid]) {
        clientMap[uid] = {
          id: uid,
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

  /**
   * Render clientes.
   * Renderizar clientes.
   */
  
  function _renderClientes(list) {
    const tbody = document.getElementById("clientes-tbody");
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Sin clientes registrados aún.</td></tr>`;
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
          <td class="text-end pe-4">
            <a href="./look_client.html?clientId=${c.id}" class="btn btn-sm btn-outline-primary">Ver</a>
          </td>
        </tr>`;
    }).join("");
  }

  /**
   * FilterClientes. Filters the client list by name or email and re-renders the table.
   * FilterClientes. Filtra la lista de clientes por nombre o correo y vuelve a renderizar la tabla.
   */
  
  function filterClientes() {
    const q = document.getElementById("clientes-search")?.value.toLowerCase() ?? "";
    if (!q) { _renderClientes(_allClientes); return; }
    const filtered = _allClientes.filter(c =>
      c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q)
    );
    _renderClientes(filtered);
  }

  
  /**
   * Load reportes.
   * Cargar reportes.
   */
  
  async function loadReportes() {
    
    const reservas = allReservas.length > 0 ? allReservas : (await window.VenuesService.getReservasAdmin()).data ?? [];

    
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
        { label: "Total Reservas", value: total,                    color: "#6366f1", icon: "bi-calendar3",      bg: "rgba(99,102,241,.1)"  },
        { label: "Completadas",    value: completadas,               color: "#10b981", icon: "bi-check-circle",   bg: "rgba(16,185,129,.1)"  },
        { label: "Pendientes",     value: pendientes,                color: "#f59e0b", icon: "bi-hourglass-split",bg: "rgba(245,158,11,.1)"  },
        { label: "Canceladas",     value: canceladas,                color: "#ef4444", icon: "bi-x-circle",       bg: "rgba(239,68,68,.1)"   },
        { label: "Ingresos Est.",  value: _formatCOP(ingresos),      color: "#2ecc50", icon: "bi-cash-coin",      bg: "rgba(46,204,80,.1)"   },
      ];
      
      kpiEl.innerHTML = kpis.map(k => `
        <div class="col-6 col-md-4 col-xl">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body text-center py-4 kpi-card">
              <div class="kpi-icon mx-auto mb-3" style="background:${k.bg};">
                <i class="bi bi-${k.icon} fs-4"  style="color:${k.color};"></i>
              </div>
              <div class="kpi-value" style="color:${k.color};">${k.value}</div>
              <div class="kpi-label mt-1">${k.label}</div>
            </div>
          </div>
        </div>`).join("");
    }

    
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
        byCanchaEl.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-bar-chart fs-1 d-block mb-2 opacity-25" ></i>
            <p class="mb-0">Sin datos de reservas aún.</p>
          </div>`;
      } else {
        byCanchaEl.innerHTML = entries.map(([name, count]) => {
          const pct = Math.round((count / maxVal) * 100);
          return `
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold" style="font-size:.88rem;">${name}</span>
                <span class="text-muted" style="font-size:.82rem;">${count} reserva${count!==1?"s":""}</span>
              </div>
              <div class="progress" style="height:10px;border-radius:99px;">
                <div class="progress-bar" role="progressbar"
                     style="width:${pct}%;border-radius:99px;
                            background:linear-gradient(90deg,var(--primary-green,#2ecc50),var(--primary-green-dark,#27b545));
                            transition:width .5s ease;"
                     aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                </div>
              </div>
            </div>`;
        }).join("");
      }
    }

    
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
        ingMesEl.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-cash fs-1 d-block mb-2 opacity-25" ></i>
            <p class="mb-0">Sin ingresos registrados aún.</p>
          </div>`;
      } else {
        const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        ingMesEl.innerHTML = `
          <div class="d-flex align-items-flex-end gap-2 overflow-x-auto pb-2" style="height:160px;align-items:flex-end;">
            ${entries.map(([key, val]) => {
              const [y, m] = key.split("-");
              const label = `${MESES[parseInt(m)-1]} ${y}`;
              const pct   = Math.round((val / maxIng) * 100);
              const barH  = Math.max(pct * 1.3, 8);
              return `
                <div class="d-flex flex-column align-items-center gap-1 flex-shrink-0" style="min-width:56px;flex:1;height:100%;justify-content:flex-end;">
                  <span class="text-muted fw-semibold" style="font-size:.6rem;">${_formatCOP(val).replace("COP","").trim()}</span>
                  <div style="width:100%;height:${barH}px;border-radius:6px 6px 0 0;
                              background:linear-gradient(180deg,var(--primary-green,#2ecc50),var(--primary-green-dark,#27b545));
                              transition:height .4s ease;"></div>
                  <span class="text-muted" style="font-size:.62rem;text-align:center;white-space:nowrap;">${label}</span>
                </div>`;
            }).join("")}
          </div>`;
      }
    }
  }

  return { init, openModal, closeModal, saveVenue, deleteVenue, loadReservas, filterReservas, changeEstado, loadClientes, filterClientes, loadReportes };
})();

window.AdminDashboard = AdminDashboard;

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */

document.addEventListener("DOMContentLoaded", () => {
  AdminDashboard.init();
});
