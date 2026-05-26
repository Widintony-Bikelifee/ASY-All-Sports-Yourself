/* ═══════════════════════════════════════
   user-dashboard.js - Logic for the deportista dashboard
   ═══════════════════════════════════════ */

const UserDashboard = (() => {
  let currentUserProfile = null;

  async function init() {
    // 1. Verificar autenticación
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        window.location.href = '../login.html';
        return;
      }

      // 2. Verificar el rol del usuario
      const role = await window.getUserRole();
      
      if (role === 'admin_cancha') {
        App.showToast('Redirigiendo a tu panel de administrador...');
        setTimeout(() => {
          window.location.href = '../admin/admin-dashboard.html';
        }, 1000);
        return;
      }

      // 3. Cargar datos del perfil en el sidebar y form
      currentUserProfile = await window.getUserProfile(session.user.id);
      const email = currentUserProfile.correo_electronico || session.user.email;
      const fullName = `${currentUserProfile.nombre} ${currentUserProfile.apellido}`;
      const firstName = currentUserProfile.nombre.split(' ')[0];

      // Populate Sidebar
      document.getElementById('sidebar-user-name').textContent = fullName;
      document.getElementById('sidebar-user-email').textContent = email;
      document.getElementById('sidebar-avatar-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;

      // Populate Banner
      document.getElementById('banner-welcome-name').textContent = `HOLA, ${firstName.toUpperCase()}!`;

      // Populate Profile Form
      const profileName = document.getElementById('profile-name');
      const profileLastname = document.getElementById('profile-lastname');
      const profileEmail = document.getElementById('profile-email');
      const profilePhone = document.getElementById('profile-phone');
      if (profileName) profileName.value = currentUserProfile.nombre;
      if (profileLastname) profileLastname.value = currentUserProfile.apellido;
      if (profileEmail) profileEmail.value = email;
      if (profilePhone) profilePhone.value = currentUserProfile.telefono || '';

      _refreshProfileView(currentUserProfile, email, session.user);

      // Setup Profile Save
      document.getElementById('profile-form').addEventListener('submit', async (e) => {
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
          // Update sidebar immediately
          const newFullName = `${updatedData.nombre} ${updatedData.apellido}`;
          document.getElementById('sidebar-user-name').textContent = newFullName;
          document.getElementById('banner-welcome-name').textContent = `HOLA, ${updatedData.nombre.split(' ')[0].toUpperCase()}!`;
          document.getElementById('sidebar-avatar-img').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(newFullName)}&background=2ecc50&color=fff`;
          
          _refreshProfileView({ nombre: updatedData.nombre, apellido: updatedData.apellido, telefono: updatedData.telefono }, email, session.user);
          _setProfileEditMode(false);
        } catch (err) {
          App.showToast('❌ Error al actualizar el perfil', 'error');
        } finally {
          btnSave.textContent = 'Guardar Cambios';
          btnSave.disabled = false;
        }
      });

      // Setup Logout Button
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await supabaseClient.auth.signOut();
          window.location.href = '../../index.html';
        });
      }

      // 4. Cargar reservas reales
      await loadRealReservations();

      // 5. Soporte de routing SPA por parámetro ?tab=...
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['inicio', 'reservas', 'venues', 'profile', 'pagos'].includes(tabParam)) {
        switchTab(tabParam);
      } else {
        switchTab('inicio');
      }

    } catch (error) {
      console.error('Error loading user dashboard:', error);
      App.showToast('Error de autenticación.', 'error');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 1500);
    }
  }

  function switchTab(tab) {
    // Update sidebar active links
    document.getElementById('tab-inicio')?.classList.toggle('active', tab === 'inicio');
    document.getElementById('tab-reservas')?.classList.toggle('active', tab === 'reservas');
    document.getElementById('tab-venues')?.classList.toggle('active', tab === 'venues');
    document.getElementById('tab-pagos')?.classList.toggle('active', tab === 'pagos');
    document.getElementById('tab-profile')?.classList.toggle('active', tab === 'profile');

    // Update main content panels
    document.getElementById('panel-inicio')?.classList.toggle('active', tab === 'inicio');
    document.getElementById('panel-reservas')?.classList.toggle('active', tab === 'reservas');
    document.getElementById('panel-venues')?.classList.toggle('active', tab === 'venues');
    document.getElementById('panel-pagos')?.classList.toggle('active', tab === 'pagos');
    document.getElementById('panel-profile')?.classList.toggle('active', tab === 'profile');

    // Trigger re-fetches or loads on entering tabs
    if (tab === 'reservas' && window.ReservasPage) {
      window.ReservasPage.init();
    }
    if (tab === 'venues' && window.Venues) {
      window.Venues.load();
    }
    if (tab === 'inicio') {
      loadRealReservations();
    }
    if (tab === 'pagos') {
      loadPagos();
    }
  }

  async function loadRealReservations() {
    const listContainer = document.getElementById('upcoming-reservations-list');
    if (listContainer) {
      listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Cargando reservas...</p>';
    }

    try {
      const { data, error } = await window.VenuesService.getMisReservas();
      if (error) {
        if (listContainer) {
          listContainer.innerHTML = '<p style="color: #dc2626; font-size: 0.9rem;">Error al cargar las reservas.</p>';
        }
        return;
      }

      const total = data.length;
      const upcomingReservations = data.filter(r => r.estado === 'pendiente' || r.estado === 'confirmada');
      const upcoming = upcomingReservations.length;
      const completed = data.filter(r => r.estado === 'completada').length;

      document.getElementById('stat-total').textContent = total.toString();
      document.getElementById('stat-upcoming').textContent = upcoming.toString();
      document.getElementById('banner-upcoming-count').textContent = upcoming.toString();
      document.getElementById('stat-completed').textContent = completed.toString();

      if (!listContainer) return;

      if (upcomingReservations.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No tienes próximas reservas agendadas.</p>';
        return;
      }

      listContainer.innerHTML = ''; 
      upcomingReservations.forEach(r => {
        const esc = r.escenarios ?? {};
        const title = esc.nombre ?? 'Cancha sin nombre';
        const dateStr = formatShortDate(r.fecha);
        const timeStr = `${r.hora_inicio.slice(0, 5)} - ${r.hora_fin.slice(0, 5)}`;
        
        const imgSrc = esc.imagen_url?.startsWith('http')
          ? esc.imagen_url
          : `../../assets/img/venues/${esc.imagen_url || 'Estadio_Ipiales.jpg'}`;

        const statusClass = r.estado === 'pendiente' ? 'status-orange' : '';

        const cardHTML = `
          <div class="reservation-card ${statusClass}">
            <img src="${imgSrc}" alt="${title}" class="reservation-card__img" onerror="this.src='../assets/img/venues/Estadio_Ipiales.jpg'">
            <div class="reservation-card__details">
              <h3 class="reservation-card__title">${title}</h3>
              <p class="reservation-card__time">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${dateStr} • ${timeStr}
              </p>
            </div>
          </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', cardHTML);
      });
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (listContainer) {
        listContainer.innerHTML = '<p style="color: #dc2626; font-size: 0.9rem;">Error al cargar las reservas.</p>';
      }
    }
  }

  function formatShortDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    let str = date.toLocaleDateString("es-CO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    });
    return str.replace(/\./g, "");
  }

  /* ─────────────────────────────────────────────────────────────────
     PAGOS (Mis Pagos)
  ───────────────────────────────────────────────────────────────── */
  async function loadPagos() {
    const tbody = document.getElementById('pagos-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando pagos...</td></tr>`;
    }

    try {
      const { data, error } = await window.VenuesService.getMisReservas();
      if (error) throw error;
      
      const pagos = data.filter(r => r.estado === 'confirmada' || r.estado === 'completada');
      
      if (pagos.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Aún no tienes pagos registrados de reservas confirmadas o completadas.</td></tr>`;
        return;
      }
      
      if (tbody) {
        tbody.innerHTML = pagos.map(r => {
          const esc = r.escenarios ?? {};
          const venueName = esc.nombre ?? '–';
          const fecha = formatShortDate(r.fecha);
          const horario = `${r.hora_inicio.slice(0, 5)} - ${r.hora_fin.slice(0, 5)}`;
          
          // Calculate total
          const hrs = _diffHours(r.hora_inicio, r.hora_fin);
          const total = hrs * (esc.precio ?? 0);
          
          const pagoStr = r.metodo_pago ? _paymentLabel(r.metodo_pago) : '–';
          
          return `
            <tr>
              <td>${fecha}</td>
              <td><strong>${venueName}</strong></td>
              <td>${horario} (${hrs}h)</td>
              <td>${pagoStr}</td>
              <td><span class="res-badge res-badge--${r.estado}">${_statusLabel(r.estado)}</span></td>
              <td style="font-weight:700; color:var(--color-green-dark);">${_formatCOP(total)}</td>
            </tr>
          `;
        }).join('');
      }
      
    } catch (err) {
      console.error('Error fetching pagos:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;padding:3rem;">Error al cargar los pagos.</td></tr>`;
      }
    }
  }

  function _diffHours(inicio, fin) {
    if (!inicio || !fin) return 0;
    const [h1, m1] = inicio.split(":").map(Number);
    const [h2, m2] = fin.split(":").map(Number);
    return Math.max(0, Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100);
  }

  function _formatCOP(n) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  }

  function _statusLabel(s) {
    return { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" }[s] ?? s;
  }

  function _paymentLabel(m) {
    const icons = { efectivo: "💵 Efectivo", transferencia: "🏦 Transferencia", tarjeta: "💳 Tarjeta", pse: "🌐 PSE" };
    return `<span style="font-size:.82rem;">${icons[m] ?? (m ?? "–")}</span>`;
  }

  /* ─────────────────────────────────────────────────────────────────
     PROFILE UI HELPERS
  ───────────────────────────────────────────────────────────────── */
  function _refreshProfileView(profile, email, user) {
    const fullName = `${profile.nombre ?? ""} ${profile.apellido ?? ""}`.trim();
    email = email || user?.email || "";

    const heroName  = document.getElementById("prf-hero-name");
    const heroEmail = document.getElementById("prf-hero-email");
    const heroSince = document.getElementById("prf-hero-since");
    const avatarImg = document.getElementById("prf-avatar-img");
    if (heroName)  heroName.textContent  = fullName || "—";
    if (heroEmail) heroEmail.textContent = email;
    if (avatarImg) avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "U")}&background=2ecc50&color=fff`;

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
    window.location.href = "../../index.html";
  }

  return { 
    init, 
    switchTab,
    toggleProfileEdit,
    openChangePassword,
    closeChangePassword,
    saveNewPassword,
    signOutAll
  };
})();

window.UserDashboard = UserDashboard;

document.addEventListener('DOMContentLoaded', () => {
  UserDashboard.init();
});
