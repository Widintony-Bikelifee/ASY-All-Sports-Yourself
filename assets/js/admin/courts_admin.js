
document.addEventListener('DOMContentLoaded', () => {
  if (window.AdminDashboard && typeof AdminDashboard.loadDashboardData === 'function') {
    AdminDashboard.loadDashboardData();
  }
});
