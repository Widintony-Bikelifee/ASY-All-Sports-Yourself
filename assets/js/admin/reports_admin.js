
      document.addEventListener('DOMContentLoaded', () => {
        if (window.AdminDashboard && typeof AdminDashboard.loadReportes === 'function') {
          AdminDashboard.loadReportes();
        }
      });
