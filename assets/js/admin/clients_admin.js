document.addEventListener('DOMContentLoaded', () => {
        if (window.AdminDashboard && typeof AdminDashboard.loadClientes === 'function') {
          AdminDashboard.loadClientes();
        }
      });
