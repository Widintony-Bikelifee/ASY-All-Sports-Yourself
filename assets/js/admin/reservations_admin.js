document.addEventListener('DOMContentLoaded', () => {
        if (window.AdminDashboard && typeof AdminDashboard.loadReservas === 'function') {
          AdminDashboard.loadReservas();
        }
      });
