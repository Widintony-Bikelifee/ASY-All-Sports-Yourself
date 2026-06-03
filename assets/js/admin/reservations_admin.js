/**
 * reservations_admin.js script file.
 * Archivo de script reservations_admin.js.
 */
document.addEventListener('DOMContentLoaded', () => {
        if (window.AdminDashboard && typeof AdminDashboard.loadReservas === 'function') {
          AdminDashboard.loadReservas();
        }
      });
