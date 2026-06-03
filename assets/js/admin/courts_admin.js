

/**
 * Initialize page scripting once DOM content is ready.
 * Inicializa el script de la página cuando el contenido DOM está listo.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (window.AdminDashboard && typeof AdminDashboard.init === 'function') {
    AdminDashboard.init();
  }
});
