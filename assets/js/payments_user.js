/* payments_user.js - Logic for user payments page */
const UserPayments = (() => {
  async function init() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = '../login.html';
        return;
      }

      const role = await window.getUserRole();
      if (role === 'admin_cancha') {
        App.showToast('Redirigiendo a tu panel de administrador...');
        setTimeout(() => {
          window.location.href = '../admin/admin-dashboard.html';
        }, 1000);
        return;
      }

      const profile = await window.getUserProfile(session.user.id);
      const email = profile.correo_electronico || session.user.email || '';
      const fullName = `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || 'Usuario';
      const firstName = (profile.nombre || 'Usuario').split(' ')[0];

      document.getElementById('sidebar-user-name').textContent = fullName;
      document.getElementById('sidebar-user-email').textContent = email;
      const avatarImg = document.getElementById('sidebar-avatar-img');
      if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2ecc50&color=fff`;
      }

      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await supabaseClient.auth.signOut();
          window.location.href = '../login.html';
        });
      }

      await loadPagos();
    } catch (error) {
      console.error('Error cargando pagos:', error);
      App.showToast('Error al cargar la página de pagos.');
      const message = error?.message?.toString().toLowerCase() || '';
      if (message.includes('session') || message.includes('auth') || message.includes('jwt') || message.includes('not authenticated')) {
        setTimeout(() => {
          window.location.href = '../login.html';
        }, 1500);
      }
    }
  }

  async function loadPagos() {
    const tbody = document.getElementById('pagos-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Cargando pagos...</td></tr>`;
    }

    try {
      const { data, error } = await window.VenuesService.getMisReservas();
      if (error) throw error;

      const pagos = (data || []).filter(r => r.estado === 'confirmada' || r.estado === 'completada');
      if (pagos.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:3rem;">Aún no tienes pagos registrados de reservas confirmadas o completadas.</td></tr>`;
        return;
      }

      if (tbody) {
        tbody.innerHTML = pagos.map(r => {
          const esc = r.escenarios ?? {};
          const venueName = esc.nombre ?? '–';
          const fecha = formatShortDate(r.fecha);
          const horario = `${r.hora_inicio?.slice(0, 5) ?? '–'} - ${r.hora_fin?.slice(0, 5) ?? '–'}`;
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

  function formatShortDate(isoDate) {
    if (!isoDate) return '–';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/\./g, '');
  }

  function _diffHours(inicio, fin) {
    if (!inicio || !fin) return 0;
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return Math.max(0, Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 100) / 100);
  }

  function _formatCOP(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
  }

  function _statusLabel(status) {
    return {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada'
    }[status] ?? status ?? '–';
  }

  function _paymentLabel(method) {
    const map = {
      efectivo: '💵 Efectivo',
      transferencia: '🏦 Transferencia',
      tarjeta: '💳 Tarjeta',
      pse: '🌐 PSE'
    };
    return map[method] ?? (method ?? '–');
  }

  return { init };
})();

window.UserPayments = UserPayments;
window.addEventListener('DOMContentLoaded', () => UserPayments.init());
