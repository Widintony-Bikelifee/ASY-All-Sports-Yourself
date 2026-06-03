/**
 * clients_admin.js script file.
 * Archivo de script clients_admin.js.
 */
document.addEventListener('DOMContentLoaded', () => {
        if (window.AdminDashboard && typeof AdminDashboard.loadClientes === 'function') {
          AdminDashboard.loadClientes();
        }
      });
