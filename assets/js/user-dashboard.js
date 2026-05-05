/* ═══════════════════════════════════════
   user-dashboard.js - Logic for the deportista dashboard
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar autenticación
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      window.location.href = './login.html';
      return;
    }

    // 2. Verificar el rol del usuario
    const role = await window.getUserRole();
    
    // Si es admin, lo devolvemos a su panel de admin
    if (role === 'admin_cancha') {
      App.showToast('Redirigiendo a tu panel de administrador...');
      setTimeout(() => {
        window.location.href = './admin-dashboard.html';
      }, 1000);
      return;
    }

    // 3. Cargar datos del deportista (Ej: reservas)
    // Aquí en el futuro puedes hacer un query a la tabla "reservas"
    // filtrando por el ID del usuario actual.
    // Por ahora, solo es visual.

  } catch (error) {
    console.error('Error loading user dashboard:', error);
    App.showToast('Error de autenticación.', 'error');
    setTimeout(() => {
      window.location.href = './login.html';
    }, 1500);
  }
});
