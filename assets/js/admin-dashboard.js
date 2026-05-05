/* ═══════════════════════════════════════
   admin-dashboard.js - Admin dashboard logic and CRUD
   ═══════════════════════════════════════ */

const AdminDashboard = (() => {
  // DOM Elements - Modal
  const modal = document.getElementById("venue-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBtnSave = document.getElementById("modal-btn-save");
  const modalError = document.getElementById("modal-error");

  // DOM Elements - Form Fields
  const inputId = document.getElementById("venue-id");
  const inputNombre = document.getElementById("venue-nombre");
  const inputTipo = document.getElementById("venue-tipo");
  const inputUbicacion = document.getElementById("venue-ubicacion");
  const inputPrecio = document.getElementById("venue-precio");
  const inputImagen = document.getElementById("venue-imagen");

  // State
  let allVenues = [];

  /* Initialize the module */
  async function init() {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = './login.html';
        return;
      }

      const role = await window.getUserRole();
      if (role !== 'admin_cancha') {
        App.showToast('Acceso denegado. No tienes permisos de administrador.');
        setTimeout(() => { window.location.href = './venues.html'; }, 1500);
        return;
      }

      // Load data
      await loadDashboardData();
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      App.showToast('Error de autenticación.');
      setTimeout(() => { window.location.href = './login.html'; }, 1500);
    }
  }

  async function loadDashboardData() {
    if (!window.VenuesService) return;

    const { data: canchas, error } = await window.VenuesService.getMisEscenarios();
    
    if (error) {
      App.showToast("Error al cargar las canchas", "error");
      return;
    }

    allVenues = canchas || [];
    
    // Update Stats
    const countEl = document.getElementById('stat-canchas-count');
    if (countEl) countEl.textContent = allVenues.length;

    const emptyState = document.getElementById('admin-empty-state');
    const container = document.getElementById('dashboard-venues-container');
    const list = document.getElementById('dashboard-venues-list');

    if (allVenues.length > 0) {
      if (emptyState) emptyState.style.display = 'none';
      if (container) container.style.display = 'block';
      
      if (list) {
        list.innerHTML = allVenues.map(c => {
          const precioStr = c.precio ? Number(c.precio).toLocaleString() : '0';
          return `
          <div class="dashboard-venue-card">
            <div class="dashboard-venue-info">
              <span class="dashboard-venue-title">${c.nombre}</span>
              <span class="dashboard-venue-meta">📍 ${c.ubicacion || 'Sin ubicación'} &nbsp;•&nbsp; 💰 $${precioStr}/hr</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="AdminDashboard.openModal(${c.id})" class="dashboard-venue-action">
                Editar
              </button>
              <button onclick="AdminDashboard.deleteVenue(${c.id})" class="dashboard-venue-action dashboard-venue-action--danger">
                Eliminar
              </button>
            </div>
          </div>
        `}).join('');
      }
    } else {
      if (emptyState) emptyState.style.display = 'flex';
      if (container) container.style.display = 'none';
    }
  }

  /* Open modal for Create (no ID) or Edit (with ID) */
  function openModal(id = null) {
    if (!modal) return;
    modalError.textContent = "";
    
    if (id) {
      // Edit Mode
      const venue = allVenues.find(v => v.id === id);
      if (!venue) return;
      modalTitle.textContent = "Editar Cancha";
      inputId.value = venue.id;
      inputNombre.value = venue.nombre;
      inputTipo.value = venue.tipo;
      inputUbicacion.value = venue.ubicacion || "";
      inputPrecio.value = venue.precio || "";
      inputImagen.value = venue.imagen_url || "";
    } else {
      // Create Mode
      modalTitle.textContent = "Añadir Cancha";
      inputId.value = "";
      inputNombre.value = "";
      inputTipo.value = "";
      inputUbicacion.value = "";
      inputPrecio.value = "";
      inputImagen.value = "";
    }
    
    modal.classList.add("open");
  }

  /* Close the modal */
  function closeModal() {
    if (modal) modal.classList.remove("open");
  }

  /* Save (Create or Update) Venue */
  async function saveVenue() {
    // Validate
    const nombre = inputNombre.value.trim();
    const tipo = inputTipo.value;
    const ubicacion = inputUbicacion.value.trim();
    const precio = parseFloat(inputPrecio.value);
    const imagen_url = inputImagen.value.trim() || null;
    const id = inputId.value;

    if (!nombre || !tipo || isNaN(precio) || precio < 0) {
      modalError.textContent = "Por favor completa todos los campos obligatorios correctamente.";
      return;
    }

    modalError.textContent = "";
    modalBtnSave.disabled = true;
    modalBtnSave.textContent = "Guardando...";

    const payload = { nombre, tipo, ubicacion, precio, imagen_url };

    let result;
    if (id) {
      result = await window.VenuesService.updateEscenario(id, payload);
    } else {
      result = await window.VenuesService.insertEscenario(payload);
    }

    modalBtnSave.disabled = false;
    modalBtnSave.textContent = "Guardar Cancha";

    if (result.error) {
      console.error(result.error);
      modalError.textContent = "Error de base de datos: " + result.error.message;
      return;
    }

    App.showToast(id ? "Cancha actualizada exitosamente" : "Cancha creada exitosamente");
    closeModal();
    loadDashboardData();
  }

  /* Delete Venue */
  async function deleteVenue(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.")) {
      return;
    }

    const { error } = await window.VenuesService.deleteEscenario(id);
    if (error) {
      console.error(error);
      App.showToast("Error al eliminar la cancha", "error");
      return;
    }

    App.showToast("Cancha eliminada exitosamente");
    loadDashboardData();
  }

  return { init, openModal, closeModal, saveVenue, deleteVenue };
})();

// Expose to window for inline HTML handlers
window.AdminDashboard = AdminDashboard;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AdminDashboard.init();
});
