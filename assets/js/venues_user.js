/* venues_user.js - User-mode venues page logic */
const VenuesUser = (() => {
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
    } catch (error) {
      console.error('Error cargando espacios de usuario:', error);
      App.showToast('Error al cargar los espacios. Redirigiendo al login...');
      setTimeout(() => {
        window.location.href = '../login.html';
      }, 1500);
    }
  }

  return { init };
})();

window.VenuesUser = VenuesUser;
window.addEventListener('DOMContentLoaded', () => VenuesUser.init());
